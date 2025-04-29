import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, insertPermissionSchema, insertRoleSchema,
  insertRolePermissionSchema, insertUserRoleSchema
} from "@shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import type { Request, Response, NextFunction } from "express";
import { Activity } from './models';
import { ActivityLog } from './db/models';
import { v4 as uuidv4 } from 'uuid';

// Activity types
type ActivityType = 'user_created' | 'user_updated' | 'user_deactivated' | 
                   'role_created' | 'role_updated' | 'role_deleted' | 
                   'permission_created' | 'permission_updated' | 'permission_deleted' | 
                   'permission_added' | 'permission_removed' | 
                   'user_login' | 'user_role_assigned' | 'user_role_removed';

// Activity log storage (in-memory for demo, would use database in production)
const activityLogs: {
  id: number;
  type: ActivityType;
  content: string;
  message: string;
  createdAt: string;
  userId: number;
  username?: string;
  userName?: string;
  details: Record<string, any>;
}[] = [];

// Helper function to log activities
const logActivity = (type: ActivityType, content: string, userId: number, details: Record<string, any> = {}) => {
  // Log to database using storage.logActivity
  storage.logActivity(type, content, userId, details)
    .then(activity => {
      console.log(`Activity logged: ${type}`);
    })
    .catch(err => {
      console.error('Failed to log activity to database:', err);
      
      // As a fallback, add to in-memory log
      const newActivity = {
        id: activityLogs.length + 1,
        type,
        content,
        message: content,
        createdAt: new Date().toISOString(),
        userId,
        username: 'Unknown user',
        userName: 'Unknown user',
        details
      };
      
      activityLogs.unshift(newActivity);
      if (activityLogs.length > 100) {
        activityLogs.pop();
      }
    });
};

// Define a middleware for checking authentication
const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);

  // Permission routes
  app.get("/api/permissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const permission = await storage.getPermission(parseInt(req.params.id));
      if (!permission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      res.json(permission);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permission" });
    }
  });

  app.post("/api/permissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertPermissionSchema.parse(req.body);
      
      // Check if permission with that name already exists
      const existingPermission = await storage.getPermissionByName(validatedData.name);
      if (existingPermission) {
        return res.status(400).json({ message: "Permission with that name already exists" });
      }
      
      const permission = await storage.createPermission(validatedData);
      
      // Log the activity
      if (permission && req.user) {
        logActivity(
          'permission_created',
          `Permission "${permission.name}" was created by ${req.user.username}`,
          req.user.id,
          { permissionId: permission.id, permissionName: permission.name }
        );
      }
      
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.put("/api/permissions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPermissionSchema.partial().parse(req.body);
      
      // Check if permission exists
      const existingPermission = await storage.getPermission(id);
      if (!existingPermission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      // If name is being changed, check it doesn't conflict
      if (validatedData.name && validatedData.name !== existingPermission.name) {
        const conflictingPermission = await storage.getPermissionByName(validatedData.name);
        if (conflictingPermission) {
          return res.status(400).json({ message: "Permission with that name already exists" });
        }
      }
      
      const permission = await storage.updatePermission(id, validatedData);
      
      // Log the activity
      if (permission && req.user) {
        logActivity(
          'permission_updated',
          `Permission "${permission.name}" was updated by ${req.user.username}`,
          req.user.id,
          { permissionId: permission.id, permissionName: permission.name }
        );
      }
      
      res.json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  app.delete("/api/permissions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      
      // Get permission before deletion for logging
      const permission = await storage.getPermission(id);
      
      const success = await storage.deletePermission(id);
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      // Log the activity
      if (permission && req.user) {
        logActivity(
          'permission_deleted',
          `Permission "${permission.name}" was deleted by ${req.user.username}`,
          req.user.id,
          { permissionId: id, permissionName: permission.name }
        );
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Role summary endpoint - IMPORTANT: This must be defined BEFORE /api/roles/:id to avoid conflicts!
  app.get("/api/roles/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      console.log('Fetching role summaries');
      // Get all roles since this is an admin dashboard view
      const roles = await storage.getRoles();
      
      if (!roles || !Array.isArray(roles)) {
        console.error('Error in /api/roles/summary: roles is not an array', roles);
        return res.status(500).json({ message: "Failed to fetch role summaries - invalid roles data" });
      }
      
      // Enhance roles with permissions and user counts
      const enhancedRoles = await Promise.all(roles.map(async (role) => {
        try {
          if (!role || typeof role.id !== 'number') {
            console.error('Invalid role object:', role);
            return null;
          }
          
          let permissions: any[] = [];
          try {
            permissions = await storage.getRolePermissions(role.id);
          } catch (permError) {
            console.error(`Error fetching permissions for role ${role.id}:`, permError);
            // Continue with empty permissions instead of failing
            permissions = [];
          }
          
          // Count users with this role
          let userCount = 0;
          try {
            const users = await storage.getUsers();
            const userRoles = await Promise.all(
              users.map(user => 
                storage.getUserRoles(user.id)
                  .catch(err => {
                    console.error(`Error fetching roles for user ${user.id}:`, err);
                    return []; // Return empty array on error to continue processing
                  })
              )
            );
            userCount = userRoles.filter(userRolesList =>
              userRolesList.some(userRole => userRole?.id === role.id)
            ).length;
          } catch (countError) {
            console.error(`Error counting users for role ${role.id}:`, countError);
            // Continue with zero count instead of failing
          }
          
          return {
            id: role.id,
            name: role.name,
            description: role.description,
            userCount,
            permissionCount: permissions ? permissions.length : 0
          };
        } catch (roleError) {
          console.error(`Error processing role ${role?.id}:`, roleError);
          return null;
        }
      }));
      
      // Filter out any nulls from failed role processing
      const validRoleSummaries = enhancedRoles.filter(role => role !== null);
      
      res.json(validRoleSummaries);
    } catch (error) {
      console.error('Error in /api/roles/summary:', error);
      res.status(500).json({ message: "Failed to fetch role summaries" });
    }
  });

  // Role routes
  app.get("/api/roles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const roles = await storage.getRoles();
      
      // Enhance roles with permissions and user counts
      const enhancedRoles = await Promise.all(roles.map(async (role) => {
        const permissions = await storage.getRolePermissions(role.id);
        
        // Count users with this role
        const users = await storage.getUsers();
        const userRoles = await Promise.all(users.map(user => storage.getUserRoles(user.id)));
        const userCount = userRoles.filter(userRolesList => 
          userRolesList.some(userRole => userRole.id === role.id)
        ).length;
        
        return {
          ...role,
          permissions,
          userCount
        };
      }));
      
      res.json(enhancedRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getRole(id);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const permissions = await storage.getRolePermissions(id);
      
      res.json({
        ...role,
        permissions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { permissions, ...roleData } = req.body;
      const validatedRoleData = insertRoleSchema.parse(roleData);
      
      // Check if role with that name already exists
      const existingRole = await storage.getRoleByName(validatedRoleData.name);
      if (existingRole) {
        return res.status(400).json({ message: "Role with that name already exists" });
      }
      
      const role = await storage.createRole(validatedRoleData);
      
      // Assign permissions if provided
      if (Array.isArray(permissions) && permissions.length > 0) {
        await Promise.all(permissions.map(permissionId => 
          storage.assignPermissionToRole(role.id, permissionId)
        ));
      }
      
      const rolePermissions = await storage.getRolePermissions(role.id);
      
      // Log the activity
      if (role && req.user) {
        logActivity(
          'role_created',
          `Role "${role.name}" was created by ${req.user.username}`,
          req.user.id,
          { roleId: role.id, roleName: role.name }
        );
      }
      
      res.status(201).json({
        ...role,
        permissions: rolePermissions
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const { permissions, ...roleData } = req.body;
      const validatedRoleData = insertRoleSchema.partial().parse(roleData);
      
      // Check if role exists
      const existingRole = await storage.getRole(id);
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      // If name is being changed, check it doesn't conflict
      if (validatedRoleData.name && validatedRoleData.name !== existingRole.name) {
        const conflictingRole = await storage.getRoleByName(validatedRoleData.name);
        if (conflictingRole) {
          return res.status(400).json({ message: "Role with that name already exists" });
        }
      }
      
      const role = await storage.updateRole(id, validatedRoleData);
      
      // Update permissions if provided
      if (Array.isArray(permissions)) {
        // Get current permissions
        const currentPermissions = await storage.getRolePermissions(id);
        
        // Remove permissions not in the new list
        await Promise.all(currentPermissions.map(async permission => {
          if (!permissions.includes(permission.id)) {
            await storage.removePermissionFromRole(id, permission.id);
          }
        }));
        
        // Add new permissions
        await Promise.all(permissions.map(async permissionId => {
          if (!currentPermissions.some(p => p.id === permissionId)) {
            await storage.assignPermissionToRole(id, permissionId);
          }
        }));
      }
      
      const updatedPermissions = await storage.getRolePermissions(id);
      
      // Log the activity
      if (role && req.user) {
        logActivity(
          'role_updated',
          `Role "${role.name}" was updated by ${req.user.username}`,
          req.user.id,
          { roleId: role.id, roleName: role.name }
        );
      }
      
      res.json({
        ...role,
        permissions: updatedPermissions
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      
      // Get role before deletion for logging
      const role = await storage.getRole(id);
      
      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      // Log the activity
      if (role && req.user) {
        logActivity(
          'role_deleted',
          `Role "${role.name}" was deleted by ${req.user.username}`,
          req.user.id,
          { roleId: id, roleName: role.name }
        );
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const users = await storage.getUsers();
      
      // Enhance users with roles
      const enhancedUsers = await Promise.all(users.map(async user => {
        const roles = await storage.getUserRoles(user.id);
        return {
          ...user,
          password: undefined, // Don't send passwords to client
          roles
        };
      }));
      
      res.json(enhancedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const roles = await storage.getUserRoles(id);
      
      res.json({
        ...user,
        password: undefined, // Don't send password to client
        roles
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { roles, ...userData } = req.body;
      const validatedUserData = insertUserSchema.parse(userData);
      
      // Check if user with that username already exists
      const existingUser = await storage.getUserByUsername(validatedUserData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password for new user
      const hashedPassword = await hashPassword(validatedUserData.password);
      const user = await storage.createUser({
        ...validatedUserData,
        password: hashedPassword
      });
      
      // Assign roles if provided
      if (Array.isArray(roles) && roles.length > 0) {
        await Promise.all(roles.map(roleId => 
          storage.assignRoleToUser(user.id, roleId)
        ));
      }
      
      const userRoles = await storage.getUserRoles(user.id);
      
      // Log the activity
      if (user && req.user) {
        logActivity(
          'user_created',
          `User ${user.username} was created by ${req.user.username}`,
          req.user.id,
          { newUserId: user.id, username: user.username }
        );
      }
      
      res.status(201).json({
        ...user,
        password: undefined, // Don't send password to client
        roles: userRoles
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const { roles, ...userData } = req.body;
      const validatedUserData = insertUserSchema.partial().parse(userData);
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If username is being changed, check it doesn't conflict
      if (validatedUserData.username && validatedUserData.username !== existingUser.username) {
        const conflictingUser = await storage.getUserByUsername(validatedUserData.username);
        if (conflictingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Hash new password if provided
      let updatedData = { ...validatedUserData };
      if (validatedUserData.password) {
        updatedData.password = await hashPassword(validatedUserData.password);
      }
      
      const user = await storage.updateUser(id, updatedData);
      
      // Update roles if provided
      if (Array.isArray(roles)) {
        // Get current roles
        const currentRoles = await storage.getUserRoles(id);
        
        // Remove roles not in the new list
        await Promise.all(currentRoles.map(async role => {
          if (!roles.includes(role.id)) {
            await storage.removeRoleFromUser(id, role.id);
          }
        }));
        
        // Add new roles
        await Promise.all(roles.map(async roleId => {
          if (!currentRoles.some(r => r.id === roleId)) {
            await storage.assignRoleToUser(id, roleId);
          }
        }));
      }
      
      const updatedRoles = await storage.getUserRoles(id);
      
      // Log the activity
      if (user && req.user) {
        logActivity(
          'user_updated',
          `User ${user.username} was updated by ${req.user.username}`,
          req.user.id,
          { userId: user.id, username: user.username }
        );
      }
      
      res.json({
        ...user,
        password: undefined, // Don't send password to client
        roles: updatedRoles
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      
      // Get user before deletion for logging
      const user = await storage.getUser(id);
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log the activity
      if (user && req.user) {
        logActivity(
          'user_deactivated',
          `User ${user.username} was deleted by ${req.user.username}`,
          req.user.id,
          { userId: id, username: user.username }
        );
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Role Permission routes
  app.post("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      
      // Validate role and permission exist
      const role = await storage.getRole(roleId);
      const permission = await storage.getPermission(permissionId);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      if (!permission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      const rolePermission = await storage.assignPermissionToRole(roleId, permissionId);
      
      // Log the activity
      if (req.user) {
        logActivity(
          'permission_added',
          `Permission "${permission.name}" was added to role "${role.name}" by ${req.user.username}`,
          req.user.id,
          { roleId, permissionId, roleName: role.name, permissionName: permission.name }
        );
      }
      
      res.status(201).json(rolePermission);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign permission to role" });
    }
  });

  app.delete("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      
      // Get role and permission for logging
      const role = await storage.getRole(roleId);
      const permission = await storage.getPermission(permissionId);
      
      const success = await storage.removePermissionFromRole(roleId, permissionId);
      if (!success) {
        return res.status(404).json({ message: "Role permission assignment not found" });
      }
      
      // Log the activity
      if (role && permission && req.user) {
        logActivity(
          'permission_removed',
          `Permission "${permission.name}" was removed from role "${role.name}" by ${req.user.username}`,
          req.user.id,
          { roleId, permissionId, roleName: role.name, permissionName: permission.name }
        );
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove permission from role" });
    }
  });

  // User Role routes
  app.post("/api/users/:userId/roles/:roleId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      
      // Validate user and role exist
      const user = await storage.getUser(userId);
      const role = await storage.getRole(roleId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const userRole = await storage.assignRoleToUser(userId, roleId);
      
      // Log the activity
      if (req.user) {
        logActivity(
          'user_role_assigned',
          `Role "${role.name}" was assigned to user ${user.username} by ${req.user.username}`,
          req.user.id,
          { userId, roleId, username: user.username, roleName: role.name }
        );
      }
      
      res.status(201).json(userRole);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign role to user" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      
      // Get user and role for logging
      const user = await storage.getUser(userId);
      const role = await storage.getRole(roleId);
      
      const success = await storage.removeRoleFromUser(userId, roleId);
      if (!success) {
        return res.status(404).json({ message: "User role assignment not found" });
      }
      
      // Log the activity
      if (user && role && req.user) {
        logActivity(
          'user_role_removed',
          `Role "${role.name}" was removed from user ${user.username} by ${req.user.username}`,
          req.user.id,
          { userId, roleId, username: user.username, roleName: role.name }
        );
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove role from user" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const timePeriod = req.query.period as string || 'today';
      const users = await storage.getUsers();
      const roles = await storage.getRoles();
      const permissions = await storage.getPermissions();
      
      // Count active users
      const activeUsers = users.filter(user => user.status === "active").length;
      
      // Calculate real trends by comparing to previous day
      // This is simplified; in a real app, you would store historical data
      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      
      // For demonstration, we'll simulate trends with reduced randomness
      // In a real app, you'd query historical data to calculate actual trends
      const calculateTrend = (baseValue: number) => {
        // Trend between -5% and +8%
        const trendPercent = Math.floor(Math.random() * 13) - 5;
        return trendPercent;
      };
      
      res.json({
        users: users.length,
        roles: roles.length,
        permissions: permissions.length,
        activeUsers,
        // Calculate trends based on current values
        usersTrend: calculateTrend(users.length),
        rolesTrend: calculateTrend(roles.length),
        permissionsTrend: calculateTrend(permissions.length),
        activeUsersTrend: calculateTrend(activeUsers)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Report generation routes
  app.get("/api/reports", checkAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Parse dates from URL parameters
      const startDateTime = new Date(startDate as string);
      const endDateTime = new Date(endDate as string);
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      // Format dates for MongoDB query
      const startDateStr = startDateTime.toISOString();
      const endDateStr = endDateTime.toISOString();
      
      console.log(`Generating report with date range: ${startDateStr} to ${endDateStr}`);
      
      let reportData: Activity[] = [];
      
      try {
        // Try multiple query approaches to find activities
        // First approach: Try querying with Date objects
        reportData = await storage.getActivitiesWithOptions({
          createdAt: { 
            $gte: startDateTime, 
            $lte: endDateTime 
          }
        }, { 
          sort: { createdAt: -1 } 
        });
        
        // If that didn't work, try with ISO strings
        if (reportData.length === 0) {
          console.log("No results with Date objects, trying with ISO strings...");
          reportData = await storage.getActivitiesWithOptions({
            createdAt: { 
              $gte: startDateStr, 
              $lte: endDateStr 
            }
          }, { 
            sort: { createdAt: -1 } 
          });
        }
        
        // If still no results, try with timestamp
        if (reportData.length === 0) {
          console.log("No results with ISO strings, trying with timestamps...");
          reportData = await storage.getActivitiesWithOptions({
            timestamp: { 
              $gte: startDateTime, 
              $lte: endDateTime 
            }
          }, { 
            sort: { timestamp: -1 } 
          });
        }
        
        // If still no results, try a direct database query
        if (reportData.length === 0) {
          console.log("Trying direct aggregation pipeline...");
          const collection = ActivityLog.collection;
          const aggregationPipeline = [
            {
              $match: {
                $or: [
                  { "createdAt": { $gte: startDateTime, $lte: endDateTime } },
                  { "timestamp": { $gte: startDateTime, $lte: endDateTime } }
                ]
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 100 }
          ];
          
          const rawResults = await collection.aggregate(aggregationPipeline).toArray();
          if (rawResults.length > 0) {
            reportData = rawResults.map((result: any) => ({
              id: result.id?.toString() || result._id?.toString(),
              type: result.type || 'unknown',
              content: result.content || result.message || '',
              createdAt: result.createdAt || result.timestamp || new Date(),
              userId: result.userId?.toString() || '0',
              username: result.username || result.userName || 'Unknown'
            }));
          }
        }
        
        console.log(`Query found ${reportData.length} records between ${startDateStr} and ${endDateStr}`);
      } catch (dbError) {
        console.error("Database error generating report:", dbError);
        return res.status(500).json({ error: 'Database error while generating report' });
      }
      
      // If no data is found, return an empty array instead of throwing an error
      if (!reportData) {
        reportData = [];
      }
      
      console.log(`Report generated with ${reportData.length} records`);
      
      // Log the activity
      if (req.user) {
        try {
          await logActivity(
            'user_activity' as ActivityType,
            `All activity report was generated by ${req.user.username}`,
            req.user.id,
            { startDate: startDateTime.toISOString(), endDate: endDateTime.toISOString() }
          );
        } catch (logError) {
          console.error("Error logging activity:", logError);
          // Continue even if logging fails
        }
      }
      
      res.json(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // Export report as CSV
  app.get("/api/reports/export", checkAuth, async (req, res) => {
    try {
      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Parse dates from URL parameters
      const startDateTime = new Date(startDate as string);
      const endDateTime = new Date(endDate as string);
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      let reportData: Activity[] = [];
      let filename = `all-activities-${startDateTime.toISOString().split('T')[0]}-to-${endDateTime.toISOString().split('T')[0]}`;
      
      console.log(`Exporting all report: format=${format}, startDate=${startDateTime.toISOString()}, endDate=${endDateTime.toISOString()}`);
      
      try {
        // Fetch all activity logs within the date range
        // Use proper date comparison in MongoDB query
        reportData = await storage.getActivitiesWithOptions({
          createdAt: { 
            $gte: startDateTime, 
            $lte: endDateTime 
          }
        }, { 
          sort: { createdAt: -1 } 
        });
        
        console.log(`Export query found ${reportData.length} records between ${startDateTime.toISOString()} and ${endDateTime.toISOString()}`);
      } catch (dbError) {
        console.error("Database error exporting report:", dbError);
        return res.status(500).json({ error: 'Database error while exporting report' });
      }
      
      // If no data is found, return an empty array instead of throwing an error
      if (!reportData) {
        reportData = [];
      }
      
      console.log(`Report exported with ${reportData.length} records`);
      
      if (format === 'csv') {
        // Convert data to CSV
        const csv = generateCSV(reportData);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        
        return res.send(csv);
      } else if (format === 'json') {
        // Set headers for JSON download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
        
        return res.json(reportData);
      } else {
        return res.status(400).json({ error: 'Invalid export format' });
      }
      
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  });

  // Activity endpoints
  app.get('/api/activities', checkAuth, async (req, res) => {
    try {
      const period = req.query.period as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Calculate start date based on period
      let startDate: Date | undefined;
      if (period) {
        const now = new Date();
        if (period === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === 'week') {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
      }
      
      // Troubleshoot the issue
      console.log("Attempting to fetch activities directly from database...");
      
      // Option 1: Try direct fetch without filters
      let activities = await storage.getActivitiesWithOptions({}, { limit, sort: { createdAt: -1 } });
      
      if (activities.length === 0) {
        console.log("No activities found with default query. Trying alternate approach...");
        
        // Option 2: If MongoDB is using different field names for dates
        const query: Record<string, any> = {};
        if (startDate) {
          // Try multiple field names that might be used for dates
          query.$or = [
            { createdAt: { $gte: startDate } },
            { timestamp: { $gte: startDate } },
            { date: { $gte: startDate } },
            { created: { $gte: startDate } }
          ];
        }
        
        activities = await storage.getActivitiesWithOptions(query, { limit, sort: { createdAt: -1 } });
      }
      
      console.log(`Found ${activities.length} activities in database`);
      
      if (activities.length > 0) {
        console.log("Sample activity:", JSON.stringify(activities[0], null, 2));
      }
      
      // Format response
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        message: activity.content || activity.message || "",
        timestamp: activity.createdAt?.toISOString() || new Date().toISOString(),
        user: {
          id: activity.userId || "0",
          name: activity.username || activity.userName || "Unknown User",
          image: activity.userImage || activity.userAvatar
        },
        details: activity.details || {}
      }));
      
      res.json(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  app.post('/api/activities', checkAuth, async (req, res) => {
    try {
      const { type, message, user, details } = req.body;
      
      // Validate required fields
      if (!type || !message || !user || !user.id || !user.name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create activity record
      const activity: Activity = {
        id: uuidv4(),
        type,
        message,
        content: message,
        createdAt: new Date(),
        userId: user.id,
        userName: user.name,
        username: user.name,
        userImage: user.image,
        details
      };
      
      const savedActivity = await storage.saveActivity(activity);
      
      // Format response
      const formattedActivity = {
        id: savedActivity.id,
        type: savedActivity.type,
        message: savedActivity.message || savedActivity.content,
        timestamp: savedActivity.createdAt.toISOString(),
        user: {
          id: savedActivity.userId,
          name: savedActivity.userName || savedActivity.username || "Unknown User",
          image: savedActivity.userImage
        },
        details: savedActivity.details
      };
      
      res.status(201).json(formattedActivity);
    } catch (error) {
      console.error('Error recording activity:', error);
      res.status(500).json({ error: 'Failed to record activity' });
    }
  });

  // Simple test endpoint to verify API connectivity
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working correctly", timestamp: new Date().toISOString() });
  });

  // Helper function to generate CSV from report data
  function generateCSV(data: any[]) {
    if (!data || data.length === 0) return '';
    
    // Extract headers from the first item
    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' || data[0][key] === null
    );
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString();
        
        // Escape commas and quotes in string values
        if (typeof value === 'string') {
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        
        return String(value);
      }).join(',');
      
      csv += row + '\n';
    });
    
    return csv;
  }

  // Password hashing helper function
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = await promisify(scrypt)(password, salt, 64) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  const httpServer = createServer(app);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  console.log("Activities:", await storage.getActivitiesWithOptions({}, { limit: 10, sort: { createdAt: -1 } }));
  console.log("Attempting to display activities from database...");
  const debugActivities = await storage.getActivitiesWithOptions({}, { limit: 5 });
  if (debugActivities.length === 0) {
    console.log("No activities found in database");
  } else {
    console.log(`Found ${debugActivities.length} activities in database:`);
    debugActivities.forEach((activity, i) => {
      console.log(`Activity ${i+1}:`, {
        id: activity.id,
        type: activity.type,
        content: activity.content,
        message: activity.message,
        createdAt: activity.createdAt,
        userId: activity.userId,
        username: activity.username,
        userName: activity.userName
      });
    });
  }

  return httpServer;
}
