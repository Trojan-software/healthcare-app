// ignore_for_file: non_constant_identifier_names

import 'package:smartring_flutter/src/core/health/ox/lib/models/OxResult.dart';
import 'package:smartring_flutter/src/core/health/ox/lib/models/OxSignData.dart';

class Waveform {
  final List<OxSignData> _data = [];
  int pnLast = 0;
  bool _findFirstPeek = false;
  OxSignData? lastPeak;
  bool clear = false;
  int _errorCount = 0;
  OxResult? _result;
  int LEN_DATA_THRESHOLD = 22;
  Waveform();

  bool needClear() {
    if (clear) {
      clear = false;
      return true;
    }
    return false;
  }

  void findPPIAndR(OxSignData signal) {
    int pn = signal.sgnAC > 0 ? 1 : -1;
    // is not the first data
    if (pnLast != 0) {
      if (pn == pnLast) {
        if (pn == 1) {
          _data.add(signal);
          // No need to return null in Dart
        }
      } else {
        signal.pn = -2;
        if (pn == -1) {
          if (_data.length > LEN_DATA_THRESHOLD) {
            OxSignData sgnPeak = _data[0];

            for (int key = 0; key < _data.length; key++) {
              final sgnRed = _data[key];
              if (sgnPeak.sgnAC < sgnRed.sgnAC) {
                sgnPeak = sgnRed;
              }
            }
            if (_findFirstPeek) {
              if (lastPeak == null ||
                  verifyPPI(sgnPeak.index, lastPeak!.index)) {
                if (lastPeak != null) {
                  int ppi = sgnPeak.index - lastPeak!.index;
                  double r = sgnPeak.sgnAC / sgnPeak.sgnDC;
                  _result = OxResult(ppi, r);
                }
                sgnPeak.pn = 1;
                lastPeak = sgnPeak;
                _errorCount = 0;
              } else {
                _errorCount += 1;
                if (_errorCount >= 3) {
                  lastPeak = null;
                  _result = null;
                  clear = true;
                }
              }
            } else {
              _findFirstPeek = true;
            }
          }
        }
        _data.clear();
      }
    }
    pnLast = pn;
  }

  OxResult? applyResult() {
    return _result;
  }

  bool verifyPPI(int cur, int pre) {
    int result = (cur - pre).abs();
    return result >= 38 && result <= 260;
  }
}
