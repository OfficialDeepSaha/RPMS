import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupVite, log } from "./vite";
import { registerRoutes } from "./routes";
import connectDB from "./db/mongodb-connection";
import path from 'path';
import { PORT, NODE_ENV } from './config';
import { maintenanceMode } from "./middleware/maintenance-mode";
import maintenanceBlocker from "./maintenance-blocker";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const app = express();
// First, parse request body so we can check maintenance mode status
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Import storage directly (ES modules style)
import { storage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    // Try multiple possible paths for the client dist directory
    let clientDistPath;
    
    // Possible paths for client/dist (Render structure is different)
    const possiblePaths = [
      path.resolve(__dirname, '../../client/dist'),        // Local/normal structure
      path.resolve(process.cwd(), 'client/dist'),          // From current working directory
      path.resolve(process.cwd(), '../client/dist'),       // One level up
      path.resolve(process.cwd(), 'dist'),                 // Just /dist folder
      path.resolve(process.cwd(), 'dist/client'),          // dist/client structure
      path.resolve(process.cwd(), 'dist/public'),          // Original vite output path
      '/opt/render/project/src/client/dist',              // Render specific
      '/opt/render/project/dist',                         // Render specific alt
      '/opt/render/project/dist/client',                  // Another Render possibility
      '/opt/render/project/dist/public'                   // Original vite output on Render
    ];
    
    // Find the first valid path
    for (const testPath of possiblePaths) {
      try {
        // Use fs to check if directory exists
        if (fs.existsSync(testPath) && 
            fs.existsSync(path.join(testPath, 'index.html'))) {
          clientDistPath = testPath;
          console.log(`✅ Found client files at: ${clientDistPath}`);
          break;
        }
      } catch (err) {
        // Just skip to next path
        console.log(`❌ Path doesn't exist: ${testPath}`);
      }
    }
    
    if (clientDistPath) {
      // Serve static files from the client/dist directory
      console.log(`Serving static files from: ${clientDistPath}`);
      app.use(express.static(clientDistPath));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    } else {
      console.error('ERROR: Could not find client/dist directory!');
      console.error('Current directory structure:');
      try {
        // Try to list files in current directory to help debug
        const currentDir = process.cwd();
        console.error(`Contents of ${currentDir}:`);
        console.error(fs.readdirSync(currentDir).join(', '));
      } catch (e) {
        console.error('Failed to list directory:', e);
      }
    }
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
