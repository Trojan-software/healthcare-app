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
  private currentPatientId: string | null = null;

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
      this.setupWebBluetoothListeners();
      this.isInitialized = true;
      console.log('Using Web Bluetooth API');
    } catch (error) {
      console.error('Web Bluetooth not available:', error);
      throw error;
    }
  }
  
  private setupWebBluetoothListeners(): void {
    if (!this.webService) return;
    
    // Map Web Bluetooth events to normalized HC03NativeService events
    this.webService.on('batteryData', (data: any) => {
      this.emit('batteryLevel', {
        level: data.level,
        voltage: data.voltage,
        charging: data.charging || false
      });
    });
    
    this.webService.on('temperatureData', (data: any) => {
      this.emit('temperature', {
        body: data.bodyTemp,
        environment: data.envTemp
      });
    });
    
    this.webService.on('bloodGlucoseData', (data: any) => {
      this.emit('bloodGlucose', { value: data.value });
    });
    
    this.webService.on('bloodOxygenData', (data: any) => {
      this.emit('bloodOxygen', {
        spo2: data.spo2,
        heartRate: data.heartRate,
        waveData: data.waveData
      });
    });
    
    this.webService.on('bloodOxygenWave', (data: any) => {
      this.emit('bloodOxygen', {
        spo2: data.spo2 || 0,
        heartRate: data.heartRate || 0,
        waveData: data.waveData
      });
    });
    
    this.webService.on('bloodPressureData', (data: any) => {
      this.emit('bloodPressure', {
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heartRate
      });
    });
    
    // ECG events
    this.webService.on('ecgWave', (data: any) => {
      this.emit('ecgWave', data);
    });
    
    this.webService.on('ecgHeartRate', (data: any) => {
      this.emit('heartRate', { value: data.value });
    });
    
    this.webService.on('ecgHRV', (data: any) => {
      this.emit('hrv', { value: data.value });
    });
    
    this.webService.on('ecgMood', (data: any) => {
      this.emit('moodIndex', { value: data.value });
    });
    
    this.webService.on('ecgRR', (data: any) => {
      this.emit('rrInterval', { value: data.value });
    });
    
    this.webService.on('ecgRespiratory', (data: any) => {
      this.emit('respiratoryRate', { value: data.value });
    });
    
    this.webService.on('ecgTouch', (data: any) => {
      this.emit('fingerDetection', { detected: data.detected });
    });
    
    // Connection lifecycle events (pass through)
    this.webService.on('connectionStateChanged', (data: any) => {
      this.emit('connectionStateChanged', data);
    });
    
    this.webService.on('connected', (data: any) => {
      this.emit('connected', data);
    });
    
    this.webService.on('disconnected', (data: any) => {
      this.emit('disconnected', data);
    });
    
    this.webService.on('bluetoothError', (data: any) => {
      this.emit('bluetoothError', data);
    });
  }

  private setupNativeListeners(): void {
    // ECG data events (wave and metrics)
    HC03Bluetooth.addListener('hc03:ecg:wave', (event: any) => {
      this.handleECGWave(event);
    });
    
    HC03Bluetooth.addListener('hc03:ecg:metrics', (event: any) => {
      this.handleECGMetrics(event);
    });
    
    // Battery data events
    HC03Bluetooth.addListener('hc03:battery:level', (event: any) => {
      this.handleBatteryData(event);
    });
    
    // Temperature data events
    HC03Bluetooth.addListener('hc03:temperature:data', (event: any) => {
      this.handleTemperatureData(event);
    });
    
    // Blood glucose data events
    HC03Bluetooth.addListener('hc03:bloodglucose:result', (event: any) => {
      this.handleGlucoseData(event);
    });
    
    // Blood oxygen data events
    HC03Bluetooth.addListener('hc03:bloodoxygen:data', (event: any) => {
      this.handleOxygenData(event);
    });
    
    // Blood pressure data events
    HC03Bluetooth.addListener('hc03:bloodpressure:result', (event: any) => {
      this.handlePressureData(event);
    });
    
    // Detection lifecycle events
    HC03Bluetooth.addListener('detectionStarted', (event: any) => {
      console.log('Detection started:', event.detection);
      this.emit('detectionStarted', event);
    });
    
    HC03Bluetooth.addListener('detectionStopped', (event: any) => {
      console.log('Detection stopped:', event.detection);
      this.emit('detectionStopped', event);
    });
  }

  private handleECGWave(event: any): void {
    console.log('Native ECG wave received:', event);
    this.emit('ecgWave', event);
  }

  private handleECGMetrics(event: any): void {
    console.log('Native ECG metrics received:', event);
    
    // Route different metric types to appropriate events
    const type = event.type;
    switch (type) {
      case 'HR':
        this.emit('heartRate', { value: event.value });
        break;
      case 'HRV':
        this.emit('hrv', { value: event.value });
        break;
      case 'Mood Index':
        this.emit('moodIndex', { value: event.value });
        break;
      case 'RR':
        this.emit('rrInterval', { value: event.value });
        break;
      case 'RESPIRATORY RATE':
        this.emit('respiratoryRate', { value: event.value });
        break;
      case 'STRESS':
        this.emit('stress', { value: event.value });
        break;
      case 'HEART AGE':
        this.emit('heartAge', { value: event.value });
        break;
      case 'touch':
        this.emit('fingerDetection', { detected: event.isTouch });
        break;
      default:
        console.log('Unknown ECG metric type:', type);
    }
  }

  private handleBatteryData(event: any): void {
    console.log('Native battery data received:', event);
    this.emit('batteryLevel', { 
      level: event.level, 
      voltage: event.voltage,
      charging: event.charging 
    });
  }

  private handleTemperatureData(event: any): void {
    console.log('Native temperature data received:', event);
    this.emit('temperature', { 
      body: event.bodyTemp,
      environment: event.envTemp 
    });
  }

  private handleGlucoseData(event: any): void {
    console.log('Native glucose data received:', event);
    this.emit('bloodGlucose', { value: event.value });
  }

  private handleOxygenData(event: any): void {
    console.log('Native oxygen data received:', event);
    this.emit('bloodOxygen', { 
      spo2: event.spo2,
      heartRate: event.heartRate,
      waveData: event.waveData 
    });
  }

  private handlePressureData(event: any): void {
    console.log('Native pressure data received:', event);
    this.emit('bloodPressure', { 
      systolic: event.systolic,
      diastolic: event.diastolic,
      heartRate: event.heartRate 
    });
  }

  async processBluetoothData(data: ArrayBuffer | number[]): Promise<void> {
    if (this.isNativeAvailable) {
      // Convert to number array for native plugin
      const byteArray = Array.from(new Uint8Array(data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer));
      
      try {
        await HC03Bluetooth.parseData({ data: byteArray });
      } catch (error) {
        console.error('Failed to parse Bluetooth data:', error);
      }
    } else if (this.webService) {
      console.warn('Web Bluetooth does not support native data processing');
    }
  }

  async startScan(): Promise<any[]> {
    if (this.isNativeAvailable) {
      // On native platforms, use Web Bluetooth API fallback
      // Native scanning is handled by the OS Bluetooth settings
      console.warn('Native platform detected - Bluetooth scanning requires manual pairing in system settings');
      throw new Error('On native apps, please pair HC03 device in your phone Bluetooth settings first');
    }
    
    if (!this.webService) {
      throw new Error('Bluetooth service not initialized');
    }
    return this.webService.startScan();
  }

  async connect(deviceId: string, patientId: string): Promise<void> {
    if (this.isNativeAvailable) {
      // On native platforms, use Capacitor plugin for connection
      // Connection will be established when data starts flowing
      console.log('Native platform - device connection handled by Capacitor plugin');
      this.currentPatientId = patientId;
      return Promise.resolve();
    }
    
    if (!this.webService) {
      throw new Error('Bluetooth service not initialized');
    }
    return this.webService.connect(deviceId, patientId);
  }

  async disconnect(): Promise<void> {
    if (this.isNativeAvailable) {
      // Native platforms - disconnect handled by stopping measurement
      console.log('Native platform - disconnect by stopping all measurements');
      return Promise.resolve();
    }
    
    if (!this.webService) {
      throw new Error('Bluetooth service not initialized');
    }
    return this.webService.disconnect();
  }

  getConnectionState(): any {
    if (this.isNativeAvailable) {
      // Native platforms - connection state based on data flow
      return this.isInitialized ? 'CONNECTED' : 'DISCONNECTED';
    }
    
    if (!this.webService) {
      return 'DISCONNECTED';
    }
    return (this.webService as any).connectionState;
  }

  isUsingNative(): boolean {
    return this.isNativeAvailable;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Note: webService listeners are set up via setupWebBluetoothListeners()
    // which translates webService events to normalized event names
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
    
    // Note: webService event removal is managed internally
    // Normalized events are emitted through HC03NativeService.emit()
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
