/**
 * Device Context for sharing Linktop device state across components
 */
import { createContext, useContext, ReactNode } from 'react';
import useLinktopDevice, { DeviceState, VitalSigns, MeasurementState } from '@/hooks/useLinktopDevice';

interface DeviceContextType {
  deviceState: DeviceState;
  vitalSigns: VitalSigns;
  measurementState: MeasurementState;
  isBluetoothSupported: () => boolean;
  scanAndConnect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  startMeasurement: (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => Promise<boolean>;
  stopMeasurement: (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => Promise<void>;
  refreshBattery: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const device = useLinktopDevice();
  
  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}

export default DeviceContext;
