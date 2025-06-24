import { storage } from './storage';

// ECG Data Types
interface EcgWavePoint {
  timestamp: number;
  voltage: number; // in mV
  lead: 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';
}

interface WavePayload {
  deviceId: string;
  patientId: string;
  wavePoints: EcgWavePoint[];
  sampleRate: number; // Hz
  timestamp: Date;
}

interface HRPayload {
  deviceId: string;
  patientId: string;
  heartRate: number; // BPM
  confidence: number; // 0-100%
  timestamp: Date;
}

interface MoodIndexPayload {
  deviceId: string;
  patientId: string;
  moodIndex: number; // 1-100
  moodCategory: 'Chill' | 'Relax' | 'Balance' | 'Excitation' | 'Excitement/Anxiety';
  timestamp: Date;
}

interface RRPayload {
  deviceId: string;
  patientId: string;
  rrInterval: number; // milliseconds
  rrVariability: number; // standard deviation
  timestamp: Date;
}

interface HRVPayload {
  deviceId: string;
  patientId: string;
  rmssd: number; // Root Mean Square of Successive Differences
  pnn50: number; // Percentage of adjacent NN intervals differing by >50ms
  sdnn: number; // Standard Deviation of NN intervals
  stress_score: number; // 0-100
  timestamp: Date;
}

interface RespiratoryRatePayload {
  deviceId: string;
  patientId: string;
  respiratoryRate: number; // breaths per minute
  confidence: number; // 0-100%
  timestamp: Date;
}

interface TouchPayload {
  deviceId: string;
  patientId: string;
  isContactDetected: boolean;
  contactQuality: 'poor' | 'fair' | 'good' | 'excellent';
  signalStrength: number; // 0-100%
  timestamp: Date;
}

// Callback function types
type WaveCallback = (payload: WavePayload) => Promise<void>;
type HRCallback = (payload: HRPayload) => Promise<void>;
type MoodIndexCallback = (payload: MoodIndexPayload) => Promise<void>;
type RRCallback = (payload: RRPayload) => Promise<void>;
type HRVCallback = (payload: HRVPayload) => Promise<void>;
type RespiratoryRateCallback = (payload: RespiratoryRatePayload) => Promise<void>;
type TouchCallback = (payload: TouchPayload) => Promise<void>;

export class EcgDataManager {
  private waveCallback?: WaveCallback;
  private hrCallback?: HRCallback;
  private moodIndexCallback?: MoodIndexCallback;
  private rrCallback?: RRCallback;
  private hrvCallback?: HRVCallback;
  private respiratoryRateCallback?: RespiratoryRateCallback;
  private touchCallback?: TouchCallback;

  private currentWaveData: Map<string, EcgWavePoint[]> = new Map();
  private isRecording: Map<string, boolean> = new Map();

  constructor() {
    this.initializeDefaultCallbacks();
  }

  private initializeDefaultCallbacks() {
    this.waveCallback = this.defaultWaveCallback;
    this.hrCallback = this.defaultHRCallback;
    this.moodIndexCallback = this.defaultMoodIndexCallback;
    this.rrCallback = this.defaultRRCallback;
    this.hrvCallback = this.defaultHRVCallback;
    this.respiratoryRateCallback = this.defaultRespiratoryRateCallback;
    this.touchCallback = this.defaultTouchCallback;
  }

  // Default Wave callback - processes ECG waveform points
  private async defaultWaveCallback(payload: WavePayload): Promise<void> {
    try {
      console.log(`[ECG] Wave data received for device ${payload.deviceId}: ${payload.wavePoints.length} points at ${payload.sampleRate}Hz`);
      
      // Store current wave data for real-time display
      this.currentWaveData.set(payload.deviceId, payload.wavePoints);
      
      // Save ECG data to database
      await storage.saveEcgData({
        patientId: payload.patientId,
        deviceId: payload.deviceId,
        ecgData: JSON.stringify(payload.wavePoints),
        sampleRate: payload.sampleRate,
        leadType: payload.wavePoints[0]?.lead || 'II',
        timestamp: payload.timestamp
      });
      
      console.log(`[ECG] Wave data saved for device ${payload.deviceId}`);
    } catch (error) {
      console.error('[ECG] Error in Wave callback:', error);
    }
  }

  // Default HR callback - processes heart rate readings
  private async defaultHRCallback(payload: HRPayload): Promise<void> {
    try {
      console.log(`[ECG] Heart rate update for device ${payload.deviceId}: ${payload.heartRate} BPM (confidence: ${payload.confidence}%)`);
      
      // Update vital signs with heart rate
      await storage.createVitalSigns({
        patientId: payload.patientId,
        deviceId: payload.deviceId,
        heartRate: payload.heartRate,
        timestamp: payload.timestamp
      });
      
      // Check for abnormal heart rate
      if (payload.heartRate < 60 || payload.heartRate > 100) {
        const severity = payload.heartRate < 50 || payload.heartRate > 120 ? 'critical' : 'medium';
        await storage.createAlert({
          patientId: payload.patientId,
          alertType: 'abnormal_heart_rate',
          severity,
          message: `Heart rate: ${payload.heartRate} BPM`,
          isResolved: false,
          timestamp: payload.timestamp
        });
      }
      
    } catch (error) {
      console.error('[ECG] Error in HR callback:', error);
    }
  }

  // Default MoodIndex callback - processes mood analysis
  private async defaultMoodIndexCallback(payload: MoodIndexPayload): Promise<void> {
    try {
      console.log(`[ECG] Mood analysis for device ${payload.deviceId}: ${payload.moodCategory} (${payload.moodIndex}/100)`);
      
      // Log mood data for analytics
      const moodData = {
        patientId: payload.patientId,
        deviceId: payload.deviceId,
        moodIndex: payload.moodIndex,
        moodCategory: payload.moodCategory,
        timestamp: payload.timestamp
      };
      
      console.log(`[ECG] Mood data recorded: ${payload.moodCategory}`);
    } catch (error) {
      console.error('[ECG] Error in MoodIndex callback:', error);
    }
  }

  // Default RR callback - processes R-R intervals
  private async defaultRRCallback(payload: RRPayload): Promise<void> {
    try {
      console.log(`[ECG] RR interval for device ${payload.deviceId}: ${payload.rrInterval}ms (variability: ${payload.rrVariability}ms)`);
      
      // Check for irregular rhythm
      if (payload.rrVariability > 200) {
        await storage.createAlert({
          patientId: payload.patientId,
          alertType: 'irregular_rhythm',
          severity: 'medium',
          message: `High RR variability: ${payload.rrVariability}ms`,
          isResolved: false,
          timestamp: payload.timestamp
        });
      }
    } catch (error) {
      console.error('[ECG] Error in RR callback:', error);
    }
  }

  // Default HRV callback - processes heart rate variability
  private async defaultHRVCallback(payload: HRVPayload): Promise<void> {
    try {
      console.log(`[ECG] HRV metrics for device ${payload.deviceId}: RMSSD=${payload.rmssd}ms, SDNN=${payload.sdnn}ms, Stress=${payload.stress_score}`);
      
      // Check for high stress levels
      if (payload.stress_score > 80) {
        await storage.createAlert({
          patientId: payload.patientId,
          alertType: 'high_stress',
          severity: 'medium',
          message: `High stress level detected: ${payload.stress_score}/100`,
          isResolved: false,
          timestamp: payload.timestamp
        });
      }
    } catch (error) {
      console.error('[ECG] Error in HRV callback:', error);
    }
  }

  // Default RespiratoryRate callback - processes breathing rate
  private async defaultRespiratoryRateCallback(payload: RespiratoryRatePayload): Promise<void> {
    try {
      console.log(`[ECG] Respiratory rate for device ${payload.deviceId}: ${payload.respiratoryRate} BPM (confidence: ${payload.confidence}%)`);
      
      // Check for abnormal respiratory rate
      if (payload.respiratoryRate < 12 || payload.respiratoryRate > 20) {
        const severity = payload.respiratoryRate < 8 || payload.respiratoryRate > 24 ? 'critical' : 'medium';
        await storage.createAlert({
          patientId: payload.patientId,
          alertType: 'abnormal_respiratory_rate',
          severity,
          message: `Respiratory rate: ${payload.respiratoryRate} BPM`,
          isResolved: false,
          timestamp: payload.timestamp
        });
      }
    } catch (error) {
      console.error('[ECG] Error in RespiratoryRate callback:', error);
    }
  }

  // Default Touch callback - processes contact detection
  private async defaultTouchCallback(payload: TouchPayload): Promise<void> {
    try {
      const contactText = payload.isContactDetected ? 'detected' : 'lost';
      console.log(`[ECG] Contact ${contactText} for device ${payload.deviceId}: ${payload.contactQuality} quality (${payload.signalStrength}%)`);
      
      // Update device status based on contact
      const deviceStatus = payload.isContactDetected ? 'recording' : 'standby';
      await storage.updateDeviceStatus(payload.deviceId, deviceStatus);
      
      // Alert for poor contact quality
      if (payload.isContactDetected && payload.contactQuality === 'poor') {
        console.warn(`[ECG] Poor contact quality for device ${payload.deviceId}`);
      }
    } catch (error) {
      console.error('[ECG] Error in Touch callback:', error);
    }
  }

  // Helper functions
  private getMoodCategory(moodIndex: number): string {
    if (moodIndex <= 20) return 'Chill';
    if (moodIndex <= 40) return 'Relax';
    if (moodIndex <= 60) return 'Balance';
    if (moodIndex <= 80) return 'Excitation';
    return 'Excitement/Anxiety';
  }

  private generateEcgWavePoints(heartRate: number, duration: number = 2): EcgWavePoint[] {
    const points: EcgWavePoint[] = [];
    const sampleRate = 250; // Hz
    const samplesPerBeat = Math.floor((60 / heartRate) * sampleRate);
    const totalSamples = duration * sampleRate;
    
    for (let i = 0; i < totalSamples; i++) {
      const time = i / sampleRate;
      const beatPhase = (i % samplesPerBeat) / samplesPerBeat;
      
      // Generate realistic ECG waveform
      let voltage = 0;
      if (beatPhase < 0.1) {
        // P wave
        voltage = 0.1 * Math.sin(beatPhase * 20 * Math.PI);
      } else if (beatPhase >= 0.15 && beatPhase < 0.25) {
        // QRS complex
        const qrsPhase = (beatPhase - 0.15) / 0.1;
        if (qrsPhase < 0.3) voltage = -0.2 * Math.sin(qrsPhase * 10 * Math.PI);
        else if (qrsPhase < 0.7) voltage = 1.0 * Math.sin((qrsPhase - 0.3) * 8 * Math.PI);
        else voltage = -0.3 * Math.sin((qrsPhase - 0.7) * 10 * Math.PI);
      } else if (beatPhase >= 0.35 && beatPhase < 0.55) {
        // T wave
        const tPhase = (beatPhase - 0.35) / 0.2;
        voltage = 0.3 * Math.sin(tPhase * Math.PI);
      }
      
      // Add slight noise
      voltage += (Math.random() - 0.5) * 0.02;
      
      points.push({
        timestamp: Date.now() + i * 4, // 4ms intervals for 250Hz
        voltage: voltage,
        lead: 'II'
      });
    }
    
    return points;
  }

  // Public methods
  async getEcgData(deviceId: string): Promise<any> {
    try {
      const ecgData = await storage.getEcgDataByPatient(deviceId, 1);
      return ecgData[0] || null;
    } catch (error) {
      console.error('[ECG] Error retrieving ECG data:', error);
      return null;
    }
  }

  async startEcgRecording(deviceId: string, patientId: string): Promise<boolean> {
    try {
      this.isRecording.set(deviceId, true);
      
      // Simulate initial contact detection
      if (this.touchCallback) {
        await this.touchCallback({
          deviceId,
          patientId,
          isContactDetected: true,
          contactQuality: 'good',
          signalStrength: 85,
          timestamp: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('[ECG] Error starting ECG recording:', error);
      return false;
    }
  }

  async stopEcgRecording(deviceId: string, patientId: string): Promise<boolean> {
    try {
      this.isRecording.set(deviceId, false);
      
      // Simulate contact loss
      if (this.touchCallback) {
        await this.touchCallback({
          deviceId,
          patientId,
          isContactDetected: false,
          contactQuality: 'poor',
          signalStrength: 0,
          timestamp: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('[ECG] Error stopping ECG recording:', error);
      return false;
    }
  }

  async simulateEcgSession(deviceId: string, patientId: string): Promise<void> {
    const heartRate = 65 + Math.floor(Math.random() * 30); // 65-95 BPM
    const moodIndex = Math.floor(Math.random() * 100) + 1;
    const rrInterval = Math.floor(60000 / heartRate); // milliseconds
    const respiratoryRate = 12 + Math.floor(Math.random() * 8); // 12-20 BPM
    
    // Start with touch detection
    if (this.touchCallback) {
      await this.touchCallback({
        deviceId,
        patientId,
        isContactDetected: true,
        contactQuality: 'excellent',
        signalStrength: 95,
        timestamp: new Date()
      });
    }

    // Generate wave data
    if (this.waveCallback) {
      const wavePoints = this.generateEcgWavePoints(heartRate);
      await this.waveCallback({
        deviceId,
        patientId,
        wavePoints,
        sampleRate: 250,
        timestamp: new Date()
      });
    }

    // Heart rate
    if (this.hrCallback) {
      await this.hrCallback({
        deviceId,
        patientId,
        heartRate,
        confidence: 92,
        timestamp: new Date()
      });
    }

    // Mood index
    if (this.moodIndexCallback) {
      await this.moodIndexCallback({
        deviceId,
        patientId,
        moodIndex,
        moodCategory: this.getMoodCategory(moodIndex) as any,
        timestamp: new Date()
      });
    }

    // RR intervals
    if (this.rrCallback) {
      await this.rrCallback({
        deviceId,
        patientId,
        rrInterval,
        rrVariability: Math.floor(Math.random() * 50) + 20,
        timestamp: new Date()
      });
    }

    // HRV metrics
    if (this.hrvCallback) {
      await this.hrvCallback({
        deviceId,
        patientId,
        rmssd: Math.floor(Math.random() * 40) + 20,
        pnn50: Math.floor(Math.random() * 30) + 10,
        sdnn: Math.floor(Math.random() * 50) + 30,
        stress_score: Math.floor(Math.random() * 60) + 20,
        timestamp: new Date()
      });
    }

    // Respiratory rate
    if (this.respiratoryRateCallback) {
      await this.respiratoryRateCallback({
        deviceId,
        patientId,
        respiratoryRate,
        confidence: 88,
        timestamp: new Date()
      });
    }
  }

  getCurrentWaveData(deviceId: string): EcgWavePoint[] {
    return this.currentWaveData.get(deviceId) || [];
  }

  setCallbacks(callbacks: {
    wave?: WaveCallback;
    hr?: HRCallback;
    moodIndex?: MoodIndexCallback;
    rr?: RRCallback;
    hrv?: HRVCallback;
    respiratoryRate?: RespiratoryRateCallback;
    touch?: TouchCallback;
  }) {
    if (callbacks.wave) this.waveCallback = callbacks.wave;
    if (callbacks.hr) this.hrCallback = callbacks.hr;
    if (callbacks.moodIndex) this.moodIndexCallback = callbacks.moodIndex;
    if (callbacks.rr) this.rrCallback = callbacks.rr;
    if (callbacks.hrv) this.hrvCallback = callbacks.hrv;
    if (callbacks.respiratoryRate) this.respiratoryRateCallback = callbacks.respiratoryRate;
    if (callbacks.touch) this.touchCallback = callbacks.touch;
  }
}

export const ecgDataManager = new EcgDataManager();