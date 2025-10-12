import { WebPlugin } from '@capacitor/core';
import type { HC03BluetoothPlugin } from './hc03-bluetooth';

export class HC03BluetoothWeb extends WebPlugin implements HC03BluetoothPlugin {
  async initialize(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'HC03 native plugin not available on web. Use Web Bluetooth API instead.'
    };
  }

  async processEcgData(options: { data: string }): Promise<{ success: boolean }> {
    console.log('HC03 web plugin - processEcgData not supported:', options);
    return { success: false };
  }
}
