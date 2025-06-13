import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

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
      console.log(`Login response user role: ${user.role}`);

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

  // Main app route  
  app.get("/app", (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Serve static HTML file - embed directly to avoid any external dependencies
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
                    <button class="action-btn">Patient Management</button>
                    <button class="action-btn green">Analytics Dashboard</button>
                    <button class="action-btn purple">Device Monitoring</button>
                    <button class="action-btn yellow">System Settings</button>
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
                        <button class="quick-action">
                            <div class="action-icon">📊</div>
                            <div class="action-label">Record Vitals</div>
                        </button>
                        <button class="quick-action purple">
                            <div class="action-icon">🔗</div>
                            <div class="action-label">Connect Device</div>
                        </button>
                        <button class="quick-action blue">
                            <div class="action-icon">📱</div>
                            <div class="action-label">View History</div>
                        </button>
                        <button class="quick-action green">
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
        }
        
        function showPatientDashboard() {
            loginView.style.display = 'none';
            adminDashboard.style.display = 'none';
            patientDashboard.style.display = 'block';
            document.getElementById('patientWelcome').textContent = 'Welcome, ' + currentUser.firstName;
        }
        
        function logout() {
            currentUser = null;
            loginView.style.display = 'block';
            adminDashboard.style.display = 'none';
            patientDashboard.style.display = 'none';
            emailInput.value = '';
            passwordInput.value = '';
            errorMessage.style.display = 'none';
        }
    </script>
</body>
</html>`;
    
    res.send(htmlContent);
  });

  // Root route serves the application directly
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
                    <button class="action-btn">Patient Management</button>
                    <button class="action-btn green">Analytics Dashboard</button>
                    <button class="action-btn purple">Device Monitoring</button>
                    <button class="action-btn yellow">System Settings</button>
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
                        <button class="quick-action">
                            <div class="action-icon">📊</div>
                            <div class="action-label">Record Vitals</div>
                        </button>
                        <button class="quick-action purple">
                            <div class="action-icon">🔗</div>
                            <div class="action-label">Connect Device</div>
                        </button>
                        <button class="quick-action blue">
                            <div class="action-icon">📱</div>
                            <div class="action-label">View History</div>
                        </button>
                        <button class="quick-action green">
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
        }
        
        function showPatientDashboard() {
            loginView.style.display = 'none';
            adminDashboard.style.display = 'none';
            patientDashboard.style.display = 'block';
            document.getElementById('patientWelcome').textContent = 'Welcome, ' + currentUser.firstName;
        }
        
        function logout() {
            currentUser = null;
            loginView.style.display = 'block';
            adminDashboard.style.display = 'none';
            patientDashboard.style.display = 'none';
            emailInput.value = '';
            passwordInput.value = '';
            errorMessage.style.display = 'none';
        }
    </script>
</body>
</html>`;
    
    res.send(htmlContent);
  });

  // Login route redirects to app  
  app.get("/login", (req, res) => {
    res.redirect("/app");
  });

  // Handle any missing static resources
  app.get(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/, (req, res) => {
    res.status(404).send('Resource not found');
  });

  // Catch all other routes
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    res.redirect("/app");
  });

  const httpServer = createServer(app);
  return httpServer;
}