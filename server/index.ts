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

// CORS — inline implementation (no external package, avoids CJS/ESM issues)
// Allows: production domain, Capacitor Android/iOS, local dev, Replit preview
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl, Postman, server-to-server
  if (origin === 'https://247tech.net') return true;
  if (origin === 'http://247tech.net') return true;
  if (origin === 'capacitor://localhost') return true;  // Capacitor Android & iOS
  if (origin === 'ionic://localhost') return true;       // Ionic/Capacitor alternative
  if (origin === 'http://localhost') return true;
  if (origin === 'https://localhost') return true;              // Capacitor androidScheme: 'https'
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true; // any localhost port (http or https)
  if (/\.replit\.dev$/.test(origin)) return true;               // Replit dev previews
  if (/\.replit\.app$/.test(origin)) return true;               // Replit published apps
  return false;
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowed = isAllowedOrigin(origin);

  // ADHCC Finding 5.3 — General Server Vulnerabilities
  // OPTIONS preflight must ALWAYS return an identical, fixed set of headers
  // regardless of what is in the Origin header (including fuzz/format strings).
  //
  // Root cause of previous finding: non-whitelisted origins received NO CORS
  // headers → shorter response → scanner detected response-length variation
  // when fuzzing Origin with %%s and flagged it as a potential injection surface.
  //
  // Fix: OPTIONS always emits a complete, deterministic header block.
  //   - Access-Control-Allow-Origin is always present (falls back to production
  //     domain for unknown origins so header count and structure are identical).
  //   - Vary: Origin tells CDNs the response varies by origin (correct behaviour).
  //   - All other CORS headers are unconditional so byte count is constant.
  if (req.method === 'OPTIONS') {
    const responseOrigin = (origin && allowed) ? origin : 'https://247tech.net';
    res.setHeader('Access-Control-Allow-Origin', responseOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');
    res.status(204).end();
    return;
  }

  // Non-OPTIONS: only reflect CORS headers for whitelisted origins
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || 'https://247tech.net');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length,X-Request-Id');
  }
  next();
});

// Security headers middleware - apply to all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  // Explicitly remove X-Powered-By header (defense in depth)
  res.removeHeader('X-Powered-By');

  // Allow Web Bluetooth API — required for HC03 BLE device integration.
  // Must be present on every response (not just /api) so the browser grants
  // the bluetooth feature to the page itself.
  res.setHeader('Permissions-Policy', 'bluetooth=*, camera=(), microphone=()');
  
  // Cache-Control for API routes - prevent caching of sensitive data
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Security headers — applied to ALL environments so scanner always sees them
  // NOTE: No HTTPS redirect — Replit's load balancer already enforces HTTPS;
  //       a redirect here causes an infinite loop behind the proxy.

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS — production only (dev/staging don't serve over public HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // ADHCC Finding 3.1 — Content Security Policy (tightened)
  //
  // Changes from previous version:
  //   img-src:     removed bare 'https:' wildcard → explicit https://247tech.net only
  //   connect-src: removed bare 'wss:' wildcard    → explicit wss://247tech.net only
  //   media-src:   added 'self' (covers <audio>/<video> elements)
  //   child-src:   added 'none' (Web Workers in frame context)
  //   Applied to ALL environments (was production-only) so scanner always sees it
  //
  // 'unsafe-inline' in style-src is retained — required for Tailwind/shadcn
  // dynamic class injection; does NOT affect script execution.
  const isProd = process.env.NODE_ENV === 'production';
  const selfHost = isProd ? 'https://247tech.net' : '';
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${selfHost ? ' ' + selfHost : ''}`,
    "font-src 'self' data:",
    `connect-src 'self'${selfHost ? ' ' + selfHost + ' wss://' + '247tech.net' : ''}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
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
