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

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export enum BluetoothErrorType {
  NOT_SUPPORTED = 'not_supported',
  PERMISSION_DENIED = 'permission_denied',
  DEVICE_NOT_FOUND = 'device_not_found',
  CONNECTION_FAILED = 'connection_failed',
  CONNECTION_TIMEOUT = 'connection_timeout',
  DISCONNECTED = 'disconnected',
  COMMAND_FAILED = 'command_failed',
  DATA_PARSE_ERROR = 'data_parse_error',
  UNKNOWN = 'unknown'
}

export interface BluetoothError {
  type: BluetoothErrorType;
  message: string;
  originalError?: Error;
  deviceId?: string;
  timestamp: number;
}

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private currentPatientId: string | null = null;

  // Connection management
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectInterval = 2000; // 2 seconds
  private connectionTimeout = 10000; // 10 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;

  // Data buffers for real-time processing
  private ecgBuffer: number[] = [];
  private oxWaveBuffer: number[] = [];
  private measurementActive: Set<DetectionType> = new Set();

  constructor() {
    // Check Web Bluetooth API support
    if (!navigator.bluetooth) {
      throw this.createError(
        BluetoothErrorType.NOT_SUPPORTED,
        'Web Bluetooth API is not supported in this browser. Please use a supported browser like Chrome, Edge, or Opera.'
      );
    }
  }

  /**
   * Create standardized error object
   */
  private createError(type: BluetoothErrorType, message: string, originalError?: Error, deviceId?: string): BluetoothError {
    const bluetoothError: BluetoothError = {
      type,
      message,
      originalError,
      deviceId,
      timestamp: Date.now()
    };
    
    this.emit('bluetoothError', bluetoothError);
    return bluetoothError;
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyErrorMessage(error: BluetoothError): string {
    switch (error.type) {
      case BluetoothErrorType.NOT_SUPPORTED:
        return 'Bluetooth is not supported on this device. Please use a compatible browser.';
      case BluetoothErrorType.PERMISSION_DENIED:
        return 'Bluetooth access was denied. Please allow Bluetooth permissions and try again.';
      case BluetoothErrorType.DEVICE_NOT_FOUND:
        return 'HC03 device not found. Make sure the device is turned on and nearby.';
      case BluetoothErrorType.CONNECTION_FAILED:
        return 'Failed to connect to HC03 device. Please try again.';
      case BluetoothErrorType.CONNECTION_TIMEOUT:
        return 'Connection timed out. Please move closer to the device and try again.';
      case BluetoothErrorType.DISCONNECTED:
        return 'Device disconnected unexpectedly. Attempting to reconnect...';
      case BluetoothErrorType.COMMAND_FAILED:
        return 'Failed to send command to device. Please check the connection.';
      case BluetoothErrorType.DATA_PARSE_ERROR:
        return 'Error reading data from device. The measurement may be incomplete.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Set connection state and emit event
   */
  private setConnectionState(state: ConnectionState): void {
    const previousState = this.connectionState;
    this.connectionState = state;
    this.emit('connectionStateChanged', { 
      previousState, 
      currentState: state, 
      deviceId: this.device?.id 
    });
  }

  /**
   * Start scanning for HC03 devices
   */
  async startScan(): Promise<HC03DeviceInfo[]> {
    if (this.connectionState === ConnectionState.SCANNING) {
      throw this.createError(
        BluetoothErrorType.UNKNOWN,
        'Already scanning for devices'
      );
    }

    try {
      this.setConnectionState(ConnectionState.SCANNING);
      this.emit('scanStarted');

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(this.createError(
            BluetoothErrorType.CONNECTION_TIMEOUT,
            'Device scan timed out'
          ));
        }, this.connectionTimeout);
      });

      // Race between device request and timeout
      const device = await Promise.race([
        navigator.bluetooth.requestDevice({
          filters: [
            { services: [HC03_SERVICE_UUID] },
            { namePrefix: 'HC03' },
            { namePrefix: 'LT-' }
          ],
          optionalServices: [HC03_SERVICE_UUID]
        }),
        timeoutPromise
      ]);

      this.device = device;
      const deviceInfo: HC03DeviceInfo = {
        id: device.id,
        name: device.name || 'HC03 Device',
        connected: device.gatt?.connected || false
      };

      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.emit('scanCompleted', [deviceInfo]);
      
      return [deviceInfo];
    } catch (error: any) {
      this.setConnectionState(ConnectionState.ERROR);
      
      let bluetoothError: BluetoothError;
      
      if (error.name === 'NotFoundError') {
        bluetoothError = this.createError(
          BluetoothErrorType.DEVICE_NOT_FOUND,
          'No HC03 device found. Make sure the device is turned on and in pairing mode.',
          error
        );
      } else if (error.name === 'NotAllowedError') {
        bluetoothError = this.createError(
          BluetoothErrorType.PERMISSION_DENIED,
          'Bluetooth access denied. Please allow Bluetooth permissions in your browser.',
          error
        );
      } else if (error.type) {
        // Already a BluetoothError
        bluetoothError = error;
      } else {
        bluetoothError = this.createError(
          BluetoothErrorType.UNKNOWN,
          `Scan failed: ${error.message || 'Unknown error'}`,
          error
        );
      }
      
      this.emit('scanError', bluetoothError);
      throw bluetoothError;
    }
  }

  /**
   * Connect to HC03 device
   */
  async connect(deviceId: string, patientId: string): Promise<void> {
    try {
      if (!this.device || this.device.id !== deviceId) {
        throw this.createError(
          BluetoothErrorType.DEVICE_NOT_FOUND,
          'Device not found. Please scan for devices first.',
          undefined,
          deviceId
        );
      }

      if (this.connectionState === ConnectionState.CONNECTING || 
          this.connectionState === ConnectionState.CONNECTED) {
        throw this.createError(
          BluetoothErrorType.UNKNOWN,
          'Already connecting or connected to device',
          undefined,
          deviceId
        );
      }

      this.currentPatientId = patientId;
      this.setConnectionState(ConnectionState.CONNECTING);
      this.emit('connecting', deviceId);

      // Clear any existing reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Create connection timeout
      const connectionTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(this.createError(
            BluetoothErrorType.CONNECTION_TIMEOUT,
            'Connection timed out. Please move closer to the device.',
            undefined,
            deviceId
          ));
        }, this.connectionTimeout);
      });

      // Attempt connection with timeout
      await Promise.race([
        this.performConnection(deviceId, patientId),
        connectionTimeout
      ]);

    } catch (error: any) {
      this.setConnectionState(ConnectionState.ERROR);
      
      let bluetoothError: BluetoothError;
      
      if (error.type) {
        bluetoothError = error;
      } else if (error.name === 'NetworkError') {
        bluetoothError = this.createError(
          BluetoothErrorType.CONNECTION_FAILED,
          'Network error during connection. Please check device and try again.',
          error,
          deviceId
        );
      } else {
        bluetoothError = this.createError(
          BluetoothErrorType.CONNECTION_FAILED,
          `Connection failed: ${error.message || 'Unknown error'}`,
          error,
          deviceId
        );
      }
      
      this.emit('connectionError', bluetoothError);
      throw bluetoothError;
    }
  }

  /**
   * Perform the actual connection steps
   */
  private async performConnection(deviceId: string, patientId: string): Promise<void> {
    // Connect to GATT server
    this.server = await this.device!.gatt!.connect();
    
    // Get primary service
    this.service = await this.server.getPrimaryService(HC03_SERVICE_UUID);
    
    // Get characteristics
    this.writeCharacteristic = await this.service.getCharacteristic(HC03_WRITE_CHARACTERISTIC_UUID);
    this.notifyCharacteristic = await this.service.getCharacteristic(HC03_NOTIFY_CHARACTERISTIC_UUID);
    
    // Setup notifications
    await this.notifyCharacteristic.startNotifications();
    this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
    
    // Handle disconnection
    this.device!.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
    
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    
    this.emit('connected', {
      deviceId,
      deviceName: this.device!.name,
      patientId
    });

    // Query device info
    try {
      await this.queryBattery();
    } catch (error) {
      console.warn('Failed to query battery after connection:', error);
      // Don't fail the connection for this
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    try {
      // Clear reconnect timer if any
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.server && this.server.connected) {
        await this.server.disconnect();
      }
      this.handleDisconnection(false); // Don't auto-reconnect on manual disconnect
    } catch (error) {
      console.error('Error disconnecting:', error);
      const bluetoothError = this.createError(
        BluetoothErrorType.UNKNOWN,
        `Disconnect error: ${error.message || 'Unknown error'}`,
        error as Error,
        this.device?.id
      );
      this.emit('disconnectionError', bluetoothError);
      this.handleDisconnection(false);
    }
  }

  /**
   * Attempt to reconnect to the device
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const error = this.createError(
        BluetoothErrorType.CONNECTION_FAILED,
        `Failed to reconnect after ${this.maxReconnectAttempts} attempts`,
        undefined,
        this.device?.id
      );
      this.emit('reconnectFailed', error);
      this.setConnectionState(ConnectionState.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState(ConnectionState.RECONNECTING);
    
    this.emit('reconnectAttempt', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      deviceId: this.device?.id
    });

    try {
      if (this.device && this.currentPatientId) {
        await this.performConnection(this.device.id, this.currentPatientId);
        this.emit('reconnectSuccess', {
          attempts: this.reconnectAttempts,
          deviceId: this.device.id
        });
      }
    } catch (error) {
      console.warn(`Reconnect attempt ${this.reconnectAttempts} failed:`, error);
      
      // Schedule next reconnect attempt
      this.reconnectTimer = setTimeout(() => {
        this.attemptReconnect();
      }, this.reconnectInterval * this.reconnectAttempts); // Exponential backoff
    }
  }

  /**
   * Start measurement for specific detection type
   */
  async startMeasurement(type: DetectionType): Promise<void> {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.writeCharacteristic) {
      throw this.createError(
        BluetoothErrorType.DISCONNECTED,
        'Device not connected. Please connect to device first.',
        undefined,
        this.device?.id
      );
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

    try {
      await this.writeCharacteristic.writeValue(new Uint8Array(command));
      this.measurementActive.add(type);
      this.emit('measurementStarted', { type, patientId: this.currentPatientId });
    } catch (error) {
      const bluetoothError = this.createError(
        BluetoothErrorType.COMMAND_FAILED,
        `Failed to start ${type} measurement`,
        error as Error,
        this.device?.id
      );
      this.emit('measurementError', bluetoothError);
      throw bluetoothError;
    }
  }

  /**
   * Stop measurement for specific detection type
   */
  async stopMeasurement(type: DetectionType): Promise<void> {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.writeCharacteristic) {
      throw this.createError(
        BluetoothErrorType.DISCONNECTED,
        'Device not connected. Please connect to device first.',
        undefined,
        this.device?.id
      );
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

    try {
      await this.writeCharacteristic.writeValue(new Uint8Array(command));
      this.measurementActive.delete(type);
      this.emit('measurementStopped', { type, patientId: this.currentPatientId });
    } catch (error) {
      const bluetoothError = this.createError(
        BluetoothErrorType.COMMAND_FAILED,
        `Failed to stop ${type} measurement`,
        error as Error,
        this.device?.id
      );
      this.emit('measurementError', bluetoothError);
      throw bluetoothError;
    }
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
    try {
      const characteristic = event.target as unknown as BluetoothRemoteGATTCharacteristic;
      
      if (!characteristic.value) {
        console.warn('Received notification with no data');
        return;
      }
      
      const data = new Uint8Array(characteristic.value.buffer);
      this.parseData(Array.from(data));
    } catch (error) {
      console.error('Error parsing device data:', error);
      const bluetoothError = this.createError(
        BluetoothErrorType.DATA_PARSE_ERROR,
        `Failed to parse device data: ${error.message || 'Unknown error'}`,
        error as Error,
        this.device?.id
      );
      this.emit('dataError', bluetoothError);
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
  private handleDisconnection(autoReconnect: boolean = true): void {
    this.server = null;
    this.service = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.measurementActive.clear();
    
    const wasConnected = this.connectionState === ConnectionState.CONNECTED;
    this.setConnectionState(ConnectionState.DISCONNECTED);
    
    const disconnectData = {
      deviceId: this.device?.id,
      patientId: this.currentPatientId,
      unexpected: wasConnected
    };
    
    this.emit('disconnected', disconnectData);
    
    // Attempt auto-reconnect if it was an unexpected disconnection
    if (autoReconnect && wasConnected && this.device && this.currentPatientId) {
      const error = this.createError(
        BluetoothErrorType.DISCONNECTED,
        'Device disconnected unexpectedly. Attempting to reconnect...',
        undefined,
        this.device.id
      );
      
      this.emit('unexpectedDisconnection', error);
      
      // Start reconnection attempts
      this.reconnectTimer = setTimeout(() => {
        this.attemptReconnect();
      }, this.reconnectInterval);
    } else {
      // Manual disconnect - clean up completely
      this.currentPatientId = null;
      this.reconnectAttempts = 0;
    }
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
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get connection health info
   */
  getConnectionHealth(): {
    state: ConnectionState;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    deviceId?: string;
    patientId?: string;
  } {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      deviceId: this.device?.id,
      patientId: this.currentPatientId || undefined
    };
  }

  /**
   * Set reconnection settings
   */
  setReconnectionSettings(maxAttempts: number, intervalMs: number): void {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectInterval = intervalMs;
  }

  /**
   * Set connection timeout
   */
  setConnectionTimeout(timeoutMs: number): void {
    this.connectionTimeout = timeoutMs;
  }

  /**
   * Force stop reconnection attempts
   */
  stopReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    
    if (this.connectionState === ConnectionState.RECONNECTING) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
    }
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