import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, insertPermissionSchema, insertRoleSchema,
  insertRolePermissionSchema, insertUserRoleSchema
} from "@shared/schema";

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
      const success = await storage.deletePermission(id);
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
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
      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ message: "Role not found" });
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
      
      res.status(201).json({
        ...user,
        password: undefined, // Don't send password to client
        roles: userRoles
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
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
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
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
      
      const success = await storage.removePermissionFromRole(roleId, permissionId);
      if (!success) {
        return res.status(404).json({ message: "Role permission assignment not found" });
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
      
      const success = await storage.removeRoleFromUser(userId, roleId);
      if (!success) {
        return res.status(404).json({ message: "User role assignment not found" });
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
      const users = await storage.getUsers();
      const roles = await storage.getRoles();
      const permissions = await storage.getPermissions();
      
      // Count active users
      const activeUsers = users.filter(user => user.status === "active").length;
      
      res.json({
        users: users.length,
        roles: roles.length,
        permissions: permissions.length,
        activeUsers
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Password hashing helper function
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = await promisify(scrypt)(password, salt, 64) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  const httpServer = createServer(app);

  return httpServer;
}
