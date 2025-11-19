// ignore_for_file: constant_identifier_names
import 'dart:typed_data';

import 'package:smartring_flutter/src/core/protocol/Exception.dart';
import 'package:smartring_flutter/src/core/protocol/OriginData.dart';

enum Process {
  START,
  RESUME,
  OPERATION,
  RUNNING,
  PAUSE,
  END,
  BP_CAL_TEMP,
  BP_CAL_ZERO,
  BP_START_QUICK_GAS,
  BP_CHANGE_CHARGING_SPEED,
  BP_START_PWM_GAS_ARM,
  BP_START_PWM_GAS_WRIST,
}

class BaseCommon {
  /// ********************battery*****************************
  //request
  static const BATTERY_QUERY = 0x00;
  static const CHECK_BATTARY = 0x0f;
  //response
  static const RESPONSE_CHECK_BATTERY = 0x8f;

  /// ********************blood pressure*****************************
  // constants for blood pressure
  // request
  static const BP_REQ_TYPE = 0x01;
  static const BP_REQ_CONTENT_CALIBRATE_PARAMETER = 0x01;
  static const BP_REQ_CONTENT_CALIBRATE_TEMPERATURE = 0x02;
  static const BP_REQ_CONTENT_CALIBRATE_ZERO = 0x03;
  static const BP_REQ_CONTENT_START_QUICK_CHARGING_GAS = 0x04;
  static const BP_REQ_CONTENT_START_PWM_CHARGING_GAS_ARM = 0x05;
  static const BP_REQ_CONTENT_START_PWM_CHARGING_GAS_WRIST = 0x06;
  static const BP_REQ_CONTENT_STOP_CHARGING_GAS = 0x07;
  static const BP_REQ_CONTENT_STOP_CARGING_SPEED = 0x08;
  static const BP_REQ_CONTENT_PWM_GAS = 0x55;

  // response
  static const BP_RES_TYPE = 0x81;
  static const BP_RES_CONTENT_CALIBRATE_PARAMETER = 0x01;
  static const BP_RES_CONTENT_CALIBRATE_TEMPERATURE = 0x02;
  static const BP_RES_CONTENT_PRESSURE_DATA = 0x03;

  /// ********************blood glucose*****************************
  /// constants for blood glucose
  /// request
  static const BLOOD_GLUCOSE = 0x03;

  static const TEST_PAPER_QUERY = 0x00;
  static const TEST_PAPER_GET_VER = 0x01;
  static const TEST_PAPER_CHECK_PAPER = 0x02;
  static const TEST_PAPER_ADC_START = 0x03;
  static const TEST_PAPER_ADC_STOP = 0x04;
  static const CMD_ACK = 0x10;
  static const RESPONSE_BLOOD_SUGAR = 0x83;
  static const TEST_PAPER_SET_VER = 0xef;

  /// response
  static const BG_RES_TYPE = 0x83;

  /// ********************Blood oxygen*****************************
  /// constant for ox
  static const OXSamplingRate = {
    "HZ125": 125,
    "HZ250": 250,
    "HZ500": 500,
  };

  ///request type
  static const OX_REQ_TYPE_NORMAL = 0x04;
  static const OX_REQ_TYPE_FAST = 0x06;

  ///control command
  static const OX_REQ_CONTENT_START_NORMAL = 0x00;
  static const OX_REQ_CONTENT_START_FAST = 0x02;
  static const OX_REQ_CONTENT_STOP_NORMAL = 0x01;
  static const OX_REQ_CONTENT_STOP_FAST = 0x02;

  ///response type
  static const OX_RES_TYPE_NORMAL = 0x84;
  /**********************temperature****************************** */
  ///request type
  static const TEMPERATURE = 0x02;

  ///control command
  static const TEP_START_NORMAL = 0x00;
  static const TEP_STOP_NORMAL = 0x01;

  ///response type
  static const BT_RES_TYPE = 0x82;
  /*********************ecg******************************* */
  ///request type
  static const ELECTROCARDIOGRAM = 0x05; //心电蓝牙指令
  ///control command
  static const ECG_START = 0x01;
  static const ECG_STOP = 0x02;

  /// *****************************************************

  static const int PACKAGE_TOTAL_LENGTH = 10;
  static const int PACKAGE_INDEX_START = 0;
  static const int PACKAGE_INDEX_LENGTH = 1;
  static const int PACKAGE_INDEX_BT_EDITION = 3;
  static const int PACKAGE_INDEX_TYPE = 4;
  static const int PACKAGE_INDEX_HEADER_CRC = 5;
  static const int PACKAGE_INDEX_CONTENT = 6;
  static const int PACKAGE_INDEX_HEAD_CRC = 5;
  static const int PACKAGE_INDEX_TAIL_CRC = -3;
  static const int PACKAGE_INDEX_END = -1;
  static const int ATTR_START_REQ = 0x01;
  static const int ATTR_START_RES = 0x02;
  static const int BT_EDITION = 0x04;
  static const int ATTR_END_REQ = 0xff;
  static const int INDEX_END = -1;
  static const int MAX_DATA_SIZE = 20; //The length of a Bluetooth data packet
  static const int FULL_PACKAGE_MAX_DATA_SIZE =
      11; //The maximum allowed data length for whole package data
  static int cacheType = 0;
  static Map<int, List<int>> cacheMap = {};
  //Bluetooth packaging
  static Uint8List obtainCommandData(type, List<int> cmd) {
    int totalLen = PACKAGE_TOTAL_LENGTH + cmd.length - 1;
    Uint8List buffer = Uint8List(totalLen);
    ByteData view = ByteData.view(buffer.buffer);
    // fill start
    view.setUint8(PACKAGE_INDEX_START, ATTR_START_REQ);
    // fill length
    view.setUint16(PACKAGE_INDEX_LENGTH, cmd.length, Endian.little);
    // fill bluetooth edition
    view.setUint8(PACKAGE_INDEX_BT_EDITION, BT_EDITION);
    // fill type
    view.setUint8(PACKAGE_INDEX_TYPE, type);
    // general encry header
    int entryHead =
        encryHead(buffer.getRange(0, PACKAGE_INDEX_HEAD_CRC).toList());
    // fill encry head
    view.setUint8(PACKAGE_INDEX_HEADER_CRC, entryHead);
    // fill content
    for (int i = 0; i < cmd.length; i++) {
      view.setUint8(PACKAGE_INDEX_CONTENT + i, cmd[i]);
    }
    int tailIndex = totalLen + PACKAGE_INDEX_TAIL_CRC;
    // general encry tail
    int tail = encryTail(buffer.getRange(0, tailIndex).toList());
    // fill encry tail
    view.setUint16(tailIndex, tail, Endian.little);
    // fill end
    view.setUint8(totalLen + PACKAGE_INDEX_END, ATTR_END_REQ);
    return buffer;
  }

  static dynamic generalUnpackRawData(List<int> rawData) {
    ByteBuffer buffer = Uint8List.fromList(rawData).buffer;
    ByteData view = ByteData.view(buffer);
    int byteLength = view.lengthInBytes;
    if (byteLength < PACKAGE_TOTAL_LENGTH - 1) {
      return AppException(
          message: "rawData length is less than PACKAGE_TOTAL_LENGTH",
          type: ExceptionType.INSUFFICIENT_DATA_LENGTH);
    }

    int start = view.getUint8(PACKAGE_INDEX_START);
    int length = view.getUint16(PACKAGE_INDEX_LENGTH, Endian.little);
    int btEdition = view.getInt8(PACKAGE_INDEX_BT_EDITION);
    int type = view.getUint8(PACKAGE_INDEX_TYPE);
    int headerCrc = view.getUint8(PACKAGE_INDEX_HEADER_CRC);
    int checkEncryHead = encryHead(Uint8List.view(buffer, PACKAGE_INDEX_START,
            PACKAGE_INDEX_HEADER_CRC - PACKAGE_INDEX_START)
        .toList());
    bool isFull = btEdition == BT_EDITION &&
        start == ATTR_START_RES &&
        headerCrc == checkEncryHead &&
        length <= FULL_PACKAGE_MAX_DATA_SIZE;
    bool isHead = isFull ||
        (!isFull &&
            btEdition == BT_EDITION &&
            start == ATTR_START_RES &&
            headerCrc == checkEncryHead);
    bool isTail = isFull || (!isFull && !isHead);
    List<int> data=[];
    if (isFull) {
      int tailCrc =
          view.getUint16(PACKAGE_INDEX_CONTENT + length, Endian.little);
      int checkEncryTail = encryTail(Uint8List.view(buffer, PACKAGE_INDEX_START,
              PACKAGE_INDEX_CONTENT + length - PACKAGE_INDEX_START)
          .toList());
      if (tailCrc != checkEncryTail) {
        return AppException(
            message: "Invalid Data", type: ExceptionType.INVALID_DATA);
      }
      data = Uint8List.view(buffer, PACKAGE_INDEX_CONTENT, length).toList();
    } else {
      if (isHead) {
        cacheMap.clear();
        cacheType = type;
        cacheMap.addAll({type: rawData});
        return null;
      }
      if (isTail) {
        if (cacheType == 0 || !cacheMap.containsKey(cacheType)) {
          cacheType = 0;
          cacheMap.clear();
          return AppException(
              message: "missing tail data",
              type: ExceptionType.MISSING_TAIL_DATA);
        }
        List<int> allData = [...cacheMap[cacheType]!, ...rawData];
        ByteBuffer buffer = Uint8List.fromList(allData).buffer;
        ByteData view = ByteData.view(buffer);
        length = view.getUint16(PACKAGE_INDEX_LENGTH, Endian.little);
        type = view.getUint8(PACKAGE_INDEX_TYPE);

        data = Uint8List.view(buffer, PACKAGE_INDEX_CONTENT, length).toList();
        cacheType = 0;
        cacheMap.clear();
      }
    }

    return OriginData(type: type, data: data);
  }

  ///crc
  static int encryHead(List<int> data) {
    Int8List int8list = Int8List.fromList(data);
    int result = 0;
    int transe = 0;

    for (int i = 0; i < int8list.length; i++) {
      transe = int8list[i] & 0xff;
      result ^= transe;
      result &= 0xffff;
    }

    return result;
  }

  ///crc
  static int encryTail(List<int> data) {
    Int8List dataView = Int8List.fromList(data);
    int result = 0xffff;
    int transe = 0;

    for (var it in dataView) {
      transe = it & 0xff;
      result = ((result >> 8) & 0xff) | (result << 8);
      result &= 0xffff;
      result ^= transe;
      result &= 0xffff;
      result ^= (result & 0xff) >> 4;
      result &= 0xffff;
      result ^= (result << 8) << 4;
      result &= 0xffff;
      result ^= ((result & 0xff) << 4) << 1;
      result &= 0xffff;
    }
    return result;
  }
}
