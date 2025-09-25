/**
 * HC03 Flutter SDK Integration for Web
 * Based on HC03_Flutter SDK API Guide v1.0
 * 
 * This service provides BLE connectivity and data processing
 * for HC03 health monitoring devices
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

// HC03 SDK Main Class
export class Hc03Sdk {
  private static instance: Hc03Sdk;
  private device: any | null = null;
  private server: any | null = null;
  private isConnected: boolean = false;
  private callbacks: Map<Detection, (data: any) => void> = new Map();
  private activeDetections: Set<Detection> = new Set();

  private constructor() {}

  // Singleton getInstance method as per API documentation
  public static getInstance(): Hc03Sdk {
    if (!Hc03Sdk.instance) {
      Hc03Sdk.instance = new Hc03Sdk();
    }
    return Hc03Sdk.instance;
  }

  // Initialize HC03 SDK
  public async initialize(): Promise<void> {
    if (!(navigator as any).bluetooth) {
      throw new Error('Bluetooth not supported in this browser');
    }
  }

  // Connect to HC03 device via BLE
  public async connectDevice(): Promise<any> {
    try {
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HC03' },
          { namePrefix: 'Health' },
          { services: ['0000fff0-0000-1000-8000-00805f9b34fb'] } // HC03 service UUID
        ],
        optionalServices: [
          'battery_service',
          'device_information',
          'health_thermometer',
          '0000fff1-0000-1000-8000-00805f9b34fb', // HC03 data service
          '0000fff2-0000-1000-8000-00805f9b34fb'  // HC03 control service
        ]
      });

      this.server = await this.device.gatt!.connect();
      this.isConnected = true;

      // Set up disconnect handler with reconnection attempt
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.server = null;
        
        // Attempt automatic reconnection after 3 seconds
        setTimeout(() => {
          this.attemptReconnection();
        }, 3000);
      });

      // Start connection health monitoring
      this.startConnectionHealthCheck();

      return this.device;
    } catch (error) {
      throw new Error(`Failed to connect to HC03 device: ${error}`);
    }
  }

  // Connection health monitoring
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  private startConnectionHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      if (!this.isConnected || !this.device) {
        return;
      }
      
      // Check if device is still connected
      if (!this.device.gatt.connected) {
        this.isConnected = false;
        this.server = null;
      }
    }, 10000); // Check every 10 seconds
  }

  // Automatic reconnection logic
  private async attemptReconnection(): Promise<void> {
    if (this.isConnected || !this.device) {
      return;
    }

    try {
      console.log('Attempting to reconnect to HC03 device...');
      this.server = await this.device.gatt!.connect();
      this.isConnected = true;
      console.log('HC03 device reconnected successfully');
      
      // Restart active detections
      for (const detection of Array.from(this.activeDetections)) {
        await this.startDetect(detection);
      }
    } catch (error) {
      console.error('Failed to reconnect to HC03 device:', error);
      
      // Try again in 30 seconds
      setTimeout(() => {
        this.attemptReconnection();
      }, 30000);
    }
  }

  // Start detection as per HC03 API
  public async startDetect(detection: Detection): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    this.activeDetections.add(detection);

    switch (detection) {
      case Detection.ECG:
        await this.startECGDetection();
        break;
      case Detection.OX:
        await this.startBloodOxygenDetection();
        break;
      case Detection.BP:
        await this.startBloodPressureDetection();
        break;
      case Detection.BT:
        await this.startTemperatureDetection();
        break;
      case Detection.BATTERY:
        await this.startBatteryDetection();
        break;
      case Detection.BG:
        await this.startBloodGlucoseDetection();
        break;
    }
  }

  // Stop detection as per HC03 API
  public async stopDetect(detection: Detection): Promise<void> {
    this.activeDetections.delete(detection);
    // Implementation depends on specific BLE characteristics
  }

  // Parse incoming data as per HC03 API
  public parseData(data: ArrayBuffer): void {
    // Parse BLE data according to HC03 protocol
    const view = new DataView(data);
    const command = view.getUint8(0);
    
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
      case 0x05: // Battery data
        this.parseBatteryData(data);
        break;
      case 0x06: // Blood glucose data
        this.parseBloodGlucoseData(data);
        break;
    }
  }

  // ECG Detection Methods
  private async startECGDetection(): Promise<void> {
    if (!this.server) return;
    
    try {
      const service = await this.server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000fff3-0000-1000-8000-00805f9b34fb'); // ECG data characteristic
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.parseECGData(event.target.value.buffer);
      });
    } catch (error) {
      console.error('Failed to start ECG detection:', error);
      throw error;
    }
  }

  public getEcgData(): ECGData | null {
    // Return latest ECG data
    return null;
  }

  private parseECGData(data: ArrayBuffer): void {
    // Parse ECG data according to HC03 protocol
    const view = new DataView(data);
    const waveData: number[] = [];
    
    // HC03 ECG data format (adjust based on actual device protocol)
    if (data.byteLength >= 20) {
      const hr = view.getUint16(0, true); // Heart rate (little endian)
      const moodIndex = view.getUint8(2); // Mood index
      const rr = view.getUint16(3, true); // RR interval
      const hrv = view.getUint16(5, true); // HRV
      const respiratoryRate = view.getUint8(7); // Respiratory rate
      const touch = view.getUint8(8) === 1; // Finger detection
      
      // Parse wave data (remaining bytes)
      for (let i = 9; i < data.byteLength; i++) {
        waveData.push(view.getUint8(i));
      }
      
      const ecgData: ECGData = {
        wave: waveData,
        hr: hr,
        moodIndex: Math.min(100, Math.max(1, moodIndex)),
        rr: rr,
        hrv: hrv,
        respiratoryRate: respiratoryRate,
        touch: touch
      };

      const callback = this.callbacks.get(Detection.ECG);
      if (callback) {
        callback(ecgData);
      }
    }
  }

  // Blood Oxygen Detection Methods
  private async startBloodOxygenDetection(): Promise<void> {
    if (!this.server) return;
    
    try {
      const service = await this.server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000fff4-0000-1000-8000-00805f9b34fb'); // Blood oxygen characteristic
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.parseBloodOxygenData(event.target.value.buffer);
      });
    } catch (error) {
      console.error('Failed to start blood oxygen detection:', error);
      throw error;
    }
  }

  public getBloodOxygen(): BloodOxygenData | null {
    // Return latest blood oxygen data
    return null;
  }

  private parseBloodOxygenData(data: ArrayBuffer): void {
    const view = new DataView(data);
    const waveData: number[] = [];
    
    // HC03 Blood Oxygen data format
    if (data.byteLength >= 8) {
      const bloodOxygen = view.getUint8(0); // SpO2 percentage
      const heartRate = view.getUint16(1, true); // Heart rate
      const fingerDetection = view.getUint8(3) === 1; // Finger detection
      
      // Parse wave data (remaining bytes)
      for (let i = 4; i < data.byteLength; i++) {
        waveData.push(view.getUint8(i));
      }
      
      const bloodOxygenData: BloodOxygenData = {
        bloodOxygen: Math.min(100, Math.max(0, bloodOxygen)),
        heartRate: heartRate,
        fingerDetection: fingerDetection,
        bloodOxygenWaveData: waveData
      };

      const callback = this.callbacks.get(Detection.OX);
      if (callback) {
        callback(bloodOxygenData);
      }
    }
  }

  // Blood Pressure Detection Methods
  private async startBloodPressureDetection(): Promise<void> {
    if (!this.server) return;
    
    try {
      const service = await this.server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000fff5-0000-1000-8000-00805f9b34fb'); // Blood pressure characteristic
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.parseBloodPressureData(event.target.value.buffer);
      });
    } catch (error) {
      console.error('Failed to start blood pressure detection:', error);
      throw error;
    }
  }

  public getBloodPressureData(): BloodPressureData | null {
    // Return latest blood pressure data
    return null;
  }

  private parseBloodPressureData(data: ArrayBuffer): void {
    const view = new DataView(data);
    
    // HC03 Blood Pressure data format
    if (data.byteLength >= 8) {
      const systolic = view.getUint16(0, true); // Systolic pressure
      const diastolic = view.getUint16(2, true); // Diastolic pressure
      const heartRate = view.getUint16(4, true); // Heart rate
      const progress = view.getUint8(6); // Measurement progress (0-100)
      
      const bloodPressureData: BloodPressureData = {
        ps: systolic,
        pd: diastolic,
        hr: heartRate,
        progress: progress
      };

      const callback = this.callbacks.get(Detection.BP);
      if (callback) {
        callback(bloodPressureData);
      }
    }
  }

  // Blood Glucose Detection Methods
  private async startBloodGlucoseDetection(): Promise<void> {
    // Implementation for blood glucose characteristic subscription
  }

  public getBloodGlucoseData(): BloodGlucoseData | null {
    // Return latest blood glucose data
    return null;
  }

  private parseBloodGlucoseData(data: ArrayBuffer): void {
    const bloodGlucoseData: BloodGlucoseData = {
      bloodGlucoseSendData: {},
      bloodGlucosePaperState: "ready",
      bloodGlucosePaperData: 0
    };

    const callback = this.callbacks.get(Detection.BG);
    if (callback) {
      callback(bloodGlucoseData);
    }
  }

  // Temperature Detection Methods
  private async startTemperatureDetection(): Promise<void> {
    if (!this.server) return;
    
    try {
      const service = await this.server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000fff6-0000-1000-8000-00805f9b34fb'); // Temperature characteristic
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.parseTemperatureData(event.target.value.buffer);
      });
    } catch (error) {
      console.error('Failed to start temperature detection:', error);
      throw error;
    }
  }

  public getTemperature(): TemperatureData | null {
    // Return latest temperature data
    return null;
  }

  private parseTemperatureData(data: ArrayBuffer): void {
    const view = new DataView(data);
    
    // HC03 Temperature data format
    if (data.byteLength >= 4) {
      // Temperature in Celsius * 100 (e.g., 3650 = 36.50°C)
      const tempRaw = view.getUint16(0, true);
      const temperature = tempRaw / 100;
      
      const temperatureData: TemperatureData = {
        temperature: Math.round(temperature * 10) / 10 // Round to 1 decimal
      };

      const callback = this.callbacks.get(Detection.BT);
      if (callback) {
        callback(temperatureData);
      }
    }
  }

  // Battery Detection Methods
  private async startBatteryDetection(): Promise<void> {
    if (!this.server) return;
    
    try {
      const service = await this.server.getPrimaryService('battery_service');
      const characteristic = await service.getCharacteristic('battery_level');
      
      const batteryLevel = await characteristic.readValue();
      const level = batteryLevel.getUint8(0);
      
      // Also set up notifications for battery changes
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.parseBatteryData(event.target.value.buffer);
      });
      
      // Initial battery data
      const initialBatteryData: BatteryData = {
        batteryLevel: level,
        chargingStatus: false // Will be updated by notifications
      };
      
      const callback = this.callbacks.get(Detection.BATTERY);
      if (callback) {
        callback(initialBatteryData);
      }
    } catch (error) {
      console.error('Failed to start battery detection:', error);
      throw error;
    }
  }

  public getBattery(): BatteryData | null {
    // Return latest battery data
    return null;
  }

  private parseBatteryData(data: ArrayBuffer): void {
    const view = new DataView(data);
    
    // Battery data format
    if (data.byteLength >= 2) {
      const batteryLevel = view.getUint8(0); // Battery percentage
      const chargingStatus = view.getUint8(1) === 1; // Charging status
      
      const batteryData: BatteryData = {
        batteryLevel: Math.min(100, Math.max(0, batteryLevel)),
        chargingStatus: chargingStatus
      };

      const callback = this.callbacks.get(Detection.BATTERY);
      if (callback) {
        callback(batteryData);
      }
    }
  }

  // Callback registration
  public setCallback(detection: Detection, callback: (data: any) => void): void {
    this.callbacks.set(detection, callback);
  }

  // Utility methods
  public isDeviceConnected(): boolean {
    return this.isConnected;
  }

  public getConnectedDevice(): any | null {
    return this.device;
  }

  public async disconnect(): Promise<void> {
    // Stop health check monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Stop all active detections
    this.activeDetections.clear();
    
    if (this.server) {
      this.server.disconnect();
    }
    
    this.isConnected = false;
    this.device = null;
    this.server = null;
  }

  // Get connection status with details
  public getConnectionStatus(): {
    connected: boolean;
    deviceName?: string;
    deviceId?: string;
    signalStrength?: number;
  } {
    return {
      connected: this.isConnected,
      deviceName: this.device?.name || undefined,
      deviceId: this.device?.id || undefined,
      signalStrength: this.isConnected ? 100 : 0 // Placeholder - BLE doesn't provide signal strength directly
    };
  }

  // Get active detections
  public getActiveDetections(): Detection[] {
    return Array.from(this.activeDetections);
  }

  // Mood index interpretation as per API documentation
  public getMoodDescription(moodIndex: number): string {
    if (moodIndex >= 1 && moodIndex <= 20) return 'Chill';
    if (moodIndex >= 21 && moodIndex <= 40) return 'Relax';
    if (moodIndex >= 41 && moodIndex <= 60) return 'Balance';
    if (moodIndex >= 61 && moodIndex <= 80) return 'Excitation';
    if (moodIndex >= 81 && moodIndex <= 100) return 'Excitement/Anxiety/Excitement';
    return 'Unknown';
  }
}

// Export singleton instance
export const hc03Sdk = Hc03Sdk.getInstance();