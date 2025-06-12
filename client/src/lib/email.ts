export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const defaultEmailConfig: EmailConfig = {
  host: process.env.VITE_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.VITE_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.VITE_SMTP_USER || '',
    pass: process.env.VITE_SMTP_PASS || '',
  },
};

export const createOTPEmailTemplate = (otp: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-flex; items-center; justify-content: center; width: 60px; height: 60px; background-color: #2563EB; border-radius: 12px; margin-bottom: 16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l6 6z"></path>
          </svg>
        </div>
        <h1 style="color: #2563EB; margin: 0; font-size: 24px; font-weight: 600;">HealthMonitor 24x7</h1>
        <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 14px;">Patient Care Platform</p>
      </div>
      
      <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1F2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Email Verification</h2>
        <p style="color: #6B7280; margin: 0 0 20px 0; font-size: 16px;">Please use the verification code below to complete your registration:</p>
        
        <div style="background: white; border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
          <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #2563EB; letter-spacing: 4px;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #6B7280; margin: 20px 0 0 0; font-size: 14px;">This code will expire in 10 minutes</p>
      </div>
      
      <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
        <p style="color: #92400E; margin: 0; font-size: 14px;">
          <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email and consider changing your password if you have an existing account.
        </p>
      </div>
      
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; margin: 0; font-size: 12px;">
          © 2025 HealthMonitor 24x7. All rights reserved.<br>
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    </div>
  `;
};

export const createAlertEmailTemplate = (patientId: string, alertTitle: string, alertDescription: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-flex; items-center; justify-content: center; width: 60px; height: 60px; background-color: #DC2626; border-radius: 12px; margin-bottom: 16px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
          </svg>
        </div>
        <h1 style="color: #DC2626; margin: 0; font-size: 24px; font-weight: 700;">🚨 CRITICAL HEALTH ALERT</h1>
        <p style="color: #6B7280; margin: 8px 0 0 0; font-size: 14px;">HealthMonitor 24x7 - Immediate Attention Required</p>
      </div>
      
      <div style="background: #FEE2E2; border: 2px solid #FECACA; border-left: 6px solid #DC2626; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #DC2626; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">${alertTitle}</h2>
        
        <div style="background: white; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #374151; font-weight: 600;">Patient ID:</span>
            <span style="color: #1F2937; font-family: 'Courier New', monospace; font-weight: bold;">${patientId}</span>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 12px;">
            <span style="color: #374151; font-weight: 600;">Alert Details:</span>
            <p style="color: #1F2937; margin: 8px 0 0 0; font-size: 16px;">${alertDescription}</p>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; margin-top: 16px; padding: 12px; background: rgba(220, 38, 38, 0.1); border-radius: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
          <span style="color: #DC2626; font-size: 14px; font-weight: 500;">
            Alert generated at: ${new Date().toLocaleString()}
          </span>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #1F2937; margin: 0 0 16px 0; font-size: 16px; font-weight: 500;">Please review the patient's condition immediately</p>
        
        <a href="#" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Patient Dashboard
        </a>
      </div>
      
      <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #1F2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Recommended Actions:</h3>
        <ul style="color: #4B5563; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 4px;">Review patient's recent vital signs and medical history</li>
          <li style="margin-bottom: 4px;">Contact the patient immediately if necessary</li>
          <li style="margin-bottom: 4px;">Update treatment plan based on current readings</li>
          <li>Document all actions taken in the patient record</li>
        </ul>
      </div>
      
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; margin: 0; font-size: 12px;">
          © 2025 HealthMonitor 24x7. All rights reserved.<br>
          This is an automated alert. Please do not reply to this email.<br>
          For technical support, contact: support@healthmonitor24x7.com
        </p>
      </div>
    </div>
  `;
};
