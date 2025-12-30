/**
 * Linktop Health Monitor SDK v2.6.4
 * Web Bluetooth implementation for HC02/HC03 devices
 * Extracted from BleDev_release_v2.6.4.aar
 */

export const UUIDConfig = {
  HRP_SERVICE: '0000ff27-0000-1000-8000-00805f9b34fb',
  HEART_RATE_WRITE_CHARA: '0000fff1-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT_CHARA: '0000fff4-0000-1000-8000-00805f9b34fb',
  CCCD_UUID: '00002902-0000-1000-8000-00805f9b34fb',
  DEV_INFO_SER_UUID: '0000180a-0000-1000-8000-00805f9b34fb',
  DEV_INFO_FIRMWARE_REV_UUID: '00002a26-0000-1000-8000-00805f9b34fb',
  DEV_INFO_HARDWARE_PCB_UUID: '00002a27-0000-1000-8000-00805f9b34fb',
  DEV_INFO_SOFTWARE_REV_UUID: '00002a28-0000-1000-8000-00805f9b34fb',
  THERM_SERVICE: '0000fff0-0000-1000-8000-00805f9b34fb',
  THERM_CONNECT_CONFIRM: '0000fff5-0000-1000-8000-00805f9b34fb',
};

export enum MeasureType {
  BATTERY = 0x01,
  ECG = 0x02,
  SPO2 = 0x03,
  BLOOD_PRESSURE = 0x04,
  TEMPERATURE = 0x05,
  BLOOD_GLUCOSE = 0x06,
}

export enum ECGAlgoKey {
  HEART_AGE = 'ECG_KEY_HEART_AGE',
  HEART_BEAT = 'ECG_KEY_HEART_BEAT',
  HEART_RATE = 'ECG_KEY_HEART_RATE',
  HRV = 'ECG_KEY_HRV',
  MOOD = 'ECG_KEY_MOOD',
  R2R = 'ECG_KEY_R2R',
  RESPIRATORY_RATE = 'ECG_KEY_RESPIRATORY_RATE',
  STRESS = 'ECG_KEY_STRESS',
  SMOOTH = 'ECG_KEY_SMOOTH',
}

export enum BatteryState {
  NORMAL = 0,
  CHARGING = 1,
  CHARGE_FULL = 2,
}

export interface BatteryData {
  state: BatteryState;
  level: number;
}

export interface ECGData {
  heartRate: number;
  rrMax: number;
  rrMin: number;
  hrv: number;
  mood: number;
  heartAge: number;
  stress: number;
  breathRate: number;
  r2rInterval: number;
  smoothedWave: number;
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

export interface DeviceInfo {
  name: string;
  id: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
}

type MeasurementCallback = (data: MeasurementData) => void;
type ConnectionCallback = (connected: boolean) => void;

class LinktopSDK {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private measurementCallbacks: Map<string, MeasurementCallback> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private isConnected: boolean = false;
  private deviceInfo: DeviceInfo | null = null;
  private rawDataBuffer: number[] = [];
  private currentMeasurement: MeasureType | null = null;
  private spo2Samples: { wave: number; timestamp: number }[] = [];
  
  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async requestDevice(): Promise<DeviceInfo | null> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HC02' },
          { namePrefix: 'HC03' },
          { namePrefix: 'HC-' },
          { services: [UUIDConfig.HRP_SERVICE] },
        ],
        optionalServices: [
          UUIDConfig.HRP_SERVICE,
          UUIDConfig.DEV_INFO_SER_UUID,
          UUIDConfig.THERM_SERVICE,
        ],
      });

      if (this.device) {
        this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
        this.deviceInfo = {
          name: this.device.name || 'Unknown Device',
          id: this.device.id,
        };
        return this.deviceInfo;
      }
      return null;
    } catch (error) {
      console.error('Error requesting device:', error);
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.device) {
      throw new Error('No device selected. Call requestDevice() first.');
    }

    try {
      console.log('[Linktop SDK] Connecting to device...');
      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('[Linktop SDK] GATT server connected');
      const service = await this.server.getPrimaryService(UUIDConfig.HRP_SERVICE);
      console.log('[Linktop SDK] Service discovered');
      
      this.writeCharacteristic = await service.getCharacteristic(UUIDConfig.HEART_RATE_WRITE_CHARA);
      this.notifyCharacteristic = await service.getCharacteristic(UUIDConfig.HEART_RATE_MEASUREMENT_CHARA);

      console.log('[Linktop SDK] Characteristics found, starting notifications...');
      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));

      // Give device time to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const deviceInfoService = await this.server.getPrimaryService(UUIDConfig.DEV_INFO_SER_UUID);
        const firmwareChar = await deviceInfoService.getCharacteristic(UUIDConfig.DEV_INFO_FIRMWARE_REV_UUID);
        const firmwareValue = await firmwareChar.readValue();
        if (this.deviceInfo) {
          this.deviceInfo.firmwareVersion = new TextDecoder().decode(firmwareValue);
          console.log('[Linktop SDK] Firmware version:', this.deviceInfo.firmwareVersion);
        }
      } catch (e) {
        console.log('[Linktop SDK] Device info service not available (optional)');
      }

      this.isConnected = true;
      this.notifyConnectionChange(true);
      console.log('[Linktop SDK] Device connected successfully');
      
      // Query battery after brief delay
      await new Promise(resolve => setTimeout(resolve, 300));
      await this.requestBattery();
      
      return true;
    } catch (error) {
      console.error('[Linktop SDK] Error connecting:', error);
      this.isConnected = false;
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.isConnected = false;
    this.notifyConnectionChange(false);
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.notifyConnectionChange(false);
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  private async sendCommand(bytes: number[]): Promise<void> {
    if (!this.writeCharacteristic) {
      console.error('[Linktop SDK] Cannot send command - not connected');
      throw new Error('Not connected');
    }
    console.log('[Linktop SDK] Sending command:', bytes.map(b => b.toString(16).padStart(2, '0')).join(' '));
    const command = new Uint8Array(bytes);
    try {
      // Use writeValueWithoutResponse for Linktop devices (most reliable)
      if (this.writeCharacteristic.properties.writeWithoutResponse) {
        await this.writeCharacteristic.writeValueWithoutResponse(command);
      } else if (this.writeCharacteristic.properties.write) {
        await this.writeCharacteristic.writeValueWithResponse(command);
      } else {
        await this.writeCharacteristic.writeValue(command);
      }
      console.log('[Linktop SDK] Command sent successfully');
      // Add delay to ensure device processes command
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('[Linktop SDK] Error sending command:', error);
      throw error;
    }
  }

  async requestBattery(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = MeasureType.BATTERY;
  }

  async startECG(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = MeasureType.ECG;
  }

  async stopECG(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = null;
  }

  async startSpO2(): Promise<void> {
    console.log('[Linktop SDK] Starting SpO2 measurement...');
    this.spo2Samples = [];
    try {
      await this.sendCommand([0xAA, 0x17, 0x03, 0x01, 0x00, 0x00, 0x00, 0x00, 0xD1]);
      this.currentMeasurement = MeasureType.SPO2;
      console.log('[Linktop SDK] SpO2 measurement started - device should activate red LED');
    } catch (error) {
      console.error('[Linktop SDK] Failed to start SpO2:', error);
      throw error;
    }
  }

  async stopSpO2(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = null;
  }

  async startBloodPressure(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = MeasureType.BLOOD_PRESSURE;
  }

  async stopBloodPressure(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = null;
  }

  async startTemperature(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x05, 0x01, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = MeasureType.TEMPERATURE;
  }

  async stopTemperature(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = null;
  }

  async startBloodGlucose(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x06, 0x01, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = MeasureType.BLOOD_GLUCOSE;
  }

  async stopBloodGlucose(): Promise<void> {
    await this.sendCommand([0xAA, 0x17, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD1]);
    this.currentMeasurement = null;
  }

  private handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const bytes = new Uint8Array(value.buffer);
    console.log('[Linktop SDK] Raw data received:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
    this.processIncomingData(bytes);
  }

  private processIncomingData(bytes: Uint8Array): void {
    for (let i = 0; i < bytes.length; i++) {
      this.rawDataBuffer.push(bytes[i]);
    }

    while (this.rawDataBuffer.length >= 2) {
      const startIdx = this.rawDataBuffer.findIndex(b => b === 0xAA);
      if (startIdx === -1) {
        this.rawDataBuffer = [];
        return;
      }
      if (startIdx > 0) {
        this.rawDataBuffer = this.rawDataBuffer.slice(startIdx);
      }

      if (this.rawDataBuffer.length < 9) return;

      const frameLen = this.rawDataBuffer[1];
      const totalLen = frameLen + 2;
      
      if (this.rawDataBuffer.length < totalLen) return;

      const frame = this.rawDataBuffer.slice(0, totalLen);
      this.rawDataBuffer = this.rawDataBuffer.slice(totalLen);

      this.parseFrame(frame);
    }
  }

  private parseFrame(frame: number[]): void {
    if (frame[0] !== 0xAA) return;
    
    const cmd = frame[2];
    const data = frame.slice(3, frame.length - 1);

    switch (cmd) {
      case MeasureType.BATTERY:
        this.parseBattery(data);
        break;
      case MeasureType.ECG:
        this.parseECG(data);
        break;
      case MeasureType.SPO2:
        this.parseSpO2(data);
        break;
      case MeasureType.BLOOD_PRESSURE:
        this.parseBloodPressure(data);
        break;
      case MeasureType.TEMPERATURE:
        this.parseTemperature(data);
        break;
      case MeasureType.BLOOD_GLUCOSE:
        this.parseBloodGlucose(data);
        break;
    }
  }

  private parseBattery(data: number[]): void {
    if (data.length < 2) return;
    
    const state = data[0] as BatteryState;
    const level = data[1];
    
    const batteryData: BatteryData = { state, level };
    this.emitMeasurement({ type: 'battery', data: batteryData });
  }

  private parseECG(data: number[]): void {
    if (data.length < 4) return;

    const subType = data[0];
    
    if (subType === 0x01) {
      const heartRate = data[1];
      const smoothedWave = (data[2] << 8) | data[3];
      
      const ecgData: ECGData = {
        heartRate,
        smoothedWave,
        rrMax: 0,
        rrMin: 0,
        hrv: 0,
        mood: 0,
        heartAge: 0,
        stress: 0,
        breathRate: 0,
        r2rInterval: 0,
        fingerTouch: true,
      };
      
      if (data.length >= 8) {
        ecgData.hrv = data[4];
        ecgData.stress = data[5];
        ecgData.mood = data[6];
        ecgData.breathRate = data[7];
      }
      
      this.emitMeasurement({ type: 'ecg', data: ecgData });
    }
  }

  private parseSpO2(data: number[]): void {
    console.log('[Linktop SDK] SpO2 data received:', data);
    if (data.length < 3) return;

    const subType = data[0];
    
    if (subType === 0x01) {
      const oxygenLevel = data[1];
      const heartRate = data[2];
      console.log('[Linktop SDK] SpO2 values - O2:', oxygenLevel, 'HR:', heartRate);
      
      if (oxygenLevel >= 70 && oxygenLevel <= 100 && heartRate >= 40 && heartRate <= 200) {
        const spo2Data: SpO2Data = { oxygenLevel, heartRate };
        console.log('[Linktop SDK] Emitting SpO2 measurement:', spo2Data);
        this.emitMeasurement({ type: 'spo2', data: spo2Data });
      } else {
        console.log('[Linktop SDK] SpO2 values out of range, not emitting');
      }
    } else if (subType === 0x02) {
      const waveValue = data[1];
      this.spo2Samples.push({ wave: waveValue, timestamp: Date.now() });
      
      if (this.spo2Samples.length >= 50) {
        const avgWave = this.spo2Samples.reduce((sum, s) => sum + s.wave, 0) / this.spo2Samples.length;
        const spo2Data: SpO2Data = { 
          oxygenLevel: 0, 
          heartRate: 0, 
          waveValue: avgWave 
        };
        this.emitMeasurement({ type: 'spo2', data: spo2Data });
        this.spo2Samples = [];
      }
    }
  }

  private parseBloodPressure(data: number[]): void {
    if (data.length < 4) return;

    const subType = data[0];
    
    if (subType === 0x01) {
      const systolic = data[1];
      const diastolic = data[2];
      const heartRate = data[3];
      
      if (systolic >= 70 && systolic <= 200 && diastolic >= 40 && diastolic <= 130) {
        const bpData: BloodPressureData = { systolic, diastolic, heartRate };
        this.emitMeasurement({ type: 'bloodPressure', data: bpData });
      }
    }
  }

  private parseTemperature(data: number[]): void {
    if (data.length < 3) return;

    const subType = data[0];
    
    if (subType === 0x01) {
      const tempInt = data[1];
      const tempDec = data[2];
      const temperature = tempInt + (tempDec / 100);
      
      if (temperature >= 30 && temperature <= 45) {
        const tempData: TemperatureData = { temperature };
        this.emitMeasurement({ type: 'temperature', data: tempData });
      }
    }
  }

  private parseBloodGlucose(data: number[]): void {
    if (data.length < 3) return;

    const subType = data[0];
    
    if (subType === 0x01) {
      const valueHigh = data[1];
      const valueLow = data[2];
      const value = ((valueHigh << 8) | valueLow) / 10;
      
      const glucoseData: BloodGlucoseData = { value, unit: 'mg/dL' };
      this.emitMeasurement({ type: 'bloodGlucose', data: glucoseData });
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
