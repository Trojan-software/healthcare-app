import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerHc03Routes } from "./routes-hc03";
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

  // Admin - Get All Patients
  app.get('/api/admin/patients', async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json({ success: true, patients });
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch patients' 
      });
    }
  });

  // Admin - Create Patient Access
  app.post('/api/admin/patients', async (req, res) => {
    try {
      const { firstName, middleName, lastName, email, mobileNumber, hospitalId } = req.body;

      // Generate patient ID and temporary password
      const patientId = `PAT${Date.now().toString().slice(-6)}`;
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const newPatient = await storage.createPatientAccess({
        firstName,
        middleName: middleName || null,
        lastName,
        email,
        mobileNumber,
        patientId,
        hospitalId,
        password: passwordHash,
        username: email,
        isVerified: true, // Admin-created accounts are pre-verified
        role: 'patient'
      });

      console.log(`New patient created - ID: ${patientId}, Password: ${tempPassword}`);

      res.json({ 
        success: true, 
        message: 'Patient account created successfully',
        patient: {
          id: newPatient.id,
          patientId,
          firstName,
          lastName,
          email,
          tempPassword
        }
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create patient account' 
      });
    }
  });

  // Register HC03 device routes
  registerHc03Routes(app);

  const httpServer = createServer(app);
  return httpServer;
}