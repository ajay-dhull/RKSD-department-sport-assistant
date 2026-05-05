import { config } from 'dotenv';
import path from 'path';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env'), override: true });

const app = express();

/**
 * ✅ CORS CONFIGURATION
 * Hostinger frontend + Render backend safe
 */
const allowedOrigins = [
  'http://silver-coyote-528857.hostingersite.com',
  'https://silver-coyote-528857.hostingersite.com',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'https://college-voice-assistance.onrender.com',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

// Regex patterns to match dynamic origins (subdomains, ports)
const allowedOriginPatterns = [
  /^https?:\/\/(.*\.)?hostingersite\.com(:\d+)?\/?$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/
];

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * ✅ REQUEST LOGGING MIDDLEWARE
 */
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      log(logLine);
    }
  });

  next();
});

/**
 * 🔹 MAIN ASYNC SETUP
 */
(async () => {
  const server = await registerRoutes(app);

  // Static files FIRST (before error handler)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /**
   * ✅ ERROR HANDLING MIDDLEWARE
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Error:', err);
    res.status(status).json({ message });
  });

  // START SERVER
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
