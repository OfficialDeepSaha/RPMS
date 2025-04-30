/**
 * MAINTENANCE MODE GLOBAL BLOCKER
 * This is a direct patch to force-enable maintenance mode
 * and block all non-admin users without relying on settings DB
 */

// Set to true to activate maintenance mode globally
const FORCE_MAINTENANCE_MODE = true; // <-- MAKE SURE THIS IS SET TO TRUE

// Initialize Express middleware
module.exports = function(req, res, next) {
  // Skip for static assets
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Handle login attempts
  if (req.path === '/api/login' && req.method === 'POST') {
    if (FORCE_MAINTENANCE_MODE && req.body.username !== 'admin') {
      console.log(`⚠️ MAINTENANCE: Blocked login for ${req.body.username || 'unknown user'}`);
      return res.status(503).json({
        error: true,
        maintenance: true,
        message: "System is in maintenance mode. Only administrators can log in."
      });
    }
  }

  // For all other API calls, block if not admin
  else if (FORCE_MAINTENANCE_MODE && req.path !== '/api/login') {
    const isAdmin = req.user && req.user.username === 'admin';
    
    if (!isAdmin) {
      console.log(`⚠️ MAINTENANCE: Blocked API access to ${req.path}`);
      return res.status(503).json({
        error: true,
        maintenance: true,
        message: "System is in maintenance mode. Only administrators can access."
      });
    }
  }

  // Allow request to continue
  next();
};
