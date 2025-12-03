import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import '../../bluetooth/bluetooth_manager.dart';
import '../../pages_data/health_data.dart';
import '../../permission/permission_manager.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';

class BluePage extends StatefulWidget {
  var tabIndex;

  BluePage({super.key, this.tabIndex});

  @override
  State<BluePage> createState() => _BluePageState();
}

class _BluePageState extends State<BluePage> {
  late BlueToothManager blueToothManager;
  late RxList deviceList;
  RxBool isScan = false.obs;
  late Function scanCallBack;
  late Function connectCallBack;
  BluetoothDevice? connectDevice;
  RxString scanDes = "scan".obs;
  RxBool isShowBtn = false.obs;
  RxBool isBleConnect = false.obs;

  @override
  void initState() {
    super.initState();
    requestBlePermissions();
    initBle();
  }

  void initBle() {
    blueToothManager = BlueToothManager();
    scanCallBack = (isScanning) {
      scanDes.value = isScanning ? "scanning" : "scan";
    };
    blueToothManager.addScanListener(scanCallBack);
    connectCallBack = (device, isConnect) async {
      connectDevice = device;
      isBleConnect.value = isConnect;
      isShowBtn.value = isConnect;
      if (isConnect) {
        BleData bleData = BleData();
        bleData.init();
        Future.delayed(const Duration(seconds: 1), () {
          EasyLoading.dismiss();
          widget.tabIndex.value = 1;
        });
      } else {
        blueToothManager.startScan();
        widget.tabIndex.value = 0;
        debugPrint(
            "=================================================isConnect=$isConnect");
      }
    };
    blueToothManager.addConnectListener(connectCallBack);
  }

  List<Widget> blueList() {
    List<Widget> list = [];

    for (var element in deviceList) {
      if (connectDevice == element.device && isBleConnect.value) {
        debugPrint(" blueList=${element.device}");

        list.add(Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton(
                onPressed: () async {
                  try {
                    EasyLoading.show(status: 'connect...');
                    await blueToothManager.stopScan();
                    await Future.delayed(const Duration(milliseconds: 1000));
                    await blueToothManager.connect(element.device);
                    blueToothManager.setDeviceName(element.advertisementData);
                    Future.delayed(const Duration(seconds: 5), () {
                      EasyLoading.dismiss();
                    });
                  } catch (e) {
                    Future.delayed(const Duration(seconds: 5), () {
                      EasyLoading.dismiss();
                    });
                  }
                },
                child: Column(
                  children: [
                    Text(
                      "DeviceName:${element.advertisementData.localName} Mac:${element.device.remoteId} ",
                    ),
                    Visibility(
                        visible: isShowBtn.value,
                        child: TextButton(
                          style: ButtonStyle(
                              backgroundColor:
                                  MaterialStatePropertyAll(Colors.blue[400])),
                          child: const Text("Connected"),
                          onPressed: () async {
                            await blueToothManager.disConnect();
                            isShowBtn.value = false;
                          },
                        ))
                  ],
                )),
          ],
        ));
      } else {

          list.add(TextButton(
            onPressed: () async {
              try {
                EasyLoading.show(status: 'connect...');
                await blueToothManager.stopScan();
                debugPrint(" connect element=${element.runtimeType}");
                await Future.delayed(const Duration(milliseconds: 1000));
                await blueToothManager.connect(element.device);
                blueToothManager
                    .setDeviceName(element.advertisementData.localName);
                Future.delayed(const Duration(seconds: 5), () {
                  EasyLoading.dismiss();
                });
              } catch (e) {
                Future.delayed(const Duration(seconds: 5), () {
                  EasyLoading.dismiss();
                });
              }
            },
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              scrollDirection: Axis.horizontal,
              child: Text(
                  "DeviceName:${element.advertisementData.localName}  Mac:${element.device.remoteId} ${isBleConnect.value ? "" : ""}"),
            ),
          ));
        
      }
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Center(
          child: ElevatedButton(
              onPressed: () {
                blueToothManager.startScan();
                deviceList = blueToothManager.getDeviceList();
                isScan.value = true;
              },
              child: Obx(() => Text(scanDes.value))),
        ),
        Obx(() => Expanded(
              child: isScan.value
                  ? ListView(
                      children: blueList(),
                    )
                  : const Text(""),
            ))
      ],
    );
  }

  @override
  void dispose() {
    super.dispose();
    blueToothManager.removeScanListener(scanCallBack);
  }
}
