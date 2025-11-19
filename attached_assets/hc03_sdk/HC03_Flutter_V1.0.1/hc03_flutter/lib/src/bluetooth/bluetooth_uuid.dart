import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class UuidManager {
  List characteristicUUIDList = [];
  List characteristicList = [];
 
  initData() {
    characteristicUUIDList.clear();
    characteristicList.clear();
  }

  void getUUID(List<BluetoothCharacteristic> list) {
    // print(" characteristicUUIDList ${characteristicUUIDList.length} ");
    for (var item in list) {
      String uuid = "";
      if (item.characteristicUuid.toString().length == 4) {
        uuid = '0000${item.characteristicUuid.toString().toUpperCase()}-0000-1000-8000-00805F9B34FB';
      } else {
        uuid = item.characteristicUuid.toString().toUpperCase();
      }
      if (!characteristicUUIDList.contains(uuid)) {
        // serviceUUIDList.add(item.serviceUuid.toString().toUpperCase());
        characteristicUUIDList.add(uuid);
        characteristicList.add(item);
      
        // print(" ${item.serviceUuid} == ${item.characteristicUuid}");
      }
    }
  }


  BluetoothCharacteristic? getCharacteristic(String characteristicUuid) {
    // print(" getCharacteristic characteristicUuid=$characteristicUuid  characteristicUUIDList=${characteristicUUIDList.length} ");
    if (characteristicUUIDList.isEmpty) {
      return null;
    }
    int index = characteristicUUIDList.indexOf(characteristicUuid);
    // print(" index=$index");
    return characteristicList[index];
  }
}
