import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

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

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if user is inactive
        if (user.status === 'inactive') {
          return done(null, false, { message: "Your account has been deactivated. Please contact an administrator." });
        }
        
        // For demo purposes, we'll allow the admin user to login with plain password
        if (username === "admin" && password === "admin") {
          return done(null, user);
        }
        
        // For other users, we'll check properly hashed passwords
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
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

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }

      req.login(user, async (err: any) => {
        if (err) return next(err);

        // Update last login time
        await storage.updateUser(user.id, {
          lastLogin: new Date()
        });

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            username: user.username,
            status: user.status  // Include status in the token
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
            lastName: user.lastName
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ 
      id: req.user?.id, 
      username: req.user?.username, 
      firstName: req.user?.firstName, 
      lastName: req.user?.lastName 
    });
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
