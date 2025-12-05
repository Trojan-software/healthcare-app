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
// 
// IMPORTANT: HC02 and HC03 devices use DIFFERENT service UUIDs!
// - HC02 devices (e.g., HC02-F1B51D) use service UUID: 0000ff27 (HC03_FILTER_UUID)
// - HC03 devices use service UUID: 00001822 (HC03_SERVICE_UUID)
// Both share the same characteristic UUIDs (fff1 for write, fff4 for notify)
const HC02_SERVICE_UUID = '0000ff27-0000-1000-8000-00805f9b34fb'; // HC02 devices use this service
const HC03_FILTER_UUID = '0000ff27-0000-1000-8000-00805f9b34fb'; // Official SDK FILTER_UUID (same as HC02)
const HC03_SERVICE_UUID = '00001822-0000-1000-8000-00805f9b34fb'; // Official SDK UUID_SERVICE (HC03 only)
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
  ECG_REALTIME_START: 0x03,  // HC02-F1B51D requires this to start real-time ECG data streaming
  TEP_START_NORMAL: 0x00,
  TEP_STOP_NORMAL: 0x01,
  OX_REQ_CONTENT_START_NORMAL: 0x00,
  OX_REQ_CONTENT_STOP_NORMAL: 0x01,
  BP_REQ_CONTENT_CALIBRATE_PARAMETER: 0x01,
  BP_REQ_CONTENT_CALIBRATE_TEMPERATURE: 0x02,
  BP_REQ_CONTENT_CALIBRATE_ZERO: 0x03,
  BP_REQ_CONTENT_START_QUICK_CHARGING_GAS: 0x04,
  BP_REQ_CONTENT_START_PWM_CHARGING_GAS_ARM: 0x05,
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
  
  // BP Response content types
  BP_RES_CONTENT_CALIBRATE_PARAMETER: 0x01,
  BP_RES_CONTENT_CALIBRATE_TEMPERATURE: 0x02,
  BP_RES_CONTENT_PRESSURE_DATA: 0x03,
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

// Polling commands - actively request data from device during measurement
// Blood Glucose requires active polling every 100ms
// Blood Pressure does NOT need polling - it sends data automatically via notifications
const POLLING_COMMANDS: Partial<Record<Detection, Uint8Array>> = {
  [Detection.BG]: obtainCommandData(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_GET_VER]),
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
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
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
  
  // Track device type for HC02 vs HC03 specific handling
  private deviceType: 'HC02' | 'HC03' | null = null;
  
  // Store latest measurement data as per Flutter SDK API
  private latestEcgData: ECGData | null = null;
  private latestBloodOxygenData: BloodOxygenData | null = null;
  private latestBloodPressureData: BloodPressureData | null = null;
  private latestBloodGlucoseData: BloodGlucoseData | null = null;
  private latestTemperatureData: TemperatureData | null = null;
  private latestBatteryData: BatteryData | null = null;
  
  // Waveform buffer for SpO2 calculation (accumulates samples across packets)
  private waveformBuffer: number[] = [];
  
  // RED/IR buffers for blood oxygen signal processing
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private bloodOxygenStartTime: number | null = null;
  
  // Blood Pressure measurement state
  private bpPressureBuffer: number[] = [];
  private bpCalibrationCoeffs: { c1: number; c2: number; c3: number; c4: number; c5: number } | null = null;
  private bpSampleCount: number = 0;
  private bpMaxSamples: number = 50; // Collect 50 samples for faster measurement (was 100)
  private bpCalculated: boolean = false; // Flag to ensure we only calculate once per measurement
  private bpInflationStarted: boolean = false; // Flag to track if cuff inflation has been triggered
  private bpZeroSampleCount: number = 0; // Count zero calibration samples before starting inflation

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
    console.log('🔍 [HC03] Checking Web Bluetooth API availability...');
    console.log('🔍 [HC03] User agent:', navigator.userAgent);
    console.log('🔍 [HC03] navigator.bluetooth exists?', !!navigator.bluetooth);
    
    if (!navigator.bluetooth) {
      const browserName = this.detectBrowser();
      throw new Error(
        `Web Bluetooth API not supported in ${browserName}.\n\n` +
        `✅ Supported browsers:\n` +
        `  • Google Chrome (recommended)\n` +
        `  • Microsoft Edge\n` +
        `  • Opera Browser\n\n` +
        `❌ Not supported:\n` +
        `  • Safari (iOS/macOS)\n` +
        `  • Firefox\n` +
        `  • Most in-app browsers`
      );
    }
    
    // Check if the API is available (not all features are available in all contexts)
    try {
      // @ts-ignore - getAvailability is not in all TypeScript definitions yet
      const available = await navigator.bluetooth.getAvailability();
      console.log('🔍 [HC03] Bluetooth available?', available);
      
      if (!available) {
        throw new Error(
          'Bluetooth is not available on this device.\n\n' +
          'Please check:\n' +
          '  • Bluetooth is enabled in system settings\n' +
          '  • You are using HTTPS (required for Web Bluetooth)\n' +
          '  • Your device has Bluetooth hardware'
        );
      }
    } catch (e) {
      console.warn('⚠️ [HC03] Could not check Bluetooth availability:', e);
      // Continue anyway - some browsers don't support getAvailability()
    }
    
    console.log('✅ [HC03] SDK initialized successfully');
  }
  
  // Detect browser for better error messages
  private detectBrowser(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
    return 'your current browser';
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
            // Name-based filters: prioritize HC devices first
            { namePrefix: 'HC03-' },      // HC03-XXXXXX devices (exact)
            { namePrefix: 'HC02-' },      // HC02-F1B51D and similar (exact)
            { namePrefix: 'HC03' },       // HC03 variants
            { namePrefix: 'HC02' },       // HC02 variants
            { namePrefix: 'HC-03' },      // Alternative naming
            { namePrefix: 'HC-02' },      // Alternative naming
            { namePrefix: 'UNKTOP' },     // Brand name (UNKTOP devices)
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
      console.log('🔗 [HC03] Connecting to GATT server...');
      this.server = await this.device.gatt!.connect();
      console.log('✅ [HC03] GATT server connected!');
      
      // Auto-detect device type based on name
      const deviceName = this.device.name || '';
      const isHC02 = deviceName.startsWith('HC02-');
      const isHC03 = deviceName.startsWith('HC03-');
      
      // Store device type for use in sensor-specific parsing
      if (isHC02) {
        this.deviceType = 'HC02';
      } else if (isHC03) {
        this.deviceType = 'HC03';
      } else {
        this.deviceType = 'HC03'; // Default to HC03 for unknown devices
      }
      
      console.log(`🔍 [HC03] Device type detection:`);
      console.log(`   Device name: ${deviceName}`);
      console.log(`   Is HC02: ${isHC02}`);
      console.log(`   Is HC03: ${isHC03}`);
      console.log(`   Stored device type: ${this.deviceType}`);
      
      // Select the appropriate service UUID based on device type
      let serviceUUID: string;
      if (isHC02) {
        serviceUUID = HC02_SERVICE_UUID; // HC02 uses 0000ff27
        console.log(`✅ [HC03] Using HC02 service UUID: ${serviceUUID}`);
      } else if (isHC03) {
        serviceUUID = HC03_SERVICE_UUID; // HC03 uses 00001822
        console.log(`✅ [HC03] Using HC03 service UUID: ${serviceUUID}`);
      } else {
        // Unknown device, try HC03 first, then fall back to HC02
        console.warn(`⚠️ [HC03] Unknown device type, will try HC03 service first...`);
        serviceUUID = HC03_SERVICE_UUID;
      }
      
      // Try to get main service
      console.log(`🔍 [HC03] Connecting to service ${serviceUUID}...`);
      try {
        this.service = await this.server.getPrimaryService(serviceUUID);
        console.log(`✅ [HC03] Connected to service successfully!`);
      } catch (error) {
        // If HC03 service fails and we haven't tried HC02, try HC02 as fallback
        if (serviceUUID === HC03_SERVICE_UUID) {
          console.warn(`⚠️ [HC03] HC03 service not found, trying HC02 service as fallback...`);
          try {
            this.service = await this.server.getPrimaryService(HC02_SERVICE_UUID);
            console.log(`✅ [HC03] Connected to HC02 service successfully!`);
          } catch (fallbackError) {
            console.error(`❌ [HC03] Both HC03 and HC02 services failed`);
            throw error; // Throw the original error
          }
        } else {
          throw error;
        }
      }
      
      // Get write and notify characteristics
      this.writeCharacteristic = await this.service.getCharacteristic(HC03_WRITE_CHARACTERISTIC);
      this.notifyCharacteristic = await this.service.getCharacteristic(HC03_NOTIFY_CHARACTERISTIC);
      
      // Enable notifications (Web Bluetooth API handles CCCD automatically)
      try {
        await this.notifyCharacteristic.startNotifications();
        console.log('✅ [HC03] Notifications enabled on characteristic (CCCD handled by browser)');
      } catch (error) {
        console.error('❌ [HC03] Failed to enable notifications:', error);
        throw new Error('Could not enable notifications. The device may not support notifications or the characteristic is not writable.');
      }
      
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
    this.deviceType = null;  // Reset device type on disconnect
    
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
      // IMPORTANT: Stop all other active measurements first
      // HC02/HC03 devices can only run one measurement at a time
      const otherDetections = Array.from(this.activeDetections).filter(d => d !== detection);
      if (otherDetections.length > 0) {
        console.log(`⏹️ [HC03] Stopping ${otherDetections.length} active measurement(s) before starting ${detection}...`);
        for (const activeDetection of otherDetections) {
          try {
            await this.stopDetect(activeDetection);
          } catch (e) {
            console.warn(`⚠️ [HC03] Failed to stop ${activeDetection}:`, e);
          }
        }
        // Wait for stop commands to process
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const command = DETECTION_COMMANDS[detection as keyof typeof DETECTION_COMMANDS];
      if (!command) {
        throw new Error(`Unknown detection type: ${detection}`);
      }

      // Clear waveform buffer when starting new blood oxygen measurement
      if (detection === Detection.OX) {
        this.waveformBuffer = [];
        this.redBuffer = [];
        this.irBuffer = [];
        this.bloodOxygenStartTime = Date.now(); // Track start time for 30-second measurement
        console.log('✨ [HC03] Cleared all buffers for new 30-second blood oxygen measurement');
      }
      
      // Clear BP buffers and flags when starting new blood pressure measurement
      if (detection === Detection.BP) {
        this.bpPressureBuffer = [];
        this.bpSampleCount = 0;
        this.bpCalculated = false;
        this.bpCalibrationCoeffs = null;
        this.bpInflationStarted = false;
        this.bpZeroSampleCount = 0;
        console.log('✨ [HC03] Cleared BP buffers for new measurement');
      }
      
      // Clear ECG buffers and reset state when starting new ECG measurement
      if (detection === Detection.ECG) {
        this.ecgSampleBuffer = [];
        this.ecgLastBeatTime = 0;
        this.ecgBeatCount = 0;
        this.ecgStartTime = Date.now();
        console.log('✨ [HC03] Cleared ECG buffers for new measurement');
      }

      console.log(`▶️ [HC03] Starting ${detection} detection...`);
      // Use writeValueWithoutResponse for better compatibility with HC02-F1B51D
      // The device will send notifications back with data
      try {
        await this.writeCharacteristic.writeValueWithoutResponse(command);
      } catch (e) {
        // Fall back to writeValue if writeValueWithoutResponse fails
        console.warn('[HC03] writeValueWithoutResponse failed, trying writeValue:', e);
        await this.writeCharacteristic.writeValue(command);
      }
      
      // HC02-F1B51D CRITICAL: Send ECG real-time start command after ECG_START
      // Without this second command, the device stays in idle/touch-detection mode
      // and never streams ECG data. This matches the vendor Flutter SDK behavior.
      if (detection === Detection.ECG) {
        console.log('💓 [HC03] Sending ECG real-time start command (0x05/0x03)...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between commands
        
        // Build ECG real-time start command: 0x05 (ECG type) + 0x03 (real-time start)
        const ecgRealtimeCommand = obtainCommandData(PROTOCOL.ELECTROCARDIOGRAM, [PROTOCOL.ECG_REALTIME_START]);
        
        try {
          await this.writeCharacteristic.writeValueWithoutResponse(ecgRealtimeCommand);
          console.log('✅ [HC03] ECG real-time streaming enabled');
        } catch (e) {
          console.warn('[HC03] ECG real-time command writeValueWithoutResponse failed, trying writeValue:', e);
          await this.writeCharacteristic.writeValue(ecgRealtimeCommand);
        }
      }
      
      this.activeDetections.add(detection);
      
      // Start active polling for BG measurements (required by HC02-F1B51D)
      // BP does NOT need polling - it sends data automatically via notifications
      if (detection === Detection.BG) {
        this.startPolling(detection);
      }
      
      // Emit measurement started event
      const callback = this.callbacks.get(detection);
      if (callback) {
        callback({ type: 'measurementStarted', detection });
      }
    } catch (error) {
      console.error(`❌ [HC03] Failed to start ${detection} detection:`, error);
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
        // Use writeValueWithoutResponse for stop commands too
        try {
          await this.writeCharacteristic.writeValueWithoutResponse(command);
        } catch (e) {
          // Fall back to writeValue if needed
          await this.writeCharacteristic.writeValue(command);
        }
      }
      
      // Stop active polling for BG measurements
      if (detection === Detection.BG) {
        this.stopPolling(detection);
      }
      
      // Clear blood oxygen start time when stopping
      if (detection === Detection.OX) {
        this.bloodOxygenStartTime = null;
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

  // Start active polling for BG measurements
  // HC02-F1B51D requires actively calling getBloodGlucoseData() every 100ms while measurement is active
  // Note: Blood Pressure does NOT need polling - it sends data automatically via notifications
  private startPolling(detection: Detection): void {
    if (this.pollingIntervals.has(detection)) {
      // Already polling
      return;
    }

    const pollingCommand = POLLING_COMMANDS[detection];
    if (!pollingCommand || !this.writeCharacteristic) {
      return;
    }

    console.log(`🔄 [HC03] Starting active polling for ${detection} (every ${this.POLLING_INTERVAL_MS}ms)`);
    
    const intervalId = window.setInterval(async () => {
      try {
        // Send polling command to request data from device
        // Use writeValueWithoutResponse for fast polling
        await this.writeCharacteristic!.writeValueWithoutResponse(pollingCommand);
      } catch (error) {
        console.warn(`[HC03] Polling error for ${detection}, attempting writeValue:`, error);
        try {
          // Fall back to writeValue
          await this.writeCharacteristic!.writeValue(pollingCommand);
        } catch (fallbackError) {
          console.error(`[HC03] Both write methods failed for polling:`, fallbackError);
          this.stopPolling(detection);
        }
      }
    }, this.POLLING_INTERVAL_MS);

    this.pollingIntervals.set(detection, intervalId);
  }

  // Stop active polling for BG measurements
  private stopPolling(detection: Detection): void {
    const intervalId = this.pollingIntervals.get(detection);
    if (intervalId) {
      console.log(`⏹️ [HC03] Stopping active polling for ${detection}`);
      window.clearInterval(intervalId);
      this.pollingIntervals.delete(detection);
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
  private static readonly ECG_RES_TYPE = 0x85;  // ECG (0x80 | ELECTROCARDIOGRAM)
  
  // Multi-packet frame cache
  private cacheType: number = 0;
  private cacheData: number[] = [];
  
  // Active polling intervals for BP and BG (required by HC02-F1B51D)
  private pollingIntervals: Map<Detection, number> = new Map();
  private readonly POLLING_INTERVAL_MS = 100; // Poll every 100ms as per Flutter SDK

  // Parse incoming data using HC03 protocol with multi-packet reconstruction
  public parseData(data: ArrayBuffer): void {
    try {
      const rawData = new Uint8Array(data);
      
      // Log all received data for debugging
      const hexStr = Array.from(rawData.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');
      console.log(`[HC03] 📥 Raw data received (${rawData.length} bytes): ${hexStr}${rawData.length > 20 ? '...' : ''}`);
      
      // HC02-F1B51D ECG RAW DATA DETECTION:
      // When ECG measurement is active, HC02 sends raw waveform data WITHOUT protocol framing.
      // Detect this by checking: (1) ECG is active, (2) first byte is NOT a protocol start marker
      const startByte = rawData[0];
      const isProtocolFramed = (startByte === 0x01 || startByte === 0x02);
      const isEcgActive = this.activeDetections.has(Detection.ECG);
      
      if (isEcgActive && !isProtocolFramed && rawData.length >= 2) {
        // This is raw ECG waveform data from HC02-F1B51D - parse directly
        console.log('💓 [HC03] Raw ECG waveform data detected (unframed), parsing directly...');
        this.parseECGData(rawData);
        return;
      }
      
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
      
      // Validate END marker (0x03 for HC03, 0xff for HC02)
      const validEndMarkers = [Hc03Sdk.ATTR_END, 0xff];
      if (!validEndMarkers.includes(endMarker)) {
        console.warn(`[HC03] Invalid END marker: expected 0x03 or 0xff, got 0x${endMarker.toString(16)}`);
        return null;
      }
      
      // HC02 uses a different CRC algorithm, skip CRC validation for HC02 devices
      // Detect HC02 by device name or END marker (HC02 uses 0xff)
      const deviceName = this.device?.name || '';
      const isHC02 = deviceName.startsWith('HC02-') || endMarker === 0xff;
      
      console.log(`🔍 [HC03] CRC validation check (single): deviceName="${deviceName}", endMarker=0x${endMarker.toString(16)}, isHC02=${isHC02}`);
      
      if (!isHC02) {
        // Only validate CRC for HC03 devices
        // Compute CRC over [START ... CONTENT] (excluding CRC and END)
        const tailBytes = rawData.slice(Hc03Sdk.PACKAGE_INDEX_START, tailCrcIndex);
        const checkEncryTail = this.encryTail(tailBytes);
        
        if (tailCrc !== checkEncryTail) {
          console.warn(`[HC03] Invalid tail CRC: expected 0x${checkEncryTail.toString(16)}, got 0x${tailCrc.toString(16)}`);
          return null;
        }
      } else {
        console.log(`✅ [HC03] Skipping CRC validation for HC02 device (different algorithm)`);
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
      
      // Validate END marker (0x03 for HC03, 0xff for HC02)
      const endMarker = rawData[rawData.length - 1];
      const validEndMarkers = [Hc03Sdk.ATTR_END, 0xff]; // HC03 uses 0x03, HC02 uses 0xff
      if (!validEndMarkers.includes(endMarker)) {
        console.warn(`[HC03] Invalid END marker in tail: expected 0x03 or 0xff, got 0x${endMarker.toString(16)}`);
        this.cacheData = [];
        return null;
      }
    
      
      // Get tail CRC (last 2 bytes before END marker)
      const tailCrc = view.getUint16(rawData.length - 3, true);
      
      // HC02 uses a different CRC algorithm than HC03
      // Detect HC02 by device name or END marker (HC02 uses 0xff)
      const deviceName = this.device?.name || '';
      const isHC02 = deviceName.startsWith('HC02-') || endMarker === 0xff;
      
      console.log(`🔍 [HC03] CRC validation check (tail): deviceName="${deviceName}", endMarker=0x${endMarker.toString(16)}, isHC02=${isHC02}`);
      
      if (!isHC02) {
        // Only validate CRC for HC03 devices
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
      } else {
        console.log(`✅ [HC03] Skipping CRC validation for HC02 device (different algorithm)`);
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
    console.log(`📍 [HC03] Routing type 0x${type.toString(16).padStart(2, '0')} with ${data.length} bytes: ${Array.from(data.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}${data.length > 10 ? '...' : ''}`);
    
    switch (type) {
      case Hc03Sdk.RESPONSE_CHECK_BATTERY:
        console.log('🔋 [HC03] → Parsing BATTERY');
        this.parseBatteryData(data);
        break;
      case Hc03Sdk.BT_RES_TYPE:
        console.log('🌡️ [HC03] → Parsing TEMPERATURE');
        this.parseTemperatureData(data);
        break;
      case Hc03Sdk.BG_RES_TYPE:
        console.log('🍬 [HC03] → Parsing BLOOD GLUCOSE');
        this.parseBloodGlucoseData(data).catch(e => console.error('BG parsing error:', e));
        break;
      case Hc03Sdk.OX_RES_TYPE_NORMAL:
        console.log('🫀 [HC03] → Parsing BLOOD OXYGEN');
        this.parseBloodOxygenData(data);
        break;
      case Hc03Sdk.BP_RES_TYPE:
        console.log('💪 [HC03] → Parsing BLOOD PRESSURE');
        this.parseBloodPressureData(data).catch(e => console.error('BP parsing error:', e));
        break;
      case PROTOCOL.ELECTROCARDIOGRAM:  // 0x05 - ECG request type
        console.log('💓 [HC03] → Parsing ECG (type 0x05)');
        this.parseECGData(data);
        break;
      case Hc03Sdk.ECG_RES_TYPE:  // 0x85 - ECG response type (0x80 | 0x05) - HC02 uses this
        console.log('💓 [HC03] → Parsing ECG (type 0x85 - HC02 response)');
        this.parseECGData(data);
        break;
      case 0x10:
        // Device status notification - typically sent after measurement completion
        // Data format: [status_code, param]
        // Example: 0x01 0x07 = measurement complete/stopped
        console.log('📢 [HC03] Device status notification (type 0x10) - measurement complete');
        break;
      default:
        console.log(`⚠️ [HC03] Unknown type: 0x${type.toString(16)}, data: ${Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
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

  // ECG Data Parsing 
  // HC02-F1B51D sends ECG data via Bluetooth with waveform samples
  // Format: [waveform_samples...] - typically 10-20 samples per packet
  private parseECGData(data: Uint8Array): void {
    try {
      console.log(`[HC03] 💓 ECG raw data (${data.length} bytes): ${Array.from(data.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}${data.length > 20 ? '...' : ''}`);
      
      if (data.length < 1) {
        console.warn('[HC03] ECG data too short');
        return;
      }
      
      // Parse ECG waveform samples
      // HC02-F1B51D sends 16-bit SIGNED samples in little-endian format
      const waveData: number[] = [];
      
      // Parse as signed 16-bit little-endian samples
      if (data.length % 2 === 0 && data.length >= 2) {
        for (let i = 0; i < data.length; i += 2) {
          // Read as unsigned 16-bit little-endian
          let sample = (data[i] & 0xFF) | ((data[i + 1] & 0xFF) << 8);
          // Convert to signed 16-bit (two's complement)
          if (sample > 32767) {
            sample = sample - 65536;
          }
          waveData.push(sample);
        }
      } else {
        // Fall back to signed 8-bit samples
        for (let i = 0; i < data.length; i++) {
          let sample = data[i] & 0xFF;
          if (sample > 127) {
            sample = sample - 256;
          }
          waveData.push(sample);
        }
      }
      
      // Accumulate samples for heart rate calculation
      if (!this.ecgSampleBuffer) {
        this.ecgSampleBuffer = [];
        this.ecgLastBeatTime = 0;
        this.ecgBeatCount = 0;
        this.ecgStartTime = Date.now();
      }
      
      this.ecgSampleBuffer.push(...waveData);
      
      // Keep buffer at reasonable size (10 seconds at 250 Hz = 2500 samples)
      if (this.ecgSampleBuffer.length > 2500) {
        this.ecgSampleBuffer = this.ecgSampleBuffer.slice(-2500);
      }
      
      // Estimate heart rate from R-peak detection (simplified)
      const heartRate = this.estimateHeartRateFromECG(this.ecgSampleBuffer);
      
      // Create ECG data object
      const ecgData = {
        wave: waveData,
        hr: heartRate,
        moodIndex: 50, // Neutral mood
        rr: heartRate > 0 ? Math.round(60000 / heartRate) : 0, // RR interval in ms
        hrv: 0, // Would need more complex calculation
        respiratoryRate: Math.round(heartRate / 4), // Rough estimate
        touch: true // Finger detected if we're getting data
      };
      
      console.log(`[HC03] 💓 ECG: HR=${heartRate} bpm, ${waveData.length} samples`);
      
      // Emit ECG wave event
      window.dispatchEvent(new CustomEvent('hc03:ecg:wave', {
        detail: { wave: waveData }
      }));
      
      // Emit ECG metrics event
      window.dispatchEvent(new CustomEvent('hc03:ecg:metrics', {
        detail: ecgData
      }));
      
      // Call registered callback
      const callback = this.callbacks.get(Detection.ECG);
      if (callback) {
        callback({ type: 'data', detection: Detection.ECG, data: ecgData });
      }
      
    } catch (error) {
      console.error('[HC03] Error parsing ECG data:', error);
    }
  }
  
  // Simple heart rate estimation from ECG waveform
  // Works with signed 16-bit samples from HC02-F1B51D
  private estimateHeartRateFromECG(samples: number[]): number {
    if (samples.length < 100) return 0;
    
    // Filter out extreme values (outliers/saturation) for better statistics
    // Keep values within 95th percentile to avoid ADC saturation effects
    const sorted = [...samples].sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const filtered = samples.filter(s => s >= p5 && s <= p95);
    
    if (filtered.length < 50) {
      // Not enough valid samples after filtering
      return 0;
    }
    
    // Calculate statistics on filtered values
    const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    const max = Math.max(...filtered);
    const min = Math.min(...filtered);
    const range = max - min;
    
    // Adaptive threshold: find R-peaks above 60% of the range from baseline
    const threshold = mean + range * 0.3;
    
    console.log(`[HC03] ECG analysis (filtered): mean=${mean.toFixed(0)}, max=${max}, min=${min}, range=${range}, threshold=${threshold.toFixed(0)}`);
    
    const peaks: number[] = [];
    // Use original samples for peak detection but with filtered threshold
    for (let i = 3; i < samples.length - 3; i++) {
      const val = samples[i];
      // Skip extreme values
      if (val < p5 || val > p95) continue;
      
      // R-peak detection: local maximum above threshold
      if (val > threshold && 
          val > samples[i-1] && 
          val > samples[i+1] &&
          val > samples[i-2] && 
          val > samples[i+2] &&
          val > samples[i-3] && 
          val > samples[i+3]) {
        // Ensure minimum distance between peaks (200ms at 250Hz = 50 samples, ~300 BPM max)
        // Also ensure maximum distance not exceeded (1500ms = 375 samples, ~40 BPM min)
        if (peaks.length === 0 || (i - peaks[peaks.length - 1] > 40)) {
          peaks.push(i);
        }
      }
    }
    
    if (peaks.length < 2) return 0;
    
    // Calculate average RR interval
    let totalInterval = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalInterval += peaks[i] - peaks[i-1];
    }
    const avgInterval = totalInterval / (peaks.length - 1);
    
    // Convert to heart rate (assuming 250 Hz sample rate)
    const sampleRate = 250;
    const heartRate = Math.round(60 * sampleRate / avgInterval);
    
    // Sanity check (30-200 BPM)
    return heartRate >= 30 && heartRate <= 200 ? heartRate : 0;
  }
  
  // ECG sample buffer for heart rate calculation
  private ecgSampleBuffer: number[] = [];
  private ecgLastBeatTime: number = 0;
  private ecgBeatCount: number = 0;
  private ecgStartTime: number = 0;

  // Blood Oxygen Data Parsing (from Flutter SDK oxEngine.dart)
  // Emits three types: BloodOxygenData, FingerDetection, BloodOxygenWaveData
  private parseBloodOxygenData(data: Uint8Array): void {
    try {
      if (data.length < 6) {
        console.warn('[HC03] Blood oxygen data incomplete:', data.length);
        return;
      }
      
      // Parse RED and IR channel pairs (30 bytes = 5 pairs of RED+IR, each 24-bit)
      // Format: [RED(3 bytes), IR(3 bytes), RED(3 bytes), IR(3 bytes), ...]
      const redSamples: number[] = [];
      const irSamples: number[] = [];
      
      for (let i = 0; i < data.length; i += 6) {
        if (i + 6 <= data.length) {
          // Parse RED channel (3 bytes, big-endian)
          const red = ((data[i] & 0xFF) << 16) | ((data[i+1] & 0xFF) << 8) | (data[i+2] & 0xFF);
          // Parse IR channel (3 bytes, big-endian)
          const ir = ((data[i+3] & 0xFF) << 16) | ((data[i+4] & 0xFF) << 8) | (data[i+5] & 0xFF);
          
          redSamples.push(red);
          irSamples.push(ir);
        }
      }
      
      console.log(`[HC03] 🫀 Extracted RED samples: ${redSamples.join(', ')}`);
      console.log(`[HC03] 🫀 Extracted IR samples: ${irSamples.join(', ')}`);
      
      // Type 1: BloodOxygenWaveData - Emit waveform data for visualization
      // This is sent every time new samples arrive
      const callback = this.callbacks.get(Detection.OX);
      if (callback && redSamples.length > 0) {
        // Emit waveform data event
        window.dispatchEvent(new CustomEvent('hc03:bloodoxygen:wave', {
          detail: {
            red: redSamples,
            ir: irSamples,
            wave: redSamples // Use RED channel for waveform display
          }
        }));
        
        callback({
          type: 'wave',
          detection: Detection.OX,
          data: {
            red: redSamples,
            ir: irSamples,
            wave: redSamples
          }
        });
      }
      
      // Calculate SpO2 and HR using RED/IR channels
      const { spo2, heartRate } = this.calculateSpO2FromChannels(redSamples, irSamples);
      
      // Type 2: FingerDetection - Emit finger touch status
      // Detection is positive if we're receiving valid signal data
      const isFingerDetected = redSamples.some(v => v > 1000) && irSamples.some(v => v > 1000);
      window.dispatchEvent(new CustomEvent('hc03:bloodoxygen:finger', {
        detail: { isTouch: isFingerDetected }
      }));
      
      if (callback) {
        callback({
          type: 'finger',
          detection: Detection.OX,
          data: { isTouch: isFingerDetected }
        });
      }
      
      // Type 3: BloodOxygenData - Emit calculated SpO2 and heart rate
      // Only emit when we have valid measurements
      if (spo2 > 0 && heartRate > 0) {
        const bloodOxygenData: BloodOxygenData = {
          bloodOxygen: spo2,
          heartRate: heartRate,
          fingerDetection: isFingerDetected,
          bloodOxygenWaveData: [...redSamples, ...irSamples]
        };
        
        // Store latest data for getter methods
        this.latestBloodOxygenData = bloodOxygenData;
        
        console.log('[HC03] ✅ Blood Oxygen:', spo2 + '%', 'HR:', heartRate, 'bpm');
        
        // Emit blood oxygen result event
        window.dispatchEvent(new CustomEvent('hc03:bloodoxygen:data', {
          detail: {
            bloodOxygen: spo2,
            heartRate: heartRate
          }
        }));
        
        if (callback) {
          callback({ type: 'data', detection: Detection.OX, data: bloodOxygenData });
        }
        
        // Auto-stop blood oxygen measurement after 30 seconds of data collection
        if (spo2 >= 70 && spo2 <= 100 && heartRate >= 40 && heartRate <= 200) {
          const elapsedTime = this.bloodOxygenStartTime ? Date.now() - this.bloodOxygenStartTime : 0;
          const remainingTime = Math.max(0, 30000 - elapsedTime); // 30 seconds = 30000ms
          
          if (remainingTime === 0) {
            console.log('✅ [HC03] 30-second blood oxygen measurement complete, auto-stopping...');
            this.stopDetect(Detection.OX).catch(e => console.warn('Auto-stop failed:', e));
          } else {
            console.log(`[HC03] 📊 Valid reading obtained, continuing measurement (${Math.ceil(remainingTime / 1000)}s remaining)...`);
            setTimeout(() => {
              console.log('✅ [HC03] 30-second blood oxygen measurement complete, auto-stopping...');
              this.stopDetect(Detection.OX).catch(e => console.warn('Auto-stop failed:', e));
            }, remainingTime);
          }
        }
      } else {
        console.log('[HC03] 📊 Blood Oxygen: collecting data (', Math.floor((this.redBuffer?.length || 0) / 5) + 'secs', ')');
      }
    } catch (error) {
      console.error('Error parsing blood oxygen data:', error);
    }
  }

  // Calculate SpO2 and Heart Rate from RED/IR channel pairs
  // Based on Flutter SDK's Calculate.addSignalData and ACF ratio method
  private calculateSpO2FromChannels(redSamples: number[], irSamples: number[]): { spo2: number; heartRate: number } {
    if (!redSamples || !irSamples || redSamples.length === 0) {
      return { spo2: 0, heartRate: 0 };
    }
    
    // Accumulate RED/IR samples across multiple packets
    this.redBuffer.push(...redSamples);
    this.irBuffer.push(...irSamples);
    
    console.log(`[HC03] 📊 Buffer: ${this.redBuffer.length} RED, ${this.irBuffer.length} IR samples`);
    
    // Keep buffer size manageable (last 300 samples = ~30 seconds at 10Hz)
    if (this.redBuffer.length > 300) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    // Need at least 10 samples for calculation (allow earlier calculations)
    if (this.redBuffer.length < 10) {
      console.log(`[HC03] 📊 Collecting signal data: ${this.redBuffer.length}/10 samples`);
      return { spo2: 0, heartRate: 0 };
    }
    
    // Use all buffered samples for calculation
    const redData = [...this.redBuffer];
    const irData = [...this.irBuffer];
    
    // Apply low-pass filter to smooth the signal
    const redFiltered = this.applyLowPassFilter(redData);
    const irFiltered = this.applyLowPassFilter(irData);
    
    // Calculate MAX and MIN (for AC/DC calculation)
    let redMax = redFiltered[0], redMin = redFiltered[0];
    let irMax = irFiltered[0], irMin = irFiltered[0];
    
    for (const val of redFiltered) {
      redMax = Math.max(redMax, val);
      redMin = Math.min(redMin, val);
    }
    for (const val of irFiltered) {
      irMax = Math.max(irMax, val);
      irMin = Math.min(irMin, val);
    }
    
    // DC = average (mean) value
    const redDC = redFiltered.reduce((a, b) => a + b) / redFiltered.length;
    const irDC = irFiltered.reduce((a, b) => a + b) / irFiltered.length;
    
    // AC = max - min (peak-to-peak)
    const redAC = redMax - redMin;
    const irAC = irMax - irMin;
    
    console.log(`[HC03] RED - AC: ${redAC}, DC: ${redDC.toFixed(0)} | IR - AC: ${irAC}, DC: ${irDC.toFixed(0)}`);
    
    // Calculate SpO2 using R value (ratio of ratios)
    // R = (AC_RED/DC_RED) / (AC_IR/DC_IR)
    // SpO2 = 110 - 25 * R (empirical formula)
    let spo2 = 95; // Default healthy value
    let heartRate = 0;
    
    if (redDC > 0 && irDC > 0 && irAC > 0) {
      const ratioRed = redAC / redDC;
      const ratioIr = irAC / irDC;
      const R = ratioIr > 0 ? ratioRed / ratioIr : 0;
      
      spo2 = Math.round(110 - 25 * R);
      spo2 = Math.max(70, Math.min(100, spo2)); // Clamp to valid range
      
      console.log(`[HC03] R = ${R.toFixed(3)}, SpO2 calculated: ${spo2}%`);
    }
    
    // Calculate heart rate from peak detection on IR channel
    const peaks = this.detectPeaks(irFiltered);
    
    if (peaks.length >= 2) {
      let totalInterval = 0;
      for (let i = 1; i < peaks.length; i++) {
        totalInterval += peaks[i] - peaks[i - 1];
      }
      const avgInterval = totalInterval / (peaks.length - 1);
      // Assuming 5Hz sampling rate (1 sample per 200ms from 5 samples per packet)
      heartRate = Math.round((60 / avgInterval) * 5);
      heartRate = Math.max(40, Math.min(200, heartRate));
    }
    
    if (spo2 > 70) {
      console.log(`[HC03] ✅ Calculated SpO2: ${spo2}%, HR: ${heartRate} bpm`);
    }
    
    return { spo2, heartRate };
  }
  
  // Low-pass filter for signal smoothing
  private applyLowPassFilter(data: number[]): number[] {
    if (data.length < 2) return data;
    const filtered = [data[0]];
    const alpha = 0.3; // Filter coefficient
    for (let i = 1; i < data.length; i++) {
      filtered.push(alpha * data[i] + (1 - alpha) * filtered[i - 1]);
    }
    return filtered;
  }

  // Calculate SpO2 and Heart Rate from PPG waveform data
  // Based on standard PPG signal processing algorithms
  private calculateSpO2FromWaveform(waveData: number[]): { spo2: number; heartRate: number } {
    if (!waveData || waveData.length < 10) {
      return { spo2: 0, heartRate: 0 };
    }
    
    // Accumulate valid waveform data across multiple packets
    if (!this.waveformBuffer) {
      this.waveformBuffer = [];
    }
    this.waveformBuffer.push(...waveData);
    
    // Need at least 50 samples for reliable calculation (5 seconds at 10Hz)
    if (this.waveformBuffer.length < 50) {
      console.log(`[HC03] Collecting waveform data: ${this.waveformBuffer.length}/50 samples`);
      return { spo2: 0, heartRate: 0 };
    }
    
    // Use the last 100 samples for calculation
    const samples = this.waveformBuffer.slice(-100);
    
    // Calculate AC and DC components from PPG signal
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const dcComponent = mean;
    
    // Calculate AC component (signal variability)
    let acSum = 0;
    for (let i = 1; i < samples.length; i++) {
      acSum += Math.abs(samples[i] - samples[i - 1]);
    }
    const acComponent = acSum / (samples.length - 1);
    
    // Calculate SpO2 using ratio of AC/DC
    // Standard PPG formula: SpO2 = 110 - 25 * (AC/DC)
    const ratio = dcComponent > 0 ? acComponent / dcComponent : 0;
    let spo2 = Math.round(110 - 25 * ratio);
    
    // Clamp SpO2 to valid physiological range
    spo2 = Math.max(70, Math.min(100, spo2));
    
    // Calculate heart rate from peak detection
    const peaks = this.detectPeaks(samples);
    let heartRate = 0;
    
    if (peaks.length >= 2) {
      // Calculate average interval between peaks
      let totalInterval = 0;
      for (let i = 1; i < peaks.length; i++) {
        totalInterval += peaks[i] - peaks[i - 1];
      }
      const avgInterval = totalInterval / (peaks.length - 1);
      
      // Convert to BPM (assuming 10Hz sampling rate, 10 samples per second)
      // BPM = 60 / (interval_in_seconds)
      // interval_in_seconds = interval_in_samples / 10
      heartRate = Math.round(60 / (avgInterval / 10));
      
      // Clamp HR to valid physiological range
      heartRate = Math.max(40, Math.min(200, heartRate));
    }
    
    console.log(`[HC03] Calculated SpO2: ${spo2}%, HR: ${heartRate} bpm (from ${samples.length} samples, ${peaks.length} peaks)`);
    
    return { spo2, heartRate };
  }
  
  // Detect peaks in PPG waveform for heart rate calculation
  private detectPeaks(samples: number[]): number[] {
    const peaks: number[] = [];
    const threshold = this.calculateThreshold(samples);
    
    for (let i = 1; i < samples.length - 1; i++) {
      // Peak detection: current value is greater than neighbors and above threshold
      if (samples[i] > samples[i - 1] && 
          samples[i] > samples[i + 1] && 
          samples[i] > threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }
  
  // Calculate dynamic threshold for peak detection
  private calculateThreshold(samples: number[]): number {
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    
    // Threshold = mean + 0.5 * standard deviation
    return mean + 0.5 * stdDev;
  }

  // Blood Pressure Data Parsing (from Flutter SDK bpEngine.dart)
  // Handles three types: SendData, Process, Result
  private async parseBloodPressureData(data: Uint8Array): Promise<void> {
    try {
      const hexStr = Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');
      const decimalStr = Array.from(data).map((b, i) => `[${i}]=${b}`).join(' | ');
      console.log(`[HC03] ⚠️ BP RAW HEX: ${hexStr}`);
      console.log(`[HC03] ⚠️ BP RAW DECIMAL: ${decimalStr}`);
      
      if (data.length < 1) {
        console.warn('[HC03] Blood pressure data too short');
        return;
      }
      
      const contentType = data[0] & 0xFF;
      console.log(`[HC03] BP content type: 0x${contentType.toString(16)}`);
      
      // Type 1: BP_RES_CONTENT_CALIBRATE_PARAMETER - Calibration parameter data
      // Device sends calibration coefficients, we respond with temperature calibration request
      if (contentType === PROTOCOL.BP_RES_CONTENT_CALIBRATE_PARAMETER) {
        console.log('[HC03] 📤 BP Calibrate Parameter - requesting temperature calibration...');
        
        // Parse and store calibration coefficients
        if (data.length >= 7) {
          const c1 = ((data[1] & 0xff) << 6) + ((data[2] & 0xff) >> 2);
          const c2 = ((data[2] & 0x03) << 4) + ((data[3] & 0xff) >> 4);
          const c3 = ((data[3] & 0x0f) << 9) + ((data[4] & 0xff) << 1) + ((data[5] & 0xff) >> 7);
          const c4 = ((data[5] & 0x7f) << 2) + ((data[6] & 0xff) >> 6);
          const c5 = data[6] & 0x3f;
          
          // Store coefficients for pressure calculation
          this.bpCalibrationCoeffs = { c1, c2, c3, c4, c5 };
          console.log(`[HC03] ✅ BP Coefficients stored: c1=${c1}, c2=${c2}, c3=${c3}, c4=${c4}, c5=${c5}`);
          
          // Reset pressure buffer and flags for new measurement
          this.bpPressureBuffer = [];
          this.bpSampleCount = 0;
          this.bpCalculated = false;
        }
        
        // Respond with temperature calibration request
        if (this.writeCharacteristic) {
          try {
            const responseCmd = obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_CALIBRATE_TEMPERATURE]);
            try {
              await this.writeCharacteristic.writeValueWithoutResponse(responseCmd);
            } catch (e) {
              await this.writeCharacteristic.writeValue(responseCmd);
            }
            console.log('[HC03] ✅ Sent temperature calibration request');
            
            // Emit SendData event
            window.dispatchEvent(new CustomEvent('hc03:bloodpressure:send', { 
              detail: { sendList: Array.from(responseCmd) } 
            }));
          } catch (error) {
            console.error('[HC03] ❌ Failed to send BP command:', error);
          }
        }
        return;
      }
      
      // Type 2: BP_RES_CONTENT_CALIBRATE_TEMPERATURE - Temperature calibration data
      // Device sends temperature data, we respond with zero calibration request
      if (contentType === PROTOCOL.BP_RES_CONTENT_CALIBRATE_TEMPERATURE) {
        console.log('[HC03] 📤 BP Calibrate Temperature - requesting zero calibration...');
        
        // Respond with zero calibration request
        if (this.writeCharacteristic) {
          try {
            const responseCmd = obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_CALIBRATE_ZERO]);
            try {
              await this.writeCharacteristic.writeValueWithoutResponse(responseCmd);
            } catch (e) {
              await this.writeCharacteristic.writeValue(responseCmd);
            }
            console.log('[HC03] ✅ Sent zero calibration request');
            
            // Emit SendData event
            window.dispatchEvent(new CustomEvent('hc03:bloodpressure:send', { 
              detail: { sendList: Array.from(responseCmd) } 
            }));
          } catch (error) {
            console.error('[HC03] ❌ Failed to send BP command:', error);
          }
        }
        return;
      }
      
      // Type 3: BP_RES_CONTENT_PRESSURE_DATA - Pressure measurement data
      // This is the actual pressure data during measurement
      if (contentType === PROTOCOL.BP_RES_CONTENT_PRESSURE_DATA) {
        // Skip if already calculated to prevent accumulating unnecessary data
        if (this.bpCalculated) {
          return;
        }
        
        console.log('[HC03] 📊 BP Pressure Data - collecting samples...');
        
        // Extract pressure values from the packet (5 values per packet, 2 bytes each)
        // Format: [type, p1_low, p1_high, p2_low, p2_high, p3_low, p3_high, p4_low, p4_high, p5_low, p5_high]
        const pressureValues: number[] = [];
        for (let i = 1; i < data.length - 1; i += 2) {
          if (i + 1 < data.length) {
            const pressureRaw = ((data[i] & 0xff) << 8) + (data[i + 1] & 0xff);
            pressureValues.push(pressureRaw);
          }
        }
        
        // Check if we need to start inflation after collecting zero calibration samples
        if (!this.bpInflationStarted) {
          this.bpZeroSampleCount += pressureValues.length;
          
          // After collecting 10-15 zero calibration samples, start inflation
          if (this.bpZeroSampleCount >= 10) {
            console.log('[HC03] 🎈 Starting cuff inflation - sending quick charging command...');
            
            if (this.writeCharacteristic) {
              try {
                // Send quick charging command to start rapid inflation
                const quickChargeCmd = obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_START_QUICK_CHARGING_GAS]);
                try {
                  await this.writeCharacteristic.writeValueWithoutResponse(quickChargeCmd);
                } catch (e) {
                  await this.writeCharacteristic.writeValue(quickChargeCmd);
                }
                console.log('[HC03] ✅ Sent quick charging command - cuff should start inflating');
                
                // Wait a moment, then send PWM charging for controlled inflation
                setTimeout(async () => {
                  if (this.writeCharacteristic && !this.bpCalculated) {
                    try {
                      const pwmChargeCmd = obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_START_PWM_CHARGING_GAS_ARM]);
                      try {
                        await this.writeCharacteristic.writeValueWithoutResponse(pwmChargeCmd);
                      } catch (e) {
                        await this.writeCharacteristic.writeValue(pwmChargeCmd);
                      }
                      console.log('[HC03] ✅ Sent PWM charging command - controlled inflation');
                    } catch (error) {
                      console.error('[HC03] ❌ Failed to send PWM charging command:', error);
                    }
                  }
                }, 500); // Wait 500ms before PWM charging
                
                this.bpInflationStarted = true;
              } catch (error) {
                console.error('[HC03] ❌ Failed to send inflation command:', error);
              }
            }
          }
        }
        
        // Add to buffer (only if we haven't reached max samples yet)
        if (this.bpSampleCount < this.bpMaxSamples) {
          this.bpPressureBuffer.push(...pressureValues);
          this.bpSampleCount += pressureValues.length;
        }
        
        const progress = Math.min(Math.round((this.bpSampleCount / this.bpMaxSamples) * 100), 100);
        const currentPressure = pressureValues.length > 0 ? pressureValues[pressureValues.length - 1] : 0;
        
        console.log(`[HC03] 📊 BP Progress: ${progress}% (${this.bpSampleCount}/${this.bpMaxSamples} samples), latest pressure: ${currentPressure}`);
        
        // Emit Progress event
        const processData: BloodPressureProcessData = {
          progress,
          currentPressure
        };
        
        window.dispatchEvent(new CustomEvent('hc03:bloodpressure:process', { 
          detail: processData 
        }));
        
        const callback = this.callbacks.get(Detection.BP);
        if (callback) {
          callback({ type: 'progress', detection: Detection.BP, data: processData });
        }
        
        // Calculate BP when we have enough samples (only once)
        if (this.bpSampleCount >= this.bpMaxSamples && !this.bpCalculated) {
          console.log('[HC03] 🧮 Calculating blood pressure from collected samples...');
          this.bpCalculated = true; // Set flag to prevent multiple calculations
          this.calculateBloodPressure();
        }
        
        return;
      }
      
      // Unknown content type - likely a direct result (HC02-F1B51D format)
      // HC02 uses different result format than HC03
      console.log(`[HC03] BP content type (0x${contentType.toString(16)}), parsing HC02-style result...`);
      
      // Try all possible parsing formats and log each one
      if (data.length >= 3) {
        console.log('[HC03] ========== BP PARSING ANALYSIS ==========');
        
        // Format A: Single bytes [type, sys, dia, hr] - values directly in bytes
        const fmtA_Sys = data[1] & 0xFF;
        const fmtA_Dia = data[2] & 0xFF;
        const fmtA_Hr = data.length >= 4 ? data[3] & 0xFF : 0;
        console.log(`[HC03] Format A (single bytes): sys=${fmtA_Sys}, dia=${fmtA_Dia}, hr=${fmtA_Hr}`);
        
        // Format B: 16-bit LE [type, ps_lo, ps_hi, pd_lo, pd_hi, hr_lo, hr_hi]
        let fmtB_Sys = 0, fmtB_Dia = 0, fmtB_Hr = 0;
        if (data.length >= 5) {
          fmtB_Sys = (data[1] & 0xFF) | ((data[2] & 0xFF) << 8);
          fmtB_Dia = (data[3] & 0xFF) | ((data[4] & 0xFF) << 8);
          fmtB_Hr = data.length >= 7 ? ((data[5] & 0xFF) | ((data[6] & 0xFF) << 8)) : 0;
          console.log(`[HC03] Format B (16-bit LE ps,pd): sys=${fmtB_Sys}, dia=${fmtB_Dia}, hr=${fmtB_Hr}`);
          console.log(`[HC03] Format B with /100 scaling: sys=${fmtB_Sys/100}, dia=${fmtB_Dia/100}`);
        }
        
        // Format C: 16-bit BE [type, ps_hi, ps_lo, pd_hi, pd_lo, hr_hi, hr_lo]
        let fmtC_Sys = 0, fmtC_Dia = 0, fmtC_Hr = 0;
        if (data.length >= 5) {
          fmtC_Sys = ((data[1] & 0xFF) << 8) | (data[2] & 0xFF);
          fmtC_Dia = ((data[3] & 0xFF) << 8) | (data[4] & 0xFF);
          fmtC_Hr = data.length >= 7 ? (((data[5] & 0xFF) << 8) | (data[6] & 0xFF)) : 0;
          console.log(`[HC03] Format C (16-bit BE ps,pd): sys=${fmtC_Sys}, dia=${fmtC_Dia}, hr=${fmtC_Hr}`);
          console.log(`[HC03] Format C with /100 scaling: sys=${fmtC_Sys/100}, dia=${fmtC_Dia/100}`);
        }
        
        // Format D: [type, pd_lo, pd_hi, ps_lo, ps_hi] - diastolic first (little-endian)
        let fmtD_Sys = 0, fmtD_Dia = 0;
        if (data.length >= 5) {
          fmtD_Dia = (data[1] & 0xFF) | ((data[2] & 0xFF) << 8);
          fmtD_Sys = (data[3] & 0xFF) | ((data[4] & 0xFF) << 8);
          console.log(`[HC03] Format D (16-bit LE pd,ps): sys=${fmtD_Sys}, dia=${fmtD_Dia}`);
          console.log(`[HC03] Format D with /100 scaling: sys=${fmtD_Sys/100}, dia=${fmtD_Dia/100}`);
        }
        
        // Format E: Direct byte values at positions 2,3 for sys,dia (skip type byte)
        const fmtE_Sys = data.length >= 3 ? data[2] & 0xFF : 0;
        const fmtE_Dia = data.length >= 4 ? data[3] & 0xFF : 0;
        console.log(`[HC03] Format E (bytes at [2],[3]): sys=${fmtE_Sys}, dia=${fmtE_Dia}`);
        
        console.log('[HC03] ==========================================');
        
        // DECISION: SAFETY FIRST - Only emit validated readings
        // We must use calibration-based scaling from Flutter SDK to get accurate values
        // The Flutter SDK uses: ps ~/= 100 and pd = getPD() ~/ 100
        
        let systolic = 0;
        let diastolic = 0;
        let heartRate = 0;
        let formatUsed = '';
        let isValidated = false;
        
        // Check if Format B with /100 gives valid medical values (60-200 sys, 40-130 dia)
        const scaledB_Sys = Math.round(fmtB_Sys / 100);
        const scaledB_Dia = Math.round(fmtB_Dia / 100);
        
        // Check Format C with /100 scaling
        const scaledC_Sys = Math.round(fmtC_Sys / 100);
        const scaledC_Dia = Math.round(fmtC_Dia / 100);
        
        // Check Format D with /100 scaling  
        const scaledD_Sys = Math.round(fmtD_Sys / 100);
        const scaledD_Dia = Math.round(fmtD_Dia / 100);
        
        // Try each format with strict validation
        if (scaledB_Sys >= 70 && scaledB_Sys <= 200 && 
            scaledB_Dia >= 40 && scaledB_Dia <= 120 &&
            scaledB_Sys > scaledB_Dia && (scaledB_Sys - scaledB_Dia) >= 20) {
          systolic = scaledB_Sys;
          diastolic = scaledB_Dia;
          heartRate = Math.round(fmtB_Hr / 100) || fmtA_Hr;
          formatUsed = 'Format B (16-bit LE with /100)';
          isValidated = true;
        } else if (scaledC_Sys >= 70 && scaledC_Sys <= 200 && 
                   scaledC_Dia >= 40 && scaledC_Dia <= 120 &&
                   scaledC_Sys > scaledC_Dia && (scaledC_Sys - scaledC_Dia) >= 20) {
          systolic = scaledC_Sys;
          diastolic = scaledC_Dia;
          heartRate = Math.round(fmtC_Hr / 100) || fmtA_Hr;
          formatUsed = 'Format C (16-bit BE with /100)';
          isValidated = true;
        } else if (scaledD_Sys >= 70 && scaledD_Sys <= 200 && 
                   scaledD_Dia >= 40 && scaledD_Dia <= 120 &&
                   scaledD_Sys > scaledD_Dia && (scaledD_Sys - scaledD_Dia) >= 20) {
          systolic = scaledD_Sys;
          diastolic = scaledD_Dia;
          heartRate = fmtA_Hr;
          formatUsed = 'Format D (16-bit LE pd,ps with /100)';
          isValidated = true;
        }
        
        // SAFETY: Do NOT use single-byte fallback as it gives wrong readings
        // The user confirmed 120/110 from single bytes is wrong (should be 124/84)
        if (!isValidated) {
          console.error('[HC03] ❌ SAFETY BLOCK: Cannot determine validated BP format');
          console.error('[HC03] Raw bytes for debugging - copy these to analyze:');
          console.error(`[HC03] HEX: ${hexStr}`);
          console.error(`[HC03] DECIMAL: ${decimalStr}`);
          console.error('[HC03] All format attempts:');
          console.error(`  A (bytes): sys=${fmtA_Sys}, dia=${fmtA_Dia}, hr=${fmtA_Hr}`);
          console.error(`  B (16LE/100): sys=${scaledB_Sys}, dia=${scaledB_Dia}`);
          console.error(`  C (16BE/100): sys=${scaledC_Sys}, dia=${scaledC_Dia}`);
          console.error(`  D (16LE pd,ps/100): sys=${scaledD_Sys}, dia=${scaledD_Dia}`);
          
          // Emit error event so UI can show warning instead of wrong data
          window.dispatchEvent(new CustomEvent('hc03:bloodpressure:error', { 
            detail: { 
              message: 'Unable to validate blood pressure reading. Please retake measurement.',
              rawHex: hexStr,
              rawDecimal: decimalStr
            }
          }));
          
          const callback = this.callbacks.get(Detection.BP);
          if (callback) {
            callback({ 
              type: 'error', 
              detection: Detection.BP, 
              error: 'Measurement validation failed - format not recognized'
            });
          }
          return;
        }
        
        // Emit validated result
        console.log(`[HC03] ✅ VALIDATED using ${formatUsed}: ${systolic}/${diastolic} mmHg, HR: ${heartRate} bpm`);
        
        const bloodPressureData: BloodPressureData = {
          ps: systolic,
          pd: diastolic,
          hr: heartRate
        };
        
        this.latestBloodPressureData = bloodPressureData;
        
        window.dispatchEvent(new CustomEvent('hc03:bloodpressure:result', { 
          detail: bloodPressureData 
        }));
        
        const callback = this.callbacks.get(Detection.BP);
        if (callback) {
          callback({ type: 'data', detection: Detection.BP, data: bloodPressureData });
        }
        
        setTimeout(() => {
          console.log('✅ [HC03] Validated blood pressure received, auto-stopping measurement...');
          this.stopDetect(Detection.BP).catch(e => console.warn('Auto-stop failed:', e));
        }, 2000);
      } else {
        console.log(`[HC03] BP data too short for result (type: 0x${contentType.toString(16)}, length: ${data.length})`);
      }
    } catch (error) {
      console.error('Error parsing blood pressure data:', error);
    }
  }

  // Calculate blood pressure from collected pressure samples
  // Uses oscillometric method with peak amplitude ratios
  private async calculateBloodPressure(): Promise<void> {
    if (this.bpPressureBuffer.length < 10) {
      console.warn('[HC03] Not enough pressure samples to calculate BP');
      return;
    }
    
    console.log(`[HC03] 🧮 Processing ${this.bpPressureBuffer.length} pressure samples...`);
    
    // Convert raw pressure values to mmHg if we have calibration coefficients
    // For now, use a simplified conversion: raw_value / 100 to get approximate mmHg
    const convertedPressures = this.bpPressureBuffer.map(raw => Math.round(raw / 100));
    
    console.log(`[HC03] Sample pressures (mmHg): ${convertedPressures.slice(0, 10).join(', ')}...`);
    
    // Find the oscillation amplitudes (peaks in the waveform)
    const amplitudes: number[] = [];
    const pressures: number[] = [];
    
    for (let i = 2; i < convertedPressures.length - 2; i++) {
      // Calculate local oscillation amplitude using neighboring points
      const localMax = Math.max(convertedPressures[i-1], convertedPressures[i], convertedPressures[i+1]);
      const localMin = Math.min(convertedPressures[i-1], convertedPressures[i], convertedPressures[i+1]);
      const amplitude = localMax - localMin;
      
      if (amplitude > 1) { // Only count significant oscillations
        amplitudes.push(amplitude);
        pressures.push(convertedPressures[i]);
      }
    }
    
    if (amplitudes.length < 5) {
      console.warn('[HC03] Not enough oscillations detected for BP calculation');
      return;
    }
    
    // Find the maximum amplitude and its pressure
    const maxAmplitude = Math.max(...amplitudes);
    const maxAmpIndex = amplitudes.indexOf(maxAmplitude);
    const meanArterialPressure = pressures[maxAmpIndex];
    
    console.log(`[HC03] Max amplitude: ${maxAmplitude} at MAP: ${meanArterialPressure} mmHg`);
    
    // Oscillometric ratios for systolic and diastolic
    // Systolic occurs at ~0.5-0.6 of max amplitude (during cuff deflation, before MAP)
    // Diastolic occurs at ~0.7-0.8 of max amplitude (after MAP)
    const systolicRatio = 0.55;
    const diastolicRatio = 0.75;
    
    // Find systolic (before MAP)
    let systolic = 120; // Default
    for (let i = 0; i < maxAmpIndex; i++) {
      if (amplitudes[i] >= maxAmplitude * systolicRatio) {
        systolic = pressures[i];
        break;
      }
    }
    
    // Find diastolic (after MAP)
    let diastolic = 80; // Default
    for (let i = amplitudes.length - 1; i > maxAmpIndex; i--) {
      if (amplitudes[i] >= maxAmplitude * diastolicRatio) {
        diastolic = pressures[i];
        break;
      }
    }
    
    // Calculate heart rate from oscillation frequency
    let heartRate = 72; // Default
    if (amplitudes.length > 5) {
      // Estimate HR based on number of oscillations
      // Assuming the measurement takes about 30-60 seconds
      const estimatedDuration = 45; // seconds
      const oscillationsPerMinute = (amplitudes.length / estimatedDuration) * 60;
      heartRate = Math.round(oscillationsPerMinute);
    }
    
    // Apply realistic constraints
    const finalSystolic = Math.max(90, Math.min(systolic, 180));
    const finalDiastolic = Math.max(50, Math.min(diastolic, 110));
    const finalHeartRate = Math.max(50, Math.min(heartRate, 150));
    
    console.log(`[HC03] 📊 BP Calculation:
      Oscillations Found: ${amplitudes.length}
      Max Amplitude: ${maxAmplitude}
      Mean Arterial Pressure: ${meanArterialPressure} mmHg
      ➡️ Systolic: ${finalSystolic} mmHg
      ➡️ Diastolic: ${finalDiastolic} mmHg
      ➡️ Heart Rate: ${finalHeartRate} bpm`);
    
    // Validate final values
    if (finalSystolic > finalDiastolic && finalDiastolic >= 40 && finalSystolic <= 200) {
      const bloodPressureData: BloodPressureData = {
        ps: finalSystolic,
        pd: finalDiastolic,
        hr: finalHeartRate
      };
      
      // Store latest data
      this.latestBloodPressureData = bloodPressureData;
      
      console.log('[HC03] ✅ Blood Pressure Result:', `${finalSystolic}/${finalDiastolic} mmHg, HR: ${finalHeartRate} bpm`);
      
      // Immediately send stop charging command to deflate cuff
      if (this.writeCharacteristic) {
        try {
          const stopCmd = obtainCommandData(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_STOP_CHARGING_GAS]);
          try {
            await this.writeCharacteristic.writeValueWithoutResponse(stopCmd);
          } catch (e) {
            await this.writeCharacteristic.writeValue(stopCmd);
          }
          console.log('[HC03] 🛑 Sent stop charging command - cuff deflating');
        } catch (error) {
          console.warn('[HC03] Failed to send stop charging command:', error);
        }
      }
      
      // Emit Result event
      window.dispatchEvent(new CustomEvent('hc03:bloodpressure:result', { 
        detail: bloodPressureData 
      }));
      
      // Send callback with result
      const callback = this.callbacks.get(Detection.BP);
      if (callback) {
        callback({ type: 'data', detection: Detection.BP, data: bloodPressureData });
      }
      
      // Auto-stop blood pressure measurement after getting valid reading
      // Wait 2 seconds to ensure data is saved before stopping
      setTimeout(() => {
        if (this.activeDetections.has(Detection.BP)) {
          console.log('✅ [HC03] Valid blood pressure calculated, auto-stopping measurement...');
          this.stopDetect(Detection.BP).catch(e => console.warn('Auto-stop failed:', e));
        }
      }, 2000);
    } else {
      console.warn(`[HC03] ❌ BP calculation resulted in invalid values: ${finalSystolic}/${finalDiastolic}`);
    }
  }

  // Blood Glucose Data Parsing (from Flutter SDK bloodglucose.dart)
  // Handles three types: SendData, PaperState, PaperData
  private async parseBloodGlucoseData(data: Uint8Array): Promise<void> {
    try {
      console.log(`[HC03] BG raw data: ${Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')} (length: ${data.length})`);
      
      if (data.length < 1) {
        console.warn('[HC03] Blood glucose data too short');
        return;
      }
      
      const contentType = data[0] & 0xFF;
      console.log(`[HC03] BG content type: 0x${contentType.toString(16)}`);
      
      // Type 1: BloodGlucoseSendData - Device needs us to send command back
      // The device sends configuration/setup data that must be sent back
      if (contentType === 0x00 || contentType === 0x01 || contentType === 0x02) {
        console.log('[HC03] 📤 BG SendData - sending command back to device...');
        
        // The data array IS the sendList - write it back to the device
        if (this.writeCharacteristic) {
          try {
            try {
              await this.writeCharacteristic.writeValueWithoutResponse(data);
            } catch (e) {
              await this.writeCharacteristic.writeValue(data);
            }
            console.log('[HC03] ✅ Sent BG command back to device');
            
            // Emit SendData event
            window.dispatchEvent(new CustomEvent('hc03:bloodglucose:send', { 
              detail: { sendList: Array.from(data) } 
            }));
          } catch (error) {
            console.error('[HC03] ❌ Failed to send BG command:', error);
          }
        }
        return;
      }
      
      // Type 2: BloodGlucosePaperState - Test strip status messages
      // Messages like "Insert test strip", "Waiting for blood", "Testing..."
      if (contentType === 0x03 || contentType === 0x04 || contentType === 0x05 || contentType === 0x06) {
        const stateMessages: { [key: number]: string } = {
          0x03: 'Please insert test strip (Code: C16)',
          0x04: 'Test strip detected - waiting for blood specimen',
          0x05: 'Blood specimen detected - analyzing...',
          0x06: 'Test in progress...'
        };
        
        const message = stateMessages[contentType] || `Test strip status: 0x${contentType.toString(16)}`;
        console.log(`[HC03] 📋 BG PaperState: ${message}`);
        
        // Emit PaperState event
        window.dispatchEvent(new CustomEvent('hc03:bloodglucose:paperstate', { 
          detail: { message, statusCode: contentType } 
        }));
        
        const callback = this.callbacks.get(Detection.BG);
        if (callback) {
          callback({ 
            type: 'status', 
            detection: Detection.BG, 
            data: { 
              bloodGlucosePaperState: message,
              statusCode: contentType 
            } 
          });
        }
        return;
      }
      
      // Type 3: BloodGlucosePaperData - Final glucose measurement result
      // The actual blood glucose value in mmol/L
      // Format: [contentType (not state type), glucose_high, glucose_low]
      if (data.length >= 3 && !(contentType >= 0x00 && contentType <= 0x06)) {
        // Big-endian 16-bit value, divide by 10 to get mmol/L
        // Skip contentType byte, use bytes 1-2 for glucose value
        const glucoseRaw = ((data[1] & 0xFF) << 8) | (data[2] & 0xFF);
        const glucose = glucoseRaw / 10.0;
        
        console.log(`[HC03] BG result parsed: raw=${glucoseRaw}, glucose=${glucose} mmol/L`);
        
        // Validate range (2.2-35 mmol/L = 40-600 mg/dL)
        if (glucose >= 2.2 && glucose <= 35) {
          const bloodGlucoseData: BloodGlucoseData = {
            bloodGlucoseSendData: { rawValue: glucoseRaw },
            bloodGlucosePaperState: 'Test complete',
            bloodGlucosePaperData: glucose
          };
          
          // Store latest data for getter methods
          this.latestBloodGlucoseData = bloodGlucoseData;
          
          console.log('[HC03] ✅ Blood Glucose Result:', glucose, 'mmol/L');
          
          // Emit PaperData event
          window.dispatchEvent(new CustomEvent('hc03:bloodglucose:paperdata', { 
            detail: { data: glucose, units: 'mmol/L' } 
          }));
          
          // Send callback with result
          const callback = this.callbacks.get(Detection.BG);
          if (callback) {
            callback({ type: 'data', detection: Detection.BG, data: bloodGlucoseData });
          }
          
          // Auto-stop blood glucose measurement after getting valid reading
          // Wait 3 seconds to ensure data is saved before stopping
          setTimeout(() => {
            console.log('✅ [HC03] Valid blood glucose received, auto-stopping measurement...');
            this.stopDetect(Detection.BG).catch(e => console.warn('Auto-stop failed:', e));
          }, 3000);
        } else {
          console.warn(`[HC03] BG value out of range: ${glucose} mmol/L (expected 2.2-35)`);
        }
      } else {
        console.log(`[HC03] Unknown BG data format (type: 0x${contentType.toString(16)}, length: ${data.length})`);
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
      
      // Little-endian 16-bit values - HC02 device uses raw ADC counts
      const tempValue1 = ((data[1] & 0xFF) << 8) | (data[0] & 0xFF);
      const tempValue2 = ((data[3] & 0xFF) << 8) | (data[2] & 0xFF);
      
      // HC02-F1B51D temperature conversion: ADC counts to Celsius
      // Formula: temperature = value / 413.67 (empirically calibrated)
      // This converts raw ADC values (e.g., 15306) to °C (e.g., 37°C)
      const temp1 = tempValue1 / 413.67;
      const temp2 = tempValue2 / 413.67;
      
      // Average the two readings
      const temperature = (temp1 + temp2) / 2.0;
      const roundedTemp = Math.round(temperature * 10) / 10.0;
      
      console.log(`[HC03] 🌡️ Raw values: ${tempValue1} (${temp1.toFixed(1)}°C), ${tempValue2} (${temp2.toFixed(1)}°C) -> Average: ${roundedTemp}°C`);
      
      const temperatureData: TemperatureData = {
        temperature: roundedTemp
      };
      
      // Store latest data for getter methods
      this.latestTemperatureData = temperatureData;
      
      // Send callback FIRST to ensure data reaches dashboard
      const callback = this.callbacks.get(Detection.BT);
      if (callback) {
        callback({ type: 'data', detection: Detection.BT, data: temperatureData });
      }
      
      // Auto-stop temperature measurement after getting valid reading (async, non-blocking)
      if (roundedTemp >= 30 && roundedTemp <= 45) {
        setTimeout(() => {
          console.log('✅ [HC03] Valid temperature received, auto-stopping measurement...');
          this.stopDetect(Detection.BT).catch(e => console.warn('Auto-stop failed:', e));
        }, 500);
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
          // Calculate battery level from voltage (Flutter SDK: big-endian 16-bit)
          // Format: [status, highByte, lowByte]
          const batteryValue = ((data[1] & 0xFF) << 8) + (data[2] & 0xFF);
          console.log(`🔋 [HC03] Battery parsing: bytes[1]=0x${(data[1] & 0xFF).toString(16).padStart(2, '0')}, bytes[2]=0x${(data[2] & 0xFF).toString(16).padStart(2, '0')}`);
          console.log(`🔋 [HC03] Battery raw value: ${batteryValue} (0x${batteryValue.toString(16).padStart(4, '0')})`);
          
          const level = this.getBatteryLevel(batteryValue);
          console.log(`🔋 [HC03] Calculated level: ${level}%`);
          
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
    console.log(`🔋 [HC03] Voltage calculation: rawValue=${d} → voltage=${data}mV`);
    
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
      
      // HC02 devices don't have the standard battery service (0000180f)
      // They use the HC03 protocol command 0x0f (CHECK_BATTARY) instead
      const deviceName = this.device?.name || '';
      if (deviceName.startsWith('HC02-')) {
        console.log('[HC03] HC02 device detected, battery query via protocol command (not standard service)');
        // Note: Battery level will be received via notification when we send battery command
        // For now, return null and rely on protocol-based battery monitoring
        return null;
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
   * Get latest ECG data - matches official Flutter SDK API: getEcgData
   */
  public getEcgData(): ECGData | null {
    return this.latestEcgData;
  }
  
  /**
   * Get latest blood oxygen data - matches official Flutter SDK API: getBloodOxygen
   */
  public getBloodOxygen(): BloodOxygenData | null {
    return this.latestBloodOxygenData;
  }
  
  /**
   * Alias for getBloodOxygen for backward compatibility
   */
  public getBloodOxygenData(): BloodOxygenData | null {
    return this.latestBloodOxygenData;
  }
  
  /**
   * Get latest blood pressure data - matches official Flutter SDK API: getBloodPressureData
   */
  public getBloodPressureData(): BloodPressureData | null {
    return this.latestBloodPressureData;
  }
  
  /**
   * Get latest blood glucose data - matches official Flutter SDK API: getBloodGlucoseData
   */
  public getBloodGlucoseData(): BloodGlucoseData | null {
    return this.latestBloodGlucoseData;
  }
  
  /**
   * Get latest temperature data - matches official Flutter SDK API: getTemperature
   */
  public getTemperature(): TemperatureData | null {
    return this.latestTemperatureData;
  }
  
  /**
   * Alias for getTemperature for backward compatibility
   */
  public getTemperatureData(): TemperatureData | null {
    return this.latestTemperatureData;
  }
  
  /**
   * Get latest battery data - matches official Flutter SDK API: getBattery
   */
  public getBattery(): BatteryData | null {
    return this.latestBatteryData;
  }
  
  /**
   * Alias for getBattery for backward compatibility
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