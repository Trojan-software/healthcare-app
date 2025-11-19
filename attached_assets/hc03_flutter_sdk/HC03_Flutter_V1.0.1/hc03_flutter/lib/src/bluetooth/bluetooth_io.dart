import 'dart:async';
import 'dart:io';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BlueToothIO {
StreamSubscription<List<int>>? subscription;

  Future<void> write(BluetoothCharacteristic? characteristic, List<int> value) async {
    await characteristic?.write(value);
  }

  Future<void> writeWithoutResponse(
      BluetoothCharacteristic? characteristic, List<int> value) async{
    await characteristic?.write(value, withoutResponse: true);
  }

  Future<void> requestMtu(BluetoothDevice device,int mtu) async{
    if(Platform.isAndroid){
      await device.requestMtu(mtu);
    }
  }

  Future<List<int>>? read(BluetoothCharacteristic? characteristic) {
      var read = characteristic?.read();
      return read;
  }

  Future<void> setNotification(BluetoothCharacteristic characteristic) async{
    await characteristic.setNotifyValue(true);
  }

  Future<void> listenerNotification(BluetoothCharacteristic? characteristic,Function fun ,{Function? onError}) async{
    subscription?.cancel();
    subscription = characteristic?.onValueReceived.listen((event) { 
      fun(event);
    },onError: (error){
      onError??(error);
    });

    await characteristic?.setNotifyValue(true);
  }
}
