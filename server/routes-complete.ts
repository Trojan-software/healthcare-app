import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

  // Health check route
  app.get("/health", (req, res) => {
    res.json({ status: "Server running", time: new Date().toISOString() });
  });

  // Root route serves the complete application
  app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>24/7 Tele H - Health Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; }
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .login-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
        .logo { text-align: center; margin-bottom: 32px; }
        .logo h1 { font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
        .logo p { color: #6b7280; font-size: 16px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 500; color: #374151; }
        .form-input { width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; }
        .form-input:focus { outline: none; border-color: #3b82f6; }
        .login-btn { width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .login-btn:hover { transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .error { background: #fef2f2; border: 2px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: none; }
        .demo-accounts { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; }
        .demo-accounts h3 { color: #374151; margin-bottom: 12px; font-size: 14px; }
        .demo-account { background: #f3f4f6; padding: 8px 12px; margin: 4px 0; border-radius: 6px; font-size: 12px; color: #4b5563; }
        .dashboard { display: none; min-height: 100vh; }
        .admin-dashboard { background: #f8fafc; }
        .patient-dashboard { background: #f0f2f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .header-title { font-size: 24px; font-weight: 600; margin: 0; }
        .header-subtitle { font-size: 14px; margin: 0; opacity: 0.9; }
        .header-right { display: flex; align-items: center; gap: 16px; }
        .user-info { text-align: right; }
        .logout-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .main-content { max-width: 1400px; margin: 0 auto; padding: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid; }
        .stat-card.blue { border-left-color: #3b82f6; }
        .stat-card.green { border-left-color: #10b981; }
        .stat-card.yellow { border-left-color: #f59e0b; }
        .stat-card.purple { border-left-color: #8b5cf6; }
        .stat-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
        .stat-label { color: #6b7280; font-size: 14px; font-weight: 500; margin: 0; }
        .stat-value { font-size: 32px; font-weight: 700; color: #1f2937; margin: 8px 0 4px; }
        .stat-icon { padding: 8px; border-radius: 8px; font-size: 20px; }
        .stat-icon.blue { background: #dbeafe; color: #3b82f6; }
        .stat-icon.green { background: #d1fae5; color: #10b981; }
        .stat-icon.yellow { background: #fef3c7; color: #f59e0b; }
        .stat-icon.purple { background: #ede9fe; color: #8b5cf6; }
        .stat-change { display: flex; align-items: center; gap: 8px; }
        .stat-change.positive { color: #10b981; }
        .overview-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px; text-align: center; }
        .overview-icon { font-size: 64px; margin-bottom: 24px; }
        .overview-title { color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
        .overview-text { color: #6b7280; font-size: 16px; margin: 0 0 32px; max-width: 600px; margin-left: auto; margin-right: auto; }
        .action-buttons { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .action-btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .action-btn.green { background: #10b981; }
        .action-btn.purple { background: #8b5cf6; }
        .action-btn.yellow { background: #f59e0b; }
        .patient-header { max-width: 400px; margin: 0 auto; }
        .patient-content { max-width: 400px; margin: -20px auto 0; padding: 0 16px; }
        .patient-card { background: white; border-radius: 20px 20px 0 0; padding: 24px; min-height: calc(100vh - 120px); }
        .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .vital-card { padding: 20px; border-radius: 16px; color: white; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .vital-card.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .vital-card.green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        .vital-card.pink { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .vital-card.soft { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
        .vital-value { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .vital-label { font-size: 12px; opacity: 0.9; }
        .vital-unit { font-size: 10px; opacity: 0.7; margin-top: 4px; }
        .section-title { font-size: 18px; font-weight: 600; color: #333; margin: 0 0 16px; }
        .health-overview { background: #f8f9fa; padding: 20px; border-radius: 16px; border: 1px solid #e9ecef; margin-bottom: 24px; }
        .status-indicator { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.green { background: #10b981; }
        .status-text { color: #059669; font-weight: 500; font-size: 14px; }
        .info-item { background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .info-label { color: #6c757d; font-size: 14px; }
        .info-value { color: #495057; font-weight: 500; font-size: 14px; }
        .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .quick-action { background: #667eea; color: white; border: none; padding: 20px; border-radius: 16px; font-size: 14px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .quick-action.purple { background: #764ba2; }
        .quick-action.blue { background: #4facfe; }
        .quick-action.green { background: #43e97b; }
        .action-icon { font-size: 28px; }
        .action-label { font-weight: 500; }
        .admin-section { display: none; }
        @media (max-width: 640px) { .header-content { flex-direction: column; gap: 16px; text-align: center; } .stats-grid { grid-template-columns: 1fr; } .action-buttons { flex-direction: column; } }
    </style>
</head>
<body>
    <div id="loginView" class="login-container">
        <div class="login-card">
            <div class="logo">
                <h1>24/7 Tele H</h1>
                <p>Health Monitoring System</p>
            </div>
            <div id="errorMessage" class="error"></div>
            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" id="emailInput" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" id="passwordInput" class="form-input" required>
                </div>
                <button type="submit" id="loginButton" class="login-btn">Sign In</button>
            </form>
            <div class="demo-accounts">
                <h3>Demo Accounts</h3>
                <div class="demo-account">Admin: admin@24x7teleh.com / admin123</div>
                <div class="demo-account">Patient: patient.demo@example.com / patient123</div>
            </div>
        </div>
    </div>
    
    <div id="adminDashboard" class="dashboard admin-dashboard">
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <div class="header-icon">🏥</div>
                    <div>
                        <h1 class="header-title">24/7 Tele H Admin</h1>
                        <p class="header-subtitle">Healthcare Management Dashboard</p>
                    </div>
                </div>
                <div class="header-right">
                    <div class="user-info">
                        <p id="adminUserName" style="font-size: 14px; margin: 0; font-weight: 500;"></p>
                        <p style="font-size: 12px; margin: 0; opacity: 0.8;">Administrator</p>
                    </div>
                    <button class="logout-btn" onclick="logout()">Logout</button>
                </div>
            </div>
        </div>
        <div class="main-content">
            <div id="dashboardOverview">
                <div class="stats-grid">
                    <div class="stat-card blue">
                        <div class="stat-header">
                            <div><p class="stat-label">Total Patients</p><p class="stat-value">156</p></div>
                            <div class="stat-icon blue">👥</div>
                        </div>
                        <div class="stat-change positive">
                            <span style="font-size: 12px; font-weight: 600;">↗ +12.5%</span>
                            <span style="color: #6b7280; font-size: 12px;">vs last month</span>
                        </div>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-header">
                            <div><p class="stat-label">Active Monitoring</p><p class="stat-value">89</p></div>
                            <div class="stat-icon green">📊</div>
                        </div>
                        <div class="stat-change positive">
                            <span style="font-size: 12px; font-weight: 600;">↗ +8.2%</span>
                            <span style="color: #6b7280; font-size: 12px;">vs last week</span>
                        </div>
                    </div>
                    <div class="stat-card yellow">
                        <div class="stat-header">
                            <div><p class="stat-label">Critical Alerts</p><p class="stat-value">7</p></div>
                            <div class="stat-icon yellow">⚠️</div>
                        </div>
                        <div class="stat-change">
                            <span style="font-size: 12px; font-weight: 600;">↗ +2</span>
                            <span style="color: #6b7280; font-size: 12px;">since yesterday</span>
                        </div>
                    </div>
                    <div class="stat-card purple">
                        <div class="stat-header">
                            <div><p class="stat-label">Device Connections</p><p class="stat-value">142</p></div>
                            <div class="stat-icon purple">🔗</div>
                        </div>
                        <div class="stat-change positive">
                            <span style="font-size: 12px; font-weight: 600;">98.6%</span>
                            <span style="color: #6b7280; font-size: 12px;">connection rate</span>
                        </div>
                    </div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon">🏥</div>
                    <h2 class="overview-title">Healthcare Management Dashboard</h2>
                    <p class="overview-text">Comprehensive patient monitoring system with real-time health analytics, device management, and clinical oversight capabilities.</p>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="showPatientManagement()">Patient Management</button>
                        <button class="action-btn green" onclick="showAnalytics()">Analytics Dashboard</button>
                        <button class="action-btn purple" onclick="showDeviceMonitoring()">Device Monitoring</button>
                        <button class="action-btn yellow" onclick="showSettings()">System Settings</button>
                    </div>
                </div>
            </div>
            
            <!-- Patient Management Section -->
            <div id="patientManagementSection" class="admin-section">
                <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">Patient Management</h2>
                        <button onclick="showDashboardOverview()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">← Back to Dashboard</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Active Patients</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Currently monitored: 89 patients</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px;">New Registrations</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">This month: 12 new patients</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Pending Reviews</h3>
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">Requires attention: 5 cases</p>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Recent Patient Activity</h3>
                        <div style="display: grid; gap: 12px;">
                            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>John Smith</strong> - Vital signs updated<br><span style="color: #6b7280; font-size: 14px;">2 minutes ago</span></div>
                                <span style="background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Normal</span>
                            </div>
                            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>Sarah Johnson</strong> - Device connected<br><span style="color: #6b7280; font-size: 14px;">15 minutes ago</span></div>
                                <span style="background: #dbeafe; color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Connected</span>
                            </div>
                            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>Michael Davis</strong> - Alert triggered<br><span style="color: #6b7280; font-size: 14px;">1 hour ago</span></div>
                                <span style="background: #fef3c7; color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Attention</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Analytics Section -->
            <div id="analyticsSection" class="admin-section">
                <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">Analytics Dashboard</h2>
                        <button onclick="showDashboardOverview()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">← Back to Dashboard</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 8px; font-size: 16px;">Average Heart Rate</h3>
                            <p style="font-size: 32px; font-weight: bold; margin: 0;">74 BPM</p>
                            <p style="font-size: 12px; opacity: 0.8; margin: 4px 0 0;">Population average</p>
                        </div>
                        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 8px; font-size: 16px;">Blood Pressure Range</h3>
                            <p style="font-size: 32px; font-weight: bold; margin: 0;">118/76</p>
                            <p style="font-size: 12px; opacity: 0.8; margin: 4px 0 0;">Average reading</p>
                        </div>
                        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 12px;">
                            <h3 style="margin: 0 0 8px; font-size: 16px;">Daily Checkups</h3>
                            <p style="font-size: 32px; font-weight: bold; margin: 0;">127</p>
                            <p style="font-size: 12px; opacity: 0.8; margin: 4px 0 0;">Completed today</p>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Health Trends</h3>
                        <div style="background: white; padding: 20px; border-radius: 8px;">
                            <h4 style="color: #374151; margin: 0 0 12px;">Weekly Health Score Distribution</h4>
                            <div style="display: flex; align-items: end; gap: 8px; height: 120px;">
                                <div style="background: #10b981; width: 40px; height: 80%; border-radius: 4px 4px 0 0; display: flex; align-items: end; justify-content: center; color: white; font-size: 12px; padding-bottom: 8px;">85%</div>
                                <div style="background: #3b82f6; width: 40px; height: 65%; border-radius: 4px 4px 0 0; display: flex; align-items: end; justify-content: center; color: white; font-size: 12px; padding-bottom: 8px;">78%</div>
                                <div style="background: #8b5cf6; width: 40px; height: 90%; border-radius: 4px 4px 0 0; display: flex; align-items: end; justify-content: center; color: white; font-size: 12px; padding-bottom: 8px;">92%</div>
                                <div style="background: #f59e0b; width: 40px; height: 72%; border-radius: 4px 4px 0 0; display: flex; align-items: end; justify-content: center; color: white; font-size: 12px; padding-bottom: 8px;">81%</div>
                                <div style="background: #ef4444; width: 40px; height: 88%; border-radius: 4px 4px 0 0; display: flex; align-items: end; justify-content: center; color: white; font-size: 12px; padding-bottom: 8px;">89%</div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 12px; color: #6b7280;">
                                <span style="width: 40px; text-align: center;">Mon</span>
                                <span style="width: 40px; text-align: center;">Tue</span>
                                <span style="width: 40px; text-align: center;">Wed</span>
                                <span style="width: 40px; text-align: center;">Thu</span>
                                <span style="width: 40px; text-align: center;">Fri</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Device Monitoring Section -->
            <div id="deviceMonitoringSection" class="admin-section">
                <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">Device Monitoring</h2>
                        <button onclick="showDashboardOverview()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">← Back to Dashboard</button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Connected Devices</h3>
                            <p style="color: #059669; font-size: 24px; font-weight: bold; margin: 0;">142/156</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">91% connection rate</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Battery Status</h3>
                            <p style="color: #3b82f6; font-size: 24px; font-weight: bold; margin: 0;">87%</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Average battery level</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Low Battery Alerts</h3>
                            <p style="color: #f59e0b; font-size: 24px; font-weight: bold; margin: 0;">3</p>
                            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Devices need charging</p>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Device Status Overview</h3>
                        <div style="display: grid; gap: 12px;">
                            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>HC03-001</strong> - Patient: John Smith<br><span style="color: #6b7280; font-size: 14px;">Battery: 95% | Signal: Strong</span></div>
                                <span style="background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Connected</span>
                            </div>
                            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>HC03-002</strong> - Patient: Sarah Johnson<br><span style="color: #6b7280; font-size: 14px;">Battery: 15% | Signal: Good</span></div>
                                <span style="background: #fef3c7; color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Low Battery</span>
                            </div>
                            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div><strong>HC03-003</strong> - Patient: Michael Davis<br><span style="color: #6b7280; font-size: 14px;">Battery: 78% | Signal: Weak</span></div>
                                <span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Poor Signal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Settings Section -->
            <div id="settingsSection" class="admin-section">
                <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">System Settings</h2>
                        <button onclick="showDashboardOverview()" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">← Back to Dashboard</button>
                    </div>
                    <div style="display: grid; gap: 24px;">
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Alert Configuration</h3>
                            <div style="display: grid; gap: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 16px; border-radius: 8px;">
                                    <div><strong>Critical Vital Signs</strong><br><span style="color: #6b7280; font-size: 14px;">Immediate alerts for dangerous readings</span></div>
                                    <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Enabled</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 16px; border-radius: 8px;">
                                    <div><strong>Device Disconnection</strong><br><span style="color: #6b7280; font-size: 14px;">Notify when devices go offline</span></div>
                                    <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Enabled</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 16px; border-radius: 8px;">
                                    <div><strong>Low Battery Warnings</strong><br><span style="color: #6b7280; font-size: 14px;">Alert when device battery below 20%</span></div>
                                    <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Enabled</span>
                                </div>
                            </div>
                        </div>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">System Information</h3>
                            <div style="display: grid; gap: 12px;">
                                <div style="display: flex; justify-content: space-between; background: white; padding: 16px; border-radius: 8px;">
                                    <span style="color: #6b7280;">System Version</span>
                                    <span style="font-weight: 500;">24x7 Tele H v2.1.3</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; background: white; padding: 16px; border-radius: 8px;">
                                    <span style="color: #6b7280;">Database Status</span>
                                    <span style="color: #10b981; font-weight: 500;">Connected</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; background: white; padding: 16px; border-radius: 8px;">
                                    <span style="color: #6b7280;">Last Backup</span>
                                    <span style="font-weight: 500;">Today 3:00 AM</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; background: white; padding: 16px; border-radius: 8px;">
                                    <span style="color: #6b7280;">System Uptime</span>
                                    <span style="font-weight: 500;">15 days, 7 hours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="patientDashboard" class="dashboard patient-dashboard">
        <div class="header">
            <div class="header-content patient-header">
                <div>
                    <h1 class="header-title">24/7 Tele H</h1>
                    <p class="header-subtitle" id="patientWelcome"></p>
                </div>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
        </div>
        <div class="patient-content">
            <div class="patient-card">
                <div class="vitals-grid">
                    <div class="vital-card blue">
                        <div class="vital-value">72</div>
                        <div class="vital-label">Heart Rate</div>
                        <div class="vital-unit">bpm</div>
                    </div>
                    <div class="vital-card green">
                        <div class="vital-value">98%</div>
                        <div class="vital-label">Blood Oxygen</div>
                        <div class="vital-unit">SpO2</div>
                    </div>
                    <div class="vital-card pink">
                        <div class="vital-value">98.6°</div>
                        <div class="vital-label">Temperature</div>
                        <div class="vital-unit">Fahrenheit</div>
                    </div>
                    <div class="vital-card soft">
                        <div class="vital-value">120/80</div>
                        <div class="vital-label">Blood Pressure</div>
                        <div class="vital-unit">mmHg</div>
                    </div>
                </div>
                <div>
                    <h3 class="section-title">Health Overview</h3>
                    <div class="health-overview">
                        <div class="status-indicator">
                            <div class="status-dot green"></div>
                            <span class="status-text">All vitals normal</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Last reading</span>
                            <span class="info-value">2 minutes ago</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Device status</span>
                            <span class="info-value" style="color: #059669;">Connected</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="section-title">Quick Actions</h3>
                    <div class="quick-actions">
                        <button class="quick-action" onclick="recordVitals()">
                            <div class="action-icon">📊</div>
                            <div class="action-label">Record Vitals</div>
                        </button>
                        <button class="quick-action purple" onclick="connectDevice()">
                            <div class="action-icon">🔗</div>
                            <div class="action-label">Connect Device</div>
                        </button>
                        <button class="quick-action blue" onclick="viewHistory()">
                            <div class="action-icon">📱</div>
                            <div class="action-label">View History</div>
                        </button>
                        <button class="quick-action green" onclick="showPatientSettings()">
                            <div class="action-icon">⚙️</div>
                            <div class="action-label">Settings</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;
        const loginView = document.getElementById('loginView');
        const adminDashboard = document.getElementById('adminDashboard');
        const patientDashboard = document.getElementById('patientDashboard');
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const loginButton = document.getElementById('loginButton');
        const errorMessage = document.getElementById('errorMessage');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            
            loginButton.disabled = true;
            loginButton.textContent = 'Signing in...';
            errorMessage.style.display = 'none';
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Login failed');
                }
                
                const result = await response.json();
                currentUser = result.user;
                
                if (result.user.role === 'admin') {
                    showAdminDashboard();
                } else {
                    showPatientDashboard();
                }
                
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = 'Sign In';
            }
        });
        
        function showAdminDashboard() {
            loginView.style.display = 'none';
            adminDashboard.style.display = 'block';
            patientDashboard.style.display = 'none';
            document.getElementById('adminUserName').textContent = currentUser.firstName + ' ' + currentUser.lastName;
            showDashboardOverview();
        }
        
        function showPatientDashboard() {
            loginView.style.display = 'none';
            adminDashboard.style.display = 'none';
            patientDashboard.style.display = 'block';
            document.getElementById('patientWelcome').textContent = 'Welcome, ' + currentUser.firstName;
        }
        
        function showDashboardOverview() {
            document.getElementById('dashboardOverview').style.display = 'block';
            document.getElementById('patientManagementSection').style.display = 'none';
            document.getElementById('analyticsSection').style.display = 'none';
            document.getElementById('deviceMonitoringSection').style.display = 'none';
            document.getElementById('settingsSection').style.display = 'none';
        }
        
        function showPatientManagement() {
            document.getElementById('dashboardOverview').style.display = 'none';
            document.getElementById('patientManagementSection').style.display = 'block';
            document.getElementById('analyticsSection').style.display = 'none';
            document.getElementById('deviceMonitoringSection').style.display = 'none';
            document.getElementById('settingsSection').style.display = 'none';
        }
        
        function showAnalytics() {
            document.getElementById('dashboardOverview').style.display = 'none';
            document.getElementById('patientManagementSection').style.display = 'none';
            document.getElementById('analyticsSection').style.display = 'block';
            document.getElementById('deviceMonitoringSection').style.display = 'none';
            document.getElementById('settingsSection').style.display = 'none';
        }
        
        function showDeviceMonitoring() {
            document.getElementById('dashboardOverview').style.display = 'none';
            document.getElementById('patientManagementSection').style.display = 'none';
            document.getElementById('analyticsSection').style.display = 'none';
            document.getElementById('deviceMonitoringSection').style.display = 'block';
            document.getElementById('settingsSection').style.display = 'none';
        }
        
        function showSettings() {
            document.getElementById('dashboardOverview').style.display = 'none';
            document.getElementById('patientManagementSection').style.display = 'none';
            document.getElementById('analyticsSection').style.display = 'none';
            document.getElementById('deviceMonitoringSection').style.display = 'none';
            document.getElementById('settingsSection').style.display = 'block';
        }
        
        // Patient actions
        function recordVitals() {
            alert('Vital signs recording feature - connects to HC03 device for automatic readings');
        }
        
        function connectDevice() {
            alert('Device connection feature - scan for nearby HC03 Bluetooth devices');
        }
        
        function viewHistory() {
            alert('View history feature - displays past vital signs readings and trends');
        }
        
        function showPatientSettings() {
            alert('Patient settings - configure alerts, reminders, and account preferences');
        }
        
        function logout() {
            currentUser = null;
            loginView.style.display = 'block';
            adminDashboard.style.display = 'none';
            patientDashboard.style.display = 'none';
            emailInput.value = '';
            passwordInput.value = '';
            errorMessage.style.display = 'none';
            showDashboardOverview();
        }
    </script>
</body>
</html>`;
    
    res.send(htmlContent);
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}