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

// HC03/HC02 Device Service and Characteristic UUIDs (from Official HC03 Flutter SDK)
// Source: HC03_Flutter_V1.0.1/lib/src/common/constant.dart
const HC03_FILTER_UUID = '0000ff27-0000-1000-8000-00805f9b34fb'; // Official SDK FILTER_UUID
const HC03_SERVICE_UUID = '00001822-0000-1000-8000-00805f9b34fb'; // Official SDK UUID_SERVICE
const HC03_WRITE_CHARACTERISTIC = '0000fff1-0000-1000-8000-00805f9b34fb'; // Official SDK WRITE_UUID
const HC03_NOTIFY_CHARACTERISTIC = '0000fff4-0000-1000-8000-00805f9b34fb'; // Official SDK NOTIFY_UUID (was fff2, CORRECTED to fff4!)
const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb';

// HC03 Protocol Constants (from baseCommon.dart)
const PROTOCOL = {
  PACKAGE_TOTAL_LENGTH: 10,
  PACKAGE_INDEX_START: 0,
  PACKAGE_INDEX_LENGTH: 1,
  PACKAGE_INDEX_BT_EDITION: 3,
  PACKAGE_INDEX_TYPE: 4,
  PACKAGE_INDEX_HEADER_CRC: 5,
  PACKAGE_INDEX_CONTENT: 6,
  ATTR_START_REQ: 0x01,
  ATTR_START_RES: 0x02,
  ATTR_END_REQ: 0xff,
  BT_EDITION: 0x04,
  
  // Command types (from baseCommon.dart)
  ELECTROCARDIOGRAM: 0x05,
  TEMPERATURE: 0x02,
  OX_REQ_TYPE_NORMAL: 0x04,
  BP_REQ_TYPE: 0x01,
  BLOOD_GLUCOSE: 0x03,
  CHECK_BATTARY: 0x0f,
  
  // Command contents (from baseCommon.dart)
  ECG_START: 0x01,
  ECG_STOP: 0x02,
  TEP_START_NORMAL: 0x00,
  TEP_STOP_NORMAL: 0x01,
  OX_REQ_CONTENT_START_NORMAL: 0x00,
  OX_REQ_CONTENT_STOP_NORMAL: 0x01,
  BP_REQ_CONTENT_CALIBRATE_PARAMETER: 0x01,
  BP_REQ_CONTENT_STOP_CHARGING_GAS: 0x07,
  TEST_PAPER_GET_VER: 0x01,
  TEST_PAPER_ADC_STOP: 0x04,
  BATTERY_QUERY: 0x00,
  
  // Response types
  BT_RES_TYPE: 0x82,
  OX_RES_TYPE_NORMAL: 0x84,
  BP_RES_TYPE: 0x81,
  BG_RES_TYPE: 0x83,
  RESPONSE_CHECK_BATTERY: 0x8f,
};

// CRC calculation functions (from baseCommon.dart)
function encryHead(data: number[]): number {
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    result ^= (data[i] & 0xff);
    result &= 0xffff;
  }
  return result;
}

function encryTail(data: number[]): number {
  let result = 0xffff;
  for (const byte of data) {
    const transe = byte & 0xff;
    result = ((result >> 8) & 0xff) | (result << 8);
    result &= 0xffff;
    result ^= transe;
    result &= 0xffff;
    result ^= (result & 0xff) >> 4;
    result &= 0xffff;
    result ^= (result << 8) << 4;
    result &= 0xffff;
    result ^= ((result & 0xff) << 4) << 1;
    result &= 0xffff;
  }
  return result;
}

// Package command data (from baseCommon.dart obtainCommandData)
function obtainCommandData(type: number, cmd: number[]): Uint8Array {
  const totalLen = PROTOCOL.PACKAGE_TOTAL_LENGTH + cmd.length - 1;
  const buffer = new Uint8Array(totalLen);
  const view = new DataView(buffer.buffer);
  
  // Fill start
  view.setUint8(PROTOCOL.PACKAGE_INDEX_START, PROTOCOL.ATTR_START_REQ);
  
  // Fill length (little-endian)
  view.setUint16(PROTOCOL.PACKAGE_INDEX_LENGTH, cmd.length, true);
  
  // Fill bluetooth edition
  view.setUint8(PROTOCOL.PACKAGE_INDEX_BT_EDITION, PROTOCOL.BT_EDITION);
  
  // Fill type
  view.setUint8(PROTOCOL.PACKAGE_INDEX_TYPE, type);
  
  // Calculate and fill header CRC
  const headerData = Array.from(buffer.slice(0, PROTOCOL.PACKAGE_INDEX_HEADER_CRC));
  const entryHead = encryHead(headerData);
  view.setUint8(PROTOCOL.PACKAGE_INDEX_HEADER_CRC, entryHead);
  
  // Fill content
  for (let i = 0; i < cmd.length; i++) {
    view.setUint8(PROTOCOL.PACKAGE_INDEX_CONTENT + i, cmd[i]);
  }
  
  // Calculate and fill tail CRC
  const tailIndex = totalLen - 3;
  const tailData = Array.from(buffer.slice(0, tailIndex));
  const tail = encryTail(tailData);
  view.setUint16(tailIndex, tail, true);
  
  // Fill end
  view.setUint8(totalLen - 1, PROTOCOL.ATTR_END_REQ);
  
  return buffer;
}

// Detection Commands using proper HC03 protocol packaging
const DETECTION_COMMANDS: Record<Detection, Uint8Array> = {
  [Detection.ECG]: obtainCommandData(PROTOCOL.ELECTROCARDIOGRAM, [PROTOCOL.ECG_START]),
  [Detection.OX]: obtainCommandData(PROTOCOL.OX_REQ_TYPE_NORMAL, [PROTOCOL.OX_REQ_CONTENT_START_NORMAL]),
  [Detection.BP]: obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_CALIBRATE_PARAMETER]),
  [Detection.BT]: obtainCommandData(PROTOCOL.TEMPERATURE, [PROTOCOL.TEP_START_NORMAL]),
  [Detection.BG]: obtainCommandData(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_GET_VER]),
  [Detection.BATTERY]: obtainCommandData(PROTOCOL.CHECK_BATTARY, [PROTOCOL.BATTERY_QUERY]),
};

const STOP_COMMANDS: Partial<Record<Detection, Uint8Array>> = {
  [Detection.ECG]: obtainCommandData(PROTOCOL.ELECTROCARDIOGRAM, [PROTOCOL.ECG_STOP]),
  [Detection.OX]: obtainCommandData(PROTOCOL.OX_REQ_TYPE_NORMAL, [PROTOCOL.OX_REQ_CONTENT_STOP_NORMAL]),
  [Detection.BP]: obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_STOP_CHARGING_GAS]),
  [Detection.BT]: obtainCommandData(PROTOCOL.TEMPERATURE, [PROTOCOL.TEP_STOP_NORMAL]),
  [Detection.BG]: obtainCommandData(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_ADC_STOP]),
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
    readValue(): Promise<DataView>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  }

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
  
  // Store latest measurement data as per Flutter SDK API
  private latestEcgData: ECGData | null = null;
  private latestBloodOxygenData: BloodOxygenData | null = null;
  private latestBloodPressureData: BloodPressureData | null = null;
  private latestBloodGlucoseData: BloodGlucoseData | null = null;
  private latestTemperatureData: TemperatureData | null = null;
  private latestBatteryData: BatteryData | null = null;

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
      // Check if already connected
      if (this.isConnected && this.device && this.server?.connected) {
        console.log('Device already connected');
        return this.device;
      }
      
      // Disconnect any existing connection first
      if (this.device && this.server?.connected) {
        await this.disconnect();
      }
      
      // Request HC03/HC02 device with filters that match both device types
      // HC03 devices use naming pattern: HC03-XXXXXX
      // HC02 devices use naming pattern: HC02-XXXXXX (e.g., HC02-F1B51D)
      console.log('🔍 [HC03] Requesting Bluetooth device...');
      console.log('🔍 [HC03] Will search for HC03-XXX and HC02-XXX devices');
      
      try {
        console.log('🔍 [HC03] Calling navigator.bluetooth.requestDevice()...');
        
        // Match official HC03 Flutter SDK scanning approach:
        // Web Bluetooth API: Use name-based filters for maximum compatibility
        // This allows HC02-F1B5D and HC03-XXXXXX devices to appear in picker
        // Service UUID filtering happens AFTER device selection during connection
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            // Name-based filters for all HC03/HC02 device variants
            { namePrefix: 'HC03' },       // HC03-XXXXXX devices
            { namePrefix: 'HC02' },       // HC02-F1B5D and similar
            { namePrefix: 'HC-03' },      // Alternative naming
            { namePrefix: 'HC-02' },      // Alternative naming
            { namePrefix: 'UNKTOP' },     // Brand name
            { namePrefix: 'Health' },     // Generic health devices
            { namePrefix: 'ECG' },        // ECG-specific devices
            { namePrefix: 'BLE-' },       // BLE prefix devices
          ],
          optionalServices: [
            // Actual services accessed after connection (from official SDK)
            HC03_SERVICE_UUID,      // 00001822 - actual data service
            HC03_FILTER_UUID,       // 0000ff27 - discovery service
            BATTERY_SERVICE_UUID,   // 0000180f - battery service
            
            // Additional standard services for compatibility
            'device_information',
            'generic_access',
            'battery_service',
            
            // Legacy/alternative UUIDs for older devices
            '0000fff0-0000-1000-8000-00805f9b34fb',
            '0000ffe0-0000-1000-8000-00805f9b34fb',
            '0000ffe5-0000-1000-8000-00805f9b34fb',
            '000018f0-0000-1000-8000-00805f9b34fb',
            'heart_rate',
            'health_thermometer'
          ]
        });

        console.log('✅ [HC03] Device selected successfully!');
        console.log('✅ [HC03] Device name:', this.device.name);
        console.log('✅ [HC03] Device ID:', this.device.id);
      } catch (requestError: any) {
        console.error('❌ [HC03] navigator.bluetooth.requestDevice() failed');
        console.error('❌ [HC03] Error name:', requestError.name);
        console.error('❌ [HC03] Error message:', requestError.message);
        console.error('❌ [HC03] Full error:', requestError);
        throw requestError;
      }

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
    } catch (error: any) {
      console.error('Failed to connect to HC03 device:', error);
      
      // Provide user-friendly error messages for common Web Bluetooth issues
      if (error.name === 'NotFoundError') {
        throw new Error('No HC03 device found. Make sure:\n• Your HC03 device is turned on and in pairing mode (LED should be blinking)\n• The device is within 10 meters\n• The device is not already connected to another phone');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Bluetooth permission denied. Please:\n• Enable Bluetooth in your browser settings\n• Grant Bluetooth permission when prompted\n• On Android: Enable Location/GPS (required for Bluetooth scanning)');
      } else if (error.name === 'SecurityError') {
        throw new Error('Bluetooth access blocked. Please:\n• Use HTTPS (required for Web Bluetooth)\n• Check browser permissions\n• Try using Chrome, Edge, or another compatible browser');
      } else if (error.name === 'NetworkError') {
        throw new Error('Failed to connect to device. Please:\n• Move closer to the HC03 device\n• Restart your HC03 device\n• Forget the device in phone Bluetooth settings and try again');
      } else if (error.message && error.message.includes('User cancelled')) {
        throw new Error('Device selection cancelled. Please select your HC03 device from the list.');
      }
      
      // Generic error for unknown issues
      throw new Error(`Failed to connect: ${error.message || 'Unknown error'}. Please restart your HC03 device and try again.`);
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
    if (!this.getConnectionStatus() || !this.writeCharacteristic) {
      throw new Error('Device not connected or characteristics not available. Please connect to your HC03 device first.');
    }

    try {
      const command = DETECTION_COMMANDS[detection as keyof typeof DETECTION_COMMANDS];
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
      console.log('Disconnecting from HC03 device...');
      
      // Stop all active detections first
      const detectionsToStop = Array.from(this.activeDetections);
      for (const detection of detectionsToStop) {
        try {
          await this.stopDetect(detection);
        } catch (e) {
          console.warn(`Failed to stop ${detection} detection:`, e);
        }
      }
      
      // Note: Web Bluetooth API doesn't support removeEventListener
      // Event listeners will be cleaned up when device is disconnected
      
      // Disconnect GATT server
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
      
      // Clear all references
      this.isConnected = false;
      this.server = null;
      this.service = null;
      this.writeCharacteristic = null;
      this.notifyCharacteristic = null;
      this.activeDetections.clear();
      
      console.log('HC03 device disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting HC03 device:', error);
      this.isConnected = false; // Ensure we mark as disconnected even if cleanup fails
    }
  }

  // Handle characteristic value changes
  private handleCharacteristicValueChanged(event: Event): void {
    const characteristic = (event.target as unknown) as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (data) {
      this.parseData(data.buffer);
    }
  }

  // HC03 Protocol Constants (matching native plugin)
  private static readonly PACKAGE_TOTAL_LENGTH = 10;
  private static readonly PACKAGE_INDEX_START = 0;
  private static readonly PACKAGE_INDEX_LENGTH = 1;
  private static readonly PACKAGE_INDEX_BT_EDITION = 3;
  private static readonly PACKAGE_INDEX_TYPE = 4;
  private static readonly PACKAGE_INDEX_HEADER_CRC = 5;
  private static readonly PACKAGE_INDEX_CONTENT = 6;
  private static readonly ATTR_START_RES = 0x02;
  private static readonly BT_EDITION = 0x04;
  private static readonly ATTR_END = 0x03;
  private static readonly FULL_PACKAGE_MAX_DATA_SIZE = 11;
  
  // Response Type Constants
  private static readonly RESPONSE_CHECK_BATTERY = 0x8F;
  private static readonly BT_RES_TYPE = 0x82;  // Temperature
  private static readonly BG_RES_TYPE = 0x83;  // Blood Glucose
  private static readonly OX_RES_TYPE_NORMAL = 0x84;  // Blood Oxygen
  private static readonly BP_RES_TYPE = 0x81;  // Blood Pressure
  
  // Multi-packet frame cache
  private cacheType: number = 0;
  private cacheData: number[] = [];

  // Parse incoming data using HC03 protocol with multi-packet reconstruction
  public parseData(data: ArrayBuffer): void {
    try {
      const rawData = new Uint8Array(data);
      
      if (rawData.length < Hc03Sdk.PACKAGE_TOTAL_LENGTH - 1) {
        console.warn('Insufficient data length:', rawData.length);
        return;
      }
      
      // Unpack HC03 frame
      const originData = this.generalUnpackRawData(rawData);
      
      if (originData) {
        // Route to appropriate parser based on type
        this.routeData(originData.type, originData.data);
      }
    } catch (error) {
      console.error('Error parsing HC03 data:', error);
    }
  }

  // Unpack HC03 frame with multi-packet reconstruction (matching native plugin)
  private generalUnpackRawData(rawData: Uint8Array): { type: number; data: Uint8Array } | null {
    const view = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);
    
    const start = view.getUint8(Hc03Sdk.PACKAGE_INDEX_START);
    let length = view.getUint16(Hc03Sdk.PACKAGE_INDEX_LENGTH, true); // Little endian
    const btEdition = view.getUint8(Hc03Sdk.PACKAGE_INDEX_BT_EDITION);
    let type = view.getUint8(Hc03Sdk.PACKAGE_INDEX_TYPE);
    const headerCrc = view.getUint8(Hc03Sdk.PACKAGE_INDEX_HEADER_CRC);
    
    // Validate header CRC
    const headerBytes = rawData.slice(Hc03Sdk.PACKAGE_INDEX_START, Hc03Sdk.PACKAGE_INDEX_HEADER_CRC);
    const checkEncryHead = this.encryHead(headerBytes);
    
    const isFull = btEdition === Hc03Sdk.BT_EDITION &&
                   start === Hc03Sdk.ATTR_START_RES &&
                   headerCrc === checkEncryHead &&
                   length <= Hc03Sdk.FULL_PACKAGE_MAX_DATA_SIZE;
    
    const isHead = isFull ||
                   (!isFull &&
                    btEdition === Hc03Sdk.BT_EDITION &&
                    start === Hc03Sdk.ATTR_START_RES &&
                    headerCrc === checkEncryHead);
    
    const isTail = isFull || (!isFull && !isHead);
    
    let data: Uint8Array | null = null;
    
    if (isFull) {
      // Full packet - validate tail CRC and END marker
      const tailCrcIndex = Hc03Sdk.PACKAGE_INDEX_CONTENT + length;
      if (rawData.length < tailCrcIndex + 3) {  // Need space for CRC(2) + END(1)
        console.warn('[HC03] Incomplete tail CRC/END');
        return null;
      }
      
      const tailCrc = view.getUint16(tailCrcIndex, true);
      const endMarker = rawData[tailCrcIndex + 2];
      
      // Validate END marker
      if (endMarker !== Hc03Sdk.ATTR_END) {
        console.warn(`[HC03] Invalid END marker: expected 0x03, got 0x${endMarker.toString(16)}`);
        return null;
      }
      
      // Compute CRC over [START ... CONTENT] (excluding CRC and END)
      const tailBytes = rawData.slice(Hc03Sdk.PACKAGE_INDEX_START, tailCrcIndex);
      const checkEncryTail = this.encryTail(tailBytes);
      
      if (tailCrc !== checkEncryTail) {
        console.warn(`[HC03] Invalid tail CRC: expected 0x${checkEncryTail.toString(16)}, got 0x${tailCrc.toString(16)}`);
        return null;
      }
      
      data = rawData.slice(Hc03Sdk.PACKAGE_INDEX_CONTENT, Hc03Sdk.PACKAGE_INDEX_CONTENT + length);
      
    } else if (isHead) {
      // Head packet - cache for multi-packet reconstruction
      this.cacheData = [];
      this.cacheType = type;
      
      const headContent = rawData.slice(Hc03Sdk.PACKAGE_INDEX_CONTENT);
      for (let i = 0; i < headContent.length; i++) {
        this.cacheData.push(headContent[i]);
      }
      
      console.log(`[HC03] Head packet cached: type=0x${type.toString(16)}, length=${this.cacheData.length}`);
      return null;
      
    } else if (isTail) {
      // Tail packet - reconstruct from cache
      if (this.cacheData.length === 0) {
        console.warn('Tail packet received but no head cached');
        return null;
      }
      
      // Extract tail content (strip last 3 bytes: CRC(2) + END(1))
      const tailContent = rawData.slice(0, rawData.length - 3);
      for (let i = 0; i < tailContent.length; i++) {
        this.cacheData.push(tailContent[i]);
      }
      
      // Use type from cached head
      type = this.cacheType;
      length = this.cacheData.length;
      
      // Validate END marker
      const endMarker = rawData[rawData.length - 1];
      if (endMarker !== Hc03Sdk.ATTR_END) {
        console.warn(`[HC03] Invalid END marker in tail: expected 0x03, got 0x${endMarker.toString(16)}`);
        this.cacheData = [];
        return null;
      }
      
      // Get tail CRC (last 2 bytes before END marker)
      const tailCrc = view.getUint16(rawData.length - 3, true);
      
      // Build complete frame for CRC validation: [HEAD(6 bytes) + CONTENT]
      const completeFrame = new Uint8Array(6 + this.cacheData.length);
      completeFrame[0] = Hc03Sdk.ATTR_START_RES;
      completeFrame[1] = length & 0xFF;
      completeFrame[2] = (length >> 8) & 0xFF;
      completeFrame[3] = Hc03Sdk.BT_EDITION;
      completeFrame[4] = type;
      completeFrame[5] = this.encryHead(completeFrame.slice(0, 5));
      completeFrame.set(this.cacheData, 6);
      
      // Compute CRC over reconstructed packet (excluding CRC and END)
      const checkEncryTail = this.encryTail(completeFrame);
      
      if (tailCrc !== checkEncryTail) {
        console.warn(`[HC03] Invalid tail CRC: expected=0x${checkEncryTail.toString(16)}, got=0x${tailCrc.toString(16)}`);
        this.cacheData = [];
        return null;
      }
      
      data = new Uint8Array(this.cacheData);
      this.cacheData = [];
      
      console.log(`[HC03] Multi-packet reconstructed: type=0x${type.toString(16)}, length=${data.length}`);
    }
    
    if (data) {
      return { type, data };
    }
    
    return null;
  }

  // XOR checksum for header (matching native plugin)
  private encryHead(data: Uint8Array): number {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
    }
    return crc & 0xFF;
  }

  // CRC16 variant for tail (matching native plugin)
  private encryTail(data: Uint8Array): number {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= (data[i] & 0xFF);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x0001) !== 0) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc = crc >> 1;
        }
      }
    }
    return crc & 0xFFFF;
  }

  // Route data to appropriate parser based on HC03 type
  private routeData(type: number, data: Uint8Array): void {
    switch (type) {
      case Hc03Sdk.RESPONSE_CHECK_BATTERY:
        this.parseBatteryData(data);
        break;
      case Hc03Sdk.BT_RES_TYPE:
        this.parseTemperatureData(data);
        break;
      case Hc03Sdk.BG_RES_TYPE:
        this.parseBloodGlucoseData(data);
        break;
      case Hc03Sdk.OX_RES_TYPE_NORMAL:
        this.parseBloodOxygenData(data);
        break;
      case Hc03Sdk.BP_RES_TYPE:
        this.parseBloodPressureData(data);
        break;
      default:
        console.log(`[HC03] Unknown type: 0x${type.toString(16)}`);
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
    const isActuallyConnected = this.device?.gatt?.connected === true;
    const isMarkedConnected = this.isConnected;
    
    // Sync internal state with actual connection state
    if (isMarkedConnected && !isActuallyConnected) {
      console.warn('Device marked as connected but GATT is disconnected, fixing state');
      this.isConnected = false;
    }
    
    return isActuallyConnected && isMarkedConnected;
  }

  // Check if device is connected (alias for getConnectionStatus for API consistency)
  public isDeviceConnected(): boolean {
    return this.getConnectionStatus();
  }

  // Get active detections
  public getActiveDetections(): Detection[] {
    return Array.from(this.activeDetections);
  }

  // ECG Data Parsing (handled by NeuroSky native SDK, not via HC03 protocol)
  private parseECGData(data: Uint8Array): void {
    // Note: ECG is handled separately by NeuroSky SDK via native plugin
    // This method is a placeholder for potential future direct HC03 ECG protocol
    console.log('[HC03] ECG data received (processed by NeuroSky SDK)');
  }

  // Blood Oxygen Data Parsing (from Flutter SDK oxEngine.dart)
  private parseBloodOxygenData(data: Uint8Array): void {
    try {
      if (data.length < 30) {
        console.warn('[HC03] Blood oxygen data incomplete:', data.length);
        return;
      }
      
      // Resolve wave data (30 bytes -> 10 values, 3 bytes each as 24-bit)
      // Note: Flutter SDK's Calculate class computes SpO2 and HR from these waveforms
      const waveData: number[] = [];
      for (let i = 0; i < 30; i += 3) {
        const first = (data[i] & 0xFF) << 16;
        const second = (data[i + 1] & 0xFF) << 8;
        const third = data[i + 2] & 0xFF;
        waveData.push(first + second + third);
      }
      
      // SpO2 and HR are calculated from wave data by signal processing algorithms
      // For now, emit wave data and let UI/Calculate module process it
      const bloodOxygenData: BloodOxygenData = {
        bloodOxygen: 0, // Calculated from waveData by signal processing
        heartRate: 0,   // Calculated from waveData by signal processing
        fingerDetection: true,
        bloodOxygenWaveData: waveData
      };
      
      // Store latest data for getter methods
      this.latestBloodOxygenData = bloodOxygenData;
      
      console.log('[HC03] Blood Oxygen wave data:', waveData.length, 'samples');
      
      const callback = this.callbacks.get(Detection.OX);
      if (callback) {
        callback({ type: 'data', detection: Detection.OX, data: bloodOxygenData });
      }
    } catch (error) {
      console.error('Error parsing blood oxygen data:', error);
    }
  }

  // Blood Pressure Data Parsing (from Flutter SDK bpEngine.dart)
  private parseBloodPressureData(data: Uint8Array): void {
    try {
      if (data.length < 2) {
        console.warn('[HC03] Blood pressure data too short');
        return;
      }
      
      const contentType = data[0] & 0xFF;
      const BP_RES_CONTENT_PRESSURE_DATA = 0x03;
      
      if (contentType === BP_RES_CONTENT_PRESSURE_DATA) {
        if (data.length >= 7) {
          // Little-endian 16-bit values
          const systolic = (data[1] & 0xFF) | ((data[2] & 0xFF) << 8);
          const diastolic = (data[3] & 0xFF) | ((data[4] & 0xFF) << 8);
          const heartRate = (data[5] & 0xFF) | ((data[6] & 0xFF) << 8);
          
          const bloodPressureData: BloodPressureData = {
            ps: systolic,
            pd: diastolic,
            hr: heartRate
          };
          
          // Store latest data for getter methods
          this.latestBloodPressureData = bloodPressureData;
          
          console.log('[HC03] Blood Pressure:', `${systolic}/${diastolic} mmHg, HR: ${heartRate} bpm`);
          
          const callback = this.callbacks.get(Detection.BP);
          if (callback) {
            callback({ type: 'data', detection: Detection.BP, data: bloodPressureData });
          }
        }
      } else {
        console.log('[HC03] BP calibration/setup data received, type:', contentType);
      }
    } catch (error) {
      console.error('Error parsing blood pressure data:', error);
    }
  }

  // Blood Glucose Data Parsing (from Flutter SDK bloodglucose.dart)
  private parseBloodGlucoseData(data: Uint8Array): void {
    try {
      if (data.length < 2) {
        console.warn('[HC03] Blood glucose data too short');
        return;
      }
      
      // Big-endian 16-bit value, divide by 10
      const glucoseRaw = ((data[0] & 0xFF) << 8) | (data[1] & 0xFF);
      const glucose = glucoseRaw / 10.0;
      
      const bloodGlucoseData: BloodGlucoseData = {
        bloodGlucoseSendData: { rawValue: glucoseRaw },
        bloodGlucosePaperState: 'complete',
        bloodGlucosePaperData: glucose
      };
      
      // Store latest data for getter methods
      this.latestBloodGlucoseData = bloodGlucoseData;
      
      console.log('[HC03] Blood Glucose:', glucose, 'mmol/L');
      
      const callback = this.callbacks.get(Detection.BG);
      if (callback) {
        callback({ type: 'data', detection: Detection.BG, data: bloodGlucoseData });
      }
    } catch (error) {
      console.error('Error parsing blood glucose data:', error);
    }
  }

  // Temperature Data Parsing (from Flutter SDK Temperature.dart)
  private parseTemperatureData(data: Uint8Array): void {
    try {
      if (data.length < 4) {
        console.warn('[HC03] Temperature data too short');
        return;
      }
      
      // Little-endian 16-bit values
      const temperatureBdF = ((data[1] & 0xFF) << 8) | (data[0] & 0xFF);
      const temperatureEvF = ((data[3] & 0xFF) << 8) | (data[2] & 0xFF);
      
      // Convert to Celsius
      const tempBT = temperatureBdF * 0.02 - 273.15;
      const tempET = temperatureEvF * 0.02 - 273.15;
      
      // Apply body temperature calculation
      const bodyTemp = tempBT + (tempET / 100.0);
      const roundedTemp = Math.round(bodyTemp * 10) / 10.0;
      
      const temperatureData: TemperatureData = {
        temperature: roundedTemp
      };
      
      // Store latest data for getter methods
      this.latestTemperatureData = temperatureData;
      
      console.log('[HC03] Temperature:', roundedTemp, '°C');
      
      const callback = this.callbacks.get(Detection.BT);
      if (callback) {
        callback({ type: 'data', detection: Detection.BT, data: temperatureData });
      }
    } catch (error) {
      console.error('Error parsing temperature data:', error);
    }
  }

  // Battery Data Parsing (from Flutter SDK battery.dart)
  private parseBatteryData(data: Uint8Array): void {
    try {
      if (data.length < 3) {
        console.warn('[HC03] Battery data too short');
        return;
      }
      
      const status = data[0] & 0xFF;
      const BATTERY_QUERY = 0x00;
      const BATTERY_CHARGING = 0x01;
      const BATTERY_FULLY = 0x02;
      
      let batteryData: BatteryData;
      
      switch (status) {
        case BATTERY_QUERY:
          // Calculate battery level from voltage
          const batteryValue = ((data[1] & 0xFF) << 8) | (data[2] & 0xFF);
          const level = this.getBatteryLevel(batteryValue);
          
          batteryData = {
            batteryLevel: level,
            chargingStatus: false
          };
          break;
          
        case BATTERY_CHARGING:
          batteryData = {
            batteryLevel: this.latestBatteryData?.batteryLevel || 50,
            chargingStatus: true
          };
          break;
          
        case BATTERY_FULLY:
          batteryData = {
            batteryLevel: 100,
            chargingStatus: false
          };
          break;
          
        default:
          console.warn('[HC03] Unknown battery status:', status);
          return;
      }
      
      // Store latest data for getter methods
      this.latestBatteryData = batteryData;
      
      console.log('[HC03] Battery:', batteryData.batteryLevel + '%', batteryData.chargingStatus ? '(charging)' : '');
      
      const callback = this.callbacks.get(Detection.BATTERY);
      if (callback) {
        callback({ type: 'data', detection: Detection.BATTERY, data: batteryData });
      }
    } catch (error) {
      console.error('Error parsing battery data:', error);
    }
  }

  // Calculate battery level from voltage (from Flutter SDK)
  private getBatteryLevel(d: number): number {
    const data = Math.floor((d / 8191.0) * 3.3 * 3 * 1000);
    
    if (data >= 4090) return 100;
    else if (data >= 4070) return 99;
    else if (data >= 4056) return 97;
    else if (data >= 4040) return 95;
    else if (data >= 4028) return 93;
    else if (data >= 4000) return 91;
    else if (data >= 3980) return 86;
    else if (data >= 3972) return 83;
    else if (data >= 3944) return 78;
    else if (data >= 3916) return 73;
    else if (data >= 3888) return 69;
    else if (data >= 3860) return 65;
    else if (data >= 3832) return 61;
    else if (data >= 3804) return 56;
    else if (data >= 3776) return 50;
    else if (data >= 3748) return 42;
    else if (data >= 3720) return 30;
    else if (data >= 3692) return 19;
    else if (data >= 3664) return 15;
    else if (data >= 3636) return 11;
    else if (data >= 3608) return 8;
    else if (data >= 3580) return 7;
    else if (data >= 3524) return 6;
    else if (data >= 3468) return 5;
    else if (data >= 3300) return 4;
    return 0;
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

  // Get mood index text representation as per HC03 Flutter SDK API Guide
  public getMoodText(moodIndex: number): string {
    if (moodIndex >= 1 && moodIndex <= 20) return 'chill';
    if (moodIndex >= 21 && moodIndex <= 40) return 'relax';
    if (moodIndex >= 41 && moodIndex <= 60) return 'balance';
    if (moodIndex >= 61 && moodIndex <= 80) return 'excitation';
    if (moodIndex >= 81 && moodIndex <= 100) return 'excitement/anxiety/excitement';
    return 'unknown';
  }

  // Check if device supports a specific detection type
  public supportsDetection(detection: Detection): boolean {
    return Object.keys(DETECTION_COMMANDS).includes(detection);
  }

  // Get device information
  public getDeviceInfo(): { name?: string; id: string; connected: boolean; gattConnected?: boolean; activeDetections?: Detection[] } | null {
    if (!this.device) return null;
    
    return {
      name: this.device.name,
      id: this.device.id,
      connected: this.getConnectionStatus(),
      gattConnected: this.device.gatt?.connected || false,
      activeDetections: Array.from(this.activeDetections)
    };
  }
  
  // Check if device is available (for handling 'already open' issues)
  public async isDeviceAvailable(): Promise<boolean> {
    try {
      // Try to get already paired devices if supported
      if ('getDevices' in navigator.bluetooth) {
        const devices = await (navigator.bluetooth as any).getDevices();
        const hc03Device = devices.find((device: any) => 
          device.name?.toLowerCase().includes('hc03') || 
          device.name?.toLowerCase().includes('health')
        );
        
        if (hc03Device) {
          console.log('Found previously paired HC03 device:', hc03Device.name);
          return !hc03Device.gatt?.connected; // Available if not connected
        }
      }
      
      return true; // No paired device found or method not supported, assume available
    } catch (error) {
      console.warn('Unable to check device availability:', error);
      return true; // Assume available if we can't check
    }
  }
  
  // Getter methods as per Flutter SDK API Guide
  
  /**
   * Get latest ECG data - getEcgData equivalent from Flutter SDK
   */
  public getEcgData(): ECGData | null {
    return this.latestEcgData;
  }
  
  /**
   * Get latest blood oxygen data 
   */
  public getBloodOxygenData(): BloodOxygenData | null {
    return this.latestBloodOxygenData;
  }
  
  /**
   * Get latest blood pressure data
   */
  public getBloodPressureData(): BloodPressureData | null {
    return this.latestBloodPressureData;
  }
  
  /**
   * Get latest blood glucose data
   */
  public getBloodGlucoseData(): BloodGlucoseData | null {
    return this.latestBloodGlucoseData;
  }
  
  /**
   * Get latest temperature data
   */
  public getTemperatureData(): TemperatureData | null {
    return this.latestTemperatureData;
  }
  
  /**
   * Get latest battery data
   */
  public getBatteryData(): BatteryData | null {
    return this.latestBatteryData;
  }
}

// ============================================================================
// EVENT NAMES FOR CAPACITOR PLUGIN COMMUNICATION
// ============================================================================

/**
 * Event constants for native Capacitor plugin communication
 * These match the event names emitted by HC03BluetoothPlugin (Android/iOS)
 */
export const HC03_EVENTS = {
  // ECG Events
  ECG_WAVE: 'hc03:ecg:wave',
  ECG_METRICS: 'hc03:ecg:metrics',
  
  // Blood Oxygen Events
  BLOOD_OXYGEN_DATA: 'hc03:bloodoxygen:data',
  BLOOD_OXYGEN_WAVE: 'hc03:bloodoxygen:wave',
  
  // Blood Glucose Events
  BLOOD_GLUCOSE_SEND: 'hc03:bloodglucose:send',
  BLOOD_GLUCOSE_PAPER_STATE: 'hc03:bloodglucose:paperstate',
  BLOOD_GLUCOSE_RESULT: 'hc03:bloodglucose:result',
  
  // Blood Pressure Events
  BLOOD_PRESSURE_SEND: 'hc03:bloodpressure:send',
  BLOOD_PRESSURE_PROCESS: 'hc03:bloodpressure:process',
  BLOOD_PRESSURE_RESULT: 'hc03:bloodpressure:result',
  
  // Battery Events
  BATTERY_LEVEL: 'hc03:battery:level',
  BATTERY_CHARGING: 'hc03:battery:charging',
  
  // Body Temperature Events
  BODY_TEMPERATURE_DATA: 'hc03:temperature:data',
  
  // Connection Events
  DEVICE_CONNECTED: 'hc03:device:connected',
  DEVICE_DISCONNECTED: 'hc03:device:disconnected',
  
  // Error Events
  ERROR: 'hc03:error'
} as const;

// Export singleton instance
export const hc03Sdk = Hc03Sdk.getInstance();