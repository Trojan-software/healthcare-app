import { storage } from './storage';

// Battery Data Types
interface BatteryLevelDataPayload {
  deviceId: string;
  patientId: string;
  batteryLevel: number; // 0-100 percentage
  timestamp: Date;
  voltage?: number;
  capacity?: number;
}

interface BatteryChargingStatusPayload {
  deviceId: string;
  patientId: string;
  isCharging: boolean;
  chargingMethod?: 'usb' | 'wireless' | 'dock';
  estimatedTimeToFull?: number; // minutes
  timestamp: Date;
}

// Callback function types
type BatteryLevelDataCallback = (payload: BatteryLevelDataPayload) => Promise<void>;
type BatteryChargingStatusCallback = (payload: BatteryChargingStatusPayload) => Promise<void>;

export class BatteryManager {
  private batteryLevelCallback?: BatteryLevelDataCallback;
  private batteryChargingCallback?: BatteryChargingStatusCallback;

  constructor() {
    this.initializeDefaultCallbacks();
  }

  // Initialize default callback implementations
  private initializeDefaultCallbacks() {
    this.batteryLevelCallback = this.defaultBatteryLevelCallback;
    this.batteryChargingCallback = this.defaultBatteryChargingCallback;
  }

  // Default BatteryLevelData callback - processes battery level updates
  private async defaultBatteryLevelCallback(payload: BatteryLevelDataPayload): Promise<void> {
    try {
      console.log(`[HC03] Battery level update for device ${payload.deviceId}: ${payload.batteryLevel}%`);
      
      // Validate battery level
      if (payload.batteryLevel < 0 || payload.batteryLevel > 100) {
        console.warn(`[HC03] Invalid battery level: ${payload.batteryLevel}%`);
        return;
      }
      
      // Update device battery status in database
      await storage.updateDeviceBattery(payload.deviceId, payload.batteryLevel, false);
      
      // Check for low battery alerts
      if (payload.batteryLevel <= 20) {
        console.warn(`[HC03] Low battery alert for device ${payload.deviceId}: ${payload.batteryLevel}%`);
        
        // Create low battery alert
        await storage.createAlert({
          patientId: payload.patientId,
          alertType: 'low_battery',
          severity: payload.batteryLevel <= 10 ? 'critical' : 'medium',
          message: `Device ${payload.deviceId} battery level is ${payload.batteryLevel}%`,
          isResolved: false,
          timestamp: payload.timestamp
        });
      }
      
      // Update device status based on battery level
      let deviceStatus = 'active';
      if (payload.batteryLevel <= 5) {
        deviceStatus = 'battery_critical';
      } else if (payload.batteryLevel <= 15) {
        deviceStatus = 'battery_low';
      } else if (payload.batteryLevel >= 95) {
        deviceStatus = 'battery_full';
      }
      
      await storage.updateDeviceStatus(payload.deviceId, deviceStatus);
      
      console.log(`[HC03] Battery level ${payload.batteryLevel}% recorded for device ${payload.deviceId}`);
      
    } catch (error) {
      console.error('[HC03] Error in BatteryLevelData callback:', error);
    }
  }

  // Default BatteryChargingStatus callback - handles charging status updates
  private async defaultBatteryChargingCallback(payload: BatteryChargingStatusPayload): Promise<void> {
    try {
      const chargingText = payload.isCharging ? 'started' : 'stopped';
      console.log(`[HC03] Charging ${chargingText} for device ${payload.deviceId}`);
      
      if (payload.chargingMethod) {
        console.log(`[HC03] Charging method: ${payload.chargingMethod}`);
      }
      
      if (payload.estimatedTimeToFull && payload.isCharging) {
        console.log(`[HC03] Estimated time to full charge: ${payload.estimatedTimeToFull} minutes`);
      }
      
      // Update device charging status in database
      await storage.updateDeviceBattery(payload.deviceId, null, payload.isCharging);
      
      // Update device status based on charging state
      const deviceStatus = payload.isCharging ? 'charging' : 'active';
      await storage.updateDeviceStatus(payload.deviceId, deviceStatus);
      
      // Log charging event
      const chargingEvent = {
        deviceId: payload.deviceId,
        patientId: payload.patientId,
        eventType: payload.isCharging ? 'charging_started' : 'charging_stopped',
        chargingMethod: payload.chargingMethod,
        estimatedTimeToFull: payload.estimatedTimeToFull,
        timestamp: payload.timestamp
      };
      
      console.log(`[HC03] Charging status updated successfully for device ${payload.deviceId}`);
      
    } catch (error) {
      console.error('[HC03] Error in BatteryChargingStatus callback:', error);
    }
  }

  // Public method to get battery information
  async getBattery(deviceId: string): Promise<{level: number, isCharging: boolean} | null> {
    try {
      const device = await storage.getHc03Device(deviceId);
      if (!device) {
        console.error(`[HC03] Device ${deviceId} not found`);
        return null;
      }
      
      return {
        level: device.batteryLevel || 0,
        isCharging: device.chargingStatus || false
      };
    } catch (error) {
      console.error('[HC03] Error retrieving battery information:', error);
      return null;
    }
  }

  // Simulate battery level update
  async simulateBatteryLevel(deviceId: string, patientId: string, batteryLevel: number): Promise<void> {
    if (this.batteryLevelCallback) {
      await this.batteryLevelCallback({
        deviceId,
        patientId,
        batteryLevel,
        timestamp: new Date(),
        voltage: (batteryLevel / 100) * 4.2, // Simulate Li-ion voltage
        capacity: Math.floor((batteryLevel / 100) * 3000) // Simulate mAh capacity
      });
    }
  }

  // Simulate charging status change
  async simulateChargingStatus(deviceId: string, patientId: string, isCharging: boolean, method?: 'usb' | 'wireless' | 'dock'): Promise<void> {
    if (this.batteryChargingCallback) {
      const estimatedTimeToFull = isCharging ? Math.floor(Math.random() * 120) + 30 : undefined; // 30-150 minutes
      
      await this.batteryChargingCallback({
        deviceId,
        patientId,
        isCharging,
        chargingMethod: method || 'usb',
        estimatedTimeToFull,
        timestamp: new Date()
      });
    }
  }

  // Simulate realistic battery drain over time
  async simulateBatteryDrain(deviceId: string, patientId: string): Promise<void> {
    const currentBattery = await this.getBattery(deviceId);
    if (!currentBattery) return;

    // Simulate 1-3% battery drain
    const drainAmount = Math.floor(Math.random() * 3) + 1;
    const newLevel = Math.max(0, currentBattery.level - drainAmount);
    
    await this.simulateBatteryLevel(deviceId, patientId, newLevel);
  }

  // Get battery status for all devices of a patient
  async getPatientDevicesBattery(patientId: string): Promise<Array<{deviceId: string, batteryLevel: number, isCharging: boolean}>> {
    try {
      const devices = await storage.getHc03DevicesByPatient(patientId);
      return devices.map(device => ({
        deviceId: device.deviceId,
        batteryLevel: device.batteryLevel || 0,
        isCharging: device.chargingStatus || false
      }));
    } catch (error) {
      console.error('[HC03] Error retrieving patient devices battery:', error);
      return [];
    }
  }

  // Set custom callbacks
  setCallbacks(
    batteryLevelCallback?: BatteryLevelDataCallback,
    batteryChargingCallback?: BatteryChargingStatusCallback
  ) {
    if (batteryLevelCallback) this.batteryLevelCallback = batteryLevelCallback;
    if (batteryChargingCallback) this.batteryChargingCallback = batteryChargingCallback;
  }

  // Start battery monitoring simulation for a device
  startBatteryMonitoring(deviceId: string, patientId: string): NodeJS.Timeout {
    // Simulate battery updates every 2 minutes
    return setInterval(async () => {
      const battery = await this.getBattery(deviceId);
      if (battery && !battery.isCharging && battery.level > 0) {
        await this.simulateBatteryDrain(deviceId, patientId);
      }
    }, 120000); // 2 minutes
  }
}

// Export singleton instance
export const batteryManager = new BatteryManager();