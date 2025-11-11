/**
 * UNKTOP Medical Device SDK
 * Unified Bluetooth Low Energy SDK for multiple medical devices
 * Supports: ECG, Blood Oxygen, Blood Pressure, Glucose, Temperature, Battery
 * 
 * Based on UNKTOP SDK specifications (2024-06-24)
 * Implements Web Bluetooth API for browser-based connectivity
 */

// Detection Types - Corresponds to UNKTOP SDK Detection enum
export enum DetectionType {
  BT = 'temperature',           // Body Temperature
  OX = 'blood_oxygen',           // Blood Oxygen (SpO2)
  ECG = 'ecg',                   // Electrocardiogram
  BP = 'blood_pressure',         // Blood Pressure
  BATTERY = 'battery',           // Battery Level
  BG = 'blood_glucose',          // Blood Glucose (Blood Sugar)
}

// Standard Bluetooth GATT Service UUIDs
export const GATT_SERVICES = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb',
  GLUCOSE: '00001808-0000-1000-8000-00805f9b34fb',
  HEALTH_THERMOMETER: '00001809-0000-1000-8000-00805f9b34fb',
  PULSE_OXIMETER: '00001822-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  
  // Custom UNKTOP HC03 Service UUIDs (reverse-engineered)
  HC03_CUSTOM: '0000ffe0-0000-1000-8000-00805f9b34fb',
  HC03_NOTIFY: '0000ffe1-0000-1000-8000-00805f9b34fb',
  HC03_WRITE: '0000ffe2-0000-1000-8000-00805f9b34fb',
};

// Standard GATT Characteristic UUIDs
export const GATT_CHARACTERISTICS = {
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE_MEASUREMENT: '00002a35-0000-1000-8000-00805f9b34fb',
  INTERMEDIATE_CUFF_PRESSURE: '00002a36-0000-1000-8000-00805f9b34fb',
  GLUCOSE_MEASUREMENT: '00002a18-0000-1000-8000-00805f9b34fb',
  GLUCOSE_MEASUREMENT_CONTEXT: '00002a34-0000-1000-8000-00805f9b34fb',
  TEMPERATURE_MEASUREMENT: '00002a1c-0000-1000-8000-00805f9b34fb',
  PLX_CONTINUOUS_MEASUREMENT: '00002a5f-0000-1000-8000-00805f9b34fb',
  PLX_SPOT_CHECK_MEASUREMENT: '00002a5e-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
};

// Data Types based on UNKTOP SDK specification

export interface TemperatureData {
  temperature: number;
  unit: 'celsius' | 'fahrenheit';
  measurementSite?: 'oral' | 'armpit' | 'ear' | 'forehead';
  timestamp: Date;
}

export interface BloodOxygenData {
  bloodOxygen: number;       // SpO2 percentage (0-100)
  heartRate: number;          // BPM
  fingerDetection: boolean;   // Finger detected on sensor
  waveData?: number[];        // Waveform data for visualization
}

export interface EcgData {
  type: 'wave' | 'HR' | 'Mood Index' | 'RR' | 'HRV' | 'RESPIRATORY_RATE' | 'touch';
  wave?: number[];            // ECG waveform data (512Hz sampling)
  heartRate?: number;         // Heart rate (BPM)
  moodIndex?: number;         // Mood index (1-20: chill, 21-40: relax, 41-60: balance, 61-80: excitation, 81-100: anxiety/excitement)
  rrInterval?: number;        // R-R peak interval (ms)
  hrv?: number;               // Heart rate variability
  respiratoryRate?: number;   // Respiratory rate (breaths/min)
  fingerDetected?: boolean;   // Finger touch detection
}

export interface BloodPressureResult {
  systolic: number;           // Systolic pressure (mmHg)
  diastolic: number;          // Diastolic pressure (mmHg)
  heartRate: number;          // Heart rate (BPM)
  map?: number;               // Mean arterial pressure
  timestamp: Date;
}

export interface BloodPressureProcess {
  process: number;            // Measurement progress (0-100%)
  cuffPressure: number;       // Current cuff pressure (mmHg)
}

export interface BloodGlucoseSendData {
  sendList: string[];         // Commands to send to device
}

export interface BloodGlucosePaperState {
  message: string;            // Test strip status message
  state: 'ready' | 'inserted' | 'measuring' | 'complete' | 'error';
}

export interface BloodGlucosePaperData {
  data: number;               // Blood glucose level (mg/dL)
  unit: 'mg/dL' | 'mmol/L';
  timestamp: Date;
}

export interface BatteryLevelData {
  batteryLevel: number;       // Battery percentage (0-100)
}

export interface BatteryChargingStatus {
  batteryCharging: boolean;   // Charging status
  batteryLevel?: number;
}

export interface FingertouchDetection {
  isTouch: boolean;           // Finger detected on sensor
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  supportedMeasurements: DetectionType[];
  batteryLevel?: number;
  isConnected: boolean;
  firmwareVersion?: string;
  macAddress?: string;
}

// Measurement data union type
export type MeasurementData = 
  | TemperatureData
  | BloodOxygenData
  | EcgData
  | BloodPressureResult
  | BloodPressureProcess
  | BloodGlucosePaperData
  | BatteryLevelData;

/**
 * UnktopSdk Class
 * Main SDK class for managing UNKTOP medical device connections and measurements
 */
export class UnktopSdk {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private activeDetections: Set<DetectionType> = new Set();
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();

  constructor() {
    this.device = null;
    this.server = null;
  }

  /**
   * 2.3.1 Initialization
   * Get SDK instance (singleton pattern)
   */
  static getInstance(): UnktopSdk {
    return new UnktopSdk();
  }

  /**
   * Connect to UNKTOP medical device via Bluetooth
   * Supports both standard GATT services and custom HC03 protocol
   */
  async connectDevice(options?: {
    deviceType?: DetectionType;
    namePrefix?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        return {
          ok: false,
          error: 'Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera on desktop/Android.'
        };
      }

      // Build filters based on device type
      const filters: BluetoothLEScanFilter[] = [];
      const optionalServices: BluetoothServiceUUID[] = [
        GATT_SERVICES.HC03_CUSTOM,
        GATT_SERVICES.BATTERY_SERVICE,
      ];

      // Add standard medical service filters
      if (options?.deviceType) {
        switch (options.deviceType) {
          case DetectionType.BT:
            filters.push({ services: [GATT_SERVICES.HEALTH_THERMOMETER] });
            break;
          case DetectionType.OX:
            filters.push({ services: [GATT_SERVICES.PULSE_OXIMETER] });
            optionalServices.push(GATT_SERVICES.HEART_RATE);
            break;
          case DetectionType.ECG:
            filters.push({ services: [GATT_SERVICES.HEART_RATE] });
            optionalServices.push(GATT_SERVICES.HC03_CUSTOM);
            break;
          case DetectionType.BP:
            filters.push({ services: [GATT_SERVICES.BLOOD_PRESSURE] });
            break;
          case DetectionType.BG:
            filters.push({ services: [GATT_SERVICES.GLUCOSE] });
            break;
        }
      }

      // Add name prefix filter if provided
      if (options?.namePrefix) {
        filters.push({ namePrefix: options.namePrefix });
      }

      // Default filter for HC03 devices if no specific filters
      if (filters.length === 0) {
        filters.push({ namePrefix: 'HC03' });
        filters.push({ namePrefix: 'UNKTOP' });
        filters.push({ services: [GATT_SERVICES.HC03_CUSTOM] });
      }

      // Request device
      const requestOptions: RequestDeviceOptions = {
        filters: filters.length > 0 ? filters : [{ namePrefix: '' }],
        optionalServices,
      };
      
      this.device = await navigator.bluetooth.requestDevice(requestOptions);

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Setup disconnection handler
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      console.log('Connected to device:', this.device.name);
      return { ok: true };
    } catch (error: any) {
      console.error('Connection error:', error);
      return this.handleConnectionError(error);
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.activeDetections.clear();
    this.characteristics.clear();
  }

  /**
   * Check if device is connected
   */
  public isDeviceConnected(): boolean {
    return this.server?.connected ?? false;
  }

  /**
   * 2.3.2 Start Detection
   * startDetect(Detection detection)
   * Start measuring specific vital sign
   */
  async startDetect(detection: DetectionType): Promise<any> {
    if (!this.isDeviceConnected()) {
      throw new Error('Device not connected');
    }

    this.activeDetections.add(detection);

    switch (detection) {
      case DetectionType.ECG:
        return await this.startEcgDetection();
      case DetectionType.OX:
        return await this.startBloodOxygenDetection();
      case DetectionType.BP:
        return await this.startBloodPressureDetection();
      case DetectionType.BG:
        return await this.startGlucoseDetection();
      case DetectionType.BT:
        return await this.startTemperatureDetection();
      case DetectionType.BATTERY:
        return await this.getBatteryLevel();
      default:
        throw new Error(`Unsupported detection type: ${detection}`);
    }
  }

  /**
   * 2.3.3 Stop Detection
   * stopDetect(Detection detection)
   * Stop measuring specific vital sign
   */
  async stopDetect(detection: DetectionType): Promise<void> {
    this.activeDetections.delete(detection);

    // Remove characteristic listener
    const characteristic = this.characteristics.get(detection);
    if (characteristic) {
      try {
        // Remove event listeners by cloning the characteristic
        this.characteristics.delete(detection);
      } catch (error) {
        console.error(`Error stopping ${detection}:`, error);
      }
    }
  }

  /**
   * 2.3.5 ECG Detection
   * getEcgData()
   * Returns: wave, HR, Mood Index, RR, HRV, RESPIRATORY_RATE, touch
   */
  private async startEcgDetection() {
    const service = await this.getService([
      GATT_SERVICES.HC03_CUSTOM,
      GATT_SERVICES.HEART_RATE,
    ]);

    if (!service) {
      throw new Error('ECG service not found');
    }

    // Try HC03 custom characteristic first
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    
    try {
      characteristic = await service.getCharacteristic(GATT_SERVICES.HC03_NOTIFY);
    } catch {
      // Fall back to standard heart rate characteristic
      try {
        characteristic = await service.getCharacteristic(GATT_CHARACTERISTICS.HEART_RATE_MEASUREMENT);
      } catch (error) {
        throw new Error('ECG characteristic not found');
      }
    }

    this.characteristics.set(DetectionType.ECG, characteristic);

    // Start notifications
    await characteristic.startNotifications();
    
    // Create event handler
    const eventHandler = (event: any) => {
      const ecgData = this.parseEcgData(event.target.value);
      this.emit('ecg', ecgData);
    };
    
    characteristic.addEventListener('characteristicvaluechanged', eventHandler);
    
    // Listen for ECG data - matches UNKTOP SDK interface
    const stream = {
      data: {
        listen: (callback: (data: EcgData) => void) => {
          this.on('ecg', callback);
        }
      },
      stop: {
        listen: (callback: () => void) => {
          // Handle stop signal
        }
      }
    };

    return stream;
  }

  /**
   * 2.3.6 Blood Oxygen Detection
   * getBloodOxygen()
   * Returns: bloodOxygen, heartRate, FingerDetection, waveData
   */
  private async startBloodOxygenDetection() {
    const service = await this.getService([
      GATT_SERVICES.PULSE_OXIMETER,
      GATT_SERVICES.HC03_CUSTOM,
    ]);

    if (!service) {
      throw new Error('Blood oxygen service not found');
    }

    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    try {
      // Try standard pulse oximeter characteristic
      characteristic = await service.getCharacteristic(GATT_CHARACTERISTICS.PLX_CONTINUOUS_MEASUREMENT);
    } catch {
      // Fall back to HC03 custom
      try {
        characteristic = await service.getCharacteristic(GATT_SERVICES.HC03_NOTIFY);
      } catch (error) {
        throw new Error('Blood oxygen characteristic not found');
      }
    }

    this.characteristics.set(DetectionType.OX, characteristic);

    await characteristic.startNotifications();

    // Create event handler
    const eventHandler = (event: any) => {
      const oxData = this.parseBloodOxygenData(event.target.value);
      this.emit('blood_oxygen', oxData);
    };
    
    characteristic.addEventListener('characteristicvaluechanged', eventHandler);

    const stream = {
      dataSubscription: {
        listen: (callback: (data: BloodOxygenData) => void) => {
          this.on('blood_oxygen', callback);
        }
      },
      stop: {
        listen: (callback: () => void) => {
          // Handle stop signal
        }
      }
    };

    return stream;
  }

  /**
   * 2.3.7 Glucose Detection
   * getBloodGlucoseData()
   * Returns: sendList, paperState, paperData
   */
  private async startGlucoseDetection() {
    const service = await this.getService([GATT_SERVICES.GLUCOSE]);

    if (!service) {
      throw new Error('Glucose service not found');
    }

    const characteristic = await service.getCharacteristic(GATT_CHARACTERISTICS.GLUCOSE_MEASUREMENT);
    this.characteristics.set(DetectionType.BG, characteristic);

    await characteristic.startNotifications();

    // Create event handler
    const eventHandler = (event: any) => {
      const glucoseData = this.parseGlucoseData(event.target.value);
      this.emit('glucose', glucoseData);
    };
    
    characteristic.addEventListener('characteristicvaluechanged', eventHandler);

    return {
      listen: (callback: (data: any) => void) => {
        this.on('glucose', callback);
      }
    };
  }

  /**
   * 2.3.8 Blood Pressure Detection
   * getBloodPressureData()
   * Returns: sendData, process, result (ps, pd, hr)
   */
  private async startBloodPressureDetection() {
    const service = await this.getService([GATT_SERVICES.BLOOD_PRESSURE]);

    if (!service) {
      throw new Error('Blood pressure service not found');
    }

    const characteristic = await service.getCharacteristic(GATT_CHARACTERISTICS.BLOOD_PRESSURE_MEASUREMENT);
    this.characteristics.set(DetectionType.BP, characteristic);

    await characteristic.startNotifications();

    // Create event handler
    const eventHandler = (event: any) => {
      const bpData = this.parseBloodPressureData(event.target.value);
      this.emit('blood_pressure', bpData);
    };
    
    characteristic.addEventListener('characteristicvaluechanged', eventHandler);

    return {
      listen: (callback: (data: any) => void) => {
        this.on('blood_pressure', callback);
      }
    };
  }

  /**
   * 2.3.10 Temperature Detection
   * getTemperature()
   * Returns: temperature data
   */
  private async startTemperatureDetection() {
    const service = await this.getService([GATT_SERVICES.HEALTH_THERMOMETER]);

    if (!service) {
      throw new Error('Temperature service not found');
    }

    const characteristic = await service.getCharacteristic(GATT_CHARACTERISTICS.TEMPERATURE_MEASUREMENT);
    this.characteristics.set(DetectionType.BT, characteristic);

    await characteristic.startNotifications();

    // Create event handler
    const eventHandler = (event: any) => {
      const tempData = this.parseTemperatureData(event.target.value);
      this.emit('temperature', tempData);
    };
    
    characteristic.addEventListener('characteristicvaluechanged', eventHandler);

    return {
      then: (callback: (data: TemperatureData) => void) => {
        this.on('temperature', callback);
        return this;
      },
      catchError: (callback: (error: any) => void) => {
        // Error handling
        return this;
      }
    };
  }

  /**
   * 2.3.9 Battery Detection
   * getBattery()
   * Returns: batteryLevel, batteryCharging
   */
  private async getBatteryLevel() {
    const service = await this.getService([GATT_SERVICES.BATTERY_SERVICE]);

    if (!service) {
      throw new Error('Battery service not found');
    }

    const characteristic = await service.getCharacteristic(GATT_CHARACTERISTICS.BATTERY_LEVEL);
    const value = await characteristic.readValue();
    const batteryLevel = value.getUint8(0);
    const data: BatteryLevelData = { batteryLevel };
    
    this.emit('battery', data);
    
    return {
      then: (callback: (data: BatteryLevelData) => void) => {
        callback(data);
        return this;
      }
    };
  }

  /**
   * Parse ECG data from Bluetooth characteristic
   */
  private parseEcgData(dataView: DataView): EcgData {
    // ECG data format based on UNKTOP SDK specification
    try {
      const message = this.dataViewToObject(dataView);
      
      if (message.type === 'wave') {
        const waveData = message.data as number[];
        // Limit wave data to 2200 samples as per spec
        if (waveData.length > 2200) {
          waveData.splice(0, waveData.length - 2200);
        }
        return {
          type: 'wave',
          wave: waveData,
        };
      } else if (message.type === 'HR') {
        return {
          type: 'HR',
          heartRate: message.value,
        };
      } else if (message.type === 'Mood Index') {
        if (message.value === 0) {
          // Stop ECG when mood index is 0
          this.stopDetect(DetectionType.ECG);
        }
        return {
          type: 'Mood Index',
          moodIndex: message.value,
        };
      } else if (message.type === 'RR') {
        return {
          type: 'RR',
          rrInterval: message.value,
        };
      } else if (message.type === 'HRV') {
        return {
          type: 'HRV',
          hrv: message.value,
        };
      } else if (message.type === 'RESPIRATORY_RATE') {
        return {
          type: 'RESPIRATORY_RATE',
          respiratoryRate: message.value,
        };
      } else if (message.type === 'touch') {
        return {
          type: 'touch',
          fingerDetected: message.isTouch,
        };
      }
    } catch (error) {
      console.error('Error parsing ECG data:', error);
    }

    return { type: 'wave' };
  }

  /**
   * Parse Blood Oxygen data from Bluetooth characteristic
   */
  private parseBloodOxygenData(dataView: DataView): BloodOxygenData {
    // Standard PLX format or custom HC03 format
    try {
      const message = this.dataViewToObject(dataView);
      
      if (message.bloodOxygen !== undefined) {
        return {
          bloodOxygen: message.bloodOxygen,
          heartRate: message.heartRate || 0,
          fingerDetection: message.fingerDetection || false,
          waveData: message.waveData || [],
        };
      }

      // Standard PLX Continuous Measurement format
      const flags = dataView.getUint8(0);
      const spo2 = dataView.getUint16(1, true);
      const pr = dataView.getUint16(3, true);

      return {
        bloodOxygen: spo2,
        heartRate: pr,
        fingerDetection: true,
      };
    } catch (error) {
      console.error('Error parsing blood oxygen data:', error);
      return {
        bloodOxygen: 0,
        heartRate: 0,
        fingerDetection: false,
      };
    }
  }

  /**
   * Parse Glucose data from Bluetooth characteristic
   */
  private parseGlucoseData(dataView: DataView): BloodGlucosePaperData | BloodGlucosePaperState {
    try {
      const message = this.dataViewToObject(dataView);
      
      if (message.data !== undefined) {
        return {
          data: message.data,
          unit: 'mg/dL',
          timestamp: new Date(),
        };
      } else if (message.message !== undefined) {
        return {
          message: message.message,
          state: message.state || 'ready',
        };
      }

      // Standard Glucose Measurement format
      const flags = dataView.getUint8(0);
      const sequenceNumber = dataView.getUint16(1, true);
      const glucoseConcentration = dataView.getUint16(7, true);

      return {
        data: glucoseConcentration,
        unit: 'mg/dL',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error parsing glucose data:', error);
      return {
        data: 0,
        unit: 'mg/dL',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Parse Blood Pressure data from Bluetooth characteristic
   */
  private parseBloodPressureData(dataView: DataView): BloodPressureResult | BloodPressureProcess {
    try {
      const message = this.dataViewToObject(dataView);
      
      if (message.process !== undefined) {
        return {
          process: message.process,
          cuffPressure: message.cuffPressure || 0,
        };
      } else if (message.ps !== undefined) {
        return {
          systolic: message.ps,
          diastolic: message.pd,
          heartRate: message.hr,
          timestamp: new Date(),
        };
      }

      // Standard Blood Pressure Measurement format
      const flags = dataView.getUint8(0);
      const systolic = dataView.getUint16(1, true);
      const diastolic = dataView.getUint16(3, true);
      const map = dataView.getUint16(5, true);
      const heartRate = dataView.getUint16(14, true);

      return {
        systolic,
        diastolic,
        heartRate,
        map,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error parsing blood pressure data:', error);
      return {
        systolic: 0,
        diastolic: 0,
        heartRate: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Parse Temperature data from Bluetooth characteristic
   */
  private parseTemperatureData(dataView: DataView): TemperatureData {
    try {
      const message = this.dataViewToObject(dataView);
      
      if (message.temperature !== undefined) {
        return {
          temperature: message.temperature,
          unit: 'celsius',
          timestamp: new Date(),
        };
      }

      // Standard Temperature Measurement format
      const flags = dataView.getUint8(0);
      const temperatureValue = dataView.getFloat32(1, true);
      const unit = (flags & 0x01) ? 'fahrenheit' : 'celsius';

      return {
        temperature: temperatureValue,
        unit,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error parsing temperature data:', error);
      return {
        temperature: 0,
        unit: 'celsius',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get device info
   */
  getDeviceInfo(): DeviceInfo | null {
    if (!this.device) return null;

    return {
      deviceId: this.device.id,
      deviceName: this.device.name || 'Unknown Device',
      deviceType: 'multi_function',
      supportedMeasurements: Array.from(this.activeDetections),
      isConnected: this.isDeviceConnected(),
    };
  }

  /**
   * Event listener system
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Helper method to get GATT service
   */
  private async getService(serviceUuids: string[]): Promise<BluetoothRemoteGATTService | null> {
    if (!this.server) return null;

    for (const uuid of serviceUuids) {
      try {
        return await this.server.getPrimaryService(uuid);
      } catch (error) {
        // Try next service UUID
        continue;
      }
    }

    return null;
  }

  /**
   * Convert DataView to JavaScript object (for custom protocols)
   */
  private dataViewToObject(dataView: DataView): any {
    try {
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(dataView.buffer);
      return JSON.parse(jsonString);
    } catch {
      // If not JSON, return raw data
      return {
        raw: new Uint8Array(dataView.buffer),
      };
    }
  }

  /**
   * Handle disconnection
   */
  private onDisconnected(): void {
    console.log('Device disconnected');
    this.device = null;
    this.server = null;
    this.activeDetections.clear();
    this.characteristics.clear();
    this.emit('disconnected', {});
  }

  /**
   * Handle connection errors with specific messages
   */
  private handleConnectionError(error: any): { ok: false; error: string } {
    if (error.name === 'NotFoundError') {
      return {
        ok: false,
        error: 'No device found. Make sure the device is powered on and in pairing mode.',
      };
    }

    if (error.name === 'NotAllowedError') {
      return {
        ok: false,
        error: 'Bluetooth access denied. Please enable Bluetooth and grant permission. On Android, also enable Location services.',
      };
    }

    if (error.name === 'SecurityError') {
      return {
        ok: false,
        error: 'Security error. This app must be served over HTTPS to use Bluetooth.',
      };
    }

    if (error.name === 'NetworkError') {
      return {
        ok: false,
        error: 'Connection failed. Make sure the device is nearby and try again.',
      };
    }

    return {
      ok: false,
      error: error.message || 'Failed to connect to device. Please try again.',
    };
  }
}

// Export singleton instance
let sdkInstance: UnktopSdk | null = null;

export function getUnktopSdk(): UnktopSdk {
  if (!sdkInstance) {
    sdkInstance = UnktopSdk.getInstance();
  }
  return sdkInstance;
}

export default UnktopSdk;
