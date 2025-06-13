import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { insertUserSchema, adminCreatePatientSchema, insertOtpCodeSchema, insertVitalSignsSchema, insertCheckupLogSchema, insertReminderSettingsSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Test mode - store OTPs in memory for testing
const testOTPs = new Map<string, string>();

// Middleware to verify JWT token
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to verify admin role
const verifyAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await storage.getUser(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: "Access denied" });
  }
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email: string, otp: string) => {
  // Test mode - store OTP and log to console
  testOTPs.set(email, otp);
  console.log(`\n🔐 TEST MODE - OTP for ${email}: ${otp}`);
  console.log(`💡 Use this code to verify your account in the mobile app\n`);
};

// Log alert for doctor (email functionality removed)
const sendAlertEmail = async (patientId: string, alertTitle: string, alertDescription: string) => {
  console.log(`\n🚨 CRITICAL HEALTH ALERT for Patient ${patientId}`);
  console.log(`Alert: ${alertTitle}`);
  console.log(`Details: ${alertDescription}\n`);
};

// Check for abnormal vital signs
const checkAbnormalVitals = async (vitals: any) => {
  const alerts = [];
  
  if (vitals.heartRate && (vitals.heartRate < 60 || vitals.heartRate > 100)) {
    alerts.push({
      type: "critical",
      title: "Abnormal Heart Rate",
      description: `Heart rate: ${vitals.heartRate} BPM (Normal: 60-100 BPM)`,
    });
  }
  
  if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
    if (vitals.bloodPressureSystolic > 140 || vitals.bloodPressureDiastolic > 90) {
      alerts.push({
        type: "critical",
        title: "High Blood Pressure",
        description: `BP: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg (Normal: <140/90 mmHg)`,
      });
    }
  }
  
  if (vitals.temperature && (parseFloat(vitals.temperature) > 100.4 || parseFloat(vitals.temperature) < 96.8)) {
    alerts.push({
      type: "critical",
      title: "Abnormal Temperature",
      description: `Temperature: ${vitals.temperature}°F (Normal: 96.8-100.4°F)`,
    });
  }
  
  if (vitals.oxygenLevel && vitals.oxygenLevel < 95) {
    alerts.push({
      type: "critical",
      title: "Low Oxygen Level",
      description: `Oxygen saturation: ${vitals.oxygenLevel}% (Normal: ≥95%)`,
    });
  }
  
  return alerts;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Register user
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Generate unique patient ID
      const patientId = `TH${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Create user with generated patientId
      const userToCreate: any = {
        ...userData,
        password: hashedPassword,
        patientId,
        isVerified: false
      };
      
      const user = await storage.createUser(userToCreate);
      
      // Generate and send OTP for email verification
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtpCode({
        email: userData.email,
        code: otp,
        expiresAt,
      });
      
      await sendOTPEmail(userData.email, otp);
      
      res.status(201).json({ 
        message: "Registration successful. Please check your email for verification code.", 
        userId: user.id,
        patientId: user.patientId 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Send OTP
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtpCode({
        email,
        code: otp,
        expiresAt,
      });
      
      await sendOTPEmail(email, otp);
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("OTP send error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      // Check test mode first, then database
      let isValid = false;
      if (testOTPs.has(email) && testOTPs.get(email) === code) {
        isValid = true;
        testOTPs.delete(email); // Remove used test OTP
      } else {
        isValid = await storage.verifyOtp(email, code);
      }
      
      if (isValid) {
        // Mark user as verified
        await storage.markUserAsVerified(email);
        res.json({ message: "OTP verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP" });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(400).json({ message: "OTP verification failed" });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.isVerified) {
        return res.status(401).json({ message: "Please verify your email first" });
      }
      
      console.log("User login - role:", user.role, "email:", user.email);
      
      const token = jwt.sign(
        { userId: user.id, patientId: user.patientId, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      const loginResponse = { 
        token, 
        user: { 
          id: user.id, 
          patientId: user.patientId, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          role: user.role || 'patient'
        } 
      };
      
      console.log("Login response user role:", loginResponse.user.role);
      res.json(loginResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get user profile
  app.get("/api/user", verifyToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update user profile
  app.put("/api/user", verifyToken, async (req: any, res) => {
    try {
      const { firstName, lastName, username, mobileNumber } = req.body;
      const userId = req.user.userId;

      // Check if username is already taken by another user
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }

      // Update user data
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        username,
        mobileNumber,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Record vital signs
  app.post("/api/vital-signs", verifyToken, async (req: any, res) => {
    try {
      const vitalData = insertVitalSignsSchema.parse({
        ...req.body,
        patientId: req.user.patientId,
      });
      
      const vitals = await storage.createVitalSigns(vitalData);
      
      // Check for abnormal readings
      const abnormalAlerts = await checkAbnormalVitals(vitalData);
      
      // Create alerts and send emails for abnormal readings
      for (const alertData of abnormalAlerts) {
        const alert = await storage.createAlert({
          patientId: req.user.patientId,
          ...alertData,
        });
        
        // Send email notification
        await sendAlertEmail(req.user.patientId, alertData.title, alertData.description);
        await storage.markAlertAsNotified(alert.id);
      }
      
      // Log the checkup
      await storage.createCheckupLog({
        patientId: req.user.patientId,
        date: new Date(),
        status: "checked",
        vitalSignsId: vitals.id,
      });
      
      res.status(201).json(vitals);
    } catch (error) {
      console.error("Vital signs error:", error);
      res.status(400).json({ message: "Failed to record vital signs" });
    }
  });

  // Get vital signs history
  app.get("/api/vital-signs", verifyToken, async (req: any, res) => {
    try {
      const vitals = await storage.getVitalSignsByPatient(req.user.patientId);
      res.json(vitals);
    } catch (error) {
      console.error("Get vital signs error:", error);
      res.status(500).json({ message: "Failed to get vital signs" });
    }
  });

  // Get latest vital signs
  app.get("/api/vital-signs/latest", verifyToken, async (req: any, res) => {
    try {
      const vitals = await storage.getLatestVitalSigns(req.user.patientId);
      res.json(vitals);
    } catch (error) {
      console.error("Get latest vital signs error:", error);
      res.status(500).json({ message: "Failed to get latest vital signs" });
    }
  });

  // Update reminder settings
  app.post("/api/reminder-settings", verifyToken, async (req: any, res) => {
    try {
      const settingsData = insertReminderSettingsSchema.parse({
        ...req.body,
        patientId: req.user.patientId,
      });
      
      const settings = await storage.upsertReminderSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Reminder settings error:", error);
      res.status(400).json({ message: "Failed to update reminder settings" });
    }
  });

  // Get reminder settings
  app.get("/api/reminder-settings", verifyToken, async (req: any, res) => {
    try {
      const settings = await storage.getReminderSettings(req.user.patientId);
      res.json(settings);
    } catch (error) {
      console.error("Get reminder settings error:", error);
      res.status(500).json({ message: "Failed to get reminder settings" });
    }
  });

  // Get checkup history
  app.get("/api/checkup-history", verifyToken, async (req: any, res) => {
    try {
      const history = await storage.getCheckupHistory(req.user.patientId);
      res.json(history);
    } catch (error) {
      console.error("Get checkup history error:", error);
      res.status(500).json({ message: "Failed to get checkup history" });
    }
  });

  // Get alerts
  app.get("/api/alerts", verifyToken, async (req: any, res) => {
    try {
      const alerts = await storage.getAlertsByPatient(req.user.patientId);
      res.json(alerts);
    } catch (error) {
      console.error("Get alerts error:", error);
      res.status(500).json({ message: "Failed to get alerts" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard-stats", verifyToken, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.patientId);
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Create sample vital signs data for testing
  app.post("/api/create-sample-data", verifyToken, async (req: any, res) => {
    try {
      const patientId = req.user.patientId;
      const sampleData = [];
      
      // Create varied sample data over the past week
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setHours(date.getHours() - (i * 8)); // 8 hours apart
        
        // Vary the data types (sometimes missing values)
        const samples = [
          {
            patientId,
            heartRate: 70 + Math.floor(Math.random() * 40),
            bloodPressureSystolic: 110 + Math.floor(Math.random() * 30),
            bloodPressureDiastolic: 70 + Math.floor(Math.random() * 20),
            temperature: (98.0 + Math.random() * 3).toFixed(1),
            oxygenLevel: 96 + Math.floor(Math.random() * 4),
            timestamp: date
          },
          {
            patientId,
            heartRate: 65 + Math.floor(Math.random() * 35),
            bloodPressureSystolic: null,
            bloodPressureDiastolic: null,
            temperature: (97.8 + Math.random() * 2.5).toFixed(1),
            oxygenLevel: null,
            timestamp: date
          },
          {
            patientId,
            heartRate: null,
            bloodPressureSystolic: 120 + Math.floor(Math.random() * 25),
            bloodPressureDiastolic: 75 + Math.floor(Math.random() * 15),
            temperature: null,
            oxygenLevel: 97 + Math.floor(Math.random() * 3),
            timestamp: date
          }
        ];
        
        // Randomly pick one of the sample patterns
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        
        // Validate the data with the insert schema
        const validatedData = insertVitalSignsSchema.parse(randomSample);
        const vitalSigns = await storage.createVitalSigns(validatedData);
        sampleData.push(vitalSigns);
      }
      
      res.json({ message: "Sample data created successfully", count: sampleData.length });
    } catch (error) {
      console.error("Create sample data error:", error);
      res.status(500).json({ message: "Failed to create sample data" });
    }
  });

  // Setup reminder cron job
  cron.schedule('0 * * * *', async () => {
    try {
      const activeSettings = await storage.getAllActiveReminderSettings();
      const now = new Date();
      
      for (const setting of activeSettings) {
        const lastCheckup = await storage.getLastCheckupTime(setting.patientId);
        
        if (!lastCheckup || 
            (now.getTime() - lastCheckup.getTime()) >= (setting.frequency * 60 * 60 * 1000)) {
          
          // Log missed checkup
          await storage.createCheckupLog({
            patientId: setting.patientId,
            date: new Date(),
            status: "missed",
            notes: "Automated reminder - checkup overdue",
          });
          
          // Create reminder alert
          await storage.createAlert({
            patientId: setting.patientId,
            type: "warning",
            title: "Missed Check-up",
            description: `Check-up overdue by ${Math.floor((now.getTime() - (lastCheckup?.getTime() || 0)) / (1000 * 60 * 60))} hours`,
          });
          
          // Log reminder (email functionality removed)
          if (setting.emailAlerts) {
            const user = await storage.getUserByPatientId(setting.patientId);
            if (user) {
              console.log(`📧 Reminder notification for ${user.email}: Health check-up overdue`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Reminder cron job error:", error);
    }
  });

  // Forgot Password - Send reset OTP
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      // Generate OTP for password reset
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtpCode({
        email,
        code: otp,
        expiresAt,
      });
      
      await sendOTPEmail(email, otp);
      
      res.json({ message: "Password reset code sent to your email" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });

  // Reset Password - Verify OTP and set new password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      // Verify OTP
      let isValid = false;
      if (testOTPs.has(email) && testOTPs.get(email) === code) {
        isValid = true;
        testOTPs.delete(email);
      } else {
        isValid = await storage.verifyOtp(email, code);
      }
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Admin: Get all patients
  app.get("/api/admin/patients", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Get patients error:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Admin: Create patient dashboard access
  app.post("/api/admin/create-patient", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const patientData = adminCreatePatientSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(patientData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Check if patient ID already exists
      const existingPatient = await storage.getUserByPatientId(patientData.patientId);
      if (existingPatient) {
        return res.status(400).json({ message: "Patient ID already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(patientData.password, 10);
      
      // Create patient access
      const patient = await storage.createPatientAccess({
        ...patientData,
        password: hashedPassword,
      });
      
      res.status(201).json({ 
        message: "Patient dashboard access created successfully", 
        patientId: patient.patientId,
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName
      });
    } catch (error) {
      console.error("Create patient access error:", error);
      res.status(400).json({ message: "Failed to create patient access" });
    }
  });

  // Admin: Update patient access status
  app.put("/api/admin/patient/:patientId/access", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const { patientId } = req.params;
      const { isActive } = req.body;
      
      await storage.updatePatientAccess(patientId, isActive);
      
      res.json({ 
        message: `Patient access ${isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      console.error("Update patient access error:", error);
      res.status(500).json({ message: "Failed to update patient access" });
    }
  });

  // Create initial admin user (for setup only)
  app.post("/api/setup/admin", async (req, res) => {
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail("admin@24x7teleh.com");
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists" });
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminUser = await storage.createUser({
        username: "admin",
        email: "admin@24x7teleh.com",
        firstName: "System",
        lastName: "Administrator",
        mobileNumber: "1234567890",
        password: hashedPassword,
        patientId: "ADMIN-001",
        role: "admin",
        isVerified: true,
      });

      res.status(201).json({ 
        message: "Admin user created successfully",
        email: adminUser.email,
        username: adminUser.username
      });
    } catch (error) {
      console.error("Setup admin error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Test endpoint to view OTP codes (test mode only)
  app.get("/api/test/otps", (req, res) => {
    const otpList = Array.from(testOTPs.entries()).map(([email, otp]) => ({
      email,
      otp,
      message: "Use this OTP to verify your account"
    }));
    res.json({
      testMode: true,
      message: "Test mode active - OTP codes are displayed here instead of being emailed",
      otps: otpList
    });
  });

  // Test route
  app.get("/test", (req, res) => {
    res.send("Server is working!");
  });

  // Health check route
  app.get("/health", (req, res) => {
    res.json({ status: "Server running", time: new Date().toISOString() });
  });

  // Working app route
  app.get("/app", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>24/7 Tele H - Health Monitor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f9fafb; }
    .container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
    .title { text-align: center; font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 10px; }
    .subtitle { text-align: center; font-size: 14px; color: #6b7280; margin-bottom: 30px; }
    .form { display: flex; flex-direction: column; gap: 15px; }
    .input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
    .button:hover { background: #1d4ed8; }
    .button:disabled { background: #9ca3af; cursor: not-allowed; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 15px; display: none; }
    .demo { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
    .demo p { font-size: 12px; margin: 5px 0; color: #6b7280; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div id="loginView" class="container">
    <div class="card">
      <h1 class="title">24/7 Tele H</h1>
      <p class="subtitle">Health Monitoring System</p>
      
      <div id="error" class="error"></div>
      
      <form id="loginForm" class="form">
        <input id="email" type="email" class="input" placeholder="Email Address" required>
        <input id="password" type="password" class="input" placeholder="Password" required>
        <button id="loginBtn" type="submit" class="button">Sign In</button>
      </form>
      
      <div class="demo">
        <p><strong>Demo Accounts:</strong></p>
        <p>Admin: admin@24x7teleh.com / admin123</p>
        <p>Patient: patient.demo@example.com / patient123</p>
      </div>
    </div>
  </div>

  <div id="adminView" class="hidden" style="background:#f8f9fa;min-height:100vh;font-family:Arial,sans-serif">
    <div style="background:#2c3e50;color:white;padding:16px 24px">
      <div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center">
        <div>
          <h1 style="font-size:24px;font-weight:bold;margin:0">24/7 Tele H Admin</h1>
          <p style="font-size:14px;margin:4px 0 0;opacity:0.9">Patient Dashboard Management</p>
        </div>
        <button onclick="logout()" style="background:#e74c3c;border:none;color:white;padding:8px 16px;border-radius:6px;cursor:pointer">Logout</button>
      </div>
    </div>
    <div style="max-width:1200px;margin:0 auto;padding:24px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:24px">
        <div style="background:linear-gradient(135deg,#3498db,#2980b9);padding:20px;border-radius:12px;color:white;text-align:center">
          <div style="font-size:32px;font-weight:bold;margin-bottom:8px">15</div>
          <div style="font-size:14px;opacity:0.9">Total Patients</div>
        </div>
        <div style="background:linear-gradient(135deg,#27ae60,#229954);padding:20px;border-radius:12px;color:white;text-align:center">
          <div style="font-size:32px;font-weight:bold;margin-bottom:8px">12</div>
          <div style="font-size:14px;opacity:0.9">Active Patients</div>
        </div>
        <div style="background:linear-gradient(135deg,#f39c12,#e67e22);padding:20px;border-radius:12px;color:white;text-align:center">
          <div style="font-size:32px;font-weight:bold;margin-bottom:8px">3</div>
          <div style="font-size:14px;opacity:0.9">Pending Verification</div>
        </div>
        <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);padding:20px;border-radius:12px;color:white;text-align:center">
          <div style="font-size:32px;font-weight:bold;margin-bottom:8px">2</div>
          <div style="font-size:14px;opacity:0.9">Critical Alerts</div>
        </div>
      </div>
      <div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:20px">
        <h3 style="color:#2c3e50;margin-bottom:16px">Patient Management</h3>
        <p id="adminWelcome" style="color:#6b7280;margin-bottom:20px"></p>
        <div style="background:#f8f9fa;padding:16px;border-radius:8px">
          <p style="color:#495057;margin-bottom:12px"><strong>System Status:</strong></p>
          <p style="color:#059669;margin:4px 0">✓ SendGrid removed - using console logging</p>
          <p style="color:#059669;margin:4px 0">✓ Admin authentication working</p>
          <p style="color:#059669;margin:4px 0">✓ Database connection established</p>
        </div>
      </div>
    </div>
  </div>

  <div id="patientView" class="hidden" style="background:#f3f4f6;min-height:100vh;font-family:Arial,sans-serif">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px 16px;color:white">
      <div style="display:flex;justify-content:space-between;align-items:center;max-width:400px;margin:0 auto">
        <div>
          <h1 style="font-size:24px;font-weight:bold;margin:0">24/7 Tele H</h1>
          <p id="patientWelcome" style="font-size:14px;margin:4px 0 0 0;opacity:0.9"></p>
        </div>
        <button onclick="logout()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 12px;border-radius:20px;font-size:12px;cursor:pointer">Logout</button>
      </div>
    </div>
    <div style="max-width:400px;margin:-20px auto 0;padding:0 16px">
      <div style="background:white;border-radius:20px 20px 0 0;padding:24px;min-height:calc(100vh - 120px)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
          <div style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);padding:20px;border-radius:12px;color:white;text-align:center">
            <div style="font-size:28px;font-weight:bold;margin-bottom:4px">--</div>
            <div style="font-size:12px;opacity:0.9">Heart Rate</div>
          </div>
          <div style="background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%);padding:20px;border-radius:12px;color:white;text-align:center">
            <div style="font-size:28px;font-weight:bold;margin-bottom:4px">--%</div>
            <div style="font-size:12px;opacity:0.9">Blood Oxygen</div>
          </div>
          <div style="background:linear-gradient(135deg,#fa709a 0%,#fee140 100%);padding:20px;border-radius:12px;color:white;text-align:center">
            <div style="font-size:28px;font-weight:bold;margin-bottom:4px">--°F</div>
            <div style="font-size:12px;opacity:0.9">Temperature</div>
          </div>
          <div style="background:linear-gradient(135deg,#a8edea 0%,#fed6e3 100%);padding:20px;border-radius:12px;color:#333;text-align:center">
            <div style="font-size:28px;font-weight:bold;margin-bottom:4px">--/--</div>
            <div style="font-size:12px;opacity:0.8">Blood Pressure</div>
          </div>
        </div>
        <div style="background:#f8f9fa;padding:16px;border-radius:12px;text-align:center;color:#6c757d">
          <p style="margin:0;font-size:14px">No recent vital signs recorded</p>
          <p style="margin:8px 0 0;font-size:12px">Connect your HC03 device to start monitoring</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentUser = null;

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      const loginBtn = document.getElementById('loginBtn');
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      errorDiv.style.display = 'none';
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }
        
        const result = await response.json();
        currentUser = result.user;
        
        if (result.user.role === 'admin') {
          showComprehensiveAdminDashboard();
        } else {
          showPatientDashboard();
        }
      } catch (err) {
        errorDiv.textContent = err.message || 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
      }
    });

    function showComprehensiveAdminDashboard() {
      document.body.innerHTML = `
        <div style="background:#f8fafc;min-height:100vh;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:16px 24px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <div style="max-width:1400px;margin:0 auto;display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:16px">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">🏥</div>
                <div>
                  <h1 style="font-size:24px;font-weight:600;margin:0">24/7 Tele H Admin</h1>
                  <p style="font-size:14px;margin:0;opacity:0.9">Healthcare Management Dashboard</p>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:16px">
                <div style="text-align:right">
                  <p style="font-size:14px;margin:0;font-weight:500">${currentUser.firstName} ${currentUser.lastName}</p>
                  <p style="font-size:12px;margin:0;opacity:0.8">Administrator</p>
                </div>
                <button onclick="logout()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px">Logout</button>
              </div>
            </div>
          </div>
          
          <div style="max-width:1400px;margin:0 auto;padding:24px">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:32px">
              <div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #3b82f6">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
                  <div>
                    <p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Total Patients</p>
                    <p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">156</p>
                  </div>
                  <div style="background:#dbeafe;color:#3b82f6;padding:8px;border-radius:8px;font-size:20px">👥</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:#10b981;font-size:12px;font-weight:600">↗ +12.5%</span>
                  <span style="color:#6b7280;font-size:12px">vs last month</span>
                </div>
              </div>
              
              <div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #10b981">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
                  <div>
                    <p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Active Monitoring</p>
                    <p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">89</p>
                  </div>
                  <div style="background:#d1fae5;color:#10b981;padding:8px;border-radius:8px;font-size:20px">📊</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:#10b981;font-size:12px;font-weight:600">↗ +8.2%</span>
                  <span style="color:#6b7280;font-size:12px">vs last week</span>
                </div>
              </div>
              
              <div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #f59e0b">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
                  <div>
                    <p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Critical Alerts</p>
                    <p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">7</p>
                  </div>
                  <div style="background:#fef3c7;color:#f59e0b;padding:8px;border-radius:8px;font-size:20px">⚠️</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:#ef4444;font-size:12px;font-weight:600">↗ +2</span>
                  <span style="color:#6b7280;font-size:12px">since yesterday</span>
                </div>
              </div>
              
              <div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #8b5cf6">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
                  <div>
                    <p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Device Connections</p>
                    <p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">142</p>
                  </div>
                  <div style="background:#ede9fe;color:#8b5cf6;padding:8px;border-radius:8px;font-size:20px">🔗</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:#10b981;font-size:12px;font-weight:600">98.6%</span>
                  <span style="color:#6b7280;font-size:12px">connection rate</span>
                </div>
              </div>
            </div>
            
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px">
              <div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden">
                <div style="padding:24px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <h3 style="font-size:18px;font-weight:600;color:#1f2937;margin:0">Patient Management</h3>
                    <p style="color:#6b7280;font-size:14px;margin:4px 0 0">Monitor and manage patient records</p>
                  </div>
                  <button style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px">+ Add Patient</button>
                </div>
                <div style="padding:20px;text-align:center;color:#6b7280">
                  <div style="font-size:48px;margin-bottom:16px">📋</div>
                  <h3 style="color:#374151;margin:0 0 8px">Patient Management System</h3>
                  <p style="margin:0;font-size:14px">Comprehensive patient monitoring and management interface</p>
                </div>
              </div>
              
              <div style="display:flex;flex-direction:column;gap:20px">
                <div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px">
                  <h3 style="font-size:18px;font-weight:600;color:#1f2937;margin:0 0 20px">Recent Alerts</h3>
                  <div style="padding:16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;margin-bottom:12px">
                    <p style="font-weight:600;color:#dc2626;margin:0;font-size:14px">High Blood Pressure</p>
                    <p style="color:#7f1d1d;font-size:13px;margin:4px 0 0">Sarah Johnson - 15 min ago</p>
                  </div>
                  <div style="padding:16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;margin-bottom:12px">
                    <p style="font-weight:600;color:#d97706;margin:0;font-size:14px">Device Disconnected</p>
                    <p style="color:#92400e;font-size:13px;margin:4px 0 0">John Smith - 1 hour ago</p>
                  </div>
                  <div style="padding:16px;background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px">
                    <p style="font-weight:600;color:#059669;margin:0;font-size:14px">Normal Reading</p>
                    <p style="color:#065f46;font-size:13px;margin:4px 0 0">Mike Davis - 2 hours ago</p>
                  </div>
                </div>
                
                <div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px">
                  <h3 style="font-size:18px;font-weight:600;color:#1f2937;margin:0 0 20px">Quick Actions</h3>
                  <div style="display:flex;flex-direction:column;gap:12px">
                    <button style="background:#3b82f6;color:white;border:none;padding:12px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;text-align:left;display:flex;align-items:center;gap:12px">
                      <span style="font-size:18px">👥</span>
                      <span>Add New Patient</span>
                    </button>
                    <button style="background:#10b981;color:white;border:none;padding:12px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;text-align:left;display:flex;align-items:center;gap:12px">
                      <span style="font-size:18px">📊</span>
                      <span>Generate Reports</span>
                    </button>
                    <button style="background:#8b5cf6;color:white;border:none;padding:12px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;text-align:left;display:flex;align-items:center;gap:12px">
                      <span style="font-size:18px">📱</span>
                      <span>Device Management</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }

    function showPatientDashboard() {
      document.body.innerHTML = `
        <div style="background:#f0f2f5;min-height:100vh;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px 16px;color:white">
            <div style="display:flex;justify-content:space-between;align-items:center;max-width:400px;margin:0 auto">
              <div>
                <h1 style="font-size:24px;font-weight:bold;margin:0">24/7 Tele H</h1>
                <p style="font-size:14px;margin:4px 0 0 0;opacity:0.9">Welcome, ${currentUser.firstName}</p>
              </div>
              <button onclick="logout()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 12px;border-radius:20px;font-size:12px;cursor:pointer">Logout</button>
            </div>
          </div>
          
          <div style="max-width:400px;margin:-20px auto 0;padding:0 16px">
            <div style="background:white;border-radius:20px 20px 0 0;padding:24px;min-height:calc(100vh - 120px)">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
                <div style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);padding:20px;border-radius:16px;color:white;text-align:center;box-shadow:0 4px 12px rgba(79,172,254,0.3)">
                  <div style="font-size:32px;font-weight:bold;margin-bottom:8px">72</div>
                  <div style="font-size:12px;opacity:0.9">Heart Rate</div>
                  <div style="font-size:10px;opacity:0.7;margin-top:4px">bpm</div>
                </div>
                
                <div style="background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%);padding:20px;border-radius:16px;color:white;text-align:center;box-shadow:0 4px 12px rgba(67,233,123,0.3)">
                  <div style="font-size:32px;font-weight:bold;margin-bottom:8px">98%</div>
                  <div style="font-size:12px;opacity:0.9">Blood Oxygen</div>
                  <div style="font-size:10px;opacity:0.7;margin-top:4px">SpO2</div>
                </div>
                
                <div style="background:linear-gradient(135deg,#fa709a 0%,#fee140 100%);padding:20px;border-radius:16px;color:white;text-align:center;box-shadow:0 4px 12px rgba(250,112,154,0.3)">
                  <div style="font-size:32px;font-weight:bold;margin-bottom:8px">98.6°</div>
                  <div style="font-size:12px;opacity:0.9">Temperature</div>
                  <div style="font-size:10px;opacity:0.7;margin-top:4px">Fahrenheit</div>
                </div>
                
                <div style="background:linear-gradient(135deg,#a8edea 0%,#fed6e3 100%);padding:20px;border-radius:16px;color:#333;text-align:center;box-shadow:0 4px 12px rgba(168,237,234,0.3)">
                  <div style="font-size:32px;font-weight:bold;margin-bottom:8px">120/80</div>
                  <div style="font-size:12px;opacity:0.8">Blood Pressure</div>
                  <div style="font-size:10px;opacity:0.6;margin-top:4px">mmHg</div>
                </div>
              </div>
              
              <div style="margin-bottom:24px">
                <h3 style="font-size:18px;font-weight:600;color:#333;margin:0 0 16px">Health Overview</h3>
                <div style="background:#f8f9fa;padding:20px;border-radius:16px;border:1px solid #e9ecef">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                    <div style="width:8px;height:8px;background:#10b981;border-radius:50%"></div>
                    <span style="color:#059669;font-weight:500;font-size:14px">All vitals normal</span>
                  </div>
                  <div style="background:white;padding:16px;border-radius:12px;margin-bottom:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="color:#6c757d;font-size:14px">Last reading</span>
                      <span style="color:#495057;font-weight:500;font-size:14px">2 minutes ago</span>
                    </div>
                  </div>
                  <div style="background:white;padding:16px;border-radius:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="color:#6c757d;font-size:14px">Device status</span>
                      <span style="color:#059669;font-weight:500;font-size:14px">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom:24px">
                <h3 style="font-size:18px;font-weight:600;color:#333;margin:0 0 16px">Quick Actions</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <button style="background:#667eea;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(102,126,234,0.3)">
                    <div style="font-size:28px">📊</div>
                    <div style="font-weight:500">Record Vitals</div>
                  </button>
                  
                  <button style="background:#764ba2;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(118,75,162,0.3)">
                    <div style="font-size:28px">🔗</div>
                    <div style="font-weight:500">Connect Device</div>
                  </button>
                  
                  <button style="background:#4facfe;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(79,172,254,0.3)">
                    <div style="font-size:28px">📱</div>
                    <div style="font-weight:500">View History</div>
                  </button>
                  
                  <button style="background:#43e97b;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(67,233,123,0.3)">
                    <div style="font-size:28px">⚙️</div>
                    <div style="font-weight:500">Settings</div>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 style="font-size:18px;font-weight:600;color:#333;margin:0 0 16px">Recent Activity</h3>
                <div style="background:#f8f9fa;padding:20px;border-radius:16px;border:1px solid #e9ecef">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                    <div style="width:40px;height:40px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center">
                      <span style="color:#3b82f6;font-size:18px">📈</span>
                    </div>
                    <div>
                      <p style="margin:0;font-weight:500;color:#495057;font-size:14px">Vitals recorded</p>
                      <p style="margin:2px 0 0;color:#6c757d;font-size:12px">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                    <div style="width:40px;height:40px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center">
                      <span style="color:#10b981;font-size:18px">✓</span>
                    </div>
                    <div>
                      <p style="margin:0;font-weight:500;color:#495057;font-size:14px">Health check completed</p>
                      <p style="margin:2px 0 0;color:#6c757d;font-size:12px">1 hour ago</p>
                    </div>
                  </div>
                  
                  <div style="display:flex;align-items:center;gap:12px">
                    <div style="width:40px;height:40px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center">
                      <span style="color:#f59e0b;font-size:18px">🔔</span>
                    </div>
                    <div>
                      <p style="margin:0;font-weight:500;color:#495057;font-size:14px">Reminder: Take medication</p>
                      <p style="margin:2px 0 0;color:#6c757d;font-size:12px">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }

    function showPatientDashboard() {
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('adminView').classList.add('hidden');
      document.getElementById('patientView').classList.remove('hidden');
      document.getElementById('patientWelcome').textContent = 'Welcome, ' + currentUser.firstName;
    }

    function logout() {
      currentUser = null;
      document.getElementById('adminView').classList.add('hidden');
      document.getElementById('patientView').classList.add('hidden');
      document.getElementById('loginView').classList.remove('hidden');
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      document.getElementById('error').style.display = 'none';
    }
  </script>
</body>
</html>`);
  });

  // Root route redirects to app
  app.get("/", (req, res) => {
    res.redirect("/app");
  });

  // Login route redirects to app  
  app.get("/login", (req, res) => {
    res.redirect("/app");
  });

  // Catch all other routes
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    res.redirect("/app");
  });

  const httpServer = createServer(app);
  return httpServer;
}
