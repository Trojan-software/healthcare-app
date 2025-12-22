import { WebPlugin } from '@capacitor/core';
import type { HC03BluetoothPlugin } from './hc03-bluetooth';

export class HC03BluetoothWeb extends WebPlugin implements HC03BluetoothPlugin {
  async initialize(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'HC03 native plugin not available on web. Use Web Bluetooth API instead.'
    };
  }

  async parseData(_options: { data: number[] }): Promise<{ success: boolean }> {
    return { success: false };
  }

  async startDetect(_options: { detection: string }): Promise<{ success: boolean }> {
    return { success: false };
  }

  async stopDetect(_options: { detection: string }): Promise<{ success: boolean }> {
    return { success: false };
  }

  async startScan(): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Web Bluetooth API should be used instead' };
  }

  async stopScan(): Promise<{ success: boolean; message?: string }> {
    return { success: false };
  }

  async connect(_options: { deviceAddress: string }): Promise<{ success: boolean }> {
    return { success: false };
  }

  async disconnect(): Promise<{ success: boolean }> {
    return { success: false };
  }
}
