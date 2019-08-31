//
// Written by: Steven Smethurst
// Last updated: Aug 30, 2019 
//

var CASBACnetStack = require('./CASBACnetStackAdapter'); // CAS BACnet stack 

var ffi = require('ffi'); // DLL interface. https://github.com/node-ffi/node-ffi 
var ref = require('ref'); // DLL Data types. https://github.com/TooTallNate/ref 
var dequeue = require('dequeue'); // Creates a FIFO buffer. https://github.com/lleo/node-dequeue/

const dgram = require('dgram'); // UDP server 

// Settings 
const SETTING_BACNET_DEVICE_ID = 389002
const SETTING_BACNET_PORT = 47808

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

function CallbackGetSystemTime() {
    // https://stackoverflow.com/a/9456144/58456
    var d = new Date()
    return d.getTime() / 1000
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

    // Setup the BACnet device. 
    // ------------------------------------------------------------------------
    console.log("FYI: Setting up BACnet device...");
    console.log("FYI: BACnet device instance:", SETTING_BACNET_DEVICE_ID);
    CASBACnetStack.stack.BACnetStack_AddDevice(SETTING_BACNET_DEVICE_ID)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 0, 0)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 1, 1)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 2, 2)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 3, 3)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 4, 4)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 5, 5)
    CASBACnetStack.stack.BACnetStack_AddObject(SETTING_BACNET_DEVICE_ID, 6, 6)

    // Setup the UDP socket 
    // ------------------------------------------------------------------------
    console.log("FYI: Setting up BACnet UDP port. Port:", SETTING_BACNET_PORT);

    server.on('error', (err) => {
        console.error(`Error: UDP.Server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        console.log(`FYI: UDP.Server message. From: ${rinfo.address}:${rinfo.port}, Message:`, msg);

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
        process.stdout.write(".");
    }, 100);
}

// Start the application. 
// ------------------------------------------------------------------------
main();
