import { storage } from './storage';

interface EmailNotification {
  to: string;
  subject: string;
  patientName: string;
  patientId: string;
  alertType: string;
  vitalValue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class EmailNotificationService {
  private doctorEmails: Map<string, string> = new Map();

  constructor() {
    // Initialize doctor-patient assignments
    this.doctorEmails.set('PT001', 'dr.smith@24x7teleh.com');
    this.doctorEmails.set('PT149898', 'dr.johnson@24x7teleh.com');
    this.doctorEmails.set('pt1000', 'dr.ahmed@24x7teleh.com');
    this.doctorEmails.set('pt1001', 'dr.fatima@24x7teleh.com');
    this.doctorEmails.set('PT002', 'dr.hassan@24x7teleh.com');
    this.doctorEmails.set('PT003', 'dr.sarah@24x7teleh.com');
    this.doctorEmails.set('PT004', 'dr.omar@24x7teleh.com');
  }

  async sendCriticalAlert(notification: EmailNotification): Promise<boolean> {
    try {
      const emailContent = this.generateEmailContent(notification);
      
      // In production, this would integrate with SendGrid or similar email service
      console.log(`
========== CRITICAL HEALTH ALERT ==========
To: ${notification.to}
Subject: ${notification.subject}

${emailContent}

Patient Dashboard Link: https://24x7teleh.replit.app/patient/${notification.patientId}
==========================================
      `);

      // Save alert to database
      await storage.createAlert({
        patientId: notification.patientId,
        type: notification.alertType,
        title: `Critical ${notification.alertType}`,
        description: `Critical ${notification.alertType}: ${notification.vitalValue}`
      });

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  private generateEmailContent(notification: EmailNotification): string {
    const severityColor = {
      low: '#10B981',
      medium: '#F59E0B', 
      high: '#EF4444',
      critical: '#DC2626'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Critical Health Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 30px; margin: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .alert-box { background: ${severityColor[notification.severity]}; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .patient-info { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Critical Health Alert</h1>
            <p>24/7 Tele H Technology Services</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2>⚠️ ${notification.severity.toUpperCase()} ALERT</h2>
                <p><strong>${notification.alertType}</strong> requires immediate attention</p>
                <p>Value: ${notification.vitalValue}</p>
            </div>
            
            <div class="patient-info">
                <h3>Patient Information</h3>
                <p><strong>Name:</strong> ${notification.patientName}</p>
                <p><strong>Patient ID:</strong> ${notification.patientId}</p>
                <p><strong>Alert Time:</strong> ${notification.timestamp.toLocaleString()}</p>
            </div>
            
            <h3>Recommended Actions:</h3>
            <ul>
                <li>Contact patient immediately to assess current condition</li>
                <li>Review recent vital signs history for trends</li>
                <li>Consider adjusting medication or treatment plan</li>
                <li>Schedule emergency consultation if necessary</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://24x7teleh.replit.app/patient/${notification.patientId}" class="btn">
                    View Patient Dashboard
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated alert from 24/7 Tele H Healthcare Monitoring System</p>
            <p>For technical support: support@24x7teleh.com | +971-2-123-4567</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async checkCriticalVitals(patientId: string, vitals: any): Promise<void> {
    const patient = await storage.getUserByPatientId(patientId);
    if (!patient) return;

    const doctorEmail = this.doctorEmails.get(patientId);
    if (!doctorEmail) return;

    const criticalAlerts = this.analyzeCriticalVitals(vitals);
    
    for (const alert of criticalAlerts) {
      await this.sendCriticalAlert({
        to: doctorEmail,
        subject: `🚨 CRITICAL ALERT: ${patient.firstName} ${patient.lastName} - ${alert.type}`,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patientId,
        alertType: alert.type,
        vitalValue: alert.value,
        severity: alert.severity,
        timestamp: new Date()
      });
    }
  }

  private analyzeCriticalVitals(vitals: any): Array<{type: string, value: string, severity: 'critical' | 'high'}> {
    const alerts = [];

    // Heart Rate Critical Ranges
    if (vitals.heartRate) {
      if (vitals.heartRate > 120 || vitals.heartRate < 50) {
        alerts.push({
          type: 'Heart Rate',
          value: `${vitals.heartRate} BPM`,
          severity: 'critical' as const
        });
      } else if (vitals.heartRate > 100 || vitals.heartRate < 60) {
        alerts.push({
          type: 'Heart Rate',
          value: `${vitals.heartRate} BPM`,
          severity: 'high' as const
        });
      }
    }

    // Blood Pressure Critical Ranges
    if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
      const systolic = vitals.bloodPressureSystolic;
      const diastolic = vitals.bloodPressureDiastolic;
      
      if (systolic > 180 || diastolic > 120) {
        alerts.push({
          type: 'Blood Pressure',
          value: `${systolic}/${diastolic} mmHg`,
          severity: 'critical' as const
        });
      } else if (systolic > 160 || diastolic > 100) {
        alerts.push({
          type: 'Blood Pressure',
          value: `${systolic}/${diastolic} mmHg`,
          severity: 'high' as const
        });
      }
    }

    // Temperature Critical Ranges
    if (vitals.temperature) {
      const temp = parseFloat(vitals.temperature);
      if (temp > 39.5 || temp < 35.0) {
        alerts.push({
          type: 'Temperature',
          value: `${temp}°C`,
          severity: 'critical' as const
        });
      } else if (temp > 38.5 || temp < 36.0) {
        alerts.push({
          type: 'Temperature',
          value: `${temp}°C`,
          severity: 'high' as const
        });
      }
    }

    // Oxygen Level Critical Ranges
    if (vitals.oxygenLevel) {
      if (vitals.oxygenLevel < 90) {
        alerts.push({
          type: 'Oxygen Saturation',
          value: `${vitals.oxygenLevel}%`,
          severity: 'critical' as const
        });
      } else if (vitals.oxygenLevel < 95) {
        alerts.push({
          type: 'Oxygen Saturation',
          value: `${vitals.oxygenLevel}%`,
          severity: 'high' as const
        });
      }
    }

    return alerts;
  }

  setDoctorEmail(patientId: string, doctorEmail: string): void {
    this.doctorEmails.set(patientId, doctorEmail);
  }

  getDoctorEmail(patientId: string): string | undefined {
    return this.doctorEmails.get(patientId);
  }
}

export const emailNotificationService = new EmailNotificationService();