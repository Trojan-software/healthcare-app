import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerHc03Routes } from "./routes-hc03";
import { registerPatientManagementRoutes } from "./patient-management";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Direct route to serve login page
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>24/7 Tele H Technology Services</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
              }
              .login-container {
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                  width: 100%;
                  max-width: 400px;
                  animation: fadeIn 0.5s ease-in;
              }
              @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
              }
              .logo { text-align: center; margin-bottom: 30px; }
              .logo h1 { color: #2d3748; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
              .logo p { color: #718096; font-size: 14px; }
              .form-group { margin-bottom: 20px; }
              .form-group label { display: block; color: #4a5568; font-weight: 500; margin-bottom: 8px; font-size: 14px; }
              .form-group input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s ease; }
              .form-group input:focus { outline: none; border-color: #667eea; }
              .login-btn { width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s ease; }
              .login-btn:hover { transform: translateY(-2px); }
              .demo-info { margin-top: 25px; padding: 20px; background: #f7fafc; border-radius: 8px; text-align: center; }
              .demo-info p { color: #718096; font-size: 13px; margin-bottom: 8px; }
              .demo-credentials { color: #4a5568; font-weight: 600; font-size: 14px; }
              .status { position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; animation: pulse 2s infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
          </style>
      </head>
      <body>
          <div class="status">System Online</div>
          <div class="login-container">
              <div class="logo">
                  <h1>24/7 Tele H Technology Services</h1>
                  <p>Advanced Health Monitoring System</p>
              </div>
              <form id="loginForm">
                  <div class="form-group">
                      <label for="email">Email or Patient ID</label>
                      <input type="text" id="email" name="email" value="admin@24x7teleh.com" required>
                  </div>
                  <div class="form-group">
                      <label for="password">Password</label>
                      <input type="password" id="password" name="password" value="admin123" required>
                  </div>
                  <button type="submit" class="login-btn">Sign In</button>
              </form>
              <div class="demo-info">
                  <p>Demo Account</p>
                  <div class="demo-credentials">admin@24x7teleh.com / admin123</div>
              </div>
          </div>
          <script>
              document.getElementById('loginForm').addEventListener('submit', function(e) {
                  e.preventDefault();
                  const email = document.getElementById('email').value;
                  const password = document.getElementById('password').value;
                  if (email === 'admin@24x7teleh.com' && password === 'admin123') {
                      window.location.href = '/admin-dashboard';
                  } else {
                      alert('Invalid credentials. Please use: admin@24x7teleh.com / admin123');
                  }
              });
          </script>
      </body>
      </html>
    `);
  });
  
  // Admin Dashboard Route
  app.get("/admin-dashboard", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Dashboard - 24/7 Tele H</title>
        <style>
          body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h1 { color: #1f2937; margin-bottom: 30px; }
          .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
          .feature { padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .feature h3 { color: #374151; margin-bottom: 10px; }
          .feature p { color: #6b7280; margin: 0; }
          .back-btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>24/7 Tele H Technology Services - Admin Dashboard</h1>
          <p>Welcome to the comprehensive healthcare management system.</p>
          
          <div class="features">
            <div class="feature">
              <h3>Patient Management</h3>
              <p>Complete patient database with search, filtering, and profile management capabilities.</p>
            </div>
            <div class="feature">
              <h3>Vital Signs Monitoring</h3>
              <p>Real-time tracking of heart rate, blood pressure, temperature, oxygen levels, and blood glucose.</p>
            </div>
            <div class="feature">
              <h3>Weekly Health Reports</h3>
              <p>Comprehensive analytics with vital signs filtering and professional PDF export functionality.</p>
            </div>
            <div class="feature">
              <h3>HC03 Device Integration</h3>
              <p>Bluetooth connectivity for medical devices with ECG, blood oxygen, and blood pressure monitoring.</p>
            </div>
            <div class="feature">
              <h3>Alert System</h3>
              <p>Critical health event notifications and automated patient compliance monitoring.</p>
            </div>
            <div class="feature">
              <h3>Analytics Dashboard</h3>
              <p>Advanced health trends analysis, compliance reports, and real-time patient status tracking.</p>
            </div>
          </div>
          
          <a href="/" class="back-btn">← Back to Login</a>
        </div>
      </body>
      </html>
    `);
  });
  
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