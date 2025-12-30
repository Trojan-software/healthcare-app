/**
 * Linktop Health Monitor SDK v2.6.4
 * Web Bluetooth implementation ported from official Flutter SDK (HC03_Flutter_V1.0.1)
 * Supports HC02/HC03 devices with firmware HC03_V2.9a
 */

// BLE Service and Characteristic UUIDs
const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const WRITE_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

// Protocol Constants from Flutter SDK (baseCommon.dart)
const PROTOCOL = {
  // Packet structure
  PACKAGE_TOTAL_LENGTH: 10,
  PACKAGE_INDEX_START: 0,
  PACKAGE_INDEX_LENGTH: 1,
  PACKAGE_INDEX_BT_EDITION: 3,
  PACKAGE_INDEX_TYPE: 4,
  PACKAGE_INDEX_HEADER_CRC: 5,
  PACKAGE_INDEX_CONTENT: 6,
  
  // Attributes
  ATTR_START_REQ: 0x01,
  ATTR_START_RES: 0x02,
  ATTR_END_REQ: 0xFF,
  BT_EDITION: 0x04,
  
  // Battery
  CHECK_BATTERY: 0x0F,
  BATTERY_QUERY: 0x00,
  RESPONSE_CHECK_BATTERY: 0x8F,
  
  // Blood Pressure
  BP_REQ_TYPE: 0x01,
  BP_REQ_CONTENT_CALIBRATE_PARAMETER: 0x01,
  BP_REQ_CONTENT_CALIBRATE_TEMPERATURE: 0x02,
  BP_REQ_CONTENT_CALIBRATE_ZERO: 0x03,
  BP_REQ_CONTENT_START_QUICK_CHARGING_GAS: 0x04,
  BP_REQ_CONTENT_START_PWM_CHARGING_GAS_ARM: 0x05,
  BP_REQ_CONTENT_START_PWM_CHARGING_GAS_WRIST: 0x06,
  BP_REQ_CONTENT_STOP_CHARGING_GAS: 0x07,
  BP_RES_TYPE: 0x81,
  
  // Blood Glucose
  BLOOD_GLUCOSE: 0x03,
  TEST_PAPER_GET_VER: 0x01,
  TEST_PAPER_CHECK_PAPER: 0x02,
  TEST_PAPER_ADC_START: 0x03,
  TEST_PAPER_ADC_STOP: 0x04,
  BG_RES_TYPE: 0x83,
  
  // Blood Oxygen (SpO2)
  OX_REQ_TYPE_NORMAL: 0x04,
  OX_REQ_CONTENT_START_NORMAL: 0x00,
  OX_REQ_CONTENT_STOP_NORMAL: 0x01,
  OX_RES_TYPE_NORMAL: 0x84,
  
  // Temperature
  TEMPERATURE: 0x02,
  TEP_START_NORMAL: 0x00,
  TEP_STOP_NORMAL: 0x01,
  BT_RES_TYPE: 0x82,
  
  // ECG
  ELECTROCARDIOGRAM: 0x05,
  ECG_START: 0x01,
  ECG_STOP: 0x02,
};

// Battery State Enum
export enum BatteryState {
  UNKNOWN = 0,
  NORMAL = 1,
  CHARGING = 2,
  CHARGE_FULL = 3,
  LOW_BATTERY = 4
}

// Measure Type Enum
export enum MeasureType {
  BATTERY = 0x0F,
  ECG = 0x05,
  SPO2 = 0x04,
  BLOOD_PRESSURE = 0x01,
  TEMPERATURE = 0x02,
  BLOOD_GLUCOSE = 0x03
}

// Data Types
export interface DeviceInfo {
  name: string;
  id: string;
  firmwareVersion?: string;
}

export interface BatteryData {
  state: number;
  level: number;
}

export interface ECGData {
  heartRate: number;
  smoothedWave: number;
  rrMax: number;
  rrMin: number;
  hrv: number;
  mood: number;
  heartAge: number;
  stress: number;
  breathRate: number;
  r2rInterval: number;
  fingerTouch: boolean;
}

export interface SpO2Data {
  oxygenLevel: number;
  heartRate: number;
  waveValue?: number;
}

export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  heartRate: number;
}

export interface TemperatureData {
  temperature: number;
}

export interface BloodGlucoseData {
  value: number;
  unit: 'mg/dL' | 'mmol/L';
}

export type MeasurementData = 
  | { type: 'battery'; data: BatteryData }
  | { type: 'ecg'; data: ECGData }
  | { type: 'spo2'; data: SpO2Data }
  | { type: 'bloodPressure'; data: BloodPressureData }
  | { type: 'temperature'; data: TemperatureData }
  | { type: 'bloodGlucose'; data: BloodGlucoseData };

type MeasurementCallback = (data: MeasurementData) => void;
type ConnectionCallback = (connected: boolean, device?: DeviceInfo) => void;

class LinktopSDK {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected: boolean = false;
  private deviceInfo: DeviceInfo | null = null;
  
  private measurementCallbacks: Map<string, MeasurementCallback> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  
  private rawDataBuffer: number[] = [];
  private isEcgMeasure: boolean = false;
  private cacheType: number = 0;
  private cacheMap: Map<number, number[]> = new Map();
  
  // SpO2 calculation state
  private spo2Samples: { red: number; ir: number }[] = [];

  /**
   * Check if Web Bluetooth is supported
   */
  isSupported(): boolean {
    return !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
  }

  /**
   * Build command packet according to Flutter SDK protocol
   * Exact port of BaseCommon.obtainCommandData
   */
  private buildCommand(type: number, cmd: number[]): Uint8Array {
    const totalLen = PROTOCOL.PACKAGE_TOTAL_LENGTH + cmd.length - 1;
    const buffer = new Uint8Array(totalLen);
    const view = new DataView(buffer.buffer);
    
    // Fill start byte
    view.setUint8(PROTOCOL.PACKAGE_INDEX_START, PROTOCOL.ATTR_START_REQ);
    
    // Fill length (little endian)
    view.setUint16(PROTOCOL.PACKAGE_INDEX_LENGTH, cmd.length, true);
    
    // Fill bluetooth edition
    view.setUint8(PROTOCOL.PACKAGE_INDEX_BT_EDITION, PROTOCOL.BT_EDITION);
    
    // Fill type
    view.setUint8(PROTOCOL.PACKAGE_INDEX_TYPE, type);
    
    // Calculate and fill header CRC (XOR of first 5 bytes)
    const headerCrc = this.encryHead(Array.from(buffer.slice(0, PROTOCOL.PACKAGE_INDEX_HEADER_CRC)));
    view.setUint8(PROTOCOL.PACKAGE_INDEX_HEADER_CRC, headerCrc);
    
    // Fill content
    for (let i = 0; i < cmd.length; i++) {
      view.setUint8(PROTOCOL.PACKAGE_INDEX_CONTENT + i, cmd[i]);
    }
    
    // Calculate tail CRC position
    const tailIndex = totalLen - 3;
    
    // Calculate and fill tail CRC (16-bit, little endian)
    const tailCrc = this.encryTail(Array.from(buffer.slice(0, tailIndex)));
    view.setUint16(tailIndex, tailCrc, true);
    
    // Fill end byte
    view.setUint8(totalLen - 1, PROTOCOL.ATTR_END_REQ);
    
    console.log('[Linktop SDK] Built command:', Array.from(buffer).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    return buffer;
  }

  /**
   * Header CRC - XOR of all bytes
   * Exact port of BaseCommon.encryHead
   */
  private encryHead(data: number[]): number {
    let result = 0;
    for (let i = 0; i < data.length; i++) {
      result ^= (data[i] & 0xff);
      result &= 0xffff;
    }
    return result & 0xff;
  }

  /**
   * Tail CRC - 16-bit CRC calculation
   * Exact port of BaseCommon.encryTail
   */
  private encryTail(data: number[]): number {
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

  /**
   * Connect to a Linktop health monitor device
   */
  async connect(): Promise<DeviceInfo> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      console.log('[Linktop SDK] Requesting Bluetooth device...');
      
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HC' },
          { services: [SERVICE_UUID] }
        ],
        optionalServices: [SERVICE_UUID]
      });

      console.log('[Linktop SDK] Device selected:', this.device.name);
      
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('[Linktop SDK] Device disconnected');
        this.handleDisconnect();
      });

      console.log('[Linktop SDK] Connecting to GATT server...');
      this.server = await this.device.gatt!.connect();
      console.log('[Linktop SDK] GATT server connected');
      
      // Wait for connection to stabilize
      await this.delay(500);

      console.log('[Linktop SDK] Getting primary service...');
      const service = await this.server.getPrimaryService(SERVICE_UUID);
      console.log('[Linktop SDK] Service obtained');

      // Get write characteristic
      console.log('[Linktop SDK] Getting write characteristic...');
      this.writeCharacteristic = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);
      console.log('[Linktop SDK] Write characteristic obtained');

      // Get notify characteristic and set up notifications
      console.log('[Linktop SDK] Getting notify characteristic...');
      this.notifyCharacteristic = await service.getCharacteristic(NOTIFY_CHARACTERISTIC_UUID);
      console.log('[Linktop SDK] Notify characteristic obtained');
      
      await this.notifyCharacteristic.startNotifications();
      console.log('[Linktop SDK] Notifications started');
      
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value) {
          const data = Array.from(new Uint8Array(value.buffer));
          console.log('[Linktop SDK] Data received:', data.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          this.handleDataReceived(data);
        }
      });

      this.isConnected = true;
      this.deviceInfo = {
        name: this.device.name || 'Unknown Device',
        id: this.device.id
      };

      console.log('[Linktop SDK] Device connected successfully:', this.deviceInfo);
      this.connectionCallbacks.forEach(callback => callback(true, this.deviceInfo!));

      // Wait a moment before sending any commands
      await this.delay(300);
      
      // Query battery to confirm communication
      await this.queryBattery();

      return this.deviceInfo;
    } catch (error) {
      console.error('[Linktop SDK] Connection error:', error);
      this.handleDisconnect();
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send command to device
   */
  private async sendCommand(data: Uint8Array): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Device not connected');
    }

    try {
      // Use writeValueWithoutResponse for better reliability
      await this.writeCharacteristic.writeValueWithoutResponse(data);
      console.log('[Linktop SDK] Command sent successfully');
      await this.delay(100);
    } catch (error) {
      console.error('[Linktop SDK] Error sending command:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.server = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.rawDataBuffer = [];
    this.cacheType = 0;
    this.cacheMap.clear();
    this.isEcgMeasure = false;
    this.connectionCallbacks.forEach(callback => callback(false));
  }

  /**
   * Query battery level
   */
  async queryBattery(): Promise<void> {
    const cmd = this.buildCommand(PROTOCOL.CHECK_BATTERY, [PROTOCOL.BATTERY_QUERY]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] Battery query sent');
  }

  /**
   * Start SpO2 (Blood Oxygen) measurement
   */
  async startSpO2(): Promise<void> {
    this.spo2Samples = [];
    const cmd = this.buildCommand(PROTOCOL.OX_REQ_TYPE_NORMAL, [PROTOCOL.OX_REQ_CONTENT_START_NORMAL]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] SpO2 measurement started - device should activate red LED for ~40 seconds');
  }

  /**
   * Stop SpO2 measurement
   */
  async stopSpO2(): Promise<void> {
    const cmd = this.buildCommand(PROTOCOL.OX_REQ_TYPE_NORMAL, [PROTOCOL.OX_REQ_CONTENT_STOP_NORMAL]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] SpO2 measurement stopped');
  }

  /**
   * Start ECG measurement
   */
  async startECG(): Promise<void> {
    this.isEcgMeasure = true;
    const cmd = this.buildCommand(PROTOCOL.ELECTROCARDIOGRAM, [PROTOCOL.ECG_START]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] ECG measurement started');
  }

  /**
   * Stop ECG measurement
   */
  async stopECG(): Promise<void> {
    this.isEcgMeasure = false;
    const cmd = this.buildCommand(PROTOCOL.ELECTROCARDIOGRAM, [PROTOCOL.ECG_STOP]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] ECG measurement stopped');
  }

  /**
   * Start Blood Pressure measurement
   */
  async startBloodPressure(): Promise<void> {
    // Send calibrate parameter first, then start
    const calibrateCmd = this.buildCommand(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_CALIBRATE_PARAMETER]);
    await this.sendCommand(calibrateCmd);
    await this.delay(200);
    
    const startCmd = this.buildCommand(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_START_QUICK_CHARGING_GAS]);
    await this.sendCommand(startCmd);
    console.log('[Linktop SDK] Blood Pressure measurement started');
  }

  /**
   * Stop Blood Pressure measurement
   */
  async stopBloodPressure(): Promise<void> {
    const cmd = this.buildCommand(PROTOCOL.BP_REQ_TYPE, [PROTOCOL.BP_REQ_CONTENT_STOP_CHARGING_GAS]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] Blood Pressure measurement stopped');
  }

  /**
   * Start Temperature measurement
   */
  async startTemperature(): Promise<void> {
    const cmd = this.buildCommand(PROTOCOL.TEMPERATURE, [PROTOCOL.TEP_START_NORMAL]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] Temperature measurement started');
  }

  /**
   * Stop Temperature measurement
   */
  async stopTemperature(): Promise<void> {
    const cmd = this.buildCommand(PROTOCOL.TEMPERATURE, [PROTOCOL.TEP_STOP_NORMAL]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] Temperature measurement stopped');
  }

  /**
   * Start Blood Glucose measurement
   */
  async startBloodGlucose(): Promise<void> {
    // Get version first
    const versionCmd = this.buildCommand(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_GET_VER]);
    await this.sendCommand(versionCmd);
    await this.delay(200);
    
    // Check paper
    const checkCmd = this.buildCommand(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_CHECK_PAPER]);
    await this.sendCommand(checkCmd);
    await this.delay(200);
    
    // Start ADC
    const startCmd = this.buildCommand(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_ADC_START]);
    await this.sendCommand(startCmd);
    console.log('[Linktop SDK] Blood Glucose measurement started');
  }

  /**
   * Stop Blood Glucose measurement
   */
  async stopBloodGlucose(): Promise<void> {
    const cmd = this.buildCommand(PROTOCOL.BLOOD_GLUCOSE, [PROTOCOL.TEST_PAPER_ADC_STOP]);
    await this.sendCommand(cmd);
    console.log('[Linktop SDK] Blood Glucose measurement stopped');
  }

  /**
   * Handle incoming data from device
   */
  private handleDataReceived(data: number[]): void {
    // ECG uses raw data stream, not packaged
    if (this.isEcgMeasure) {
      this.parseECGRaw(data);
      return;
    }
    
    // Parse packaged data
    this.parsePackagedData(data);
  }

  /**
   * Parse packaged data according to Flutter SDK protocol
   */
  private parsePackagedData(rawData: number[]): void {
    if (rawData.length < 9) {
      console.log('[Linktop SDK] Data too short:', rawData.length);
      return;
    }

    const view = new DataView(new Uint8Array(rawData).buffer);
    const start = view.getUint8(PROTOCOL.PACKAGE_INDEX_START);
    const length = view.getUint16(PROTOCOL.PACKAGE_INDEX_LENGTH, true);
    const btEdition = view.getUint8(PROTOCOL.PACKAGE_INDEX_BT_EDITION);
    const type = view.getUint8(PROTOCOL.PACKAGE_INDEX_TYPE);
    const headerCrc = view.getUint8(PROTOCOL.PACKAGE_INDEX_HEADER_CRC);

    // Validate header
    const checkCrc = this.encryHead(rawData.slice(0, PROTOCOL.PACKAGE_INDEX_HEADER_CRC));
    
    const isFull = btEdition === PROTOCOL.BT_EDITION && 
                   start === PROTOCOL.ATTR_START_RES && 
                   headerCrc === checkCrc &&
                   length <= 11;
    
    const isHead = isFull || (!isFull && btEdition === PROTOCOL.BT_EDITION && 
                              start === PROTOCOL.ATTR_START_RES && 
                              headerCrc === checkCrc);

    let contentData: number[] = [];

    if (isFull) {
      // Full packet - extract data directly
      contentData = rawData.slice(PROTOCOL.PACKAGE_INDEX_CONTENT, PROTOCOL.PACKAGE_INDEX_CONTENT + length);
      console.log('[Linktop SDK] Full packet received, type:', '0x' + type.toString(16), 'data:', contentData);
    } else if (isHead) {
      // First part of split packet
      this.cacheMap.clear();
      this.cacheType = type;
      this.cacheMap.set(type, rawData);
      console.log('[Linktop SDK] Head packet cached, type:', '0x' + type.toString(16));
      return;
    } else {
      // Tail of split packet
      if (this.cacheType === 0 || !this.cacheMap.has(this.cacheType)) {
        console.log('[Linktop SDK] Missing head packet for tail');
        this.cacheType = 0;
        this.cacheMap.clear();
        return;
      }
      const allData = [...this.cacheMap.get(this.cacheType)!, ...rawData];
      const fullView = new DataView(new Uint8Array(allData).buffer);
      const fullLength = fullView.getUint16(PROTOCOL.PACKAGE_INDEX_LENGTH, true);
      const fullType = fullView.getUint8(PROTOCOL.PACKAGE_INDEX_TYPE);
      contentData = allData.slice(PROTOCOL.PACKAGE_INDEX_CONTENT, PROTOCOL.PACKAGE_INDEX_CONTENT + fullLength);
      this.cacheType = 0;
      this.cacheMap.clear();
      console.log('[Linktop SDK] Merged packet, type:', '0x' + fullType.toString(16), 'data:', contentData);
      this.parseContent(fullType, contentData);
      return;
    }

    this.parseContent(type, contentData);
  }

  /**
   * Parse content based on response type
   */
  private parseContent(type: number, data: number[]): void {
    console.log('[Linktop SDK] Parsing content, type:', '0x' + type.toString(16));
    
    switch (type) {
      case PROTOCOL.RESPONSE_CHECK_BATTERY:
        this.parseBattery(data);
        break;
      case PROTOCOL.OX_RES_TYPE_NORMAL:
        this.parseSpO2(data);
        break;
      case PROTOCOL.BT_RES_TYPE:
        this.parseTemperature(data);
        break;
      case PROTOCOL.BP_RES_TYPE:
        this.parseBloodPressure(data);
        break;
      case PROTOCOL.BG_RES_TYPE:
        this.parseBloodGlucose(data);
        break;
      default:
        console.log('[Linktop SDK] Unknown response type:', '0x' + type.toString(16));
    }
  }

  private parseBattery(data: number[]): void {
    if (data.length < 2) return;
    const state = data[0];
    const level = data[1];
    console.log('[Linktop SDK] Battery - state:', state, 'level:', level + '%');
    this.emitMeasurement({ type: 'battery', data: { state, level } });
  }

  private parseSpO2(data: number[]): void {
    console.log('[Linktop SDK] SpO2 raw data:', data);
    
    if (data.length >= 30) {
      // Raw wave data - process for calculation
      const waveData: number[] = [];
      for (let i = 0; i < 30; i += 3) {
        const value = ((data[i] & 0xff) << 16) | ((data[i + 1] & 0xff) << 8) | (data[i + 2] & 0xff);
        waveData.push(value);
      }
      
      // Extract red and IR signals for SpO2 calculation
      for (let i = 0; i < waveData.length; i += 2) {
        if (i + 1 < waveData.length) {
          this.spo2Samples.push({ red: waveData[i], ir: waveData[i + 1] });
        }
      }
      
      // Calculate SpO2 when we have enough samples
      if (this.spo2Samples.length >= 50) {
        const result = this.calculateSpO2();
        if (result.oxygenLevel >= 70 && result.oxygenLevel <= 100) {
          console.log('[Linktop SDK] SpO2 result:', result);
          this.emitMeasurement({ type: 'spo2', data: result });
        }
        this.spo2Samples = [];
      }
    } else if (data.length >= 2) {
      // Direct SpO2 result
      const oxygenLevel = data[0];
      const heartRate = data[1];
      
      if (oxygenLevel >= 70 && oxygenLevel <= 100 && heartRate >= 40 && heartRate <= 200) {
        console.log('[Linktop SDK] SpO2 direct result - O2:', oxygenLevel, 'HR:', heartRate);
        this.emitMeasurement({ type: 'spo2', data: { oxygenLevel, heartRate } });
      }
    }
  }

  /**
   * Calculate SpO2 from red/IR samples
   */
  private calculateSpO2(): SpO2Data {
    if (this.spo2Samples.length === 0) {
      return { oxygenLevel: 0, heartRate: 0 };
    }

    // Calculate AC and DC components
    let redAc = 0, redDc = 0, irAc = 0, irDc = 0;
    
    for (const sample of this.spo2Samples) {
      redDc += sample.red;
      irDc += sample.ir;
    }
    redDc /= this.spo2Samples.length;
    irDc /= this.spo2Samples.length;
    
    for (const sample of this.spo2Samples) {
      redAc += Math.abs(sample.red - redDc);
      irAc += Math.abs(sample.ir - irDc);
    }
    redAc /= this.spo2Samples.length;
    irAc /= this.spo2Samples.length;
    
    // Calculate R ratio and SpO2
    const R = (redAc / redDc) / (irAc / irDc);
    const oxygenLevel = Math.min(100, Math.max(70, Math.round(110 - 25 * R)));
    
    // Estimate heart rate from sample timing (assuming ~125Hz sampling)
    const heartRate = 72; // Default, would need actual peak detection
    
    return { oxygenLevel, heartRate };
  }

  private parseECGRaw(data: number[]): void {
    console.log('[Linktop SDK] ECG raw data:', data);
    
    // ECG data comes as raw samples
    if (data.length < 4) return;
    
    const heartRate = data[0];
    const smoothedWave = (data[1] << 8) | data[2];
    
    if (heartRate >= 30 && heartRate <= 220) {
      const ecgData: ECGData = {
        heartRate,
        smoothedWave,
        rrMax: 0,
        rrMin: 0,
        hrv: data.length > 3 ? data[3] : 0,
        mood: data.length > 5 ? data[5] : 0,
        heartAge: 0,
        stress: data.length > 4 ? data[4] : 0,
        breathRate: data.length > 6 ? data[6] : 0,
        r2rInterval: 0,
        fingerTouch: true,
      };
      console.log('[Linktop SDK] ECG result:', ecgData);
      this.emitMeasurement({ type: 'ecg', data: ecgData });
    }
  }

  private parseTemperature(data: number[]): void {
    console.log('[Linktop SDK] Temperature raw data:', data);
    
    if (data.length < 2) return;
    
    const tempInt = data[0];
    const tempDec = data[1];
    const temperature = parseFloat((tempInt + (tempDec / 100)).toFixed(2));
    
    if (temperature >= 30 && temperature <= 45) {
      console.log('[Linktop SDK] Temperature result:', temperature, '°C');
      this.emitMeasurement({ type: 'temperature', data: { temperature } });
    }
  }

  private parseBloodPressure(data: number[]): void {
    console.log('[Linktop SDK] Blood Pressure raw data:', data);
    
    if (data.length < 1) return;
    
    const subType = data[0];
    
    if (subType === 0x01 && data.length >= 4) { // Calibration parameter response
      // Calibration data received
      console.log('[Linktop SDK] BP calibration data received');
    } else if (data.length >= 4) {
      // Pressure reading
      const systolic = data[1];
      const diastolic = data[2];
      const heartRate = data[3];
      
      if (systolic >= 50 && systolic <= 250 && diastolic >= 30 && diastolic <= 180) {
        console.log('[Linktop SDK] BP result - SYS:', systolic, 'DIA:', diastolic, 'HR:', heartRate);
        this.emitMeasurement({ type: 'bloodPressure', data: { systolic, diastolic, heartRate } });
      }
    }
  }

  private parseBloodGlucose(data: number[]): void {
    console.log('[Linktop SDK] Blood Glucose raw data:', data);
    
    if (data.length < 2) return;
    
    const valueHigh = data[0];
    const valueLow = data[1];
    const value = Math.round(((valueHigh << 8) | valueLow) / 10);
    
    if (value >= 20 && value <= 600) {
      console.log('[Linktop SDK] Glucose result:', value, 'mg/dL');
      this.emitMeasurement({ type: 'bloodGlucose', data: { value, unit: 'mg/dL' } });
    }
  }

  private emitMeasurement(measurement: MeasurementData): void {
    this.measurementCallbacks.forEach(callback => callback(measurement));
  }

  onMeasurement(id: string, callback: MeasurementCallback): void {
    this.measurementCallbacks.set(id, callback);
  }

  offMeasurement(id: string): void {
    this.measurementCallbacks.delete(id);
  }

  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.add(callback);
  }

  offConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.delete(callback);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }
}

export const linktopSdk = new LinktopSDK();
export default linktopSdk;
