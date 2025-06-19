import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerHc03Routes } from "./routes-hc03";
import { registerPatientManagementRoutes } from "./patient-management";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // API Routes first
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

  // Login page for ALL other routes
  app.get("*", (req, res) => {
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

  // Register additional routes
  registerHc03Routes(app);
  registerPatientManagementRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}