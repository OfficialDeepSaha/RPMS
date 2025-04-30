import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupVite, log } from "./vite";
import { registerRoutes } from "./routes";
import connectDB from "./db/mongodb-connection";
import path from 'path';
import { PORT, NODE_ENV } from './config';
import { maintenanceMode } from "./middleware/maintenance-mode";
import maintenanceBlocker from "./maintenance-blocker";

const app = express();
// First, parse request body so we can check maintenance mode status
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Import storage directly (ES modules style)
import { storage } from "./storage";

// Direct middleware to enforce maintenance mode
app.use(async (req, res, next) => {
  // Skip for static assets and allowed paths
  if (!req.path.startsWith('/api/') || 
      req.path === '/api/settings/key/maintenanceMode' ||
      req.path === '/api/logout') {
    return next();
  }

  try {
    console.log(`[MAINTENANCE CHECK] Checking request: ${req.method} ${req.path}`);
    
    // Always check database directly for maintenance mode status
    const maintenanceModeSetting = await storage.getSetting('maintenanceMode');
    const maintenanceModeEnabled = maintenanceModeSetting?.value === 'true';
    
    console.log(`[MAINTENANCE STATUS] Maintenance mode is ${maintenanceModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (maintenanceModeEnabled) {
      // Special handling for login path
      if (req.path === '/api/login' && req.method === 'POST') {
        if (req.body?.username !== 'admin') {
          console.log(`[MAINTENANCE BLOCK] Blocked login for non-admin user '${req.body?.username}'`);
          return res.status(503).json({
            error: true,
            maintenance: true,
            message: "System is in maintenance mode. Only administrators can log in."
          });
        }
        console.log(`[MAINTENANCE ALLOW] Allowed admin login attempt`);
      }
      // For authenticated requests
      else if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as any;
        
        // Only allow admin users
        if (user?.username !== 'admin') {
          console.log(`[MAINTENANCE BLOCK] Blocked API access to ${req.path} for non-admin user ${user?.username}`);
          return res.status(503).json({
            error: true,
            maintenance: true,
            message: "System is in maintenance mode. Only administrators can access."
          });
        }
        console.log(`[MAINTENANCE ALLOW] Allowed admin access to ${req.path}`);
      }
      // For unauthenticated requests to other endpoints
      else if (req.path !== '/api/login') {
        console.log(`[MAINTENANCE BLOCK] Blocked unauthenticated access to ${req.path}`);
        return res.status(503).json({
          error: true,
          maintenance: true,
          message: "System is in maintenance mode. Only administrators can access."
        });
      }
    }
    
    // Continue with the request
    next();
  } catch (error) {
    console.error('Error in maintenance mode middleware:', error);
    // In case of error, proceed to avoid lockout
    next();
  }
});

/* Disabled additional maintenance check - using only maintenanceBlocker now
app.use(async (req, res, next) => {
  // Skip check for static assets and the login page itself
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  try {
    const { storage } = require('./storage');
    const maintenanceModeSetting = await storage.getSetting('maintenanceMode');
    const maintenanceModeEnabled = maintenanceModeSetting?.value === 'true';
    
    if (maintenanceModeEnabled) {
      // Special handling for login attempts - only admin can log in
      if (req.path === '/api/login' && req.method === 'POST') {
        if (req.body?.username !== 'admin') {
          console.log(`MAINTENANCE MODE: Blocked login attempt from ${req.body?.username}`);
          return res.status(503).json({
            error: true,
            maintenance: true,
            message: 'System is in maintenance mode. Only administrators can log in.'
          });
        }
      } 
      // For already authenticated requests, check if it's the admin user
      else if (req.isAuthenticated && req.isAuthenticated()) {
        if (req.user?.username !== 'admin') {
          console.log(`MAINTENANCE MODE: Blocked authenticated request from ${req.user?.username}`);
          return res.status(503).json({
            error: true,
            maintenance: true,
            message: 'System is in maintenance mode. Only administrators can access.'
          });
        }
      }
      // Block unauthenticated requests to API endpoints
      else if (req.path !== '/api/login') {
        console.log('MAINTENANCE MODE: Blocked unauthenticated request');
        return res.status(503).json({
          error: true,
          maintenance: true,
          message: 'System is in maintenance mode. Only administrators can access.'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // In case of error, continue to prevent lockout
    next();
  }
});
*/

// Using the dedicated maintenance blocker only - more reliable

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
  // Connect to MongoDB
  await connectDB();
  
  const server = await registerRoutes(app);

  // Default error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(status).json({ message });
    console.error("Global error handler:", err);
  });

  // Setup vite dev server or serve static files based on environment
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }

  // Serve static assets in production
  if (NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, '../../client/dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '../../client/dist', 'index.html'));
    });
  }

  const port = PORT;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
