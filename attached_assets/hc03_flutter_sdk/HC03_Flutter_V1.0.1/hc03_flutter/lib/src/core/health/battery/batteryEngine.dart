import 'package:smartring_flutter/src/core/engine/Engine.dart';
import 'package:smartring_flutter/src/core/health/battery/lib/battery.dart';

class BatteryEngine extends Engine {
  BatteryEngine();
  final Battery _battery = Battery();

  @override
  void run(List<int> data) {
    _battery.dealData(data);
  }
}
