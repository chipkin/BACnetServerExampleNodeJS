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

## Installtion

```bash

sudo apt install build-essential
npm install 
node program.js

```

## Example output

```txt
BACnet Server Example NodeJS
https://github.com/chipkin/BACnetServerExampleNodeJS
GetLibaryPath: ./bin/libCASBACnetStack_x64_Debug
Application Version: 1.0.0.0, BACnetStack_Version: 3.11.0.823, BACnetStackAdapter_Version: 1.0.0.0

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
FYI: Adding object. objectType: trend_log (20), objectInstance: 20
FYI: Adding object. objectType: bitstring_value (39), objectInstance: 39
FYI: Adding object. objectType: characterstring_value (40), objectInstance: 40
FYI: Adding object. objectType: integer_value (45), objectInstance: 45
FYI: Adding object. objectType: large_analog_value (46), objectInstance: 46
FYI: Adding object. objectType: octetstring_value (47), objectInstance: 47
FYI: Adding object. objectType: positive_integer_value (48), objectInstance: 48
FYI: Adding object. objectType: time_value (50), objectInstance: 50
FYI: Setting up BACnet UDP port. Port: 47808
FYI: Starting main program loop...
FYI: UDP.Server listening 0.0.0.0:47808

CallbackRecvMessage Got message. Length: 12 , From: 192.168.1.26:47808 , Message:  810b000c0120ffff00ff1008
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  62 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  120 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  107 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 25 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 25

CallbackRecvMessage Got message. Length: 25 , From: 192.168.1.111:47808 , Message:  810b00190120ffff00ff1000c40205ef892205c49103220185

CallbackRecvMessage Got message. Length: 25 , From: 192.168.1.58:47808 , Message:  810b00190120ffff00ff1000c40205ef892205c49103220185

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a001301040005560e0c0205ef8a1e09081f
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  11 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  12 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  44 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  62 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  70 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  73 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  98 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  107 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  112 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  120 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  121 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  139 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  8 , objectInstance:  389002 , propertyIdentifier:  155 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 332 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 332

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a001301040005570e0c0205ef8a1e094c1f
CallbackSendMessage. messageLength: 110 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 110

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a001301040005580e0c000000001e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyReal - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  85 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  0 , objectInstance:  0 , propertyIdentifier:  117 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 89 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 89

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a001301040005590e0c000003e81e09081f
CallbackSendMessage. messageLength: 24 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 24

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a0013010400055a0e0c00c000031e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  84 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  85 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  3 , objectInstance:  3 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 89 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 89

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a0013010400055b0e0c004000011e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
GetPropertyBool - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
GetPropertyReal - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  104 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  117 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  1 , objectInstance:  1 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
CallbackSendMessage. messageLength: 9 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 9

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a0013010400055c0e0c008000021e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyReal - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  85 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  2 , objectInstance:  2 , propertyIdentifier:  117 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 89 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 89

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a0013010400055d0e0c010000041e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  84 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
GetPropertyBool - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  104 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  4 , objectInstance:  4 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
CallbackSendMessage. messageLength: 9 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 9

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a0013010400055e0e0c014000051e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  5 , objectInstance:  5 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  5 , objectInstance:  5 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  5 , objectInstance:  5 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  5 , objectInstance:  5 , propertyIdentifier:  85 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  5 , objectInstance:  5 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  5 , objectInstance:  5 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 80 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 80

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a0013010400055f0e0c0340000d1e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  74 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  85 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  13 , objectInstance:  13 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 96 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 96

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a001301040005600e0c0380000e1e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  74 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
GetPropertyBool - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  104 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  14 , objectInstance:  14 , propertyIdentifier:  87 , useArrayIndex:  true , propertyArrayIndex:  1
CallbackSendMessage. messageLength: 9 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 9

CallbackRecvMessage Got message. Length: 19 , From: 192.168.1.26:47808 , Message:  810a001301040005610e0c04c000131e09081f
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  74 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyCharacterString - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  77 , useArrayIndex:  false , propertyArrayIndex:  0, maxElementCount:  256 , encodingType:  203
GetPropertyBool - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyUnsignedInteger - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  85 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyEnumerated - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  36 , useArrayIndex:  false , propertyArrayIndex:  0
GetPropertyBool - deviceInstance:  389002 , objectType:  19 , objectInstance:  19 , propertyIdentifier:  81 , useArrayIndex:  false , propertyArrayIndex:  0
CallbackSendMessage. messageLength: 92 , host:  192.168.1.26 , port: 47808
CallbackSendMessage. Length: 92
```
