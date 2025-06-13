import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { insertUserSchema, adminCreatePatientSchema, insertOtpCodeSchema, insertVitalSignsSchema, insertCheckupLogSchema, insertReminderSettingsSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Email transporter setup - Test mode when no SMTP configured
const transporter = process.env.SMTP_USER ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
}) : null;

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
  if (transporter) {
    // Production mode - send actual email
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.EMAIL_USER,
      to: email,
      subject: "24/7 Tele H - Email Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">24/7 Tele H Technology Services</h2>
          <p>Your email verification code is:</p>
          <h1 style="background: #f3f4f6; padding: 20px; text-align: center; letter-spacing: 5px; font-size: 32px; color: #2563EB;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } else {
    // Test mode - store OTP and log to console
    testOTPs.set(email, otp);
    console.log(`\n🔐 TEST MODE - OTP for ${email}: ${otp}`);
    console.log(`💡 Use this code to verify your account in the mobile app\n`);
  }
};

// Send alert email to doctor
const sendAlertEmail = async (patientId: string, alertTitle: string, alertDescription: string) => {
  const doctorEmail = process.env.DOCTOR_EMAIL || "doctor@healthmonitor.com";
  
  const mailOptions = {
    from: process.env.SMTP_USER || process.env.EMAIL_USER,
    to: doctorEmail,
    subject: `URGENT: Health Alert for Patient ${patientId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">🚨 CRITICAL HEALTH ALERT</h2>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #DC2626;">
          <h3 style="color: #DC2626; margin: 0 0 10px 0;">${alertTitle}</h3>
          <p style="margin: 0 0 10px 0;"><strong>Patient ID:</strong> ${patientId}</p>
          <p style="margin: 0;"><strong>Details:</strong> ${alertDescription}</p>
        </div>
        <p style="margin-top: 20px;">Please review the patient's condition immediately.</p>
        <p><a href="#" style="background: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Patient Dashboard</a></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
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
      if (!transporter && testOTPs.has(email) && testOTPs.get(email) === code) {
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
      
      const token = jwt.sign(
        { userId: user.id, patientId: user.patientId, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          patientId: user.patientId, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
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
          
          // Send reminder email if enabled
          if (setting.emailAlerts && transporter) {
            const user = await storage.getUserByPatientId(setting.patientId);
            if (user) {
              try {
                await transporter.sendMail({
                  from: process.env.SMTP_USER || process.env.EMAIL_USER,
                  to: user.email,
                  subject: "24/7 Tele H - Health Check Reminder",
                  html: `<p>REMINDER: Your health check-up is overdue. Please complete your vital signs monitoring.</p>`
                });
              } catch (error) {
                console.error("Failed to send reminder email:", error);
              }
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
      if (!transporter && testOTPs.has(email) && testOTPs.get(email) === code) {
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

  // Test endpoint to view OTP codes (only works in test mode)
  app.get("/api/test/otps", (req, res) => {
    if (!transporter) {
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
    } else {
      res.json({
        testMode: false,
        message: "Production mode - OTP codes are sent via email"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
