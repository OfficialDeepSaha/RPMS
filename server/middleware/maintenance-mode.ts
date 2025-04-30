import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Debugging function to log detailed information about requests
 */
function logRequestInfo(req: Request, message: string) {
  console.log(`[MAINTENANCE-DEBUG] ${message}`);
  console.log(`  - URL: ${req.method} ${req.originalUrl}`);
  console.log(`  - Authenticated: ${req.isAuthenticated()}`);
  console.log(`  - User: ${req.user ? req.user.username : 'Not logged in'}`);
}

/**
 * Middleware to enforce maintenance mode
 * - When maintenance mode is enabled, only admin users can access the system
 * - All other users are blocked with a 503 response
 */
export const maintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  // Always allow certain paths (necessary for the admin and login functionality)
  const ALLOWED_PATHS = [
    '/api/settings/key/maintenanceMode',  // Always allow checking maintenance mode status
    '/api/login',                        // Login is handled by the login route which has its own checks
    '/api/logout'                        // Always allow logout
  ];
  
  if (ALLOWED_PATHS.includes(req.path)) {
    logRequestInfo(req, `Allowing access to whitelisted path: ${req.path}`);
    return next();
  }

  try {
    // Check if maintenance mode is enabled
    const maintenanceModeSetting = await storage.getSetting('maintenanceMode');
    const maintenanceModeEnabled = maintenanceModeSetting?.value === 'true';
    
    logRequestInfo(req, `Maintenance mode is ${maintenanceModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!maintenanceModeEnabled) {
      // If maintenance mode is not enabled, proceed normally
      return next();
    }
    
    // In maintenance mode, check if user is authenticated and is admin
    if (req.isAuthenticated()) {
      const user = req.user;
      logRequestInfo(req, `Checking admin status for user ${user.username}`);
      
      // First check by username (for immediate admin access)
      if (user.username === 'admin') {
        logRequestInfo(req, `Access granted to admin user by username`);
        return next();
      }
      
      // Second check by role (more thorough)
      const userRoles = await storage.getUserRoles(user.id);
      const isAdmin = userRoles.some(role => role.name === 'Administrator');
      
      if (isAdmin) {
        logRequestInfo(req, `Access granted to admin user by role`);
        return next();
      }
      
      logRequestInfo(req, `Access DENIED to non-admin user during maintenance`);
    } else {
      logRequestInfo(req, `Access DENIED to unauthenticated user during maintenance`);
    }
    
    // Block access for non-admin users during maintenance
    return res.status(503).json({
      error: true,
      maintenance: true,
      message: "System is in maintenance mode. Please try again later."
    });
  } catch (error) {
    console.error('Error in maintenance mode middleware:', error);
    // Proceed if we can't check maintenance mode to avoid blocking everything on error
    return next();
  }
};
