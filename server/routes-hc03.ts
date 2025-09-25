import type { Express } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { 
  insertHc03DeviceSchema,
  insertEcgDataSchema,
  insertBloodOxygenDataSchema,
  insertBloodPressureDataSchema,
  insertBloodGlucoseDataSchema,
  insertTemperatureDataSchema
} from "@shared/schema";

// Authentication middleware for user access
const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.role !== 'admin' && decoded.role !== 'doctor') {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export function registerHc03Routes(app: Express) {
  // HC03 Device Management Routes
  
  // Register a new HC03 device
  app.post('/api/hc03/devices', requireAuth, async (req, res) => {
    try {
      const deviceData = insertHc03DeviceSchema.parse(req.body);
      const device = await storage.registerHc03Device(deviceData);
      res.json(device);
    } catch (error) {
      console.error('Error registering HC03 device:', error);
      res.status(400).json({ error: 'Failed to register device' });
    }
  });

  // Get all HC03 devices for a patient
  app.get('/api/hc03/devices/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const devices = await storage.getHc03DevicesByPatient(patientId);
      res.json(devices);
    } catch (error) {
      console.error('Error fetching HC03 devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  // Update HC03 device
  app.patch('/api/hc03/devices/:deviceId', requireAuth, async (req, res) => {
    try {
      const { deviceId } = req.params;
      const updates = req.body;
      const device = await storage.updateHc03Device(deviceId, updates);
      res.json(device);
    } catch (error) {
      console.error('Error updating HC03 device:', error);
      res.status(500).json({ error: 'Failed to update device' });
    }
  });

  // Update device connection status
  app.patch('/api/hc03/devices/:deviceId/status', requireAuth, async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { status } = req.body;
      await storage.updateDeviceStatus(deviceId, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating device status:', error);
      res.status(500).json({ error: 'Failed to update device status' });
    }
  });

  // Update device battery
  app.patch('/api/hc03/devices/:deviceId/battery', requireAuth, async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { batteryLevel, chargingStatus } = req.body;
      await storage.updateDeviceBattery(deviceId, batteryLevel, chargingStatus);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating device battery:', error);
      res.status(500).json({ error: 'Failed to update device battery' });
    }
  });

  // HC03 Data Storage Routes

  // Save ECG data
  app.post('/api/hc03/data/ecg', requireAuth, async (req, res) => {
    try {
      const ecgData = insertEcgDataSchema.parse(req.body);
      const savedData = await storage.saveEcgData(ecgData);
      res.json(savedData);
    } catch (error) {
      console.error('Error saving ECG data:', error);
      res.status(400).json({ error: 'Failed to save ECG data' });
    }
  });

  // Save blood oxygen data
  app.post('/api/hc03/data/blood-oxygen', requireAuth, async (req, res) => {
    try {
      const oxygenData = insertBloodOxygenDataSchema.parse(req.body);
      const savedData = await storage.saveBloodOxygenData(oxygenData);
      res.json(savedData);
    } catch (error) {
      console.error('Error saving blood oxygen data:', error);
      res.status(400).json({ error: 'Failed to save blood oxygen data' });
    }
  });

  // Save blood pressure data
  app.post('/api/hc03/data/blood-pressure', requireAuth, async (req, res) => {
    try {
      const bpData = insertBloodPressureDataSchema.parse(req.body);
      const savedData = await storage.saveBloodPressureData(bpData);
      res.json(savedData);
    } catch (error) {
      console.error('Error saving blood pressure data:', error);
      res.status(400).json({ error: 'Failed to save blood pressure data' });
    }
  });

  // Save blood glucose data
  app.post('/api/hc03/data/blood-glucose', requireAuth, async (req, res) => {
    try {
      const glucoseData = insertBloodGlucoseDataSchema.parse(req.body);
      const savedData = await storage.saveBloodGlucoseData(glucoseData);
      res.json(savedData);
    } catch (error) {
      console.error('Error saving blood glucose data:', error);
      res.status(400).json({ error: 'Failed to save blood glucose data' });
    }
  });

  // Save temperature data
  app.post('/api/hc03/data/temperature', requireAuth, async (req, res) => {
    try {
      const tempData = insertTemperatureDataSchema.parse(req.body);
      const savedData = await storage.saveTemperatureData(tempData);
      res.json(savedData);
    } catch (error) {
      console.error('Error saving temperature data:', error);
      res.status(400).json({ error: 'Failed to save temperature data' });
    }
  });

  // HC03 Data Retrieval Routes

  // Get ECG data for patient
  app.get('/api/hc03/data/ecg/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await storage.getEcgDataByPatient(patientId, limit);
      res.json(data);
    } catch (error) {
      console.error('Error fetching ECG data:', error);
      res.status(500).json({ error: 'Failed to fetch ECG data' });
    }
  });

  // Get blood oxygen data for patient
  app.get('/api/hc03/data/blood-oxygen/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await storage.getBloodOxygenDataByPatient(patientId, limit);
      res.json(data);
    } catch (error) {
      console.error('Error fetching blood oxygen data:', error);
      res.status(500).json({ error: 'Failed to fetch blood oxygen data' });
    }
  });

  // Get blood pressure data for patient
  app.get('/api/hc03/data/blood-pressure/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await storage.getBloodPressureDataByPatient(patientId, limit);
      res.json(data);
    } catch (error) {
      console.error('Error fetching blood pressure data:', error);
      res.status(500).json({ error: 'Failed to fetch blood pressure data' });
    }
  });

  // Get blood glucose data for patient
  app.get('/api/hc03/data/blood-glucose/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await storage.getBloodGlucoseDataByPatient(patientId, limit);
      res.json(data);
    } catch (error) {
      console.error('Error fetching blood glucose data:', error);
      res.status(500).json({ error: 'Failed to fetch blood glucose data' });
    }
  });

  // Get temperature data for patient
  app.get('/api/hc03/data/temperature/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await storage.getTemperatureDataByPatient(patientId, limit);
      res.json(data);
    } catch (error) {
      console.error('Error fetching temperature data:', error);
      res.status(500).json({ error: 'Failed to fetch temperature data' });
    }
  });

  // Get comprehensive health data for patient
  app.get('/api/hc03/data/comprehensive/:patientId', requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const [ecgData, oxygenData, bpData, glucoseData, tempData, devices] = await Promise.all([
        storage.getEcgDataByPatient(patientId, limit),
        storage.getBloodOxygenDataByPatient(patientId, limit),
        storage.getBloodPressureDataByPatient(patientId, limit),
        storage.getBloodGlucoseDataByPatient(patientId, limit),
        storage.getTemperatureDataByPatient(patientId, limit),
        storage.getHc03DevicesByPatient(patientId)
      ]);

      res.json({
        ecg: ecgData,
        bloodOxygen: oxygenData,
        bloodPressure: bpData,
        bloodGlucose: glucoseData,
        temperature: tempData,
        devices: devices
      });
    } catch (error) {
      console.error('Error fetching comprehensive health data:', error);
      res.status(500).json({ error: 'Failed to fetch comprehensive health data' });
    }
  });
}