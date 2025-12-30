/**
 * React hook for Linktop Health Monitor device integration
 * Bridges to DeviceDataContext for backward compatibility
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import linktopSdk, { 
  DeviceInfo, 
  MeasurementData, 
  BatteryData,
  ECGData,
  SpO2Data,
  BloodPressureData,
  TemperatureData,
  BloodGlucoseData
} from '@/lib/linktop-sdk';
import { useDeviceData, DetectionType } from '@/contexts/DeviceDataContext';

export interface DeviceState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceInfo: DeviceInfo | null;
  error: string | null;
}

export interface VitalSigns {
  heartRate: number | null;
  bloodPressure: { systolic: number; diastolic: number } | null;
  oxygenLevel: number | null;
  temperature: number | null;
  bloodGlucose: number | null;
  timestamp: string | null;
}

export interface MeasurementState {
  ecg: { active: boolean; data: ECGData | null };
  spo2: { active: boolean; data: SpO2Data | null };
  bloodPressure: { active: boolean; data: BloodPressureData | null };
  temperature: { active: boolean; data: TemperatureData | null };
  bloodGlucose: { active: boolean; data: BloodGlucoseData | null };
  battery: BatteryData | null;
}

export function useLinktopDevice() {
  const { updateConnection, updateReading, clearReading } = useDeviceData();
  
  const [deviceState, setDeviceState] = useState<DeviceState>({
    isConnected: false,
    isConnecting: false,
    deviceInfo: null,
    error: null,
  });

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    heartRate: null,
    bloodPressure: null,
    oxygenLevel: null,
    temperature: null,
    bloodGlucose: null,
    timestamp: null,
  });

  const [measurementState, setMeasurementState] = useState<MeasurementState>({
    ecg: { active: false, data: null },
    spo2: { active: false, data: null },
    bloodPressure: { active: false, data: null },
    temperature: { active: false, data: null },
    bloodGlucose: { active: false, data: null },
    battery: null,
  });

  const callbackId = useRef(`linktop-${Date.now()}`);
  const measurementTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const autoStopEnabled = useRef(true);
  const validReadingCounts = useRef<{ [key: string]: number }>({});
  
  // Auto-stop helper - stops measurement after valid reading
  const autoStopMeasurement = useCallback(async (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => {
    if (!autoStopEnabled.current) return;
    
    // Clear any pending timeout
    if (measurementTimeouts.current[type]) {
      clearTimeout(measurementTimeouts.current[type]);
      delete measurementTimeouts.current[type];
    }
    
    console.log(`[useLinktopDevice] Auto-stopping ${type} measurement after valid reading`);
    
    try {
      switch (type) {
        case 'ecg':
          await linktopSdk.stopECG();
          setMeasurementState(prev => ({ ...prev, ecg: { ...prev.ecg, active: false } }));
          break;
        case 'spo2':
          await linktopSdk.stopSpO2();
          setMeasurementState(prev => ({ ...prev, spo2: { ...prev.spo2, active: false } }));
          break;
        case 'bloodPressure':
          await linktopSdk.stopBloodPressure();
          setMeasurementState(prev => ({ ...prev, bloodPressure: { ...prev.bloodPressure, active: false } }));
          break;
        case 'temperature':
          await linktopSdk.stopTemperature();
          setMeasurementState(prev => ({ ...prev, temperature: { ...prev.temperature, active: false } }));
          break;
        case 'bloodGlucose':
          await linktopSdk.stopBloodGlucose();
          setMeasurementState(prev => ({ ...prev, bloodGlucose: { ...prev.bloodGlucose, active: false } }));
          break;
      }
      // Reset valid reading count
      validReadingCounts.current[type] = 0;
    } catch (error) {
      console.error(`Error auto-stopping ${type}:`, error);
    }
  }, []);
  
  const clearAllReadings = useCallback(() => {
    const allTypes = [DetectionType.ECG, DetectionType.OX, DetectionType.BP, DetectionType.BT, DetectionType.BG, DetectionType.BATTERY];
    allTypes.forEach(type => {
      clearReading(type);
    });
  }, [clearReading]);
  
  const bridgeToDeviceDataContext = useCallback((type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose' | 'battery', data: any) => {
    switch (type) {
      case 'ecg':
        updateReading(DetectionType.ECG, {
          heartRate: data.heartRate,
          moodIndex: data.mood,
          rrInterval: data.r2rInterval,
          hrv: data.hrv,
          respiratoryRate: data.breathRate,
          fingerDetected: data.fingerTouch,
          wave: data.smoothedWave !== undefined ? [data.smoothedWave] : undefined,
        });
        break;
      case 'spo2':
        updateReading(DetectionType.OX, {
          bloodOxygen: data.oxygenLevel,
          heartRate: data.heartRate,
          wave: data.waveValue !== undefined ? [data.waveValue] : undefined,
        });
        break;
      case 'bloodPressure':
        updateReading(DetectionType.BP, {
          systolic: data.systolic,
          diastolic: data.diastolic,
          heartRate: data.heartRate,
        });
        break;
      case 'temperature':
        updateReading(DetectionType.BT, {
          temperature: data.temperature,
          unit: 'C',
        });
        break;
      case 'bloodGlucose':
        updateReading(DetectionType.BG, {
          glucoseLevel: data.value,
          measurementType: data.unit === 'mmol/L' ? 'mmol/L' : 'mg/dL',
        });
        break;
      case 'battery':
        const batteryStateMap: Record<number, 'charging' | 'discharging' | 'full' | 'low'> = {
          0: 'discharging',
          1: 'charging',
          2: 'full',
        };
        updateReading(DetectionType.BATTERY, {
          level: data.level,
          state: batteryStateMap[data.state] || 'discharging',
        });
        break;
    }
  }, [updateReading]);

  useEffect(() => {
    const handleMeasurement = (measurement: MeasurementData) => {
      console.log('[useLinktopDevice] Received measurement:', measurement);
      const timestamp = new Date().toISOString();
      
      switch (measurement.type) {
        case 'battery':
          setMeasurementState(prev => ({
            ...prev,
            battery: measurement.data,
          }));
          bridgeToDeviceDataContext('battery', measurement.data);
          break;
          
        case 'ecg':
          setMeasurementState(prev => ({
            ...prev,
            ecg: { ...prev.ecg, data: measurement.data },
          }));
          bridgeToDeviceDataContext('ecg', measurement.data);
          if (measurement.data.heartRate > 0) {
            setVitalSigns(prev => ({
              ...prev,
              heartRate: measurement.data.heartRate,
              timestamp,
            }));
          }
          break;
          
        case 'spo2':
          console.log('[useLinktopDevice] Processing SpO2:', measurement.data);
          setMeasurementState(prev => ({
            ...prev,
            spo2: { ...prev.spo2, data: measurement.data },
          }));
          bridgeToDeviceDataContext('spo2', measurement.data);
          if (measurement.data.oxygenLevel > 0) {
            console.log('[useLinktopDevice] Updating vitalSigns with SpO2:', measurement.data.oxygenLevel);
            setVitalSigns(prev => {
              const newVitals = {
                ...prev,
                oxygenLevel: measurement.data.oxygenLevel,
                heartRate: measurement.data.heartRate || prev.heartRate,
                timestamp,
              };
              console.log('[useLinktopDevice] New vitalSigns:', newVitals);
              return newVitals;
            });
            // Auto-stop after receiving valid SpO2 reading (count 2 consecutive valid readings)
            validReadingCounts.current['spo2'] = (validReadingCounts.current['spo2'] || 0) + 1;
            if (validReadingCounts.current['spo2'] >= 2) {
              autoStopMeasurement('spo2');
            }
          }
          break;
          
        case 'bloodPressure':
          setMeasurementState(prev => ({
            ...prev,
            bloodPressure: { ...prev.bloodPressure, data: measurement.data },
          }));
          bridgeToDeviceDataContext('bloodPressure', measurement.data);
          if (measurement.data.systolic > 0 && measurement.data.diastolic > 0) {
            setVitalSigns(prev => ({
              ...prev,
              bloodPressure: { 
                systolic: measurement.data.systolic, 
                diastolic: measurement.data.diastolic 
              },
              heartRate: measurement.data.heartRate || prev.heartRate,
              timestamp,
            }));
            // Auto-stop after receiving valid BP reading
            autoStopMeasurement('bloodPressure');
          }
          break;
          
        case 'temperature':
          setMeasurementState(prev => ({
            ...prev,
            temperature: { ...prev.temperature, data: measurement.data },
          }));
          bridgeToDeviceDataContext('temperature', measurement.data);
          if (measurement.data.temperature > 0) {
            setVitalSigns(prev => ({
              ...prev,
              temperature: measurement.data.temperature,
              timestamp,
            }));
            // Auto-stop after receiving valid temperature reading
            autoStopMeasurement('temperature');
          }
          break;
          
        case 'bloodGlucose':
          setMeasurementState(prev => ({
            ...prev,
            bloodGlucose: { ...prev.bloodGlucose, data: measurement.data },
          }));
          bridgeToDeviceDataContext('bloodGlucose', measurement.data);
          if (measurement.data.value > 0) {
            setVitalSigns(prev => ({
              ...prev,
              bloodGlucose: measurement.data.value,
              timestamp,
            }));
            // Auto-stop after receiving valid blood glucose reading
            autoStopMeasurement('bloodGlucose');
          }
          break;
      }
    };

    const handleConnectionChange = (connected: boolean) => {
      const deviceInfo = connected ? linktopSdk.getDeviceInfo() : null;
      setDeviceState(prev => ({
        ...prev,
        isConnected: connected,
        isConnecting: false,
        deviceInfo,
      }));
      
      const allTypes = [DetectionType.ECG, DetectionType.OX, DetectionType.BP, DetectionType.BT, DetectionType.BG, DetectionType.BATTERY];
      allTypes.forEach(type => {
        updateConnection(type, {
          deviceId: deviceInfo?.id || null,
          deviceName: deviceInfo?.name || null,
          connected,
          detectionType: type,
        });
      });
      
      if (!connected) {
        setMeasurementState({
          ecg: { active: false, data: null },
          spo2: { active: false, data: null },
          bloodPressure: { active: false, data: null },
          temperature: { active: false, data: null },
          bloodGlucose: { active: false, data: null },
          battery: null,
        });
        clearAllReadings();
      }
    };

    linktopSdk.onMeasurement(callbackId.current, handleMeasurement);
    linktopSdk.onConnectionChange(handleConnectionChange);

    return () => {
      linktopSdk.offMeasurement(callbackId.current);
      linktopSdk.offConnectionChange(handleConnectionChange);
    };
  }, [bridgeToDeviceDataContext, updateConnection, clearAllReadings, autoStopMeasurement]);

  const isBluetoothSupported = useCallback(() => {
    return linktopSdk.isSupported();
  }, []);

  const scanAndConnect = useCallback(async () => {
    setDeviceState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const deviceInfo = await linktopSdk.connect();
      setDeviceState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        deviceInfo,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setDeviceState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await linktopSdk.disconnect();
  }, []);

  const startMeasurement = useCallback(async (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => {
    if (!deviceState.isConnected) return false;
    
    // Reset reading count for this measurement type (for auto-stop logic)
    validReadingCounts.current[type] = 0;
    
    try {
      switch (type) {
        case 'ecg':
          await linktopSdk.startECG();
          setMeasurementState(prev => ({ ...prev, ecg: { ...prev.ecg, active: true } }));
          break;
        case 'spo2':
          await linktopSdk.startSpO2();
          setMeasurementState(prev => ({ ...prev, spo2: { ...prev.spo2, active: true } }));
          break;
        case 'bloodPressure':
          await linktopSdk.startBloodPressure();
          setMeasurementState(prev => ({ ...prev, bloodPressure: { ...prev.bloodPressure, active: true } }));
          break;
        case 'temperature':
          await linktopSdk.startTemperature();
          setMeasurementState(prev => ({ ...prev, temperature: { ...prev.temperature, active: true } }));
          break;
        case 'bloodGlucose':
          await linktopSdk.startBloodGlucose();
          setMeasurementState(prev => ({ ...prev, bloodGlucose: { ...prev.bloodGlucose, active: true } }));
          break;
      }
      return true;
    } catch (error) {
      console.error(`Error starting ${type} measurement:`, error);
      return false;
    }
  }, [deviceState.isConnected]);

  const stopMeasurement = useCallback(async (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => {
    try {
      switch (type) {
        case 'ecg':
          await linktopSdk.stopECG();
          setMeasurementState(prev => ({ ...prev, ecg: { ...prev.ecg, active: false } }));
          break;
        case 'spo2':
          await linktopSdk.stopSpO2();
          setMeasurementState(prev => ({ ...prev, spo2: { ...prev.spo2, active: false } }));
          break;
        case 'bloodPressure':
          await linktopSdk.stopBloodPressure();
          setMeasurementState(prev => ({ ...prev, bloodPressure: { ...prev.bloodPressure, active: false } }));
          break;
        case 'temperature':
          await linktopSdk.stopTemperature();
          setMeasurementState(prev => ({ ...prev, temperature: { ...prev.temperature, active: false } }));
          break;
        case 'bloodGlucose':
          await linktopSdk.stopBloodGlucose();
          setMeasurementState(prev => ({ ...prev, bloodGlucose: { ...prev.bloodGlucose, active: false } }));
          break;
      }
    } catch (error) {
      console.error(`Error stopping ${type} measurement:`, error);
    }
  }, []);

  const refreshBattery = useCallback(async () => {
    if (deviceState.isConnected) {
      await linktopSdk.queryBattery();
    }
  }, [deviceState.isConnected]);

  return {
    deviceState,
    vitalSigns,
    measurementState,
    isBluetoothSupported,
    scanAndConnect,
    disconnect,
    startMeasurement,
    stopMeasurement,
    refreshBattery,
  };
}

export default useLinktopDevice;
