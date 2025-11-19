import 'package:smartring_flutter/src/core/sync/syncManager.dart';

class Battery {
  static const QUERY = 0x00;
  static const CHARGING = 0x01;
  static const FULLY = 0x02;
  bool isCharging = false;

  static final Battery _instance = Battery._internal();
  final SyncManager _syncManager = SyncManager();
  factory Battery() {
    return _instance;
  }
  Battery._internal();

  void dealData(List<int> bytes) {
    switch (bytes[0]) {
      case QUERY:
        int batteryValue = ((bytes[1] & 0xff) << 8) + (bytes[2] & 0xff);
        int level = getLevel(batteryValue);
        isCharging = false;
        _syncManager.batteryCatchData(level);
        break;
      case CHARGING:
        isCharging = true;
        _syncManager.batteryCatchChargeStatus(isCharging);
        break;
      case FULLY:
        isCharging = false;
        _syncManager.batteryCatchData(100);
        break;
      default:
        break;
    }
  }

  getLevel(int d) {
    int data = ((d / 8191) * 3.3 * 3 * 1000).toInt();
    if (data >= 4090) {
      return 100;
    } else if (data < 4090 && data >= 4070) {
      return 99;
    } else if (data < 4070 && data >= 4056) {
      return 97;
    } else if (data < 4056 && data >= 4040) {
      return 95;
    } else if (data < 4040 && data >= 4028) {
      return 93;
    } else if (data < 4028 && data >= 4000) {
      return 91;
    } else if (data < 4000 && data >= 3980) {
      return 86;
    } else if (data < 3980 && data >= 3972) {
      return 83;
    } else if (data < 3972 && data >= 3944) {
      return 78;
    } else if (data < 3944 && data >= 3916) {
      return 73;
    } else if (data < 3916 && data >= 3888) {
      return 69;
    } else if (data < 3888 && data >= 3860) {
      return 65;
    } else if (data < 3860 && data > 3832) {
      return 61;
    } else if (data < 3832 && data > 3804) {
      return 56;
    } else if (data < 3804 && data > 3776) {
      return 50;
    } else if (data < 3776 && data > 3748) {
      return 42;
    } else if (data < 3748 && data > 3720) {
      return 30;
    } else if (data < 3720 && data > 3692) {
      return 19;
    } else if (data < 3692 && data > 3664) {
      return 15;
    } else if (data < 3664 && data > 3636) {
      return 11;
    } else if (data < 3636 && data > 3608) {
      return 8;
    } else if (data < 3608 && data > 3580) {
      return 7;
    } else if (data < 3580 && data > 3524) {
      return 6;
    } else if (data < 3524 && data > 3468) {
      return 5;
    } else if (data < 3468 && data > 3300) {
      return 4;
    }
    return 0;
  }
}
