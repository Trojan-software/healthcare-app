// ignore_for_file: non_constant_identifier_names, constant_identifier_names

import 'dart:async';
import 'dart:math';

import 'package:get/get.dart';
import 'package:smartring_flutter/src/core/health/bg/lib/bgCommon.dart';
import 'package:smartring_flutter/src/core/common/baseCommon.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';

class BloodGlucose {
  static final BloodGlucose _instance = BloodGlucose._internal();
  final SyncManager _syncManager = SyncManager();
  factory BloodGlucose() {
    return _instance;
  }

  BloodGlucose._internal();

  static const TEST_PAPER_STAGE_IDLE = 0x00;
  static const EXCEPTION_PAPER_OUT = 0x00;
  static const TEST_PAPER_STAGE_CHECK_PAPER_SUBIDLE = 0x00;
  static const TEST_PAPER_DATA_TYPE_NORMAL = 0x00;
  static const TEST_PAPER_STAGE_GET_VER = 0x01;
  static const EVENT_PAPER_IN = 0x01;
  static const TEST_PAPER_DATA_TYPE_SET_VER = 0x01;
  static const TEST_PAPER_STAGE_CHECK_PAPER_SUBHAS = 0x01;
  static const TEST_PAPER_STAGE_CHECK_PAPER = 0x02;
  static const TEST_PAPER_STAGE_CHECK_PAPER_SUBNO = 0x02;
  static const TEST_PAPER_DATA_TYPE_JIAOYAN = 0x02;
  static const TEST_PAPER_STAGE_CHECK_BLOOD = 0x03;
  static const TEST_PAPER_STAGE_CAL = 0x04;

  List<int> dataParse = [];
  List<int> bgData = [];
  bool isModuleExist = false;
  bool getLongData = false;
  int bgVer = 0;
  int bsStage = 0x00;
  int bgValCounts = 0;
  int bgValCalCounts = 0;
  int bgPaperOk = 0;
  int dataType = 0x00;
  int bsStageCheckPaperSub = 0;
  int maxDataSize = 110;
  int ARRAY_SIZE = 233;
  int pageColumnIndex = 0;
  bool isStartCount = false;
  var timer;
  bool mCalculating = false;

  setModuleExist(bool isExist) {
    isModuleExist = isExist;
  }

  init() {
    bsStage = TEST_PAPER_STAGE_GET_VER;
    bgVer = 0;
    bgValCounts = 0;
    bgValCalCounts = 0;

    bgPaperOk = 0;
    dataType = 0x00;
    bgData.length = 0;
    mCalculating = false;
  }

  setPaperIndex(int index) {
    pageColumnIndex = index;
  }

  checkBsPaper() {
    bsStage = TEST_PAPER_STAGE_CHECK_PAPER;
    _syncManager.sendBgCmd(
        BaseCommon.BLOOD_GLUCOSE, [BaseCommon.TEST_PAPER_CHECK_PAPER]);
  }

  stop() {
    bsStage = TEST_PAPER_STAGE_IDLE;
    bsStageCheckPaperSub = TEST_PAPER_STAGE_CHECK_PAPER_SUBIDLE;
    stopBgAdc();
  }

  stopBgAdc() {
    _syncManager
        .sendBgCmd(BaseCommon.BLOOD_GLUCOSE, [BaseCommon.TEST_PAPER_ADC_STOP]);
  }

  startBsAdc() {
    bsStage = TEST_PAPER_STAGE_CHECK_BLOOD;
    _syncManager
        .sendBgCmd(BaseCommon.BLOOD_GLUCOSE, [BaseCommon.TEST_PAPER_ADC_START]);
  }

  checkPaperStage(int data) {
    switch (bsStageCheckPaperSub) {
      case TEST_PAPER_STAGE_CHECK_PAPER_SUBIDLE:
        if (data == EXCEPTION_PAPER_OUT) {
          stop();
        } else {
          startBsAdc();
        }
        testPaperState(data);
        break;
      case TEST_PAPER_STAGE_CHECK_PAPER_SUBHAS:
      case TEST_PAPER_STAGE_CHECK_PAPER_SUBNO:
        if (data == EVENT_PAPER_IN) {
          startBsAdc();
        }
        break;
      default:
        break;
    }
  }

  testPaperState(int data) {
    if (data == EVENT_PAPER_IN) {
      _syncManager.dispatchBgPaperState(1, "Test strip inserted.");
    } else {
      _syncManager.dispatchBgPaperState(2, "The test paper is not inserted.");
    }
  }

  paperStatusChange(int data) {
    switch (bsStage) {
      case TEST_PAPER_STAGE_CHECK_PAPER:
        checkPaperStage(data);
        break;
      case TEST_PAPER_STAGE_CHECK_BLOOD:
      case TEST_PAPER_STAGE_CAL:
        if (data == EXCEPTION_PAPER_OUT) {
          bsStage = TEST_PAPER_STAGE_IDLE;
          bsStageCheckPaperSub = TEST_PAPER_STAGE_CHECK_PAPER_SUBIDLE;
          stop();
        }
        break;
      default:
        break;
    }
  }

  paperReady() {
    _syncManager.dispatchBgPaperState(
        3, "Please drop the blood sample into the test paper.");
  }

  dealBsVal(List<int> data) {
    int bgResistance = 0;
    int bgVal = (data[0] << 8) + (data[1] & 0xff);
    bgValCounts++;
    if (bgValCounts < 11) {
      bgPaperOk += bgVal;
    } else if (bgValCounts == 11) {
      bgPaperOk = (bgPaperOk + 4) ~/ 10;
      if (bgPaperOk == bgVer) {
        paperReady();
      } else {
        bgResistance = (bgVer * 110) ~/ (bgPaperOk - bgVer);
        if (bgResistance.obs() < 2000) {
          _syncManager.dispatchBgPaperState(4,
              "The test paper has been used, please replace it with a new one.");
          stop();
        } else {
          paperReady();
        }
      }
    } else if (bgValCounts < 1200 && bsStage == TEST_PAPER_STAGE_CHECK_BLOOD) {
      if (bgVal - bgVer != 0) {
        bgResistance = (bgVer * 110.0) ~/ (bgVal - bgVer);
      }
      if (bgResistance < 4000 && bgResistance > 0) {
        bsStage = TEST_PAPER_STAGE_CAL;

        _syncManager.dispatchBgPaperState(5,
            "A blood sample has been collected and the value is being calculated. Please wait.");

        if (!isStartCount) {
          isStartCount = true;
          timer = Timer(const Duration(minutes: 3), () {
            timeout();
          });
        }
      }
    } else if (bsStage == TEST_PAPER_STAGE_CAL) {
      if (mCalculating) return;
      bgValCalCounts++;
      if (bgVal - bgVer != 0) {
        bgResistance = (bgVer * 110.0) ~/ (bgVal - bgVer);
      }
      if (!getLongData && bgResistance < 4000 && bgResistance > 0) {
        if (bgData.isNotEmpty && bgResistance < bgData.reduce(min)) {
          bgData.length = 0;
        }
        bgData.add(bgResistance);
        if (bgData.length == maxDataSize) {
          calBg(bgData);
          mCalculating = true;
        }

        if (bgValCalCounts == 1200) {

          if (isStartCount) {
            isStartCount = false;
            timer?.cancel();
          }
          _syncManager.dispatchBgPaperResult(0.toDouble());
          stop();
        }
      }
    }
  }

  timeout() {
    stop();
    _syncManager.dispatchBgPaperState(6, "Calculate sample value timeout");
  }

  calBg(List<int> list) {
    var result = newCalBs(list);
    if (isStartCount) {
      isStartCount = false;
      timer?.cancel();
    }
    _syncManager.dispatchBgPaperResult(result);
    stop();
  }

  newCalBs(List<int> list) {
    var last = 0;
    int first = list[0];
    var start = 96;
    var end = 105;
    for (int index = start; index < end; index++) {
      last += list[index];
    }
    last = last ~/ (end - start);
    double reg = (last - first) * 9.25 + first;
    var result = getBsValueResult(reg);
    if (result >= 10.0) {
      result *= 0.75;
    } else if (result >= 5.0) {
      result *= 0.8;
    }

    return double.parse(result.toStringAsFixed(1));
  }

  getBsValueResult(reg) {
    int index = getBgValue(reg);

    return pageData[pageColumnIndex][index];
  }

  int getBgValue(data) {
    var temp1;
    var temp2;
    int i;
    for (i = 0; i < ARRAY_SIZE; i++) {
      if (data < bsRe[i]) break;
    }
    if (i > 0 && i < ARRAY_SIZE) {
      temp1 = bsRe[i] - data;
      temp2 = data - bsRe[i - 1];
      if (temp1 > temp2) i -= 1;
    }
    if (i < ARRAY_SIZE) return i;
    return 300;
  }

  dealData(List<int> bytes) {
    switch (bytes[0]) {
      case BaseCommon.TEST_PAPER_QUERY:
        setModuleExist(bytes[1] == 1);
        break;
      case BaseCommon.TEST_PAPER_GET_VER:
        bgVer = (bytes[1] << 8) + (bytes[2] & 0xff);
        if (bsStage == TEST_PAPER_STAGE_GET_VER) {
          checkBsPaper();
        }
        break;
      case BaseCommon.TEST_PAPER_CHECK_PAPER:
        _syncManager.sendBgCmd(
            BaseCommon.CMD_ACK, [BaseCommon.RESPONSE_BLOOD_SUGAR, bytes[1]]);
        Timer(const Duration(milliseconds: 200), () {
          paperStatusChange(bytes[1]);
        });
        break;
      case BaseCommon.TEST_PAPER_ADC_START:
        if (dataType == TEST_PAPER_DATA_TYPE_NORMAL) {
          if (bsStage == TEST_PAPER_STAGE_CHECK_BLOOD ||
              bsStage == TEST_PAPER_STAGE_CAL) {
            dataParse = bytes.sublist(1, 3);
            if (bgVer == 0) {
              bgVer = 619;
            }
            dealBsVal(dataParse);
          }
        } else if (dataType == TEST_PAPER_DATA_TYPE_SET_VER) {
          dataParse = bytes.sublist(1, 3);
          dealBgValSetVer(dataParse);
        } else if (dataType == TEST_PAPER_DATA_TYPE_JIAOYAN) {
          dataParse = bytes.sublist(1, 3);
          dealBsValCalibration(dataParse);
        }
        break;
      case BaseCommon.TEST_PAPER_SET_VER:

        break;
      default:
        break;
    }
  }

  dealBgValSetVer(List<int> data) {
    var bgVal = (data[0] << 8) + (data[1] & 0xff);
    bgValCounts++;
    if (bgValCounts < 11) {
      bgVer += bgVal;
    } else if (bgValCounts == 11) {
      bgVer = (bgVer + 4) ~/ 10;
      stopBgAdc();
    }
  }

  dealBsValCalibration(List<int> data) {
    // var bgResistance = 0;
    bgValCounts++;
    if (bgValCounts == 1) {
      stopBgAdc();
      // var bgVal = (data[0] << 8) + (data[1] & 0xff);
      // if (bgVal - bgVer != 0) {
      //   bgResistance = (bgVer * 110.0) ~/ (bgVal - bgVer);
      // }
    }
  }
}
