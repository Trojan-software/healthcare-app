import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailNotificationService } from "./email-notifications";
import { bloodGlucoseManager } from "./hc03-blood-glucose";
import { batteryManager } from "./hc03-battery";
import { ecgDataManager } from "./hc03-ecg";
import { HC03WebSocketService } from "./websocket";
import { generateSecurePassword, generateSecureOTP, generateSecurePatientId } from "./utils/secure-random";

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

      // Check if user account is active (verified)
      if (!user.isVerified) {
        return res.status(403).json({ 
          message: "Account is inactive. Please contact your administrator to activate your account." 
        });
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

      // Generate a cryptographically secure patient ID server-side
      // Security: MEDIUM (3.5) - Fixes Weak PRNG vulnerability
      // Uses crypto.randomBytes instead of Math.random()
      let patientId: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Ensure patient ID uniqueness with retry logic
      do {
        patientId = generateSecurePatientId();
        const existingPatient = await storage.getUserByPatientId(patientId);
        if (!existingPatient) break;
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: "Failed to generate unique patient ID" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        mobileNumber: mobile,
        patientId, // Server-generated secure patient ID
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
        role: user.role,
        patientId: user.patientId // Server-generated secure patient ID
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
          age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'Unknown'
        };
      }));
      
      res.json(patientsWithStats);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
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

  // Route to match frontend call for patient access toggle
  app.put("/api/admin/patient/:patientId/access", async (req, res) => {
    try {
      const { patientId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }

      await storage.updatePatientAccess(patientId, isActive);
      res.json({ 
        success: true,
        message: `Patient access ${isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      console.error("Error updating patient access:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update patient access" 
      });
    }
  });

  // Vital signs endpoints
  app.post("/api/vital-signs", async (req, res) => {
    try {
      const { patientId, heartRate, bloodPressure, bloodPressureSystolic, bloodPressureDiastolic, temperature, oxygenLevel, bloodGlucose } = req.body;

      // Only patientId is required, other vitals are optional
      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }

      // Build vital signs data with only provided fields
      const vitalSignsData: any = {
        patientId: String(patientId)
      };

      if (heartRate) vitalSignsData.heartRate = parseInt(heartRate);
      
      if (bloodPressure && bloodPressure.includes('/')) {
        vitalSignsData.bloodPressureSystolic = parseInt(bloodPressure.split('/')[0]);
        vitalSignsData.bloodPressureDiastolic = parseInt(bloodPressure.split('/')[1]);
      } else {
        if (bloodPressureSystolic) vitalSignsData.bloodPressureSystolic = parseInt(bloodPressureSystolic);
        if (bloodPressureDiastolic) vitalSignsData.bloodPressureDiastolic = parseInt(bloodPressureDiastolic);
      }
      
      if (temperature) vitalSignsData.temperature = temperature.toString();
      if (oxygenLevel) vitalSignsData.oxygenLevel = parseInt(oxygenLevel);
      if (bloodGlucose) vitalSignsData.bloodGlucose = parseInt(bloodGlucose);

      const vitalSigns = await storage.createVitalSigns(vitalSignsData);

      // Check for critical vitals and send email notifications
      if (isVitalsCritical(vitalSigns)) {
        await storage.createAlert({
          patientId,
          type: getCriticalAlertType(vitalSigns),
          title: "Critical Vital Signs Alert",
          description: `Critical vital signs detected: ${getCriticalValue(vitalSigns)}`
        });

        // Send email notification to assigned doctor
        await emailNotificationService.checkCriticalVitals(patientId, vitalSigns);
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

  // Consolidated vital signs endpoint - saves all vitals in ONE record per check
  app.post("/api/vital-signs/consolidated", async (req, res) => {
    try {
      const { patientId, deviceId, heartRate, systolic, diastolic, temperature, oxygenLevel, bloodGlucose } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }

      // Build consolidated vital signs data
      const vitalSignsData: any = {
        patientId: String(patientId)
      };

      if (deviceId) vitalSignsData.deviceId = deviceId;
      if (heartRate !== undefined && heartRate !== null) vitalSignsData.heartRate = parseInt(heartRate);
      if (systolic !== undefined && systolic !== null) vitalSignsData.bloodPressureSystolic = parseInt(systolic);
      if (diastolic !== undefined && diastolic !== null) vitalSignsData.bloodPressureDiastolic = parseInt(diastolic);
      if (temperature !== undefined && temperature !== null) vitalSignsData.temperature = temperature.toString();
      if (oxygenLevel !== undefined && oxygenLevel !== null) vitalSignsData.oxygenLevel = parseInt(oxygenLevel);
      if (bloodGlucose !== undefined && bloodGlucose !== null) vitalSignsData.bloodGlucose = parseInt(bloodGlucose);

      // Calculate status based on all vitals
      vitalSignsData.status = calculateVitalSignsStatus(vitalSignsData);

      const vitalSigns = await storage.createVitalSigns(vitalSignsData);

      // Create alert if critical
      if (vitalSignsData.status === "critical") {
        await storage.createAlert({
          patientId,
          type: "critical",
          title: "Critical Vital Signs Alert",
          description: `Critical vital signs detected at ${new Date().toLocaleTimeString()}`
        });
      }

      res.status(201).json(vitalSigns);
    } catch (error) {
      console.error("Error creating consolidated vital signs:", error);
      res.status(500).json({ message: "Failed to record vital signs" });
    }
  });

  // Retrieve consolidated vital signs (one row per check with all vitals)
  app.get("/api/vital-signs/consolidated/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const vitalSigns = await storage.getVitalSignsByPatient(patientId);
      
      // Return consolidated records sorted by timestamp descending
      const consolidated = vitalSigns
        .slice(0, limit)
        .map((vs: any) => ({
          id: vs.id,
          timestamp: vs.timestamp,
          heartRate: vs.heartRate,
          bloodPressure: vs.bloodPressureSystolic && vs.bloodPressureDiastolic ? `${vs.bloodPressureSystolic}/${vs.bloodPressureDiastolic}` : 'N/A',
          systolic: vs.bloodPressureSystolic,
          diastolic: vs.bloodPressureDiastolic,
          temperature: vs.temperature,
          oxygenLevel: vs.oxygenLevel,
          bloodGlucose: vs.bloodGlucose,
          status: vs.status || 'normal'
        }));
      
      res.json(consolidated);
    } catch (error) {
      console.error("Error fetching consolidated vital signs:", error);
      res.status(500).json({ message: "Failed to fetch vital signs" });
    }
  });

  // Blood Glucose API Endpoints
  app.get("/api/blood-glucose/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const glucoseData = await storage.getBloodGlucoseDataByPatient(patientId, limit);
      res.json(glucoseData);
    } catch (error) {
      console.error("Error fetching blood glucose data:", error);
      res.status(500).json({ message: "Failed to fetch blood glucose data" });
    }
  });

  app.post("/api/blood-glucose/start-measurement", async (req, res) => {
    try {
      const { patientId, deviceId } = req.body;
      if (!patientId || !deviceId) {
        return res.status(400).json({ message: "Patient ID and Device ID are required" });
      }
      
      const success = await bloodGlucoseManager.startGlucoseMeasurement(patientId, deviceId);
      if (success) {
        res.json({ message: "Glucose measurement started successfully", status: "measuring" });
      } else {
        res.status(500).json({ message: "Failed to start glucose measurement" });
      }
    } catch (error) {
      console.error("Error starting glucose measurement:", error);
      res.status(500).json({ message: "Failed to start glucose measurement" });
    }
  });

  app.post("/api/blood-glucose/simulate", async (req, res) => {
    try {
      const { patientId, deviceId, glucoseLevel } = req.body;
      if (!patientId || !deviceId || !glucoseLevel) {
        return res.status(400).json({ message: "Patient ID, Device ID, and Glucose Level are required" });
      }
      
      await bloodGlucoseManager.simulateGlucoseMeasurement(patientId, deviceId, glucoseLevel);
      res.json({ message: "Glucose measurement simulation started", status: "simulating" });
    } catch (error) {
      console.error("Error simulating glucose measurement:", error);
      res.status(500).json({ message: "Failed to simulate glucose measurement" });
    }
  });

  // Battery API Endpoints
  app.get("/api/battery/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const batteryInfo = await batteryManager.getBattery(deviceId);
      
      if (!batteryInfo) {
        return res.status(404).json({ message: "Device not found or battery information unavailable" });
      }
      
      res.json(batteryInfo);
    } catch (error) {
      console.error("Error fetching battery information:", error);
      res.status(500).json({ message: "Failed to fetch battery information" });
    }
  });

  app.get("/api/battery/patient/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const devicesBattery = await batteryManager.getPatientDevicesBattery(patientId);
      res.json(devicesBattery);
    } catch (error) {
      console.error("Error fetching patient devices battery:", error);
      res.status(500).json({ message: "Failed to fetch devices battery information" });
    }
  });

  app.post("/api/battery/simulate-level", async (req, res) => {
    try {
      const { deviceId, patientId, batteryLevel } = req.body;
      if (!deviceId || !patientId || batteryLevel === undefined) {
        return res.status(400).json({ message: "Device ID, Patient ID, and Battery Level are required" });
      }
      
      if (batteryLevel < 0 || batteryLevel > 100) {
        return res.status(400).json({ message: "Battery level must be between 0 and 100" });
      }
      
      await batteryManager.simulateBatteryLevel(deviceId, patientId, batteryLevel);
      res.json({ message: "Battery level simulation completed", batteryLevel });
    } catch (error) {
      console.error("Error simulating battery level:", error);
      res.status(500).json({ message: "Failed to simulate battery level" });
    }
  });

  app.post("/api/battery/simulate-charging", async (req, res) => {
    try {
      const { deviceId, patientId, isCharging, method } = req.body;
      if (!deviceId || !patientId || isCharging === undefined) {
        return res.status(400).json({ message: "Device ID, Patient ID, and Charging Status are required" });
      }
      
      await batteryManager.simulateChargingStatus(deviceId, patientId, isCharging, method);
      res.json({ message: "Charging status simulation completed", isCharging, method });
    } catch (error) {
      console.error("Error simulating charging status:", error);
      res.status(500).json({ message: "Failed to simulate charging status" });
    }
  });

  // ECG API Endpoints
  app.get("/api/ecg/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const ecgData = await ecgDataManager.getEcgData(deviceId);
      
      if (!ecgData) {
        return res.json({ message: "No ECG data available", wavePoints: [] });
      }
      
      res.json(ecgData);
    } catch (error) {
      console.error("Error fetching ECG data:", error);
      res.status(500).json({ message: "Failed to fetch ECG data" });
    }
  });

  app.get("/api/ecg/wave/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const waveData = ecgDataManager.getCurrentWaveData(deviceId);
      res.json({ deviceId, wavePoints: waveData, timestamp: new Date() });
    } catch (error) {
      console.error("Error fetching ECG wave data:", error);
      res.status(500).json({ message: "Failed to fetch ECG wave data" });
    }
  });

  app.post("/api/ecg/start-recording", async (req, res) => {
    try {
      const { deviceId, patientId } = req.body;
      if (!deviceId || !patientId) {
        return res.status(400).json({ message: "Device ID and Patient ID are required" });
      }
      
      const success = await ecgDataManager.startEcgRecording(deviceId, patientId);
      if (success) {
        res.json({ message: "ECG recording started successfully", status: "recording" });
      } else {
        res.status(500).json({ message: "Failed to start ECG recording" });
      }
    } catch (error) {
      console.error("Error starting ECG recording:", error);
      res.status(500).json({ message: "Failed to start ECG recording" });
    }
  });

  app.post("/api/ecg/stop-recording", async (req, res) => {
    try {
      const { deviceId, patientId } = req.body;
      if (!deviceId || !patientId) {
        return res.status(400).json({ message: "Device ID and Patient ID are required" });
      }
      
      const success = await ecgDataManager.stopEcgRecording(deviceId, patientId);
      if (success) {
        res.json({ message: "ECG recording stopped successfully", status: "stopped" });
      } else {
        res.status(500).json({ message: "Failed to stop ECG recording" });
      }
    } catch (error) {
      console.error("Error stopping ECG recording:", error);
      res.status(500).json({ message: "Failed to stop ECG recording" });
    }
  });

  app.post("/api/ecg/simulate", async (req, res) => {
    try {
      const { deviceId, patientId } = req.body;
      if (!deviceId || !patientId) {
        return res.status(400).json({ message: "Device ID and Patient ID are required" });
      }
      
      await ecgDataManager.simulateEcgSession(deviceId, patientId);
      res.json({ message: "ECG simulation completed successfully", status: "simulated" });
    } catch (error) {
      console.error("Error simulating ECG session:", error);
      res.status(500).json({ message: "Failed to simulate ECG session" });
    }
  });

  // Multi-Device Data Persistence Routes (UNKTOP SDK Integration)
  
  // Save ECG data from UNKTOP devices
  app.post("/api/ecg/data", async (req, res) => {
    try {
      const { patientId, deviceId, heartRate, moodIndex, rrInterval, hrv, respiratoryRate, fingerDetected, recordingDuration } = req.body;
      
      if (!patientId || !deviceId) {
        return res.status(400).json({ message: "Patient ID and Device ID are required" });
      }

      const ecgData = await storage.saveEcgData({
        patientId,
        deviceId,
        heartRate,
        moodIndex,
        rrInterval,
        hrv,
        respiratoryRate,
        fingerDetected,
        recordingDuration,
      });

      res.status(201).json(ecgData);
    } catch (error) {
      console.error("Error saving ECG data:", error);
      res.status(500).json({ message: "Failed to save ECG data" });
    }
  });

  // Save blood oxygen data from UNKTOP devices
  app.post("/api/blood-oxygen/data", async (req, res) => {
    try {
      const { patientId, deviceId, bloodOxygen, heartRate, fingerDetected } = req.body;
      
      if (!patientId || !deviceId || bloodOxygen === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, and Blood Oxygen level are required" });
      }

      const oxData = await storage.saveBloodOxygenData({
        patientId,
        deviceId,
        bloodOxygen,
        heartRate,
        fingerDetected,
      });

      res.status(201).json(oxData);
    } catch (error) {
      console.error("Error saving blood oxygen data:", error);
      res.status(500).json({ message: "Failed to save blood oxygen data" });
    }
  });

  // Save blood pressure data from UNKTOP devices
  app.post("/api/blood-pressure/data", async (req, res) => {
    try {
      const { patientId, deviceId, systolic, diastolic, heartRate, cuffPressure, measurementProgress } = req.body;
      
      if (!patientId || !deviceId || systolic === undefined || diastolic === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, Systolic, and Diastolic are required" });
      }

      const bpData = await storage.saveBloodPressureData({
        patientId,
        deviceId,
        systolic,
        diastolic,
        heartRate,
        cuffPressure,
        measurementProgress,
      });

      // Check for critical blood pressure
      if (systolic > 180 || diastolic > 120) {
        await storage.createAlert({
          patientId,
          type: "critical",
          title: "Critical Blood Pressure Alert",
          description: `Blood pressure dangerously high: ${systolic}/${diastolic} mmHg`,
        });
      }

      res.status(201).json(bpData);
    } catch (error) {
      console.error("Error saving blood pressure data:", error);
      res.status(500).json({ message: "Failed to save blood pressure data" });
    }
  });

  // Save blood glucose data from UNKTOP devices
  app.post("/api/blood-glucose/data", async (req, res) => {
    try {
      const { patientId, deviceId, glucoseLevel, testStripStatus, measurementType } = req.body;
      
      if (!patientId || !deviceId || glucoseLevel === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, and Glucose Level are required" });
      }

      const glucoseData = await storage.saveBloodGlucoseData({
        patientId,
        deviceId,
        glucoseLevel,
        testStripStatus,
        measurementType,
      });

      // Check for critical glucose levels
      if (glucoseLevel > 300 || glucoseLevel < 50) {
        await storage.createAlert({
          patientId,
          type: "critical",
          title: "Critical Blood Glucose Alert",
          description: `Blood glucose ${glucoseLevel > 300 ? 'dangerously high' : 'dangerously low'}: ${glucoseLevel} mg/dL`,
        });
      }

      res.status(201).json(glucoseData);
    } catch (error) {
      console.error("Error saving blood glucose data:", error);
      res.status(500).json({ message: "Failed to save blood glucose data" });
    }
  });

  // Save temperature data from UNKTOP devices
  app.post("/api/temperature/data", async (req, res) => {
    try {
      const { patientId, deviceId, temperature, measurementSite } = req.body;
      
      if (!patientId || !deviceId || temperature === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, and Temperature are required" });
      }

      const tempData = await storage.saveTemperatureData({
        patientId,
        deviceId,
        temperature: temperature.toString(),
        measurementSite,
      });

      // Check for fever
      if (temperature > 38.5) {
        await storage.createAlert({
          patientId,
          type: "warning",
          title: "High Temperature Alert",
          description: `Fever detected: ${temperature}°C`,
        });
      }

      res.status(201).json(tempData);
    } catch (error) {
      console.error("Error saving temperature data:", error);
      res.status(500).json({ message: "Failed to save temperature data" });
    }
  });

  // Patient update endpoint for edit functionality
  app.put("/api/patients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Validate required fields
      if (!updateData.firstName || !updateData.lastName || !updateData.email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      const updatedPatient = await storage.updateUser(parseInt(id), updateData);
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json({ message: "Patient updated successfully", patient: updatedPatient });
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Reset patient password
  app.post("/api/patients/:id/reset-password", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Generate a cryptographically secure temporary password
      // Security: MEDIUM (6.1) - Fixed Weak PRNG vulnerability
      const temporaryPassword = generateSecurePassword(12);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      
      const updatedPatient = await storage.updateUser(parseInt(id), {
        password: hashedPassword
      });
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Log the password reset action
      console.log(`Password reset for patient ID: ${id}, new temp password generated`);
      
      res.json({ 
        message: "Password reset successfully", 
        temporaryPassword: temporaryPassword,
        patientId: updatedPatient.patientId,
        patientName: `${updatedPatient.firstName} ${updatedPatient.lastName}`
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Toggle User Status endpoint
  app.patch("/api/users/:id/toggle-status", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Store user info for logging
      const userInfo = `${user.firstName} ${user.lastName} (${user.patientId})`;
      const newStatus = !user.isVerified;

      // Toggle the user's active status (using isVerified as active status)
      const updatedUser = await storage.updateUser(userId, { isVerified: newStatus });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user status" });
      }

      console.log(`User status changed: ${userInfo} - ID: ${userId}, New Status: ${newStatus ? 'Active' : 'Inactive'}`);
      
      res.json({ 
        message: "User status updated successfully",
        updatedUser: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          patientId: updatedUser.patientId,
          isActive: updatedUser.isVerified // Map isVerified to isActive for frontend
        }
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Forgot Password and Reset Password endpoints
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          message: "If an account with this email exists, a reset code has been sent" 
        });
      }

      // Generate a cryptographically secure 6-digit reset code
      // Security: MEDIUM (6.1) - Fixed Weak PRNG vulnerability
      const resetCode = generateSecureOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset code (in production, this would be in a separate table)
      await storage.updateUser(user.id, {
        resetCode,
        resetCodeExpires: expiresAt
      });

      // In production, send email with reset code
      console.log(`Password reset code for ${email}: ${resetCode} (expires at ${expiresAt})`);
      
      res.json({ 
        message: "If an account with this email exists, a reset code has been sent" 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Failed to process forgot password request" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid reset code or expired" });
      }

      // Check if reset code matches and hasn't expired
      if (user.resetCode !== code || !user.resetCodeExpires || new Date() > user.resetCodeExpires) {
        return res.status(400).json({ message: "Invalid reset code or expired" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset code
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null
      });

      console.log(`Password successfully reset for user: ${email}`);
      
      res.json({ 
        message: "Password reset successfully" 
      });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Failed to reset password" });
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
      const vitalsSnapshot = await storage.getLatestVitalsSnapshot(patientId);
      const vitalsHistory = await storage.getVitalSignsByPatient(patientId);
      const checkupHistory = await storage.getCheckupHistory(patientId);
      const alerts = await storage.getAlertsByPatient(patientId);
      const reminderSettings = await storage.getReminderSettings(patientId);

      // Format vitals data using per-vital latest non-null values
      const formattedVitals = {
        heartRate: vitalsSnapshot.heartRate ?? '--',
        bloodPressure: (vitalsSnapshot.bloodPressureSystolic !== null && vitalsSnapshot.bloodPressureDiastolic !== null) 
          ? `${vitalsSnapshot.bloodPressureSystolic}/${vitalsSnapshot.bloodPressureDiastolic}`
          : '--/--',
        temperature: vitalsSnapshot.temperature ? parseFloat(vitalsSnapshot.temperature).toFixed(1) : '--',
        oxygenLevel: vitalsSnapshot.oxygenLevel ?? '--',
        bloodGlucose: vitalsSnapshot.bloodGlucose ?? '--',
        timestamp: vitalsSnapshot.timestamp || new Date()
      };

      const stats = {
        user: formatPatientData(user),
        vitals: formattedVitals,
        vitalsHistory: vitalsHistory.slice(-30),
        checkupHistory: checkupHistory.slice(-10),
        alerts: alerts.slice(-5),
        reminderSettings,
        healthScore: 85,
        complianceRate: 92,
        nextAppointment: "2025-06-25",
        lastCheckup: checkupHistory.length > 0 ? 
          new Date(checkupHistory[checkupHistory.length - 1].date).toLocaleDateString() : 
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

  app.get("/api/hospitals/abudhabi", async (req, res) => {
    try {
      const hospitals = [
        { id: "1", name: "Sheikh Khalifa Medical City", location: "Abu Dhabi", type: "Government" },
        { id: "2", name: "Cleveland Clinic Abu Dhabi", location: "Abu Dhabi", type: "Private" },
        { id: "3", name: "Mediclinic City Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "4", name: "Abu Dhabi Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "5", name: "Al Noor Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "6", name: "Burjeel Hospital", location: "Abu Dhabi", type: "Private" },
        { id: "7", name: "Danat Al Emarat Hospital", location: "Abu Dhabi", type: "Specialized" }
      ];
      
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching Abu Dhabi hospitals:", error);
      res.status(500).json({ message: "Failed to fetch Abu Dhabi hospitals" });
    }
  });

  // Checkup and scheduling endpoints
  app.post("/api/checkup-log", async (req, res) => {
    try {
      const { patientId, type, notes, nextScheduledDate } = req.body;

      const checkupLog = await storage.createCheckupLog({
        patientId,
        status: type || "routine",
        notes: notes || "",
        date: new Date(),
        vitalSignsId: null
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
        frequency: 1,
        isActive: true,
        pushNotifications: vitalsReminder || false,
        emailAlerts: medicationReminder || false,
        smsReminders: appointmentReminder || false
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

  // HC03 Device Management Endpoints
  app.post("/api/hc03/devices/register", async (req, res) => {
    try {
      const { deviceId, deviceName, macAddress, firmwareVersion, patientId } = req.body;
      
      if (!deviceId || !patientId) {
        return res.status(400).json({ message: "Device ID and Patient ID are required" });
      }

      const deviceData = {
        deviceId,
        deviceName: deviceName || `HC03-${deviceId}`,
        macAddress,
        firmwareVersion,
        patientId,
        batteryLevel: 100,
        chargingStatus: false
      };

      const registeredDevice = await storage.registerHc03Device(deviceData);
      console.log(`HC03 device registered: ${deviceId} for patient ${patientId}`);
      
      res.json({
        message: "Device registered successfully",
        device: registeredDevice
      });
    } catch (error) {
      console.error("Error registering HC03 device:", error);
      res.status(500).json({ message: "Failed to register device" });
    }
  });

  app.get("/api/hc03/devices/patient/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const devices = await storage.getHc03DevicesByPatient(patientId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching patient devices:", error);
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.patch("/api/hc03/devices/:deviceId/status", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { status } = req.body;
      
      if (!status || !['connected', 'disconnected', 'scanning'].includes(status)) {
        return res.status(400).json({ message: "Valid status required (connected, disconnected, scanning)" });
      }

      await storage.updateDeviceStatus(deviceId, status);
      console.log(`Device ${deviceId} status updated to: ${status}`);
      
      res.json({ message: "Device status updated successfully" });
    } catch (error) {
      console.error("Error updating device status:", error);
      res.status(500).json({ message: "Failed to update device status" });
    }
  });

  app.patch("/api/hc03/devices/:deviceId/battery", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { batteryLevel, chargingStatus } = req.body;
      
      if (batteryLevel === undefined || chargingStatus === undefined) {
        return res.status(400).json({ message: "Battery level and charging status are required" });
      }

      await storage.updateDeviceBattery(deviceId, batteryLevel, chargingStatus);
      
      res.json({ message: "Device battery updated successfully" });
    } catch (error) {
      console.error("Error updating device battery:", error);
      res.status(500).json({ message: "Failed to update device battery" });
    }
  });

  // Blood Oxygen Measurement Endpoints
  app.get("/api/hc03/blood-oxygen/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const bloodOxygenData = await storage.getBloodOxygenDataByPatient(patientId, limit);
      res.json(bloodOxygenData);
    } catch (error) {
      console.error("Error fetching blood oxygen data:", error);
      res.status(500).json({ message: "Failed to fetch blood oxygen data" });
    }
  });

  app.post("/api/hc03/blood-oxygen", async (req, res) => {
    try {
      const { patientId, deviceId, bloodOxygen, heartRate, fingerDetected, waveData } = req.body;
      
      if (!patientId || !deviceId || bloodOxygen === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, and blood oxygen level are required" });
      }

      const savedData = await storage.saveBloodOxygenData({
        patientId,
        deviceId,
        bloodOxygen,
        heartRate,
        fingerDetection: fingerDetected,
        bloodOxygenWaveData: waveData
      });

      res.json({
        message: "Blood oxygen data saved successfully",
        data: savedData
      });
    } catch (error) {
      console.error("Error saving blood oxygen data:", error);
      res.status(500).json({ message: "Failed to save blood oxygen data" });
    }
  });

  // Blood Pressure Measurement Endpoints
  app.get("/api/hc03/blood-pressure/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const bloodPressureData = await storage.getBloodPressureDataByPatient(patientId, limit);
      res.json(bloodPressureData);
    } catch (error) {
      console.error("Error fetching blood pressure data:", error);
      res.status(500).json({ message: "Failed to fetch blood pressure data" });
    }
  });

  app.post("/api/hc03/blood-pressure", async (req, res) => {
    try {
      const { patientId, deviceId, systolic, diastolic, heartRate, measurementProgress, cuffPressure } = req.body;
      
      if (!patientId || !deviceId || !systolic || !diastolic) {
        return res.status(400).json({ message: "Patient ID, Device ID, systolic, and diastolic pressures are required" });
      }

      const savedData = await storage.saveBloodPressureData({
        patientId,
        deviceId,
        ps: systolic,
        pd: diastolic,
        hr: heartRate,
        progress: measurementProgress,
        cuffPressure
      });

      res.json({
        message: "Blood pressure data saved successfully",
        data: savedData
      });
    } catch (error) {
      console.error("Error saving blood pressure data:", error);
      res.status(500).json({ message: "Failed to save blood pressure data" });
    }
  });

  // Temperature Measurement Endpoints
  app.get("/api/hc03/temperature/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const temperatureData = await storage.getTemperatureDataByPatient(patientId, limit);
      res.json(temperatureData);
    } catch (error) {
      console.error("Error fetching temperature data:", error);
      res.status(500).json({ message: "Failed to fetch temperature data" });
    }
  });

  app.post("/api/hc03/temperature", async (req, res) => {
    try {
      const { patientId, deviceId, temperature, measurementSite } = req.body;
      
      if (!patientId || !deviceId || temperature === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, and temperature are required" });
      }

      const savedData = await storage.saveTemperatureData({
        patientId,
        deviceId,
        temperature,
        measurementSite: measurementSite || 'forehead'
      });

      res.json({
        message: "Temperature data saved successfully",
        data: savedData
      });
    } catch (error) {
      console.error("Error saving temperature data:", error);
      res.status(500).json({ message: "Failed to save temperature data" });
    }
  });

  // ECG Data Endpoints (enhanced for HC03)
  app.post("/api/hc03/ecg", async (req, res) => {
    try {
      const { patientId, deviceId, waveData, heartRate, moodIndex, rrInterval, hrv, respiratoryRate, fingerDetected, recordingDuration } = req.body;
      
      if (!patientId || !deviceId) {
        return res.status(400).json({ message: "Patient ID and Device ID are required" });
      }

      const savedData = await storage.saveEcgData({
        patientId,
        deviceId,
        waveData,
        hr: heartRate,
        moodIndex,
        rr: rrInterval,
        hrv,
        respiratoryRate,
        touch: fingerDetected,
        recordingDuration
      });

      res.json({
        message: "ECG data saved successfully",
        data: savedData
      });
    } catch (error) {
      console.error("Error saving ECG data:", error);
      res.status(500).json({ message: "Failed to save ECG data" });
    }
  });

  app.get("/api/hc03/ecg/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const ecgData = await storage.getEcgDataByPatient(patientId, limit);
      res.json(ecgData);
    } catch (error) {
      console.error("Error fetching ECG data:", error);
      res.status(500).json({ message: "Failed to fetch ECG data" });
    }
  });

  // Blood Glucose Data (enhanced for HC03)
  app.post("/api/hc03/blood-glucose", async (req, res) => {
    try {
      const { patientId, deviceId, glucoseLevel, testStripStatus, measurementType } = req.body;
      
      if (!patientId || !deviceId || glucoseLevel === undefined) {
        return res.status(400).json({ message: "Patient ID, Device ID, and glucose level are required" });
      }

      const savedData = await storage.saveBloodGlucoseData({
        patientId,
        deviceId,
        bloodGlucosePaperData: glucoseLevel,
        bloodGlucosePaperState: testStripStatus || 'inserted',
        measurementType: measurementType || 'fingerstick'
      });

      res.json({
        message: "Blood glucose data saved successfully",
        data: savedData
      });
    } catch (error) {
      console.error("Error saving blood glucose data:", error);
      res.status(500).json({ message: "Failed to save blood glucose data" });
    }
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

  function calculateAge(dateOfBirth: any) {
    if (!dateOfBirth) return 'Unknown';
    const birthDate = new Date(dateOfBirth);
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

  // Consolidated vital signs status calculation
  function calculateVitalSignsStatus(vitals: any): string {
    if (!vitals) return "normal";
    
    // Critical conditions
    if (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 50)) return "critical";
    if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic > 180) return "critical";
    if (vitals.bloodPressureDiastolic && vitals.bloodPressureDiastolic > 120) return "critical";
    if (vitals.temperature && (vitals.temperature > 39.0 || vitals.temperature < 35.0)) return "critical";
    if (vitals.oxygenLevel && vitals.oxygenLevel < 90) return "critical";
    if (vitals.bloodGlucose && (vitals.bloodGlucose > 300 || vitals.bloodGlucose < 70)) return "critical";
    
    // Attention conditions
    if (vitals.heartRate && (vitals.heartRate > 100 || vitals.heartRate < 60)) return "attention";
    if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic > 140) return "attention";
    if (vitals.temperature && (vitals.temperature > 38.0 || vitals.temperature < 36.1)) return "attention";
    if (vitals.oxygenLevel && vitals.oxygenLevel < 95) return "attention";
    if (vitals.bloodGlucose && (vitals.bloodGlucose > 200 || vitals.bloodGlucose < 100)) return "attention";
    
    return "normal";
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
  
  // Initialize HC03 WebSocket service
  const wsService = new HC03WebSocketService(server);
  console.log('HC03 WebSocket service initialized');
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}