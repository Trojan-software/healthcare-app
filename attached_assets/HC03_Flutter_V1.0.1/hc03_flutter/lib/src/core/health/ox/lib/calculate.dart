// ignore_for_file: constant_identifier_names, prefer_typing_uninitialized_variables

import 'package:smartring_flutter/src/core/health/ox/lib/arithmetic.dart';
import 'package:smartring_flutter/src/core/health/ox/lib/arithmetic_ox.dart';
import 'package:smartring_flutter/src/core/health/ox/lib/models/OxSignData.dart';
import 'package:smartring_flutter/src/core/health/ox/lib/models/OxWave.dart';
import 'package:smartring_flutter/src/core/health/ox/lib/wave.dart';
import 'package:smartring_flutter/src/core/sync/syncManager.dart';

const int LEN_ORIGIN_THRESHOLD = 50;
const int LEN_AVG_THRESHOLD = 81;
const int DC_HALF_SIZE = 40;
const int FINGER_DETECTION_THRESHOLD = 150000;
const int MAXIMUM_CAPACITY = 100;
const double PASS_RATE = 0.70;
const int END_COUNT = 4000;
var oxInfo;

class Calculate {
  final List<int> _originRed = [];
  final List<int> _originIr = [];
  final List<double> _lowRed = [];
  final List<double> _lowIr = [];
  final List<int> _irArray = [];
  final List<int> _hrArray = [];
  Waveform _redWave = Waveform();
  Waveform _irWave = Waveform();
  int _irFingerPass = 0;
  int _acIndex = 0;
  bool _isTouch = true;
  final SyncManager _syncManager = SyncManager();
  Calculate() {
    init();
  }

  void init() {
    _originRed.clear();
    _originIr.clear();
    _lowRed.clear();
    _lowIr.clear();
    _irArray.clear();
    _hrArray.clear();
    _irFingerPass = 0;
    _acIndex = 0;
    _redWave = Waveform();
    _irWave = Waveform();
    _isTouch = true;
    initData();
  }

  void addSignalData(int red, int ir) {
    _originRed.add(red);
    _originIr.add(ir);

    if (_originRed.length >= LEN_ORIGIN_THRESHOLD &&
        _originIr.length >= LEN_ORIGIN_THRESHOLD) {
      fingerDetection(ir);
      handleSignal();
    }
  }

  void fingerDetection(int ir) {
    if (_irArray.length < MAXIMUM_CAPACITY) {
      _irArray.add(ir);
      if (ir >= FINGER_DETECTION_THRESHOLD) {
        _irFingerPass++;
      }
    } else {
      double rate = _irFingerPass / _irArray.length;

      if (rate < PASS_RATE && _isTouch) {
        _isTouch = false;
        _syncManager.bloodOxygenCatchTouched(false);
        _syncManager.bloodOxygenCatchStop();
      } else {
        _syncManager.bloodOxygenCatchTouched(true);
      }
      final removedIr = _irArray.removeAt(0);
      if (removedIr >= FINGER_DETECTION_THRESHOLD) {
        _irFingerPass--;
      }
    }
  }

  void handleSignal() {
    if (_originIr.length < LEN_ORIGIN_THRESHOLD ||
        _originRed.length < LEN_ORIGIN_THRESHOLD) {
      return;
    }

    final lpRED = Arithmetic.lowPassFilter(_originRed);
    final lpIR = Arithmetic.lowPassFilter(_originIr);

    _lowRed.add(lpRED);
    _lowIr.add(lpIR);
    if (_lowRed.length > LEN_AVG_THRESHOLD) {
      _lowRed.removeAt(0);
    }
    if (_lowIr.length > LEN_AVG_THRESHOLD) {
      _lowIr.removeAt(0);
    }

    if (_lowRed.length == LEN_AVG_THRESHOLD) {
      final dcRED = Arithmetic.applyAvg(_lowRed);
      final dcIR = Arithmetic.applyAvg(_lowIr);
      final acRED = _lowRed[DC_HALF_SIZE] - dcRED;
      final acIR = _lowIr[DC_HALF_SIZE] - dcIR;

      _syncManager.bloodOxygenCatchWaveData(
          OxWave(0, 0, acRED), OxWave(0, 0, acIR));
      _redWave.findPPIAndR(OxSignData(_acIndex, acRED, dcRED, 0));
      _irWave.findPPIAndR(OxSignData(_acIndex, acIR, dcIR, 0));
      final redResult = _redWave.applyResult();
      final irResult = _irWave.applyResult();
      if(_irWave.needClear()||_redWave.needClear()){
        return;
      }
      if (redResult != null && irResult != null) {
        oxInfo = obtainOX(irResult.ppi, redResult.r, irResult.r);

        if (oxInfo != null) {
          if (_hrArray.length >= 8) {
            _hrArray.remove(0);
          }
          _hrArray.add(oxInfo['hr']);
          int num=0;
          for (var i = 0; i < _hrArray.length; i++) {
            num+=_hrArray[i];
          }
          _syncManager.bloodOxygenCatchData(oxInfo["spo2"], num~/_hrArray.length);
        }
      } 
      _acIndex++;
    }
    _originRed.removeAt(0);
    _originIr.removeAt(0);
    if (_acIndex > END_COUNT) {
      _syncManager.bloodOxygenCatchStop();
      init();
    }
  }

}
