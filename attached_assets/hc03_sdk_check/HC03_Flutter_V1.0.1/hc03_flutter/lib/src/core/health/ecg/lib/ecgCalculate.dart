import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';

class EcgCalculate {
  static final EcgCalculate _instance = EcgCalculate._internal();
  factory EcgCalculate() {
    return _instance;
  }
  EcgCalculate._internal();

  final SyncManager _syncManager = SyncManager();

  var channel =
      const BasicMessageChannel('ecgMessageChannel', StandardMessageCodec());

  void init() {
    channel.setMessageHandler((message) {
      if (message is Map) {
        _syncManager.disPatchEcgData(message);
      }
      return Future(() => null);
    });
  }

  void start() async{
    if (Platform.isIOS) {
      await channel.send("start");
    }
  }

  void stop()async{
    if (Platform.isIOS) {
      await channel.send("stop");
    }
  }

  void dealData(data) async {
    await channel.send(Int8List.fromList(data));
  }
}
