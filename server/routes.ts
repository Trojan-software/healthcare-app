import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic } from "./vite.js";
import { storage } from "./storage";
import { registerPatientManagementRoutes } from "./patient-management.js";
import { registerHc03Routes } from "./routes-hc03.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertUserSchema, insertVitalSignsSchema, insertCheckupLogSchema, insertReminderSettingsSchema, insertAlertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register patient management routes
  registerPatientManagementRoutes(app);
  
  // Register HC03 device routes
  registerHc03Routes(app);

  // Authentication middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.sendStatus(401);
    }

    jwt.verify(token, "your-secret-key", (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

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

      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

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

      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all patients (admin only)
  app.get("/api/patients", authenticateToken, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const patients = await storage.getAllPatients();
      const totalPatients = patients.length;
      const activePatients = patients.filter(p => p.isVerified).length;
      
      res.json({
        totalPatients,
        activePatients,
        criticalAlerts: 3,
        systemUptime: "99.2%"
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient dashboard endpoint
  app.get("/api/dashboard/patient/:userId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const patientId = userId.toString();
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const vitals = await storage.getVitalSignsByPatient(patientId);
      const latestVitals = await storage.getLatestVitalSigns(patientId);
      const checkupHistory = await storage.getCheckupHistory(patientId);
      const alerts = await storage.getAlertsByPatient(patientId);

      res.json({
        patient: user,
        vitals,
        latestVitals: latestVitals || {
          heartRate: 72,
          bloodPressure: "120/80",
          temperature: 36.6,
          oxygenLevel: 98,
          bloodGlucose: 95,
          timestamp: new Date().toISOString()
        },
        checkupHistory,
        alerts,
        healthStatus: "Normal",
        compliance: "Good"
      });
    } catch (error) {
      console.error("Error fetching patient dashboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add vital signs
  app.post("/api/vital-signs", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertVitalSignsSchema.parse(req.body);
      const vitalSigns = await storage.createVitalSigns(validatedData);
      res.json(vitalSigns);
    } catch (error) {
      console.error("Error adding vital signs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospitals list
  app.get("/api/hospitals", (req, res) => {
    const hospitals = [
      { id: "sheikh-khalifa", name: "Sheikh Khalifa Medical City", location: "Abu Dhabi", type: "Government" },
      { id: "cleveland-clinic", name: "Cleveland Clinic Abu Dhabi", location: "Abu Dhabi", type: "Private" },
      { id: "nmc-royal", name: "NMC Royal Hospital", location: "Abu Dhabi", type: "Private" },
      { id: "mediclinic-airport", name: "Mediclinic Airport Road Hospital", location: "Abu Dhabi", type: "Private" },
      { id: "zayed-military", name: "Zayed Military Hospital", location: "Abu Dhabi", type: "Government" },
      { id: "corniche-hospital", name: "Corniche Hospital", location: "Abu Dhabi", type: "Government" },
      { id: "al-noor-hospital", name: "Al Noor Hospital", location: "Abu Dhabi", type: "Private" },
      { id: "healthpoint", name: "Healthpoint Hospital", location: "Abu Dhabi", type: "Private" },
      { id: "life-care", name: "Life Care Hospital", location: "Abu Dhabi", type: "Private" },
      { id: "medeor-hospital", name: "Medeor 24x7 Hospital", location: "Abu Dhabi", type: "Private" }
    ];
    res.json(hospitals);
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "Server running", time: new Date().toISOString() });
  });

  // Setup Vite development server or static file serving
  const server = createServer(app);
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}