import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  patientId: text("patient_id").notNull().unique(),
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
  heartRate: integer("heart_rate"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  oxygenLevel: integer("oxygen_level"),
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
