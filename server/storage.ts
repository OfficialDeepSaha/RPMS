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
  deleteUser(id: number): Promise<void>;
  
  // Profile image operations
  saveProfileImage(profileData: {
    userId: number;
    imageUrl: string;
    filename: string;
    metadata?: {
      originalFilename?: string;
      mimeType?: string;
      size?: number;
    }
  }): Promise<any>;
  
  getActiveProfileImage(userId: number): Promise<any | null>;
  
  getUserProfileImages(userId: number, limit?: number): Promise<any[]>;
  
  deactivateProfileImages(userId: number): Promise<void>;
  
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
  countUsersWithRole(roleId: number): Promise<number>;
  
  // Combined operations
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  // Session store
  sessionStore: Store;
  
  // Settings management
  getSetting(key: string): Promise<any | null>;
  getSettingsByCategory(category: string): Promise<any[]>;
  getAllSettings(): Promise<Record<string, any[]>>;
  updateSetting(key: string, value: any, userId?: number): Promise<any | null>;
  updateSettings(settings: { key: string, value: any }[], userId?: number): Promise<boolean>;
  resetSettings(category?: string, userId?: number): Promise<boolean>;

  // Activity log methods
  logActivity(type: string, content: string, userId: number, details?: Record<string, any>): Promise<any>;
  getActivities(limit?: number, offset?: number): Promise<any[]>;
  getActivitiesByTimeRange(startDate: Date, endDate: Date, limit?: number): Promise<any[]>;
  getActivitiesByUser(userId: number, limit?: number): Promise<any[]>;
  getActivitiesByType(type: string, limit?: number): Promise<any[]>;
  
  // Activity methods
  saveActivity(activity: Activity): Promise<Activity>;
  getActivitiesWithOptions(query: Record<string, any>, options?: { limit?: number; skip?: number; sort?: Record<string, number> }): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | null>;
  deleteActivity(id: string): Promise<boolean>;
  countActivities(query: Record<string, any>): Promise<number>;
}

// Export the MongoDB implementation of the storage interface
export const storage = new MongoStorage() as IStorage; 