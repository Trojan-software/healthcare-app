import { storage } from './storage';

// Blood Glucose Data Types
interface BloodGlucoseReading {
  patientId: string;
  deviceId: string;
  glucoseLevel: number;
  measurementTime: Date;
  testStripStatus: 'inserted' | 'reading' | 'complete' | 'error';
  units: 'mg/dL' | 'mmol/L';
  notes?: string;
}

interface BloodGlucoseSendDataPayload {
  command: 'START_MEASUREMENT' | 'STOP_MEASUREMENT' | 'CALIBRATE';
  patientId: string;
  deviceId: string;
  timestamp: Date;
}

interface BloodGlucosePaperStatePayload {
  deviceId: string;
  patientId: string;
  status: 'strip_inserted' | 'sample_detected' | 'measuring' | 'result_ready' | 'strip_removed' | 'error';
  timestamp: Date;
  errorCode?: string;
}

interface BloodGlucosePaperDataPayload {
  deviceId: string;
  patientId: string;
  glucoseLevel: number;
  units: 'mg/dL' | 'mmol/L';
  quality: 'good' | 'fair' | 'poor';
  timestamp: Date;
  stripId?: string;
}

// Callback function types
type BloodGlucoseSendDataCallback = (payload: BloodGlucoseSendDataPayload) => Promise<boolean>;
type BloodGlucosePaperStateCallback = (payload: BloodGlucosePaperStatePayload) => Promise<void>;
type BloodGlucosePaperDataCallback = (payload: BloodGlucosePaperDataPayload) => Promise<void>;

export class BloodGlucoseManager {
  private sendDataCallback?: BloodGlucoseSendDataCallback;
  private paperStateCallback?: BloodGlucosePaperStateCallback;
  private paperDataCallback?: BloodGlucosePaperDataCallback;

  constructor() {
    this.initializeDefaultCallbacks();
  }

  // Initialize default callback implementations
  private initializeDefaultCallbacks() {
    this.sendDataCallback = this.defaultSendDataCallback;
    this.paperStateCallback = this.defaultPaperStateCallback;
    this.paperDataCallback = this.defaultPaperDataCallback;
  }

  // Default BloodGlucoseSendData callback - sends command to HC03 device
  private async defaultSendDataCallback(payload: BloodGlucoseSendDataPayload): Promise<boolean> {
    try {
      console.log(`[HC03] Sending command to device ${payload.deviceId}:`, payload.command);
      
      // Update device status
      await storage.updateDeviceStatus(payload.deviceId, `measuring_glucose_${payload.command.toLowerCase()}`);
      
      // Simulate device communication
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        console.log(`[HC03] Command ${payload.command} sent successfully to device ${payload.deviceId}`);
        return true;
      } else {
        console.error(`[HC03] Failed to send command ${payload.command} to device ${payload.deviceId}`);
        return false;
      }
    } catch (error) {
      console.error('[HC03] Error in BloodGlucoseSendData callback:', error);
      return false;
    }
  }

  // Default BloodGlucosePaperState callback - handles test strip status updates
  private async defaultPaperStateCallback(payload: BloodGlucosePaperStatePayload): Promise<void> {
    try {
      console.log(`[HC03] Test strip status update for device ${payload.deviceId}:`, payload.status);
      
      // Log the state change
      const stateMessage = this.getStateMessage(payload.status);
      console.log(`[HC03] ${stateMessage} - Device: ${payload.deviceId}, Patient: ${payload.patientId}`);
      
      // Update device status based on paper state
      let deviceStatus = 'active';
      switch (payload.status) {
        case 'strip_inserted':
          deviceStatus = 'glucose_strip_ready';
          break;
        case 'sample_detected':
          deviceStatus = 'glucose_measuring';
          break;
        case 'measuring':
          deviceStatus = 'glucose_processing';
          break;
        case 'result_ready':
          deviceStatus = 'glucose_complete';
          break;
        case 'error':
          deviceStatus = 'glucose_error';
          break;
      }
      
      await storage.updateDeviceStatus(payload.deviceId, deviceStatus);
      
    } catch (error) {
      console.error('[HC03] Error in BloodGlucosePaperState callback:', error);
    }
  }

  // Default BloodGlucosePaperData callback - processes glucose readings
  private async defaultPaperDataCallback(payload: BloodGlucosePaperDataPayload): Promise<void> {
    try {
      console.log(`[HC03] Blood glucose reading received from device ${payload.deviceId}:`, 
                  `${payload.glucoseLevel} ${payload.units}`);
      
      // Validate glucose reading
      if (payload.glucoseLevel < 20 || payload.glucoseLevel > 600) {
        console.warn(`[HC03] Glucose reading out of normal range: ${payload.glucoseLevel} ${payload.units}`);
      }
      
      // Save glucose data to database
      const glucoseData = {
        patientId: payload.patientId,
        deviceId: payload.deviceId,
        glucoseLevel: payload.glucoseLevel,
        units: payload.units,
        quality: payload.quality,
        timestamp: payload.timestamp,
        stripId: payload.stripId || `strip_${Date.now()}`
      };
      
      await storage.saveBloodGlucoseData(glucoseData);
      
      // Update vital signs with glucose reading
      const vitalSigns = {
        patientId: payload.patientId,
        deviceId: payload.deviceId,
        bloodGlucose: payload.glucoseLevel,
        timestamp: payload.timestamp
      };
      
      await storage.createVitalSigns(vitalSigns);
      
      // Update device status
      await storage.updateDeviceStatus(payload.deviceId, 'glucose_complete');
      
      console.log(`[HC03] Blood glucose data saved successfully for patient ${payload.patientId}`);
      
    } catch (error) {
      console.error('[HC03] Error in BloodGlucosePaperData callback:', error);
    }
  }

  // Get human-readable state message
  private getStateMessage(status: string): string {
    const messages = {
      'strip_inserted': 'Test strip inserted, ready for blood sample',
      'sample_detected': 'Blood sample detected, starting measurement',
      'measuring': 'Measuring glucose level...',
      'result_ready': 'Measurement complete, result ready',
      'strip_removed': 'Test strip removed',
      'error': 'Error occurred during measurement'
    };
    return messages[status] || `Unknown status: ${status}`;
  }

  // Public method to get blood glucose data
  async getBloodGlucoseData(patientId: string, deviceId?: string, limit: number = 10): Promise<any[]> {
    try {
      if (deviceId) {
        // Get data for specific device
        return await storage.getBloodGlucoseDataByPatient(patientId, limit);
      } else {
        // Get all glucose data for patient
        return await storage.getBloodGlucoseDataByPatient(patientId, limit);
      }
    } catch (error) {
      console.error('[HC03] Error retrieving blood glucose data:', error);
      return [];
    }
  }

  // Start glucose measurement
  async startGlucoseMeasurement(patientId: string, deviceId: string): Promise<boolean> {
    const payload: BloodGlucoseSendDataPayload = {
      command: 'START_MEASUREMENT',
      patientId,
      deviceId,
      timestamp: new Date()
    };
    
    return this.sendDataCallback ? await this.sendDataCallback(payload) : false;
  }

  // Stop glucose measurement
  async stopGlucoseMeasurement(patientId: string, deviceId: string): Promise<boolean> {
    const payload: BloodGlucoseSendDataPayload = {
      command: 'STOP_MEASUREMENT',
      patientId,
      deviceId,
      timestamp: new Date()
    };
    
    return this.sendDataCallback ? await this.sendDataCallback(payload) : false;
  }

  // Simulate test strip insertion
  async simulateStripInsertion(patientId: string, deviceId: string): Promise<void> {
    if (this.paperStateCallback) {
      await this.paperStateCallback({
        deviceId,
        patientId,
        status: 'strip_inserted',
        timestamp: new Date()
      });
    }
  }

  // Simulate glucose measurement process
  async simulateGlucoseMeasurement(patientId: string, deviceId: string, glucoseLevel: number): Promise<void> {
    // Step 1: Sample detected
    if (this.paperStateCallback) {
      await this.paperStateCallback({
        deviceId,
        patientId,
        status: 'sample_detected',
        timestamp: new Date()
      });
    }

    // Step 2: Measuring
    setTimeout(async () => {
      if (this.paperStateCallback) {
        await this.paperStateCallback({
          deviceId,
          patientId,
          status: 'measuring',
          timestamp: new Date()
        });
      }
    }, 1000);

    // Step 3: Result ready and data callback
    setTimeout(async () => {
      if (this.paperStateCallback) {
        await this.paperStateCallback({
          deviceId,
          patientId,
          status: 'result_ready',
          timestamp: new Date()
        });
      }

      if (this.paperDataCallback) {
        await this.paperDataCallback({
          deviceId,
          patientId,
          glucoseLevel,
          units: 'mg/dL',
          quality: glucoseLevel >= 70 && glucoseLevel <= 140 ? 'good' : 'fair',
          timestamp: new Date(),
          stripId: `strip_${Date.now()}`
        });
      }
    }, 3000);
  }

  // Set custom callbacks
  setCallbacks(
    sendData?: BloodGlucoseSendDataCallback,
    paperState?: BloodGlucosePaperStateCallback,
    paperData?: BloodGlucosePaperDataCallback
  ) {
    if (sendData) this.sendDataCallback = sendData;
    if (paperState) this.paperStateCallback = paperState;
    if (paperData) this.paperDataCallback = paperData;
  }
}

// Export singleton instance
export const bloodGlucoseManager = new BloodGlucoseManager();