import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Trust proxy for proper HTTPS detection behind load balancers
app.set('trust proxy', true);

// Security headers middleware for production
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only apply security middleware in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Force HTTPS in production with proper redirect
  if (req.header('x-forwarded-proto') !== 'https') {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://247tech.net';
    return res.redirect(301, `${publicBaseUrl}${req.url}`);
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS header (without preload initially for safety)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy for healthcare app (production-ready)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'", // Removed unsafe-inline and unsafe-eval for production
    "style-src 'self' 'unsafe-inline'", // Style inline needed for dynamic theming
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' wss:", // Only secure websockets in production
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'", // Modern alternative to X-Frame-Options
    "upgrade-insecure-requests", // Automatically upgrade HTTP to HTTPS
    "block-all-mixed-content" // Block mixed content for security
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for debugging
    console.error(`${req.method} ${req.path} - Error ${status}:`, err);

    res.status(status).json({ message });
    // Don't throw the error to prevent server crash
  });

  // Note: Vite setup is handled in registerRoutes to avoid double configuration

  const port = 5000;
  server.listen({
    port: port,
    host: "0.0.0.0",
  }, () => {
    log(`Healthcare system serving on port ${port}`);
    console.log(`24/7 Tele H System ready at http://localhost:${port}`);
  });
})();
