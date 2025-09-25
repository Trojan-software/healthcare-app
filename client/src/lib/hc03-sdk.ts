/**
 * HC03 Flutter SDK Integration for Web
 * Based on HC03_Flutter SDK API Guide v1.0
 * 
 * This service provides BLE connectivity and data processing
 * for HC03 health monitoring devices using Web Bluetooth API
 */

// HC03 Detection Types as per API documentation
export enum Detection {
  BT = 'BT',           // Temperature
  OX = 'OX',           // Blood oxygen
  ECG = 'ECG',         // Electrocardiogram
  BP = 'BP',           // Blood pressure
  BATTERY = 'BATTERY', // Battery
  BG = 'BG'            // Blood glucose
}

// HC03 Device Service and Characteristic UUIDs (from Flutter SDK Guide)
const HC03_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const HC03_WRITE_CHARACTERISTIC = '0000fff1-0000-1000-8000-00805f9b34fb';
const HC03_NOTIFY_CHARACTERISTIC = '0000fff2-0000-1000-8000-00805f9b34fb';
const HC03_ECG_CHARACTERISTIC = '0000fff3-0000-1000-8000-00805f9b34fb';
const HC03_BLOOD_OXYGEN_CHARACTERISTIC = '0000fff4-0000-1000-8000-00805f9b34fb';
const HC03_BLOOD_PRESSURE_CHARACTERISTIC = '0000fff5-0000-1000-8000-00805f9b34fb';
const HC03_TEMPERATURE_CHARACTERISTIC = '0000fff6-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb';

// Detection Commands as per HC03 protocol
const DETECTION_COMMANDS = {
  [Detection.ECG]: new Uint8Array([0x01, 0x01]), // Start ECG
  [Detection.OX]: new Uint8Array([0x02, 0x01]),  // Start Blood Oxygen
  [Detection.BP]: new Uint8Array([0x03, 0x01]),  // Start Blood Pressure
  [Detection.BT]: new Uint8Array([0x04, 0x01]),  // Start Temperature
  [Detection.BG]: new Uint8Array([0x05, 0x01]),  // Start Blood Glucose
  [Detection.BATTERY]: new Uint8Array([0x06, 0x01]), // Query Battery
};

const STOP_COMMANDS = {
  [Detection.ECG]: new Uint8Array([0x01, 0x00]), // Stop ECG
  [Detection.OX]: new Uint8Array([0x02, 0x00]),  // Stop Blood Oxygen
  [Detection.BP]: new Uint8Array([0x03, 0x00]),  // Stop Blood Pressure
  [Detection.BT]: new Uint8Array([0x04, 0x00]),  // Stop Temperature
  [Detection.BG]: new Uint8Array([0x05, 0x00]),  // Stop Blood Glucose
};

// HC03 Data Structures as per API documentation
export interface ECGData {
  wave: number[];              // Data used for drawing waveforms
  hr: number;                  // Heart rate data
  moodIndex: number;           // Mood Index (1-20: chill, 21-40: relax, 41-60: balance, 61-80: excitation, 81-100: excitement/anxiety)
  rr: number;                  // Peak to peak value (RR interval)
  hrv: number;                 // Heart rate variability
  respiratoryRate: number;     // Respiratory rate
  touch: boolean;              // Finger detection
}

export interface BloodOxygenData {
  bloodOxygen: number;         // Blood oxygen level
  heartRate: number;           // Heart rate
  fingerDetection: boolean;    // Finger detection status
  bloodOxygenWaveData: number[]; // Draw waveform data
}

export interface BloodPressureData {
  ps: number;                  // Systolic pressure
  pd: number;                  // Diastolic pressure
  hr: number;                  // Heart rate
  progress?: number;           // Blood pressure measurement progress
}

export interface BloodGlucoseData {
  bloodGlucoseSendData: any;   // Data to be sent to the device
  bloodGlucosePaperState: string; // Blood glucose test strip status
  bloodGlucosePaperData: number;  // Blood glucose data
}

export interface TemperatureData {
  temperature: number;         // Body temperature data
}

export interface BatteryData {
  batteryLevel: number;        // Battery percentage data
  chargingStatus: boolean;     // Battery charging status
}

export interface BloodPressureProcessData {
  progress: number;            // Progress percentage during measurement
  currentPressure: number;     // Current cuff pressure
}

export interface BloodPressureResultData {
  ps: number;                  // Systolic pressure
  pd: number;                  // Diastolic pressure
  hr: number;                  // Heart rate
}

// Web Bluetooth API types
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }

  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: 'gattserverdisconnected', listener: () => void): void;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    value?: DataView;
    writeValue(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  }

  type BluetoothServiceUUID = string;
  type BluetoothCharacteristicUUID = string;
}

// HC03 SDK Main Class
export class Hc03Sdk {
  private static instance: Hc03Sdk;
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected: boolean = false;
  private callbacks: Map<Detection, (data: any) => void> = new Map();
  private activeDetections: Set<Detection> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  private constructor() {
    // Bind methods to preserve context
    this.handleDisconnection = this.handleDisconnection.bind(this);
    this.handleCharacteristicValueChanged = this.handleCharacteristicValueChanged.bind(this);
  }

  // Singleton getInstance method as per API documentation
  public static getInstance(): Hc03Sdk {
    if (!Hc03Sdk.instance) {
      Hc03Sdk.instance = new Hc03Sdk();
    }
    return Hc03Sdk.instance;
  }

  // Initialize HC03 SDK
  public async initialize(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API not supported in this browser. Please use Chrome, Edge, or another compatible browser.');
    }
    
    console.log('HC03 SDK initialized successfully');
  }

  // Connect to HC03 device via BLE
  public async connectDevice(): Promise<BluetoothDevice> {
    try {
      // Request HC03 device with proper service UUIDs
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HC03' },
          { namePrefix: 'Health' },
          { services: [HC03_SERVICE_UUID] }
        ],
        optionalServices: [
          BATTERY_SERVICE_UUID,
          'device_information'
        ]
      });

      console.log('HC03 device selected:', this.device.name);

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();
      
      // Get main HC03 service
      this.service = await this.server.getPrimaryService(HC03_SERVICE_UUID);
      
      // Get write and notify characteristics
      this.writeCharacteristic = await this.service.getCharacteristic(HC03_WRITE_CHARACTERISTIC);
      this.notifyCharacteristic = await this.service.getCharacteristic(HC03_NOTIFY_CHARACTERISTIC);
      
      // Enable notifications
      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged);
      
      // Set up disconnect handler
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnection);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('HC03 device connected successfully');
      return this.device;
    } catch (error) {
      console.error('Failed to connect to HC03 device:', error);
      throw new Error(`Failed to connect to HC03 device: ${error}`);
    }
  }

  // Handle device disconnection
  private handleDisconnection(): void {
    console.log('HC03 device disconnected');
    this.isConnected = false;
    this.server = null;
    this.service = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    
    // Attempt to reconnect if within retry limit
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.device) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.reconnectDevice(), 2000);
    }
  }

  // Reconnect to device
  private async reconnectDevice(): Promise<void> {
    try {
      if (this.device && this.device.gatt) {
        await this.connectDevice();
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  // Start detection as per HC03 API
  public async startDetect(detection: Detection): Promise<void> {
    if (!this.isConnected || !this.writeCharacteristic) {
      throw new Error('Device not connected or characteristics not available');
    }

    try {
      const command = DETECTION_COMMANDS[detection];
      if (!command) {
        throw new Error(`Unknown detection type: ${detection}`);
      }

      console.log(`Starting ${detection} detection...`);
      await this.writeCharacteristic.writeValue(command);
      this.activeDetections.add(detection);
      
      // Emit measurement started event
      const callback = this.callbacks.get(detection);
      if (callback) {
        callback({ type: 'measurementStarted', detection });
      }
    } catch (error) {
      console.error(`Failed to start ${detection} detection:`, error);
      throw error;
    }
  }

  // Stop detection as per HC03 API
  public async stopDetect(detection: Detection): Promise<void> {
    if (!this.isConnected || !this.writeCharacteristic) {
      throw new Error('Device not connected or characteristics not available');
    }

    try {
      const command = STOP_COMMANDS[detection];
      if (command) {
        console.log(`Stopping ${detection} detection...`);
        await this.writeCharacteristic.writeValue(command);
      }
      
      this.activeDetections.delete(detection);
      
      // Emit measurement completed event
      const callback = this.callbacks.get(detection);
      if (callback) {
        callback({ type: 'measurementCompleted', detection });
      }
    } catch (error) {
      console.error(`Failed to stop ${detection} detection:`, error);
      throw error;
    }
  }

  // Disconnect from device
  public async disconnect(): Promise<void> {
    try {
      // Stop all active detections
      for (const detection of this.activeDetections) {
        await this.stopDetect(detection);
      }
      
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
      
      this.isConnected = false;
      console.log('HC03 device disconnected manually');
    } catch (error) {
      console.error('Error disconnecting HC03 device:', error);
    }
  }

  // Handle characteristic value changes
  private handleCharacteristicValueChanged(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (data) {
      this.parseData(data.buffer);
    }
  }

  // Parse incoming data as per HC03 API
  public parseData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      if (view.byteLength < 2) {
        console.warn('Received incomplete data packet');
        return;
      }
      
      const command = view.getUint8(0);
      const subCommand = view.getUint8(1);
      
      console.log(`Received data - Command: 0x${command.toString(16)}, SubCommand: 0x${subCommand.toString(16)}`);
      
      // Route data to appropriate parser based on command
      switch (command) {
        case 0x01: // ECG data
          this.parseECGData(data);
          break;
        case 0x02: // Blood oxygen data
          this.parseBloodOxygenData(data);
          break;
        case 0x03: // Blood pressure data
          this.parseBloodPressureData(data);
          break;
        case 0x04: // Temperature data
          this.parseTemperatureData(data);
          break;
        case 0x05: // Blood glucose data
          this.parseBloodGlucoseData(data);
          break;
        case 0x06: // Battery data
          this.parseBatteryData(data);
          break;
        default:
          console.warn(`Unknown command received: 0x${command.toString(16)}`);
      }
    } catch (error) {
      console.error('Error parsing HC03 data:', error);
    }
  }

  // Set callback for detection type
  public setCallback(detection: Detection, callback: (data: any) => void): void {
    this.callbacks.set(detection, callback);
  }

  // Remove callback for detection type
  public removeCallback(detection: Detection): void {
    this.callbacks.delete(detection);
  }

  // Get connection status
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get active detections
  public getActiveDetections(): Detection[] {
    return Array.from(this.activeDetections);
  }

  // ECG Data Parsing
  private parseECGData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      
      if (view.byteLength < 20) {
        console.warn('ECG data packet too short');
        return;
      }
      
      // Extract ECG data according to HC03 protocol
      const heartRate = view.getUint16(2, true); // Little endian
      const moodIndex = view.getUint8(4);
      const rrInterval = view.getUint16(5, true);
      const hrv = view.getUint16(7, true);
      const respiratoryRate = view.getUint8(9);
      const fingerDetected = view.getUint8(10) === 1;
      
      // Extract wave data (remaining bytes)
      const waveData: number[] = [];
      for (let i = 11; i < view.byteLength; i++) {
        waveData.push(view.getUint8(i));
      }
      
      const ecgData: ECGData = {
        wave: waveData,
        hr: heartRate,
        moodIndex: moodIndex,
        rr: rrInterval,
        hrv: hrv,
        respiratoryRate: respiratoryRate,
        touch: fingerDetected
      };
      
      console.log('ECG Data:', ecgData);
      
      const callback = this.callbacks.get(Detection.ECG);
      if (callback) {
        callback({ type: 'data', detection: Detection.ECG, data: ecgData });
      }
    } catch (error) {
      console.error('Error parsing ECG data:', error);
    }
  }

  // Blood Oxygen Data Parsing
  private parseBloodOxygenData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      
      if (view.byteLength < 10) {
        console.warn('Blood oxygen data packet too short');
        return;
      }
      
      const bloodOxygen = view.getUint8(2);
      const heartRate = view.getUint16(3, true);
      const fingerDetected = view.getUint8(5) === 1;
      
      // Extract wave data (remaining bytes)
      const waveData: number[] = [];
      for (let i = 6; i < view.byteLength; i++) {
        waveData.push(view.getUint8(i));
      }
      
      const bloodOxygenData: BloodOxygenData = {
        bloodOxygen: bloodOxygen,
        heartRate: heartRate,
        fingerDetection: fingerDetected,
        bloodOxygenWaveData: waveData
      };
      
      console.log('Blood Oxygen Data:', bloodOxygenData);
      
      const callback = this.callbacks.get(Detection.OX);
      if (callback) {
        callback({ type: 'data', detection: Detection.OX, data: bloodOxygenData });
      }
    } catch (error) {
      console.error('Error parsing blood oxygen data:', error);
    }
  }

  // Blood Pressure Data Parsing
  private parseBloodPressureData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      
      if (view.byteLength < 8) {
        console.warn('Blood pressure data packet too short');
        return;
      }
      
      const systolic = view.getUint16(2, true);
      const diastolic = view.getUint16(4, true);
      const heartRate = view.getUint16(6, true);
      const progress = view.byteLength > 8 ? view.getUint8(8) : 100;
      
      const bloodPressureData: BloodPressureData = {
        ps: systolic,
        pd: diastolic,
        hr: heartRate,
        progress: progress
      };
      
      console.log('Blood Pressure Data:', bloodPressureData);
      
      const callback = this.callbacks.get(Detection.BP);
      if (callback) {
        callback({ type: 'data', detection: Detection.BP, data: bloodPressureData });
      }
    } catch (error) {
      console.error('Error parsing blood pressure data:', error);
    }
  }

  // Blood Glucose Data Parsing
  private parseBloodGlucoseData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      
      if (view.byteLength < 6) {
        console.warn('Blood glucose data packet too short');
        return;
      }
      
      const glucoseLevel = view.getUint16(2, true) / 10; // Convert to mg/dL
      const testStripStatus = view.getUint8(4);
      
      const statusMap = {
        0: 'ready',
        1: 'insert_strip',
        2: 'apply_sample',
        3: 'measuring',
        4: 'complete',
        5: 'error'
      };
      
      const bloodGlucoseData: BloodGlucoseData = {
        bloodGlucoseSendData: { rawValue: view.getUint16(2, true) },
        bloodGlucosePaperState: statusMap[testStripStatus] || 'unknown',
        bloodGlucosePaperData: glucoseLevel
      };
      
      console.log('Blood Glucose Data:', bloodGlucoseData);
      
      const callback = this.callbacks.get(Detection.BG);
      if (callback) {
        callback({ type: 'data', detection: Detection.BG, data: bloodGlucoseData });
      }
    } catch (error) {
      console.error('Error parsing blood glucose data:', error);
    }
  }

  // Temperature Data Parsing
  private parseTemperatureData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      
      if (view.byteLength < 4) {
        console.warn('Temperature data packet too short');
        return;
      }
      
      const temperature = view.getUint16(2, true) / 100; // Convert to Celsius
      
      const temperatureData: TemperatureData = {
        temperature: temperature
      };
      
      console.log('Temperature Data:', temperatureData);
      
      const callback = this.callbacks.get(Detection.BT);
      if (callback) {
        callback({ type: 'data', detection: Detection.BT, data: temperatureData });
      }
    } catch (error) {
      console.error('Error parsing temperature data:', error);
    }
  }

  // Battery Data Parsing
  private parseBatteryData(data: ArrayBuffer): void {
    try {
      const view = new DataView(data);
      
      if (view.byteLength < 4) {
        console.warn('Battery data packet too short');
        return;
      }
      
      const batteryLevel = view.getUint8(2);
      const chargingStatus = view.getUint8(3) === 1;
      
      const batteryData: BatteryData = {
        batteryLevel: batteryLevel,
        chargingStatus: chargingStatus
      };
      
      console.log('Battery Data:', batteryData);
      
      const callback = this.callbacks.get(Detection.BATTERY);
      if (callback) {
        callback({ type: 'data', detection: Detection.BATTERY, data: batteryData });
      }
    } catch (error) {
      console.error('Error parsing battery data:', error);
    }
  }

  // Query battery level directly from battery service
  public async queryBatteryLevel(): Promise<number | null> {
    try {
      if (!this.server) {
        throw new Error('Device not connected');
      }
      
      const batteryService = await this.server.getPrimaryService(BATTERY_SERVICE_UUID);
      const batteryCharacteristic = await batteryService.getCharacteristic(BATTERY_LEVEL_CHARACTERISTIC);
      const value = await batteryCharacteristic.readValue();
      
      return value.getUint8(0);
    } catch (error) {
      console.error('Error querying battery level:', error);
      return null;
    }
  }

  // Get mood index text representation as per HC03 API documentation
  public getMoodText(moodIndex: number): string {
    if (moodIndex >= 1 && moodIndex <= 20) return 'Chill';
    if (moodIndex >= 21 && moodIndex <= 40) return 'Relax';
    if (moodIndex >= 41 && moodIndex <= 60) return 'Balance';
    if (moodIndex >= 61 && moodIndex <= 80) return 'Excitation';
    if (moodIndex >= 81 && moodIndex <= 100) return 'Excitement/Anxiety';
    return 'Unknown';
  }

  // Check if device supports a specific detection type
  public supportsDetection(detection: Detection): boolean {
    return Object.keys(DETECTION_COMMANDS).includes(detection);
  }

  // Get device information
  public getDeviceInfo(): { name?: string; id: string; connected: boolean } | null {
    if (!this.device) return null;
    
    return {
      name: this.device.name,
      id: this.device.id,
      connected: this.isConnected
    };
  }
}

// Export singleton instance
export const hc03Sdk = Hc03Sdk.getInstance();