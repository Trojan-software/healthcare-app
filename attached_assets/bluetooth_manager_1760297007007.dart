import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import '../common/constant.dart';
import 'package:get/get.dart';
import './bluetooth_state.dart';
import './bluetooth_listener.dart';
import './bluetooth_uuid.dart';
import 'bluetooth_io.dart';

class BlueToothManager {
  static final BlueToothManager _instance = BlueToothManager._internal();
  static const int _SCAN_TIMEOUT = 10000;
  var _isScanning = false;
  BluetoothDevice? currentDevice = null;
  String _deviceName = '';
  final BlueToothState _blueToothState = BlueToothState();
  final ConnectListener<Function> _connectListener =
      ConnectListener<Function>();
  final ScanListener<Function> _scanListener = ScanListener<Function>();
  final UuidManager _uuidManager = UuidManager();
  final BlueToothIO _blueToothIO = BlueToothIO();

  factory BlueToothManager() {
    return _instance;
  }

  BlueToothManager._internal();

  //Start Bluetooth scanning
  Future<RxList?> startScan({int scan_timeout = _SCAN_TIMEOUT}) async {
    if (await FlutterBluePlus.isSupported == false) {
      debugPrint("Bluetooth not supported by this device");
      return null;
    }
    if (_isScanning) {
      return null;
    }
    if (Platform.isAndroid) {
      await FlutterBluePlus.turnOn();
    }
    await stopScan();
    var list = [].obs;
    _isScanning = true;
    notifityScanListener(isScanning: _isScanning);
    await FlutterBluePlus.startScan(
        withServices: [Guid(FILTER_UUID)],
        timeout: Duration(milliseconds: scan_timeout));
    _blueToothState.setCurrentState(BlueState.scanning);
    return list;
  }

  //Obtain a list of Bluetooth devices
  RxList getDeviceList() {
    var list = [].obs;

    FlutterBluePlus.scanResults.listen(
      (results) {
        list.clear();

        for (ScanResult result in results) {
          //   var ringData = SDK.getBroadcastData(result.advertisementData.manufacturerData., isAndroid);
        }
        list.addAll(results);
      },
    );
    Future.delayed(const Duration(seconds: 1), () {
      FlutterBluePlus.isScanning.listen((isScann) {
        if (!isScann) {
          _isScanning = false;
          notifityScanListener(isScanning: _isScanning);
          _blueToothState.setCurrentState(BlueState.stopScan);
        }
      });
    });

    return list;
  }

  //Stop Bluetooth scanning
  Future<void> stopScan() async {
    if (FlutterBluePlus.isScanningNow) {
      await FlutterBluePlus.stopScan();
    }
  }

  //Bluetooth connectivity
  Future<void> connect(BluetoothDevice device) async {
    try {
      if (await FlutterBluePlus.isSupported == false) {
        // debugPrint("Bluetooth not supported by this device");
        return;
      }
      if (Platform.isAndroid) {
        await FlutterBluePlus.turnOn();
      }

      currentDevice = device;

      await device.connect();
      _uuidManager.initData();
      Future.delayed(const Duration(seconds: 1));
      // debugPrint(">>>>>>> connect success ``````````````````````````````");
      await device.discoverServices(timeout: 30).then((value) {
        // debugPrint("discoverServices success  value=$value");
        for (var service in value) {
          var characteristics = service.characteristics;
          _uuidManager.getUUID(characteristics);
        }
      });
      if (_uuidManager.characteristicUUIDList.isNotEmpty) {
        notifityConnectListener(device: device, isConnect: true);
      } else {
        notifityConnectListener(device: device, isConnect: false);
      }
      connectStateListener(device);
    } catch (e) {
      if (_uuidManager.characteristicUUIDList.isNotEmpty &&
          e.toString().contains("discoverServices")) {
        notifityConnectListener(device: device, isConnect: true);
      } else {
        notifityConnectListener(device: device, isConnect: false);
      }
      await currentDevice!.clearGattCache();
      debugPrint(">>>>>>> connect  e=$e```````````````````````");
    }
  }

  //Bluetooth connection status monitoring
  void connectStateListener(BluetoothDevice device) {
    device.connectionState.listen((BluetoothConnectionState state) async {
      // debugPrint("  BluetoothConnectionState  $state ");
      if (state == BluetoothConnectionState.connected) {
        // notifityConnectListener(device: device, isConnect: true);
      } else if (state == BluetoothConnectionState.disconnected) {
        notifityConnectListener(device: device, isConnect: false);
      }
    }, onDone: () {
      debugPrint("  BluetoothConnectionState onDone ");
    }, onError: (e) {
      debugPrint("  BluetoothConnectionState onError $e ");
    });
  }

  //Bluetooth disconnected
  Future<void> disConnect() async {
    if (currentDevice != null) {
      try {
        await currentDevice!.clearGattCache();
        await currentDevice!.disconnect();

        debugPrint("[disConnect]");
        currentDevice = null;
      } catch (e) {
        currentDevice = null;
      }
    }
  }

  Future<void> write(String characteristicUuid, List<int> value) async {
    BluetoothCharacteristic? characteristic =
        _uuidManager.getCharacteristic(characteristicUuid);
    // debugPrint("write  characteristic=$characteristic  value=$value");
    await _blueToothIO.write(characteristic, value);
  }

  Future<void> writeWithoutResponse(characteristicUuid, value) async {
    BluetoothCharacteristic? characteristic =
        _uuidManager.getCharacteristic(characteristicUuid);
    // debugPrint("write  characteristic=$characteristic  value=$value");
    await _blueToothIO.writeWithoutResponse(characteristic, value);
  }

  Future<void> notifityWriteListener(characteristicUuid, Function fun,
      {Function? onError}) async {
    BluetoothCharacteristic? characteristic =
        _uuidManager.getCharacteristic(characteristicUuid);

    await _blueToothIO.listenerNotification(characteristic, fun,
        onError: onError);
  }

  Future<void>? requestConnectionPriority() {
    return currentDevice?.requestConnectionPriority(
        connectionPriorityRequest: ConnectionPriority.high);
  }

  Future<void> refreshCache() async {
    await currentDevice?.clearGattCache();
  }

  Future<int> requestMtu(int mtu) {
    return currentDevice!.requestMtu(mtu);
  }

  void setDeviceName(String deviceName) {
    _deviceName = deviceName;
  }

  String getDeviceName() {
    return _deviceName;
  }

  //Bluetooth scanning status monitoring
  void addScanListener(Function fun) {
    removeScanListener(fun);
    _scanListener.addListener(fun);
  }

  //Bluetooth scanning state monitoring removed
  void removeScanListener(Function fun) {
    _scanListener.removeListener(fun);
  }

  //Bluetooth scanning status update
  void notifityScanListener({isScanning}) {
    _scanListener.notifity(isScanning: isScanning);
  }

  //Bluetooth connect status monitoring
  void addConnectListener(Function fun) {
    removeConnectListener(fun);
    _connectListener.addListener(fun);
  }

  //Bluetooth connect state monitoring removed
  void removeConnectListener(Function fun) {
    _connectListener.removeListener(fun);
  }

  //Bluetooth connect status update
  void notifityConnectListener({device, isConnect}) {
    _connectListener.notifity(device: device, isConnect: isConnect);
  }
}
