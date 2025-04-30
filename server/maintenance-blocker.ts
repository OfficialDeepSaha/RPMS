/**
 * MAINTENANCE MODE GLOBAL BLOCKER
 * Always checks the database setting and blocks non-admin users when maintenance mode is enabled
 */
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Constants
const ADMIN_USERNAME = 'admin'; // Username of the admin that should have access
const FORCE_MAINTENANCE_MODE = true; // Always enable the maintenance check (will still check DB setting)

// Initialize Express middleware
export default async function maintenanceBlocker(req: Request, res: Response, next: NextFunction) {
  // Skip for static assets
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Special case - always allow checking maintenance mode status
  if (req.path === '/api/settings/key/maintenanceMode') {
    return next();
  }

  try {
    // Get the current maintenance mode setting from database
    const maintenanceSetting = await storage.getSetting('maintenanceMode');
    const maintenanceModeEnabled = maintenanceSetting?.value === 'true';
    
    // If maintenance mode is not enabled, allow all requests
    if (!maintenanceModeEnabled) {
      return next();
    }

    console.log(`⚠️ MAINTENANCE MODE IS ENABLED - Checking access for: ${req.path}`);
    
    // Handle login attempts - only allow admin to log in
    if (req.path === '/api/login' && req.method === 'POST') {
      if (req.body.username !== ADMIN_USERNAME) {
        console.log(`⛔ MAINTENANCE: Blocked login for non-admin user '${req.body.username || 'unknown'}'`);
        return res.status(503).json({
          error: true,
          maintenance: true,
          message: "System is in maintenance mode. Only administrators can log in."
        });
      } else {
        console.log(`✅ MAINTENANCE: Allowed admin login attempt`);
        return next();
      }
    }
    
    // For all other API calls, special handling for admin
    else {
      // Check if this is the admin user by checking username
      const isAdmin = req.isAuthenticated && req.isAuthenticated() && req.user && 
                    ((req.user as any).username === ADMIN_USERNAME);
      
      // If admin is logged in, allow ALL requests from admin
      if (isAdmin) {
        console.log(`✅ MAINTENANCE: Allowed admin access to ${req.path}`);
        return next();
      }
      
      // Allow logout for everyone
      if (req.path === '/api/logout') {
        console.log(`✅ MAINTENANCE: Allowed logout request`);
        return next();
      }
      
      // Block all non-admin requests
      console.log(`⛔ MAINTENANCE: Blocked access to ${req.path} for non-admin user`);
      return res.status(503).json({
        error: true,
        maintenance: true,
        message: "System is in maintenance mode. Only administrators can access."
      });
    }
  } catch (error) {
    console.error('Error checking maintenance mode setting:', error);
    // In case of error checking maintenance mode, allow the request (fail open)
    return next();
  }
}
