// ignore_for_file: constant_identifier_names

const A = 104.5;
const B = -7;
const C = -9;

const HR_FREQUENCY = 125 * 60;
const HR_MIN = 30;
const HR_MAX = 200;
const HR_DIFF = 8;

const SPO2_MIN = 70.0;
const SPO2_MAX = 99.9;
const SPO2_THRESHOLD = 95.0;
const THRESHOLD = 3000;

int currentHR = 0;
int spo2Optimize = 0;

initData() {
  currentHR = 0;
}

///
/// @param number ppi
/// @returns number
obtainHearRate(ppi) {
  dynamic beat = HR_FREQUENCY / ppi;
  if (beat > HR_MAX) {
    beat = HR_MAX;
  }
  if (beat < HR_MIN) {
    beat = HR_MIN;
  }
  return beat;
}

///
/// @param number red
/// @param number ir
/// @returns number
obtainSPO2(red, ir) {
  var R = red / ir;
  var spo2 = A + B * R + C * R * R;

  if (spo2 < SPO2_MIN) {
    spo2 = SPO2_MIN;
  }
  if (spo2 > SPO2_MAX) {
    spo2 = SPO2_MAX;
  }
  return spo2;
}

///
/// @param number ppi
/// @param number red
/// @param number ir
/// @returns {spo2,hr}
obtainOX(ppi, red, ir) {
  int spo2 = 0;
  var hr = obtainHearRate(ppi).toInt();
  var hrOfferset = hr - currentHR;
  if (currentHR != 0 && hrOfferset > -HR_DIFF && hrOfferset < HR_DIFF) {
    currentHR = hr;
    spo2 = obtainSPO2(red, ir).toInt();

    return {
      "spo2": spo2,
      "hr": hr,
    };
  }else if (currentHR == 0) {
    currentHR = hr;
  }
  return null;
}
