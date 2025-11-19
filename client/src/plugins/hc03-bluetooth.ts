import { registerPlugin } from '@capacitor/core';

export interface HC03BluetoothPlugin {
  // SDK initialization
  initialize(): Promise<{ success: boolean; message: string }>;
  
  // Data processing
  parseData(options: { data: number[] }): Promise<{ success: boolean }>;
  
  // Detection control
  startDetect(options: { detection: string }): Promise<{ success: boolean }>;
  stopDetect(options: { detection: string }): Promise<{ success: boolean }>;
  
  // BLE Connection methods (Android/iOS native)
  startScan(): Promise<{ success: boolean; message?: string }>;
  stopScan(): Promise<{ success: boolean; message?: string }>;
  connect(options: { deviceAddress: string }): Promise<{ success: boolean }>;
  disconnect(): Promise<{ success: boolean }>;
  
  // Event listeners
  addListener(
    eventName: 'hc03:battery:level' | 'hc03:temperature:data' | 'hc03:bloodglucose:result' | 
              'hc03:bloodoxygen:data' | 'hc03:bloodpressure:result' | 'hc03:ecg:wave' | 
              'hc03:ecg:metrics' | 'detectionStarted' | 'detectionStopped' |
              'hc03:connection:state' | 'hc03:connection:error' | 'hc03:device:found' |
              'hc03:device:ready' | 'hc03:bluetooth:state' | 'hc03:scan:complete',
    listenerFunc: (data: any) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}

export interface EcgDataEvent {
  type: string;
  data?: number;
  value?: number;
  level?: number;
  isTouch?: boolean;
}

const HC03Bluetooth = registerPlugin<HC03BluetoothPlugin>('HC03Bluetooth');

export default HC03Bluetooth;
