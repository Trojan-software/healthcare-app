import 'package:smartring_flutter/src/core/engine/Engine.dart';
import 'package:smartring_flutter/src/core/health/ox/lib/calculate.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';
import 'package:smartring_flutter/src/core/protocol/Exception.dart';

class OxEngine extends Engine {
  Calculate? calculate;
  final SyncManager _syncManager = SyncManager();
  OxEngine() {
    calculate = Calculate();
  }
  init(){
    calculate?.init();
  }
  @override
  void run(List<int> data) {
    var list = resolveData(data);
    for (int i = 0; i < list.length; i += 2) {
      calculate?.addSignalData(list[i], list[i + 1]);
    }
  }

  resolveData(List<int> data) {
    if (data.length <= 30) {
      _syncManager.bloodOxygenCatchError(
          message: "The Data Is Incomplete",
          type: ExceptionType.OX_ERR_DATA_INCOMPLETE);
      throw Exception("Invalid Data,The Data Is Incomplete!");
    }
    List<int> result = [];
    for (int i = 0; i < 30; i += 3) {
      var first = (data[i] & 0xff) << 16;
      var second = (data[i + 1] & 0xff) << 8;
      var third = data[i + 2] & 0xff;
      result.add(first + second + third);
    }
    return result;
  }
}
