var ref = require('ref'); // DLL Data types 
var ffi = require('ffi'); // DLL interface 

CASBACNETSTACK_LIBARY_ARCHITECTURE = 'x64'; // x64 or x86 
CASBACNETSTACK_LIBARY_TYPE = 'Debug'; // Release or Debug
CASBACNETSTACK_LIBARY_PATH = './bin/';

// Select the right shared libary for the OS. 
var CASBACNETSTACK_LIBARY_FILENAME
if (process.platform == "win32") {
    CASBACNETSTACK_LIBARY_FILENAME = CASBACNETSTACK_LIBARY_PATH + 'CASBACnetStack_' + CASBACNETSTACK_LIBARY_ARCHITECTURE + '_' + CASBACNETSTACK_LIBARY_TYPE + '.dll'
} else {
    CASBACNETSTACK_LIBARY_FILENAME = CASBACNETSTACK_LIBARY_PATH + 'libCASBACnetStack_' + CASBACNETSTACK_LIBARY_ARCHITECTURE + '_' + CASBACNETSTACK_LIBARY_TYPE
}

module.exports = {
    GetAdapterVersion: function GetAdapterVersion() {
        return "1.0.0.0";
    },
    GetLibaryPath: function GetLibaryPath() {
        return (CASBACNETSTACK_LIBARY_FILENAME);
    },
    stack: ffi.Library(CASBACNETSTACK_LIBARY_FILENAME, {
        'BACnetStack_GetAPIMajorVersion': ['uint32', []],
        'BACnetStack_GetAPIMinorVersion': ['uint32', []],
        'BACnetStack_GetAPIPatchVersion': ['uint32', []],
        'BACnetStack_GetAPIBuildVersion': ['uint32', []],

        'BACnetStack_Loop': ['void', []],

        'BACnetStack_RegisterCallbackSendMessage': ['uint16', ['pointer']],
        'BACnetStack_RegisterCallbackReceiveMessage': ['uint16', ['pointer']],
        'BACnetStack_RegisterCallbackGetSystemTime': ['void', ['pointer']],

        'BACnetStack_AddDevice': ['bool', ['uint32']],

        // bool BACnetStack_AddObject(const uint32_t deviceInstance, const uint16_t objectType, const uint32_t objectInstance)
        'BACnetStack_AddObject': ['bool', ['uint32', 'uint16', 'uint32',]],
    })
};
