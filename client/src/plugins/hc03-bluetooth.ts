import { registerPlugin } from '@capacitor/core';

export interface HC03BluetoothPlugin {
  initialize(): Promise<{ success: boolean; message: string }>;
  processEcgData(options: { data: string }): Promise<{ success: boolean }>;
  addListener(
    eventName: 'ecgData',
    listenerFunc: (data: EcgDataEvent) => void
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
