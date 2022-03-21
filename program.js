// CAS BACnet Stack NodeJS Example
// More information can be found here: https://github.com/chipkin/BACnetServerExampleNodeJS
// Start with the "function main()"
//
// Written by: Steven Smethurst
// Last updated: Oct 03, 2019
//

var CASBACnetStack = require('./CASBACnetStackAdapter'); // CAS BACnet stack
var database = require('./database.json'); // Example database of values.

var ffi = require('ffi-napi'); // DLL interface. https://github.com/node-ffi/node-ffi
var ref = require('ref-napi'); // DLL Data types. https://github.com/TooTallNate/ref
var dequeue = require('dequeue'); // Creates a FIFO buffer. https://github.com/lleo/node-dequeue/
const dgram = require('dgram'); // UDP server
const { truncate } = require('fs');

// Settings
const SETTING_BACNET_PORT = 47808; // Default BACnet IP UDP Port.

// Constants
const APPLICATION_VERSION = '1.1.0.0';

// Globals
var fifoSendBuffer = new dequeue();
var fifoRecvBuffer = new dequeue();
const server = dgram.createSocket('udp4');

// FFI types
var uint8Ptr = ref.refType('uint8 *');

// Message Callback Functions
var FuncPtrCallbackSendMessage = ffi.Callback('uint16', [uint8Ptr, 'uint16', uint8Ptr, 'uint8', 'uint8', 'bool'], CallbackSendMessage);
var FuncPtrCallbackReceiveMessage = ffi.Callback('uint16', [uint8Ptr, 'uint16', uint8Ptr, 'uint8', uint8Ptr, uint8Ptr], CallbackRecvMessage);

// System Callback Functions
var FuncPtrCallbackGetSystemTime = ffi.Callback('uint64', [], CallbackGetSystemTime);

// Get Property Callback Functions
var FuncPtrCallbackGetPropertyBitString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'bool*', 'uint32*', 'uint32', 'bool', 'uint32'], GetPropertyBitString);
var FuncPtrCallbackGetPropertyBool = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'bool*', 'bool', 'uint32'], GetPropertyBool);
var FuncPtrCallbackGetPropertyCharacterString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'char*', 'uint32*', 'uint32', 'uint8', 'bool', 'uint32'], GetPropertyCharacterString);
var FuncPtrCallbackGetPropertyDate = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint8*', 'uint8*', 'uint8*', 'bool', 'uint32'], GetPropertyDate);
var FuncPtrCallbackGetPropertyDouble = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'double*', 'bool', 'uint32'], GetPropertyDouble);
var FuncPtrCallbackGetPropertyEnumerated = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint32*', 'bool', 'uint32'], GetPropertyEnumerated);
var FuncPtrCallbackGetPropertyOctetString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint32*', 'uint32', 'uint8', 'bool', 'uint32'], GetPropertyOctetString);
var FuncPtrCallbackGetPropertyReal = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'float*', 'bool', 'uint32'], GetPropertyReal);
var FuncPtrCallbackGetPropertySignedInteger = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'int32*', 'bool', 'uint32'], GetPropertySignedInteger);
var FuncPtrCallbackGetPropertyTime = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint8*', 'uint8*', 'uint8*', 'bool', 'uint32'], GetPropertyTime);
var FuncPtrCallbackGetPropertyUnsignedInteger = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint32*', 'bool', 'uint32'], GetPropertyUnsignedInteger);

// Set Property Callback Functions
var FuncPtrCallbackSetPropertyBitString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'bool*', 'uint32', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyBitString);
var FuncPtrCallbackSetPropertyBool = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'bool', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyBool);
var FuncPtrCallbackSetPropertyCharacterString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint32', 'uint8', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyCharacterString);
var FuncPtrCallbackSetPropertyDate = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8', 'uint8', 'uint8', 'uint8', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyDate);
var FuncPtrCallbackSetPropertyDouble = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'double', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyDouble);
var FuncPtrCallbackSetPropertyEnumerated = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint32', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyEnumerated);
var FuncPtrCallbackSetPropertyNull = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyEnumerated);
var FuncPtrCallbackSetPropertyOctetString = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8*', 'uint32', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyOctetString);
var FuncPtrCallbackSetPropertyReal = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'float', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyReal);
var FuncPtrCallbackSetPropertySignedInteger = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'int32', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertySignedInteger);
var FuncPtrCallbackSetPropertyTime = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint8', 'uint8', 'uint8', 'uint8', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyTime);
var FuncPtrCallbackSetPropertyUnsignedInteger = ffi.Callback('bool', ['uint32', 'uint16', 'uint32', 'uint32', 'uint32', 'bool', 'uint32', 'uint8', 'uint32*'], SetPropertyUnsignedInteger);

// Other Callback Functions
var FuncPtrCallbackCreateObject = ffi.Callback('bool', ['uint32', 'uint16', 'uint32'], CreateObject);
var FuncPtrCallbackDeleteObject = ffi.Callback('bool', ['uint32', 'uint16', 'uint32'], DeleteObject);
var FuncPtrCallbackReinitializeDevice = ffi.Callback('bool', ['uint32', 'uint32', 'uint8*', 'uint32', 'uint32*'], ReinitializeDevice);
var FuncPtrCallbackDeviceCommunicationControl = ffi.Callback('bool', ['uint32', 'uint8', 'uint8*', 'uint8', 'bool', 'uint16', 'uint32*'], DeviceCommunicationControl);
var FuncPtrHookTextMessage = ffi.Callback('bool', ['uint32', 'bool', 'uint32', 'uint8*', 'uint32', 'uint8', 'uint8*', 'uint32', 'uint8*', 'uint8', 'uint8', 'uint16', 'uint8*', 'uint8', 'uint16*', 'uint16*'], HookTextMessage);
var FuncPtrHookLogDebugMessage = ffi.Callback('void', ['uint8*', 'uint16', 'uint8'], LogDebugMessage);

// This callback function is used when the CAS BACnet stack wants to send a message out onto the network.
function CallbackSendMessage(message, messageLength, connectionString, connectionStringLength, networkType, broadcast) {
    // Convert the connection string to a buffer.
    var newConnectionString = ref.reinterpret(connectionString, connectionStringLength, 0);
    var host = newConnectionString.readUInt8(0) + '.' + newConnectionString.readUInt8(1) + '.' + newConnectionString.readUInt8(2) + '.' + newConnectionString.readUInt8(3);
    var port = Number(newConnectionString.readUInt8(5)) * 255 + Number(newConnectionString.readUInt8(4));
    console.log('CallbackSendMessage. messageLength:', messageLength, ', host: ', host, ', port:', port);

    // copy the message to the sendBuffer.
    var newMessage = ref.reinterpret(message, messageLength, 0);
    sendBuffer = Buffer.alloc(messageLength);
    for (var offset = 0; offset < messageLength; ++offset) {
        sendBuffer.writeUInt8(newMessage[offset], offset);
    }

    // Send the message.
    server.send(sendBuffer, port, host, function (error) {
        if (error) {
            console.error('Error: Could not send message');
            server.close();
        } else {
            console.log('CallbackSendMessage. Length:', newMessage.length);
            return newMessage.length;
        }
    });

    // Error
    return 0;
}

// This callback fundtion is used when the CAS BACnet stack wants to check to see if there are any incomming messages
function CallbackRecvMessage(message, maxMessageLength, receivedConnectionString, maxConnectionStringLength, receivedConnectionStringLength, networkType) {
    // Check to see if there are any messages waiting on the buffer.
    if (fifoRecvBuffer.length > 0) {
        // There is at lest one message on the buffer.
        var msg = fifoRecvBuffer.shift();

        const recvedMessage = msg[0];

        console.log('\nCallbackRecvMessage Got message. Length:', msg[0].length, ', From:', msg[1], ', Message: ', msg[0].toString('hex'));

        if (msg[0].length > maxMessageLength) {
            console.error('Error: Message too large to fit into buffer on Recv. Dumping message. msg[0].length=', msg[0].length, ', maxMessageLength=', maxMessageLength);
            return 0;
        }

        // Received Connection String
        // --------------------------------------------------------------------

        console.log('maxConnectionStringLength:', maxConnectionStringLength);

        // Reinterpret the receivedConnectionString parameter with a the max buffer size.
        var newReceivedConnectionString = ref.reinterpret(receivedConnectionString, maxConnectionStringLength, 0);
        // ToDo:
        newReceivedConnectionString.writeUInt8(192, 0);
        newReceivedConnectionString.writeUInt8(168, 1);
        newReceivedConnectionString.writeUInt8(1, 2);
        newReceivedConnectionString.writeUInt8(26, 3);
        newReceivedConnectionString.writeUInt8(47808 % 255, 4);
        newReceivedConnectionString.writeUInt8(47808 / 255, 5);

        // Connection string length
        receivedConnectionStringLength.writeUInt8(6, 0);

        // Recved message
        // --------------------------------------------------------------------
        // Reinterpret the message parameter with a the max buffer size.
        var newMessage = ref.reinterpret(message, maxMessageLength, 0);
        for (var offset = 0; offset < recvedMessage.length; offset++) {
            newMessage.writeUInt8(recvedMessage[offset], offset);
        }

        return recvedMessage.length;
    }
    return 0;
}

// This callback is used to determin the current system time.
function CallbackGetSystemTime() {
    // https://stackoverflow.com/a/9456144/58456
    var d = new Date();
    return d.getTime() / 1000;
}

// Helper function to get a key name from an array by the value.
function HelperGetKeyByValue(object, value) {
    // https://www.geeksforgeeks.org/how-to-get-a-key-in-a-javascript-object-by-its-value/
    return Object.keys(object).find((key) => object[key] === value);
}

// This callback is used by the CAS BACnet stack to get a property of an object as a string.
// If the property is not defined then return false and the CAS BACnet stack will use a default value.
function GetPropertyBitString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyBool - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Check to see if we have defined this property in the database.
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE && typeof database[resultObjectType][objectInstance] !== 'undefined') {
        // The property has been defined.
        // Convert the property to the requested data type and return success
        bitValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        // Write bits into pointer
        for (let i = 0; i < maxElementCount && i < bitValue.length; i++) {
            ref.set(value, 0, bitValue[i]);
        }
        valueElementCount.writeInt32LE(maxElementCount < bitValue.length ? maxElementCount : bitValue.length);
        return true;
    }

    // Could not find the value in the database.
    console.log('Error: GetPropertyBitString failed');
    return false;
}

// This callback is used by the CAS BACnet stack to get a property of an object as a Boolean
// If the property is not defined then return false and the CAS BACnet stack will use a default value.
function GetPropertyBool(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyBool - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of Priority array Null handling
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY) {
        if (useArrayIndex) {
            if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_OUTPUT && typeof database[resultObjectType][objectInstance] !== 'undefined') {
                if (propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                    ref.set(value, 0, database[resultObjectType][objectInstance][priority_array_nulls][propertyArrayIndex - 1]);
                    return true;
                }
            } else if (objectType === CASBACnetStack.OBJECT_TYPE.BINARY_OUTPUT && typeof database[resultObjectType][objectInstance] !== 'undefined') {
                if (propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                    ref.set(value, 0, database[resultObjectType][objectInstance][priority_array_nulls][propertyArrayIndex - 1]);
                    return true;
                }
            } else if (objectType == CASBACnetStack.OBJECT_TYPE.MULTI_STATE_OUTPUT && typeof database[resultObjectType][objectInstance] !== 'undefined') {
                ref.set(value, 0, database[resultObjectType][objectInstance][priority_array_nulls][propertyArrayIndex - 1]);
                return true;
            }
        }
    }

    console.log('Error: GetPropertyBool failed');
    return false;
}

// This callback is used by the CAS BACnet stack to get a property of an object as a Character String.
// If the property is not defined then return false and the CAS BACnet stack will use a default value.
function GetPropertyCharacterString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, encodingType, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyCharacterString - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex, ', maxElementCount: ', maxElementCount, ', encodingType: ', encodingType);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of object Name property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.OBJECT_NAME) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            var newValue = ref.reinterpret(value, maxElementCount, 0);
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
    }

    // Example of Description property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.DESCRIPTION) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            var newValue = ref.reinterpret(value, maxElementCount, 0);
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
    }

    // Example of Character String Value object Present Value property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.CHARACTERSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            var newValue = ref.reinterpret(value, maxElementCount, 0);
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
    }

    // Example of Bit String Value object Bit Text property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.BITTEXT && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && useArrayIndex && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (propertyArrayIndex <= database[resultObjectType][objectInstance].present_value.length) {
                charValue = database[resultObjectType][objectInstance].bittext[propertyArrayIndex - 1];

                var newValue = ref.reinterpret(value, maxElementCount, 0);
                newValue.write(charValue, 0, 'utf8');
                valueElementCount.writeInt32LE(charValue.length, 0);
                return true;
            }
        }
    }

    // Example of Multi State Input object State Text property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.STATETEXT && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex && propertyArrayIndex > 0 && propertyArrayIndex <= database[resultObjectType][objectInstance].numberofstates) {
                // 0 is the number of states
                charValue = database[resultObjectType][objectInstance].statetext[propertyArrayIndex - 1];

                var newValue = ref.reinterpret(value, maxElementCount, 0);
                newValue.write(charValue, 0, 'utf8');
                valueElementCount.writeInt32LE(charValue.length, 0);
                return true;
            }
        }
    }

    // Could not find the value in the database.
    console.log('Error: GetPropertyCharacterString failed');
    return false;
}

function GetPropertyDate(deviceInstance, objectType, objectInstance, propertyIdentifier, year, month, day, weekday, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyDate - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Date Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATE_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            year.writeUInt8(database[resultObjectType][objectInstance].present_value.year, 0);
            month.writeUInt8(database[resultObjectType][objectInstance].present_value.month, 0);
            day.writeUInt8(database[resultObjectType][objectInstance].present_value.day, 0);
            weekday.writeUInt8(database[resultObjectType][objectInstance].present_value.weekday, 0);
            return true;
        }
    }

    // Example of getting Device Local Date property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.LOCAL_DATE && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            var adjustedDate = new Date(Date.now() - database[resultObjectType][objectInstance].current_time_offset);
            year.writeUInt8(adjustedDate.getFullYear(), 0);
            month.writeUInt8(adjustedDate.getMonth(), 0);
            day.writeUInt8(adjustedDate.getDate(), 0);
            weekday.writeUInt8(adjustedDate.getDay(), 0);
            return true;
        }
    }

    // Example of getting DateTime Value object Present Value property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATETIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            year.writeUInt8(database[resultObjectType][objectInstance].present_value.year, 0);
            month.writeUInt8(database[resultObjectType][objectInstance].present_value.month, 0);
            day.writeUInt8(database[resultObjectType][objectInstance].present_value.day, 0);
            weekday.writeUInt8(database[resultObjectType][objectInstance].present_value.weekday, 0);
            return true;
        }
    }

    console.log('Error: GetPropertyDate failed');
    return false;
}

function GetPropertyDouble(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyDouble - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);
    // Example of Large Analog value object PResent Value Property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.LARGE_ANALOG_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            value.writeDoubleLE(database[resultObjectType][objectInstance].present_value, 0);
            return true;
        }
    }

    console.log('Error: GetPropertyDouble failed');
    return false;
}

function GetPropertyEnumerated(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyEnumerated - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Check to see if we have defined this property in the database.

    // Example of Binary Input / Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            ref.set(value, 0, database[resultObjectType][objectInstance].present_value);
            return true;
        }
    } else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            ref.set(value, 0, database[resultObjectType][objectInstance].present_value);
            return true;
        }
    }

    // Example of Binary Output object Priority Array property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex) {
                if (propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                    ref.set(value, 0, database[resultObjectType][objectInstance].priority_array_values[propertyArrayIndex - 1]);
                    return true;
                }
            }
        }
    }

    // Example of Analog Input object Reliability property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.RELIABILITY && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            value.writeUInt32LE(database[resultObjectType][objectInstance].reliability, 0);
            return true;
        }
    }

    // Example of Network Port object FdBbmdAddress Host Type property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            value.writeUInt8(database[resultObjectType][objectInstance].fdbbmdaddress_host_type, 0);
            return true;
        }
    }

    // Debug for customer
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.SYSTEMSTATUS && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        console.log('DEBUG: Device:System Status');
        value.writeUInt32LE(database[resultObjectType][objectInstance].systemstatus, 0);
        return true;
    }

    // Example of Units property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.UNITS)
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            // The units could be represented as either a string or a number. If its a string then we need to
            // convert the string to the enumerated vlaue.
            if (resultPropertyIdentifier == 'units' && typeof valueToWrite !== 'number') {
                // This is a string repersentation of the units. Decode the string into a enumerated value.
                if (valueToWrite.toUpperCase() in CASBACnetStack.ENGINEERING_UNITS) {
                    // Update the string to use the value instead.
                    valueToWrite = CASBACnetStack.ENGINEERING_UNITS[valueToWrite.toUpperCase()];
                } else {
                    console.log('Error: Unknown unit string. can not convert to enumerated value. value:', valueToWrite);
                    return false;
                }
            }
            ref.set(value, 0, valueToWrite);
            return true;
        }

    console.log('Error: GetPropertyEnumerated failed');
    return false;
}

function GetPropertyOctetString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, encodingType, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyOctetString - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of Octet String Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.OCTETSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
            if (database[resultObjectType][objectInstance].present_value.length > maxElementCount) {
                console.log('Error: Octet String length exceeds maxElementCount');
                return false;
            }
            else {
                octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];

                for (let i = 0; i < octetString.length; i++) {
                    value.writeUInt8(octetString[i], i);
                }
                valueElementCount.writeUInt32LE(octetString.length, 0);
                return true;
            }
        }
    }

    // Example of Network Port object IP Address property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            for (let i = 0; i < octetString.length; i++) {
                value.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    // Example of Network Port object IP Default Gateway property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPDEFAULTGATEWAY && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            for (let i = 0; i < octetString.length; i++) {
                value.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    // Example of Network Port object IP Subnet Mask property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPSUBNETMASK && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];

            for (let i = 0; i < octetString.length; i++) {
                value.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    // Example of Network Port object IP DNS Server property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPDNSSERVER && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex && propertyArrayIndex != 0 && propertyArrayIndex <= database[resultObjectType][objectInstance].ipdnsserver.length) {
                octetString = database[resultObjectType][objectInstance].ipdnsserver[propertyArrayIndex - 1];

                for (let i = 0; i < octetString.length; i++) {
                    value.writeUInt8(octetString[i], i);
                }
                valueElementCount.writeUInt32LE(octetString.length, 0);
                return true;
            }
        }
    }

    // Example of Network Port object FdBbmdAddress Host (as IP Address)
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            octetString = database[resultObjectType][objectInstance].fdbbmdaddress_host_ip;

                for (let i = 0; i < octetString.length; i++) {
                    value.writeUInt8(octetString[i], i);
                }
                valueElementCount.writeUInt32LE(octetString.length, 0);
                return true;
        }
    }

    console.log('Error: GetPropertyOctetString failed');
    return false;
}

function GetPropertyReal(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyReal - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of Analog Output object Priority Array property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY && objectType === CASBACnetStack.objectType.ANALOG_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex && propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                value.writeFloatLE(database[resultObjectType][objectInstance].priority_array_values[propertyArrayIndex - 1], 0);
                return true;
            }
        }
    }

    // Example to handle all other properties all at once without explicit checking for each type
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined.
        // Convert the property to the requested data type and return success.
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        ref.set(value, 0, valueToWrite);
        return true;
    }
    
    console.log('Error: GetPropertyReal failed')
    return false;
}

function GetPropertySignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertySignedInteger - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);
    
    // Example to handle all other properties all at once without explicit checking for each type
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined.
        // Convert the property to the requested data type and return success.
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        ref.set(value, 0, valueToWrite);
        return true;
    }

    console.log('Error: GetPropertySignedInteger failed')
    return false;
}

function GetPropertyTime(deviceInstance, objectType, objectInstance, propertyIdentifier, hour, minute, second, hundrethSeconds, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyTime - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of Time Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.TIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            hour.writeUInt8(database[resultObjectType][objectInstance].present_value.hour, 0);
            minute.writeUInt8(database[resultObjectType][objectInstance].present_value.minute, 0);
            second.writeUInt8(database[resultObjectType][objectInstance].present_value.second, 0);
            hundrethSeconds.writeUInt8(database[resultObjectType][objectInstance].present_value.hundrethSeconds, 0);
            return true;
        }
    }

    // Example of Device object Local Time property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.LOCAL_TIME && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            var adjustedTime = new Date(Date.now() - database[resultObjectType][objectInstance].current_time_offset);
            hour.writeUInt8(adjustedTime.getHours(), 0);
            minute.writeUInt8(adjustedTime.getMinutes(), 0);
            second.writeUInt8(adjustedTime.getSeconds(), 0);
            hundrethSeconds.writeUInt8(0, 0);
            return true;
        }
    }

    // Example of DateTime Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATETIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            hour.writeUInt8(database[resultObjectType][objectInstance].present_value.hour, 0);
            minute.writeUInt8(database[resultObjectType][objectInstance].present_value.minute, 0);
            second.writeUInt8(database[resultObjectType][objectInstance].present_value.second, 0);
            hundrethSeconds.writeUInt8(database[resultObjectType][objectInstance].present_value.hundrethSeconds, 0);
            return true;
        }
    }

    console.log('Error: GetPropertyTime failed')
    return false;
}

function GetPropertyUnsignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    console.log('GetPropertyUnsignedInteger - deviceInstance: ', deviceInstance, ', objectType: ', objectType, ', objectInstance: ', objectInstance, ', propertyIdentifier: ', propertyIdentifier, ', useArrayIndex: ', useArrayIndex, ', propertyArrayIndex: ', propertyArrayIndex);
    
    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();


    // Example of Multi-State Output object Priority Array property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex && propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                value.writeUInt32LE(database[resultObjectType][objectInstance].priority_array_values[propertyArrayIndex - 1], 0);
                return true;
            }
        }
    }

    // Example of Network Port object IP DNS Server Array Size property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPDNSSERVER && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex && propertyArrayIndex === 0) {
            value.writeUInt32LE(database[resultObjectType][objectInstance].ipdnsserver.length, 0);
            return true;
        }}
    }

    // Example of Bit String Value object Bit Text Array Size property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.BITTEXT && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            if (useArrayIndex && propertyArrayIndex === 0) {
                value.writeUInt32LE(database[resultObjectType][objectInstance].bittext.length, 0);
                return true;
            }
        }
        
    }

    // Example of Network Port object FdBbmdAddress Port property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (useArrayIndex && propertyArrayIndex === CASBACnetStack.CONSTANTS.FD_BBMD_ADDRESS_PORT) {
            if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
                value.writeUInt32LE(database[resultObjectType][objectInstance].fdbbmdaddress_port, 0);
                return true;
            }
            
        }
    }

    // NOTE: DOUBLE CHECK WITH SPEC
    // Example of Multi-State Input object State Text property (return numberOfStates when State Text property is requested in GetPropertyUnsignedInt())
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.STATETEXT && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance] !== 'undefined') {
            value.writeUInt32LE(database[resultObjectType][objectInstance].numberofstates, 0);
            return true;
        }
    }

    // Example to handle all other properties all at once without explicit checking for each type
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined.
        // Convert the property to the requested data type and return success.
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        ref.set(value, 0, valueToWrite);
        return true;
    }

    console.log('Error: GetPropertyUnsignedInteger failed');
    return false;
}

function main() {
    // Print version information
    // ------------------------------------------------------------------------
    console.log('BACnet Server Example NodeJS');
    console.log('https://github.com/chipkin/BACnetServerExampleNodeJS');

    console.log('GetLibaryPath:', CASBACnetStack.GetLibaryPath());
    console.log('Application Version:', APPLICATION_VERSION + ', BACnetStack_Version: ' + CASBACnetStack.stack.BACnetStack_GetAPIMajorVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIMinorVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIPatchVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIBuildVersion() + ', BACnetStackAdapter_Version:', CASBACnetStack.GetAdapterVersion());
    console.log('');

    // Setup the callback functions
    // ------------------------------------------------------------------------
    console.log('FYI: Setting up callback functions...');
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSendMessage(FuncPtrCallbackSendMessage);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackReceiveMessage(FuncPtrCallbackReceiveMessage);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetSystemTime(FuncPtrCallbackGetSystemTime);

    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyCharacterString(FuncPtrCallbackGetPropertyCharacterString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyReal(FuncPtrCallbackGetPropertyReal);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyBool(FuncPtrCallbackGetPropertyBool);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyEnumerated(FuncPtrCallbackGetPropertyEnumerated);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyDate(FuncPtrCallbackGetPropertyDate);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyDouble(FuncPtrCallbackGetPropertyDouble);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyOctetString(FuncPtrCallbackGetPropertyOctetString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertySignedInteger(FuncPtrCallbackGetPropertySignedInteger);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyTime(FuncPtrCallbackGetPropertyTime);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyUnsignedInteger(FuncPtrCallbackGetPropertyUnsignedInteger);

    // Setup the BACnet device.
    // ------------------------------------------------------------------------
    var DEVICE_INSTANCE = Object.keys(database['device'])[0];
    console.log('FYI: Setting up BACnet device...');
    console.log('FYI: BACnet device instance:', DEVICE_INSTANCE);
    CASBACnetStack.stack.BACnetStack_AddDevice(DEVICE_INSTANCE);

    // Loop thought the database adding the objects as they are found.
    for (var objectTypeKey in database) {
        // Decode the string repseration of the object type as a enumeration.
        if (!objectTypeKey.toUpperCase() in CASBACnetStack.OBJECT_TYPE) {
            console.log('Error: Unknown object type found. object type:', objectTypeKey);
            continue;
        }
        var objectTypeEnum = CASBACnetStack.OBJECT_TYPE[objectTypeKey.toUpperCase()];
        if (objectTypeEnum === CASBACnetStack.OBJECT_TYPE.device) {
            continue; // The device has already been added.
        }

        // Loop thought the ObjectInstance for this object type.
        for (var objectInstance in database[objectTypeKey]) {
            console.log('FYI: Adding object. objectType:', objectTypeKey, '(' + objectTypeEnum + '), objectInstance:', objectInstance);
            CASBACnetStack.stack.BACnetStack_AddObject(DEVICE_INSTANCE, objectTypeEnum, objectInstance);
        }
    }

    // Note: A object can be manually added as well
    // CASBACnetStack.stack.BACnetStack_AddObject(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, 0)

    // Set up the BACnet services
    // By default only the required servics are enabled.
    CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.READ_PROPERTY_MULTIPLE, true);

    // Setup the UDP socket
    // ------------------------------------------------------------------------
    console.log('FYI: Setting up BACnet UDP port. Port:', SETTING_BACNET_PORT);

    server.on('error', (err) => {
        console.error(`Error: UDP.Server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        // console.log(`FYI: UDP.Server message. From: ${rinfo.address}:${rinfo.port}, Message:`, msg);

        fifoRecvBuffer.push([msg, rinfo.address + ':' + rinfo.port]);
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`FYI: UDP.Server listening ${address.address}:${address.port}`);
    });
    server.on('exit', () => {
        console.log(`FYI: UDP.Server Exit`);
        FuncPtrCallbackSendMessage;
        FuncPtrCallbackReceiveMessage;
        FuncPtrCallbackGetSystemTime;
    });

    server.bind(SETTING_BACNET_PORT);

    // Main program loop
    // ------------------------------------------------------------------------
    console.log('FYI: Starting main program loop... ');
    setInterval(() => {
        CASBACnetStack.stack.BACnetStack_Loop();
        // process.stdout.write(".");
    }, 100);
}

// Start the application.
// ------------------------------------------------------------------------
main();
