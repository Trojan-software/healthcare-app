import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailNotificationService } from "./email-notifications";
import { generateSecurePassword, generateSecureOTP, generateSecurePatientId } from "./utils/secure-random";

// Security: Use environment variable for JWT secret (fixes ADHCC HIGH severity finding)
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error("JWT_SECRET environment variable is required for security");
})();

// Routes that do NOT require a valid JWT token.
// IMPORTANT: when registered via app.use('/api', requireAuth), Express strips
// the '/api' mount prefix from req.path before the middleware sees it.
// These entries must be the path WITHOUT the '/api' prefix.
const PUBLIC_API_PATHS = new Set([
  '/login',
  '/auth/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/hospitals',
  '/hospitals/abudhabi',
  '/send-otp',
  '/verify-otp',
  '/resend-otp',
  '/auth/verify-otp',
  '/auth/resend-otp',
]);

// Middleware: verify Bearer JWT on every /api/* request except public paths above
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (PUBLIC_API_PATHS.has(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

// Second-tier guard: the JWT must exist AND carry role="admin".
// Apply this to every route that should be admin-only.
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as { userId: number; email: string; role: string } | undefined;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse JSON
  app.use(express.json());

  // Security middleware: Add cache control headers to prevent caching of sensitive data
  // Fixes ADHCC LOW severity finding: "Sensitive pages could be cached"
  app.use('/api', (req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });

  // Apply JWT authentication to all /api/* routes (public paths are exempt inside requireAuth)
  app.use('/api', requireAuth);

  // All /api/admin/* routes require admin role in addition to a valid JWT
  app.use('/api/admin', requireAdmin);

  // Session restore: return the authenticated user from the JWT
  // Frontend calls this on startup to rehydrate the session without re-entering credentials.
  app.get("/api/auth/me", async (req, res) => {
    try {
      const decoded = (req as any).user as { userId: number; email: string; role: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.isVerified) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        patientId: user.patientId,
        role: user.role,
        isVerified: user.isVerified,
        hospitalId: user.hospitalId,
        mobileNumber: user.mobileNumber,
        dateOfBirth: user.dateOfBirth,
      });
    } catch (error) {
      console.error("Auth/me error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      // Accept either "email" (web form) or "emailOrPatientId" (mobile) field
      const rawInput = req.body.emailOrPatientId ?? req.body.email;
      const { password } = req.body;

      if (!rawInput || !password) {
        return res.status(400).json({ message: "Email/Patient ID and password are required" });
      }

      const inputStr = String(rawInput).trim();
      const passwordStr = String(password);

      // Validate password length to prevent abuse
      if (passwordStr.length < 1 || passwordStr.length > 128) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Resolve user by email or patient ID
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      let user = null;
      if (emailRegex.test(inputStr) && inputStr.length <= 254) {
        user = await storage.getUserByEmail(inputStr.toLowerCase());
      } else {
        user = await storage.getUserByPatientId(inputStr);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(passwordStr, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user account is active (verified)
      if (!user.isVerified) {
        return res.status(403).json({ 
          message: "Account is inactive. Please contact your administrator to activate your account." 
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        patientId: user.patientId,
        role: user.role
      };

      // Audit log the successful login
      await storage.createAuditLog({
        userId: user.patientId || String(user.id),
        userEmail: user.email,
        userRole: user.role,
        action: 'login',
        resource: 'session',
        resourceId: user.patientId,
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim(),
        status: 'success',
      }).catch(() => {});

      res.json({ success: true, token, user: userResponse });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mobile app login route - supports email or patient ID
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { emailOrPatientId, password } = req.body;

      if (!emailOrPatientId || !password) {
        return res.status(400).json({ success: false, message: "Email/Patient ID and password are required" });
      }

      const inputStr = String(emailOrPatientId).trim();
      const passwordStr = String(password);
      
      // Validate password length limits
      if (passwordStr.length < 1 || passwordStr.length > 128) {
        return res.status(400).json({ success: false, message: "Invalid password" });
      }

      // Try to find user by email or patient ID
      let user = null;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (emailRegex.test(inputStr)) {
        user = await storage.getUserByEmail(inputStr.toLowerCase());
      } else {
        user = await storage.getUserByPatientId(inputStr);
      }
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(passwordStr, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Check if user account is active (verified)
      if (!user.isVerified) {
        return res.status(403).json({ 
          success: false,
          message: "Account is inactive. Please contact your administrator to activate your account." 
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        patientId: user.patientId
      };

      await storage.createAuditLog({
        userId: user.patientId || String(user.id),
        userEmail: user.email,
        userRole: user.role,
        action: 'login',
        resource: 'session',
        resourceId: user.patientId,
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim(),
        status: 'success',
      }).catch(() => {});

      res.json({ success: true, token, user: userResponse });
    } catch (error) {
      console.error("Auth login error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
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
        mobileNumber: mobileNumberField,
        hospitalId,
        dateOfBirth
      } = req.body;

      // Accept mobile from either 'mobile' or 'mobileNumber' field; fallback to empty string
      const mobileNumber = mobile || mobileNumberField || '';

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

      // Generate a unique username from email prefix + random suffix
      const usernameBase = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      const username = `${usernameBase}_${Date.now().toString(36)}`;

      const user = await storage.createUser({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        mobileNumber,
        username,
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

  // ─── OTP / Email Verification routes (public — no auth required) ──────────

  // Send OTP to email (called after registration or when resending)
  const handleSendOtp = async (req: any, res: any) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate 6-digit OTP using secure random
      const code = generateSecureOTP(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await storage.createOtpCode({ email: email.toLowerCase(), code, expiresAt, isUsed: false });
      // In production this would email the code; for now return it in dev
      const isDev = process.env.NODE_ENV !== 'production';
      res.json({ message: "OTP sent successfully", ...(isDev ? { code } : {}) });
    } catch (err) {
      console.error("Send OTP error:", err);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  };

  // Verify OTP code
  const handleVerifyOtp = async (req: any, res: any) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

      const isValid = await storage.verifyOtp(email.toLowerCase(), String(code));
      if (!isValid) return res.status(400).json({ message: "Invalid or expired OTP code" });

      // Activate the account once OTP is verified
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (user) await storage.updateUser(user.id, { isVerified: true });

      res.json({ message: "OTP verified successfully", verified: true });
    } catch (err) {
      console.error("Verify OTP error:", err);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  };

  app.post("/api/send-otp", handleSendOtp);
  app.post("/api/resend-otp", handleSendOtp);
  app.post("/api/verify-otp", handleVerifyOtp);
  app.post("/api/auth/send-otp", handleSendOtp);
  app.post("/api/auth/resend-otp", handleSendOtp);
  app.post("/api/auth/verify-otp", handleVerifyOtp);

  // ─────────────────────────────────────────────────────────────────────────

  // Admin endpoints
  app.get("/api/patients", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      
      const patientsWithStats = await Promise.all(patients.map(async (patient) => {
        const [latestVitals, lastCheckup] = await Promise.all([
          storage.getLatestVitalSigns(patient.patientId || patient.id.toString()),
          storage.getLastCheckupTime(patient.patientId || patient.id.toString()),
        ]);
        const lastActivity = latestVitals?.timestamp
          ? new Date(latestVitals.timestamp).toLocaleDateString()
          : lastCheckup
            ? new Date(lastCheckup).toLocaleDateString()
            : 'Never';
        return {
          ...sanitizeUser(patient),
          lastActivity,
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

  // ── Admin convenience aliases ──────────────────────────────────────────────
  // The frontend calls these paths; they delegate to the canonical handlers.

  // GET /api/admin/patients  →  same data as GET /api/patients
  app.get("/api/admin/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const patientsWithStats = await Promise.all(patients.map(async (patient) => {
        const [latestVitals, lastCheckup] = await Promise.all([
          storage.getLatestVitalSigns(patient.patientId || patient.id.toString()),
          storage.getLastCheckupTime(patient.patientId || patient.id.toString()),
        ]);
        const lastActivity = latestVitals?.timestamp
          ? new Date(latestVitals.timestamp).toLocaleDateString()
          : lastCheckup
            ? new Date(lastCheckup).toLocaleDateString()
            : 'Never';
        return {
          ...sanitizeUser(patient),
          lastActivity,
          status: determinePatientStatus({ ...patient, latestVitals }),
          vitals: latestVitals,
          lastCheckup: lastCheckup ? new Date(lastCheckup).toLocaleDateString() : 'Never',
          age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'Unknown'
        };
      }));
      res.json(patientsWithStats);
    } catch (error) {
      console.error("Error fetching admin patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // GET /api/admin/dashboard  →  same data as GET /api/dashboard/admin
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const [patients, allAlerts, allDevices] = await Promise.all([
        storage.getAllPatients(),
        storage.getAllAlerts(),
        storage.getAllHc03Devices(),
      ]);
      const allVitals = await Promise.all(
        patients.map(p => storage.getVitalSignsByPatient(p.patientId || p.id.toString()))
      );
      const vitalsData = allVitals.flat();
      const activePatients = patients.filter(p => p.isVerified).length;
      const criticalAlerts = vitalsData.filter(v => isVitalsCritical(v)).length;

      // Device connections: count devices whose status is 'connected' or 'charging'
      const deviceConnections = allDevices.filter(d =>
        d.connectionStatus === 'connected' || d.connectionStatus === 'charging'
      ).length;

      // Weekly growth: patients registered in the last 7 days vs prior 7 days
      const now = Date.now();
      const week = 7 * 24 * 60 * 60 * 1000;
      const thisWeek = patients.filter(p => p.createdAt && (now - new Date(p.createdAt).getTime()) < week).length;
      const lastWeekTotal = patients.filter(p => p.createdAt && (now - new Date(p.createdAt).getTime()) < 2 * week).length;
      const prevWeek = lastWeekTotal - thisWeek;
      const weeklyGrowth = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100 * 10) / 10 : (thisWeek > 0 ? 100 : 0);

      const stats = {
        totalPatients: patients.length,
        activePatients,
        criticalAlerts,
        deviceConnections,
        complianceRate: calculateAdvancedComplianceRate(patients, vitalsData),
        weeklyGrowth,
        vitalsAverages: calculateVitalsAverages(vitalsData),
        trendsData: generateTrendsData(vitalsData),
        complianceBreakdown: getComplianceBreakdown(patients, vitalsData),
        alertHistory: getAlertHistory(allAlerts),
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // POST /api/admin/create-patient  →  admin creates a verified patient account
  app.post("/api/admin/create-patient", async (req, res) => {
    try {
      const { email, firstName, lastName, password, mobileNumber, hospitalId, dateOfBirth } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "email, firstName, lastName and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const patientId = generateSecurePatientId();

      const newPatient = await storage.createPatientAccess({
        email: email.toLowerCase(),
        firstName,
        lastName: lastName || '',
        password: hashedPassword,
        mobileNumber: mobileNumber || '',
        patientId,
        hospitalId: hospitalId || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isVerified: true,
        role: 'patient',
      });

      const { password: _, ...safePatient } = newPatient;
      res.status(201).json({ success: true, patient: safePatient });
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // GET /api/admin/devices  →  return all registered HC03 devices
  app.get("/api/admin/devices", async (req, res) => {
    try {
      const [patients, allDevices] = await Promise.all([
        storage.getAllPatients(),
        storage.getAllHc03Devices(),
      ]);
      const patientMap = new Map(patients.map(p => [
        p.patientId || String(p.id),
        `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email,
      ]));
      const enriched = allDevices.map((d: any) => ({
        ...d,
        patientName: patientMap.get(d.patientId) || 'Unassigned',
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

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

      // Compute and persist the correct status BEFORE writing to DB.
      vitalSignsData.status = computeVitalStatus(vitalSignsData);

      const vitalSigns = await storage.createVitalSigns(vitalSignsData);

      // Create alerts and send email for critical or attention readings.
      if (vitalSigns.status === 'critical' || vitalSigns.status === 'attention') {
        await storage.createAlert({
          patientId,
          type: getCriticalAlertType(vitalSigns),
          severity: vitalSigns.status === 'critical' ? 'high' : 'medium',
          title: vitalSigns.status === 'critical'
            ? "Critical Vital Signs Alert"
            : "Vital Signs Require Attention",
          description: `${vitalSigns.status === 'critical' ? 'Critical' : 'Elevated'} vital signs detected: ${getCriticalValue(vitalSigns)}`
        });

        if (vitalSigns.status === 'critical') {
          await emailNotificationService.checkCriticalVitals(patientId, vitalSigns);
        }
      }

      await storage.createAuditLog({
        userId: (req as any).user?.userId ? String((req as any).user.userId) : patientId,
        userEmail: (req as any).user?.email || '',
        userRole: (req as any).user?.role || 'patient',
        action: 'create',
        resource: 'vital_signs',
        resourceId: patientId,
        details: `Status: ${vitalSigns.status}`,
        ipAddress: req.ip,
        status: 'success',
      }).catch(() => {});

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

      // Compute and persist the correct status BEFORE writing to DB.
      vitalSignsData.status = computeVitalStatus(vitalSignsData);

      const vitalSigns = await storage.createVitalSigns(vitalSignsData);

      // Create alerts for critical or attention readings.
      if (vitalSigns.status === 'critical' || vitalSigns.status === 'attention') {
        await storage.createAlert({
          patientId,
          type: getCriticalAlertType(vitalSigns),
          severity: vitalSigns.status === 'critical' ? 'high' : 'medium',
          title: vitalSigns.status === 'critical'
            ? "Critical Vital Signs Alert"
            : "Vital Signs Require Attention",
          description: `${vitalSigns.status === 'critical' ? 'Critical' : 'Elevated'} vital signs detected at ${new Date().toLocaleTimeString()}: ${getCriticalValue(vitalSigns)}`
        });

        if (vitalSigns.status === 'critical') {
          await emailNotificationService.checkCriticalVitals(patientId, vitalSigns);
        }
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

  // Multi-Device Data Persistence Routes
  
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

  // Patient update endpoint for edit functionality (admin only)
  app.put("/api/patients/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Whitelist the exact fields that are safe to update.
      // NEVER pass req.body directly — that would allow any caller to set
      // role="admin", isVerified=true, or overwrite password with plaintext.
      const { firstName, lastName, email, mobileNumber, dateOfBirth, gender, middleName, hospitalId } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      const updateData = { firstName, lastName, email, mobileNumber, dateOfBirth, gender, middleName, hospitalId };
      const updatedPatient = await storage.updateUser(parseInt(id), updateData);
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json({ message: "Patient updated successfully", patient: sanitizeUser(updatedPatient) });
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Reset patient password (admin only)
  app.post("/api/patients/:id/reset-password", requireAdmin, async (req, res) => {
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

  // Toggle User Status endpoint (admin only)
  app.patch("/api/users/:id/toggle-status", requireAdmin, async (req, res) => {
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
  app.get("/api/dashboard/admin", requireAdmin, async (req, res) => {
    try {
      const [patients, allAlerts, allDevices] = await Promise.all([
        storage.getAllPatients(),
        storage.getAllAlerts(),
        storage.getAllHc03Devices(),
      ]);
      const allVitals = await Promise.all(
        patients.map(p => storage.getVitalSignsByPatient(p.patientId || p.id.toString()))
      );
      const vitalsData = allVitals.flat();

      const activePatients = patients.filter(p => p.isVerified).length;
      const criticalAlerts = vitalsData.filter(v => isVitalsCritical(v)).length;

      const deviceConnections = allDevices.filter(d =>
        d.connectionStatus === 'connected' || d.connectionStatus === 'charging'
      ).length;

      const now = Date.now();
      const week = 7 * 24 * 60 * 60 * 1000;
      const thisWeek = patients.filter(p => p.createdAt && (now - new Date(p.createdAt).getTime()) < week).length;
      const lastWeekTotal = patients.filter(p => p.createdAt && (now - new Date(p.createdAt).getTime()) < 2 * week).length;
      const prevWeek = lastWeekTotal - thisWeek;
      const weeklyGrowth = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100 * 10) / 10 : (thisWeek > 0 ? 100 : 0);

      const stats = {
        totalPatients: patients.length,
        activePatients,
        criticalAlerts,
        deviceConnections,
        complianceRate: calculateAdvancedComplianceRate(patients, vitalsData),
        weeklyGrowth,
        vitalsAverages: calculateVitalsAverages(vitalsData),
        trendsData: generateTrendsData(vitalsData),
        complianceBreakdown: getComplianceBreakdown(patients, vitalsData),
        alertHistory: getAlertHistory(allAlerts),
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

      // Run all 5 patient data queries in parallel for performance
      const [vitalsSnapshot, vitalsHistory, checkupHistory, alerts, reminderSettings] = await Promise.all([
        storage.getLatestVitalsSnapshot(patientId),
        storage.getVitalSignsByPatient(patientId),
        storage.getCheckupHistory(patientId),
        storage.getAlertsByPatient(patientId),
        storage.getReminderSettings(patientId),
      ]);

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

      // Health score: derive from the latest available vitals status
      // Critical = 50, Attention = 70, Normal = 90, No data = null
      let healthScore: number | null = null;
      if (vitalsSnapshot.heartRate !== null || vitalsSnapshot.oxygenLevel !== null ||
          vitalsSnapshot.bloodGlucose !== null || vitalsSnapshot.bloodPressureSystolic !== null) {
        const vsStatus = computeVitalStatus({
          heartRate: vitalsSnapshot.heartRate,
          bloodPressureSystolic: vitalsSnapshot.bloodPressureSystolic,
          bloodPressureDiastolic: vitalsSnapshot.bloodPressureDiastolic,
          temperature: vitalsSnapshot.temperature,
          oxygenLevel: vitalsSnapshot.oxygenLevel,
          bloodGlucose: vitalsSnapshot.bloodGlucose,
        });
        healthScore = vsStatus === 'critical' ? 50 : vsStatus === 'attention' ? 70 : 90;
      }

      // Compliance rate: % of the last 30 days on which the patient submitted at least one reading
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentVitals = vitalsHistory.filter(v => new Date(v.timestamp).getTime() > thirtyDaysAgo);
      const activeDays = new Set(recentVitals.map(v => new Date(v.timestamp).toISOString().split('T')[0])).size;
      const complianceRate = Math.round((activeDays / 30) * 100);

      // Next appointment: first upcoming checkup from the scheduled list
      const now = new Date();
      const upcomingCheckups = checkupHistory.filter(c => c.nextScheduledDate && new Date(c.nextScheduledDate) > now);
      upcomingCheckups.sort((a, b) => new Date(a.nextScheduledDate!).getTime() - new Date(b.nextScheduledDate!).getTime());
      const nextAppointment = upcomingCheckups.length > 0
        ? new Date(upcomingCheckups[0].nextScheduledDate!).toLocaleDateString()
        : null;

      const stats = {
        user: formatPatientData(user),
        vitals: formattedVitals,
        vitalsHistory: vitalsHistory.slice(-30),
        checkupHistory: checkupHistory.slice(-10),
        alerts: alerts.slice(-5),
        reminderSettings,
        healthScore,
        complianceRate,
        nextAppointment,
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

  // ─── AUDIT LOGGING HELPER ────────────────────────────────────────────────────
  async function logAudit(req: any, action: string, resource?: string, resourceId?: string, details?: object, status = 'success') {
    try {
      const user = req.user;
      await storage.createAuditLog({
        userId: user?.patientId || user?.id?.toString() || 'system',
        userEmail: user?.email || 'system',
        userRole: user?.role || 'unknown',
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0].trim(),
        status,
      });
    } catch (e) {
      // Never let audit logging break a request
    }
  }

  // GET /api/admin/audit-logs?action=&userEmail=&resource=&limit=&offset=
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const { action, userEmail, resource, limit = '100', offset = '0' } = req.query as Record<string, string>;
      const [logs, total] = await Promise.all([
        storage.getAuditLogs({ action, userEmail, resource, limit: parseInt(limit), offset: parseInt(offset) }),
        storage.countAuditLogs({ action, userEmail, resource }),
      ]);
      res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ─── ADMIN SETTINGS ───────────────────────────────────────────────────────────
  const DEFAULT_SETTINGS = [
    { key: 'org_name',                value: '24/7 Tele H Healthcare',    category: 'general',      description: 'Organization display name' },
    { key: 'timezone',                value: 'Asia/Dubai',                category: 'general',      description: 'System timezone (IANA format)' },
    { key: 'session_timeout_minutes', value: '60',                        category: 'security',     description: 'Auto-logout after inactivity (minutes)' },
    { key: 'max_login_attempts',      value: '5',                         category: 'security',     description: 'Max failed logins before lockout' },
    { key: 'alert_hr_critical_max',   value: '120',                       category: 'alerts',       description: 'Critical high heart rate threshold (BPM)' },
    { key: 'alert_hr_critical_min',   value: '50',                        category: 'alerts',       description: 'Critical low heart rate threshold (BPM)' },
    { key: 'alert_spo2_critical_min', value: '90',                        category: 'alerts',       description: 'Critical low SpO2 threshold (%)' },
    { key: 'alert_temp_critical_max', value: '39.0',                      category: 'alerts',       description: 'Critical high temperature threshold (°C)' },
    { key: 'alert_bp_sys_max',        value: '180',                       category: 'alerts',       description: 'Critical high systolic BP threshold (mmHg)' },
    { key: 'alert_glucose_max',       value: '250',                       category: 'alerts',       description: 'Critical high blood glucose threshold (mg/dL)' },
    { key: 'email_notifications',     value: 'true',                      category: 'notifications', description: 'Enable email notifications for critical alerts' },
    { key: 'sms_notifications',       value: 'false',                     category: 'notifications', description: 'Enable SMS notifications for critical alerts' },
    { key: 'compliance_standard',     value: 'DOH/ADHCC',                 category: 'compliance',   description: 'Regulatory compliance standard applied' },
    { key: 'data_retention_days',     value: '2555',                      category: 'compliance',   description: 'Days to retain patient data (7 years = DOH requirement)' },
    { key: 'audit_log_enabled',       value: 'true',                      category: 'compliance',   description: 'Enable audit logging for all actions' },
  ];

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const saved = await storage.getAllAdminSettings();
      // Merge defaults with saved values (saved takes priority)
      const savedMap = Object.fromEntries(saved.map(s => [s.key, s]));
      const merged = DEFAULT_SETTINGS.map(d => savedMap[d.key] || { ...d, id: 0, updatedAt: null, updatedBy: null });
      res.json(merged);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { key, value, category, description } = req.body;
      if (!key || value === undefined) return res.status(400).json({ message: "key and value are required" });
      const user = (req as any).user;
      const setting = await storage.upsertAdminSetting(key, String(value), category, description, user?.email);
      await logAudit(req, 'update_setting', 'admin_setting', key, { key, value });
      res.json(setting);
    } catch (error) {
      console.error("Error updating admin setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.put("/api/admin/settings/bulk", requireAdmin, async (req, res) => {
    try {
      const settings: Array<{ key: string; value: string; category?: string; description?: string }> = req.body;
      if (!Array.isArray(settings)) return res.status(400).json({ message: "Expected array of settings" });
      const user = (req as any).user;
      const results = await Promise.all(
        settings.map(s => storage.upsertAdminSetting(s.key, String(s.value), s.category, s.description, user?.email))
      );
      await logAudit(req, 'bulk_update_settings', 'admin_setting', undefined, { count: results.length });
      res.json(results);
    } catch (error) {
      console.error("Error bulk-updating admin settings:", error);
      res.status(500).json({ message: "Failed to bulk update settings" });
    }
  });

  // ─── LIVE MONITORING ──────────────────────────────────────────────────────────
  // GET /api/admin/live-monitoring — latest vital for every patient, colored by severity
  app.get("/api/admin/live-monitoring", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const monitoringData = await Promise.all(patients.map(async (patient) => {
        const pid = patient.patientId;
        const vitals = await storage.getVitalSignsByPatient(pid);
        const latest = vitals[0] ?? null;
        const device = (await storage.getHc03DevicesByPatient(pid))[0] ?? null;
        return {
          patientId: pid,
          patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email,
          email: patient.email,
          hospitalId: patient.hospitalId,
          status: latest?.status ?? 'no_data',
          lastReading: latest?.timestamp ?? null,
          vitals: latest ? {
            heartRate: latest.heartRate,
            bloodPressureSystolic: latest.bloodPressureSystolic,
            bloodPressureDiastolic: latest.bloodPressureDiastolic,
            temperature: latest.temperature ? parseFloat(String(latest.temperature)) : null,
            oxygenLevel: latest.oxygenLevel,
            bloodGlucose: latest.bloodGlucose,
          } : null,
          device: device ? {
            deviceId: device.deviceId,
            connectionStatus: device.connectionStatus,
            batteryLevel: device.batteryLevel,
          } : null,
        };
      }));
      res.json(monitoringData);
    } catch (error) {
      console.error("Error fetching live monitoring:", error);
      res.status(500).json({ message: "Failed to fetch monitoring data" });
    }
  });

  // ─── DOCTOR DASHBOARD ─────────────────────────────────────────────────────────
  // GET /api/doctor/dashboard — aggregated view for doctor role
  app.get("/api/doctor/dashboard", requireAuth, async (req, res) => {
    try {
      const [patients, allAlerts] = await Promise.all([
        storage.getAllPatients(),
        storage.getAllAlerts(),
      ]);

      const activeAlerts = allAlerts.filter(a => !a.isResolved);
      const criticalAlerts = activeAlerts.filter(a => a.severity === 'high');

      // Recent readings across all patients (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const patientSummaries = await Promise.all(patients.slice(0, 20).map(async (patient) => {
        const vitals = await storage.getVitalSignsByPatient(patient.patientId);
        const recentVitals = vitals.filter(v => v.timestamp && new Date(v.timestamp) >= oneDayAgo);
        const latest = vitals[0];
        return {
          patientId: patient.patientId,
          patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
          status: latest?.status ?? 'no_data',
          lastReading: latest?.timestamp ?? null,
          readingsToday: recentVitals.length,
          alertsCount: activeAlerts.filter(a => a.patientId === patient.patientId).length,
          latestVitals: latest ? {
            heartRate: latest.heartRate,
            bloodPressureSystolic: latest.bloodPressureSystolic,
            bloodPressureDiastolic: latest.bloodPressureDiastolic,
            oxygenLevel: latest.oxygenLevel,
            temperature: latest.temperature ? parseFloat(String(latest.temperature)) : null,
          } : null,
        };
      }));

      // Sort: critical first, then attention, then normal
      const priority = { critical: 0, attention: 1, normal: 2, no_data: 3 };
      patientSummaries.sort((a, b) => (priority[a.status as keyof typeof priority] ?? 3) - (priority[b.status as keyof typeof priority] ?? 3));

      res.json({
        summary: {
          totalPatients: patients.length,
          activeAlerts: activeAlerts.length,
          criticalAlerts: criticalAlerts.length,
          patientsWithReadingsToday: patientSummaries.filter(p => p.readingsToday > 0).length,
        },
        patients: patientSummaries,
        recentAlerts: criticalAlerts.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching doctor dashboard:", error);
      res.status(500).json({ message: "Failed to fetch doctor dashboard" });
    }
  });

  // ─── CRITICAL ALERTS SYSTEM ──────────────────────────────────────────────────
  // Powers CriticalAlertsSystem.tsx in the admin dashboard.

  // Map the internal alerts row to the shape the frontend expects.
  async function enrichAlert(alert: any) {
    const user = await storage.getUserByPatientId(alert.patientId).catch(() => null)
                  ?? await storage.getUser(parseInt(alert.patientId)).catch(() => null);
    const patientName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || alert.patientId
      : alert.patientId;

    // Derive frontend `status` from the two boolean flags in the DB
    const status = alert.isResolved
      ? 'resolved'
      : alert.doctorNotified
        ? 'acknowledged'
        : 'active';

    // Map our internal type to a vitalType the UI understands
    const vitalTypeMap: Record<string, string> = {
      cardiac: 'heartRate',
      respiratory: 'bloodOxygen',
      glucose: 'bloodGlucose',
      blood_pressure: 'bloodPressure',
      fever: 'temperature',
      hypothermia: 'temperature',
    };
    const vitalType = vitalTypeMap[alert.type] || 'heartRate';

    // Map severity
    const severityMap: Record<string, string> = {
      high: 'emergency',
      medium: 'critical',
      low: 'warning',
    };
    const uiSeverity = severityMap[alert.severity || 'medium'] || 'critical';

    return {
      id: String(alert.id),
      patientId: alert.patientId,
      patientName,
      vitalType,
      severity: uiSeverity,
      timestamp: alert.createdAt,
      status,
      title: alert.title,
      description: alert.description,
      emailSent: alert.doctorNotified,
      isResolved: alert.isResolved,
      type: alert.type,
    };
  }

  // GET /api/critical-alerts?filter=active&severity=all
  app.get("/api/critical-alerts", requireAdmin, async (req, res) => {
    try {
      const { filter = 'active', severity = 'all' } = req.query;
      let allAlerts = await storage.getAllAlerts();

      // Status filter
      if (filter === 'active') {
        allAlerts = allAlerts.filter(a => !a.isResolved && !a.doctorNotified);
      } else if (filter === 'acknowledged') {
        allAlerts = allAlerts.filter(a => a.doctorNotified && !a.isResolved);
      } else if (filter === 'resolved') {
        allAlerts = allAlerts.filter(a => a.isResolved);
      }
      // else 'all' — no filter

      // Severity filter (maps our DB severity to UI severity)
      if (severity !== 'all') {
        const dbSeverityMap: Record<string, string> = {
          emergency: 'high',
          critical: 'medium',
          warning: 'low',
        };
        const dbSev = dbSeverityMap[severity as string];
        if (dbSev) allAlerts = allAlerts.filter(a => (a.severity || 'medium') === dbSev);
      }

      const enriched = await Promise.all(allAlerts.slice(0, 100).map(enrichAlert));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching critical alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // GET /api/alert-thresholds — DOH/ADHCC clinical reference thresholds
  app.get("/api/alert-thresholds", requireAdmin, async (req, res) => {
    res.json([
      { vitalType: 'heartRate',     criticalMin: 50,  criticalMax: 120, warningMin: 60,  warningMax: 100,  unit: 'BPM'   },
      { vitalType: 'bloodPressure', criticalMin: 90,  criticalMax: 180, warningMin: 110, warningMax: 140,  unit: 'mmHg'  },
      { vitalType: 'bloodOxygen',   criticalMin: 90,  criticalMax: null, warningMin: 95, warningMax: null, unit: '%'     },
      { vitalType: 'temperature',   criticalMin: 35.0, criticalMax: 39.0, warningMin: 36.0, warningMax: 38.0, unit: '°C' },
      { vitalType: 'bloodGlucose',  criticalMin: 70,  criticalMax: 250, warningMin: 80,  warningMax: 180,  unit: 'mg/dL' },
    ]);
  });

  // POST /api/critical-alerts/:id/acknowledge
  app.post("/api/critical-alerts/:id/acknowledge", requireAdmin, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      if (isNaN(alertId)) return res.status(400).json({ message: "Invalid alert ID" });
      await storage.markAlertAsNotified(alertId);
      const allAlerts = await storage.getAllAlerts();
      const alert = allAlerts.find(a => a.id === alertId);
      if (!alert) return res.status(404).json({ message: "Alert not found" });
      res.json(await enrichAlert(alert));
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  // POST /api/critical-alerts/:id/resolve
  app.post("/api/critical-alerts/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      if (isNaN(alertId)) return res.status(400).json({ message: "Invalid alert ID" });
      // Mark as both notified and resolved
      await storage.markAlertAsNotified(alertId);
      await storage.resolveAlert(alertId);
      const allAlerts = await storage.getAllAlerts();
      const alert = allAlerts.find(a => a.id === alertId);
      if (!alert) return res.status(404).json({ message: "Alert not found" });
      res.json(await enrichAlert(alert));
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // POST /api/critical-alerts/:id/send-email
  app.post("/api/critical-alerts/:id/send-email", requireAdmin, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      if (isNaN(alertId)) return res.status(400).json({ message: "Invalid alert ID" });
      const allAlerts = await storage.getAllAlerts();
      const alert = allAlerts.find(a => a.id === alertId);
      if (!alert) return res.status(404).json({ message: "Alert not found" });
      await emailNotificationService.checkCriticalVitals(alert.patientId, { type: alert.type });
      await storage.markAlertAsNotified(alertId);
      res.json({ success: true, message: "Email notification sent" });
    } catch (error) {
      console.error("Error sending alert email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // ─── WEEKLY REPORTS ───────────────────────────────────────────────────────────
  // Powers WeeklyReportDashboard.tsx.

  // GET /api/admin/patients-list — lightweight patient list for filter dropdowns
  app.get("/api/admin/patients-list", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients.map(p => ({
        id: p.patientId || String(p.id),
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email,
      })));
    } catch (error) {
      console.error("Error fetching patients list:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // GET /api/reports/weekly
  app.get("/api/reports/weekly", requireAdmin, async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        selectedPatient = 'all',
      } = req.query as Record<string, string>;

      const rangeEnd   = endDate   ? new Date(endDate)   : new Date();
      const rangeStart = startDate ? new Date(startDate) : new Date(rangeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevStart  = new Date(rangeStart.getTime() - (rangeEnd.getTime() - rangeStart.getTime()));

      const patients = await storage.getAllPatients();
      const targetPatients = selectedPatient === 'all'
        ? patients
        : patients.filter(p => (p.patientId || String(p.id)) === selectedPatient);

      const reports = await Promise.all(targetPatients.map(async (patient) => {
        const pid = patient.patientId || String(patient.id);
        const [allVitals, patientAlerts] = await Promise.all([
          storage.getVitalSignsByPatient(pid),
          storage.getAlertsByPatient(pid),
        ]);

        // Filter vitals to the reporting period
        const vitals = allVitals.filter(v =>
          v.timestamp && new Date(v.timestamp) >= rangeStart && new Date(v.timestamp) <= rangeEnd
        );
        const prevVitals = allVitals.filter(v =>
          v.timestamp && new Date(v.timestamp) >= prevStart && new Date(v.timestamp) < rangeStart
        );

        // Stats helper
        const vitalStats = (vals: number[]) => {
          if (vals.length === 0) return { average: 0, min: 0, max: 0 };
          return {
            average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10,
            min: Math.min(...vals),
            max: Math.max(...vals),
          };
        };

        const trend = (curr: number, prev: number): 'up' | 'down' | 'stable' => {
          if (curr === 0 || prev === 0) return 'stable';
          const delta = (curr - prev) / prev;
          if (delta > 0.05) return 'up';
          if (delta < -0.05) return 'down';
          return 'stable';
        };

        const hrVals     = vitals.map(v => v.heartRate).filter((v): v is number => v != null);
        const prevHrVals = prevVitals.map(v => v.heartRate).filter((v): v is number => v != null);
        const sysVals    = vitals.map(v => v.bloodPressureSystolic).filter((v): v is number => v != null);
        const diaVals    = vitals.map(v => v.bloodPressureDiastolic).filter((v): v is number => v != null);
        const o2Vals     = vitals.map(v => v.oxygenLevel).filter((v): v is number => v != null);
        const prevO2Vals = prevVitals.map(v => v.oxygenLevel).filter((v): v is number => v != null);
        const tempVals   = vitals.map(v => parseTemp(v.temperature)).filter((v): v is number => v != null);

        const hrStats  = vitalStats(hrVals);
        const prevHrSt = vitalStats(prevHrVals);
        const o2Stats  = vitalStats(o2Vals);
        const prevO2St = vitalStats(prevO2Vals);

        // Alerts in period
        const periodAlerts = patientAlerts.filter(a =>
          a.createdAt && new Date(a.createdAt) >= rangeStart && new Date(a.createdAt) <= rangeEnd
        );

        // Compliance: unique days with a reading in range
        const totalDays = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)));
        const activeDays = new Set(vitals.map(v => new Date(v.timestamp!).toISOString().split('T')[0])).size;
        const complianceRate = Math.round((activeDays / totalDays) * 100 * 10) / 10;

        return {
          patientId: pid,
          patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email,
          reportPeriod: {
            startDate: rangeStart.toISOString(),
            endDate: rangeEnd.toISOString(),
          },
          vitalSigns: {
            heartRate: { ...hrStats, readings: hrVals.length, trend: trend(hrStats.average, prevHrSt.average) },
            bloodPressure: {
              systolic:  vitalStats(sysVals),
              diastolic: vitalStats(diaVals),
              readings: sysVals.length,
              trend: trend(vitalStats(sysVals).average, vitalStats(prevVitals.map(v => v.bloodPressureSystolic).filter((v): v is number => v != null)).average),
            },
            bloodOxygen: { ...o2Stats, readings: o2Vals.length, trend: trend(o2Stats.average, prevO2St.average) },
            temperature: { ...vitalStats(tempVals), readings: tempVals.length, trend: 'stable' as const },
          },
          checkups: { scheduled: totalDays, completed: activeDays, missed: Math.max(0, totalDays - activeDays) },
          alerts: {
            critical: periodAlerts.filter(a => a.severity === 'high').length,
            warning:  periodAlerts.filter(a => a.severity === 'medium').length,
            resolved: periodAlerts.filter(a => a.isResolved).length,
          },
          compliance: { rate: complianceRate, missedReadings: Math.max(0, totalDays - activeDays), deviceUptime: complianceRate },
        };
      }));

      res.json(reports);
    } catch (error) {
      console.error("Error fetching weekly report:", error);
      res.status(500).json({ message: "Failed to generate report" });
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
        frequency: typeof frequency === 'number' && frequency > 0 ? frequency : 8,
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

  // Helper functions

  // Strip every field that must never reach the client.
  // Call this on EVERY user/patient object before res.json().
  function sanitizeUser(user: any) {
    if (!user) return user;
    const {
      password,
      resetCode,
      resetCodeExpires,
      ...safe
    } = user;
    return safe;
  }

  // Parse a nullable temperature value (stored as decimal string or number) into
  // a float, returning null if the value is absent or unparseable.
  function parseTemp(raw: any): number | null {
    if (raw === null || raw === undefined) return null;
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }

  // ─── SINGLE SOURCE OF TRUTH FOR VITAL-SIGN STATUS ───────────────────────────
  //
  // ALL status decisions (DB write, alert creation, dashboard counting, patient
  // UI) MUST go through computeVitalStatus().  Never add a parallel check.
  //
  // Rules:
  //   • Always use parseTemp() for temperature — Drizzle returns decimal as string.
  //   • Always guard with `!= null` — JS coerces null to 0 in comparisons, so
  //     `null < 50` is true and would falsely flag every partial reading.
  //   • Thresholds follow DOH/ADHCC clinical guidelines.
  //
  // Returns: 'critical' | 'attention' | 'normal'
  function computeVitalStatus(vitals: any): 'critical' | 'attention' | 'normal' {
    if (!vitals) return 'normal';

    const hr   = vitals.heartRate              as number | null | undefined;
    const sys  = vitals.bloodPressureSystolic  as number | null | undefined;
    const dia  = vitals.bloodPressureDiastolic as number | null | undefined;
    const temp = parseTemp(vitals.temperature);
    const o2   = vitals.oxygenLevel            as number | null | undefined;
    const gluc = vitals.bloodGlucose           as number | null | undefined;

    // ── Critical thresholds ────────────────────────────────────────────────
    if (hr   != null && (hr   > 120 || hr   < 50))   return 'critical';
    if (sys  != null && (sys  > 180 || sys  < 90))   return 'critical';
    if (dia  != null && (dia  > 120 || dia  < 60))   return 'critical';
    if (temp != null && (temp > 39.0 || temp < 35.0)) return 'critical';
    if (o2   != null &&  o2   < 90)                  return 'critical';
    if (gluc != null && (gluc > 250  || gluc < 70))  return 'critical';

    // ── Attention thresholds ───────────────────────────────────────────────
    if (hr   != null && (hr   > 100 || hr   < 60))   return 'attention';
    if (sys  != null && (sys  > 140 || sys  < 110))  return 'attention';
    if (dia  != null && (dia  > 90  || dia  < 70))   return 'attention';
    if (temp != null && (temp > 38.0 || temp < 36.0)) return 'attention';
    if (o2   != null &&  o2   < 95)                  return 'attention';
    if (gluc != null && (gluc > 180  || gluc < 80))  return 'attention';

    return 'normal';
  }

  // Convenience wrappers kept for call-site compatibility
  function isVitalsCritical(vitals: any): boolean {
    return computeVitalStatus(vitals) === 'critical';
  }

  function determinePatientStatus(vitals: any): string {
    if (!vitals.latestVitals) return 'No Data';
    const s = computeVitalStatus(vitals.latestVitals);
    return s === 'critical' ? 'Critical' : s === 'attention' ? 'Attention' : 'Normal';
  }

  // Returns the primary alert type label for a critical/attention reading.
  function getCriticalAlertType(vitals: any): string {
    const hr   = vitals.heartRate              as number | null | undefined;
    const sys  = vitals.bloodPressureSystolic  as number | null | undefined;
    const temp = parseTemp(vitals.temperature);
    const o2   = vitals.oxygenLevel            as number | null | undefined;
    const gluc = vitals.bloodGlucose           as number | null | undefined;
    if (hr   != null && (hr   > 120 || hr  < 50))   return 'cardiac';
    if (sys  != null && (sys  > 180 || sys < 90))    return 'blood_pressure';
    if (temp != null &&  temp > 39.0)                return 'fever';
    if (temp != null &&  temp < 35.0)                return 'hypothermia';
    if (o2   != null &&  o2   < 90)                  return 'respiratory';
    if (gluc != null && (gluc > 250 || gluc < 70))   return 'glucose';
    return 'general';
  }

  function getSeverityLevel(vitals: any): string {
    return computeVitalStatus(vitals) === 'critical' ? 'high' : 'medium';
  }

  function getCriticalValue(vitals: any): string {
    const critical: string[] = [];
    const hr   = vitals.heartRate   as number | null | undefined;
    const temp = parseTemp(vitals.temperature);
    const o2   = vitals.oxygenLevel as number | null | undefined;
    if (hr   != null && (hr   > 120 || hr < 50)) critical.push(`HR: ${hr}`);
    if (temp != null &&  temp > 39.0)             critical.push(`Temp: ${temp}°C`);
    if (o2   != null &&  o2   < 90)               critical.push(`O2: ${o2}%`);
    return critical.join(', ');
  }

  function formatPatientData(patient: any) {
    return {
      ...sanitizeUser(patient),
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
      heartRate: null, bloodPressure: null, temperature: null, oxygenLevel: null
    };

    // Only include records that actually have a value for each field.
    // Averaging over null-fields (which JavaScript coerces to 0) produces
    // misleadingly low readings.
    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const hrValues  = vitalsData.map(v => v.heartRate).filter((v): v is number => v != null);
    const sysValues = vitalsData.map(v => v.bloodPressureSystolic).filter((v): v is number => v != null);
    const diaValues = vitalsData.map(v => v.bloodPressureDiastolic).filter((v): v is number => v != null);
    const tempValues = vitalsData.map(v => parseTemp(v.temperature)).filter((v): v is number => v != null);
    const o2Values  = vitalsData.map(v => v.oxygenLevel).filter((v): v is number => v != null);

    const avgHr  = avg(hrValues);
    const avgSys = avg(sysValues);
    const avgDia = avg(diaValues);
    const avgTemp = avg(tempValues);
    const avgO2  = avg(o2Values);

    const bpStr = avgSys != null && avgDia != null
      ? `${Math.round(avgSys)}/${Math.round(avgDia)}`
      : avgSys != null ? `${Math.round(avgSys)}/--`
      : null;

    return {
      heartRate:     avgHr   != null ? Math.round(avgHr)             : null,
      bloodPressure: bpStr,
      temperature:   avgTemp != null ? Math.round(avgTemp * 10) / 10 : null,
      oxygenLevel:   avgO2   != null ? Math.round(avgO2)             : null,
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

  // calculateVitalSignsStatus removed — use computeVitalStatus() everywhere.

  // Build real 7-day trend from actual vital sign records.
  // vitalsData is the flat list of all patients' records already in memory.
  function generateTrendsData(vitalsData: any[]) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];

      const dayVitals = vitalsData.filter(v => {
        if (!v.timestamp) return false;
        return new Date(v.timestamp).toISOString().split('T')[0] === dateStr;
      });

      const hrValues   = dayVitals.map(v => v.heartRate).filter((v): v is number => v != null);
      const tempValues = dayVitals.map(v => parseTemp(v.temperature)).filter((v): v is number => v != null);
      const o2Values   = dayVitals.map(v => v.oxygenLevel).filter((v): v is number => v != null);

      const avg = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

      return {
        date: dateStr,
        heartRate:   avg(hrValues)   !== null ? Math.round(avg(hrValues)!)               : null,
        temperature: avg(tempValues) !== null ? Math.round(avg(tempValues)! * 10) / 10   : null,
        oxygenLevel: avg(o2Values)   !== null ? Math.round(avg(o2Values)!)               : null,
        count: dayVitals.length,
      };
    });
  }

  // Compute compliance tiers from how recently each patient submitted vitals.
  function getComplianceBreakdown(patients: any[], vitalsData: any[]) {
    const now = Date.now();
    const DAY  = 24 * 60 * 60 * 1000;

    // Build a map of patientId → most-recent vital timestamp
    const lastVital: Record<string, number> = {};
    for (const v of vitalsData) {
      if (!v.timestamp) continue;
      const t = new Date(v.timestamp).getTime();
      if (!lastVital[v.patientId] || t > lastVital[v.patientId]) {
        lastVital[v.patientId] = t;
      }
    }

    let excellent = 0, good = 0, needs_improvement = 0;
    for (const p of patients) {
      const pid = p.patientId || String(p.id);
      const last = lastVital[pid];
      if (!last) {
        needs_improvement++;
      } else {
        const daysAgo = (now - last) / DAY;
        if (daysAgo <= 1)       excellent++;
        else if (daysAgo <= 7)  good++;
        else                    needs_improvement++;
      }
    }

    return { excellent, good, needs_improvement };
  }

  // Aggregate real alert records into type → count buckets.
  function getAlertHistory(alertRecords: any[]) {
    const counts: Record<string, { count: number; severity: string }> = {};
    for (const a of alertRecords) {
      const type = a.type || 'general';
      const severity = a.severity || (a.type === 'critical' ? 'high' : 'medium');
      if (!counts[type]) counts[type] = { count: 0, severity };
      counts[type].count++;
    }
    const result = Object.entries(counts)
      .map(([type, { count, severity }]) => ({ type, count, severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // top 10 alert types

    // Return empty array (not hardcoded fiction) if no alerts yet
    return result;
  }


  // ─── Missing Routes — Aliases & New Endpoints ────────────────────────────

  // /api/dashboard-stats  → alias of /api/admin/dashboard (no admin guard; used by patient app)
  app.get("/api/dashboard-stats", async (req, res) => {
    try {
      const [patients, allAlerts] = await Promise.all([
        storage.getAllPatients(),
        storage.getAllAlerts(),
      ]);
      const activePatients = patients.filter(p => p.isVerified).length;
      const criticalAlerts = allAlerts.filter(a => a.severity === 'high').length;
      res.json({
        totalPatients: patients.length,
        activePatients,
        criticalAlerts,
        activeAlerts: allAlerts.length,
        completionRate: patients.length > 0 ? Math.round((activePatients / patients.length) * 100) : 0,
        checkupsToday: allAlerts.filter(a => {
          if (!a.createdAt) return false;
          const d = new Date(a.createdAt);
          const now = new Date();
          return d.toDateString() === now.toDateString();
        }).length,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // /api/admin/patients/stats — patient count summary
  app.get("/api/admin/patients/stats", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const byHospital: Record<string, number> = {};
      for (const p of patients) {
        if (p.hospitalId) byHospital[p.hospitalId] = (byHospital[p.hospitalId] || 0) + 1;
      }
      res.json({
        stats: {
          total: patients.length,
          active: patients.filter(p => p.isVerified).length,
          inactive: patients.filter(p => !p.isVerified).length,
          registeredToday: patients.filter(p => p.createdAt && (now - new Date(p.createdAt).getTime()) < dayMs).length,
          byHospital,
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch patient stats" });
    }
  });

  // /api/admin/risk-patients — patients sorted by risk level based on vital status
  app.get("/api/admin/risk-patients", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const riskFilter = req.query.filter as string || 'all';
      const patientVitals = await Promise.all(
        patients.map(async p => {
          const pid = p.patientId || String(p.id);
          const vitals = await storage.getVitalSignsByPatient(pid);
          const latest = vitals.sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime())[0];
          const status = latest?.status || 'no_data';
          const riskLevel = status === 'critical' ? 'critical' : status === 'attention' ? 'high' : status === 'normal' ? 'low' : 'moderate';
          return {
            patientId: pid,
            patientName: `${p.firstName} ${p.lastName}`.trim(),
            email: p.email,
            hospitalId: p.hospitalId,
            riskLevel,
            vitalStatus: status,
            lastReading: latest?.recordedAt || null,
            heartRate: latest?.heartRate || null,
            bloodPressure: latest?.bloodPressureSystolic ? `${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}` : null,
          };
        })
      );
      const filtered = riskFilter === 'all' ? patientVitals : patientVitals.filter(p => p.riskLevel === riskFilter);
      const sorted = filtered.sort((a, b) => {
        const order: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
        return (order[a.riskLevel] ?? 4) - (order[b.riskLevel] ?? 4);
      });
      res.json(sorted);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch risk patients" });
    }
  });

  // /api/admin/health-metrics — aggregate vital metrics across all patients
  app.get("/api/admin/health-metrics", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const allVitals = (await Promise.all(
        patients.map(p => storage.getVitalSignsByPatient(p.patientId || String(p.id)))
      )).flat();
      const timeframe = req.query.timeframe as string || '7d';
      const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const recent = allVitals.filter(v => v.recordedAt && new Date(v.recordedAt).getTime() > cutoff);
      const hrVals = recent.filter(v => v.heartRate).map(v => v.heartRate!);
      const sysVals = recent.filter(v => v.bloodPressureSystolic).map(v => v.bloodPressureSystolic!);
      const diaVals = recent.filter(v => v.bloodPressureDiastolic).map(v => v.bloodPressureDiastolic!);
      const o2Vals = recent.filter(v => v.oxygenLevel).map(v => v.oxygenLevel!);
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      const statusCounts = { normal: 0, attention: 0, critical: 0, no_data: 0 };
      for (const v of recent) {
        const s = (v.status || 'no_data') as keyof typeof statusCounts;
        if (s in statusCounts) statusCounts[s]++;
      }
      res.json({
        timeframe,
        totalReadings: recent.length,
        averages: {
          heartRate: avg(hrVals),
          systolic: avg(sysVals),
          diastolic: avg(diaVals),
          oxygenLevel: avg(o2Vals),
        },
        statusDistribution: statusCounts,
        totalPatients: patients.length,
        patientsWithReadings: new Set(recent.map(v => v.patientId)).size,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  // /api/admin/health-trends — day-by-day vital averages
  app.get("/api/admin/health-trends", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const allVitals = (await Promise.all(
        patients.map(p => storage.getVitalSignsByPatient(p.patientId || String(p.id)))
      )).flat();
      const timeframe = req.query.timeframe as string || '7d';
      const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
      const result: any[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayVitals = allVitals.filter(v => {
          if (!v.recordedAt) return false;
          return new Date(v.recordedAt).toISOString().split('T')[0] === dateStr;
        });
        const hrVals = dayVitals.filter(v => v.heartRate).map(v => v.heartRate!);
        const sysVals = dayVitals.filter(v => v.bloodPressureSystolic).map(v => v.bloodPressureSystolic!);
        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
        result.push({
          date: dateStr,
          readings: dayVitals.length,
          avgHeartRate: avg(hrVals),
          avgSystolic: avg(sysVals),
          critical: dayVitals.filter(v => v.status === 'critical').length,
          attention: dayVitals.filter(v => v.status === 'attention').length,
          normal: dayVitals.filter(v => v.status === 'normal').length,
        });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch health trends" });
    }
  });

  // /api/admin/health-comparison — multi-patient vital comparison
  app.get("/api/admin/health-comparison", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const patientIds = req.query.patients ? String(req.query.patients).split(',') : [];
      const timeframe = req.query.timeframe as string || '7d';
      const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const targets = patientIds.length > 0
        ? patients.filter(p => patientIds.includes(p.patientId || String(p.id)))
        : patients.slice(0, 5);
      const comparisons = await Promise.all(targets.map(async p => {
        const pid = p.patientId || String(p.id);
        const vitals = await storage.getVitalSignsByPatient(pid);
        const recent = vitals.filter(v => v.recordedAt && new Date(v.recordedAt).getTime() > cutoff);
        const hrVals = recent.filter(v => v.heartRate).map(v => v.heartRate!);
        const sysVals = recent.filter(v => v.bloodPressureSystolic).map(v => v.bloodPressureSystolic!);
        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
        return {
          patientId: pid,
          patientName: `${p.firstName} ${p.lastName}`.trim(),
          readings: recent.length,
          avgHeartRate: avg(hrVals),
          avgSystolic: avg(sysVals),
          criticalCount: recent.filter(v => v.status === 'critical').length,
        };
      }));
      res.json(comparisons);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch health comparison" });
    }
  });

  // /api/admin/device-status — connected / disconnected device counts
  app.get("/api/admin/device-status", requireAdmin, async (req, res) => {
    try {
      const devices = await storage.getAllHc03Devices();
      const connected = devices.filter(d => d.connectionStatus === 'connected' || d.connectionStatus === 'charging').length;
      const disconnected = devices.filter(d => d.connectionStatus === 'disconnected').length;
      const lowBattery = devices.filter(d => typeof d.batteryLevel === 'number' && d.batteryLevel < 20).length;
      const statusMap: Record<string, { connected: number; disconnected: number; lowBattery: number }> = {};
      for (const d of devices) {
        const pid = d.patientId || 'unknown';
        if (!statusMap[pid]) statusMap[pid] = { connected: 0, disconnected: 0, lowBattery: 0 };
        if (d.connectionStatus === 'connected' || d.connectionStatus === 'charging') statusMap[pid].connected++;
        else statusMap[pid].disconnected++;
        if (typeof d.batteryLevel === 'number' && d.batteryLevel < 20) statusMap[pid].lowBattery++;
      }
      res.json({
        total: devices.length,
        connected,
        disconnected,
        lowBattery,
        devices: devices.map(d => ({
          deviceId: d.deviceId,
          patientId: d.patientId,
          connectionStatus: d.connectionStatus,
          batteryLevel: d.batteryLevel,
          lastSync: d.lastSync,
          firmwareVersion: d.firmwareVersion,
        })),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch device status" });
    }
  });

  // /api/admin/create-patient — POST, admin creates patient record
  app.post("/api/admin/create-patient", requireAdmin, async (req, res) => {
    try {
      const { firstName, lastName, middleName, email, password, mobileNumber, dateOfBirth, gender, hospitalId, emiratesId, role } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "First name, last name, email, and password are required" });
      }
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) return res.status(409).json({ message: "A patient with this email already exists" });

      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);
      const patientId = `PT${Date.now().toString().slice(-6)}`;
      const newUser = await storage.createUser({
        firstName, lastName, middleName: middleName || '',
        email: email.toLowerCase(), password: hashedPassword,
        mobileNumber: mobileNumber || '', dateOfBirth: dateOfBirth || '',
        gender: gender || 'not_specified', hospitalId: hospitalId || '',
        emiratesId: emiratesId || '', patientId,
        role: role || 'patient', isVerified: true,
      });
      await logAudit(req, 'create', 'patient', patientId, `Admin created patient: ${email}`);
      const { password: _, ...safeUser } = newUser as any;
      res.status(201).json({ success: true, patient: safeUser });
    } catch (err: any) {
      console.error("Admin create patient error:", err);
      res.status(500).json({ message: err.message || "Failed to create patient" });
    }
  });

  // /api/health-history — patient's own vital signs grouped by date
  app.get("/api/health-history", async (req, res) => {
    try {
      const reqUser = (req as any).user;
      if (!reqUser) return res.status(401).json({ message: "Authentication required" });

      const dateRange = req.query.dateRange as string || '30d';
      const statusFilter = req.query.status as string || 'all';

      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

      // Use admin's patients list or current user
      let allVitals: any[];
      if (reqUser.role === 'admin') {
        const patients = await storage.getAllPatients();
        allVitals = (await Promise.all(
          patients.map(p => storage.getVitalSignsByPatient(p.patientId || String(p.id)))
        )).flat();
      } else {
        const user = await storage.getUser(reqUser.userId);
        const pid = user?.patientId || String(reqUser.userId);
        allVitals = await storage.getVitalSignsByPatient(pid);
      }

      const filtered = allVitals.filter(v => {
        const ts = v.timestamp || v.recordedAt;
        if (!ts || new Date(ts).getTime() < cutoff) return false;
        if (statusFilter !== 'all' && v.status !== statusFilter) return false;
        return true;
      });

      // Group by date
      const byDate: Record<string, any[]> = {};
      for (const v of filtered) {
        const ts = v.timestamp || v.recordedAt;
        const date = new Date(ts).toISOString().split('T')[0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push({
          id: String(v.id),
          timestamp: ts,
          deviceId: v.deviceId || 'Manual',
          readings: {
            heartRate: v.heartRate,
            bloodPressureSystolic: v.bloodPressureSystolic,
            bloodPressureDiastolic: v.bloodPressureDiastolic,
            bloodOxygen: v.oxygenLevel,
            temperature: v.temperature ? parseFloat(v.temperature.toString()) : null,
            bloodGlucose: v.bloodGlucose,
          },
          status: v.status || 'normal',
        });
      }
      const result = Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, records]) => ({ date, records }));
      res.json(result);
    } catch (err) {
      console.error("Health history error:", err);
      res.status(500).json({ message: "Failed to fetch health history" });
    }
  });

  // /api/missed-readings — patients who haven't submitted readings in 24+ hours
  app.get("/api/missed-readings", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;

      // Fetch all patient vitals in parallel (not sequentially)
      const vitalsResults = await Promise.all(
        patients.map(p => {
          const pid = p.patientId || String(p.id);
          return storage.getVitalSignsByPatient(pid).then(vitals => ({ p, pid, vitals }));
        })
      );

      const missed = vitalsResults
        .map(({ p, pid, vitals }) => {
          const sorted = vitals.sort((a: any, b: any) =>
            new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime()
          );
          const last = sorted[0];
          const lastTime = last?.recordedAt ? new Date(last.recordedAt).getTime() : null;
          const missedDays = lastTime ? Math.floor((now - lastTime) / DAY) : 999;
          if (missedDays < 1) return null;
          return {
            patientId: pid,
            patientName: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            email: p.email,
            mobileNumber: p.mobileNumber,
            hospitalId: p.hospitalId,
            lastReading: last?.recordedAt || null,
            missedDays,
            priority: missedDays >= 3 ? 'critical' : missedDays >= 2 ? 'high' : 'medium',
            readingType: 'vital_signs',
            complianceRate: vitals.length > 0 ? Math.max(0, Math.round(100 - (missedDays / 7) * 100)) : 0,
          };
        })
        .filter(Boolean);

      missed.sort((a: any, b: any) => b.missedDays - a.missedDays);
      res.json(missed);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch missed readings" });
    }
  });

  // /api/alerts — all alerts (non-patient-specific, for cache invalidation)
  app.get("/api/alerts", requireAdmin, async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // /api/user — GET/PUT current authenticated user profile
  // requireAuth middleware already verified JWT and set req.user
  app.get("/api/user", async (req, res) => {
    try {
      const reqUser = (req as any).user;
      if (!reqUser) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(reqUser.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safe } = user as any;
      res.json(safe);
    } catch (err) {
      console.error("GET /api/user error:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/user", async (req, res) => {
    try {
      const reqUser = (req as any).user;
      if (!reqUser) return res.status(401).json({ message: "Authentication required" });
      const { firstName, lastName, mobileNumber } = req.body;
      const updated = await storage.updateUser(reqUser.userId, { firstName, lastName, mobileNumber });
      if (!updated) return res.status(404).json({ message: "User not found" });
      await logAudit(req, 'update', 'user', String(reqUser.userId), 'User updated their profile');
      const { password: _, ...safe } = updated as any;
      res.json(safe);
    } catch (err) {
      console.error("PUT /api/user error:", err);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // /api/hc03/devices — HC03 BLE devices for a patient
  app.get("/api/hc03/devices", async (req, res) => {
    try {
      const patientId = req.query.patientId as string;
      const devices = await storage.getAllHc03Devices();
      const filtered = patientId ? devices.filter((d: any) => d.patientId === patientId) : devices;
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch HC03 devices" });
    }
  });

  // /api/create-sample-data — admin utility to seed sample vital signs
  app.post("/api/create-sample-data", requireAdmin, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      let created = 0;
      for (const p of patients.slice(0, 3)) {
        const pid = p.patientId || String(p.id);
        const vitals = [
          { patientId: pid, heartRate: 75, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, temperature: "36.8", oxygenLevel: 98, status: 'normal' },
          { patientId: pid, heartRate: 95, bloodPressureSystolic: 145, bloodPressureDiastolic: 92, temperature: "37.2", oxygenLevel: 96, status: 'attention' },
        ];
        for (const v of vitals) {
          await storage.createVitalSigns(v as any);
          created++;
        }
      }
      await logAudit(req, 'create', 'sample_data', undefined, `Created ${created} sample vital sign records`);
      res.json({ message: `Created ${created} sample vital sign records`, count: created });
    } catch (err) {
      res.status(500).json({ message: "Failed to create sample data" });
    }
  });

  // ─── End Missing Routes ────────────────────────────────────────────────────

  // Setup Vite development server or static file serving
  const server = createServer(app);
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}