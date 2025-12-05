// ignore_for_file: non_constant_identifier_names

import 'dart:math';

import 'package:flutter/material.dart';
import 'package:smartring_flutter/src/core/hc03_sdk.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';
import 'package:smartring_flutter/src/core/protocol/Exception.dart';

class Temperature {
  Temperature._internal();
  static final Temperature _instance = Temperature._internal();
  factory Temperature() => _instance;
  final SyncManager _syncManager = SyncManager();

  List<int> BTList = [];
  List<int> ETList = [];

  translateFun(dynamic tempE, dynamic tempB) {
    switch (tempE) {
      case 50:
      case 51:
      case 52:
        return tempB + 9.9;
      case 53:
      case 54:
        return tempB + 9.8;
      case 55:
      case 56:
        return tempB + 9.7;
      case 57:
      case 58:
      case 59:
        return tempB + 9.6;
      case 60:
      case 61:
        return tempB + 9.5;
      case 62:
      case 63:
      case 64:
        return tempB + 9.4;
      case 65:
      case 66:
        return tempB + 9.3;
      case 67:
      case 68:
      case 69:
        return tempB + 9.2;
      case 70:
      case 71:
      case 72:
        return tempB + 9.1;
      case 73:
      case 74:
        return tempB + 9.0;
      case 75:
      case 76:
        return tempB + 8.9;
      case 77:
      case 78:
      case 79:
        return tempB + 8.8;
      case 80:
      case 81:
      case 82:
        return tempB + 8.7;
      case 83:
      case 84:
        return tempB + 8.6;
      case 85:
      case 86:
        return tempB + 8.5;
      case 87:
      case 88:
      case 89:
        return tempB + 8.4;
      case 90:
      case 91:
        return tempB + 8.3;
      case 92:
      case 93:
      case 94:
        return tempB + 8.2;
      case 95:
      case 96:
      case 97:
        return tempB + 8.1;
      case 98:
      case 99:
        return tempB + 8.0;
      case 100:
      case 101:
        return tempB + 7.9;
      case 102:
      case 103:
      case 104:
        return tempB + 7.8;
      case 105:
      case 106:
        return tempB + 7.7;
      case 107:
      case 108:
      case 109:
        return tempB + 7.6;
      case 110:
      case 111:
      case 112:
        return tempB + 7.5;
      case 113:
      case 114:
        return tempB + 7.4;
      case 115:
      case 116:
        return tempB + 7.3;
      case 117:
      case 118:
      case 119:
        return tempB + 7.2;
      case 120:
      case 121:
        return tempB + 7.1;
      case 122:
      case 123:
      case 124:
        return tempB + 7.0;
      case 125:
        return tempB + 6.9;
      case 126:
      case 127:
        return tempB + 6.8;
      case 128:
      case 129:
        return tempB + 6.7;
      case 130:
        return tempB + 6.6;
      case 131:
      case 132:
        return tempB + 6.5;
      case 133:
      case 134:
        return tempB + 6.4;
      case 135:
      case 136:
        return tempB + 6.3;
      case 137:
      case 138:
      case 139:
        return tempB + 6.2;
      case 140:
      case 141:
        return tempB + 6.1;
      case 142:
      case 143:
      case 144:
        return tempB + 6.0;
      case 145:
        return tempB + 5.9;
      case 146:
      case 147:
        return tempB + 5.8;
      case 148:
      case 149:
        return tempB + 5.7;
      case 150:
      case 151:
        return tempB + 5.6;
      case 152:
      case 153:
      case 154:
        return tempB + 5.5;
      case 155:
        return tempB + 5.4;
      case 156:
      case 157:
        return tempB + 5.3;
      case 158:
      case 159:
        return tempB + 5.2;
      case 160:
      case 161:
      case 162:
        return tempB + 5.1;
      case 163:
      case 164:
        return tempB + 5.0;
      case 165:
      case 166:
        return tempB + 4.9;
      case 167:
      case 168:
      case 169:
        return tempB + 4.8;
      case 170:
        return tempB + 4.7;
      case 171:
        return tempB + 4.6;
      case 172:
        return tempB + 4.5;
      case 173:
        return tempB + 4.4;
      case 174:
        return tempB + 4.3;
      case 175:
        return tempB + 4.2;
      case 176:
        return tempB + 4.1;
      case 177:
        return tempB + 4.0;
      case 178:
        return tempB + 3.9;
      case 179:
        return tempB + 3.8;
      case 180:
        return tempB + 3.7;
      case 181:
        return tempB + 3.5;
      case 182:
        return tempB + 3.3;
      case 183:
        return tempB + 3.1;
      case 184:
        return tempB + 2.9;
      case 185:
        return tempB + 2.7;
      case 186:
        return tempB + 2.6;
      case 187:
        return tempB + 2.5;
      case 188:
        return tempB + 2.4;
      case 189:
        return tempB + 2.3;
      case 190:
        return tempB + 2.2;
      case 191:
        return tempB + 2.1;
      case 192:
        return tempB + 2.0;
      case 193:
        return tempB + 1.9;
      case 194:
        return tempB + 1.8;
      case 195:
      case 196:
        return tempB + 1.7;
      case 197:
      case 198:
      case 199:
        return tempB + 1.6;
      case 200:
      case 201:
        return tempB + 1.5;
      case 202:
      case 203:
        return tempB + 1.4;
      case 204:
        return tempB + 1.3;
      case 205:
      case 206:
        return tempB + 1.2;
      case 207:
      case 208:
      case 209:
        return tempB + 1.1;
      case 210:
        return tempB + 1.0;
      case 211:
      case 212:
      case 213:
        return tempB + 0.9;
      case 214:
      case 215:
      case 216:
      case 217:
      case 218:
      case 219:
      case 220:
        return tempB + 0.8;
      case 221:
      case 222:
      case 223:
        return tempB + 0.7;
      case 224:
      case 225:
      case 226:
      case 227:
      case 228:
      case 229:
      case 230:
      case 231:
      case 232:
      case 233:
      case 234:
        return tempB + 0.6;
      case 235:
      case 236:
      case 237:
      case 238:
      case 239:
      case 240:
      case 241:
        return tempB + 0.5;
      case 242:
      case 243:
      case 244:
      case 245:
        return tempB + 0.4;
      case 246:
      case 247:
      case 248:
      case 249:
      case 250:
      case 251:
      case 252:
      case 253:
      case 254:
        return tempB + 0.3;
      case 255:
      case 256:
      case 257:
        return tempB + 0.2;
      case 258:
      case 259:
      case 260:
      case 261:
        return tempB + 0.1;
      case 262:
      case 263:
      case 264:
      case 265:
      case 266:
      case 267:
      case 268:
      case 269:
      case 270:
      case 271:
        return tempB;
      case 272:
      case 273:
      case 274:
        return tempB - 0.1;
      case 275:
      case 276:
      case 277:
        return tempB - 0.2;
      case 278:
      case 279:
        return tempB - 0.3;
      case 280:
      case 281:
        return tempB - 0.4;
      case 282:
      case 283:
      case 284:
        return tempB - 0.5;
      case 285:
      case 286:
        return tempB - 0.6;
      case 287:
      case 288:
        return tempB - 0.7;
      case 289:
        return tempB - 0.8;
      case 290:
        return tempB - 0.9;
      case 291:
        return tempB - 1.0;
      case 292:
        return tempB - 1.1;
      case 293:
        return tempB - 1.2;
      case 294:
        return tempB - 1.3;
      case 295:
      case 296:
      case 297:
      case 298:
      case 299:
        return tempB - 1.4;
      case 300:
      case 301:
      case 302:
      case 303:
      case 304:
        return tempB - 1.5;
      case 305:
      case 306:
      case 307:
      case 308:
      case 309:
        return tempB - 1.6;
      case 310:
      case 311:
      case 312:
      case 313:
      case 314:
        return tempB - 1.7;
      case 315:
      case 316:
      case 317:
      case 318:
      case 319:
        return tempB - 1.8;
      case 320:
      case 321:
      case 322:
      case 323:
      case 324:
      case 325:
      case 326:
      case 327:
      case 328:
      case 329:
        return tempB - 1.9;
      case 330:
      case 331:
      case 332:
      case 333:
      case 334:
        return tempB - 2.0;
      case 335:
      case 336:
      case 337:
      case 338:
      case 339:
        return tempB - 2.1;
      case 340:
      case 341:
      case 342:
      case 343:
      case 344:
      case 345:
      case 346:
        return tempB - 2.2;
      case 347:
      case 348:
      case 349:
        return tempB - 2.3;
      case 350:
      case 351:
      case 352:
        return tempB - 2.4;
      case 353:
      case 354:
        return tempB - 2.5;
      case 355:
      case 356:
        return tempB - 2.6;
      case 357:
      case 358:
      case 359:
        return tempB - 2.7;
      case 360:
      case 361:
      case 362:
        return tempB - 2.8;
      case 363:
      case 364:
        return tempB - 2.9;
      case 365:
      case 366:
      case 367:
        return tempB - 3.0;
      case 368:
      case 369:
        return tempB - 3.1;
      case 370:
      case 371:
      case 372:
        return tempB - 3.2;
      case 373:
      case 374:
        return tempB - 3.3;
      case 375:
      case 376:
        return tempB - 3.4;
      case 377:
      case 378:
      case 379:
        return tempB - 3.5;
      case 380:
      case 381:
      case 382:
        return tempB - 3.6;
      case 383:
      case 384:
        return tempB - 3.7;
      case 385:
      case 386:
        return tempB - 3.8;
      case 387:
      case 388:
      case 389:
        return tempB - 3.9;
      case 390:
      case 391:
      case 392:
        return tempB - 4.0;
      case 393:
      case 394:
        return tempB - 4.1;
      case 395:
      case 396:
        return tempB - 4.2;
      case 397:
      case 398:
      case 399:
        return tempB - 4.3;
      case 400:
        return tempB - 4.4;
      default:
        if (tempE > 400) return tempB - 4.4;
        return tempB + 10.7;
    }
  }

  randomTemp(List<double> array, int len) {
    final index = Random().nextInt(len);
    final val = array[index];
    return val;
  }

  translateFunc2(int temp) {
    switch (temp) {
      case 412:
        return 43.9;
      case 411:
        return randomTemp([43.8, 43.7], 2);
      case 410:
        return randomTemp([43.6, 43.5], 2);
      case 409:
        return 43.3;
      case 408:
        return 43.2;
      case 407:
        return randomTemp([43.2, 43.1, 43.0], 3);
      case 406:
        return randomTemp([43.0, 42.9], 2);
      case 405:
        return randomTemp([42.9, 42.8], 2);
      case 404:
        return randomTemp([42.7, 42.6], 2);
      case 403:
        return randomTemp([42.6, 42.5], 2);
      case 402:
        return randomTemp([42.4, 42.3], 2);
      case 401:
        return 42.2;
      case 400:
        return randomTemp([42.1, 42.0], 2);
      case 399:
        return 41.9;
      case 398:
        return randomTemp([41.8, 41.7], 2);
      case 397:
        return randomTemp([41.7, 41.6, 41.5], 3);
      case 396:
        return 41.4;
      case 395:
        return 41.3;
      case 394:
        return randomTemp([41.2, 41.1], 2);
      case 393:
        return 41.0;
      case 392:
        return randomTemp([40.9, 40.8], 2);
      case 391:
        return 40.7;
      case 390:
        return randomTemp([40.6, 40.5], 2);
      case 389:
        return randomTemp([40.5, 40.4], 2);
      case 388:
        return randomTemp([40.3, 40.2], 2);
      case 387:
      case 386:
      case 385:
      case 384:
      case 383:
        return 40.1;
      case 382:
        return randomTemp([40.0, 39.9], 2);
      case 381:
        return 39.9;
      case 380:
        return 39.8;
      case 379:
        return 39.7;
      case 378:
      case 377:
        return 39.6;
      case 376:
        return randomTemp([39.5, 39.4], 2);
      case 375:
        return 39.4;
      case 374:
        return 39.3;
      case 373:
        return 39.3;
      case 372:
        return randomTemp([39.2, 39.1], 2);
      case 371:
        return 39.1;
      case 370:
        return 39.0;
      case 369:
        return 38.9;
      case 368:
        return 38.8;
      case 367:
      case 366:
        return 38.7;
      case 365:
        return 38.5;
      case 364:
      case 363:
        return 38.4;
      case 362:
        return 38.3;
      case 361:
        return 38.2;
      case 360:
        return 38.1;
      case 359:
        return 38.0;
      case 358:
        return randomTemp([38.0, 37.9], 2);
      case 357:
        return randomTemp([37.9, 37.8], 2);
      case 356:
        return 37.8;
      case 355:
        return 37.7;
      case 354:
        return randomTemp([37.7, 37.6], 2);
      case 353:
        return 37.6;
      case 352:
        return 37.5;
      case 351:
        return 37.4;
      case 350:
        return randomTemp([37.4, 37.3], 2);
      case 349:
        return 37.3;
      case 348:
      case 347:
        return 37.2;
      case 346:
      case 345:
        return 37.1;
      case 344:
      case 343:
        return 37.0;
      case 342:
        return randomTemp([37.0, 36.9], 2);
      case 341:
      case 340:
      case 339:
        return 36.9;
      case 338:
      case 337:
      case 336:
      case 335:
      case 334:
      case 333:
        return 36.8;
      case 332:
      case 331:
      case 330:
      case 329:
      case 328:
      case 327:
      case 326:
      case 325:
      case 324:
      case 323:
        return 36.7;
      case 322:
        return randomTemp([36.7, 36.6], 2);
      case 321:
      case 320:
        return 36.6;
      case 319:
        return randomTemp([36.6, 36.5], 2);
      case 318:
        return 36.5;
      case 317:
      case 316:
        return 36.4;
      case 315:
        return randomTemp([36.3, 36.2], 2);
      case 314:
        return randomTemp([36.2, 36.1], 2);
      case 313:
        return 36.1;
      case 312:
        return randomTemp([36.0, 35.9], 2);
      case 311:
        return randomTemp([35.8, 35.7, 35.6], 3);
      case 310:
        return randomTemp([35.5, 35.4], 2);
      case 309:
        return randomTemp([35.4, 35.3, 35.2], 3);
      case 308:
        return randomTemp([35.1, 35.0], 2);
      case 307:
        return 34.7;
      case 306:
        return randomTemp([34.5, 34.4], 2);
      default:
        //            if (temp >= 300) {
        //                return randomTemp( temp_arr_300, 5);
        //            } else if (temp >= 290) {
        //                return randomTemp( temp_arr_290, 5);
        //            } else if (temp >= 280) {
        //                return randomTemp( temp_arr_280, 5);
        //            }
        return -1.0;
    }
  }

  getTemp(dynamic temp) {
    var tempInt = (temp * 10).truncate();
    var normalTemp = translateFunc2(tempInt);
    return normalTemp == -1.0 ? temp : normalTemp;
  }

  getBodyTemp(dynamic tempE, dynamic tempB) {
    var translate = translateFun((tempE * 10).truncate(), tempB);
    //  LOGD("transTemp0=%f", translate);
    var normalTemp = getTemp(translate);

    //  LOGD("transTemp1=%f", normalTemp);
    var finalTemp = normalTemp == -1.0 ? tempB : normalTemp;
    //  LOGD("so, finalTemp=%f", finalTemp);
    return finalTemp;
  }

  dealData(List<int> bytes) {
    var temperatureBdF = ((bytes[1] & 0xff) << 8) + (bytes[0] & 0xff);
    var temperatureEvF = ((bytes[3] & 0xff) << 8) + (bytes[2] & 0xff);
    var temperatureBdS = ((bytes[5] & 0xff) << 8) + (bytes[4] & 0xff);
    // 环境温度 temperatureEv
    var temperatureEvS = ((bytes[7] & 0xff) << 8) + (bytes[6] & 0xff);

    ETList.add(temperatureEvF); // 将温度添加到List数组中
    BTList.add(temperatureBdF); // 将温度添加到List数组中
    ETList.add(temperatureEvS); // 将温度添加到List数组中
    BTList.add(temperatureBdS); // 将温度添加到List数组中
    if (ETList.length == 6) {
      var TBT = getLTemp(BTList);
      var EBT = getLTemp(ETList);
      var tempBT = transferTemp(TBT);
      var tempET = transferTemp(EBT);
      if (!isNumber(tempBT) || !isNumber(tempET)) {
        _syncManager.temperatureCatchError(AppException(
            message: "Invalid Data", type: ExceptionType.INVALID_DATA));
        return;
      }
      ETList = [];
      BTList = [];
      var result = sendBtData(getBodyTemp(tempET, tempBT));
      debugPrint("sendBtData: $result");
      _syncManager.temperatureCatchData(TemperatureData(result));
    }
  }

  static getLTemp(List<int> array) {
    var tArray = List<int>.filled(100, 0);

    for (int h = 2; h < array.length; h++) {
      tArray[h - 2] = array[h];
    }
    var tValue = 0;
    for (int i = 0; i < array.length - 2; i++) {
      for (int j = 0; j < array.length - 2 - 1 - i; j++) {
        if (tArray[j] > tArray[j + 1]) {
          tValue = tArray[j];
          tArray[j] = tArray[j + 1];
          tArray[j + 1] = tValue;
        }
      }
    }
    return tArray[(array.length - 2) ~/ 2 + 1];
  }

  sendBtData(dynamic btValue) {
    final numStr = btValue.toString();
    final index = numStr.indexOf('.');
    if (index != -1 && index + 2 < numStr.length) {
      // 保留到小数点后1位
      final result = double.parse(numStr.substring(0, index + 2));
      return result;
    } else {
      // 如果是整数或小数点后不足两位，直接返回原值
      return btValue is int ? btValue : double.parse(numStr);
    }
  }

  static transferTemp(temp) {
    return temp * 0.02 - 273.15;
  }

  static isNumber(inputData) {
    if (inputData is int || inputData is double) {
      return true;
    }
    return false;
  }
}
