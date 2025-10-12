/**
 * HC03 Native Bluetooth Service
 * Uses Capacitor plugin for native Android Bluetooth when available
 * Falls back to Web Bluetooth API for web browsers
 */

import { Capacitor } from '@capacitor/core';
import HC03Bluetooth, { type EcgDataEvent } from '../plugins/hc03-bluetooth';
import { BluetoothService as WebBluetoothService } from './BluetoothService';

export class HC03NativeService {
  private isNativeAvailable: boolean;
  private webService: WebBluetoothService | null = null;
  private isInitialized = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.isNativeAvailable = Capacitor.isNativePlatform();
    console.log(`HC03 Service initialized - Native: ${this.isNativeAvailable}`);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isNativeAvailable) {
      try {
        const result = await HC03Bluetooth.initialize();
        if (result.success) {
          this.setupNativeListeners();
          this.isInitialized = true;
          console.log('Native HC03 plugin initialized');
        } else {
          console.warn('Native plugin failed, falling back to Web Bluetooth:', result.message);
          this.fallbackToWebBluetooth();
        }
      } catch (error) {
        console.error('Native plugin error, falling back to Web Bluetooth:', error);
        this.fallbackToWebBluetooth();
      }
    } else {
      this.fallbackToWebBluetooth();
    }
  }

  private fallbackToWebBluetooth(): void {
    this.isNativeAvailable = false;
    try {
      this.webService = new WebBluetoothService();
      this.isInitialized = true;
      console.log('Using Web Bluetooth API');
    } catch (error) {
      console.error('Web Bluetooth not available:', error);
      throw error;
    }
  }

  private setupNativeListeners(): void {
    HC03Bluetooth.addListener('ecgData', (event: EcgDataEvent) => {
      this.handleNativeData(event);
    });
  }

  private handleNativeData(event: EcgDataEvent): void {
    console.log('Native ECG data received:', event);
    
    switch (event.type) {
      case 'wave':
        this.emit('ecgWave', { wave: event.data });
        break;
      case 'HR':
        this.emit('heartRate', { value: event.value });
        break;
      case 'Mood Index':
        this.emit('moodIndex', { value: event.value });
        break;
      case 'RR':
        this.emit('rrInterval', { value: event.value });
        break;
      case 'HRV':
        this.emit('hrv', { value: event.value });
        break;
      case 'RESPIRATORY RATE':
        this.emit('respiratoryRate', { value: event.value });
        break;
      case 'touch':
        this.emit('fingerDetection', { detected: event.isTouch });
        break;
      case 'signalQuality':
        this.emit('signalQuality', { level: event.level });
        break;
    }
  }

  async processBluetoothData(data: ArrayBuffer | number[]): Promise<void> {
    if (this.isNativeAvailable) {
      const hexString = Array.from(new Uint8Array(data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(',');
      
      await HC03Bluetooth.processEcgData({ data: hexString });
    } else if (this.webService) {
      console.warn('Web Bluetooth does not support native ECG processing');
    }
  }

  isUsingNative(): boolean {
    return this.isNativeAvailable;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.webService) {
      this.webService.on(event, callback);
    }
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }

    if (this.webService) {
      this.webService.off(event, callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  async cleanup(): Promise<void> {
    if (this.isNativeAvailable) {
      await HC03Bluetooth.removeAllListeners();
    }
    if (this.webService) {
      // Cleanup web service if needed
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const hc03Service = new HC03NativeService();
