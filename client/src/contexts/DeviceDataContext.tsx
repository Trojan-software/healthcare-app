import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Detection types (formerly from SDK)
export enum DetectionType {
  BT = 'BT',       // Body Temperature
  OX = 'OX',       // Blood Oxygen
  ECG = 'ECG',     // Electrocardiogram
  BP = 'BP',       // Blood Pressure
  BG = 'BG',       // Blood Glucose
  BATTERY = 'BAT', // Battery status
}

interface ECGReading {
  heartRate?: number;
  moodIndex?: number;
  rrInterval?: number;
  hrv?: number;
  respiratoryRate?: number;
  fingerDetected?: boolean;
  wave?: number[];
}

interface SpO2Reading {
  bloodOxygen?: number;
  heartRate?: number;
  fingerDetected?: boolean;
  wave?: number[];
}

interface BloodPressureReading {
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  cuffPressure?: number;
  measurementProgress?: number;
}

interface BloodGlucoseReading {
  glucoseLevel?: number;
  testStripStatus?: string;
  measurementType?: string;
}

interface TemperatureReading {
  temperature?: number;
  measurementSite?: string;
  unit?: 'C' | 'F';
}

type DeviceReading = ECGReading | SpO2Reading | BloodPressureReading | BloodGlucoseReading | TemperatureReading;

interface DeviceConnection {
  deviceId: string | null;
  deviceName: string | null;
  connected: boolean;
  detectionType: DetectionType | null;
}

interface DeviceDataContextType {
  connections: Record<DetectionType, DeviceConnection>;
  liveReadings: Record<DetectionType, DeviceReading>;
  updateConnection: (type: DetectionType, connection: DeviceConnection) => void;
  updateReading: (type: DetectionType, reading: DeviceReading) => void;
  clearReading: (type: DetectionType) => void;
  isConnected: (type: DetectionType) => boolean;
  getLatestReading: (type: DetectionType) => DeviceReading | null;
}

const DeviceDataContext = createContext<DeviceDataContextType | undefined>(undefined);

const initialConnection: DeviceConnection = {
  deviceId: null,
  deviceName: null,
  connected: false,
  detectionType: null,
};

export function DeviceDataProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Record<DetectionType, DeviceConnection>>({
    [DetectionType.BT]: initialConnection,
    [DetectionType.OX]: initialConnection,
    [DetectionType.ECG]: initialConnection,
    [DetectionType.BP]: initialConnection,
    [DetectionType.BG]: initialConnection,
    [DetectionType.BATTERY]: initialConnection,
  });

  const [liveReadings, setLiveReadings] = useState<Record<DetectionType, DeviceReading>>({
    [DetectionType.BT]: {},
    [DetectionType.OX]: {},
    [DetectionType.ECG]: {},
    [DetectionType.BP]: {},
    [DetectionType.BG]: {},
    [DetectionType.BATTERY]: {},
  });

  const updateConnection = useCallback((type: DetectionType, connection: DeviceConnection) => {
    setConnections(prev => ({
      ...prev,
      [type]: connection,
    }));
  }, []);

  const updateReading = useCallback((type: DetectionType, reading: DeviceReading) => {
    setLiveReadings(prev => ({
      ...prev,
      [type]: reading,
    }));
  }, []);

  const clearReading = useCallback((type: DetectionType) => {
    setLiveReadings(prev => ({
      ...prev,
      [type]: {},
    }));
  }, []);

  const isConnected = useCallback((type: DetectionType) => {
    return connections[type]?.connected ?? false;
  }, [connections]);

  const getLatestReading = useCallback((type: DetectionType) => {
    const reading = liveReadings[type];
    return reading && Object.keys(reading).length > 0 ? reading : null;
  }, [liveReadings]);

  return (
    <DeviceDataContext.Provider
      value={{
        connections,
        liveReadings,
        updateConnection,
        updateReading,
        clearReading,
        isConnected,
        getLatestReading,
      }}
    >
      {children}
    </DeviceDataContext.Provider>
  );
}

export function useDeviceData() {
  const context = useContext(DeviceDataContext);
  if (!context) {
    throw new Error('useDeviceData must be used within DeviceDataProvider');
  }
  return context;
}
