
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smartring_flutter/src/widget/hr_wave.dart';
import '../../pages_data/health_data.dart';
import '../../widget/ecg_wave.dart';
import '../../widget/health_item.dart';
import 'package:flutter_picker/flutter_picker.dart';

class HealthPage extends StatefulWidget {
  var tabIndex;

  HealthPage({super.key, required this.tabIndex});

  @override
  State<HealthPage> createState() => _HealthPageState();
}

class _HealthPageState extends State<HealthPage> {
  late BleData bleData;
  List<int>? selectIndex; 

  @override
  void initState() {
    super.initState();
    bleData = BleData();
  }

  @override
  void dispose() {
    super.dispose();
    bleData.dispose();
  }

  showPickerArray(BuildContext context) {
    Picker(
        adapter: PickerDataAdapter<String>(
            pickerData: bleData.papers(), isArray: true),
        hideHeader: true,
        selecteds:selectIndex,
        title: const Text("Please Select"),
        onConfirm: (Picker picker, List value) {
          debugPrint("value= $value value[0]=${value[0]}");
          debugPrint("selected= ${picker.getSelectedValues()}");
          selectIndex=[value[0]];
          bleData.selectPaper(value[0]);
        }).showDialog(context);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        Obx(() => HealthItemWidget(
            data: "${bleData.battery} ",
            buttonTitle: "start Battery",
            onPressed: () {
              bleData.startBattery();
            })),
        Obx(() => HealthItemWidget(
            data: "${bleData.temperature} ",
            buttonTitle: "start Temperature",
            onPressed: () {
              bleData.startTemperature();
            })),
        Obx(() => HealthItemWidget(
            data: "spo2: ${bleData.bloodOxygen}  hr:${bleData.heartRate} ",
            buttonTitle: "start Blood oxygen",
            onPressed: () {
              bleData.startBloodOxygen();
            })),
        HealthItemWidget(
            data: "",
            buttonTitle: "stop Blood oxygen",
            onPressed: () {
              bleData.stopBloodOxygen();
            }),
        HealthItemWidget(
            data: "",
            buttonTitle: "select Blood Glucose paper",
            onPressed: () {
              showPickerArray(context);
            }),
        Obx(() => HealthItemWidget(
            data: "${bleData.bloodGlucose}  ",
            buttonTitle: "start Blood Glucose",
            onPressed: () {
              bleData.startBloodGlucose();
            })),
        HealthItemWidget(
            data: "",
            buttonTitle: "stop Blood Glucose",
            onPressed: () {
              bleData.stopBloodGlucose();
            }),
        Obx(() => HealthItemWidget(
            data: "${bleData.bloodPressure}",
            buttonTitle: "start Blood Pressure",
            onPressed: () {
              bleData.startBloodPressure();
            })),
        HealthItemWidget(
            data: "",
            buttonTitle: "stop Blood Pressure",
            onPressed: () {
              bleData.stopBloodPressure();
            }),
        HrWave(
            waveData: bleData.hrWaveList,
            update: bleData.hrWaveUpdate,
            paintColor: 0xFFFF9000),
        Obx(() => HealthItemWidget(
            data: "${bleData.outEcgValue} ",
            buttonTitle: "start Ecg",
            onPressed: () {
              bleData.startEcg();
            })),
        HealthItemWidget(
            data: " ",
            buttonTitle: "Stop Ecg",
            onPressed: () {
              bleData.stopEcg();
            }),
        EcgWave(bleData.waveData, bleData.ecgUpdate),
      ],
    );
  }
}
