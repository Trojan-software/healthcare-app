import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  patientId: text("patient_id").notNull().unique(),
  hospitalId: text("hospital_id"),
  isVerified: boolean("is_verified").default(false).notNull(),
  role: text("role").default("patient").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vitalSigns = pgTable("vital_signs", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  deviceId: text("device_id"),
  heartRate: integer("heart_rate"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  oxygenLevel: integer("oxygen_level"),
  bloodGlucose: integer("blood_glucose"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// HC03 Device Management Table
export const hc03Devices = pgTable("hc03_devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  deviceName: text("device_name"),
  macAddress: text("mac_address"),
  firmwareVersion: text("firmware_version"),
  batteryLevel: integer("battery_level"),
  chargingStatus: boolean("charging_status").default(false),
  connectionStatus: text("connection_status").default("disconnected"),
  lastConnected: timestamp("last_connected"),
  patientId: text("patient_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// HC03 ECG Data Table
export const ecgData = pgTable("ecg_data", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  deviceId: text("device_id").notNull(),
  waveData: text("wave_data").array(),
  heartRate: integer("heart_rate"),
  moodIndex: integer("mood_index"),
  rrInterval: integer("rr_interval"),
  hrv: integer("hrv"),
  respiratoryRate: integer("respiratory_rate"),
  fingerDetected: boolean("finger_detected"),
  recordingDuration: integer("recording_duration"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// HC03 Blood Oxygen Data Table  
export const bloodOxygenData = pgTable("blood_oxygen_data", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  deviceId: text("device_id").notNull(),
  bloodOxygen: integer("blood_oxygen"),
  heartRate: integer("heart_rate"),
  fingerDetected: boolean("finger_detected"),
  waveData: text("wave_data").array(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// HC03 Blood Pressure Data Table
export const bloodPressureData = pgTable("blood_pressure_data", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  deviceId: text("device_id").notNull(),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  heartRate: integer("heart_rate"),
  measurementProgress: integer("measurement_progress"),
  cuffPressure: integer("cuff_pressure"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// HC03 Blood Glucose Data Table
export const bloodGlucoseData = pgTable("blood_glucose_data", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  deviceId: text("device_id").notNull(),
  glucoseLevel: integer("glucose_level"),
  testStripStatus: text("test_strip_status"),
  measurementType: text("measurement_type"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// HC03 Temperature Data Table
export const temperatureData = pgTable("temperature_data", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  deviceId: text("device_id").notNull(),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  measurementSite: text("measurement_site"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const checkupLogs = pgTable("checkup_logs", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'checked' or 'missed'
  vitalSignsId: integer("vital_signs_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reminderSettings = pgTable("reminder_settings", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  frequency: integer("frequency").notNull(), // hours
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  emailAlerts: boolean("email_alerts").default(true).notNull(),
  smsReminders: boolean("sms_reminders").default(false).notNull(),
  startTime: text("start_time").default("08:00").notNull(),
  endTime: text("end_time").default("22:00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  type: text("type").notNull(), // 'critical', 'warning', 'info'
  title: text("title").notNull(),
  description: text("description").notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  doctorNotified: boolean("doctor_notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  mobileNumber: true,
  password: true,
});

export const adminCreatePatientSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  mobileNumber: true,
  password: true,
  patientId: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).pick({
  email: true,
  code: true,
  expiresAt: true,
});

export const insertVitalSignsSchema = createInsertSchema(vitalSigns).pick({
  patientId: true,
  heartRate: true,
  bloodPressureSystolic: true,
  bloodPressureDiastolic: true,
  temperature: true,
  oxygenLevel: true,
});

export const insertCheckupLogSchema = createInsertSchema(checkupLogs).pick({
  patientId: true,
  date: true,
  status: true,
  vitalSignsId: true,
  notes: true,
});

export const insertReminderSettingsSchema = createInsertSchema(reminderSettings).pick({
  patientId: true,
  frequency: true,
  pushNotifications: true,
  emailAlerts: true,
  smsReminders: true,
  startTime: true,
  endTime: true,
  isActive: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  patientId: true,
  type: true,
  title: true,
  description: true,
});

// Insert schemas for HC03 tables
export const insertHc03DeviceSchema = createInsertSchema(hc03Devices).pick({
  deviceId: true,
  deviceName: true,
  macAddress: true,
  firmwareVersion: true,
  batteryLevel: true,
  chargingStatus: true,
  connectionStatus: true,
  patientId: true,
});

export const insertEcgDataSchema = createInsertSchema(ecgData).pick({
  patientId: true,
  deviceId: true,
  waveData: true,
  heartRate: true,
  moodIndex: true,
  rrInterval: true,
  hrv: true,
  respiratoryRate: true,
  fingerDetected: true,
  recordingDuration: true,
});

export const insertBloodOxygenDataSchema = createInsertSchema(bloodOxygenData).pick({
  patientId: true,
  deviceId: true,
  bloodOxygen: true,
  heartRate: true,
  fingerDetected: true,
  waveData: true,
});

export const insertBloodPressureDataSchema = createInsertSchema(bloodPressureData).pick({
  patientId: true,
  deviceId: true,
  systolic: true,
  diastolic: true,
  heartRate: true,
  measurementProgress: true,
  cuffPressure: true,
});

export const insertBloodGlucoseDataSchema = createInsertSchema(bloodGlucoseData).pick({
  patientId: true,
  deviceId: true,
  glucoseLevel: true,
  testStripStatus: true,
  measurementType: true,
});

export const insertTemperatureDataSchema = createInsertSchema(temperatureData).pick({
  patientId: true,
  deviceId: true,
  temperature: true,
  measurementSite: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type VitalSigns = typeof vitalSigns.$inferSelect;
export type InsertVitalSigns = z.infer<typeof insertVitalSignsSchema>;
export type CheckupLog = typeof checkupLogs.$inferSelect;
export type InsertCheckupLog = z.infer<typeof insertCheckupLogSchema>;
export type ReminderSettings = typeof reminderSettings.$inferSelect;
export type InsertReminderSettings = z.infer<typeof insertReminderSettingsSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// HC03 Device Types
export type Hc03Device = typeof hc03Devices.$inferSelect;
export type InsertHc03Device = z.infer<typeof insertHc03DeviceSchema>;
export type EcgData = typeof ecgData.$inferSelect;
export type InsertEcgData = z.infer<typeof insertEcgDataSchema>;
export type BloodOxygenData = typeof bloodOxygenData.$inferSelect;
export type InsertBloodOxygenData = z.infer<typeof insertBloodOxygenDataSchema>;
export type BloodPressureData = typeof bloodPressureData.$inferSelect;
export type InsertBloodPressureData = z.infer<typeof insertBloodPressureDataSchema>;
export type BloodGlucoseData = typeof bloodGlucoseData.$inferSelect;
export type InsertBloodGlucoseData = z.infer<typeof insertBloodGlucoseDataSchema>;
export type TemperatureData = typeof temperatureData.$inferSelect;
export type InsertTemperatureData = z.infer<typeof insertTemperatureDataSchema>;
