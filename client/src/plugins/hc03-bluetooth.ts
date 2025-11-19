import { registerPlugin } from '@capacitor/core';

export interface HC03BluetoothPlugin {
  initialize(): Promise<{ success: boolean; message: string }>;
  parseData(options: { data: number[] }): Promise<{ success: boolean }>;
  startDetect(options: { detection: string }): Promise<{ success: boolean }>;
  stopDetect(options: { detection: string }): Promise<{ success: boolean }>;
  addListener(
    eventName: 'hc03:battery:level' | 'hc03:temperature:data' | 'hc03:bloodglucose:result' | 
              'hc03:bloodoxygen:data' | 'hc03:bloodpressure:result' | 'hc03:ecg:wave' | 
              'hc03:ecg:metrics' | 'detectionStarted' | 'detectionStopped',
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
