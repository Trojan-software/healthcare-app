import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:smartring_flutter/src/core/health/bp/lib/arithmetic.dart';
import 'package:smartring_flutter/src/core/common/baseCommon.dart';
import 'package:smartring_flutter/src/core/protocol/Exception.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';

class BpCalculate {
  static final BpCalculate _instance = BpCalculate._internal();
  final SyncManager _syncManager = SyncManager();

  factory BpCalculate() {
    return _instance;
  }

  BpCalculate._internal();

  final int AVERAGE_NUM = 5;
  final int AVERAGE_NUM_SEC = 5;
  final int AVERAGE_NUM_THIR = 10;
  final int SAMPLE_N = 1;
  final int SAMPLE_N_2 = 10;
  final int REC_NUM = 100;
  int max = 0;
  int length = 0;
  List<int> tempA = List.filled(500, 0);
  List<int> tempB = List.filled(500, 0);
  List<int> tempC = List.filled(500, 0);
  //  static s1: Array<string>;

  int heightNum = 0;
  int heightNumPre = 0;
  int heightNumFlag = 0;
  int filterNum = 0;

  List<int> DATA_RES = List.generate(8000, (index) => 0);
  List<int> DATA_AVE = List.generate(8000, (index) => 0);
  List<int> DATA_SAM = List.generate(8000, (index) => 0);
  List<int> DATA_SAM_2 = List.generate(800, (index) => 0);
  List<int> DATA_SAM_3 = List.generate(800, (index) => 0);
  List<int> DATA_FIR = List.generate(8000, (index) => 0);
  List<int> DATA_IIR = List.generate(800, (index) => 0);

  int resLen = 0;
  int aveLen = 0;
  int aveSecLen = 0;
  int firLen = 0;
  int iirLen = 0;
  List<int> DATA_AVE_SEC = List.generate(8000, (index) => 0);
  List<int> DATA_AVE_THIR = List.generate(8000, (index) => 0);
  List<int> DATA = List.generate(500, (index) => 0);

  int c1 = 0;
  int c2 = 0;
  int c3 = 0;
  int c4 = 0;
  int c5 = 0;
  int zero = 0;
  int spt25x = 0;

  List<int> s = List.filled(8000, 0);
  List<int> data = List.filled(50, 0);

  int stageFlag = 0;
  int hr = 0;
  int pd = 0;
  int ps = 0;
  int sumBP = 0;
  int sumZero = 0;
  int equipType = 0;

  List<int> BpDataList = [0, 0, 0, 0, 0];

  int preAveragePressure = 0;
  int nowAveragePressure = 0;
  int preSpeedPressure = 0;
  int nowSpeedPressure = 0;
  int prePWM = 0;

  int pwmChange = 0;

  int startTs = 0;
  bool isStop = false;
  int s1Count = 0;
  int sCount = 0;

  initBpParam() {
    firLen = 0;
    iirLen = 0;
    resLen = 0;
    aveLen = 0;
    aveSecLen = 0;
    max = 0;
    heightNum = 0;
    heightNumPre = 0;
    heightNumFlag = 0;
    length = 0;
  }

  ras(int sCount, List<int> s) {
    filterNum = sCount;
    int startAveLen = 0;
    int len = filterNum ~/ SAMPLE_N;
    if (aveLen == 0) {
      startAveLen = 0;
    } else {
      startAveLen = aveLen;
    }
    aveLen = len;
    averageFilter(DATA_AVE, s, startAveLen, filterNum, AVERAGE_NUM);
    sample(DATA_SAM, DATA_AVE, filterNum);
  }

  fag() {
    int startFirLen = 0;
    if (firLen == 0) {
      startFirLen = 428;
    } else {
      startFirLen = firLen;
    }
    firLen = filterNum ~/ SAMPLE_N;
    firBandPass218(DATA_FIR, DATA_AVE, startFirLen, filterNum ~/ SAMPLE_N);
    int startAveSecLen = 0;
    if (aveSecLen == 0) {
      startAveSecLen = 0;
    } else {
      startAveSecLen = aveSecLen;
    }
    aveSecLen = filterNum ~/ SAMPLE_N;
    averageFilter(
        DATA_AVE_SEC, DATA_FIR, startAveSecLen, filterNum, AVERAGE_NUM_SEC);
    averageFilter(
        DATA_AVE_THIR, DATA_FIR, startAveSecLen, filterNum, AVERAGE_NUM_THIR);
    getCrest2(DATA_AVE_THIR, filterNum ~/ SAMPLE_N, DATA);
    length = 0;
    for (var i = 0; i < DATA.length; i++) {
      if (DATA[i] > 0) {
        length += 1;
      }
    }
    getArrays();
  }

  int getHR() {
    if (heightNum >= 30) {
      return ((4 * 1465 * (heightNum - 15)) ~/
          (DATA[heightNum - 5] - DATA[10]));
    }
    if (heightNum >= 20) {
      return ((4 * 1465 * (heightNum - 13)) ~/
          (DATA[heightNum - 3] - DATA[10]));
    }
    if (heightNum >= 10) {
      return ((4 * 1465 * (heightNum - 6)) ~/ (DATA[heightNum - 2] - DATA[4]));
    }
    if (heightNum >= 4) {
      return ((4 * 1465 * (heightNum - 3)) ~/ (DATA[heightNum - 1] - DATA[2]));
    }
    return 60;
  }

  int getPS() {
    if (heightNum < 3) {
      return 0;
    }
    double ks = getKs(tempA[max]);
    int temp = (tempB[max] * ks).toInt();
    int j = 1;
    int ps = 0;
    if (tempB[max] < 10 ||
        tempB[heightNum - 1] >= temp ||
        max == heightNum - 1 ||
        max + 2 > heightNum ||
        (tempB[heightNum - 1] > tempB[heightNum - 2] &&
            tempB[heightNum - 2] > tempB[heightNum - 3])) {
      return 0;
    }
    while (tempB[max + j] > temp && max + j + 1 < heightNum) {
      j++;
    }

    if (max + j + 1 == heightNum) {
      return 0;
    }
    ps = tempA[max + j];
    return ps;
  }

  int getPD() {
    double kd = getKd(tempA[max]);
    int temp = (tempB[max] * kd).toInt();
    if (max <= 4) {
      int pd = 0;
      if (max == 4) {
        pd = (tempA[1] + tempA[2]) ~/ 2;
      } else if (max == 3) {
        pd = tempA[1];
      } else if (max == 2) {
        pd = (tempA[0] + tempA[1]) ~/ 2;
      } else if (max == 0) {
        pd = tempA[0] - tempA[0] ~/ 10;
      } else {
        pd = tempA[0];
      }
      return pd;
    }
    int j = max;
    while (tempB[j] >= temp && j > 0) {
      j--;
    }
    if (j > 0 && tempB[j - 1] >= temp) {
      j--;
      while (tempB[j] >= temp && j > 0) {
        j--;
      }
    }
    if (tempB[j] > temp) {
      int pos = 0;
      int i = 1;
      while (tempB[max + i] > temp && (max + i + 1) < heightNum) {
        i++;
      }
      pos = DATA[max] - (DATA[max + i] - DATA[max]);
      if (pos > 214) {
        return DATA_SAM[pos - 214];
      }
      return tempA[max] - tempA[max] ~/ 10;
    }
    if (j == 0) {
      return tempA[j] - tempA[j] ~/ 10;
    }
    return tempA[j - 1];
  }

  int getPsLast() {
    for (int i = 0; i < heightNum; i++) {
      tempC[i] = tempB[i];
    }
    gaussianProcess(tempB, max, heightNum);
    double ks = getKs(tempA[max]);
    int temp = (tempB[max] * ks).toInt();

    int j = 1;
    int ps = 0;
    while (tempB[max + j] > temp && max + j + 1 < heightNum) {
      j++;
    }
    if (max + j + 1 < heightNum) {
      if (tempB[max + j + 1] > temp) {
        j++;
        while (tempB[max + j] > temp && max + j + 1 < heightNum) {
          j++;
        }
      }
    }
    if ((tempB[max + j] == temp || tempB[max + j] == temp + 1) &&
        max + j + 1 < heightNum) {
      if (tempB[max + j] - 2 < (tempB[max + j - 1] + tempB[max + j + 1]) ~/ 2) {
        j++;
      }
    }
    ps = tempA[max + j];
    return ps;
  }

  getHeighNumFalg() {
    return heightNumFlag;
  }

  getKd(int max) {
    double kd = 0;
    int map = max ~/ 100;
    if (map > 180) {
      kd = 0.6;
    } else if (map > 140) {
      kd = 0.65;
    } else if (map > 120) {
      kd = 0.65;
    } else if (map > 60 && map <= 90) {
      kd = 0.7;
    } else if (map > 90 && map <= 100) {
      kd = (0.77 * (100 - (map - 90))) / 100;
    } else if (map > 100) {
      kd = 0.77 * 0.8;
    } else if (map > 50) {
      kd = 0.6;
    } else {
      kd = 0.5;
    }

    return kd;
  }

  getKs(int max) {
    double ks = 0;
    int map = max ~/ 100;
    if (map > 200) {
      ks = 0.54;
    } else if (map > 150) {
      ks = 0.55;
    } else if (map > 135) {
      ks = 0.58;
    } else if (map > 120) {
      ks = 0.6;
    } else if (map > 110) {
      ks = 0.7;
    } else if (map > 90) {
      ks = 0.74;
    } else if (map > 70) {
      ks = 0.72;
    } else {
      ks = 0.65;
    }

    return ks;
  }

  int preciseSumPressure() {
    int startIIRLen = 0;
    int pressure = 0;
    sample2(DATA_SAM_2, DATA_AVE, filterNum);
    if (iirLen == 0) {
      startIIRLen = 5;
    } else {
      startIIRLen = iirLen;
    }
    iirLen = filterNum ~/ SAMPLE_N_2;
    iirBandPass(DATA_IIR, DATA_SAM_2, startIIRLen, filterNum ~/ SAMPLE_N_2);

    for (int i = 0; i < iirLen; i++) {
      DATA_SAM_3[i] = DATA_SAM_2[i] - DATA_IIR[i];
    }
    for (int i = 0; i < 10; i++) {
      int len = iirLen - 10 + i;
      if (len >= 0) {
        pressure += DATA_SAM_3[iirLen - 10 + i];
      }
    }
    return pressure;
  }

  // sample 1
  int sample(List<int> dest, List<int> src, int len) {
    int result = len ~/ SAMPLE_N;
    for (int i = 0; i < len; i++) {
      dest[i ~/ SAMPLE_N] = src[i];
    }
    return result;
  }

  int sample2(List<int> dest, List<int> src, int len) {
    for (int i = 0; i < len; i++) {
      if (i % SAMPLE_N_2 == 0) {
        dest[i ~/ SAMPLE_N_2] = src[i];
      }
    }
    return len ~/ SAMPLE_N_2;
  }

  getCrest2(List<int> num, int len, List<int> data) {
    List<List<int>> tempList = [];
    int falgPotion = 0;
    List<String> stringBuilder = [];
    int tempV = 0;
    for (int i = 0; i < len; i++) {
      if (num[i] >= 0) {
        if (tempV != num[i]) {
          tempV = num[i];
          tempList.add([i, num[i]]);
          stringBuilder.add('${num[i]},');
        }
      } else if (tempList.length > 10) {
        stringBuilder.length = 0;
        List<int> maxObj = tempList[0];
        for (int i = 1; i < tempList.length; i++) {
          List<int> obj = tempList[i];
          if (obj[1] > maxObj[1]) {
            maxObj = obj;
          }
        }
        // console.log("  maxObj=", `${maxObj}  tempList=${tempList}`);
        tempList.length = 0;
        if (falgPotion >= 2) {
          int preFlag = num[data[falgPotion - 2]];
          int secFlag = num[data[falgPotion - 1]];
          int curFlag = num[maxObj[0]];
          if (!(secFlag + 3 >= preFlag && secFlag + 3 >= curFlag)) {
            if ((secFlag / preFlag) < 0.6) {
              if ((curFlag / preFlag) >= 0.6) {
                falgPotion--;
              }
            }
          }
        }
        // eslint-disable-next-line prefer-destructuring
        data[falgPotion++] = maxObj[0];
      }
    }
    heightNum = falgPotion;
    if (heightNum != heightNumPre) {
      heightNumFlag = 0;
      heightNumPre = heightNum;
    } else {
      heightNumFlag++;
    }
  }

  getArrays() {
    tempA = List.filled(500, 0);
    tempB = List.filled(500, 0);
    tempC = List.filled(500, 0);
    for (int i = 0; i < heightNum; i++) {
      if (DATA[i] - 214 >= 0) {
        tempA[i] = DATA_SAM[DATA[i] - 214];
        tempB[i] = DATA_AVE_THIR[DATA[i]];
      }
      for (int j = 0; j < heightNum; j++) {
        if (DATA_AVE_THIR[DATA[max]] < DATA_AVE_THIR[DATA[j]]) {
          max = j;
        }
      }
    }
  }

  calibrateParameter(List<int> data) {
    if (data.length < 7) {
      return;
    }
    c1 = ((data[1] & 0xff) << 6) + ((data[2] & 0xff) >> 2);
    c2 = ((data[2] & 0x03) << 4) + ((data[3] & 0xff) >> 4);
    c3 = ((data[3] & 0x0f) << 9) +
        ((data[4] & 0xff) << 1) +
        ((data[5] & 0xff) >> 7);
    c4 = ((data[5] & 0x7f) << 2) + ((data[6] & 0xff) >> 6);
    c5 = data[6] & 0x3f;
    init();
    _syncManager.sendBpCmd(BaseCommon.BP_REQ_TYPE,
        [BaseCommon.BP_REQ_CONTENT_CALIBRATE_TEMPERATURE]);
    _syncManager.dispatchBloodPressureProcess(Process.BP_CAL_TEMP);
  }

  calibrateTemperature(List<int> data) {
    if (data.length < 3) {
      return;
    }
    int d2 = (data[1] & 0xff) + ((data[2] & 0xff) << 8);
    int trefc = (pow(2, 14) * 50 * c5 + 26214400).toInt();
    int d2ref = 322150 + (196600 * (c3 - 4096)) ~/ 8192;
    int stc = 30720 + 40 * c4;
    int d2c = 10 * d2 - d2ref;
    int tad = stc * d2c + trefc;

    int txd = tad ~/ pow(2, 20);
    int tref = trefc ~/ pow(2, 20);

    int et1 = 84 * (txd - (500 - tref)) * (txd - tref);
    tad += et1;
    debugPrint(
        "  tad=$tad  d2=$d2  d2c=$d2c  trefc=$trefc  stc=$stc  c1=$c1  c2=$c2  c3=$c3  c4=$c4  c5=$c5");

    int ta = tad;

    int deltaT = (ta - tref) ~/ pow(2, 20);

    int spctA = (c2 + 32) * -36 * deltaT;
    int spctB = spctA ~/ 160;
    int spct = pow(2, 16).toInt() + spctB;
    int spc = 13312 * (c1 + 24576);
    debugPrint(
        "  spct=$spct  spc=$spc  spctA=$spctA  spctB=$spctB  deltaT=$deltaT  tref=$tref  ta=$ta");
    spt25x = (spc ~/ spct) * 25;
    zero = 32016;
    _syncManager.sendBpCmd(
        BaseCommon.BP_REQ_TYPE, [BaseCommon.BP_REQ_CONTENT_CALIBRATE_ZERO]);
    _syncManager.dispatchBloodPressureProcess(Process.BP_CAL_ZERO);
    startTs = 1;
    stageFlag = 1;
    sCount = 0;
    sumBP = 0;
    sumZero = 0;
    initBpParam();
  }

  handlePressureData(List<int> data) {
    if (isStop == true || data.length < 11) {
      return;
    }
    int pressure = 0;
    for (int i = 0; i < BpDataList.length; i++) {
      BpDataList[i] =
          ((data[2 * i + 1] & 0xff) << 8) + (data[2 * i + 2] & 0xff);
      if (sumBP < 30) {
        if (sumBP > 9) {
          sumZero += BpDataList[i];
        }
        zero = BpDataList[i];
      } else if (sumBP == 30) {
        _syncManager.sendBpCmd(BaseCommon.BP_REQ_TYPE,
            [BaseCommon.BP_REQ_CONTENT_START_QUICK_CHARGING_GAS]);
        _syncManager.dispatchBloodPressureProcess(Process.BP_START_QUICK_GAS);
        zero = sumZero ~/ 20;
      }
      BpDataList[i] = (spt25x * (BpDataList[i] - zero).abs()) ~/ pow(2, 16);
      pressure = BpDataList[i];
      sumBP++;

      if (sumBP > 30 && equipType == 0) {
        bool leak = forArmBpTest(i);
        if (leak == false) {
          return;
        }
      }
      int ts = DateTime.now().millisecond - startTs;
      if (ts >= 8000 && pressure < 500) {
        stop();
        _syncManager.dispatchBloodPressureCatchError(AppException(
            message: "No-load leak", type: ExceptionType.BP_ERR_LEAK));
      }
    }
  }

  init() {
    isStop = false;
    startTs = DateTime.now().millisecond;
  }

  bool forArmBpTest(int index) {
    int pwmLog = 0;

    if (BpDataList[index] > 2800 && stageFlag == 1) {
      stageFlag = 2;
      preAveragePressure = 0;
      nowAveragePressure = 0;
      preSpeedPressure = 0;
      nowSpeedPressure = 0;
      prePWM = 0;
      pwmChange = 0;
      controlAeration();
    }

    if (BpDataList[index] > 3000 && stageFlag == 2) {
      stageFlag = 3;
    }
    if (stageFlag >= 3) {
      s[sCount] = BpDataList[index];
      sCount++;
      if (sCount > 6550 || BpDataList[index] > 30000) {
        stop();
      }
    }
    if (sCount % REC_NUM == 0 && stageFlag >= 3) {
      s1Count = sCount;

      int maxT;
      ExceptionType errorType = ExceptionType.UNKNOWN;
      int a = 0;

      ras(sCount, s);

      maxT = s[s1Count - 1];
      for (int j = 0; j < 10; j++) {
        if (maxT < s[s1Count - 1 - j]) {
          maxT = s[s1Count - 1 - j];
        }
      }
      int sumPressure = preciseSumPressure();
      if (nowAveragePressure == 0) {
        nowAveragePressure = sumPressure ~/ 10;
      } else {
        if (nowSpeedPressure != 0 && preSpeedPressure != 0) {
          prePWM = nowSpeedPressure - preSpeedPressure;
        }
        preAveragePressure = nowAveragePressure;
        nowAveragePressure = sumPressure ~/ 10;
        preSpeedPressure = nowSpeedPressure;
        nowSpeedPressure = nowAveragePressure - preAveragePressure;
      }
      a = nowAveragePressure - preAveragePressure;
      if (preAveragePressure != 0 &&
          nowAveragePressure != 0 &&
          preSpeedPressure == 0) {
        int pwm = intToByte(((a - 500) * 2) ~/ 100);
        pwmLog = ((a - 500) * 2) ~/ 100;
        if (pwmLog != 0) {
          pwmChange = 1;
          setPWM(pwm);
        }
      } else if (preAveragePressure != 0 &&
          nowAveragePressure != 0 &&
          preSpeedPressure != 0) {
        if (a <= 400) {
          int pwm = intToByte(
              (2 * nowSpeedPressure + preSpeedPressure - 1400) ~/ 100);
          pwmLog = (2 * nowSpeedPressure + preSpeedPressure - 1400) ~/ 100;
          if (pwmLog != 0) {
            setPWM(pwm);
          }
        } else if (a > 400 && a <= 500) {
          int diff =
              ((nowSpeedPressure - preSpeedPressure + prePWM) * 4) ~/ 200;

          int pwm = intToByte(
              (2 * nowSpeedPressure + preSpeedPressure - 1650) ~/ 100 + diff);
          pwmLog =
              (2 * nowSpeedPressure + preSpeedPressure - 1600) ~/ 100 + diff;
          if (pwmLog != 0) {
            setPWM(pwm);
          }
        } else if (a > 500 && a <= 680) {
          pwmLog = (nowSpeedPressure - preSpeedPressure + prePWM) ~/ 50;
          pwmLog *= 2;
          int pwm = intToByte(pwmLog);
          if (a > 550 && pwmLog < 0) {
            pwmLog = (2 * (nowSpeedPressure - preSpeedPressure) + prePWM) ~/ 75;
            pwmLog *= 2;
            pwm = intToByte(pwmLog);
          }
          if (a < 525 && pwmLog >= 0) {
            pwmLog = (2 * (nowSpeedPressure - preSpeedPressure) + prePWM) ~/ 50;
            pwmLog *= 2;
            pwm = intToByte(pwmLog);
          }
          if (pwmChange == 0 && pwmLog != 0) {
            pwmChange = 1;
            setPWM(pwm);
          } else {
            pwmChange = 0;
          }
        } else if (a > 680) {
          int pwm = intToByte(
              (2 * nowSpeedPressure + preSpeedPressure - 1400) ~/ 100);
          pwmLog = (2 * nowSpeedPressure + preSpeedPressure - 1400) ~/ 100;
          if (pwmLog != 0) {
            setPWM(pwm);
          }
        }
      }
      if ((a > 1200 || a < 50) &&
          preAveragePressure != 0 &&
          nowAveragePressure != 0) {
        stop();
        if (a < 50) {
          errorType = ExceptionType.BP_ERR_CODE_LEAK_GAS; //存在漏气，请检查气路，重新测量
        }
        if (a > 1200) {
          errorType =
              ExceptionType.BP_ERR_CODE_LEAK_RETRY; //测量过程中请保持安静，此次测量作废，请重新测量
        }
        _syncManager.dispatchBloodPressureCatchError(
            AppException(message: "blood pressure leak", type: errorType));
        return false;
      }

      if (maxT > 10000 && stageFlag == 3) {
        stageFlag = 4;
        calculateBP();
        if (s1Count > 5550) {
          stageFlag = 5;
        }
      }

      if (stageFlag == 5) {
        stageFlag = 6;
        stop();
        Timer(const Duration(seconds: 1), () {
          stageFlag = 0;
          ras(sCount, s);
          fag();
          int tempPs = getPsLast();
          if (tempPs != 0) {
            ps = tempPs;
          }
          ps ~/= 100;
          hr = getHR();
          pd = getPD() ~/ 100;
          if (ps <= pd || ps - pd < 10) {
            _syncManager.dispatchBloodPressureCatchError(AppException(
                message: "invalid result",
                type: ExceptionType.BP_ERR_CODE_RESULT_INVALID));
          } else {
            _syncManager.dispatchBloodPressureResult(ps, pd, hr);
          }
        });
      }
    }
    return true;
  }

  setPWM(int pwm) {
    if (pwm < 0) {
      _syncManager.sendBpCmd(BaseCommon.BP_REQ_TYPE,
          [BaseCommon.BP_REQ_CONTENT_STOP_CARGING_SPEED, pwm]);
      _syncManager
          .dispatchBloodPressureProcess(Process.BP_CHANGE_CHARGING_SPEED);
    }
  }

  intToByte(i) {
    int b = i & 0xff;
    // int c = 0;
    // if (b >= 128) {
    //   c = b % 128;
    //   c = -1 * (128 - c);
    // } else {
    //   c = b;
    // }
    // return c;
    return b;
  }

  controlAeration() {
    if (equipType == 0) {
      startPwmArm();
    } else {
      startPwmWrist();
    }
  }

  startPwmArm() {
    _syncManager.sendBpCmd(BaseCommon.BP_REQ_TYPE, [
      BaseCommon.BP_REQ_CONTENT_START_PWM_CHARGING_GAS_ARM,
      BaseCommon.BP_REQ_CONTENT_PWM_GAS
    ]);
    _syncManager.dispatchBloodPressureProcess(Process.BP_START_PWM_GAS_ARM);
  }

  startPwmWrist() {
    _syncManager.sendBpCmd(BaseCommon.BP_REQ_TYPE, [
      BaseCommon.BP_REQ_CONTENT_START_PWM_CHARGING_GAS_WRIST,
      BaseCommon.BP_REQ_CONTENT_PWM_GAS
    ]);
    _syncManager.dispatchBloodPressureProcess(Process.BP_START_PWM_GAS_WRIST);
  }

  stop() {
    isStop = true;
    Timer(const Duration(seconds: 1), () {
      _syncManager.sendBpCmd(BaseCommon.BP_REQ_TYPE,
          [BaseCommon.BP_REQ_CONTENT_STOP_CHARGING_GAS]);
      _syncManager.dispatchBloodPressureProcess(Process.END);
    });
  }

  calculateBP() {
    ras(sCount, s);
    fag();
    ps = getPS();
    if (ps != 0) {
      stageFlag = 5;
    } else {
      stageFlag = 3;
    }
    if (getHeighNumFalg() > 3) {
      stageFlag = 5;
    }
  }
}
