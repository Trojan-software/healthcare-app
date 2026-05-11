/**
 * Device Connector Component
 * Provides UI for connecting to Linktop Health Monitor devices
 */
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bluetooth, 
  BluetoothConnected,
  BluetoothOff,
  Battery,
  BatteryCharging,
  BatteryFull,
  RefreshCw,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Loader2,
  Brain,
  Wind,
  Timer,
  Smile,
  Zap
} from 'lucide-react';
import { useDevice } from '@/contexts/DeviceContext';
import { BatteryState, ECGData, BloodPressureData, BloodGlucosePaperState } from '@/lib/linktop-sdk';
import { useLanguage } from '@/lib/i18n';

// ─── BP category (AHA/ACC 2017 guidelines) ────────────────────────────────
function getBpCategory(sys: number, dia: number): { label: string; labelAr: string; color: string; bg: string } {
  if (sys < 120 && dia < 80)        return { label: 'Normal',          labelAr: 'طبيعي',          color: 'text-green-700',  bg: 'bg-green-50 border-green-200' };
  if (sys < 130 && dia < 80)        return { label: 'Elevated',         labelAr: 'مرتفع قليلاً',   color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  if (sys < 140 || dia < 90)        return { label: 'High — Stage 1',   labelAr: 'مرتفع - مرحلة 1', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  if (sys < 180 && dia < 120)       return { label: 'High — Stage 2',   labelAr: 'مرتفع - مرحلة 2', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' };
  return                                    { label: 'Hypertensive Crisis', labelAr: 'أزمة ضغط',   color: 'text-red-900',    bg: 'bg-red-100 border-red-400' };
}

// ─── Temperature category (clinical fever thresholds) ────────────────────
function getTempCategory(c: number): { label: string; labelAr: string; color: string; bg: string } {
  if (c < 35.0)  return { label: 'Hypothermia',      labelAr: 'انخفاض درجة الحرارة', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' };
  if (c < 36.5)  return { label: 'Below Normal',     labelAr: 'أقل من الطبيعي',       color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200' };
  if (c <= 37.5) return { label: 'Normal',            labelAr: 'طبيعي',               color: 'text-green-700',  bg: 'bg-green-50 border-green-200' };
  if (c <= 38.0) return { label: 'Low-grade Fever',   labelAr: 'حمى خفيفة',           color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  if (c <= 39.0) return { label: 'Fever',             labelAr: 'حمى',                 color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  if (c <= 41.0) return { label: 'High Fever',        labelAr: 'حمى شديدة',           color: 'text-red-700',    bg: 'bg-red-50 border-red-300' };
  return                 { label: 'Hyperpyrexia',     labelAr: 'ارتفاع حاد',          color: 'text-red-900',    bg: 'bg-red-100 border-red-500' };
}

// ─── SpO2 category (WHO / pulse-ox clinical thresholds) ──────────────────
function getSpo2Category(pct: number): { label: string; labelAr: string; color: string; bg: string } {
  if (pct >= 95)  return { label: 'Normal',              labelAr: 'طبيعي',           color: 'text-green-700',  bg: 'bg-green-50 border-green-200' };
  if (pct >= 92)  return { label: 'Mild Hypoxemia',      labelAr: 'نقص أكسجين خفيف', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  if (pct >= 88)  return { label: 'Moderate Hypoxemia',  labelAr: 'نقص أكسجين متوسط',color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  return                  { label: 'Severe Hypoxemia',   labelAr: 'نقص أكسجين حاد',  color: 'text-red-700',    bg: 'bg-red-50 border-red-300' };
}

// ─── Glucose category (ADA guidelines) ───────────────────────────────────
function getGlucoseCategory(mgdl: number): { label: string; labelAr: string; color: string; bg: string; icon: string } {
  if (mgdl < 54)               return { label: 'Severe Hypoglycemia', labelAr: 'نقص سكر حاد',      color: 'text-red-900',    bg: 'bg-red-100 border-red-400',     icon: '🚨' };
  if (mgdl < 70)               return { label: 'Low (Hypoglycemia)',   labelAr: 'منخفض',            color: 'text-red-700',    bg: 'bg-red-50 border-red-300',      icon: '⚠️' };
  if (mgdl <= 99)              return { label: 'Normal (Fasting)',     labelAr: 'طبيعي',            color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: '✅' };
  if (mgdl <= 125)             return { label: 'Pre-diabetes',         labelAr: 'ما قبل السكري',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',icon: '⚡' };
  if (mgdl <= 199)             return { label: 'Diabetes Range',       labelAr: 'نطاق السكري',      color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',icon: '🔶' };
  return                               { label: 'High — Hyperglycemia', labelAr: 'ارتفاع السكر',   color: 'text-red-700',    bg: 'bg-red-50 border-red-300',      icon: '🔴' };
}

// ─── ECG waveform constants ────────────────────────────────────────────────
const WAVE_BUFFER_SIZE = 250;   // ~5 seconds at ~50 Hz
const SVG_W = 600;
const SVG_H = 80;
const MID_Y = SVG_H / 2;

// ─── Inline ECG waveform component ────────────────────────────────────────
function EcgWaveform({ samples }: { samples: number[] }) {
  if (samples.length < 2) {
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-20 bg-black rounded">
        <text x={SVG_W / 2} y={SVG_H / 2 + 4} textAnchor="middle" fill="#22c55e" fontSize="12">
          Waiting for signal…
        </text>
      </svg>
    );
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const pad = 6;

  const points = samples.map((v, i) => {
    const x = (i / (samples.length - 1)) * SVG_W;
    const y = pad + ((max - v) / range) * (SVG_H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-20 bg-black rounded" preserveAspectRatio="none">
      {/* Grid line */}
      <line x1="0" y1={MID_Y} x2={SVG_W} y2={MID_Y} stroke="#166534" strokeWidth="0.5" strokeDasharray="4 4" />
      {/* ECG trace */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── ECG result metric card ────────────────────────────────────────────────
function EcgMetric({
  icon,
  label,
  value,
  unit,
  color = 'text-gray-700',
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-2 bg-white border border-gray-100 rounded-lg shadow-sm text-center">
      <div className={`mb-1 ${color}`}>{icon}</div>
      <p className={`text-lg font-bold leading-none ${color}`}>{value}{unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

interface DeviceConnectorProps {
  compact?: boolean;
  showMeasurementControls?: boolean;
  onVitalsUpdate?: (vitals: { 
    heartRate?: number; 
    bloodPressure?: { systolic: number; diastolic: number };
    oxygenLevel?: number;
    temperature?: number;
    bloodGlucose?: number;
  }) => void;
}

export default function DeviceConnector({ 
  compact = false, 
  showMeasurementControls = true,
  onVitalsUpdate 
}: DeviceConnectorProps) {
  const { t, isRTL } = useLanguage();
  const {
    deviceState,
    vitalSigns,
    measurementState,
    isBluetoothSupported,
    scanAndConnect,
    disconnect,
    startMeasurement,
    stopMeasurement,
    refreshBattery,
  } = useDevice();

  const [activeAction, setActiveAction] = useState<string | null>(null);

  // ─── Device registration on BLE connect / disconnect ─────────────────────
  const prevConnected = useRef(false);
  useEffect(() => {
    const wasConnected = prevConnected.current;
    const isNowConnected = deviceState.isConnected;
    prevConnected.current = isNowConnected;

    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (!wasConnected && isNowConnected && deviceState.deviceInfo) {
      // Device just connected — register/upsert with server
      fetch('/api/devices/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deviceId: deviceState.deviceInfo.id,
          deviceName: deviceState.deviceInfo.name,
          firmwareVersion: deviceState.deviceInfo.firmwareVersion || null,
          deviceType: 'multi_function',
          supportedMeasurements: ['ecg', 'blood_oxygen', 'temperature', 'blood_pressure', 'glucose', 'battery'],
        }),
      }).catch(() => {}); // best-effort — never block UI
    } else if (wasConnected && !isNowConnected) {
      // Device just disconnected — update server status
      const deviceId = deviceState.deviceInfo?.id;
      if (deviceId) {
        fetch('/api/devices/disconnect', {
          method: 'POST',
          headers,
          body: JSON.stringify({ deviceId }),
        }).catch(() => {});
      }
    }
  }, [deviceState.isConnected, deviceState.deviceInfo]);

  // ─── ECG waveform buffer ─────────────────────────────────────────────────
  const [waveBuffer, setWaveBuffer] = useState<number[]>([]);
  const [ecgResult, setEcgResult] = useState<ECGData | null>(null);
  const [ecgCountdown, setEcgCountdown] = useState(0);
  const ecgCountdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevEcgActive = useRef(false);

  // ─── BP result state ─────────────────────────────────────────────────────
  const [bpResult, setBpResult] = useState<BloodPressureData | null>(null);
  const prevBpActive = useRef(false);

  // ─── Glucose result state ─────────────────────────────────────────────────
  const [glucoseResult, setGlucoseResult] = useState<{ value: number; unit: string } | null>(null);
  const prevGlucoseActive = useRef(false);

  // ─── Temperature result state ────────────────────────────────────────────
  const [tempResult, setTempResult] = useState<number | null>(null);
  const prevTempActive = useRef(false);

  // ─── SpO2 waveform buffer + result ────────────────────────────────────────
  const [spo2WaveBuffer, setSpo2WaveBuffer] = useState<number[]>([]);
  const [spo2Result, setSpo2Result] = useState<{ oxygenLevel: number; heartRate: number } | null>(null);
  const [fingerOn, setFingerOn] = useState(false);
  const [spo2Countdown, setSpo2Countdown] = useState(60);
  const spo2CountdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSpo2Active = useRef(false);
  // SpO2 throttle DB saves to once per 30 s (continuous readings every ~2 s).
  const lastSpo2SaveTs = useRef<number>(0);

  // ─── Auto-stop timers ─────────────────────────────────────────────────────
  // BP / temp / glucose → auto-stop 2 s after result arrives (device is done).
  // ECG                 → auto-stop after 30 s (standard single-lead recording).
  // SpO2                → auto-stop after 60 s.
  const autoStopTimers = useRef<Partial<Record<'ecg'|'spo2'|'bloodPressure'|'temperature'|'bloodGlucose', ReturnType<typeof setTimeout>>>>({});
  const scheduleAutoStop = (type: 'ecg'|'spo2'|'bloodPressure'|'temperature'|'bloodGlucose', delayMs: number) => {
    if (autoStopTimers.current[type]) clearTimeout(autoStopTimers.current[type]);
    autoStopTimers.current[type] = setTimeout(() => {
      stopMeasurement(type);
    }, delayMs);
  };
  const cancelAutoStop = (type: 'ecg'|'spo2'|'bloodPressure'|'temperature'|'bloodGlucose') => {
    if (autoStopTimers.current[type]) {
      clearTimeout(autoStopTimers.current[type]);
      delete autoStopTimers.current[type];
    }
  };

  useEffect(() => {
    const ecg = measurementState.ecg;

    // Clear state when ECG starts; start the elapsed-time countdown (display only)
    if (ecg.active && !prevEcgActive.current) {
      setWaveBuffer([]);
      setEcgResult(null);
      setEcgCountdown(0);
      // Tick elapsed seconds up (display only — NOT used to trigger auto-stop)
      if (ecgCountdownTimer.current) clearInterval(ecgCountdownTimer.current);
      ecgCountdownTimer.current = setInterval(() => {
        setEcgCountdown(prev => prev + 1);
      }, 1000);
    }
    // If measurement stopped (manually or by auto-stop), cancel the display timer
    if (!ecg.active && prevEcgActive.current) {
      cancelAutoStop('ecg');
      if (ecgCountdownTimer.current) { clearInterval(ecgCountdownTimer.current); ecgCountdownTimer.current = null; }
    }
    prevEcgActive.current = ecg.active;

    if (!ecg.data) return;

    const d = ecg.data;

    if (d.smoothedWave !== 0 && d.heartRate === 0) {
      // Wave packet — accumulate into rolling buffer
      setWaveBuffer(prev => {
        const next = [...prev, d.smoothedWave];
        return next.length > WAVE_BUFFER_SIZE ? next.slice(next.length - WAVE_BUFFER_SIZE) : next;
      });
    } else if (d.heartRate >= 30 && d.heartRate <= 240) {
      // Result packet (subtype 0x02 from device) — the device has finished its
      // on-chip NSK Algo analysis. Save, display, then auto-stop.
      setEcgResult(d);
      // Save the ECG heart rate to DB now (auto-stop won't call onVitalsUpdate).
      if (onVitalsUpdate) onVitalsUpdate({ heartRate: d.heartRate });
      scheduleAutoStop('ecg', 500); // brief delay so user sees the result flash in
    }
  }, [measurementState.ecg.data, measurementState.ecg.active]);

  // ─── BP result tracker — auto-save + auto-stop on FINAL result ───────────
  // The SDK emits two kinds of BP packets:
  //   isFinal=false  → intermediate oscillometric sample (cuff still inflating)
  //   isFinal=true   → device's final calculated result (measurement complete)
  // Auto-save and auto-stop only happen on the final packet.
  useEffect(() => {
    const bp = measurementState.bloodPressure;
    if (bp.active && !prevBpActive.current) {
      setBpResult(null);
    }
    if (!bp.active && prevBpActive.current) cancelAutoStop('bloodPressure');
    prevBpActive.current = bp.active;
    if (bp.data?.systolic && bp.data.systolic >= 50) {
      // Always update display (show live cuff pressure while inflating)
      setBpResult(bp.data);
      // Only save + stop on the final result (subtype 0x03 from device)
      if (bp.data.isFinal) {
        if (onVitalsUpdate) {
          onVitalsUpdate({
            bloodPressure: { systolic: bp.data.systolic, diastolic: bp.data.diastolic },
            heartRate: bp.data.heartRate || undefined,
          });
        }
        scheduleAutoStop('bloodPressure', 2000);
      }
    }
  }, [measurementState.bloodPressure.data, measurementState.bloodPressure.active]);

  // ─── Temperature tracker — auto-save + auto-stop when reading arrives ────
  useEffect(() => {
    const t = measurementState.temperature;
    if (t.active && !prevTempActive.current) setTempResult(null);
    if (!t.active && prevTempActive.current) cancelAutoStop('temperature');
    prevTempActive.current = t.active;
    if (t.data?.temperature && t.data.temperature >= 30 && t.data.temperature <= 45) {
      setTempResult(t.data.temperature);
      if (onVitalsUpdate) onVitalsUpdate({ temperature: t.data.temperature });
      scheduleAutoStop('temperature', 2000);
    }
  }, [measurementState.temperature.data, measurementState.temperature.active]);

  // ─── SpO2 tracker — auto-save + auto-stop after 60 s ────────────────────
  useEffect(() => {
    const spo2 = measurementState.spo2;
    if (spo2.active && !prevSpo2Active.current) {
      setSpo2WaveBuffer([]);
      setSpo2Result(null);
      setFingerOn(false);
      lastSpo2SaveTs.current = 0; // Reset throttle so the first reading saves immediately
      setSpo2Countdown(60);
      scheduleAutoStop('spo2', 60_000);
      // Start countdown
      if (spo2CountdownTimer.current) clearInterval(spo2CountdownTimer.current);
      spo2CountdownTimer.current = setInterval(() => {
        setSpo2Countdown(prev => {
          if (prev <= 1) {
            if (spo2CountdownTimer.current) clearInterval(spo2CountdownTimer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    if (!spo2.active && prevSpo2Active.current) {
      cancelAutoStop('spo2');
      if (spo2CountdownTimer.current) { clearInterval(spo2CountdownTimer.current); spo2CountdownTimer.current = null; }
    }
    prevSpo2Active.current = spo2.active;
    if (!spo2.data) return;
    const d = spo2.data;
    // Finger detection packet
    if (d.fingerDetection !== undefined && d.oxygenLevel === 0) {
      setFingerOn(d.fingerDetection);
      return;
    }
    // Wave sample
    if (d.waveValue !== undefined && d.oxygenLevel === 0) {
      setSpo2WaveBuffer(prev => {
        const next = [...prev, d.waveValue!];
        return next.length > WAVE_BUFFER_SIZE ? next.slice(next.length - WAVE_BUFFER_SIZE) : next;
      });
      return;
    }
    // Final result — update display immediately, but throttle DB writes to once per 30 s.
    // SpO2 sends readings every ~2 s; saving every one would flood the database (30/min per patient).
    if (d.oxygenLevel >= 70 && d.oxygenLevel <= 100) {
      setSpo2Result({ oxygenLevel: d.oxygenLevel, heartRate: d.heartRate });
      const now = Date.now();
      if (onVitalsUpdate && now - lastSpo2SaveTs.current >= 30_000) {
        lastSpo2SaveTs.current = now;
        onVitalsUpdate({
          oxygenLevel: d.oxygenLevel,
          heartRate: d.heartRate || undefined,
        });
      }
    }
  }, [measurementState.spo2.data, measurementState.spo2.active]);

  // ─── Glucose result tracker — auto-save + auto-stop on RESULT_READY ──────
  // The SDK emits strip-state notifications (paper inserted, ready…) as intermediate
  // packets. Auto-save and auto-stop only happen when the device sends the actual
  // measurement value (subtype 0x03 → paperState === RESULT_READY).
  useEffect(() => {
    const bg = measurementState.bloodGlucose;
    if (bg.active && !prevGlucoseActive.current) {
      setGlucoseResult(null);
    }
    if (!bg.active && prevGlucoseActive.current) cancelAutoStop('bloodGlucose');
    prevGlucoseActive.current = bg.active;
    if (bg.data?.value && bg.data.value > 0 && bg.data.paperState === BloodGlucosePaperState.RESULT_READY) {
      setGlucoseResult({ value: bg.data.value, unit: bg.data.unit });
      if (onVitalsUpdate) onVitalsUpdate({ bloodGlucose: bg.data.value });
      scheduleAutoStop('bloodGlucose', 2000);
    }
  }, [measurementState.bloodGlucose.data, measurementState.bloodGlucose.active]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleConnect = async () => {
    setActiveAction('connect');
    await scanAndConnect();
    setActiveAction(null);
  };

  const handleDisconnect = async () => {
    setActiveAction('disconnect');
    await disconnect();
    setActiveAction(null);
  };

  const handleMeasurement = async (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => {
    const isActive = measurementState[type]?.active;

    if (isActive) {
      // Measurement is completing — stop and save the final accumulated reading
      await stopMeasurement(type);
      if (onVitalsUpdate && vitalSigns) {
        onVitalsUpdate({
          heartRate: vitalSigns.heartRate || undefined,
          bloodPressure: vitalSigns.bloodPressure || undefined,
          oxygenLevel: vitalSigns.oxygenLevel || undefined,
          temperature: vitalSigns.temperature || undefined,
          bloodGlucose: vitalSigns.bloodGlucose || undefined,
        });
      }
    } else {
      // Measurement is starting — just start, results auto-save via useEffects
      setActiveAction(type);
      await startMeasurement(type);
      setActiveAction(null);
    }
  };

  const getBatteryIcon = () => {
    if (!measurementState.battery) return <Battery className="w-4 h-4" />;
    switch (measurementState.battery.state) {
      case BatteryState.CHARGING:    return <BatteryCharging className="w-4 h-4 text-yellow-500" />;
      case BatteryState.CHARGE_FULL: return <BatteryFull className="w-4 h-4 text-green-500" />;
      default:                       return <Battery className="w-4 h-4" />;
    }
  };

  const getBatteryColor = () => {
    if (!measurementState.battery) return 'bg-gray-200';
    const level = measurementState.battery.level;
    if (level >= 60) return 'bg-green-500';
    if (level >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Detect iframe — Web Bluetooth is blocked inside iframes
  const isInIframe = typeof window !== 'undefined' && window !== window.top;

  if (!isBluetoothSupported() || isInIframe) {
    const standaloneUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
      <div data-testid="device-connector-unsupported">
        <div className="text-center py-4">
          <Bluetooth className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {isRTL ? 'لم يتم توصيل أي جهاز' : 'No device connected'}
          </p>

          {isInIframe ? (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 mt-4 text-left">
              <div className="flex items-start gap-2">
                <BluetoothOff className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {isRTL ? 'مطلوب علامة تبويب مستقلة للبلوتوث' : 'Standalone tab required for Bluetooth'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {isRTL
                      ? 'يتم تشغيل التطبيق داخل إطار مضمّن. يمنع المتصفح الوصول إلى البلوتوث داخل الإطارات.'
                      : 'The app is running inside an embedded frame. Browsers block Bluetooth access inside iframes.'}
                  </p>
                  {standaloneUrl && (
                    <a
                      href={standaloneUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      {isRTL ? 'فتح في علامة تبويب جديدة ←' : 'Open in new tab →'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <Button onClick={handleConnect} className="gap-2 mb-4" data-testid="button-connect-device">
                <Bluetooth className="w-4 h-4" />
                {isRTL ? 'البحث عن الأجهزة' : 'Scan for Devices'}
              </Button>
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 mt-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <BluetoothOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-amber-700">
                      {isRTL ? 'البلوتوث غير متاح في هذا المتصفح' : 'Bluetooth unavailable in this browser'}
                    </p>
                    <p className="text-xs text-amber-600">
                      {isRTL ? 'استخدم Chrome أو Edge على جهاز الكمبيوتر' : 'Use Chrome or Edge on desktop'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {deviceState.isConnected ? (
          <>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <BluetoothConnected className="w-3 h-3 mr-1" />
              {deviceState.deviceInfo?.name || 'Connected'}
            </Badge>
            {measurementState.battery && (
              <Badge variant="outline" className="gap-1">
                {getBatteryIcon()}
                {measurementState.battery.level}%
              </Badge>
            )}
            <Button size="sm" variant="ghost" onClick={handleDisconnect}>
              {isRTL ? 'قطع الاتصال' : 'Disconnect'}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={deviceState.isConnecting}>
            {deviceState.isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bluetooth className="w-4 h-4 mr-2" />
            )}
            {isRTL ? 'ربط الجهاز' : 'Connect Device'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="device-connector">
      {/* Battery bar */}
      {deviceState.isConnected && measurementState.battery && (
        <div className={`flex items-center justify-end gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getBatteryIcon()}
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${getBatteryColor()} transition-all`} style={{ width: `${measurementState.battery.level}%` }} />
          </div>
          <span className="text-sm text-gray-600">{measurementState.battery.level}%</span>
          <Button size="icon" variant="ghost" onClick={refreshBattery}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {!deviceState.isConnected ? (
        <div className="text-center py-4">
          <Bluetooth className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {isRTL ? 'لم يتم توصيل أي جهاز' : 'No device connected'}
          </p>
          <Button
            onClick={handleConnect}
            disabled={deviceState.isConnecting}
            className="gap-2"
            data-testid="button-connect-device"
          >
            {deviceState.isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isRTL ? 'جاري الاتصال...' : 'Connecting...'}
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4" />
                {isRTL ? 'البحث عن الأجهزة' : 'Scan for Devices'}
              </>
            )}
          </Button>
          {deviceState.error && (
            <p className="text-red-500 text-sm mt-2">{deviceState.error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected device header */}
          <div className={`flex items-center justify-between p-3 bg-green-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BluetoothConnected className="w-6 h-6 text-green-600" />
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-medium text-green-800">
                  {deviceState.deviceInfo?.name || 'Health Monitor'}
                </p>
                {deviceState.deviceInfo?.firmwareVersion && (
                  <p className="text-xs text-green-600">FW: {deviceState.deviceInfo.firmwareVersion}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={activeAction === 'disconnect'}
              data-testid="button-disconnect-device"
            >
              {isRTL ? 'قطع الاتصال' : 'Disconnect'}
            </Button>
          </div>

          {/* Measurement buttons */}
          {showMeasurementControls && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant={measurementState.spo2.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('spo2')}
                  disabled={activeAction === 'spo2'}
                  data-testid="button-measure-spo2"
                >
                  {activeAction === 'spo2' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                  {measurementState.spo2.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'أكسجين الدم' : 'SpO2')}
                </Button>

                <Button
                  variant={measurementState.ecg.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('ecg')}
                  disabled={activeAction === 'ecg'}
                  data-testid="button-measure-ecg"
                >
                  {activeAction === 'ecg' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  {measurementState.ecg.active ? (isRTL ? 'إيقاف' : 'Stop') : 'ECG'}
                </Button>

                <Button
                  variant={measurementState.bloodPressure.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('bloodPressure')}
                  disabled={activeAction === 'bloodPressure'}
                  data-testid="button-measure-bp"
                >
                  {activeAction === 'bloodPressure' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                  {measurementState.bloodPressure.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'ضغط الدم' : 'BP')}
                </Button>

                <Button
                  variant={measurementState.temperature.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('temperature')}
                  disabled={activeAction === 'temperature'}
                  data-testid="button-measure-temp"
                >
                  {activeAction === 'temperature' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Thermometer className="w-4 h-4" />}
                  {measurementState.temperature.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'الحرارة' : 'Temp')}
                </Button>

                <Button
                  variant={measurementState.bloodGlucose.active ? "destructive" : "outline"}
                  className="gap-2 col-span-2 md:col-span-1"
                  onClick={() => handleMeasurement('bloodGlucose')}
                  disabled={activeAction === 'bloodGlucose'}
                  data-testid="button-measure-glucose"
                >
                  {activeAction === 'bloodGlucose' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                  {measurementState.bloodGlucose.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'السكر' : 'Glucose')}
                </Button>
              </div>

              {/* Blood glucose strip status */}
              {measurementState.bloodGlucose.active && measurementState.bloodGlucose.data?.paperMessage && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <Droplets className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-800">{measurementState.bloodGlucose.data.paperMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* ── ECG live waveform ─────────────────────────────────────────── */}
          {measurementState.ecg.active && (
            <div className="rounded-lg overflow-hidden border border-gray-800">
              <div className={`flex items-center justify-between px-3 py-1.5 bg-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Activity className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-400">
                    {isRTL ? 'مخطط القلب الكهربائي' : 'ECG Live'}
                  </span>
                </div>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {measurementState.ecg.data?.heartRate && measurementState.ecg.data.heartRate > 0 && (
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Heart className="w-3 h-3 text-red-400 animate-pulse" />
                      <span className="text-xs text-red-400 font-bold">
                        {measurementState.ecg.data.heartRate} bpm
                      </span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Timer className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-mono font-bold">
                      {ecgCountdown}s
                    </span>
                    <span className="text-[10px] text-yellow-600">
                      {isRTL ? 'تسجيل' : 'recording'}
                    </span>
                  </div>
                </div>
              </div>
              <EcgWaveform samples={waveBuffer} />
            </div>
          )}

          {/* ── ECG result card ───────────────────────────────────────────── */}
          {ecgResult && !measurementState.ecg.active && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Activity className="w-4 h-4 text-blue-700" />
                <p className="text-sm font-semibold text-blue-800">
                  {isRTL ? 'نتائج مخطط القلب الكهربائي' : 'ECG Results'}
                </p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {ecgResult.heartRate > 0 && (
                  <EcgMetric
                    icon={<Heart className="w-4 h-4" />}
                    label={isRTL ? 'معدل القلب' : 'Heart Rate'}
                    value={ecgResult.heartRate}
                    unit=" bpm"
                    color="text-red-500"
                  />
                )}
                {ecgResult.hrv > 0 && (
                  <EcgMetric
                    icon={<Activity className="w-4 h-4" />}
                    label="HRV"
                    value={ecgResult.hrv}
                    unit=" ms"
                    color="text-blue-500"
                  />
                )}
                {ecgResult.stress > 0 && (
                  <EcgMetric
                    icon={<Zap className="w-4 h-4" />}
                    label={isRTL ? 'التوتر' : 'Stress'}
                    value={ecgResult.stress}
                    color="text-orange-500"
                  />
                )}
                {ecgResult.mood > 0 && (
                  <EcgMetric
                    icon={<Smile className="w-4 h-4" />}
                    label={isRTL ? 'المزاج' : 'Mood'}
                    value={ecgResult.mood}
                    color="text-yellow-500"
                  />
                )}
                {ecgResult.respiratoryRate > 0 && (
                  <EcgMetric
                    icon={<Wind className="w-4 h-4" />}
                    label={isRTL ? 'التنفس' : 'Resp. Rate'}
                    value={ecgResult.respiratoryRate}
                    unit=" /min"
                    color="text-teal-500"
                  />
                )}
                {ecgResult.heartAge > 0 && (
                  <EcgMetric
                    icon={<Brain className="w-4 h-4" />}
                    label={isRTL ? 'عمر القلب' : 'Heart Age'}
                    value={ecgResult.heartAge}
                    unit=" yr"
                    color="text-purple-500"
                  />
                )}
                {ecgResult.rrMax > 0 && (
                  <EcgMetric
                    icon={<Timer className="w-4 h-4" />}
                    label="RR Max"
                    value={ecgResult.rrMax}
                    unit=" ms"
                    color="text-gray-500"
                  />
                )}
                {ecgResult.rrMin > 0 && (
                  <EcgMetric
                    icon={<Timer className="w-4 h-4" />}
                    label="RR Min"
                    value={ecgResult.rrMin}
                    unit=" ms"
                    color="text-gray-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── SpO2 live pleth waveform ─────────────────────────────────── */}
          {measurementState.spo2.active && (
            <div className="rounded-lg overflow-hidden border border-gray-800">
              <div className={`flex items-center justify-between px-3 py-1.5 bg-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">
                    {isRTL ? 'موجة الأكسجين' : 'SpO2 Live'}
                  </span>
                </div>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Finger detection indicator */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${fingerOn ? 'bg-green-800 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {fingerOn
                      ? (isRTL ? '👆 الإصبع موضوع' : '👆 Finger on')
                      : (isRTL ? '☝️ ضع إصبعك' : '☝️ Place finger')}
                  </span>
                  {measurementState.spo2.data?.oxygenLevel && measurementState.spo2.data.oxygenLevel > 0 && (
                    <span className="text-xs text-blue-300 font-bold">
                      {measurementState.spo2.data.oxygenLevel}%
                    </span>
                  )}
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Timer className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-mono font-bold">{spo2Countdown}s</span>
                  </div>
                </div>
              </div>
              {/* Reuse EcgWaveform with blue override via wrapper */}
              <div className="[&_polyline]:stroke-blue-400">
                <EcgWaveform samples={spo2WaveBuffer} />
              </div>
            </div>
          )}

          {/* ── SpO2 result card ──────────────────────────────────────────── */}
          {spo2Result && !measurementState.spo2.active && (() => {
            const cat = getSpo2Category(spo2Result.oxygenLevel);
            return (
              <div className={`rounded-lg border p-3 ${cat.bg}`}>
                {/* Header */}
                <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Droplets className={`w-4 h-4 ${cat.color}`} />
                    <p className={`text-sm font-semibold ${cat.color}`}>
                      {isRTL ? 'نتائج الأكسجين' : 'SpO2 Results'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cat.color} ${cat.bg}`}>
                    {isRTL ? cat.labelAr : cat.label}
                  </span>
                </div>

                {/* Main SpO2 reading */}
                <div className="flex items-end justify-center gap-6 mb-3">
                  <div className="text-center">
                    <p className={`text-5xl font-bold leading-none ${cat.color}`}>{spo2Result.oxygenLevel}</p>
                    <p className="text-xs text-gray-500 mt-1">SpO2 %</p>
                  </div>
                  {spo2Result.heartRate > 0 && (
                    <div className="text-center pb-1">
                      <div className={`flex items-center gap-1 justify-center`}>
                        <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                        <p className="text-2xl font-semibold text-gray-700 leading-none">{spo2Result.heartRate}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{isRTL ? 'نبضة/د' : 'bpm'}</p>
                    </div>
                  )}
                </div>

                {/* Clinical reference */}
                <div className={`flex text-[10px] text-gray-500 gap-2 flex-wrap justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-green-700">≥95% {isRTL ? 'طبيعي' : 'Normal'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-yellow-700">92–94% {isRTL ? 'خفيف' : 'Mild'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-orange-700">88–91% {isRTL ? 'متوسط' : 'Moderate'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-red-700">{'<88% '}{isRTL ? 'حاد' : 'Severe'}</span>
                </div>
              </div>
            );
          })()}

          {/* ── Blood pressure — measuring animation ─────────────────────── */}
          {measurementState.bloodPressure.active && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Heart className="w-4 h-4 text-blue-600 animate-pulse" />
                <p className="text-sm font-semibold text-blue-800">
                  {isRTL ? 'جاري قياس ضغط الدم…' : 'Measuring blood pressure…'}
                </p>
              </div>
              {bpResult ? (
                <div className={`flex items-end gap-3 justify-center py-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-700 leading-none">{bpResult.systolic}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{isRTL ? 'الانقباضي' : 'Systolic'}</p>
                  </div>
                  <p className="text-xl font-light text-blue-500 mb-1">/</p>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-700 leading-none">{bpResult.diastolic}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{isRTL ? 'الانبساطي' : 'Diastolic'}</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">mmHg</p>
                </div>
              ) : (
                <div className="flex justify-center gap-1 py-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Blood pressure result card ──────────────────────────────── */}
          {bpResult && !measurementState.bloodPressure.active && (() => {
            const cat = getBpCategory(bpResult.systolic, bpResult.diastolic);
            const pulsePressure = bpResult.systolic - bpResult.diastolic;
            const map = Math.round(bpResult.diastolic + pulsePressure / 3);
            return (
              <div className={`rounded-lg border p-3 ${cat.bg}`}>
                {/* Header */}
                <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Heart className={`w-4 h-4 ${cat.color}`} />
                    <p className={`text-sm font-semibold ${cat.color}`}>
                      {isRTL ? 'نتائج ضغط الدم' : 'Blood Pressure Results'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cat.color} ${cat.bg}`}>
                    {isRTL ? cat.labelAr : cat.label}
                  </span>
                </div>

                {/* Main reading — large display */}
                <div className={`flex items-end gap-4 justify-center mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="text-center">
                    <p className={`text-4xl font-bold leading-none ${cat.color}`}>{bpResult.systolic}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{isRTL ? 'الانقباضي' : 'Systolic'}</p>
                  </div>
                  <p className={`text-2xl font-light mb-1 ${cat.color}`}>/</p>
                  <div className="text-center">
                    <p className={`text-4xl font-bold leading-none ${cat.color}`}>{bpResult.diastolic}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{isRTL ? 'الانبساطي' : 'Diastolic'}</p>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">mmHg</p>
                </div>

                {/* Secondary metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {bpResult.heartRate > 0 && (
                    <div className="flex flex-col items-center p-2 bg-white/70 rounded-lg">
                      <Heart className="w-3.5 h-3.5 text-red-500 mb-1" />
                      <p className="text-base font-bold text-gray-800 leading-none">{bpResult.heartRate}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{isRTL ? 'نبضة/د' : 'bpm'}</p>
                    </div>
                  )}
                  <div className="flex flex-col items-center p-2 bg-white/70 rounded-lg">
                    <Activity className="w-3.5 h-3.5 text-indigo-500 mb-1" />
                    <p className="text-base font-bold text-gray-800 leading-none">{pulsePressure}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{isRTL ? 'ضغط النبض' : 'Pulse Pr.'}</p>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/70 rounded-lg">
                    <Wind className="w-3.5 h-3.5 text-teal-500 mb-1" />
                    <p className="text-base font-bold text-gray-800 leading-none">{map}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">MAP</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Blood glucose result card ────────────────────────────────── */}
          {glucoseResult && !measurementState.bloodGlucose.active && (() => {
            const mgdl = glucoseResult.unit === 'mmol/L'
              ? Math.round(glucoseResult.value * 18.016)
              : glucoseResult.value;
            const mmol = (mgdl / 18.016).toFixed(1);
            const cat = getGlucoseCategory(mgdl);
            return (
              <div className={`rounded-lg border p-3 ${cat.bg}`}>
                {/* Header */}
                <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Droplets className={`w-4 h-4 ${cat.color}`} />
                    <p className={`text-sm font-semibold ${cat.color}`}>
                      {isRTL ? 'نتائج سكر الدم' : 'Blood Glucose Results'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cat.color} ${cat.bg}`}>
                    {cat.icon} {isRTL ? cat.labelAr : cat.label}
                  </span>
                </div>

                {/* Main value — dual unit display */}
                <div className="flex items-end justify-center gap-6 mb-3">
                  <div className="text-center">
                    <p className={`text-5xl font-bold leading-none ${cat.color}`}>{mgdl}</p>
                    <p className="text-xs text-gray-500 mt-1">mg/dL</p>
                  </div>
                  <div className="text-center pb-1">
                    <p className="text-2xl font-semibold text-gray-400 leading-none">{mmol}</p>
                    <p className="text-xs text-gray-400 mt-1">mmol/L</p>
                  </div>
                </div>

                {/* ADA reference ranges */}
                <div className={`flex text-[10px] text-gray-500 gap-2 flex-wrap justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded">{'<70 '}{isRTL ? 'منخفض' : 'Low'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded">70–99 {isRTL ? 'طبيعي' : 'Normal'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded">100–125 {isRTL ? 'ما قبل السكري' : 'Pre-DM'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded">{'≥126 '}{isRTL ? 'سكري' : 'Diabetes'}</span>
                </div>
              </div>
            );
          })()}

          {/* ── Temperature — measuring animation ────────────────────────── */}
          {measurementState.temperature.active && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Thermometer className="w-4 h-4 text-orange-500 animate-pulse" />
                <p className="text-sm font-semibold text-orange-800">
                  {isRTL ? 'جاري قياس درجة الحرارة…' : 'Measuring temperature…'}
                </p>
              </div>
              <div className="flex justify-center gap-1 py-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Temperature result card ──────────────────────────────────── */}
          {tempResult && !measurementState.temperature.active && (() => {
            const cat = getTempCategory(tempResult);
            const fahrenheit = ((tempResult * 9) / 5 + 32).toFixed(1);
            return (
              <div className={`rounded-lg border p-3 ${cat.bg}`}>
                {/* Header */}
                <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Thermometer className={`w-4 h-4 ${cat.color}`} />
                    <p className={`text-sm font-semibold ${cat.color}`}>
                      {isRTL ? 'نتائج درجة الحرارة' : 'Temperature Results'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cat.color} ${cat.bg}`}>
                    {isRTL ? cat.labelAr : cat.label}
                  </span>
                </div>

                {/* Main reading — dual unit */}
                <div className="flex items-end justify-center gap-6 mb-3">
                  <div className="text-center">
                    <p className={`text-5xl font-bold leading-none ${cat.color}`}>{tempResult.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">°C</p>
                  </div>
                  <div className="text-center pb-1">
                    <p className="text-2xl font-semibold text-gray-400 leading-none">{fahrenheit}</p>
                    <p className="text-xs text-gray-400 mt-1">°F</p>
                  </div>
                </div>

                {/* Clinical reference */}
                <div className={`flex text-[10px] text-gray-500 gap-2 flex-wrap justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-blue-700">{'<35 '}{isRTL ? 'انخفاض' : 'Hypo'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-green-700">36.5–37.5 {isRTL ? 'طبيعي' : 'Normal'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-yellow-700">37.6–38 {isRTL ? 'خفيف' : 'Low fever'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-orange-700">38.1–39 {isRTL ? 'حمى' : 'Fever'}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-red-700">{'>39 '}{isRTL ? 'شديد' : 'High'}</span>
                </div>
              </div>
            );
          })()}

          {/* Current readings summary */}
          {(vitalSigns.heartRate || vitalSigns.oxygenLevel || vitalSigns.bloodPressure || vitalSigns.temperature || vitalSigns.bloodGlucose) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                {isRTL ? 'القراءات الحالية' : 'Current Readings'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {vitalSigns.heartRate && (
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>{vitalSigns.heartRate} bpm</span>
                  </div>
                )}
                {vitalSigns.oxygenLevel && (
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{vitalSigns.oxygenLevel}%</span>
                  </div>
                )}
                {vitalSigns.bloodPressure && (
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Activity className="w-3 h-3 text-green-500" />
                    <span>{vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic}</span>
                  </div>
                )}
                {vitalSigns.temperature && (
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Thermometer className="w-3 h-3 text-orange-500" />
                    <span>{vitalSigns.temperature.toFixed(1)}°C</span>
                  </div>
                )}
                {vitalSigns.bloodGlucose && (
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Droplets className="w-3 h-3 text-purple-500" />
                    <span>{vitalSigns.bloodGlucose} mg/dL</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
