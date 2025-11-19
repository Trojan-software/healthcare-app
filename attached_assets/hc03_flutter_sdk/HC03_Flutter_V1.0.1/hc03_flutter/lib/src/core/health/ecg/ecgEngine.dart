import 'package:smartring_flutter/src/core/engine/Engine.dart';
import 'package:smartring_flutter/src/core/health/ecg/lib/ecgCalculate.dart';

class EcgEngine extends Engine {
  final EcgCalculate _ecgCalculate = EcgCalculate();
  EcgEngine() {
    _ecgCalculate.init();
  }

  void start(){
    _ecgCalculate.start();
  }

  void stop(){
    _ecgCalculate.stop();
  }

  @override
  void run(List<int> data) {
    _ecgCalculate.dealData(data);
  }
}
