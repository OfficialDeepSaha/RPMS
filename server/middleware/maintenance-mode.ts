import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { isMaintenanceModeEnabled, isAdministratorUser, isAdministratorByRole, ADMIN_USERNAME, ADMIN_ROLE_NAME } from "../maintenance-check";

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
 * - All other users are redirected to the maintenance page
 */
export const maintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  // Always allow public assets, health checks, login and auth routes
  const ALLOWED_PATHS = [
    '/assets/',
    '/health', 
    '/api/health',
    '/api/settings/key/maintenanceMode',
    '/api/login',
    '/api/logout',
    '/auth',
    '/maintenance',
    '/favicon.ico',
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.svg',
    '.woff',
    '.woff2'
  ];
  
  // Skip maintenance check for allowed paths
  if (ALLOWED_PATHS.some(path => 
    req.path.startsWith(path) || 
    req.path.endsWith(path) || 
    req.path.includes(path)
  )) {
    return next();
  }

  try {
    // Check if maintenance mode is enabled
    const maintenanceModeEnabled = await isMaintenanceModeEnabled();
    
    if (!maintenanceModeEnabled) {
      // If maintenance mode is not enabled, proceed normally
      return next();
    }
    
    // If user is not authenticated, allow access to client-side routes to show the login page
    if (!req.isAuthenticated()) {
      // For API routes, block with a message
      if (req.path.startsWith('/api/')) {
        return res.status(503).json({
          error: true,
          maintenance: true,
          message: "System is in maintenance mode. Only administrators can access at this time."
        });
      }
      // For client routes, allow access so React can handle showing maintenance info
      return next();
    }
    
    // For authenticated users, check if they're admin
    if (req.user) {
      const user = req.user;
      
      // Check by username first (fastest check)
      const isAdminUsername = isAdministratorUser(user.username);
      
      // Then check by role (more thorough)
      const isAdminRole = await isAdministratorByRole(user.id);
      
      // Grant access if EITHER check passes
      if (isAdminUsername || isAdminRole) {
        logRequestInfo(req, `Admin access granted to: ${user.username} (Username: ${isAdminUsername}, Role: ${isAdminRole})`);
        return next();
      }
      
      // Non-admin user trying to access during maintenance
      logRequestInfo(req, `Access DENIED: Non-admin user ${user.username} during maintenance (Username: ${isAdminUsername}, Role: ${isAdminRole})`);
      
      // For API routes, return 503
      if (req.path.startsWith('/api/')) {
        return res.status(503).json({
          error: true,
          maintenance: true,
          message: "System is in maintenance mode. Only administrators can access at this time."
        });
      }
      
      // For client routes, redirect to maintenance page
      return res.redirect('/maintenance');
    }
    
    // Allow client-side routing to handle the request
    return next();
  } catch (error) {
    console.error('Error in maintenance mode middleware:', error);
    // Proceed if we can't check maintenance mode to avoid blocking everything on error
    return next();
  }
};
