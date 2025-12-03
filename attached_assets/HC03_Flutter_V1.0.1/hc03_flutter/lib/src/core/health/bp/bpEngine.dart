import 'package:smartring_flutter/src/core/health/bp/lib/bpCalculate.dart';
import 'package:smartring_flutter/src/core/common/baseCommon.dart';
import 'package:smartring_flutter/src/core/engine/Engine.dart';
import 'package:smartring_flutter/src/core/protocol/Exception.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';

class BpEngine extends Engine {
  final BpCalculate _calculate = BpCalculate();
  final SyncManager _syncManager = SyncManager();
  BpEngine();

  @override
  void run(List<int> data) {
    if (data.isEmpty) {
      _syncManager.bloodOxygenCatchError(
          message: "Invalid Data", type: ExceptionType.INVALID_DATA);
      throw ArgumentError("Invalid Data Of Blood Pressure!");
    }
    switch (data[0] & 0xff) {
      case BaseCommon.BP_RES_CONTENT_CALIBRATE_PARAMETER:
        _calculate.calibrateParameter(data);
        break;
      case BaseCommon.BP_RES_CONTENT_CALIBRATE_TEMPERATURE:
        _calculate.calibrateTemperature(data);
        break;
      case BaseCommon.BP_RES_CONTENT_PRESSURE_DATA:
        _calculate.handlePressureData(data);
        break;
      default:
        break;
    }
  }
}
