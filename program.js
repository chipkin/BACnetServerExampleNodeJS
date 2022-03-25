// CAS BACnet Stack NodeJS Example
// More information can be found here: https://github.com/chipkin/BACnetServerExampleNodeJS
// Start with the "function main()"
//
// Written by: Steven Smethurst
// Last updated: Mar 24, 2022
//

var CASBACnetStack = require('./CASBACnetStackAdapter'); // CAS BACnet stack
var database = require('./database.json'); // Example database of values.

var ffi = require('ffi-napi'); // DLL interface. https://github.com/node-ffi/node-ffi
var ref = require('ref-napi'); // DLL Data types. https://github.com/TooTallNate/ref
var dequeue = require('dequeue'); // Creates a FIFO buffer. https://github.com/lleo/node-dequeue/
const dgram = require('dgram'); // UDP server
const os = require('os'); // Retrieve network info
var defaultGatewayLib = require('default-gateway'); // Retrieve network info
const { truncate } = require('fs');
const { privateDecrypt } = require('crypto');
const { rejects } = require('assert');

// Logger
const loggerObj = require('./logging');
const { data } = require('./logging');
const { debug } = require('console');
const { defaultMaxListeners } = require('events');
const logger = loggerObj.child({ label: 'BACnetServerNodeJSExample' });

// Settings
const SETTING_BACNET_PORT = 47808; // Default BACnet IP UDP Port.
const SETTING_DEFAULT_GATEWAY = []; // Set Default Gateway to use for BACnet, set to [] to discover
const SETTING_IP_ADDRESS = []; // Set IP Address to use for BACnet, set to [] to discover
const SETTING_SUBNET_MASK = []; // Set Subnet Mask to use for BACnet, set to [] to discover

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
var FuncPtrCallbackLogDebugMessage = ffi.Callback('void', ['uint8*', 'uint16', 'uint8'], LogDebugMessage);

// Helper Functions
function CreateStringFromCharPointer(charPointer, length) {
    let messageToRead = ref.reinterpret(charPointer, length, 0);
    let workingString = '';
    for (let offset = 0; offset < length; offset++) {
        workingString += String.fromCharCode(messageToRead.readUInt8(offset));
    }
    return workingString;
}

// This callback function is used when the CAS BACnet stack wants to send a message out onto the network.
function CallbackSendMessage(message, messageLength, connectionString, connectionStringLength, networkType, broadcast) {
    // Convert the connection string to a buffer.
    var newConnectionString = ref.reinterpret(connectionString, connectionStringLength, 0);
    var host = newConnectionString.readUInt8(0) + '.' + newConnectionString.readUInt8(1) + '.' + newConnectionString.readUInt8(2) + '.' + newConnectionString.readUInt8(3);
    var port = newConnectionString.readUInt8(4) * 256 + newConnectionString.readUInt8(5);
    logger.debug('CallbackSendMessage. messageLength: ' + messageLength + ', host: ' + host + ', port:' + port);

    // copy the message to the sendBuffer.
    var newMessage = ref.reinterpret(message, messageLength, 0);
    sendBuffer = Buffer.alloc(messageLength);
    for (var offset = 0; offset < messageLength; ++offset) {
        sendBuffer.writeUInt8(newMessage[offset], offset);
    }
    if (port <= 0 || port >= 65536) {
        logger.error('Failed to CallbackSendMessage');
        return 0;
    }

    // Send the message.
    server.send(sendBuffer, port, host, function (error) {
        if (error) {
            logger.error('Error: Could not send message');
            server.close();
        } else {
            logger.debug('CallbackSendMessage. Length: ' + newMessage.length);
            return newMessage.length;
        }
    });

    // TODO: server.send is async, for now we trigger unelegant error-out if an error occurs when server is trying to send
    return newMessage.length;
}

// This callback fundtion is used when the CAS BACnet stack wants to check to see if there are any incomming messages
function CallbackRecvMessage(message, maxMessageLength, receivedConnectionString, maxConnectionStringLength, receivedConnectionStringLength, networkType) {
    // Check to see if there are any messages waiting on the buffer.
    if (fifoRecvBuffer.length > 0) {
        // There is at lest one message on the buffer.
        var msg = fifoRecvBuffer.shift();

        const recvedMessage = msg[0];

        logger.debug('\nCallbackRecvMessage Got message. Length: ' + msg[0].length + ', From:' + msg[1] + ', Message: ' + msg[0].toString('hex'));

        if (msg[0].length > maxMessageLength) {
            logger.error('Error: Message too large to fit into buffer on Recv. Dumping message. msg[0].length=' + msg[0].length + ', maxMessageLength=' + maxMessageLength);
            return 0;
        }

        // Received Connection String
        // --------------------------------------------------------------------
        logger.debug('maxConnectionStringLength:' + maxConnectionStringLength);

        // Extract address and port
        var receivedAddress = msg[1].substring(0, msg[1].indexOf(':')).split('.').map(Number);
        var receivedPort = parseInt(msg[1].substring(msg[1].indexOf(':') + 1));

        // Reinterpret the receivedConnectionString parameter with a the max buffer size.
        var newReceivedConnectionString = ref.reinterpret(receivedConnectionString, maxConnectionStringLength, 0);
        newReceivedConnectionString.writeUInt8(receivedAddress[0], 0);
        newReceivedConnectionString.writeUInt8(receivedAddress[1], 1);
        newReceivedConnectionString.writeUInt8(receivedAddress[2], 2);
        newReceivedConnectionString.writeUInt8(receivedAddress[3], 3);
        newReceivedConnectionString.writeUInt8(receivedPort / 256, 4);
        newReceivedConnectionString.writeUInt8(receivedPort % 256, 5);

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
    logger.debug('GetPropertyBitString - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Check to see if we have defined this property in the database.
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE) {
        // The property has been defined.
        // Convert the property to the requested data type and return success
        bitValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        // Write bits into pointer
        var newValue = ref.reinterpret(value, bitValue.length, 0);
        for (let i = 0; i < maxElementCount && i < bitValue.length; i++) {
            newValue.writeUint8(bitValue[i], i);
        }
        valueElementCount.writeInt32LE(maxElementCount < bitValue.length ? maxElementCount : bitValue.length);
        return true;
    }

    // Could not find the value in the database.
    logger.error('GetPropertyBitString failed');
    return false;
}

// Get Property callbacks
// These callbacks is used by the CAS BACnet stack to get a property of an object
// If the property is not defined then return false and the CAS BACnet stack will use a default value.

function GetPropertyBool(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyBool - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Priority array Null handling
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY) {
        if (useArrayIndex && propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
            if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_OUTPUT) {
                ref.set(value, 0, database[resultObjectType][objectInstance]['priority_array_nulls'][propertyArrayIndex - 1]);
                return true;
            } else if (objectType === CASBACnetStack.OBJECT_TYPE.BINARY_OUTPUT) {
                ref.set(value, 0, database[resultObjectType][objectInstance]['priority_array_nulls'][propertyArrayIndex - 1]);
                return true;
            } else if (objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_OUTPUT) {
                ref.set(value, 0, database[resultObjectType][objectInstance]['priority_array_nulls'][propertyArrayIndex - 1]);
                return true;
            }
        }
    }

    logger.error('GetPropertyBool failed');
    return false;
}

function GetPropertyCharacterString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, encodingType, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyCharacterString - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', maxElementCount: ' + maxElementCount + ', encodingType: ' + encodingType);

    var newValue = ref.reinterpret(value, maxElementCount, 0);

    // Check for Analog Input object Proprietary Properties
    if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT && propertyIdentifier > 512 && propertyIdentifier <= 512 + 3 && typeof database['analog_input'][objectInstance] !== 'undefined') {
        newValue.write('Example custom property 512 + ' + (propertyIdentifier - 512).toString(), 0, 'utf8');
        valueElementCount.writeInt32LE('Example custom property 512 + 1'.length, 0);
        return true;
    }

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting object Name property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.OBJECT_NAME) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
        // Check for created Analog Value objects
        else if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE && typeof database['created_analog_value'][objectInstance] !== 'undefined') {
            charValue = database['created_analog_value'][objectInstance][resultPropertyIdentifier];
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
    }

    // Example of getting Description property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.DESCRIPTION) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
    }

    // Example of getting Character String Value object Present Value property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.CHARACTERSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            // The property has been defined.
            // Convert the property to the requested data type and return success.
            charValue = database[resultObjectType][objectInstance][resultPropertyIdentifier];
            newValue.write(charValue, 0, 'utf8');
            valueElementCount.writeInt32LE(charValue.length, 0);
            return true;
        }
    }

    // Example of getting Bit String Value object Bit Text property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.BITTEXT && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && useArrayIndex) {
            if (propertyArrayIndex <= database[resultObjectType][objectInstance].present_value.length) {
                charValue = database[resultObjectType][objectInstance].bittext[propertyArrayIndex - 1];
                newValue.write(charValue, 0, 'utf8');
                valueElementCount.writeInt32LE(charValue.length, 0);
                return true;
            }
        }
    }

    // Example of getting Multi State Input object State Text property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.STATETEXT && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex > 0 && propertyArrayIndex <= database[resultObjectType][objectInstance].numberofstates) {
                // 0 is the number of states
                charValue = database[resultObjectType][objectInstance].statetext[propertyArrayIndex - 1];
                newValue.write(charValue, 0, 'utf8');
                valueElementCount.writeInt32LE(charValue.length, 0);
                return true;
            }
        }
    }

    // Could not find the value in the database.
    logger.error('GetPropertyCharacterString failed');
    return false;
}

function GetPropertyDate(deviceInstance, objectType, objectInstance, propertyIdentifier, year, month, day, weekday, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyDate - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Check for Analog Input object Proprietary Properties
    if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT && propertyIdentifier === 512 + 4 && typeof database['analog_input'][objectInstance] !== 'undefined') {
        year.writeUInt8(database['analog_input'][objectInstance].proprietary_year, 0);
        month.writeUInt8(database['analog_input'][objectInstance].proprietary_month, 0);
        day.writeUInt8(database['analog_input'][objectInstance].proprietary_day, 0);
        weekday.writeUInt8(database['analog_input'][objectInstance].proprietary_weekday, 0);
        return true;
    }

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Date Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATE_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            year.writeUInt8(database[resultObjectType][objectInstance].present_value.year, 0);
            month.writeUInt8(database[resultObjectType][objectInstance].present_value.month, 0);
            day.writeUInt8(database[resultObjectType][objectInstance].present_value.day, 0);
            weekday.writeUInt8(database[resultObjectType][objectInstance].present_value.weekday, 0);
            return true;
        }
    }

    // Example of getting Device Local Date property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.LOCAL_DATE && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            var adjustedDate = new Date(Date.now() - database[resultObjectType][objectInstance].current_time_offset);
            year.writeUInt8(adjustedDate.getFullYear() - 1900, 0); // BACnet Spec: Year stored as (YEAR - 1900)
            month.writeUInt8(adjustedDate.getMonth(), 0);
            day.writeUInt8(adjustedDate.getDate(), 0);
            weekday.writeUInt8(adjustedDate.getDay(), 0);
            return true;
        }
    }

    // Example of getting DateTime Value object Present Value property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATETIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            year.writeUInt8(database[resultObjectType][objectInstance].present_value.year, 0);
            month.writeUInt8(database[resultObjectType][objectInstance].present_value.month, 0);
            day.writeUInt8(database[resultObjectType][objectInstance].present_value.day, 0);
            weekday.writeUInt8(database[resultObjectType][objectInstance].present_value.weekday, 0);
            return true;
        }
    }

    logger.error('GetPropertyDate failed');
    return false;
}

function GetPropertyDouble(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyDouble - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Large Analog value object Present Value Property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.LARGE_ANALOG_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            value.writeDoubleLE(database[resultObjectType][objectInstance].present_value, 0);
            return true;
        }
    }

    logger.error('GetPropertyDouble failed');
    return false;
}

function GetPropertyEnumerated(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyEnumerated - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Check to see if we have defined this property in the database.

    // Example of getting Binary Input / Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            ref.set(value, 0, database[resultObjectType][objectInstance].present_value);
            return true;
        }
    } else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            ref.set(value, 0, database[resultObjectType][objectInstance].present_value);
            return true;
        }
    }

    // Example of getting Binary Output object Priority Array property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex) {
                if (propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                    ref.set(value, 0, database[resultObjectType][objectInstance].priority_array_values[propertyArrayIndex - 1]);
                    return true;
                }
            }
        }
    }

    // Example of getting Analog Input object Reliability property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.RELIABILITY && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            value.writeUInt32LE(database[resultObjectType][objectInstance].reliability, 0);
            return true;
        }
    }

    // Example of getting Network Port object FdBbmdAddress Host Type property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            value.writeUInt8(database[resultObjectType][objectInstance].fdbbmdaddress_host_type, 0);
            return true;
        }
    }

    // Debug for customer
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.SYSTEMSTATUS && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        logger.debug('DEBUG: Device:System Status');
        value.writeUInt32LE(database[resultObjectType][objectInstance].systemstatus, 0);
        return true;
    }

    // Example of getting Units property
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
                    logger.error('Unknown unit string. can not convert to enumerated value. value:', valueToWrite);
                    return false;
                }
            }
            ref.set(value, 0, valueToWrite);
            return true;
        }

    logger.error('GetPropertyEnumerated failed');
    return false;
}

function GetPropertyOctetString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, valueElementCount, maxElementCount, encodingType, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyOctetString - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Octet String Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.OCTETSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
            if (database[resultObjectType][objectInstance].present_value.length > maxElementCount) {
                logger.error('Octet String length exceeds maxElementCount');
                return false;
            } else {
                octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];
                var newValue = ref.reinterpret(value, octetString.length, 0);

                for (let i = 0; i < octetString.length; i++) {
                    newValue.writeUInt8(octetString[i], i);
                }
                valueElementCount.writeUInt32LE(octetString.length, 0);
                return true;
            }
        }
    }

    // Example of getting Network Port object IP Address property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];
            var newValue = ref.reinterpret(value, octetString.length, 0);

            for (let i = 0; i < octetString.length; i++) {
                newValue.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    // Example of getting Network Port object IP Default Gateway property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPDEFAULTGATEWAY && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];
            var newValue = ref.reinterpret(value, octetString.length, 0);

            for (let i = 0; i < octetString.length; i++) {
                newValue.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    // Example of getting Network Port object IP Subnet Mask property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPSUBNETMASK && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            octetString = database[resultObjectType][objectInstance][resultPropertyIdentifier];
            var newValue = ref.reinterpret(value, octetString.length, 0);

            for (let i = 0; i < octetString.length; i++) {
                newValue.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    // Example of getting Network Port object IP DNS Server property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPDNSSERVER && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex != 0 && propertyArrayIndex <= database[resultObjectType][objectInstance].ipdnsserver.length) {
                octetString = database[resultObjectType][objectInstance].ipdnsserver[propertyArrayIndex - 1];
                var newValue = ref.reinterpret(value, octetString.length, 0);

                for (let i = 0; i < octetString.length; i++) {
                    newValue.writeUInt8(octetString[i], i);
                }
                valueElementCount.writeUInt32LE(octetString.length, 0);
                return true;
            }
        }
    }

    // Example of getting Network Port object FdBbmdAddress Host (as IP Address)
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            octetString = database[resultObjectType][objectInstance].fdbbmdaddress_host_ip;
            var newValue = ref.reinterpret(value, octetString.length, 0);

            for (let i = 0; i < octetString.length; i++) {
                newValue.writeUInt8(octetString[i], i);
            }
            valueElementCount.writeUInt32LE(octetString.length, 0);
            return true;
        }
    }

    logger.error('GetPropertyOctetString failed');
    return false;
}

function GetPropertyReal(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyReal - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Analog Output object Priority Array property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY && objectType === CASBACnetStack.objectType.ANALOG_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                value.writeFloatLE(database[resultObjectType][objectInstance].priority_array_values[propertyArrayIndex - 1], 0);
                return true;
            }
        }
    }

    // Check if this is for a created Analog Value
    if (propertyIdentifier === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE && typeof database['created_analog_value'][objectInstance.toString()] !== 'undefined') {
        value.writeFloatLE(database['created_analog_value'][objectInstance].present_value, 0);
        return true;
    }

    // Example to handle all other properties all at once without explicit checking for each type
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined.
        // Convert the property to the requested data type and return success.
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        ref.set(value, 0, valueToWrite);
        return true;
    }

    logger.error('GetPropertyReal failed');
    return false;
}

function GetPropertySignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertySignedInteger - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example to handle all other properties all at once without explicit checking for each type
    if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        // The property has been defined.
        // Convert the property to the requested data type and return success.
        var valueToWrite = database[resultObjectType][objectInstance][resultPropertyIdentifier];

        ref.set(value, 0, valueToWrite);
        return true;
    }

    logger.error('GetPropertySignedInteger failed');
    return false;
}

function GetPropertyTime(deviceInstance, objectType, objectInstance, propertyIdentifier, hour, minute, second, hundrethSeconds, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyTime - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Check for Analog Input object Proprietary Properties
    if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT && propertyIdentifier === 512 + 4 && typeof database['analog_input'][objectInstance] !== 'undefined') {
        hour.writeUInt8(database['analog_input'][objectInstance].proprietary_hour, 0);
        minute.writeUInt8(database['analog_input'][objectInstance].proprietary_mminute, 0);
        second.writeUInt8(database['analog_input'][objectInstance].proprietary_second, 0);
        hundrethSeconds.writeUInt8(database['analog_input'][objectInstance].proprietary_hundredthSeconds, 0);
        return true;
    }

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Time Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.TIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            hour.writeUInt8(database[resultObjectType][objectInstance].present_value.hour, 0);
            minute.writeUInt8(database[resultObjectType][objectInstance].present_value.minute, 0);
            second.writeUInt8(database[resultObjectType][objectInstance].present_value.second, 0);
            hundrethSeconds.writeUInt8(database[resultObjectType][objectInstance].present_value.hundrethSeconds, 0);
            return true;
        }
    }

    // Example of getting Device Local Time property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.LOCAL_TIME && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            var adjustedTime = new Date(Date.now() - database[resultObjectType][objectInstance].current_time_offset);
            hour.writeUInt8(adjustedTime.getHours(), 0);
            minute.writeUInt8(adjustedTime.getMinutes(), 0);
            second.writeUInt8(adjustedTime.getSeconds(), 0);
            hundrethSeconds.writeUInt8(0, 0);
            return true;
        }
    }

    // Example of getting DateTime Value object Present Value property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATETIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            hour.writeUInt8(database[resultObjectType][objectInstance].present_value.hour, 0);
            minute.writeUInt8(database[resultObjectType][objectInstance].present_value.minute, 0);
            second.writeUInt8(database[resultObjectType][objectInstance].present_value.second, 0);
            hundrethSeconds.writeUInt8(database[resultObjectType][objectInstance].present_value.hundrethSeconds, 0);
            return true;
        }
    }

    logger.error('GetPropertyTime failed');
    return false;
}

function GetPropertyUnsignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex) {
    logger.debug('GetPropertyUnsignedInteger - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of getting Multi-State Output object Priority Array property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRIORITY_ARRAY && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex <= CASBACnetStack.CONSTANTS.MAX_BACNET_PRIORITY) {
                value.writeUInt32LE(database[resultObjectType][objectInstance].priority_array_values[propertyArrayIndex - 1], 0);
                return true;
            }
        }
    }

    // Example of getting Network Port object IP DNS Server Array Size property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.IPDNSSERVER && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex === 0) {
                value.writeUInt32LE(database[resultObjectType][objectInstance].ipdnsserver.length, 0);
                return true;
            }
        }
    }

    // Example of getting Bit String Value object Bit Text Array Size property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.BITTEXT && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex === 0) {
                value.writeUInt32LE(database[resultObjectType][objectInstance].bittext.length, 0);
                return true;
            }
        }
    }

    // Example of getting Network Port object FdBbmdAddress Port property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (useArrayIndex && propertyArrayIndex === CASBACnetStack.CONSTANTS.FD_BBMD_ADDRESS_PORT) {
            if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
                value.writeUInt32LE(database[resultObjectType][objectInstance].fdbbmdaddress_port, 0);
                return true;
            }
        }
    }

    // NOTE: DOUBLE CHECK WITH SPEC
    // Example of getting Multi-State Input object State Text property (return numberOfStates when State Text property is requested in GetPropertyUnsignedInt())
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.STATETEXT && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            logger.debug('DEBUG: IMPORTANT: Check spec for GetPropertyUnsignedInteger - Multi-State Input object State Text property: 693');

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

    logger.error('GetPropertyUnsignedInteger failed');
    return false;
}

// Set Property callbacks
// These callbacks is used by the CAS BACnet stack to set a property of an object
// If the property could not be set then return false

function SetPropertyBitString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, length, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyBitString - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', length: ' + length + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority', priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Bit String Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (length > database[resultObjectType][objectInstance].present_value.length) {
                errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.NO_SPACE_TO_WRITE_PROPERTY, 0);
                return false;
            } else {
                var newValue = ref.reinterpret(value, length, 0);
                for (let i = 0; i < length; i++) {
                    let boolToWrite = newValue.readUInt8(i) === 1 ? true : false;
                    database[resultObjectType][objectInstance].present_value[i] = boolToWrite;
                    logger.debug('DEBUG: value read from pointer: ' + newValue.readUInt8(i), 'value of bool written: ' + boolToWrite);
                }
                return true;
            }
        }
    }

    logger.error('SetPropertyBitString failed');
    return false;
}

function SetPropertyBool(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyBool - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority, ': errorCode+ ', errorCode);

    logger.error('SetPropertyBool failed');
    return false;
}

function SetPropertyCharacterString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, length, encodingType, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyCharString - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', length: ' + length + ', encodingType: ' + encodingType + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority, ': errorCode+ ', errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting CharString Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.CHARACTERSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].present_value = CreateStringFromCharPointer(value, length);
            return true;
        }
    }

    // Example of setting Device Description property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.DESCRIPTION && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].description = CreateStringFromCharPointer(value, length);
            return true;
        }
    }

    // Example of setting Device Object Name property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.OBJECT_NAME && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].present_value = CreateStringFromCharPointer(value, length);
            return true;
        }
    }

    // Check if trying to set the object name of created Analog Value object
    // Used in initializing objects
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.OBJECT_NAME && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE && typeof database['created_analog_value'][objectInstance] !== 'undefined') {
        database['created_analog_value']['object_name'] = CreateStringFromCharPointer(value, length);
        return true;
    }

    logger.error('SetPropertyCharString failed');
    return false;
}

function SetPropertyDate(deviceInstance, objectType, objectInstance, propertyIdentifier, year, month, day, weekday, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyDate - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', year: ' + year + ', month: ' + month + ', day: ' + day + ', weekday: ' + weekday + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority, ': errorCode+ ', errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Date Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.DATE_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].present_value.year = year;
            database[resultObjectType][objectInstance].present_value.month = month;
            database[resultObjectType][objectInstance].present_value.day = day;
            database[resultObjectType][objectInstance].present_value.weekday = weekday;
            return true;
        }
    }

    logger.error('SetPropertyDate failed');
    return false;
}

function SetPropertyDouble(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyDouble - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority, ': errorCode+ ', errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Large Analog Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.LARGE_ANALOG_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].present_value = value;
            return true;
        }
    }

    logger.error('SetPropertyDouble failed');
    return false;
}

function SetPropertyEnumerated(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyEnumerated - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority, ': errorCode+ ', errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Binary Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].present_value = value;
            return true;
        }
    }

    // Example of setting Binary Output object Present Value / Priority Array property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.BINARY_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].priority_array_nulls[priority - 1] = false;
            database[resultObjectType][objectInstance].priority_array_values[priority - 1] = value;
            return true;
        }
    }

    logger.error('SetPropertyEnumerated failed');
    return false;
}

function SetPropertyNull(deviceInstance, objectType, objectInstance, propertyIdentifier, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyNull - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier, :', propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Analog, Binary and Multi-State Outputs Present Value / Priority Array property to Null
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].priority_array_nulls[priority - 1] = true;
            database[resultObjectType][objectInstance].priority_array_values[priority - 1] = 0;
            return true;
        }
    }

    logger.error('SetPropertyNull failed');
    return false;
}

function SetPropertyOctetString(deviceInstance, objectType, objectInstance, propertyIdentifier, value, length, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyOctetString - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', length: ' + length + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Octet String Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.OCTETSTRING_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (length > database[resultObjectType][objectInstance].present_value.length) {
                errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.NO_SPACE_TO_WRITE_PROPERTY, 0);
                return false;
            } else {
                var newValue = ref.reinterpret(value, length, 0);
                for (let offset = 0; offset < length; offset++) {
                    database[resultObjectType][objectInstance].present_value[offset] = newValue.readUInt8(offset);
                }
                return true;
            }
        }
    }

    // Example of setting Network Port object FdBbmdAddress Host IP property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex === CASBACnetStack.CONSTANTS.FD_BBMD_ADDRESS_HOST) {
                if (length > 4) {
                    errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.VALUE_OUT_OF_RANGE, 0);
                    return false;
                } else {
                    var newValue = ref.reinterpret(value, length, 0);
                    for (let offset = 0; offset < 4; offset++) {
                        database[resultObjectType][objectInstance].fdbbmdaddress_host_ip[offset] = newValue.readUInt8(offset);
                    }
                    database[resultObjectType][objectInstance].changespending = true;
                    return true;
                }
            }
        }
    }

    logger.error('SetPropertyOctetString failed');
    return false;
}

function SetPropertyReal(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyReal - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Analog Value object Min/Max Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (value < database[resultObjectType][objectInstance].minpresvalue || value > database[resultObjectType][objectInstance].maxpresvalue) {
                errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.VALUE_OUT_OF_RANGE, 0);
                return false;
            } else {
                database[resultObjectType][objectInstance].present_value = value;
                return true;
            }
        }
    }

    // Example of setting Analog Output object Present Value / Priority Array property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].priority_array_nulls[priority - 1] = false;
            database[resultObjectType][objectInstance].priority_array_values[priority - 1] = value;
            return true;
        }
    }

    // Example of setting Analog Input object Cov Increment
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.COVINCREMENT && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].covincrement = value;
            return true;
        }
    }

    // Check if setting present value of a created Analog Value
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE && typeof database['created_analog_value'][objectInstance] !== 'undefined') {
        database['created_analog_value'].present_value = value;
        return true;
    }

    logger.error('SetPropertyReal failed');
    return false;
}

function SetPropertySignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertySignedInteger - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Integer Value object Present Value property
    if (propertyIdentifier == CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType == CASBACnetStack.OBJECT_TYPE.INTEGER_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].present_value = value;
            return true;
        }
    }

    // Example of setting Device UTC Offset property
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.UTC_OFFSET && objectType === CASBACnetStack.OBJECT_TYPE.DEVICE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (value < -1440 || value > 1440) {
                errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.VALUE_OUT_OF_RANGE, 0);
                return false;
            } else {
                database[resultObjectType][objectInstance][resultPropertyIdentifier] = value;
                return true;
            }
        }
    }

    logger.error('SetPropertySignedInteger failed');
    return false;
}

function SetPropertyTime(deviceInstance, objectType, objectInstance, propertyIdentifier, hour, minute, second, hundrethSeconds, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyTime - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', hour: ' + hour + ', minute: ' + minute + ', second: ' + second + ', hundrethSeconds: ' + hundrethSeconds + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Time Value object Present Value property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.TIME_VALUE) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance][resultPropertyIdentifier].hour = hour;
            database[resultObjectType][objectInstance][resultPropertyIdentifier].minute = minute;
            database[resultObjectType][objectInstance][resultPropertyIdentifier].second = second;
            database[resultObjectType][objectInstance][resultPropertyIdentifier].hundrethSeconds = hundrethSeconds;
            return true;
        }
    }

    logger.error('SetPropertyTime failed');
    return false;
}

function SetPropertyUnsignedInteger(deviceInstance, objectType, objectInstance, propertyIdentifier, value, useArrayIndex, propertyArrayIndex, priority, errorCode) {
    logger.debug('SetPropertyUnsignedInteger - deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', value: ' + value + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority + ', errorCode: ' + errorCode);

    // Convert the enumerated values to human readable strings.
    var resultPropertyIdentifier = HelperGetKeyByValue(CASBACnetStack.PROPERTY_IDENTIFIER, propertyIdentifier).toLowerCase();
    var resultObjectType = HelperGetKeyByValue(CASBACnetStack.OBJECT_TYPE, objectType).toLowerCase();

    // Example of setting Multi-State Output object Prsent Value / Priority Array property
    if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE && objectType === CASBACnetStack.OBJECT_TYPE.MULTI_STATE_OUTPUT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].priority_array_nulls[priority - 1] = false;
            database[resultObjectType][objectInstance].priority_array_values[priority - 1] = value;
            return true;
        }
    }

    // Example of setting Network Port object FdBbmdAddress Port
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDBBMDADDRESS && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            if (useArrayIndex && propertyArrayIndex === CASBACnetStack.CONSTANTS.FD_BBMD_ADDRESS_PORT) {
                database[resultObjectType][objectInstance].fdbbmdaddress_port = value;
                database[resultObjectType][objectInstance].changespending = true;
                return true;
            }
        }
    }

    // Example of setting Network Port object FdSubscriptionLifetime
    else if (propertyIdentifier === CASBACnetStack.PROPERTY_IDENTIFIER.FDSUBSCRIPTIONLIFETIME && objectType === CASBACnetStack.OBJECT_TYPE.NETWORK_PORT) {
        if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance)) {
            database[resultObjectType][objectInstance].fdsubscriptionlifetime = value;
            database[resultObjectType][objectInstance].changespending = true;
            return true;
        }
    }

    // Example of setting other properties
    else if (database.hasOwnProperty(resultObjectType) && database[resultObjectType].hasOwnProperty(objectInstance) && typeof database[resultObjectType][objectInstance][resultPropertyIdentifier] !== 'undefined') {
        database[resultObjectType][objectInstance][resultPropertyIdentifier] = value;
        return true;
    }

    logger.error('SetPropertyUnsignedInteger failed');
    return false;
}

// Other callbacks
function CreateObject(deviceInstance, objectType, objectInstance) {
    // This callback is called when this BACnet Server device receives a CreateObject message
    // In this callback, you can allocate memory to store properties that you would store
    // For example, present-value and object name

    if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE) {
        database['created_analog_value'][objectInstance] = {};
        database['created_analog_value'][objectInstance].object_name = 'AnalogValue_' + objectInstance.toString();
        return true;
    }
    logger.error('CreateObject failed');
    return false;
}

function DeleteObject(devinceInstance, objectType, objectInstance) {
    // This callback is called when this BACnet Server device receives a DeleteObject message
    // In this callbcak, you can clean up any memory that was allocated when the object was
    // initially created.

    // In this example, we will only allow Analog Values to be enabled
    // See the SetupBACnetDeviceFunction on how this is handled
    if (objectType === CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE) {
        delete database['created_analog_value'][objectInstance];
        return true;
    }
    logger.error('DeleteObject failed');
    return false;
}

function ReinitializeDevice(devinceInstance, reinitializedState, password, passwordLength, errorCode) {
    // This callback is called when this BACnet Server device receives a ReinitializeDevice message
    // In this callback, you will handle the reinitializedState.
    // If reinitializedState = ACTIVATE_CHANGES (7) then you will apply any network port changes and store the values in non-volatile memory
    // If reinitializedState = WARM_START(1) then you will apply any network port changes, store the values in non-volatile memory, and restart the device.

    // Before handling the reinitializedState, first check the password.
    // If your device does not require a password, then ignore any password passed in.
    // Otherwise, validate the password.
    //		If password invalid, missing, or incorrect: set errorCode to PasswordInvalid (26)
    // In this example, a password of 12345 is required.
    if (password == ref.NULL_POINTER || passwordLength === 0) {
        errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.PASSWORD_FAILURE, 0);
        logger.error('Failed to ReinitializeDevice - No password (PASSWORD_FAILURE)');
        return false;
    }

    if (CreateStringFromCharPointer(password, passwordLength) !== '12345') {
        errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.PASSWORD_FAILURE, 0);
        logger.error('Failed to ReinitializeDevice - Bad password (PASSWORD_FAILURE)');
        return false;
    }

    // In this example, only the NetworkPort Object FdBbmdAddress and FdSubscriptionLifetime properties are writable and need to be
    // stored in non-volatile memory.  For the purpose of this example, we will not storing these values in non-volaitle memory.

    // 1. Store values that must be stored in non-volatile memory (i.e. must survive a reboot).

    // 2. Apply any Network Port values that have been written to.
    // If any validation on the Network Port values failes, set errorCode to INVALID_CONFIGURATION_DATA (46)

    // 3. Set Network Port ChangesPending property to false

    // 4. Handle ReinitializedState. If ACTIVATE_CHANGES, no other action, return true.
    //								 If WARM_START, prepare device for reboot, return true. and reboot.
    // NOTE: Must return true first before rebooting so the stack sends the SimpleAck.
    if (reinitializedState == CASBACnetStack.CONSTANTS.REINITIALIZED_STATE_ACTIVATE_CHANGES) {
        database['network_port'][parseInt(Object.keys(database['network_port'])[0])].changespending = false;
        return true;
    } else if (reinitializedState == CASBACnetStack.CONSTANTS.REINITIALIZED_STATE_WARM_START) {
        // Flag for reboot and handle reboot after stack responds with SimpleAck.
        database['network_port'][parseInt(Object.keys(database['network_port'])[0])].changespending = false;
        return true;
    } else {
        // All other states are not supported in this example.
        errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.OPTIONAL_FUNCTIONALITY_NOT_SUPPORTED, 0);
        logger.error('Failed to ReinitializeDevice - Invalid state to reinitialize to (OPTIONAL_FUNCTIONALITY_NOT_SUPPORTED');
        return false;
    }
}

function DeviceCommunicationControl(deviceInstance, enableDisable, password, passwordLength, useTimeDuration, timeDuration, errorCode) {
    // This callback is called when this BACnet Server device receives a DeviceCommunicationControl message
    // In this callback, you will handle the password. All other parameters are purely for logging to know
    // what parameters the DeviceCommunicationControl request had.

    // To handle the password:
    // If your device does not require a password, then ignore any password passed in.
    // Otherwise, validate the password.
    //		If password invalid, missing, or incorrect: set errorCode to PasswordInvalid (26)
    // In this example, a password of 12345 is required.
    if (password == ref.NULL_POINTER || passwordLength === 0) {
        errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.PASSWORD_FAILURE, 0);
        logger.error('Failed to ReinitializeDevice - No password (PASSWORD_FAILURE)');
        return false;
    }

    if (CreateStringFromCharPointer(password, passwordLength) !== '12345') {
        errorCode.writeUInt32LE(CASBACnetStack.ERROR_CODES.PASSWORD_FAILURE, 0);
        logger.error('Failed to ReinitializeDevice - Bad password (PASSWORD_FAILURE)');
        return false;
    }

    // Must return true to allow for the DeviceCommunicationControl logic to continue
    return true;
}

function HookTextMessage(sourceDeviceIdentifier, useMessageClass, messageClassUnsigned, messageClassString, messageClassStringLength, messagePriority, message, messageLength, connectionString, connectionStringLength, networkType, sourceNetwork, sourceAddress, sourceAddressLength, errorClass, errorCode) {
    // Configured to respond to Client example Confirmed Text Message Requests
    const expectedSourceDeviceIdentifier = 389002;
    const expectedMessageClass = 5;
    const expectedMessagePriority = 0; // normal

    // Check that this device is configured to do some logic using the text message
    if (sourceDeviceIdentifier == expectedSourceDeviceIdentifier && messageClassUnsigned == expectedMessageClass && messagePriority == expectedMessagePriority) {
        // Perform some logic using the message
        console.log('Received text message request meant for us to perform some logic: ' + CreateStringFromCharPointer(message, messageLength));

        // Device is configured to handle the confirmed text message, response is Result(+) or simpleAck
        return true;
    }

    // This device is not configured to handle the text message, response is Result(-)
    // Ignored for Unconfirmed Text Message Requests

    // Create an error
    errorClass.writeUInt16LE(0, 0); // 0: Device Error Class
    errorCode.writeUInt16LE(132, 0); // 132: Not Configured Error Code
    logger.error('HookTextMessage failed: This device is not configured to handle the text message');
    return false;
}

function LogDebugMessage(message, messageLength, messageType) {
    // This callback is called when the CAS BACnet Stack logs an error or info message
    // In this callback, you will be able to access this debug message.
    console.log('Log message type: ' + messageType ? 'Info' : 'Error');
    console.log(CreateStringFromCharPointer(message, messageLength));
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

    // Message Callback Functions
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSendMessage(FuncPtrCallbackSendMessage);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackReceiveMessage(FuncPtrCallbackReceiveMessage);

    // System Time Callback Functions
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetSystemTime(FuncPtrCallbackGetSystemTime);

    // Get Property Callback Functions
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyBitString(FuncPtrCallbackGetPropertyBitString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyBool(FuncPtrCallbackGetPropertyBool);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyCharacterString(FuncPtrCallbackGetPropertyCharacterString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyDate(FuncPtrCallbackGetPropertyDate);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyDouble(FuncPtrCallbackGetPropertyDouble);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyEnumerated(FuncPtrCallbackGetPropertyEnumerated);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyOctetString(FuncPtrCallbackGetPropertyOctetString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyReal(FuncPtrCallbackGetPropertyReal);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertySignedInteger(FuncPtrCallbackGetPropertySignedInteger);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyTime(FuncPtrCallbackGetPropertyTime);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackGetPropertyUnsignedInteger(FuncPtrCallbackGetPropertyUnsignedInteger);

    // Set Property Callback Functions
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyBitString(FuncPtrCallbackSetPropertyBitString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyBool(FuncPtrCallbackSetPropertyBool);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyCharacterString(FuncPtrCallbackSetPropertyCharacterString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyDate(FuncPtrCallbackSetPropertyDate);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyDouble(FuncPtrCallbackSetPropertyDouble);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyEnumerated(FuncPtrCallbackSetPropertyEnumerated);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyNull(FuncPtrCallbackSetPropertyNull);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyOctetString(FuncPtrCallbackSetPropertyOctetString);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyReal(FuncPtrCallbackSetPropertyReal);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertySignedInteger(FuncPtrCallbackSetPropertySignedInteger);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyTime(FuncPtrCallbackSetPropertyTime);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackSetPropertyUnsignedInteger(FuncPtrCallbackSetPropertyUnsignedInteger);

    // Object Creation Callback Functions
    CASBACnetStack.stack.BACnetStack_RegisterCallbackCreateObject(FuncPtrCallbackCreateObject);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackDeleteObject(FuncPtrCallbackDeleteObject);

    // Remote Device Management Callback Functions
    CASBACnetStack.stack.BACnetStack_RegisterCallbackReinitializeDevice(FuncPtrCallbackReinitializeDevice);
    CASBACnetStack.stack.BACnetStack_RegisterCallbackDeviceCommunicationControl(FuncPtrCallbackDeviceCommunicationControl);
    CASBACnetStack.stack.BACnetStack_RegisterHookTextMessage(FuncPtrHookTextMessage);

    // Debug Callback Function
    CASBACnetStack.stack.BACnetStack_RegisterCallbackLogDebugMessage(FuncPtrCallbackLogDebugMessage);

    // Setup the BACnet device.
    // ------------------------------------------------------------------------
    var DEVICE_INSTANCE = Object.keys(database['device'])[0];
    console.log('FYI: Setting up BACnet device...');
    console.log('FYI: BACnet device instance:', DEVICE_INSTANCE);
    CASBACnetStack.stack.BACnetStack_AddDevice(DEVICE_INSTANCE);

    // Setup the BACnet objects.
    // ------------------------------------------------------------------------
    // Loop through the database adding the objects as they are found.
    for (var objectTypeKey in database) {
        // Decode the string repseration of the object type as a enumeration.
        if (!objectTypeKey.toUpperCase() in CASBACnetStack.OBJECT_TYPE) {
            logger.error('Unknown object type found. object type:', objectTypeKey);
            continue;
        }
        // Exclude Trend Log, Trend Log Multiple, and Network Port as they use special AddObject functions
        else if (objectTypeKey === 'network_port' || objectTypeKey === 'trend_log' || objectTypeKey === 'trend_log_multiple') {
            continue;
        }

        var objectTypeEnum = CASBACnetStack.OBJECT_TYPE[objectTypeKey.toUpperCase()];
        if (objectTypeEnum === CASBACnetStack.OBJECT_TYPE.device) {
            continue; // The device has already been added.
        }

        // Loop through the ObjectInstance for this object type.
        for (var objectInstance in database[objectTypeKey]) {
            console.log('FYI: Adding object. objectType:', objectTypeKey, '(' + objectTypeEnum + '), objectInstance:', objectInstance);
            CASBACnetStack.stack.BACnetStack_AddObject(DEVICE_INSTANCE, objectTypeEnum, objectInstance);
        }
    }
    // Note: A object can be manually added as well
    // CASBACnetStack.stack.BACnetStack_AddObject(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, 0)

    // Set up the BACnet services
    // ------------------------------------------------------------------------
    // By default only the required servics are enabled.
    console.log('Enabling IAm... ');
    CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.I_AM, true);

    console.log('Enabling ReadPropertyMultiple... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.READ_PROPERTY_MULTIPLE, true)) {
        logger.error('Failed to enable the ReadPropertyMultiple service');
        return false;
    }
    console.log('OK');
    console.log('Enabling WriteProperty... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.WRITE_PROPERTY, true)) {
        logger.error('Failed to enable the WriteProperty service');
        return false;
    }
    console.log('OK');
    console.log('Enabling WritePropertyMultiple... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.WRITE_PROPERTY_MULTIPLE, true)) {
        logger.error('Failed to enable the WritePropertyMultiple service');
        return false;
    }
    console.log('OK');
    console.log('Enabling TimeSynchronization... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.TIME_SYNCHRONIZATION, true)) {
        logger.error('Failed to enable the TimeSynchronization service');
        return false;
    }
    console.log('OK');
    console.log('Enabling UTCTimeSynchronization... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.UTC_TIME_SYNCHRONIZATION, true)) {
        logger.error('Failed to enable the UTCTimeSynchronization service');
        return false;
    }
    console.log('OK');
    console.log('Enabling SubscibeCOV... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.SUBSCRIBE_COV, true)) {
        logger.error('Failed to enable the SubscibeCOV service');
        return false;
    }
    console.log('OK');
    console.log('Enabling SubscibeCOVPropety... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.SUBSCRIBE_COV_PROPERTY, true)) {
        logger.error('Failed to enable the SubscibeCOVPropety service');
        return false;
    }
    console.log('OK');
    console.log('Enabling CreateObject... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.CREATE_OBJECT, true)) {
        logger.error('Failed to enable the CreateObject service');
        return false;
    }
    console.log('OK');
    console.log('Enabling DeleteObject... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.DELETE_OBJECT, true)) {
        logger.error('Failed to enable the DeleteObject service');
        return false;
    }
    console.log('OK');
    console.log('Enabling ReadRange... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.READ_RANGE, true)) {
        logger.error('Failed to enable the ReadRange service');
        return false;
    }
    console.log('OK');
    console.log('Enabling ReinitializeDevice... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.REINITIALIZE_DEVICE, true)) {
        logger.error('Failed to enable the ReinitializeDevice service');
        return false;
    }
    console.log('OK');
    console.log('Enabling DeviceCommunicationControl... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.DEVICE_COMMUNICATION_CONTROL, true)) {
        logger.error('Failed to enable the DeviceCommunicationControl service');
        return false;
    }
    console.log('OK');
    console.log('Enabling UnconfirmedTextMessage... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.UNCONFIRMED_TEXT_MESSAGE, true)) {
        logger.error('Failed to enable the UnconfirmedTextMessage service');
        return false;
    }
    console.log('OK');
    console.log('Enabling ConfirmedTextMessage... ');
    if (!CASBACnetStack.stack.BACnetStack_SetServiceEnabled(DEVICE_INSTANCE, CASBACnetStack.SERVICES_SUPPORTED.CONFIRMED_TEXT_MESSAGE, true)) {
        logger.error('Failed to enable the ConfirmedTextMessage service');
        return false;
    }
    console.log('OK');

    // Setup Network Parameters
    // Skipped if network settings are configured - see README
    // ------------------------------------------------------------------------
    // Get Local IP
    var localAddress = [];
    var defaultGateway = [];
    var subnetMask = [];

    // Get netmask and ip address if not set
    if (SETTING_IP_ADDRESS.length !== 4 || SETTING_SUBNET_MASK.length !== 4) {
        const networkInterfaces = os.networkInterfaces();
        var localAddressString = '';
        for (localNetwork in networkInterfaces) {
            networkInterfaces[localNetwork].forEach(function (adapter) {
                // NOTE: Specify your network here with your own filters
                let addressIterator = adapter.address.split('.').map(Number);
                if (addressIterator[0] === 192 && addressIterator[2] === 1) {
                    localAddress = adapter.address.split('.').map(Number);
                    localAddressString = adapter.address;
                    subnetMask = adapter.netmask.split('.').map(Number);
                }
            });
        }
    } else {
        localAddress = SETTING_IP_ADDRESS;
        localAddressString = SETTING_IP_ADDRESS[0] + '.' + SETTING_IP_ADDRESS[1] + '.' + SETTING_IP_ADDRESS[2] + '.' + SETTING_IP_ADDRESS[3];
        subnetMask = SETTING_SUBNET_MASK;
    }
    // Get defuault gateway if not set
    if (SETTING_DEFAULT_GATEWAY.length !== 4) {
        defaultGateway = defaultGatewayLib.v4.sync().gateway.split('.').map(Number);
    } else {
        defaultGateway = SETTING_DEFAULT_GATEWAY;
    }

    // Write Network Parameters to database
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].bacnetipudpport = SETTING_BACNET_PORT;
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].fdbbmdaddress_port = SETTING_BACNET_PORT;
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipaddress = localAddress.slice();
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipaddress[4] = SETTING_BACNET_PORT / 256;
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipaddress[5] = SETTING_BACNET_PORT % 256;
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].fdbbmdaddress_host_ip = localAddress.slice();
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].fdbbmdaddress_host_ip[4] = SETTING_BACNET_PORT / 256;
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].fdbbmdaddress_host_ip[5] = SETTING_BACNET_PORT % 256;
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipdefaultgateway = defaultGateway.slice();
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipsubnetmask = subnetMask.slice();
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].broadcast_ip_address = localAddress.slice();
    database['network_port'][parseInt(Object.keys(database['network_port'])[0])].broadcast_ip_address[3] = 255;

    // Setup your own DNS Servers if needed
    // database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipdnsserver[0] = firstDNSServer.slice();
    // database['network_port'][parseInt(Object.keys(database['network_port'])[0])].ipdnsserver[1] = secondDNSServer.slice();
    // etc.

    // Setup the UDP socket
    // ------------------------------------------------------------------------
    console.log('FYI: Setting up BACnet UDP port. Port:', SETTING_BACNET_PORT);

    server.on('error', (err) => {
        logger.error(`UDP.Server error:\n${err.stack}`);
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

    // TODO: We manual set server address until we find reliable way of getting ip
    server.bind({
        address: localAddressString,
        port: SETTING_BACNET_PORT
    });

    // Setup the Device Properties
    // ------------------------------------------------------------------------
    // Enable optional Device properties
    if (!CASBACnetStack.stack.BACnetStack_SetPropertyEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.DEVICE, DEVICE_INSTANCE, CASBACnetStack.PROPERTY_IDENTIFIER.DESCRIPTION, true)) {
        logger.error('Failed to enable the description property for Device');
        return false;
    }

    // Update writable Device properties
    // UTC Offset
    if (!CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.DEVICE, DEVICE_INSTANCE, CASBACnetStack.PROPERTY_IDENTIFIER.UTC_OFFSET, true)) {
        logger.error('Failed to make the UTC Offset property writable for Device');
        return false;
    }
    // Description
    if (!CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.DEVICE, DEVICE_INSTANCE, CASBACnetStack.PROPERTY_IDENTIFIER.DESCRIPTION, true)) {
        logger.error('Failed to make the Description property writable for Device');
        return false;
    }
    // Object Name
    if (!CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.DEVICE, DEVICE_INSTANCE, CASBACnetStack.PROPERTY_IDENTIFIER.OBJECT_NAME, true)) {
        logger.error('Failed to make the Object Name property writable for Device');
        return false;
    }

    // Setup the Object Properties
    // ------------------------------------------------------------------------
    // Analog Input (AI) properties
    // TODO: Update callbacks for proprietary properties
    // Enable Proprietary Properties
    CASBACnetStack.stack.BACnetStack_SetProprietaryProperty(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), 512 + 1, false, false, CASBACnetStack.DATA_TYPES.CHARACTER_STRING, false, false, false);
    CASBACnetStack.stack.BACnetStack_SetProprietaryProperty(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), 512 + 2, true, false, CASBACnetStack.DATA_TYPES.CHARACTER_STRING, false, false, false);
    CASBACnetStack.stack.BACnetStack_SetProprietaryProperty(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), 512 + 3, true, true, CASBACnetStack.DATA_TYPES.CHARACTER_STRING, false, false, false);
    CASBACnetStack.stack.BACnetStack_SetProprietaryProperty(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), 512 + 4, false, false, CASBACnetStack.DATA_TYPES.DATETIME, false, false, false);
    // Set Present Value to subscribable
    CASBACnetStack.stack.BACnetStack_SetPropertySubscribable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.COVINCREMENT, true);
    // Enable the Description and Reliability property
    CASBACnetStack.stack.BACnetStack_SetPropertyByObjectTypeEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, CASBACnetStack.PROPERTY_IDENTIFIER.DESCRIPTION, true);
    CASBACnetStack.stack.BACnetStack_SetPropertyByObjectTypeEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, CASBACnetStack.PROPERTY_IDENTIFIER.RELIABILITY, true);
    // Enable a specific property to be subscribable for COVProperty
    CASBACnetStack.stack.BACnetStack_SetPropertySubscribable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.RELIABILITY, true);

    // Analog Output (AO) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyByObjectTypeEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_OUTPUT, CASBACnetStack.PROPERTY_IDENTIFIER.MINPRESVALUE, true);
    CASBACnetStack.stack.BACnetStack_SetPropertyByObjectTypeEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_OUTPUT, CASBACnetStack.PROPERTY_IDENTIFIER.MAXPRESVALUE, true);

    // Analog Value (AV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE, parseInt(Object.keys(database['analog_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);
    CASBACnetStack.stack.BACnetStack_SetPropertySubscribable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE, parseInt(Object.keys(database['analog_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Binary Input (BI) properties
    // No special config

    // Binary Output (BO) properties
    // No special config

    // Binary Value (BV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.BINARY_VALUE, parseInt(Object.keys(database['binary_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Multi State Input (MSI) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyByObjectTypeEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.MULTI_STATE_INPUT, CASBACnetStack.PROPERTY_IDENTIFIER.STATETEXT, true);

    // Multi State Output (MSO) properties
    // No special config

    // Multi State Value (MSV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.MULTI_STATE_VALUE, parseInt(Object.keys(database['multi_state_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Bit String Value (BSV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE, parseInt(Object.keys(database['bitstring_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.BITTEXT, true);
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.BITSTRING_VALUE, parseInt(Object.keys(database['bitstring_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Character String Value (CSV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.CHARACTERSTRING_VALUE, parseInt(Object.keys(database['characterstring_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Date value (DV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.DATE_VALUE, parseInt(Object.keys(database['date_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Integer Value (IV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.INTEGER_VALUE, parseInt(Object.keys(database['integer_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Large Analog Value (LAV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.LARGE_ANALOG_VALUE, parseInt(Object.keys(database['large_analog_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Octet String Value (OSV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.OCTETSTRING_VALUE, parseInt(Object.keys(database['octetstring_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Positive Integer Value (PIV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.POSITIVE_INTEGER_VALUE, parseInt(Object.keys(database['positive_integer_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Time Value (TV) properties
    CASBACnetStack.stack.BACnetStack_SetPropertyWritable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.TIME_VALUE, parseInt(Object.keys(database['time_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, true);

    // Trend Log (TL) properties
    // Add object
    if (!CASBACnetStack.stack.BACnetStack_AddTrendLogObject(DEVICE_INSTANCE, parseInt(Object.keys(database['trend_log'])[0]), CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, CASBACnetStack.CONSTANTS.MAX_TREND_LOG_MAX_BUFFER_SIZE, false, 0)) {
        logger.error('Failed to add TrendLog');
        return false;
    }
    // Setup
    if (!CASBACnetStack.stack.BACnetStack_SetTrendLogTypeToPolled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.TREND_LOG, parseInt(Object.keys(database['trend_log'])[0]), true, false, 3000)) {
        logger.error('Failed to setup TrendLog to poll every 30 seconds');
        return false;
    }

    // Trend Log Multiple (TLM) properties
    // Add object
    if (!CASBACnetStack.stack.BACnetStack_AddTrendLogMultipleObject(DEVICE_INSTANCE, parseInt(Object.keys(database['trend_log_multiple'])[0]), CASBACnetStack.CONSTANTS.MAX_TREND_LOG_MAX_BUFFER_SIZE)) {
        logger.error('Failed to add TrendLogMultiple');
        return false;
    }
    // Setup
    if (!CASBACnetStack.stack.BACnetStack_AddLoggedObjectToTrendLogMultiple(DEVICE_INSTANCE, parseInt(Object.keys(database['trend_log_multiple'])[0]), CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, false, 0, false, 0)) {
        logger.error('Failed to add BinaryInput to be logged by TrendLogMultiple');
        return false;
    }
    if (!CASBACnetStack.stack.BACnetStack_AddLoggedObjectToTrendLogMultiple(DEVICE_INSTANCE, parseInt(Object.keys(database['trend_log_multiple'])[0]), CASBACnetStack.OBJECT_TYPE.ANALOG_INPUT, parseInt(Object.keys(database['analog_input'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE, false, 0, false, 0)) {
        logger.error('Failed to add AnalogInput to be logged by TrendLogMultiple');
        return false;
    }
    if (!CASBACnetStack.stack.BACnetStack_SetTrendLogTypeToPolled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.TREND_LOG_MULTIPLE, parseInt(Object.keys(database['trend_log_multiple'])[0]), true, false, 3000)) {
        logger.error('Failed to set TrendLogMultiple to poll every 30 seconds');
        return false;
    }

    // Network Port (NP) properties
    if (!CASBACnetStack.stack.BACnetStack_AddNetworkPortObject(DEVICE_INSTANCE, parseInt(Object.keys(database['network_port'])[0]), CASBACnetStack.CONSTANTS.NETWORK_TYPE_IPV4, CASBACnetStack.CONSTANTS.PROTOCOL_LEVEL_BACNET_APPLICATION, CASBACnetStack.CONSTANTS.NETWORK_PORT_LOWEST_PROTOCOL_LAYER)) {
        logger.error('Failed to add NetworkPort');
        return false;
    }
    CASBACnetStack.stack.BACnetStack_SetPropertyEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.NETWORK_PORT, parseInt(Object.keys(database['network_port'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.BBMDACCEPTFDREGISTRATIONS, true);
    CASBACnetStack.stack.BACnetStack_SetPropertyEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.NETWORK_PORT, parseInt(Object.keys(database['network_port'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.BBMDBROADCASTDISTRIBUTIONTABLE, true);
    CASBACnetStack.stack.BACnetStack_SetPropertyEnabled(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.NETWORK_PORT, parseInt(Object.keys(database['network_port'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.BBMDFOREIGNDEVICETABLE, true);

    var bdtHostAddr = Buffer.allocUnsafe(6);
    bdtHostAddr.writeUint8(localAddress[0], 0); // IP
    bdtHostAddr.writeUint8(localAddress[1], 1); // IP
    bdtHostAddr.writeUint8(localAddress[2], 2); // IP
    bdtHostAddr.writeUint8(localAddress[3], 3); // IP
    bdtHostAddr.writeUint8(SETTING_BACNET_PORT / 256, 4); // Port
    bdtHostAddr.writeUint8(SETTING_BACNET_PORT % 256, 5); // Port
    var bdtSubnetMask = Buffer.allocUnsafe(6);
    bdtSubnetMask.writeUint8(subnetMask[0], 0); // IP
    bdtSubnetMask.writeUint8(subnetMask[1], 1); // IP
    bdtSubnetMask.writeUint8(subnetMask[2], 2); // IP
    bdtSubnetMask.writeUint8(subnetMask[3], 3); // IP
    bdtSubnetMask.writeUint8(SETTING_BACNET_PORT / 256, 4); // Port
    bdtSubnetMask.writeUint8(SETTING_BACNET_PORT % 256, 5); // Port
    CASBACnetStack.stack.BACnetStack_AddBDTEntry(bdtHostAddr, 6, bdtSubnetMask, 4); // First BDT Entry must be server device

    // Date Time Value (DTV) properties
    // No special config

    // Make some objects creatable (optional)
    // ------------------------------------------------------------------------
    if (!CASBACnetStack.stack.BACnetStack_SetObjectTypeSupported(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE, true)) {
        logger.error('Failed to make Analog Values as supported object types in Device');
        return false;
    }
    if (!CASBACnetStack.stack.BACnetStack_SetObjectTypeCreatable(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE, true)) {
        logger.error('Failed to make Analog Values as supported object types in Device');
        return false;
    }

    // Send I-Am of this device
    // ------------------------------------------------------------------------
    console.log('FYI: Sending I-AM broadcast');
    var iAmConnectionString = Buffer.allocUnsafe(6);
    bdtSubnetMask.writeUint8(database['network_port'][parseInt(Object.keys(database['network_port'])[0])].broadcast_ip_address[0], 0); // IP
    bdtSubnetMask.writeUint8(database['network_port'][parseInt(Object.keys(database['network_port'])[0])].broadcast_ip_address[1], 1); // IP
    bdtSubnetMask.writeUint8(database['network_port'][parseInt(Object.keys(database['network_port'])[0])].broadcast_ip_address[2], 2); // IP
    bdtSubnetMask.writeUint8(database['network_port'][parseInt(Object.keys(database['network_port'])[0])].broadcast_ip_address[3], 3); // IP
    bdtSubnetMask.writeUint8(SETTING_BACNET_PORT / 256, 4); // Port
    bdtSubnetMask.writeUint8(SETTING_BACNET_PORT % 256, 5); // Port
    if (!CASBACnetStack.stack.BACnetStack_SendIAm(DEVICE_INSTANCE, iAmConnectionString, 6, CASBACnetStack.CONSTANTS.NETWORK_TYPE_BACNET_IP, true, 65535, ref.NULL_POINTER, 0)) {
        logger.error('Unable to send the IAm broadcast');
        return false;
    }

    // Broadcast BACnet stack version to the network via UnconfirmedTextMessage
    var stackVersionInfo = 'CAS BACnetStack v' + CASBACnetStack.stack.BACnetStack_GetAPIMajorVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIMinorVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIPatchVersion() + '.' + CASBACnetStack.stack.BACnetStack_GetAPIBuildVersion();
    var stackVersionInfoBuffer = Buffer.allocUnsafe(50);
    var stackVersionInfoBufferLen = stackVersionInfoBuffer.write(stackVersionInfo, 'utf-8');
    if (!CASBACnetStack.stack.BACnetStack_SendUnconfirmedTextMessage(DEVICE_INSTANCE, false, 0, ref.NULL_POINTER, 0, 0, stackVersionInfoBuffer, stackVersionInfoBufferLen, iAmConnectionString, 6, CASBACnetStack.CONSTANTS.NETWORK_TYPE_BACNET_IP, true, 65535, ref.NULL_POINTER, 0)) {
        logger.error('Unable to send UnconfirmedTextMessage broadcast');
        return false;
    }

    // Main program loop
    // ------------------------------------------------------------------------
    var intervalCount = 1;
    console.log('FYI: Starting main program loop... ');
    setInterval(() => {
        CASBACnetStack.stack.BACnetStack_Loop();

        // Increment Analog Value object Present Value every 10 seconds
        if (intervalCount % 100 === 0) {
            intervalCount = 1;
            database['analog_value'][parseInt(Object.keys(database['analog_value'])[0])].present_value += 0.1;
            CASBACnetStack.stack.BACnetStack_ValueUpdated(DEVICE_INSTANCE, CASBACnetStack.OBJECT_TYPE.ANALOG_VALUE, parseInt(Object.keys(database['analog_value'])[0]), CASBACnetStack.PROPERTY_IDENTIFIER.PRESENT_VALUE);
        }
        intervalCount += 1;
    }, 100);
}

// Start the application.
// ------------------------------------------------------------------------
main();
