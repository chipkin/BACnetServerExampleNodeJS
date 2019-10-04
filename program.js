// CAS BACnet Stack NodeJS Example
// More information can be found here: https://github.com/chipkin/BACnetServerExampleNodeJS
// Start with the "function main()"
// 
// Written by: Steven Smethurst
// Last updated: Oct 03, 2019 
//

var CASBACnetStack = require('./CASBACnetStackAdapter'); // CAS BACnet stack 
var database = require('./database.json'); // Example database of values. 

var ffi = require('ffi'); // DLL interface. https://github.com/node-ffi/node-ffi 
var ref = require('ref'); // DLL Data types. https://github.com/TooTallNate/ref 
var dequeue = require('dequeue'); // Creates a FIFO buffer. https://github.com/lleo/node-dequeue/
const dgram = require('dgram'); // UDP server 

// Settings 
const SETTING_BACNET_PORT = 47808 // Default BACnet IP UDP Port. 

// Constants 
const APPLICATION_VERSION = "1.0.0.0"

// Globals 
var fifoSendBuffer = new dequeue()
var fifoRecvBuffer = new dequeue()
const server = dgram.createSocket('udp4');

// FFI types 
var uint8Ptr = ref.refType('uint8 *');

// Callback functions 
var FuncPtrCallbackSendMessage = ffi.Callback('uint16', [uint8Ptr, 'uint16', uint8Ptr, 'uint8', 'uint8', 'bool'], CallbackSendMessage)
var FuncPtrCallbackReceiveMessage = ffi.Callback('uint16', [uint8Ptr, 'uint16', uint8Ptr, 'uint8', uint8Ptr, uint8Ptr], CallbackRecvMessage)
var FuncPtrCallbackGetSystemTime = ffi.Callback('uint64', [], CallbackGetSystemTime)

// Callbacks GetProperty
var FuncPtrCallbackGetPropertyCharacterString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'char*', 'uint32*', 'uint32', 'uint8', 'bool', 'uint32'], GetPropertyCharacterString)
var FuncPtrCallbackGetPropertyReal = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'float*', 'bool', 'uint32'], GetPropertyReal)
var FuncPtrCallbackGetPropertyBool = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'bool*', 'bool', 'uint32'], GetPropertyBool)
var FuncPtrCallbackGetPropertyEnumerated = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint32*', 'bool', 'uint32'], GetPropertyEnumerated)
var FuncPtrCallbackGetPropertyDate = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint8*', 'uint8*', 'uint8*', 'bool', 'uint32'], GetPropertyDate)
var FuncPtrCallbackGetPropertyDouble = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'double*', 'bool', 'uint32'], GetPropertyDouble)
var FuncPtrCallbackGetPropertyOctetString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint32*', 'uint32', 'uint8', 'bool', 'uint32'], GetPropertyOctetString)
var FuncPtrCallbackGetPropertySignedInteger = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'int32*', 'bool', 'uint32'], GetPropertySignedInteger)
var FuncPtrCallbackGetPropertyTime = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint8*', 'uint8*', 'uint8*', 'bool', 'uint32'], GetPropertyTime)
var FuncPtrCallbackGetPropertyUnsignedInteger = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint32*', 'bool', 'uint32'], GetPropertyUnsignedInteger)


// This callback fundtion is used when the CAS BACnet stack wants to send a message out onto the network. 
function CallbackSendMessage(message, messageLength, connectionString, connectionStringLength, networkType, broadcast) {

    // Convert the connection string to a buffer.
    var newConnectionString = ref.reinterpret(connectionString, connectionStringLength, 0)
    var host = newConnectionString.readUInt8(0) + "." + newConnectionString.readUInt8(1) + "." + newConnectionString.readUInt8(2) + "." + newConnectionString.readUInt8(3);
    var port = Number(newConnectionString.readUInt8(5)) * 255 + Number(newConnectionString.readUInt8(4));
    console.log('CallbackSendMessage. messageLength:', messageLength, ", host: ", host, ", port:", port)

    // copy the message to the sendBuffer. 
    var newMessage = ref.reinterpret(message, messageLength, 0)
    sendBuffer = Buffer.alloc(messageLength);
    for (var offset = 0; offset < messageLength; ++offset) {
        sendBuffer.writeUInt8(newMessage[offset], offset);
    }

    // Send the message. 
    server.send(sendBuffer, port, host, function (error) {
        if (error) {
            console.error("Error: Could not send message")
            server.close();
        } else {
            console.log('CallbackSendMessage. Length:', newMessage.length);
            return newMessage.length;
        }
    });

    // Error 
    return 0
}

// This callback fundtion is used when the CAS BACnet stack wants to check to see if there are any incomming messages 
function CallbackRecvMessage(message, maxMessageLength, receivedConnectionString, maxConnectionStringLength, receivedConnectionStringLength, networkType) {

    // Check to see if there are any messages waiting on the buffer. 
    if (fifoRecvBuffer.length > 0) {
        // There is at lest one message on the buffer. 
        var msg = fifoRecvBuffer.shift();

        const recvedMessage = msg[0];

        console.log("\nCallbackRecvMessage Got message. Length:", msg[0].length, ", From:", msg[1], ", Message: ", msg[0].toString('hex'))

        if (msg[0].length > maxMessageLength) {
            console.error("Error: Message too large to fit into buffer on Recv. Dumping message. msg[0].length=", msg[0].length, ", maxMessageLength=", maxMessageLength)
            return 0
        }

        // Received Connection String
        // --------------------------------------------------------------------

        console.log("maxConnectionStringLength:", maxConnectionStringLength)

        // Reinterpret the receivedConnectionString parameter with a the max buffer size. 
        var newReceivedConnectionString = ref.reinterpret(receivedConnectionString, maxConnectionStringLength, 0)
        // ToDo: 
        newReceivedConnectionString.writeUInt8(192, 0);
        newReceivedConnectionString.writeUInt8(168, 1);
        newReceivedConnectionString.writeUInt8(1, 2);
        newReceivedConnectionString.writeUInt8(26, 3);
        newReceivedConnectionString.writeUInt8(47808 % 255, 4);
        newReceivedConnectionString.writeUInt8(47808 / 255, 5);

        // Connection string length 
        receivedConnectionStringLength.writeUInt8(6, 0)

        // Recved message
        // --------------------------------------------------------------------
        // Reinterpret the message parameter with a the max buffer size. 
        var newMessage = ref.reinterpret(message, maxMessageLength, 0)
        for (var offset = 0; offset < recvedMessage.length; offset++) {
            newMessage.writeUInt8(recvedMessage[offset], offset)
        }

        return recvedMessage.length
    }
    return 0
}

// This callback is used to determin the current system time. 
function CallbackGetSystemTime() {
    // https://stackoverflow.com/a/9456144/58456
    var d = new Date()
    return d.getTime() / 1000
}



// Helper function to get a key name from an array by the value.
function HelperGetKeyByValue(object, value) {
    // https://www.geeksforgeeks.org/how-to-get-a-key-in-a-javascript-object-by-its-value/
    return Object.keys(object).find(key => object[key] === value);
}


// This callback is used by the CAS BACnet stack to get a property of an object as a string. 
// If the property is not defined then return false and the CAS BACnet stack will use a default value. 
function GetPropertyCharacterString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, encodingType, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyCharacterString - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex, ", maxElementCount: ", maxElementCount, ", encodingType: ", encodingType)

    // Convert the enumerated values to human readable strings. 
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase()
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase()

    // Check to see if we have defined this property in the database. 
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined. 
        // Convert the property to the requested data type and return success. 
        charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        var newValue = ref.reinterpret(value, maxElementCount, 0)
        newValue.write(charValue, 0, 'utf8')
        valueElementCount.writeInt32LE(charValue.length, 0)
        return true
    }

    // Could not find the value in the database. 
    return false

}

function GetPropertyReal(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyReal - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)

    // Convert the enumerated values to human readable strings. 
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase()
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase()

    // Check to see if we have defined this property in the database. 
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined. 
        // Convert the property to the requested data type and return success. 
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier]

        ref.set(value, 0, valueToWrite)
        return true
    }
    return false
}

function GetPropertyBool(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyBool - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}

function GetPropertyEnumerated(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyEnumerated - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)

    // Convert the enumerated values to human readable strings. 
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase()
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase()

    // Check to see if we have defined this property in the database. 
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined. 
        // Convert the property to the requested data type and return success. 
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier]

        // The units could be represented as either a string or a number. If its a string then we need to 
        // convert the string to the enumerated vlaue. 
        if (resultPropertyIdentifier == "units" && typeof valueToWrite !== "number") {
            // This is a string repersentation of the units. Decode the string into a enumerated value. 
            if (valueToWrite.toUpperCase() in CASBACnetStack.ENGINEERING_UNITS) {
                // Update the string to use the value instead. 
                valueToWrite = CASBACnetStack.ENGINEERING_UNITS[valueToWrite.toUpperCase()]
            } else {
                console.log("Error: Unknown unit string. can not convert to enumerated value. value:", valueToWrite)
                return false;
            }
        }

        ref.set(value, 0, valueToWrite)
        return true
    }

    return false
}

function GetPropertyDate(deviceInstance, objectType, objectInstance, propertyIdentifier, year, month, day, weekday, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyDate - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}

function GetPropertyDouble(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyDouble - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}

function GetPropertyOctetString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, encodingType, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyOctetString - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}

function GetPropertySignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertySignedInteger - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}

function GetPropertyTime(deviceInstance, objectType, objectInstance, propertyIdentifier, hour, minute, second, hundrethSeconds, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyTime - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}

function GetPropertyUnsignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log("GetPropertyUnsignedInteger - deviceInstance: ", deviceInstance, ", objectType: ", objectType, ", objectInstance: ", objectInstance, ", propertyIdentifier: ", propertyIdentifier, ", useArrayIndex: ", useArrayIndex, ", propertyArrayIndex: ", propertyArrayIndex)
    return false
}



function main() {

    // Print version information 
    // ------------------------------------------------------------------------
    console.log("BACnet Server Example NodeJS")
    console.log("https://github.com/chipkin/BACnetServerExampleNodeJS")

    console.log("GetLibaryPath:", CASBACnetStack.GetLibaryPath());
    console.log("Application Version:", APPLICATION_VERSION + ", BACnetStack_Version: " + CASBACnetStack.stack.BACnetStack_GetAPIMajorVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIMinorVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIPatchVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIBuildVersion() + ", BACnetStackAdapter_Version:", CASBACnetStack.GetAdapterVersion())
    console.log("");

    // Setup the callback functions 
    // ------------------------------------------------------------------------
    console.log("FYI: Setting up callback functions...");
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSendMessage(FuncPtrCallbackSendMessage)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackReceiveMessage(FuncPtrCallbackReceiveMessage)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetSystemTime(FuncPtrCallbackGetSystemTime)

    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyCharacterString(FuncPtrCallbackGetPropertyCharacterString)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyReal(FuncPtrCallbackGetPropertyReal)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyBool(FuncPtrCallbackGetPropertyBool)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyEnumerated(FuncPtrCallbackGetPropertyEnumerated)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyDate(FuncPtrCallbackGetPropertyDate)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyDouble(FuncPtrCallbackGetPropertyDouble)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyOctetString(FuncPtrCallbackGetPropertyOctetString)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertySignedInteger(FuncPtrCallbackGetPropertySignedInteger)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyTime(FuncPtrCallbackGetPropertyTime)
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyUnsignedInteger(FuncPtrCallbackGetPropertyUnsignedInteger)

    // Setup the BACnet device. 
    // ------------------------------------------------------------------------
    var DEVICE_INSTANCE = Object.keys(database["device"])[0];
    console.log("FYI: Setting up BACnet device...");
    console.log("FYI: BACnet device instance:", DEVICE_INSTANCE);
    CASBACnetStack.stack.BACnetStack_AddDevice(DEVICE_INSTANCE)

    // Loop thought the database adding the objects as they are found. 
    for (var objectTypeKey in database) {
        // Decode the string repseration of the object type as a enumeration. 
        if (!objectTypeKey.toUpperCase() in CASBACnetStack.OBJECT_TYPE) {
            console.log("Error: Unknown object type found. object type:", objectTypeKey)
            continue;
        }
        var objectTypeEnum = CASBACnetStack.OBJECT_TYPE[objectTypeKey.toUpperCase()];
        if (objectTypeEnum === CASBACnetStack.OBJECT_TYPE.device) {
            continue; // The device has already been added. 
        }

        // Loop thought the ObjectInstance for this object type. 
        for (var objectInstance in database[objectTypeKey]) {
            console.log("FYI: Adding object. objectType:", objectTypeKey, "(" + objectTypeEnum + "), objectInstance:", objectInstance)
            CASBACnetStack.stack.BACnetStack_AddObject(DEVICE_INSTANCE, objectTypeEnum, objectInstance)
        }
    }

    // Note: A object can be manually added as well 
    // CASBACnetStack.stack.BACnetStack_AddObject(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, 0)

    // Set up the BACnet services 
    // By default only the required servics are enabled. 
    CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.READ_PROPERTY_MULTIPLE, true)

    // Setup the UDP socket 
    // ------------------------------------------------------------------------
    console.log("FYI: Setting up BACnet UDP port. Port:", SETTING_BACNET_PORT);

    server.on('error', (err) => {
        console.error(`Error: UDP.Server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        // console.log(`FYI: UDP.Server message. From: ${rinfo.address}:${rinfo.port}, Message:`, msg);

        fifoRecvBuffer.push([msg, rinfo.address + ":" + rinfo.port])
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`FYI: UDP.Server listening ${address.address}:${address.port}`);
    });
    server.on('exit', () => {
        console.log(`FYI: UDP.Server Exit`);
        FuncPtrCallbackSendMessage
        FuncPtrCallbackReceiveMessage
        FuncPtrCallbackGetSystemTime
    })

    server.bind(SETTING_BACNET_PORT);

    // Main program loop 
    // ------------------------------------------------------------------------
    console.log("FYI: Starting main program loop... ");
    setInterval(() => {
        CASBACnetStack.stack.BACnetStack_Loop()
        // process.stdout.write(".");
    }, 100);
}

// Start the application. 
// ------------------------------------------------------------------------
main();
