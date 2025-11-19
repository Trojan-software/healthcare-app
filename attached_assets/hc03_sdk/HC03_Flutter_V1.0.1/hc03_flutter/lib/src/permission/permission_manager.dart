import 'dart:io';
import 'package:flutter/material.dart';
import 'package:location/location.dart' hide PermissionStatus;
import 'package:permission_handler/permission_handler.dart';

Future<bool> requestBlePermissions() async {
  Location _location = Location();
  bool _serviceEnabled;

  _serviceEnabled = await _location.serviceEnabled();
  if (!_serviceEnabled) {
    _serviceEnabled = await _location.requestService();
    if (!_serviceEnabled) {
      return false;
    }
  }
  var isLocationGranted = await Permission.locationWhenInUse.request();
  debugPrint('checkBlePermissions, isLocationGranted=$isLocationGranted');

  var isBleGranted = await Permission.bluetooth.request();
  debugPrint('checkBlePermissions, isBleGranted=$isBleGranted');

  var isBleScanGranted = await Permission.bluetoothScan.request();
  debugPrint('checkBlePermissions, isBleScanGranted=$isBleScanGranted');
  //
  var isBleConnectGranted = await Permission.bluetoothConnect.request();
  debugPrint('checkBlePermissions, isBleConnectGranted=$isBleConnectGranted');
  //
  var isBleAdvertiseGranted = await Permission.bluetoothAdvertise.request();
  debugPrint('checkBlePermissions, isBleAdvertiseGranted=$isBleAdvertiseGranted');

  if (Platform.isIOS) {
    return isBleGranted == PermissionStatus.granted;
  } else {
    return isLocationGranted == PermissionStatus.granted &&
        // isBleGranted == PermissionStatus.granted  &&
        isBleScanGranted == PermissionStatus.granted &&
        isBleConnectGranted == PermissionStatus.granted &&
        isBleAdvertiseGranted == PermissionStatus.granted;
  }
}
