import 'dart:async';
import 'dart:typed_data';

import 'package:smartring_flutter/src/core/health/battery/batteryEngine.dart';
import 'package:smartring_flutter/src/core/health/bg/bgEngine.dart';
import 'package:smartring_flutter/src/core/health/bp/bpEngine.dart';
import 'package:smartring_flutter/src/core/health/ecg/ecgEngine.dart';
import 'package:smartring_flutter/src/core/health/ox/oxEngine.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';
import 'package:smartring_flutter/src/core/health/temperature/TemperatureEngine.dart';
import 'package:smartring_flutter/src/core/protocol/OriginData.dart';
import 'package:smartring_flutter/src/core/common/baseCommon.dart';
import 'package:smartring_flutter/src/core/hc03_sdk.dart';

class Hc03SdkImpl extends Hc03Sdk {
  factory Hc03SdkImpl() => _hc03SdkImplSingleton;
  final SyncManager _syncManager = SyncManager();

  Hc03SdkImpl._internal();

  static final Hc03SdkImpl _hc03SdkImplSingleton = Hc03SdkImpl._internal();

  final TemperatureEngine _temperatureEngine = TemperatureEngine();

  final OxEngine _oxEngine = OxEngine();
  final BgEngine _bgEngine = BgEngine();
  final BpEngine _bpEngine = BpEngine();
  final BatteryEngine _batteryEngine = BatteryEngine();
  final EcgEngine _ecgEngine = EcgEngine();
  bool isEcgMeasure = false;

  @override
  Uint8List startDetect(Detection detect) {
    Uint8List data;
    switch (detect) {
      case Detection.ECG:
        isEcgMeasure = true;
        _ecgEngine.start();
        data = BaseCommon.obtainCommandData(
            BaseCommon.ELECTROCARDIOGRAM, [BaseCommon.ECG_START]);
        break;
      case Detection.BT:
        data = BaseCommon.obtainCommandData(
            BaseCommon.TEMPERATURE, [BaseCommon.TEP_START_NORMAL]);
        break;
      case Detection.OX:
        _oxEngine.init();
        data = BaseCommon.obtainCommandData(BaseCommon.OX_REQ_TYPE_NORMAL,
            [BaseCommon.OX_REQ_CONTENT_START_NORMAL]);
        break;
      case Detection.BG:
        data = BaseCommon.obtainCommandData(
            BaseCommon.BLOOD_GLUCOSE, [BaseCommon.TEST_PAPER_GET_VER]);
        _bgEngine.init();
        break;
      case Detection.BP:
        data = BaseCommon.obtainCommandData(BaseCommon.BP_REQ_TYPE,
            [BaseCommon.BP_REQ_CONTENT_CALIBRATE_PARAMETER]);
        break;
      case Detection.BATTERY:
        data = BaseCommon.obtainCommandData(
            BaseCommon.CHECK_BATTARY, [BaseCommon.BATTERY_QUERY]);
        break;
    }
    return data;
  }

  @override
  stopDetect(Detection detect) {
    Uint8List data;
    switch (detect) {
      case Detection.ECG:
        isEcgMeasure = false;
        _ecgEngine.stop();
        data = BaseCommon.obtainCommandData(
            BaseCommon.ELECTROCARDIOGRAM, [BaseCommon.ECG_STOP]);
        break;
      case Detection.BT:
        data = BaseCommon.obtainCommandData(
            BaseCommon.TEMPERATURE, [BaseCommon.TEP_STOP_NORMAL]);
        break;
      case Detection.OX:
        data = BaseCommon.obtainCommandData(BaseCommon.OX_REQ_TYPE_NORMAL,
            [BaseCommon.OX_REQ_CONTENT_STOP_NORMAL]);
        break;
      case Detection.BG:
        data = BaseCommon.obtainCommandData(
            BaseCommon.BLOOD_GLUCOSE, [BaseCommon.TEST_PAPER_ADC_STOP]);
        break;
      case Detection.BP:
        data = BaseCommon.obtainCommandData(BaseCommon.BP_REQ_TYPE,
            [BaseCommon.BP_REQ_CONTENT_STOP_CHARGING_GAS]);
        break;
      default:
        return Uint8List(0);
    }
    return data;
  }

  @override
  void parseData(List<int> data) {
    if (isEcgMeasure) {
      _ecgEngine.run(data);
      return;
    }
    var rawData = BaseCommon.generalUnpackRawData(data);
    if (rawData is OriginData) {
      switch (rawData.type) {
        case BaseCommon.BT_RES_TYPE:
          _temperatureEngine.run(rawData.data);
          break;
        case BaseCommon.OX_RES_TYPE_NORMAL:
          _oxEngine.run(rawData.data);
          break;
        case BaseCommon.BG_RES_TYPE:
          _bgEngine.run(rawData.data);
          break;
        case BaseCommon.BP_RES_TYPE:
          _bpEngine.run(rawData.data);
          break;
        case BaseCommon.RESPONSE_CHECK_BATTERY:
          _batteryEngine.run(rawData.data);
          break;
        default:
          break;
      }
    }
  }

  @override
  Future<Hc03BaseMeasurementData> getTemperature() =>
      _syncManager.getTemperatureData();

  @override
  Future<
      ({
        Stream<Hc03BaseMeasurementData> data,
        Stream<Hc03BaseMeasurementData> stop,
      })> getBloodOxygen() async => _syncManager.getBloodOxygen();

  @override
  Stream<Hc03BaseMeasurementData> getBloodGlucoseData() =>
      _syncManager.bloodGlucoseCatchData();

  @override
  void setTestPaperModel(int index) => _bgEngine.setPaperModel(index);

  @override
  Stream<Hc03BaseMeasurementData> getBloodPressureData() =>
      _syncManager.bloodPressureCatchData();

  @override
  Future<Hc03BaseMeasurementData> getBattery() =>
      _syncManager.getBatteryLevel();

  @override
  Stream<Hc03BaseMeasurementData> getEcgData() => _syncManager.ecgCatchData();
}
