import 'package:smartring_flutter/src/core/health/bg/lib/bloodglucose.dart';
import 'package:smartring_flutter/src/core/engine/Engine.dart';

class BgEngine extends Engine {
  final BloodGlucose _bg = BloodGlucose();
  BgEngine();

  init() {
    _bg.init();
  }

  setPaperModel(int index) {
    _bg.setPaperIndex(index);
  }

  @override
  void run(List<int> data) {
    _bg.dealData(data);
  }
}
