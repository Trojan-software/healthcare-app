import 'dart:async';
import 'dart:typed_data';

import 'package:smartring_flutter/src/core/common/baseCommon.dart';
import 'package:smartring_flutter/src/core/hc03_sdk.dart';
import 'package:smartring_flutter/src/core/protocol/Exception.dart';

class SyncManager {
  static final SyncManager _instance = SyncManager._internal();

  Completer<Hc03BaseMeasurementData> _temperatureController = Completer();
  Completer<Hc03BaseMeasurementData> _batteryController = Completer();

  StreamController<Hc03BaseMeasurementData> _bloodOxygenController =
      StreamController();
  StreamController<Hc03BaseMeasurementData> get bloodOxygenController =>
      _bloodOxygenController;
  set bloodOxygenController(StreamController<Hc03BaseMeasurementData> value) {
    _bloodOxygenController = value;
  }

  StreamController<Hc03BaseMeasurementData> _stopController =
      StreamController();
  StreamController<Hc03BaseMeasurementData> get stopController =>
      _stopController;
  set stopController(StreamController<Hc03BaseMeasurementData> value) {
    _stopController = value;
  }

  StreamController<Hc03BaseMeasurementData> _bloodGlucoseController =
      StreamController();
  StreamController<Hc03BaseMeasurementData> get bloodGlucoseController =>
      _bloodGlucoseController;
  set bloodGlucoseController(StreamController<Hc03BaseMeasurementData> value) {
    _bloodGlucoseController = value;
  }

  StreamController<Hc03BaseMeasurementData> _bloodPressureController =
      StreamController();
  StreamController<Hc03BaseMeasurementData> get bloodPressureController =>
      _bloodPressureController;
  set bloodPressureController(
      StreamController<Hc03BaseMeasurementData> value) {
    _bloodPressureController = value;
  }

  StreamController<Hc03BaseMeasurementData> _ecgController = StreamController();
  StreamController<Hc03BaseMeasurementData> get ecgController => _ecgController;
  set ecgController(StreamController<Hc03BaseMeasurementData> value) {
    _ecgController = value;
  }

  factory SyncManager() {
    return _instance;
  }

  SyncManager._internal();

  /// Get temperature data
  Future<Hc03BaseMeasurementData> getTemperatureData() {
    _temperatureController = Completer();
    return _temperatureController.future;
  }

  void temperatureCatchError(AppException e) {
    if (!_temperatureController.isCompleted) {
      _temperatureController.completeError(e);
    }
  }

  void temperatureCatchData(Hc03BaseMeasurementData data) {
    if (!_temperatureController.isCompleted) {
      _temperatureController.complete(data);
    }
  }

  ///Battery level
  Future<Hc03BaseMeasurementData> getBatteryLevel() async {
    _batteryController = Completer();
    return _batteryController.future;
  }

  void batteryCatchChargeStatus(bool isCharging) {
    if (!_batteryController.isCompleted) {
      BatteryChargingStatus batteryChargingStatus =
          BatteryChargingStatus(isCharging);
      _batteryController.complete(batteryChargingStatus);
    }
  }

  void batteryCatchData(int data) {
    if (!_batteryController.isCompleted) {
      BatteryLevelData batteryLevelData = BatteryLevelData(data);
      _batteryController.complete(batteryLevelData);
    }
  }

  /// Get blood oxygen data
  Future<
      ({
        Stream<Hc03BaseMeasurementData> data,
        Stream<Hc03BaseMeasurementData> stop,
      })> getBloodOxygen() async {
    bloodOxygenController.close();
    bloodOxygenController = StreamController<Hc03BaseMeasurementData>();
    stopController.close();
    stopController = StreamController<Hc03BaseMeasurementData>();
    return (data: bloodOxygenController.stream, stop: stopController.stream);
  }

  void bloodOxygenCatchError(
      {required String message, required ExceptionType type}) {
    _bloodOxygenController.addError(AppException(message: message, type: type));
  }

  void bloodOxygenCatchTouched(bool isTouched) {
    _bloodOxygenController.add(FingerDetection(isTouched));
  }

  void bloodOxygenCatchData(spo2, hr) {
    _bloodOxygenController.add(BloodOxygenData(spo2, hr));
  }

  void bloodOxygenCatchWaveData(red, ir) {
    _bloodOxygenController.add(BloodOxygenWaveData(red, ir));
  }

  void bloodOxygenCatchStop() {
    _stopController.add(StopMeasure());
  }

  ///bloodglucose data
  void sendBgCmd(int type, List<int> cmd) {
    Uint8List data = BaseCommon.obtainCommandData(type, cmd);
    BloodGlucoseSendData bloodGlucoseSendData = BloodGlucoseSendData(data);
    bloodGlucoseController.add(bloodGlucoseSendData);
  }

  void dispatchBgPaperState(int code, String message) {
    bloodGlucoseController.add(BloodGlucosePaperState(code, message));
  }

  void dispatchBgPaperResult(data) {
    bloodGlucoseController.add(BloodGlucosePaperData(data));
  }

  Stream<Hc03BaseMeasurementData> bloodGlucoseCatchData() {
    bloodGlucoseController.close();
    bloodGlucoseController = StreamController<Hc03BaseMeasurementData>();
    return bloodGlucoseController.stream;
  }

  void dispatchBloodPressureResult(int ps, int pd, int hr) {
    _bloodPressureController.add(BloodPressureResult(ps, pd, hr));
  }

  void dispatchBloodPressureCatchError(AppException e) {
    _bloodPressureController.addError(e);
  }

  void dispatchBloodPressureProcess(Process process) {
    _bloodPressureController.add(BloodPressureProcess(process));
  }

  void sendBpCmd(int type, List<int> cmd) {
    Uint8List data = BaseCommon.obtainCommandData(type, cmd);
    BloodPressureSendData bloodPressureSendData = BloodPressureSendData(data);
    _bloodPressureController.add(bloodPressureSendData);
  }

  Stream<Hc03BaseMeasurementData> bloodPressureCatchData() {
    bloodPressureController.close();
    bloodPressureController = StreamController<Hc03BaseMeasurementData>();
    return bloodPressureController.stream;
  }

  //ecg

  void disPatchEcgData(Map data) {
    EcgData ecgData = EcgData(data);
    _ecgController.add(ecgData);
  }

  Stream<Hc03BaseMeasurementData> ecgCatchData() {
    ecgController.close();
    ecgController = StreamController<Hc03BaseMeasurementData>();
    return ecgController.stream;
  }
}
