import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, Role } from "@shared/schema";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { isMaintenanceModeEnabled, refreshMaintenanceMode } from "./maintenance-check";

// Constants
const ADMIN_USERNAME = 'admin';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_this";
const JWT_EXPIRES_IN = "7d";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Maintenance mode function already imported from maintenance-flag.ts
  console.log(`Only user '${ADMIN_USERNAME}' can login when maintenance mode is enabled`);
  
  // Check maintenance mode status on startup
  isMaintenanceModeEnabled().then(enabled => {
    console.log(`Maintenance mode is currently ${enabled ? 'ENABLED' : 'DISABLED'}`);
  });
  
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // MAINTENANCE MODE: Check database for dynamic maintenance mode status
        if (username !== ADMIN_USERNAME) {
          // Check maintenance mode dynamically
          const maintenanceModeEnabled = await isMaintenanceModeEnabled();
          
          if (maintenanceModeEnabled) {
            console.log(`MAINTENANCE MODE: Blocked login attempt for user '${username}'`);
            return done(null, false, { 
              message: "System is in maintenance mode. Only administrators can log in at this time." 
            });
          }
        }
        
        // NORMAL AUTHENTICATION FLOW CONTINUES FOR ADMIN OR WHEN MAINTENANCE MODE IS OFF
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if user is inactive
        if (user.status === 'inactive') {
          return done(null, false, { message: "Your account has been deactivated. Please contact an administrator." });
        }
        
        // Special case for admin user during development
        if (username === ADMIN_USERNAME && password === "admin") {
          console.log(`Admin login successful`);
          return done(null, user);
        }
        
        // For other users, check properly hashed passwords
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // DOUBLE-CHECK MAINTENANCE MODE
        // Extra safety check in case the first check was bypassed somehow
        if (username !== ADMIN_USERNAME) {
          // Check maintenance mode dynamically again
          const maintenanceModeEnabled = await isMaintenanceModeEnabled();
          
          if (maintenanceModeEnabled) {
            console.log(`MAINTENANCE MODE: Blocked login at secondary check for user '${username}'`);
            return done(null, false, { 
              message: "System is in maintenance mode. Only administrators can log in at this time." 
            });
          }
        }
        
        console.log(`User '${username}' login successful`);
        return done(null, user);
      } catch (error) {
        console.error('Error in authentication strategy:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    // Disable registration - only return 403 Forbidden
    return res.status(403).json({ message: "Registration is disabled. Please contact an administrator." });
    
    /* Original registration code kept as comment for reference
    try {
      const { username, password, ...userData } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        ...userData,
      });
      
      // Login automatically
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName });
      });
    } catch (error) {
      next(error);
    }
    */
  });

  app.post("/api/login", async (req, res, next) => {
    // Check dynamic maintenance mode BEFORE authentication
    if (req.body.username !== ADMIN_USERNAME) {
      // Get current maintenance mode setting
      const maintenanceModeEnabled = await isMaintenanceModeEnabled();
      
      if (maintenanceModeEnabled) {
        console.log(`Maintenance mode active: Blocked login for non-admin user ${req.body.username}`);
        return res.status(503).json({
          error: true,
          maintenance: true,
          message: "System is in maintenance mode. Only administrators can log in at this time."
        });
      }
    }
    
    // Continue with normal authentication for admin or if maintenance mode is off
    passport.authenticate("local", async (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(400).json({ message: info?.message || "Invalid credentials" });

      req.login(user, async (err: any) => {
        if (err) return next(err);

        // Update last login time
        await storage.updateUser(user.id, {
          lastLogin: new Date()
        });

        // Log login activity for reports and statistics
        try {
          const activity = {
            id: `login_${user.id}_${Date.now()}`, // Add a unique ID
            type: 'user_login',
            message: `User ${user.username} logged in`,
            content: `User ${user.username} logged in`,
            createdAt: new Date(),
            userId: String(user.id), // Ensure userId is a string as required by the Activity interface
            userName: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.username,
            username: user.username,
            details: {
              userId: user.id,
              username: user.username,
              method: 'password'
            }
          };
          
          console.log(`Creating login activity for user ${user.username}`);
          await storage.saveActivity(activity);
        } catch (activityError) {
          console.error('Error logging login activity:', activityError);
          // Continue with login even if activity logging fails
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            username: user.username,
            status: user.status,  // Include status in the token
            profileImage: user.profileImage // Include profile image in the token
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
          token,
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage // Include the profile image URL
          }
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user roles and permissions
      const roles = await storage.getUserRoles(req.user.id);
      const permissions = await storage.getUserPermissions(req.user.id);
      
      // Check if the user is an administrator
      const isAdmin = roles.some(role => role.name === 'Administrator');
      
      // Include all information in the response
      res.json({ 
        id: req.user?.id, 
        username: req.user?.username, 
        firstName: req.user?.firstName, 
        lastName: req.user?.lastName,
        profileImage: req.user?.profileImage, // Include the profile image URL
        roles: roles,
        permissions: permissions,
        isAdmin: isAdmin
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Failed to fetch complete user data' });
    }
  });
  
  app.get("/api/user/roles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const roles = await storage.getUserRoles(req.user.id);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Could not fetch user roles" });
    }
  });
  
  app.get("/api/user/permissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const permissions = await storage.getUserPermissions(req.user.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Could not fetch user permissions" });
    }
  });
}

// JWT authentication middleware
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.sendStatus(403);
      }
      
      try {
        // Get fresh user data to check current status
        const user = await storage.getUser(decoded.userId);
        
        // If user doesn't exist or is inactive, deny access
        if (!user || user.status === 'inactive') {
          return res.status(403).json({ 
            message: "Your account has been deactivated. Please contact an administrator." 
          });
        }
        
        req.user = user;
        next();
      } catch (error) {
        console.error('Error in JWT authentication:', error);
        return res.status(500).json({ message: "Authentication error" });
      }
    });
  } else {
    res.sendStatus(401);
  }
}
