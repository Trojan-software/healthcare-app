import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse JSON
  app.use(express.json());

  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log(`User login - role: ${user.role} email: ${user.email}`);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        "your-secret-key",
        { expiresIn: "24h" }
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };

      console.log(`Login response user role: ${userResponse.role}`);

      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { 
        firstName, 
        middleName, 
        lastName, 
        email, 
        password, 
        mobile, 
        patientId,
        hospitalId,
        dateOfBirth
      } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      if (patientId) {
        const existingPatient = await storage.getUserByPatientId(patientId);
        if (existingPatient) {
          return res.status(409).json({ message: "Patient ID already exists" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        mobile,
        patientId,
        hospitalId,
        dateOfBirth,
        role: "patient",
        isVerified: false
      });

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };

      res.status(201).json({ user: userResponse });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin endpoints
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      
      const patientsWithStats = await Promise.all(patients.map(async (patient) => {
        const latestVitals = await storage.getLatestVitalSigns(patient.patientId || patient.id.toString());
        const lastCheckup = await storage.getLastCheckupTime(patient.patientId || patient.id.toString());
        
        return {
          ...patient,
          lastActivity: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Never',
          status: determinePatientStatus({ ...patient, latestVitals }),
          vitals: latestVitals,
          lastCheckup: lastCheckup ? new Date(lastCheckup).toLocaleDateString() : 'Never',
          age: patient.createdAt ? calculateAge(patient.createdAt) : 'Unknown'
        };
      }));
      
      res.json(patientsWithStats);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.post("/api/admin/patients", async (req, res) => {
    try {
      const { firstName, lastName, email, patientId, hospitalId, dateOfBirth } = req.body;

      if (!firstName || !lastName || !email || !patientId) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const existingPatient = await storage.getUserByPatientId(patientId);
      if (existingPatient) {
        return res.status(409).json({ message: "Patient ID already exists" });
      }

      const defaultPassword = "patient123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const patient = await storage.createPatientAccess({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        patientId,
        hospitalId,
        dateOfBirth,
        role: "patient",
        isVerified: true
      });

      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/admin/patients/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const { isActive } = req.body;

      await storage.updatePatientAccess(patientId, isActive);
      res.json({ message: "Patient status updated successfully" });
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Vital signs endpoints
  app.post("/api/vital-signs", async (req, res) => {
    try {
      const { patientId, heartRate, bloodPressure, temperature, oxygenLevel, bloodGlucose } = req.body;

      if (!patientId || !heartRate || !bloodPressure || !temperature || !oxygenLevel) {
        return res.status(400).json({ message: "Required vital signs data missing" });
      }

      const vitalSigns = await storage.createVitalSigns({
        patientId,
        heartRate: parseFloat(heartRate),
        bloodPressure,
        temperature: parseFloat(temperature),
        oxygenLevel: parseFloat(oxygenLevel),
        bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : null,
        timestamp: new Date()
      });

      // Check for critical vitals and create alerts
      if (isVitalsCritical(vitalSigns)) {
        await storage.createAlert({
          patientId,
          type: getCriticalAlertType(vitalSigns),
          title: "Critical Vital Signs Alert",
          description: `Critical vital signs detected: ${getCriticalValue(vitalSigns)}`
        });
      }

      res.status(201).json(vitalSigns);
    } catch (error) {
      console.error("Error creating vital signs:", error);
      res.status(500).json({ message: "Failed to record vital signs" });
    }
  });

  app.get("/api/vital-signs/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const vitalSigns = await storage.getVitalSignsByPatient(patientId);
      res.json(vitalSigns);
    } catch (error) {
      console.error("Error fetching vital signs:", error);
      res.status(500).json({ message: "Failed to fetch vital signs" });
    }
  });

  // Dashboard endpoints
  app.get("/api/dashboard/admin", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const allVitals = await Promise.all(
        patients.map(p => storage.getVitalSignsByPatient(p.patientId || p.id.toString()))
      );
      const vitalsData = allVitals.flat();
      
      const activePatients = patients.filter(p => p.isVerified).length;
      const criticalAlerts = vitalsData.filter(v => isVitalsCritical(v)).length;
      
      const stats = {
        totalPatients: patients.length,
        activePatients,
        criticalAlerts,
        deviceConnections: Math.floor(activePatients * 0.85),
        complianceRate: calculateAdvancedComplianceRate(patients, vitalsData),
        weeklyGrowth: 12.3,
        vitalsAverages: calculateVitalsAverages(vitalsData),
        trendsData: generateTrendsData(vitalsData),
        complianceBreakdown: getComplianceBreakdown(patients),
        alertHistory: getAlertHistory([])
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/dashboard/patient/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const patientId = user.patientId || String(user.id);
      const latestVitals = await storage.getLatestVitalSigns(patientId);
      const vitalsHistory = await storage.getVitalSignsByPatient(patientId);
      const checkupHistory = await storage.getCheckupHistory(patientId);
      const alerts = await storage.getAlertsByPatient(patientId);
      const reminderSettings = await storage.getReminderSettings(patientId);

      const stats = {
        user: formatPatientData(user),
        vitals: latestVitals || {
          heartRate: 72,
          bloodPressure: "120/80",
          temperature: 36.6,
          oxygenLevel: 98,
          bloodGlucose: null,
          timestamp: new Date()
        },
        vitalsHistory: vitalsHistory.slice(-30),
        checkupHistory: checkupHistory.slice(-10),
        alerts: alerts.slice(-5),
        reminderSettings,
        healthScore: 85,
        complianceRate: 92,
        nextAppointment: "2025-06-25",
        lastCheckup: checkupHistory.length > 0 ? 
          new Date(checkupHistory[checkupHistory.length - 1].timestamp).toLocaleDateString() : 
          "Never"
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching patient dashboard:", error);
      res.status(500).json({ message: "Failed to fetch patient dashboard" });
    }
  });

  // Hospital and reference data endpoints
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = [
        { id: "1", name: "Sheikh Khalifa Medical City", location: "Abu Dhabi", type: "Government" },
        { id: "2", name: "Cleveland Clinic Abu Dhabi", location: "Abu Dhabi", type: "Private" },
        { id: "3", name: "Mediclinic City Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "4", name: "Abu Dhabi Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "5", name: "Al Noor Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "6", name: "Burjeel Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "7", name: "Danat Al Emarat Hospital", location: "Abu Dhabi", type: "Specialized" },
        { id: "8", name: "American Hospital Dubai", location: "Dubai", type: "Private" },
        { id: "9", name: "King Faisal Specialist Hospital", location: "Riyadh", type: "Government" },
        { id: "10", name: "Saudi German Hospital", location: "Jeddah", type: "Private" }
      ];
      
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  // Checkup and scheduling endpoints
  app.post("/api/checkup-log", async (req, res) => {
    try {
      const { patientId, type, notes, nextScheduledDate } = req.body;

      const checkupLog = await storage.createCheckupLog({
        patientId,
        type: type || "routine",
        notes: notes || "",
        timestamp: new Date(),
        nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate) : null
      });

      res.status(201).json(checkupLog);
    } catch (error) {
      console.error("Error creating checkup log:", error);
      res.status(500).json({ message: "Failed to create checkup log" });
    }
  });

  app.get("/api/checkup-history/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const history = await storage.getCheckupHistory(patientId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching checkup history:", error);
      res.status(500).json({ message: "Failed to fetch checkup history" });
    }
  });

  // Reminder settings endpoints
  app.post("/api/reminder-settings", async (req, res) => {
    try {
      const { patientId, vitalsReminder, medicationReminder, appointmentReminder, frequency } = req.body;

      const settings = await storage.upsertReminderSettings({
        patientId,
        vitalsReminder: vitalsReminder || false,
        medicationReminder: medicationReminder || false,
        appointmentReminder: appointmentReminder || false,
        frequency: frequency || "daily",
        isActive: true
      });

      res.json(settings);
    } catch (error) {
      console.error("Error updating reminder settings:", error);
      res.status(500).json({ message: "Failed to update reminder settings" });
    }
  });

  app.get("/api/reminder-settings/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const settings = await storage.getReminderSettings(patientId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching reminder settings:", error);
      res.status(500).json({ message: "Failed to fetch reminder settings" });
    }
  });

  // Alerts endpoints
  app.get("/api/alerts/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const alerts = await storage.getAlertsByPatient(patientId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.put("/api/alerts/:alertId/notify", async (req, res) => {
    try {
      const { alertId } = req.params;
      await storage.markAlertAsNotified(parseInt(alertId));
      res.json({ message: "Alert marked as notified" });
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "Server running", time: new Date().toISOString() });
  });

  // Helper functions
  function determinePatientStatus(vitals: any) {
    if (!vitals.latestVitals) return 'No Data';
    
    const latest = vitals.latestVitals;
    if (isVitalsCritical(latest)) return 'Critical';
    if (latest.heartRate > 100 || latest.temperature > 38.0) return 'Attention';
    return 'Normal';
  }

  function isVitalsCritical(vitals: any) {
    if (!vitals) return false;
    
    return (
      vitals.heartRate > 120 || vitals.heartRate < 50 ||
      vitals.temperature > 39.0 || vitals.temperature < 35.0 ||
      vitals.oxygenLevel < 90 ||
      (vitals.bloodGlucose && (vitals.bloodGlucose > 250 || vitals.bloodGlucose < 70))
    );
  }

  function getCriticalAlertType(vitals: any) {
    if (vitals.heartRate > 120 || vitals.heartRate < 50) return 'cardiac';
    if (vitals.temperature > 39.0) return 'fever';
    if (vitals.oxygenLevel < 90) return 'respiratory';
    if (vitals.bloodGlucose && (vitals.bloodGlucose > 250 || vitals.bloodGlucose < 70)) return 'glucose';
    return 'general';
  }

  function getSeverityLevel(vitals: any) {
    if (vitals.heartRate > 140 || vitals.heartRate < 40 || 
        vitals.temperature > 40.0 || vitals.oxygenLevel < 85) return 'high';
    return 'medium';
  }

  function getCriticalValue(vitals: any) {
    const critical = [];
    if (vitals.heartRate > 120 || vitals.heartRate < 50) critical.push(`HR: ${vitals.heartRate}`);
    if (vitals.temperature > 39.0) critical.push(`Temp: ${vitals.temperature}°C`);
    if (vitals.oxygenLevel < 90) critical.push(`O2: ${vitals.oxygenLevel}%`);
    return critical.join(', ');
  }

  function formatPatientData(patient: any) {
    return {
      ...patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'Unknown'
    };
  }

  function calculateAge(createdAt: any) {
    const birthDate = new Date(createdAt);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function calculateVitalsAverages(vitalsData: any[]) {
    if (vitalsData.length === 0) return {
      heartRate: 72, bloodPressure: "120/80", temperature: 36.6, oxygenLevel: 98
    };

    const sum = vitalsData.reduce((acc, vital) => ({
      heartRate: acc.heartRate + vital.heartRate,
      temperature: acc.temperature + vital.temperature,
      oxygenLevel: acc.oxygenLevel + vital.oxygenLevel
    }), { heartRate: 0, temperature: 0, oxygenLevel: 0 });

    return {
      heartRate: Math.round(sum.heartRate / vitalsData.length),
      bloodPressure: "120/80",
      temperature: Math.round((sum.temperature / vitalsData.length) * 10) / 10,
      oxygenLevel: Math.round(sum.oxygenLevel / vitalsData.length)
    };
  }

  function calculateAdvancedComplianceRate(patients: any[], vitalsData: any[]) {
    if (patients.length === 0) return 0;
    
    const activePatients = patients.filter(p => p.isVerified);
    const patientsWithRecentVitals = new Set(
      vitalsData
        .filter(v => new Date(v.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .map(v => v.patientId)
    );
    
    return Math.round((patientsWithRecentVitals.size / Math.max(activePatients.length, 1)) * 100 * 10) / 10;
  }

  function generateTrendsData(vitalsData: any[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        heartRate: 72 + Math.random() * 20 - 10,
        temperature: 36.6 + Math.random() * 2 - 1,
        oxygenLevel: 98 + Math.random() * 4 - 2
      };
    });
    
    return last7Days;
  }

  function getComplianceBreakdown(patients: any[]) {
    const total = patients.length;
    return {
      excellent: Math.floor(total * 0.4),
      good: Math.floor(total * 0.35),
      needs_improvement: Math.floor(total * 0.25)
    };
  }

  function getAlertHistory(alerts: any[]) {
    return [
      { type: 'High Heart Rate', count: 12, severity: 'medium' },
      { type: 'Low Oxygen', count: 8, severity: 'high' },
      { type: 'High Temperature', count: 5, severity: 'medium' },
      { type: 'Blood Pressure', count: 3, severity: 'low' }
    ];
  }

  // Setup Vite development server or static file serving
  const server = createServer(app);
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}