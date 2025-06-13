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
    
    // Serve static HTML file using process.cwd()
    try {
      const htmlPath = path.join(process.cwd(), 'server', 'health-app.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      res.send(htmlContent);
    } catch (error) {
      console.error('Error reading HTML file:', error);
      res.status(500).send('Application temporarily unavailable');
    }
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