import type { Express } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";

// Patient Management API Schema Validation
const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  mobileNumber: z.string().regex(/^\+971[0-9]{8,9}$/, "Valid UAE mobile number required"),
  hospitalId: z.string().min(1, "Hospital selection is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional()
});

const updatePatientSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  mobileNumber: z.string().regex(/^\+971[0-9]{8,9}$/).optional(),
  hospitalId: z.string().optional(),
  isActive: z.boolean().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional()
});

const patientSearchSchema = z.object({
  query: z.string().optional(),
  hospitalId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export function registerPatientManagementRoutes(app: Express) {
  
  // Get all patients with filtering and pagination
  app.get('/api/admin/patients', async (req, res) => {
    try {
      const validation = patientSearchSchema.safeParse({
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      });

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid search parameters",
          errors: validation.error.format()
        });
      }

      const { query, hospitalId, status, page, limit } = validation.data;
      
      // Get all patients from storage
      const allPatients = await storage.getAllPatients();
      
      // Apply filters
      let filteredPatients = allPatients;
      
      if (query) {
        const searchLower = query.toLowerCase();
        filteredPatients = filteredPatients.filter(patient => 
          patient.firstName?.toLowerCase().includes(searchLower) ||
          patient.lastName?.toLowerCase().includes(searchLower) ||
          patient.email?.toLowerCase().includes(searchLower) ||
          patient.patientId?.toLowerCase().includes(searchLower)
        );
      }
      
      if (hospitalId) {
        filteredPatients = filteredPatients.filter(patient => 
          patient.hospitalId === hospitalId
        );
      }
      
      if (status !== 'all') {
        const isActive = status === 'active';
        filteredPatients = filteredPatients.filter(patient => 
          Boolean(patient.isVerified) === isActive
        );
      }
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
      
      // Format patient data for response
      const formattedPatients = paginatedPatients.map(patient => ({
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        middleName: patient.middleName,
        lastName: patient.lastName,
        email: patient.email,
        mobileNumber: patient.mobileNumber,
        hospitalId: patient.hospitalId,
        isActive: patient.isVerified,
        createdAt: patient.createdAt,
        lastActivity: patient.createdAt,
        role: patient.role
      }));

      res.json({
        success: true,
        patients: formattedPatients,
        pagination: {
          total: filteredPatients.length,
          page,
          limit,
          totalPages: Math.ceil(filteredPatients.length / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patients'
      });
    }
  });

  // Get single patient details
  app.get('/api/admin/patients/:patientId', async (req, res) => {
    try {
      const { patientId } = req.params;
      
      const patient = await storage.getUserByPatientId(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Get patient's vital signs and health data
      const vitalSigns = await storage.getVitalSignsByPatient(patientId);
      const checkupHistory = await storage.getCheckupHistory(patientId);
      const reminderSettings = await storage.getReminderSettings(patientId);
      const alerts = await storage.getAlertsByPatient(patientId);

      const patientDetails = {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        middleName: patient.middleName,
        lastName: patient.lastName,
        email: patient.email,
        mobileNumber: patient.mobileNumber,
        hospitalId: patient.hospitalId,
        isActive: patient.isVerified,
        createdAt: patient.createdAt,
        lastActivity: patient.createdAt,
        role: patient.role,
        healthData: {
          vitalSigns: vitalSigns.length,
          lastVitalSigns: vitalSigns[0] || null,
          checkupHistory: checkupHistory.length,
          lastCheckup: checkupHistory[0] || null,
          reminderSettings,
          activeAlerts: alerts.filter(alert => !alert.isResolved).length,
          totalAlerts: alerts.length
        }
      };

      res.json({
        success: true,
        patient: patientDetails
      });
    } catch (error) {
      console.error('Error fetching patient details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patient details'
      });
    }
  });

  // Create new patient account
  app.post('/api/admin/patients', async (req, res) => {
    try {
      const validation = createPatientSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient data",
          errors: validation.error.format()
        });
      }

      const { firstName, middleName, lastName, email, mobileNumber, hospitalId, ...additionalData } = validation.data;

      // Check if patient already exists
      const existingPatient = await storage.getUserByEmail(email);
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: 'Patient with this email already exists'
        });
      }

      // Generate unique patient ID
      const patientId = `PAT${Date.now().toString().slice(-6)}`;
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Create patient account
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
        role: 'patient',
        ...additionalData
      });

      console.log(`New patient created - ID: ${patientId}, Email: ${email}, Temp Password: ${tempPassword}`);

      res.json({
        success: true,
        message: 'Patient account created successfully',
        patient: {
          id: newPatient.id,
          patientId,
          firstName,
          middleName,
          lastName,
          email,
          mobileNumber,
          hospitalId,
          tempPassword,
          isActive: true
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

  // Update patient information
  app.put('/api/admin/patients/:patientId', async (req, res) => {
    try {
      const { patientId } = req.params;
      
      const validation = updatePatientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid update data",
          errors: validation.error.format()
        });
      }

      const patient = await storage.getUserByPatientId(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Check for email conflicts if email is being updated
      if (validation.data.email && validation.data.email !== patient.email) {
        const existingPatient = await storage.getUserByEmail(validation.data.email);
        if (existingPatient && existingPatient.id !== patient.id) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use by another patient'
          });
        }
      }

      const updatedPatient = await storage.updateUser(patient.id, validation.data);
      
      if (!updatedPatient) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update patient'
        });
      }

      res.json({
        success: true,
        message: 'Patient updated successfully',
        patient: {
          id: updatedPatient.id,
          patientId: updatedPatient.patientId,
          firstName: updatedPatient.firstName,
          middleName: updatedPatient.middleName,
          lastName: updatedPatient.lastName,
          email: updatedPatient.email,
          mobileNumber: updatedPatient.mobileNumber,
          hospitalId: updatedPatient.hospitalId,
          isActive: updatedPatient.isVerified
        }
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update patient'
      });
    }
  });

  // Toggle patient access (activate/deactivate)
  app.patch('/api/admin/patients/:patientId/toggle-access', async (req, res) => {
    try {
      const { patientId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      await storage.updatePatientAccess(patientId, isActive);

      res.json({
        success: true,
        message: `Patient access ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling patient access:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update patient access'
      });
    }
  });

  // Reset patient password
  app.post('/api/admin/patients/:patientId/reset-password', async (req, res) => {
    try {
      const { patientId } = req.params;
      
      const patient = await storage.getUserByPatientId(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Generate new temporary password
      const newPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await storage.updateUser(patient.id, { password: passwordHash });

      console.log(`Password reset for patient ${patientId}: ${newPassword}`);

      res.json({
        success: true,
        message: 'Password reset successfully',
        tempPassword: newPassword
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  });

  // Get patient statistics
  app.get('/api/admin/patients/stats', async (req, res) => {
    try {
      const allPatients = await storage.getAllPatients();
      
      const stats = {
        total: allPatients.length,
        active: allPatients.filter(p => p.isVerified).length,
        inactive: allPatients.filter(p => !p.isVerified).length,
        registeredToday: allPatients.filter(p => {
          const today = new Date();
          const patientDate = new Date(p.createdAt);
          return patientDate.toDateString() === today.toDateString();
        }).length,
        byHospital: allPatients.reduce((acc, patient) => {
          const hospitalId = patient.hospitalId || 'unknown';
          acc[hospitalId] = (acc[hospitalId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching patient statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patient statistics'
      });
    }
  });

  // Patient health data summary
  app.get('/api/admin/patients/:patientId/health-summary', async (req, res) => {
    try {
      const { patientId } = req.params;
      
      const patient = await storage.getUserByPatientId(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const [vitalSigns, checkupHistory, dashboardStats, alerts] = await Promise.all([
        storage.getVitalSignsByPatient(patientId),
        storage.getCheckupHistory(patientId),
        storage.getDashboardStats(patientId),
        storage.getAlertsByPatient(patientId)
      ]);

      const healthSummary = {
        patient: {
          id: patient.id,
          patientId: patient.patientId,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email
        },
        vitals: {
          total: vitalSigns.length,
          latest: vitalSigns[0] || null,
          averages: vitalSigns.length > 0 ? {
            heartRate: Math.round(vitalSigns.reduce((sum, v) => sum + (v.heartRate || 0), 0) / vitalSigns.length),
            systolic: Math.round(vitalSigns.reduce((sum, v) => sum + (v.bloodPressureSystolic || 0), 0) / vitalSigns.length),
            diastolic: Math.round(vitalSigns.reduce((sum, v) => sum + (v.bloodPressureDiastolic || 0), 0) / vitalSigns.length),
            temperature: Number((vitalSigns.reduce((sum, v) => sum + parseFloat(v.temperature || '0'), 0) / vitalSigns.length).toFixed(1)),
            oxygenLevel: Math.round(vitalSigns.reduce((sum, v) => sum + (v.oxygenLevel || 0), 0) / vitalSigns.length)
          } : null
        },
        checkups: {
          total: checkupHistory.length,
          latest: checkupHistory[0] || null
        },
        alerts: {
          total: alerts.length,
          active: alerts.filter(a => !a.isResolved).length,
          critical: alerts.filter(a => a.type === 'critical').length
        },
        dashboardStats
      };

      res.json({
        success: true,
        healthSummary
      });
    } catch (error) {
      console.error('Error fetching health summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch health summary'
      });
    }
  });
}