import { 
  users, otpCodes, vitalSigns, checkupLogs, reminderSettings, alerts,
  hc03Devices, ecgData, bloodOxygenData, bloodPressureData, bloodGlucoseData, temperatureData,
  type User, type InsertUser, type OtpCode, type InsertOtpCode,
  type VitalSigns, type InsertVitalSigns, type CheckupLog, type InsertCheckupLog,
  type ReminderSettings, type InsertReminderSettings, type Alert, type InsertAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPatientId(patientId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined>;
  markUserAsVerified(email: string): Promise<void>;
  
  // Admin methods
  getAllPatients(): Promise<User[]>;
  createPatientAccess(insertUser: any): Promise<User>;
  updatePatientAccess(patientId: string, isActive: boolean): Promise<void>;

  // OTP methods
  createOtpCode(insertOtp: InsertOtpCode): Promise<OtpCode>;
  verifyOtp(email: string, code: string): Promise<boolean>;

  // Vital signs methods
  createVitalSigns(insertVitals: InsertVitalSigns): Promise<VitalSigns>;
  getVitalSignsByPatient(patientId: string): Promise<VitalSigns[]>;
  getLatestVitalSigns(patientId: string): Promise<VitalSigns | undefined>;

  // Checkup log methods
  createCheckupLog(insertLog: InsertCheckupLog): Promise<CheckupLog>;
  getCheckupHistory(patientId: string): Promise<CheckupLog[]>;
  getLastCheckupTime(patientId: string): Promise<Date | undefined>;

  // Reminder settings methods
  upsertReminderSettings(insertSettings: InsertReminderSettings): Promise<ReminderSettings>;
  getReminderSettings(patientId: string): Promise<ReminderSettings | undefined>;
  getAllActiveReminderSettings(): Promise<ReminderSettings[]>;

  // Alert methods
  createAlert(insertAlert: InsertAlert): Promise<Alert>;
  getAlertsByPatient(patientId: string): Promise<Alert[]>;
  markAlertAsNotified(alertId: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(patientId: string): Promise<any>;

  // HC03 Device Management
  registerHc03Device(device: any): Promise<any>;
  updateHc03Device(deviceId: string, updates: any): Promise<any>;
  getHc03DevicesByPatient(patientId: string): Promise<any[]>;
  getHc03Device(deviceId: string): Promise<any | undefined>;
  updateDeviceStatus(deviceId: string, status: string): Promise<void>;
  updateDeviceBattery(deviceId: string, batteryLevel: number, chargingStatus: boolean): Promise<void>;

  // HC03 Data Storage
  saveEcgData(data: any): Promise<any>;
  saveBloodOxygenData(data: any): Promise<any>;
  saveBloodPressureData(data: any): Promise<any>;
  saveBloodGlucoseData(data: any): Promise<any>;
  saveTemperatureData(data: any): Promise<any>;

  // HC03 Data Retrieval
  getEcgDataByPatient(patientId: string, limit?: number): Promise<any[]>;
  getBloodOxygenDataByPatient(patientId: string, limit?: number): Promise<any[]>;
  getBloodPressureDataByPatient(patientId: string, limit?: number): Promise<any[]>;
  getBloodGlucoseDataByPatient(patientId: string, limit?: number): Promise<any[]>;
  getTemperatureDataByPatient(patientId: string, limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPatientId(patientId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.patientId, patientId));
    return user || undefined;
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async markUserAsVerified(email: string): Promise<void> {
    await db.update(users).set({ isVerified: true }).where(eq(users.email, email));
  }

  // Admin methods
  async getAllPatients(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'patient')).orderBy(desc(users.createdAt));
  }

  async createPatientAccess(insertUser: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: 'patient',
        isVerified: true
      })
      .returning();
    return user;
  }

  async updatePatientAccess(patientId: string, isActive: boolean): Promise<void> {
    await db.update(users).set({ 
      isVerified: isActive 
    }).where(eq(users.patientId, patientId));
  }

  // OTP methods
  async createOtpCode(insertOtp: InsertOtpCode): Promise<OtpCode> {
    const [otp] = await db
      .insert(otpCodes)
      .values(insertOtp)
      .returning();
    return otp;
  }

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          eq(otpCodes.isUsed, false),
          gte(otpCodes.expiresAt, new Date())
        )
      );

    if (otp) {
      await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, otp.id));
      return true;
    }
    return false;
  }

  // Vital signs methods
  async createVitalSigns(insertVitals: InsertVitalSigns): Promise<VitalSigns> {
    const [vitals] = await db
      .insert(vitalSigns)
      .values(insertVitals)
      .returning();
    return vitals;
  }

  async getVitalSignsByPatient(patientId: string): Promise<VitalSigns[]> {
    return await db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.patientId, patientId))
      .orderBy(desc(vitalSigns.timestamp));
  }

  async getLatestVitalSigns(patientId: string): Promise<VitalSigns | undefined> {
    const [latest] = await db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.patientId, patientId))
      .orderBy(desc(vitalSigns.timestamp))
      .limit(1);
    return latest || undefined;
  }

  // Checkup log methods
  async createCheckupLog(insertLog: InsertCheckupLog): Promise<CheckupLog> {
    const [log] = await db
      .insert(checkupLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getCheckupHistory(patientId: string): Promise<CheckupLog[]> {
    return await db
      .select()
      .from(checkupLogs)
      .where(eq(checkupLogs.patientId, patientId))
      .orderBy(desc(checkupLogs.date));
  }

  async getLastCheckupTime(patientId: string): Promise<Date | undefined> {
    const [log] = await db
      .select()
      .from(checkupLogs)
      .where(
        and(
          eq(checkupLogs.patientId, patientId),
          eq(checkupLogs.status, 'checked')
        )
      )
      .orderBy(desc(checkupLogs.date))
      .limit(1);
    return log?.date || undefined;
  }

  // Reminder settings methods
  async upsertReminderSettings(insertSettings: InsertReminderSettings): Promise<ReminderSettings> {
    const existing = await this.getReminderSettings(insertSettings.patientId);
    
    if (existing) {
      const [updated] = await db
        .update(reminderSettings)
        .set(insertSettings)
        .where(eq(reminderSettings.patientId, insertSettings.patientId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(reminderSettings)
        .values(insertSettings)
        .returning();
      return created;
    }
  }

  async getReminderSettings(patientId: string): Promise<ReminderSettings | undefined> {
    const [settings] = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.patientId, patientId));
    return settings || undefined;
  }

  async getAllActiveReminderSettings(): Promise<ReminderSettings[]> {
    return await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.isActive, true));
  }

  // Alert methods
  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async getAlertsByPatient(patientId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.patientId, patientId))
      .orderBy(desc(alerts.createdAt));
  }

  async markAlertAsNotified(alertId: number): Promise<void> {
    await db.update(alerts).set({ doctorNotified: true }).where(eq(alerts.id, alertId));
  }

  // Dashboard stats
  async getDashboardStats(patientId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [completedCheckups] = await db
      .select({ count: sql<number>`count(*)` })
      .from(checkupLogs)
      .where(
        and(
          eq(checkupLogs.patientId, patientId),
          eq(checkupLogs.status, 'checked'),
          gte(checkupLogs.date, thirtyDaysAgo)
        )
      );

    const [missedCheckups] = await db
      .select({ count: sql<number>`count(*)` })
      .from(checkupLogs)
      .where(
        and(
          eq(checkupLogs.patientId, patientId),
          eq(checkupLogs.status, 'missed'),
          gte(checkupLogs.date, thirtyDaysAgo)
        )
      );

    const [criticalAlerts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(
        and(
          eq(alerts.patientId, patientId),
          eq(alerts.type, 'critical'),
          eq(alerts.isResolved, false)
        )
      );

    const totalCheckups = (completedCheckups?.count || 0) + (missedCheckups?.count || 0);
    const completionRate = totalCheckups > 0 ? ((completedCheckups?.count || 0) / totalCheckups) * 100 : 100;

    return {
      activePatients: 1, // Single patient view
      checkupsToday: 0, // Would need more complex query for "today"
      criticalAlerts: criticalAlerts?.count || 0,
      completionRate: Math.round(completionRate * 10) / 10,
      completedCheckups: completedCheckups?.count || 0,
      missedCheckups: missedCheckups?.count || 0,
    };
  }

  // HC03 Device Management Methods
  async registerHc03Device(device: any): Promise<any> {
    const [newDevice] = await db
      .insert(hc03Devices)
      .values({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        macAddress: device.macAddress,
        firmwareVersion: device.firmwareVersion,
        batteryLevel: device.batteryLevel || 100,
        chargingStatus: device.chargingStatus || false,
        connectionStatus: 'connected',
        patientId: device.patientId,
        lastConnected: new Date(),
      })
      .onConflictDoUpdate({
        target: hc03Devices.deviceId,
        set: {
          deviceName: device.deviceName,
          connectionStatus: 'connected',
          lastConnected: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return newDevice;
  }

  async updateHc03Device(deviceId: string, updates: any): Promise<any> {
    const [updatedDevice] = await db
      .update(hc03Devices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(hc03Devices.deviceId, deviceId))
      .returning();
    return updatedDevice;
  }

  async getHc03DevicesByPatient(patientId: string): Promise<any[]> {
    return await db
      .select()
      .from(hc03Devices)
      .where(eq(hc03Devices.patientId, patientId));
  }

  async getHc03Device(deviceId: string): Promise<any | undefined> {
    const [device] = await db
      .select()
      .from(hc03Devices)
      .where(eq(hc03Devices.deviceId, deviceId));
    return device;
  }

  async updateDeviceStatus(deviceId: string, status: string): Promise<void> {
    await db
      .update(hc03Devices)
      .set({
        connectionStatus: status,
        lastConnected: status === 'connected' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(hc03Devices.deviceId, deviceId));
  }

  async updateDeviceBattery(deviceId: string, batteryLevel: number, chargingStatus: boolean): Promise<void> {
    await db
      .update(hc03Devices)
      .set({
        batteryLevel,
        chargingStatus,
        updatedAt: new Date(),
      })
      .where(eq(hc03Devices.deviceId, deviceId));
  }

  // HC03 Data Storage Methods
  async saveEcgData(data: any): Promise<any> {
    const [savedData] = await db
      .insert(ecgData)
      .values({
        patientId: data.patientId,
        deviceId: data.deviceId,
        waveData: data.waveData,
        heartRate: data.hr,
        moodIndex: data.moodIndex,
        rrInterval: data.rr,
        hrv: data.hrv,
        respiratoryRate: data.respiratoryRate,
        fingerDetected: data.touch,
        recordingDuration: data.recordingDuration || 30,
      })
      .returning();
    return savedData;
  }

  async saveBloodOxygenData(data: any): Promise<any> {
    const [savedData] = await db
      .insert(bloodOxygenData)
      .values({
        patientId: data.patientId,
        deviceId: data.deviceId,
        bloodOxygen: data.bloodOxygen,
        heartRate: data.heartRate,
        fingerDetected: data.fingerDetection,
        waveData: data.bloodOxygenWaveData,
      })
      .returning();
    return savedData;
  }

  async saveBloodPressureData(data: any): Promise<any> {
    const [savedData] = await db
      .insert(bloodPressureData)
      .values({
        patientId: data.patientId,
        deviceId: data.deviceId,
        systolic: data.ps,
        diastolic: data.pd,
        heartRate: data.hr,
        measurementProgress: data.progress,
        cuffPressure: data.cuffPressure,
      })
      .returning();
    return savedData;
  }

  async saveBloodGlucoseData(data: any): Promise<any> {
    const [savedData] = await db
      .insert(bloodGlucoseData)
      .values({
        patientId: data.patientId,
        deviceId: data.deviceId,
        glucoseLevel: data.bloodGlucosePaperData,
        testStripStatus: data.bloodGlucosePaperState,
        measurementType: data.measurementType || 'fingerstick',
      })
      .returning();
    return savedData;
  }

  async saveTemperatureData(data: any): Promise<any> {
    const [savedData] = await db
      .insert(temperatureData)
      .values({
        patientId: data.patientId,
        deviceId: data.deviceId,
        temperature: data.temperature.toString(),
        measurementSite: data.measurementSite || 'forehead',
      })
      .returning();
    return savedData;
  }

  // HC03 Data Retrieval Methods
  async getEcgDataByPatient(patientId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(ecgData)
      .where(eq(ecgData.patientId, patientId))
      .orderBy(desc(ecgData.timestamp))
      .limit(limit);
  }

  async getBloodOxygenDataByPatient(patientId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(bloodOxygenData)
      .where(eq(bloodOxygenData.patientId, patientId))
      .orderBy(desc(bloodOxygenData.timestamp))
      .limit(limit);
  }

  async getBloodPressureDataByPatient(patientId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(bloodPressureData)
      .where(eq(bloodPressureData.patientId, patientId))
      .orderBy(desc(bloodPressureData.timestamp))
      .limit(limit);
  }

  async getBloodGlucoseDataByPatient(patientId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(bloodGlucoseData)
      .where(eq(bloodGlucoseData.patientId, patientId))
      .orderBy(desc(bloodGlucoseData.timestamp))
      .limit(limit);
  }

  async getTemperatureDataByPatient(patientId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(temperatureData)
      .where(eq(temperatureData.patientId, patientId))
      .orderBy(desc(temperatureData.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();