# BACnet Server Example NodeJS

A basic BACnet IP server example written in NodeJS using the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack).

- Device: 389999 (Device Rainbow)
  - analog_input: 0  (AnalogInput Bronze)
  - analog_output: 1  (AnalogOutput Chartreuse)
  - analog_value: 2  (AnalogValue Diamond)
  - binary_input: 3  (BinaryInput Emerald)
  - binary_output: 4  (BinaryOutput Fuchsia)
  - binary_value: 5  (BinaryValue Gold)
  - multi_state_input: 13  (MultiStateInput Hot Pink)
  - multi_state_output: 14  (MultiStateOutput Indigo)
  - multi_state_value: 19  (MultiStateValue Kiwi)
  - trend_log: 20  (TrendLog Lilac)
  - bitstring_value: 39  (BitstringValue Magenta)
  - characterstring_value: 40  (CharacterstringValue Nickel)
  - data_value: 42  (DateValue Onyx)
  - integer_value: 45  (IntegerValue Purple)
  - large_analog_value: 46  (LargeAnalogValue Quartz)
  - octetstring_value: 47  (OctetstringValue Red)
  - positive_integer_value: 48  (PositiveIntegerValue Silver)
  - time_value: 50  (TimeValue Turquoise)
  - NetworkPort: 56  (NetworkPort Umber)
  - DateTime: 57  (DateTimeValue Viola)
  - TrendLogMultiple: 21  (TrendLogMultiple Wallace)

## Installation

1. Place `CASBACnetStack_x64_Debug.dll` into `REPO_DIR/bin/`
2. (optional) Set network settings at program.js:30, if left empty the program will get your system's active network configuration
```js
// Settings
const SETTING_BACNET_PORT = 47808;  // Default BACnet IP UDP Port.
const SETTING_DEFAULT_GATEWAY = []; // Set Default Gateway to use for BACnet (i.e. [192, 168, 1, 3])
const SETTING_IP_ADDRESS = [];      // Set IP Address to use for BACnet (i.e. [192, 168, 1, 3])
const SETTING_SUBNET_MASK = [];     // Set Subnet Mask to use for BACnet (i.e. [255, 255, 255, 0])
```

3. Run the following
```bash

sudo apt install build-essential
npm install 
node program.js

```

## Example output

```txt
BACnet Server Example NodeJS
https://github.com/chipkin/BACnetServerExampleNodeJS
GetLibaryPath: ./bin/CASBACnetStack_x64_Debug.dll
Application Version: 1.2.0.0, BACnetStack_Version: 3.30.2.0, BACnetStackAdapter_Version: 1.1.0.0

FYI: Setting up callback functions...
FYI: Setting up BACnet device...
FYI: BACnet device instance: 389002
FYI: Adding object. objectType: device (8), objectInstance: 389002
FYI: Adding object. objectType: analog_input (0), objectInstance: 0
FYI: Adding object. objectType: analog_output (1), objectInstance: 1
FYI: Adding object. objectType: analog_value (2), objectInstance: 2
FYI: Adding object. objectType: binary_input (3), objectInstance: 3
FYI: Adding object. objectType: binary_output (4), objectInstance: 4
FYI: Adding object. objectType: binary_value (5), objectInstance: 5
FYI: Adding object. objectType: multi_state_input (13), objectInstance: 13
FYI: Adding object. objectType: multi_state_output (14), objectInstance: 14
FYI: Adding object. objectType: multi_state_value (19), objectInstance: 19
FYI: Adding object. objectType: bitstring_value (39), objectInstance: 39
FYI: Adding object. objectType: characterstring_value (40), objectInstance: 40
FYI: Adding object. objectType: date_value (42), objectInstance: 42
FYI: Adding object. objectType: integer_value (45), objectInstance: 45
FYI: Adding object. objectType: large_analog_value (46), objectInstance: 46
FYI: Adding object. objectType: octetstring_value (47), objectInstance: 47
FYI: Adding object. objectType: positive_integer_value (48), objectInstance: 48
FYI: Adding object. objectType: time_value (50), objectInstance: 50
FYI: Adding object. objectType: datetime_value (44), objectInstance: 57
Enabling IAm...
Enabling ReadPropertyMultiple...
OK
Enabling WriteProperty...
OK
Enabling WritePropertyMultiple...
OK
Enabling TimeSynchronization...
OK
Enabling UTCTimeSynchronization...
OK
Enabling SubscibeCOV...
OK
Enabling SubscibeCOVPropety...
OK
Enabling CreateObject...
OK
Enabling DeleteObject...
OK
Enabling ReadRange...
OK
Enabling ReinitializeDevice...
OK
Enabling DeviceCommunicationControl...
OK
Enabling UnconfirmedTextMessage...
OK
Enabling ConfirmedTextMessage...
OK
Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding
FYI: Setting up BACnet UDP port. Port: 47808
FYI: Sending I-AM broadcast
FYI: Starting main program loop... 
FYI: UDP.Server listening 192.168.1.159:47808
```
