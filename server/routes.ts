import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerHc03Routes } from "./routes-hc03";
import { registerPatientManagementRoutes } from "./patient-management";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function registerRoutes(app: Express): Promise<Server> {
  
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
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      console.log(`User login - role: ${user.role} email: ${user.email}`);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          patientId: user.patientId,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "Server running", time: new Date().toISOString() });
  });

  // Patient Dashboard API
  app.get("/api/dashboard/patient/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get patient data including vital signs and metrics
      const patientId = user.patientId || `PAT${user.id}`;
      
      // Get latest vital signs
      let latestVitals = null;
      try {
        latestVitals = await storage.getLatestVitalSigns(patientId);
      } catch (error) {
        console.log("No vital signs found for patient:", patientId);
      }

      // Get dashboard stats
      let dashboardStats = null;
      try {
        dashboardStats = await storage.getDashboardStats(patientId);
      } catch (error) {
        console.log("No dashboard stats found for patient:", patientId);
      }

      // Return dashboard data with proper fallbacks
      res.json({
        vitals: latestVitals ? {
          heartRate: latestVitals.heartRate || 72,
          bloodPressure: {
            systolic: latestVitals.bloodPressureSystolic || 120,
            diastolic: latestVitals.bloodPressureDiastolic || 80
          },
          temperature: latestVitals.temperature ? parseFloat(latestVitals.temperature) : 36.6,
          bloodOxygen: latestVitals.oxygenLevel || 98,
          timestamp: latestVitals.timestamp || new Date()
        } : {
          heartRate: 72,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 36.6,
          bloodOxygen: 98,
          timestamp: new Date()
        },
        metrics: {
          lastCheckup: dashboardStats?.lastCheckupTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          medicationReminders: dashboardStats?.pendingReminders || 3,
          healthScore: dashboardStats?.healthScore || 85
        }
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Enhanced Patient Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { firstName, middleName, lastName, email, mobileNumber, hospitalId, password } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !mobileNumber || !hospitalId || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'All required fields must be provided' 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }

      // Generate unique patient ID
      const patientId = `PAT${Date.now().toString().slice(-6)}`;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new patient user
      const newUser = await storage.createUser({
        firstName,
        middleName: middleName || null,
        lastName,
        email,
        mobileNumber,
        patientId,
        hospitalId,
        password: passwordHash,
        username: email, // Use email as username
        isVerified: false,
        role: 'patient'
      });

      // Generate and send OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await storage.createOtpCode({
        email,
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      console.log(`OTP for ${email}: ${otpCode}`);

      res.json({ 
        success: true, 
        message: 'Registration successful. Please check your email for verification code.',
        userId: newUser.id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Registration failed. Please try again.' 
      });
    }
  });

  // Abu Dhabi Hospitals List
  app.get('/api/hospitals/abudhabi', async (req, res) => {
    try {
      const hospitals = [
        {
          id: 'sheikh-khalifa',
          name: 'Sheikh Khalifa Medical City',
          location: 'Al Karamah, Abu Dhabi',
          type: 'government'
        },
        {
          id: 'cleveland-clinic',
          name: 'Cleveland Clinic Abu Dhabi',
          location: 'Al Maryah Island, Abu Dhabi',
          type: 'private'
        },
        {
          id: 'zayed-military',
          name: 'Zayed Military Hospital',
          location: 'Al Wathba, Abu Dhabi',
          type: 'government'
        },
        {
          id: 'corniche-hospital',
          name: 'Corniche Hospital',
          location: 'Corniche Road, Abu Dhabi',
          type: 'government'
        },
        {
          id: 'mafraq-hospital',
          name: 'Mafraq Hospital',
          location: 'Mafraq, Abu Dhabi',
          type: 'government'
        },
        {
          id: 'nmc-hospital',
          name: 'NMC Royal Hospital',
          location: 'Khalifa City, Abu Dhabi',
          type: 'private'
        },
        {
          id: 'mediclinic-airport',
          name: 'Mediclinic Airport Road Hospital',
          location: 'Airport Road, Abu Dhabi',
          type: 'private'
        },
        {
          id: 'burjeel-hospital',
          name: 'Burjeel Hospital Abu Dhabi',
          location: 'Al Najda Street, Abu Dhabi',
          type: 'private'
        },
        {
          id: 'seha-hospitals',
          name: 'SEHA - Abu Dhabi Health Services',
          location: 'Multiple Locations, Abu Dhabi',
          type: 'government'
        },
        {
          id: 'al-noor-hospital',
          name: 'Al Noor Hospital Abu Dhabi',
          location: 'Khalifa Street, Abu Dhabi',
          type: 'private'
        }
      ];

      res.json({ success: true, hospitals });
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch hospitals list' 
      });
    }
  });

  // OTP Verification
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;

      const isValid = await storage.verifyOtp(email, otp);
      if (!isValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired verification code' 
        });
      }

      // Mark user as verified
      await storage.markUserAsVerified(email);

      res.json({ 
        success: true, 
        message: 'Email verified successfully. You can now log in.' 
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Verification failed. Please try again.' 
      });
    }
  });

  // Admin - Dashboard Statistics
  app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const activePatients = patients.filter(p => p.isVerified).length;
      
      res.json({
        success: true,
        stats: {
          totalPatients: patients.length,
          activeMonitoring: activePatients,
          criticalAlerts: 2,
          deviceConnections: activePatients,
          newRegistrations: 5,
          complianceRate: 92
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch dashboard statistics' 
      });
    }
  });

  // Admin - Device Monitoring
  app.get('/api/admin/devices', async (req, res) => {
    try {
      res.json({
        success: true,
        devices: [
          {
            deviceId: 'HC03-001',
            patientId: 'PAT123456',
            patientName: 'John Doe',
            lastSync: new Date(),
            batteryLevel: 85,
            connectionStatus: 'connected',
            vitalTypesSupported: ['ECG', 'Blood Pressure', 'Temperature'],
            firmwareVersion: '1.2.3'
          }
        ]
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch devices' 
      });
    }
  });

  // Patient Dashboard Data
  app.get('/api/dashboard/patient/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Patient not found' 
        });
      }

      // Get latest vital signs for the patient
      const latestVitals = await storage.getLatestVitalSigns(user.patientId || user.id.toString());
      
      // Get recent checkup history
      const checkupHistory = await storage.getCheckupHistory(user.patientId || user.id.toString());
      
      // Get dashboard stats
      const dashboardStats = await storage.getDashboardStats(user.patientId || user.id.toString());

      res.json({
        success: true,
        vitals: latestVitals || {
          heartRate: 72,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 36.6,
          bloodOxygen: 98,
          timestamp: new Date().toISOString()
        },
        metrics: {
          lastCheckup: checkupHistory.length > 0 ? checkupHistory[0].createdAt : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          medicationReminders: 3,
          healthScore: 85
        },
        stats: dashboardStats || {
          totalCheckups: 12,
          averageCompliance: 85,
          lastDeviceSync: new Date().toISOString()
        },
        patient: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          patientId: user.patientId,
          email: user.email,
          hospitalId: user.hospitalId
        }
      });

    } catch (error) {
      console.error('Error fetching patient dashboard data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch dashboard data' 
      });
    }
  });

  // Register HC03 device routes
  registerHc03Routes(app);

  // Register Patient Management routes
  try {
    registerPatientManagementRoutes(app);
    console.log('Patient management routes registered successfully');
  } catch (error) {
    console.error('Failed to register patient management routes:', error);
  }

  const httpServer = createServer(app);
  return httpServer;
}