import { 
  type User, type InsertUser, 
  type Permission, type InsertPermission,
  type Role, type InsertRole,
  type RolePermission, type InsertRolePermission,
  type UserRole, type InsertUserRole
} from "@shared/schema";
import type { Store } from "express-session";
import { MongoStorage } from "./storage-mongo";
import { Activity } from './models';

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
  sessionStore: Store;

  // Activity log methods
  logActivity(type: string, content: string, userId: number, details?: Record<string, any>): Promise<any>;
  getActivities(limit?: number, offset?: number): Promise<any[]>;
  getActivitiesByTimeRange(startDate: Date, endDate: Date, limit?: number): Promise<any[]>;
  getActivitiesByUser(userId: number, limit?: number): Promise<any[]>;
  getActivitiesByType(type: string, limit?: number): Promise<any[]>;
  
  // Activity methods
  saveActivity(activity: Activity): Promise<Activity>;
  getActivitiesWithOptions(query: Record<string, any>, options?: { limit?: number; sort?: Record<string, number> }): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | null>;
  deleteActivity(id: string): Promise<boolean>;
}

// Export the MongoDB implementation of the storage interface
export const storage = new MongoStorage() as IStorage; 