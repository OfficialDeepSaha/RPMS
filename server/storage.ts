import { 
  users, permissions, roles, rolePermissions, userRoles,
  type User, type InsertUser, 
  type Permission, type InsertPermission,
  type Role, type InsertRole,
  type RolePermission, type InsertRolePermission,
  type UserRole, type InsertUserRole
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Permission operations
  getPermission(id: number): Promise<Permission | undefined>;
  getPermissions(): Promise<Permission[]>;
  getPermissionByName(name: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;
  
  // Role operations
  getRole(id: number): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // Role-Permission operations
  assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
  getRolePermissions(roleId: number): Promise<Permission[]>;
  
  // User-Role operations
  assignRoleToUser(userId: number, roleId: number): Promise<UserRole>;
  removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;
  getUserRoles(userId: number): Promise<Role[]>;
  
  // Combined operations
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersStore: Map<number, User>;
  private permissionsStore: Map<number, Permission>;
  private rolesStore: Map<number, Role>;
  private rolePermissionsStore: Map<string, RolePermission>;
  private userRolesStore: Map<string, UserRole>;
  
  private userCurrentId: number;
  private permissionCurrentId: number;
  private roleCurrentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.usersStore = new Map();
    this.permissionsStore = new Map();
    this.rolesStore = new Map();
    this.rolePermissionsStore = new Map();
    this.userRolesStore = new Map();
    
    this.userCurrentId = 1;
    this.permissionCurrentId = 1;
    this.roleCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create default admin user, roles and permissions on initialization
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    // Create default permissions
    const viewDashboardPerm = await this.createPermission({ 
      name: "View Dashboard", 
      description: "Allows users to view the main dashboard",
      category: "Dashboard"
    });
    
    const manageUsersPerm = await this.createPermission({ 
      name: "Manage Users", 
      description: "Allows creating, editing and deletion of users",
      category: "User Management"
    });
    
    const manageRolesPerm = await this.createPermission({ 
      name: "Manage Roles", 
      description: "Allows creating, editing and deletion of roles",
      category: "User Management"
    });
    
    const managePermissionsPerm = await this.createPermission({ 
      name: "Manage Permissions", 
      description: "Allows creating, editing and deletion of permissions",
      category: "User Management"
    });
    
    const generateReportsPerm = await this.createPermission({ 
      name: "Generate Reports", 
      description: "Allows generating and downloading system reports",
      category: "Reports"
    });
    
    // Create default roles
    const adminRole = await this.createRole({
      name: "Administrator",
      description: "Full access to all system features and settings"
    });
    
    const managerRole = await this.createRole({
      name: "Manager",
      description: "Limited admin access with user and content management"
    });
    
    const editorRole = await this.createRole({
      name: "Editor",
      description: "Can create and edit content, but cannot manage users or system"
    });
    
    const viewerRole = await this.createRole({
      name: "Viewer",
      description: "Read-only access to system content and reports"
    });
    
    // Assign permissions to roles
    await this.assignPermissionToRole(adminRole.id, viewDashboardPerm.id);
    await this.assignPermissionToRole(adminRole.id, manageUsersPerm.id);
    await this.assignPermissionToRole(adminRole.id, manageRolesPerm.id);
    await this.assignPermissionToRole(adminRole.id, managePermissionsPerm.id);
    await this.assignPermissionToRole(adminRole.id, generateReportsPerm.id);
    
    await this.assignPermissionToRole(managerRole.id, viewDashboardPerm.id);
    await this.assignPermissionToRole(managerRole.id, manageUsersPerm.id);
    await this.assignPermissionToRole(managerRole.id, generateReportsPerm.id);
    
    await this.assignPermissionToRole(editorRole.id, viewDashboardPerm.id);
    
    await this.assignPermissionToRole(viewerRole.id, viewDashboardPerm.id);
    
    // Create default admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "admin", // In real app this would be hashed
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      status: "active"
    });
    
    // Assign admin role to admin user
    await this.assignRoleToUser(adminUser.id, adminRole.id);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.usersStore.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { ...insertUser, id, lastLogin: now };
    this.usersStore.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.usersStore.set(id, updatedUser);
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    if (!this.usersStore.has(id)) return false;
    
    // First remove all user roles
    const userRoles = Array.from(this.userRolesStore.values())
      .filter(ur => ur.userId === id);
    
    for (const userRole of userRoles) {
      await this.removeRoleFromUser(userRole.userId, userRole.roleId);
    }
    
    return this.usersStore.delete(id);
  }

  // Permission methods
  async getPermission(id: number): Promise<Permission | undefined> {
    return this.permissionsStore.get(id);
  }

  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissionsStore.values());
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    return Array.from(this.permissionsStore.values()).find(
      (permission) => permission.name === name,
    );
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const id = this.permissionCurrentId++;
    const permission: Permission = { ...insertPermission, id };
    this.permissionsStore.set(id, permission);
    return permission;
  }

  async updatePermission(id: number, permissionData: Partial<InsertPermission>): Promise<Permission | undefined> {
    const existingPermission = await this.getPermission(id);
    if (!existingPermission) return undefined;
    
    const updatedPermission = { ...existingPermission, ...permissionData };
    this.permissionsStore.set(id, updatedPermission);
    
    return updatedPermission;
  }

  async deletePermission(id: number): Promise<boolean> {
    if (!this.permissionsStore.has(id)) return false;
    
    // First remove this permission from all roles
    const rolePermissions = Array.from(this.rolePermissionsStore.values())
      .filter(rp => rp.permissionId === id);
    
    for (const rolePermission of rolePermissions) {
      await this.removePermissionFromRole(rolePermission.roleId, rolePermission.permissionId);
    }
    
    return this.permissionsStore.delete(id);
  }

  // Role methods
  async getRole(id: number): Promise<Role | undefined> {
    return this.rolesStore.get(id);
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.rolesStore.values());
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.rolesStore.values()).find(
      (role) => role.name === name,
    );
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.roleCurrentId++;
    const role: Role = { ...insertRole, id };
    this.rolesStore.set(id, role);
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const existingRole = await this.getRole(id);
    if (!existingRole) return undefined;
    
    const updatedRole = { ...existingRole, ...roleData };
    this.rolesStore.set(id, updatedRole);
    
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    if (!this.rolesStore.has(id)) return false;
    
    // First remove this role from all role-permissions
    const rolePermissions = Array.from(this.rolePermissionsStore.values())
      .filter(rp => rp.roleId === id);
    
    for (const rolePermission of rolePermissions) {
      await this.removePermissionFromRole(rolePermission.roleId, rolePermission.permissionId);
    }
    
    // Then remove this role from all user-roles
    const userRoles = Array.from(this.userRolesStore.values())
      .filter(ur => ur.roleId === id);
    
    for (const userRole of userRoles) {
      await this.removeRoleFromUser(userRole.userId, userRole.roleId);
    }
    
    return this.rolesStore.delete(id);
  }

  // Role-Permission methods
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> {
    const key = `${roleId}-${permissionId}`;
    const rolePermission: RolePermission = { roleId, permissionId };
    
    this.rolePermissionsStore.set(key, rolePermission);
    return rolePermission;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    const key = `${roleId}-${permissionId}`;
    return this.rolePermissionsStore.delete(key);
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissionPairs = Array.from(this.rolePermissionsStore.values())
      .filter(rp => rp.roleId === roleId);
    
    const permissions: Permission[] = [];
    
    for (const pair of rolePermissionPairs) {
      const permission = await this.getPermission(pair.permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }
    
    return permissions;
  }

  // User-Role methods
  async assignRoleToUser(userId: number, roleId: number): Promise<UserRole> {
    const key = `${userId}-${roleId}`;
    const userRole: UserRole = { userId, roleId };
    
    this.userRolesStore.set(key, userRole);
    return userRole;
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    const key = `${userId}-${roleId}`;
    return this.userRolesStore.delete(key);
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    const userRolePairs = Array.from(this.userRolesStore.values())
      .filter(ur => ur.userId === userId);
    
    const roles: Role[] = [];
    
    for (const pair of userRolePairs) {
      const role = await this.getRole(pair.roleId);
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  }

  // Combined methods
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);
    const permissionSets = await Promise.all(roles.map(role => this.getRolePermissions(role.id)));
    
    // Flatten and deduplicate permissions
    const allPermissions = permissionSets.flat();
    const uniquePermissions = allPermissions.filter(
      (permission, index, self) => 
        index === self.findIndex(p => p.id === permission.id)
    );
    
    return uniquePermissions;
  }
}

export const storage = new MemStorage();
