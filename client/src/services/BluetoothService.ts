/**
 * HC03 Bluetooth Service Manager
 * Handles Bluetooth connectivity and data communication with HC03 medical device
 * Based on Web Bluetooth API for PWA compatibility
 */

// Web Bluetooth API type declarations
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

export interface HC03DeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  firmwareVersion?: string;
  macAddress?: string;
}

export interface HC03Measurement {
  type: 'ecg' | 'bloodOxygen' | 'bloodPressure' | 'bloodGlucose' | 'temperature' | 'battery';
  timestamp: number;
  patientId: string;
  deviceId: string;
  data: any;
}

export interface ECGData {
  waveData: number[];
  heartRate: number;
  moodIndex: number;
  rrInterval: number;
  hrv: number;
  respiratoryRate: number;
  fingerDetected: boolean;
}

export interface BloodOxygenData {
  bloodOxygen: number;
  heartRate: number;
  fingerDetected: boolean;
  waveData: number[];
}

export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  heartRate: number;
  measurementProgress: number;
  cuffPressure: number;
}

export interface BloodGlucoseData {
  glucoseLevel: number;
  testStripStatus: string;
  measurementType: string;
}

export interface TemperatureData {
  temperature: number;
  measurementSite: string;
}

export interface BatteryData {
  batteryLevel: number;
  chargingStatus: boolean;
}

// HC03 Device Constants (based on Flutter SDK)
const HC03_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const HC03_WRITE_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
const HC03_NOTIFY_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';

// Detection Types
export enum DetectionType {
  ECG = 'ECG',
  BT = 'BT', // Temperature
  OX = 'OX', // Blood Oxygen
  BP = 'BP', // Blood Pressure
  BG = 'BG', // Blood Glucose
  BATTERY = 'BATTERY'
}

// Command Constants (translated from Flutter SDK)
const COMMANDS = {
  ECG_START: [0xaa, 0xaa, 0x12, 0x01, 0x01],
  ECG_STOP: [0xaa, 0xaa, 0x12, 0x01, 0x00],
  TEMPERATURE_START: [0xaa, 0xaa, 0x13, 0x01, 0x01],
  TEMPERATURE_STOP: [0xaa, 0xaa, 0x13, 0x01, 0x00],
  BLOOD_OXYGEN_START: [0xaa, 0xaa, 0x14, 0x01, 0x01],
  BLOOD_OXYGEN_STOP: [0xaa, 0xaa, 0x14, 0x01, 0x00],
  BLOOD_PRESSURE_START: [0xaa, 0xaa, 0x15, 0x01, 0x01],
  BLOOD_PRESSURE_STOP: [0xaa, 0xaa, 0x15, 0x01, 0x00],
  BLOOD_GLUCOSE_START: [0xaa, 0xaa, 0x16, 0x01, 0x01],
  BLOOD_GLUCOSE_STOP: [0xaa, 0xaa, 0x16, 0x01, 0x00],
  BATTERY_QUERY: [0xaa, 0xaa, 0x17, 0x01, 0x01]
};

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isScanning = false;
  private isConnected = false;
  private currentPatientId: string | null = null;

  // Data buffers for real-time processing
  private ecgBuffer: number[] = [];
  private oxWaveBuffer: number[] = [];
  private measurementActive: Set<DetectionType> = new Set();

  constructor() {
    // Check Web Bluetooth API support
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported in this browser');
    }
  }

  /**
   * Start scanning for HC03 devices
   */
  async startScan(): Promise<HC03DeviceInfo[]> {
    if (this.isScanning) {
      throw new Error('Already scanning for devices');
    }

    try {
      this.isScanning = true;
      this.emit('scanStarted');

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [HC03_SERVICE_UUID] },
          { namePrefix: 'HC03' },
          { namePrefix: 'LT-' }
        ],
        optionalServices: [HC03_SERVICE_UUID]
      });

      const deviceInfo: HC03DeviceInfo = {
        id: device.id,
        name: device.name || 'HC03 Device',
        connected: device.gatt?.connected || false
      };

      this.isScanning = false;
      this.emit('scanCompleted', [deviceInfo]);
      
      return [deviceInfo];
    } catch (error) {
      this.isScanning = false;
      this.emit('scanError', error);
      throw error;
    }
  }

  /**
   * Connect to HC03 device
   */
  async connect(deviceId: string, patientId: string): Promise<void> {
    try {
      if (!this.device || this.device.id !== deviceId) {
        throw new Error('Device not found. Please scan for devices first.');
      }

      this.currentPatientId = patientId;
      this.emit('connecting', deviceId);

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();
      
      // Get primary service
      this.service = await this.server.getPrimaryService(HC03_SERVICE_UUID);
      
      // Get characteristics
      this.writeCharacteristic = await this.service.getCharacteristic(HC03_WRITE_CHARACTERISTIC_UUID);
      this.notifyCharacteristic = await this.service.getCharacteristic(HC03_NOTIFY_CHARACTERISTIC_UUID);
      
      // Setup notifications
      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
      
      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
      
      this.isConnected = true;
      this.emit('connected', {
        deviceId,
        deviceName: this.device.name,
        patientId
      });

      // Query device info
      await this.queryBattery();
      
    } catch (error) {
      this.emit('connectionError', error);
      throw error;
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    try {
      if (this.server && this.server.connected) {
        await this.server.disconnect();
      }
      this.handleDisconnection();
    } catch (error) {
      console.error('Error disconnecting:', error);
      this.handleDisconnection();
    }
  }

  /**
   * Start measurement for specific detection type
   */
  async startMeasurement(type: DetectionType): Promise<void> {
    if (!this.isConnected || !this.writeCharacteristic) {
      throw new Error('Device not connected');
    }

    let command: number[];
    
    switch (type) {
      case DetectionType.ECG:
        command = COMMANDS.ECG_START;
        this.ecgBuffer = [];
        break;
      case DetectionType.BT:
        command = COMMANDS.TEMPERATURE_START;
        break;
      case DetectionType.OX:
        command = COMMANDS.BLOOD_OXYGEN_START;
        this.oxWaveBuffer = [];
        break;
      case DetectionType.BP:
        command = COMMANDS.BLOOD_PRESSURE_START;
        break;
      case DetectionType.BG:
        command = COMMANDS.BLOOD_GLUCOSE_START;
        break;
      case DetectionType.BATTERY:
        command = COMMANDS.BATTERY_QUERY;
        break;
      default:
        throw new Error(`Unsupported detection type: ${type}`);
    }

    await this.writeCharacteristic.writeValue(new Uint8Array(command));
    this.measurementActive.add(type);
    this.emit('measurementStarted', { type, patientId: this.currentPatientId });
  }

  /**
   * Stop measurement for specific detection type
   */
  async stopMeasurement(type: DetectionType): Promise<void> {
    if (!this.isConnected || !this.writeCharacteristic) {
      throw new Error('Device not connected');
    }

    let command: number[];
    
    switch (type) {
      case DetectionType.ECG:
        command = COMMANDS.ECG_STOP;
        break;
      case DetectionType.BT:
        command = COMMANDS.TEMPERATURE_STOP;
        break;
      case DetectionType.OX:
        command = COMMANDS.BLOOD_OXYGEN_STOP;
        break;
      case DetectionType.BP:
        command = COMMANDS.BLOOD_PRESSURE_STOP;
        break;
      case DetectionType.BG:
        command = COMMANDS.BLOOD_GLUCOSE_STOP;
        break;
      default:
        return; // Battery doesn't need stop command
    }

    await this.writeCharacteristic.writeValue(new Uint8Array(command));
    this.measurementActive.delete(type);
    this.emit('measurementStopped', { type, patientId: this.currentPatientId });
  }

  /**
   * Query battery level
   */
  async queryBattery(): Promise<void> {
    await this.startMeasurement(DetectionType.BATTERY);
  }

  /**
   * Handle incoming notifications from device
   */
  private handleNotification(event: Event): void {
    const characteristic = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const data = new Uint8Array(characteristic.value!.buffer);
    
    try {
      this.parseData(Array.from(data));
    } catch (error) {
      console.error('Error parsing device data:', error);
      this.emit('dataError', error);
    }
  }

  /**
   * Parse incoming data based on protocol
   */
  private parseData(data: number[]): void {
    // Basic protocol validation (AA AA header)
    if (data.length < 4 || data[0] !== 0xaa || data[1] !== 0xaa) {
      return;
    }

    const dataType = data[2];
    const payload = data.slice(4);

    switch (dataType) {
      case 0x12:
        this.parseECGData(payload);
        break;
      case 0x13:
        this.parseTemperatureData(payload);
        break;
      case 0x14:
        this.parseBloodOxygenData(payload);
        break;
      case 0x15:
        this.parseBloodPressureData(payload);
        break;
      case 0x16:
        this.parseBloodGlucoseData(payload);
        break;
      case 0x17:
        this.parseBatteryData(payload);
        break;
      default:
        console.warn('Unknown data type:', dataType);
    }
  }

  /**
   * Parse ECG data
   */
  private parseECGData(payload: number[]): void {
    if (payload.length < 2) return;

    const subType = payload[0];
    const value = payload[1] | (payload[2] << 8);

    switch (subType) {
      case 0x01: // Wave data
        this.ecgBuffer.push(value);
        if (this.ecgBuffer.length > 2200) {
          this.ecgBuffer.shift();
        }
        this.emit('ecgWave', { wave: value, buffer: [...this.ecgBuffer] });
        break;
      case 0x02: // Heart rate
        this.emit('ecgHeartRate', { heartRate: value });
        break;
      case 0x03: // Mood index
        this.emit('ecgMood', { moodIndex: value });
        break;
      case 0x04: // RR interval
        this.emit('ecgRR', { rrInterval: value });
        break;
      case 0x05: // HRV
        this.emit('ecgHRV', { hrv: value });
        break;
      case 0x06: // Respiratory rate
        this.emit('ecgRespiratory', { respiratoryRate: value });
        break;
      case 0x07: // Finger detection
        this.emit('ecgTouch', { fingerDetected: value === 1 });
        break;
    }
  }

  /**
   * Parse temperature data
   */
  private parseTemperatureData(payload: number[]): void {
    if (payload.length < 2) return;
    
    const temperature = (payload[0] | (payload[1] << 8)) / 10;
    
    const temperatureData: TemperatureData = {
      temperature,
      measurementSite: 'forehead'
    };

    this.emit('temperatureData', {
      type: 'temperature',
      timestamp: Date.now(),
      patientId: this.currentPatientId,
      deviceId: this.device?.id,
      data: temperatureData
    });
  }

  /**
   * Parse blood oxygen data
   */
  private parseBloodOxygenData(payload: number[]): void {
    if (payload.length < 4) return;

    const subType = payload[0];
    
    switch (subType) {
      case 0x01: // Blood oxygen and heart rate
        const bloodOxygen = payload[1];
        const heartRate = payload[2];
        
        const bloodOxygenData: BloodOxygenData = {
          bloodOxygen,
          heartRate,
          fingerDetected: true,
          waveData: [...this.oxWaveBuffer]
        };

        this.emit('bloodOxygenData', {
          type: 'bloodOxygen',
          timestamp: Date.now(),
          patientId: this.currentPatientId,
          deviceId: this.device?.id,
          data: bloodOxygenData
        });
        break;
      case 0x02: // Wave data
        const wave = payload[1] | (payload[2] << 8);
        this.oxWaveBuffer.push(wave);
        if (this.oxWaveBuffer.length > 400) {
          this.oxWaveBuffer.shift();
        }
        this.emit('bloodOxygenWave', { wave, buffer: [...this.oxWaveBuffer] });
        break;
      case 0x03: // Finger detection
        this.emit('bloodOxygenTouch', { fingerDetected: payload[1] === 1 });
        break;
    }
  }

  /**
   * Parse blood pressure data
   */
  private parseBloodPressureData(payload: number[]): void {
    if (payload.length < 6) return;

    const systolic = payload[0] | (payload[1] << 8);
    const diastolic = payload[2] | (payload[3] << 8);
    const heartRate = payload[4] | (payload[5] << 8);
    const progress = payload[6] || 0;

    const bloodPressureData: BloodPressureData = {
      systolic,
      diastolic,
      heartRate,
      measurementProgress: progress,
      cuffPressure: 0
    };

    this.emit('bloodPressureData', {
      type: 'bloodPressure',
      timestamp: Date.now(),
      patientId: this.currentPatientId,
      deviceId: this.device?.id,
      data: bloodPressureData
    });
  }

  /**
   * Parse blood glucose data
   */
  private parseBloodGlucoseData(payload: number[]): void {
    if (payload.length < 3) return;

    const subType = payload[0];
    
    switch (subType) {
      case 0x01: // Glucose level
        const glucoseLevel = payload[1] | (payload[2] << 8);
        
        const bloodGlucoseData: BloodGlucoseData = {
          glucoseLevel,
          testStripStatus: 'inserted',
          measurementType: 'capillary'
        };

        this.emit('bloodGlucoseData', {
          type: 'bloodGlucose',
          timestamp: Date.now(),
          patientId: this.currentPatientId,
          deviceId: this.device?.id,
          data: bloodGlucoseData
        });
        break;
      case 0x02: // Test strip status
        const status = payload[1] === 1 ? 'inserted' : 'removed';
        this.emit('bloodGlucoseStatus', { testStripStatus: status });
        break;
    }
  }

  /**
   * Parse battery data
   */
  private parseBatteryData(payload: number[]): void {
    if (payload.length < 2) return;

    const batteryLevel = payload[0];
    const chargingStatus = payload[1] === 1;

    const batteryData: BatteryData = {
      batteryLevel,
      chargingStatus
    };

    this.emit('batteryData', {
      type: 'battery',
      timestamp: Date.now(),
      patientId: this.currentPatientId,
      deviceId: this.device?.id,
      data: batteryData
    });
  }

  /**
   * Handle device disconnection
   */
  private handleDisconnection(): void {
    this.isConnected = false;
    this.server = null;
    this.service = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.measurementActive.clear();
    this.currentPatientId = null;
    
    this.emit('disconnected');
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current device info
   */
  getCurrentDevice(): HC03DeviceInfo | null {
    if (!this.device) return null;
    
    return {
      id: this.device.id,
      name: this.device.name || 'HC03 Device',
      connected: this.isConnected
    };
  }

  /**
   * Get active measurements
   */
  getActiveMeasurements(): DetectionType[] {
    return Array.from(this.measurementActive);
  }
}

// Export singleton instance
export const bluetoothService = new BluetoothService();