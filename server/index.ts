import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Trust proxy for proper HTTPS detection behind load balancers
app.set('trust proxy', true);

// Hide X-Powered-By header to prevent server info leakage (ADHCC Security)
app.disable('x-powered-by');

// Security headers middleware - apply to all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  // Explicitly remove X-Powered-By header (defense in depth)
  res.removeHeader('X-Powered-By');
  
  // Cache-Control for API routes - prevent caching of sensitive data
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Only apply additional security middleware in production
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
  // Enhanced CSP - ADHCC Security Compliant
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'", // No unsafe-inline/unsafe-eval, React bundled scripts only
    "style-src 'self' 'unsafe-inline'", // Inline styles needed for dynamic theming
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' wss:", // Secure websockets only
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'", // Block plugins (Flash, Java applets)
    "base-uri 'self'", // Prevent base tag hijacking
    "form-action 'self'", // Forms can only submit to self
    "frame-ancestors 'none'", // Prevent clickjacking
    "frame-src 'none'", // No iframes allowed
    "upgrade-insecure-requests",
    "block-all-mixed-content"
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

  // Global error handler - prevents stack trace/error detail leakage (ADHCC Security)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log error details server-side only (not exposed to client)
    console.error(`[ERROR] ${status}: ${err.message || 'Unknown error'}`);
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
    
    // Return generic message to client - never expose internal details
    const safeMessages: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable"
    };
    
    const clientMessage = safeMessages[status] || "An error occurred";
    res.status(status).json({ message: clientMessage });
  });
  
  // 404 handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not Found" });
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
