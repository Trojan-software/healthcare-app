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
    
    const fs = require('fs');
    const path = require('path');
    const htmlContent = fs.readFileSync(path.join(__dirname, 'simple-app.html'), 'utf8');
    res.send(htmlContent);
  });
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      errorDiv.style.display = 'none';
      
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
      } catch (err) {
        errorDiv.textContent = err.message || 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
      }
    });

    function showAdminDashboard() {
      document.body.innerHTML = '<div style="background:#f8fafc;min-height:100vh;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif">' +
        '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:16px 24px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">' +
          '<div style="max-width:1400px;margin:0 auto;display:flex;justify-content:space-between;align-items:center">' +
            '<div style="display:flex;align-items:center;gap:16px">' +
              '<div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">🏥</div>' +
              '<div>' +
                '<h1 style="font-size:24px;font-weight:600;margin:0">24/7 Tele H Admin</h1>' +
                '<p style="font-size:14px;margin:0;opacity:0.9">Healthcare Management Dashboard</p>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:16px">' +
              '<div style="text-align:right">' +
                '<p style="font-size:14px;margin:0;font-weight:500">' + currentUser.firstName + ' ' + currentUser.lastName + '</p>' +
                '<p style="font-size:12px;margin:0;opacity:0.8">Administrator</p>' +
              '</div>' +
              '<button onclick="logout()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px">Logout</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        
        '<div style="max-width:1400px;margin:0 auto;padding:24px">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:32px">' +
            '<div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #3b82f6">' +
              '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">' +
                '<div>' +
                  '<p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Total Patients</p>' +
                  '<p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">156</p>' +
                '</div>' +
                '<div style="background:#dbeafe;color:#3b82f6;padding:8px;border-radius:8px;font-size:20px">👥</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
                '<span style="color:#10b981;font-size:12px;font-weight:600">↗ +12.5%</span>' +
                '<span style="color:#6b7280;font-size:12px">vs last month</span>' +
              '</div>' +
            '</div>' +
            
            '<div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #10b981">' +
              '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">' +
                '<div>' +
                  '<p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Active Monitoring</p>' +
                  '<p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">89</p>' +
                '</div>' +
                '<div style="background:#d1fae5;color:#10b981;padding:8px;border-radius:8px;font-size:20px">📊</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
                '<span style="color:#10b981;font-size:12px;font-weight:600">↗ +8.2%</span>' +
                '<span style="color:#6b7280;font-size:12px">vs last week</span>' +
              '</div>' +
            '</div>' +
            
            '<div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #f59e0b">' +
              '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">' +
                '<div>' +
                  '<p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Critical Alerts</p>' +
                  '<p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">7</p>' +
                '</div>' +
                '<div style="background:#fef3c7;color:#f59e0b;padding:8px;border-radius:8px;font-size:20px">⚠️</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
                '<span style="color:#ef4444;font-size:12px;font-weight:600">↗ +2</span>' +
                '<span style="color:#6b7280;font-size:12px">since yesterday</span>' +
              '</div>' +
            '</div>' +
            
            '<div style="background:white;padding:24px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-left:4px solid #8b5cf6">' +
              '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">' +
                '<div>' +
                  '<p style="color:#6b7280;font-size:14px;margin:0;font-weight:500">Device Connections</p>' +
                  '<p style="font-size:32px;font-weight:700;color:#1f2937;margin:8px 0 4px">142</p>' +
                '</div>' +
                '<div style="background:#ede9fe;color:#8b5cf6;padding:8px;border-radius:8px;font-size:20px">🔗</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
                '<span style="color:#10b981;font-size:12px;font-weight:600">98.6%</span>' +
                '<span style="color:#6b7280;font-size:12px">connection rate</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          '<div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:32px;text-align:center">' +
            '<div style="font-size:64px;margin-bottom:24px">🏥</div>' +
            '<h2 style="color:#1f2937;font-size:24px;font-weight:700;margin:0 0 16px">Healthcare Management Dashboard</h2>' +
            '<p style="color:#6b7280;font-size:16px;margin:0 0 32px;max-width:600px;margin-left:auto;margin-right:auto">' +
              'Comprehensive patient monitoring system with real-time health analytics, device management, and clinical oversight capabilities.' +
            '</p>' +
            '<div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">' +
              '<button style="background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500">Patient Management</button>' +
              '<button style="background:#10b981;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500">Analytics Dashboard</button>' +
              '<button style="background:#8b5cf6;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500">Device Monitoring</button>' +
              '<button style="background:#f59e0b;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500">System Settings</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function showPatientDashboard() {
      document.body.innerHTML = '<div style="background:#f0f2f5;min-height:100vh;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif">' +
        '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px 16px;color:white">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;max-width:400px;margin:0 auto">' +
            '<div>' +
              '<h1 style="font-size:24px;font-weight:bold;margin:0">24/7 Tele H</h1>' +
              '<p style="font-size:14px;margin:4px 0 0 0;opacity:0.9">Welcome, ' + currentUser.firstName + '</p>' +
            '</div>' +
            '<button onclick="logout()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:8px 12px;border-radius:20px;font-size:12px;cursor:pointer">Logout</button>' +
          '</div>' +
        '</div>' +
        
        '<div style="max-width:400px;margin:-20px auto 0;padding:0 16px">' +
          '<div style="background:white;border-radius:20px 20px 0 0;padding:24px;min-height:calc(100vh - 120px)">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">' +
              '<div style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);padding:20px;border-radius:16px;color:white;text-align:center;box-shadow:0 4px 12px rgba(79,172,254,0.3)">' +
                '<div style="font-size:32px;font-weight:bold;margin-bottom:8px">72</div>' +
                '<div style="font-size:12px;opacity:0.9">Heart Rate</div>' +
                '<div style="font-size:10px;opacity:0.7;margin-top:4px">bpm</div>' +
              '</div>' +
              
              '<div style="background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%);padding:20px;border-radius:16px;color:white;text-align:center;box-shadow:0 4px 12px rgba(67,233,123,0.3)">' +
                '<div style="font-size:32px;font-weight:bold;margin-bottom:8px">98%</div>' +
                '<div style="font-size:12px;opacity:0.9">Blood Oxygen</div>' +
                '<div style="font-size:10px;opacity:0.7;margin-top:4px">SpO2</div>' +
              '</div>' +
              
              '<div style="background:linear-gradient(135deg,#fa709a 0%,#fee140 100%);padding:20px;border-radius:16px;color:white;text-align:center;box-shadow:0 4px 12px rgba(250,112,154,0.3)">' +
                '<div style="font-size:32px;font-weight:bold;margin-bottom:8px">98.6°</div>' +
                '<div style="font-size:12px;opacity:0.9">Temperature</div>' +
                '<div style="font-size:10px;opacity:0.7;margin-top:4px">Fahrenheit</div>' +
              '</div>' +
              
              '<div style="background:linear-gradient(135deg,#a8edea 0%,#fed6e3 100%);padding:20px;border-radius:16px;color:#333;text-align:center;box-shadow:0 4px 12px rgba(168,237,234,0.3)">' +
                '<div style="font-size:32px;font-weight:bold;margin-bottom:8px">120/80</div>' +
                '<div style="font-size:12px;opacity:0.8">Blood Pressure</div>' +
                '<div style="font-size:10px;opacity:0.6;margin-top:4px">mmHg</div>' +
              '</div>' +
            '</div>' +
            
            '<div style="margin-bottom:24px">' +
              '<h3 style="font-size:18px;font-weight:600;color:#333;margin:0 0 16px">Health Overview</h3>' +
              '<div style="background:#f8f9fa;padding:20px;border-radius:16px;border:1px solid #e9ecef">' +
                '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
                  '<div style="width:8px;height:8px;background:#10b981;border-radius:50%"></div>' +
                  '<span style="color:#059669;font-weight:500;font-size:14px">All vitals normal</span>' +
                '</div>' +
                '<div style="background:white;padding:16px;border-radius:12px;margin-bottom:12px">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center">' +
                    '<span style="color:#6c757d;font-size:14px">Last reading</span>' +
                    '<span style="color:#495057;font-weight:500;font-size:14px">2 minutes ago</span>' +
                  '</div>' +
                '</div>' +
                '<div style="background:white;padding:16px;border-radius:12px">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center">' +
                    '<span style="color:#6c757d;font-size:14px">Device status</span>' +
                    '<span style="color:#059669;font-weight:500;font-size:14px">Connected</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            
            '<div style="margin-bottom:24px">' +
              '<h3 style="font-size:18px;font-weight:600;color:#333;margin:0 0 16px">Quick Actions</h3>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
                '<button style="background:#667eea;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(102,126,234,0.3)">' +
                  '<div style="font-size:28px">📊</div>' +
                  '<div style="font-weight:500">Record Vitals</div>' +
                '</button>' +
                
                '<button style="background:#764ba2;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(118,75,162,0.3)">' +
                  '<div style="font-size:28px">🔗</div>' +
                  '<div style="font-weight:500">Connect Device</div>' +
                '</button>' +
                
                '<button style="background:#4facfe;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(79,172,254,0.3)">' +
                  '<div style="font-size:28px">📱</div>' +
                  '<div style="font-weight:500">View History</div>' +
                '</button>' +
                
                '<button style="background:#43e97b;color:white;border:none;padding:20px;border-radius:16px;font-size:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(67,233,123,0.3)">' +
                  '<div style="font-size:28px">⚙️</div>' +
                  '<div style="font-weight:500">Settings</div>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function logout() {
      currentUser = null;
      window.location.reload();
    }
  </script>
</body>
</html>`);
  });

  // Root route redirects to app
  app.get("/", (req, res) => {
    res.redirect("/app");
  });

  // Login route redirects to app  
  app.get("/login", (req, res) => {
    res.redirect("/app");
  });

  // Handle any missing static resources
  app.get(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/, (req, res) => {
    res.status(404).send('Resource not found');
  });

  // Register HC03 device routes
  registerHc03Routes(app);

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