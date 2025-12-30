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
  
  const clearAllReadings = useCallback(() => {
    const allTypes = [DetectionType.ECG, DetectionType.OX, DetectionType.BP, DetectionType.BT, DetectionType.BG];
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
          rrInterval: data.rrMin && data.rrMax ? (data.rrMin + data.rrMax) / 2 : undefined,
          hrv: data.hrv,
          wave: data.smoothedWave,
        });
        break;
      case 'spo2':
        updateReading(DetectionType.OX, {
          bloodOxygen: data.oxygenLevel,
          heartRate: data.heartRate,
          wave: data.waveform,
        });
        break;
      case 'bloodPressure':
        updateReading(DetectionType.BP, {
          systolic: data.systolic,
          diastolic: data.diastolic,
          heartRate: data.heartRate,
          cuffPressure: data.cuffPressure,
          measurementProgress: data.progress,
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
        });
        break;
      case 'battery':
        break;
    }
  }, [updateReading]);

  useEffect(() => {
    const handleMeasurement = (measurement: MeasurementData) => {
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
          setMeasurementState(prev => ({
            ...prev,
            spo2: { ...prev.spo2, data: measurement.data },
          }));
          bridgeToDeviceDataContext('spo2', measurement.data);
          if (measurement.data.oxygenLevel > 0) {
            setVitalSigns(prev => ({
              ...prev,
              oxygenLevel: measurement.data.oxygenLevel,
              heartRate: measurement.data.heartRate || prev.heartRate,
              timestamp,
            }));
          }
          break;
          
        case 'bloodPressure':
          setMeasurementState(prev => ({
            ...prev,
            bloodPressure: { ...prev.bloodPressure, data: measurement.data },
          }));
          bridgeToDeviceDataContext('bloodPressure', measurement.data);
          setVitalSigns(prev => ({
            ...prev,
            bloodPressure: { 
              systolic: measurement.data.systolic, 
              diastolic: measurement.data.diastolic 
            },
            heartRate: measurement.data.heartRate || prev.heartRate,
            timestamp,
          }));
          break;
          
        case 'temperature':
          setMeasurementState(prev => ({
            ...prev,
            temperature: { ...prev.temperature, data: measurement.data },
          }));
          bridgeToDeviceDataContext('temperature', measurement.data);
          setVitalSigns(prev => ({
            ...prev,
            temperature: measurement.data.temperature,
            timestamp,
          }));
          break;
          
        case 'bloodGlucose':
          setMeasurementState(prev => ({
            ...prev,
            bloodGlucose: { ...prev.bloodGlucose, data: measurement.data },
          }));
          bridgeToDeviceDataContext('bloodGlucose', measurement.data);
          setVitalSigns(prev => ({
            ...prev,
            bloodGlucose: measurement.data.value,
            timestamp,
          }));
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
          deviceId: deviceInfo?.deviceId || null,
          deviceName: deviceInfo?.deviceName || null,
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
  }, [bridgeToDeviceDataContext, updateConnection, clearAllReadings]);

  const isBluetoothSupported = useCallback(() => {
    return linktopSdk.isBluetoothSupported();
  }, []);

  const scanAndConnect = useCallback(async () => {
    setDeviceState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const deviceInfo = await linktopSdk.requestDevice();
      if (deviceInfo) {
        await linktopSdk.connect();
        setDeviceState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          deviceInfo,
        }));
        return true;
      }
      setDeviceState(prev => ({ ...prev, isConnecting: false }));
      return false;
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
      await linktopSdk.requestBattery();
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
