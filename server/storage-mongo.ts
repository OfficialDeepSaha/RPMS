import session from 'express-session';
import createMemoryStore from 'memorystore';
import { IStorage } from './storage';
import {
  User, Permission, Role, RolePermission, UserRole, ActivityLog, SystemSettings,
  type UserType, type PermissionType, type RoleType,
  type RolePermissionType, type UserRoleType, type ActivityLogType, type SystemSettingsType
} from './db/models';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Activity } from './models';
import { v4 as uuidv4 } from 'uuid';
import { ProfileImage } from './db/models'; // Import ProfileImage model

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export class MongoStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize default data after connecting
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    try {
      // Check if any permissions already exist
      const permissionCount = await Permission.countDocuments();
      
      // Skip initialization if we already have data
      if (permissionCount > 0) {
        // Initialize system settings if they don't exist already
        await this.initializeSystemSettings();
        return;
      }

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
      
      // Create default admin user with hashed password
      const adminUser = await this.createUser({
        username: "admin",
        password: "deePs223@#", // In real app this would be hashed
        firstName: "Admin",
        lastName: "User",
        email: "admin@gmail.com",
        status: "active"
      });
      
      // Assign admin role to admin user
      await this.assignRoleToUser(adminUser.id, adminRole.id);
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<UserType | undefined> {
    const user = await User.findOne({ id });
    return user ? user.toObject() : undefined;
  }

  async getUsers(): Promise<UserType[]> {
    const users = await User.find();
    return users.map(user => user.toObject());
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    const user = await User.findOne({ username });
    return user ? user.toObject() : undefined;
  }

  async createUser(userData: any): Promise<UserType> {
    // Handle password hashing if not already hashed
    let password = userData.password;
    
    // Only hash if it's not already in the format hash.salt
    if (password && !password.includes('.')) {
      password = await hashPassword(password);
    }
    
    // Ensure null values for optional fields if they're undefined
    const formattedData = {
      username: userData.username,
      password,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      email: userData.email ?? null,
      status: userData.status || 'active',
      lastLogin: userData.lastLogin || new Date()
    };
    
    const user = new User(formattedData);
    await user.save();
    return user.toObject();
  }

  async updateUser(id: number, userData: Partial<any>): Promise<UserType | undefined> {
    // Create a new object with formatted data
    const updateData: any = {};
    
    // If updating password, hash it first
    if (userData.password && !userData.password.includes('.')) {
      updateData.password = await hashPassword(userData.password);
    }
    
    // Handle optional fields
    if (userData.username !== undefined) updateData.username = userData.username;
    if (userData.firstName !== undefined) updateData.firstName = userData.firstName ?? null;
    if (userData.lastName !== undefined) updateData.lastName = userData.lastName ?? null;
    if (userData.email !== undefined) updateData.email = userData.email ?? null;
    if (userData.status !== undefined) updateData.status = userData.status ?? null;
    if (userData.lastLogin !== undefined) updateData.lastLogin = userData.lastLogin ?? null;
    
    const user = await User.findOneAndUpdate({ id }, updateData, { new: true });
    return user ? user.toObject() : undefined;
  }

  async deleteUser(id: number): Promise<void> {
    const user = await User.findOne({ id });
    if (!user) return;
    
    await User.deleteOne({ id });
    // Also remove their user roles
    await UserRole.deleteMany({ userId: id });
  }

  // Permission methods
  async getPermission(id: number): Promise<PermissionType | undefined> {
    const permission = await Permission.findOne({ id });
    return permission ? permission.toObject() : undefined;
  }

  async getPermissions(): Promise<PermissionType[]> {
    const permissions = await Permission.find();
    return permissions.map(p => p.toObject());
  }

  async getPermissionByName(name: string): Promise<PermissionType | undefined> {
    const permission = await Permission.findOne({ name });
    return permission ? permission.toObject() : undefined;
  }

  async createPermission(permissionData: any): Promise<PermissionType> {
    // Ensure null values for optional fields if they're undefined
    const formattedData = {
      name: permissionData.name,
      description: permissionData.description ?? null,
      category: permissionData.category ?? null
    };
    
    const permission = new Permission(formattedData);
    await permission.save();
    return permission.toObject();
  }

  async updatePermission(id: number, permissionData: Partial<any>): Promise<PermissionType | undefined> {
    // Create a new object with formatted data
    const updateData: any = {};
    
    // Handle optional fields
    if (permissionData.name !== undefined) updateData.name = permissionData.name;
    if (permissionData.description !== undefined) updateData.description = permissionData.description ?? null;
    if (permissionData.category !== undefined) updateData.category = permissionData.category ?? null;
    
    const permission = await Permission.findOneAndUpdate({ id }, updateData, { new: true });
    return permission ? permission.toObject() : undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await Permission.deleteOne({ id });
    
    // Also delete related role permissions
    await RolePermission.deleteMany({ permissionId: id });
    
    return result.deletedCount > 0;
  }

  // Role methods
  async getRole(id: number): Promise<RoleType | undefined> {
    const role = await Role.findOne({ id });
    return role ? role.toObject() : undefined;
  }

  async getRoles(): Promise<RoleType[]> {
    try {
      const roles = await Role.find();
      return roles.map(r => r.toObject());
    } catch (error) {
      console.error('Error in getRoles:', error);
      // Return empty array instead of throwing to allow the app to continue
      return [];
    }
  }

  async getRoleByName(name: string): Promise<RoleType | undefined> {
    const role = await Role.findOne({ name });
    return role ? role.toObject() : undefined;
  }

  async createRole(roleData: any): Promise<RoleType> {
    // Ensure null values for optional fields if they're undefined
    const formattedData = {
      name: roleData.name,
      description: roleData.description ?? null
    };
    
    const role = new Role(formattedData);
    await role.save();
    return role.toObject();
  }

  async updateRole(id: number, roleData: Partial<any>): Promise<RoleType | undefined> {
    // Create a new object with formatted data
    const updateData: any = {};
    
    // Handle optional fields
    if (roleData.name !== undefined) updateData.name = roleData.name;
    if (roleData.description !== undefined) updateData.description = roleData.description ?? null;
    
    const role = await Role.findOneAndUpdate({ id }, updateData, { new: true });
    return role ? role.toObject() : undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await Role.deleteOne({ id });
    
    // Also delete related role permissions and user roles
    await RolePermission.deleteMany({ roleId: id });
    await UserRole.deleteMany({ roleId: id });
    
    return result.deletedCount > 0;
  }

  // Role-Permission methods
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermissionType> {
    const rolePermission = new RolePermission({ roleId, permissionId });
    await rolePermission.save();
    return rolePermission.toObject();
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    const result = await RolePermission.deleteOne({ roleId, permissionId });
    return result.deletedCount > 0;
  }

  async getRolePermissions(roleId: number): Promise<PermissionType[]> {
    try {
      // Log what we're trying to fetch for debugging
      console.log(`Fetching permissions for role ID: ${roleId}`);
      
      const rolePermissions = await RolePermission.find({ roleId });
      const permissionIds = rolePermissions.map(rp => rp.permissionId);
      
      if (permissionIds.length === 0) {
        console.log(`No permissions found for role ID: ${roleId}`);
        return [];
      }
      
      const permissions = await Permission.find({ id: { $in: permissionIds } });
      
      // Log what we found for debugging
      console.log(`Found ${permissions.length} permissions for role ID: ${roleId}`);
      
      return permissions.map(p => p.toObject());
    } catch (error) {
      console.error(`Error in getRolePermissions for roleId ${roleId}:`, error);
      // Return empty array instead of throwing to allow the app to continue
      return [];
    }
  }

  // User-Role methods
  async assignRoleToUser(userId: number, roleId: number): Promise<UserRoleType> {
    const userRole = new UserRole({ userId, roleId });
    await userRole.save();
    return userRole.toObject();
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    const result = await UserRole.deleteOne({ userId, roleId });
    return result.deletedCount > 0;
  }

  async getUserRoles(userId: number): Promise<RoleType[]> {
    const userRoles = await UserRole.find({ userId });
    const roleIds = userRoles.map(ur => ur.roleId);
    
    if (roleIds.length === 0) return [];
    
    const roles = await Role.find({ id: { $in: roleIds } });
    return roles.map(r => r.toObject());
  }

  async countUsersWithRole(roleId: number): Promise<number> {
    try {
      // Count documents in the userRoles collection that match the roleId
      const count = await UserRole.countDocuments({ roleId });
      console.log(`Count of users with role ID ${roleId}: ${count}`);
      return count;
    } catch (error) {
      console.error('Error in countUsersWithRole:', error);
      return 0;
    }
  }

  // Combined operations
  async getUserPermissions(userId: number): Promise<PermissionType[]> {
    // Get all roles for the user
    const roles = await this.getUserRoles(userId);
    
    if (roles.length === 0) return [];
    
    // Get permissions for each role
    const permissionSets = await Promise.all(
      roles.map(role => this.getRolePermissions(role.id))
    );
    
    // Flatten and remove duplicates
    const allPermissions = permissionSets.flat();
    const uniquePermissions = Array.from(
      new Map(allPermissions.map(p => [p.id, p])).values()
    );
    
    return uniquePermissions;
  }

  // Activity log methods
  async logActivity(type: string, content: string, userId: number, details: Record<string, any> = {}): Promise<ActivityLogType> {
    try {
      // Get user information
      const user = await this.getUser(userId);
      const username = user?.username || 'Unknown user';
      
      // Create activity log entry
      const activityLog = new ActivityLog({
        type,
        content,
        userId,
        username,
        details
      });
      
      await activityLog.save();
      return activityLog.toObject();
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  async getActivities(limit: number = 100, offset: number = 0): Promise<ActivityLogType[]> {
    try {
      const activities = await ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
        
      return activities.map(activity => activity.toObject());
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async getActivitiesByTimeRange(startDate: Date, endDate: Date, limit: number = 100): Promise<ActivityLogType[]> {
    try {
      const activities = await ActivityLog.find({
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .sort({ createdAt: -1 })
      .limit(limit);
      
      return activities.map(activity => activity.toObject());
    } catch (error) {
      console.error('Error fetching activities by time range:', error);
      throw error;
    }
  }

  async getActivitiesByUser(userId: number, limit: number = 100): Promise<ActivityLogType[]> {
    try {
      const activities = await ActivityLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
        
      return activities.map(activity => activity.toObject());
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  async getActivitiesByType(type: string, limit: number = 100): Promise<ActivityLogType[]> {
    try {
      const activities = await ActivityLog.find({ type })
        .sort({ createdAt: -1 })
        .limit(limit);
        
      return activities.map(activity => activity.toObject());
    } catch (error) {
      console.error('Error fetching activities by type:', error);
      throw error;
    }
  }

  // Activity methods
  async saveActivity(activity: Activity): Promise<Activity> {
    try {
      // Create a new ActivityLog document
      const activityLog = new ActivityLog({
        type: activity.type,
        content: activity.message || activity.content || '',
        message: activity.message || activity.content || '',
        userId: parseInt(activity.userId) || 0,
        username: activity.username || activity.userName || 'Unknown',
        userName: activity.userName || activity.username || 'Unknown',
        userImage: activity.userImage || '',
        userAvatar: activity.userAvatar || '',
        details: activity.details || {}
      });
      
      // Save to MongoDB
      await activityLog.save();
      console.log('Activity saved successfully with ID:', activityLog.id);
      
      // Convert MongoDB document to Activity interface
      return {
        id: activityLog.id.toString(),
        type: activityLog.type,
        message: activityLog.message,
        content: activityLog.content,
        createdAt: activityLog.createdAt,
        userId: activityLog.userId.toString(),
        userName: activityLog.userName,
        username: activityLog.username,
        userImage: activityLog.userImage,
        userAvatar: activityLog.userAvatar,
        details: activityLog.details
      };
    } catch (error) {
      console.error('Error saving activity:', error);
      // Return the original activity if saving fails
      return activity;
    }
  }

  async getActivitiesWithOptions(
    query: Record<string, any> = {}, 
    options: { limit?: number; sort?: Record<string, number> } = {}
  ): Promise<Activity[]> {
    try {
      console.log('Getting activities with query:', query, 'and options:', options);
      
      // Convert sort format to be compatible with MongoDB
      let sortObj: any = { createdAt: -1 };
      if (options.sort) {
        sortObj = {};
        Object.entries(options.sort).forEach(([key, value]) => {
          sortObj[key] = value;
        });
      }
      
      // Get all activity logs regardless of field names
      const activityLogs = await ActivityLog.find(query)
        .sort(sortObj)
        .limit(options.limit || 100);
      
      if (activityLogs.length === 0) {
        console.log("No activity logs found in ActivityLog collection");
        
        // As a fallback, try to find data by another approach
        try {
          // This is a more flexible approach that might catch activities stored differently
          const db = ActivityLog.db;
          const activityCollection = db.collection('activitylogs'); // Try lowercase collection name
          
          if (activityCollection) {
            // Create a raw MongoDB sort object
            let rawSortObj: any = { createdAt: -1, timestamp: -1 };
            if (options.sort) {
              rawSortObj = {};
              Object.entries(options.sort).forEach(([key, value]) => {
                rawSortObj[key] = value;
              });
            }
            
            const rawActivities = await activityCollection.find({})
              .sort(rawSortObj)
              .limit(options.limit || 100)
              .toArray();
              
            console.log(`Found ${rawActivities.length} activities using raw collection access`);
            
            // Convert to Activity interface
            return rawActivities.map(activity => ({
              id: activity.id?.toString() || activity._id?.toString() || uuidv4(),
              type: activity.type || 'unknown',
              message: activity.message || activity.content || '',
              content: activity.content || activity.message || '',
              createdAt: activity.createdAt || activity.timestamp || new Date(),
              userId: activity.userId?.toString() || '0',
              userName: activity.userName || activity.username || 'Unknown',
              username: activity.username || activity.userName || 'Unknown',
              details: activity.details || {}
            }));
          }
        } catch (fallbackError) {
          console.error('Error in fallback activity fetch:', fallbackError);
        }
        
        // Return empty array if all approaches fail
        return [];
      }
      
      // Convert to standard format
      return activityLogs.map(log => {
        const activityObj = log.toObject ? log.toObject() : log;
        
        // Ensure all required fields are present
        return {
          id: activityObj.id?.toString() || activityObj._id?.toString(),
          type: activityObj.type || 'unknown',
          message: activityObj.message || activityObj.content || '',
          content: activityObj.content || activityObj.message || '',
          createdAt: activityObj.createdAt || activityObj.timestamp || new Date(),
          userId: activityObj.userId?.toString() || '0',
          userName: activityObj.userName || activityObj.username || 'Unknown',
          username: activityObj.username || activityObj.userName || 'Unknown',
          userImage: activityObj.userImage || activityObj.userAvatar || undefined,
          details: activityObj.details || {}
        };
      });
    } catch (error) {
      console.error('Error fetching activities with options:', error);
      return [];
    }
  }

  async getActivityById(id: string): Promise<Activity | null> {
    // Implement MongoDB activity retrieval by ID
    console.log('Getting activity by ID:', id);
    return null;
  }

  async deleteActivity(id: string): Promise<boolean> {
    // Implement MongoDB activity deletion
    console.log('Deleting activity:', id);
    return true;
  }
  
  async countActivities(query: Record<string, any>): Promise<number> {
    try {
      // Count activities that match the query
      const count = await ActivityLog.countDocuments(query);
      
      if (count === 0) {
        // As a fallback, try to find data by another approach
        try {
          const db = ActivityLog.db;
          const activityCollection = db.collection('activitylogs'); // Try lowercase collection name
          
          if (activityCollection) {
            const fallbackCount = await activityCollection.countDocuments(query);
            return fallbackCount;
          }
        } catch (fallbackError) {
          console.error('Error in fallback activity count:', fallbackError);
        }
      }
      
      return count;
    } catch (error) {
      console.error('Error counting activities:', error);
      return 0;
    }
  }

  // Profile image methods
  async saveProfileImage(profileData: {
    userId: number;
    imageUrl: string;
    filename: string;
    metadata?: {
      originalFilename?: string;
      mimeType?: string;
      size?: number;
    }
  }): Promise<any> {
    // First deactivate any existing profile images for this user
    await this.deactivateProfileImages(profileData.userId);
    
    // Generate a unique ID for this profile image
    const id = `profile_${profileData.userId}_${Date.now()}`;
    
    // Create the new profile image
    const profileImage = await ProfileImage.create({
      id,
      userId: profileData.userId,
      imageUrl: profileData.imageUrl,
      filename: profileData.filename,
      createdAt: new Date(),
      isActive: true,
      metadata: profileData.metadata
    });
    
    // Update the user's profile with the new image URL
    await User.findOneAndUpdate(
      { id: profileData.userId },
      { $set: { profileImage: profileData.imageUrl } },
      { new: true } // This ensures the updated document is returned
    );
    
    // Double check that the user has been updated
    console.log(`Updated user ${profileData.userId} with profile image: ${profileData.imageUrl}`);
    
    // To ensure the update is visible on page refresh, verify it one more time
    const updatedUser = await User.findOne({ id: profileData.userId });
    console.log('User after update:', {
      id: updatedUser?.id,
      profileImage: updatedUser?.profileImage
    });
    
    return profileImage;
  }

  async getActiveProfileImage(userId: number): Promise<any | null> {
    return ProfileImage.findOne({ userId, isActive: true }).lean();
  }

  async getUserProfileImages(userId: number, limit: number = 10): Promise<any[]> {
    return ProfileImage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async deactivateProfileImages(userId: number): Promise<void> {
    await ProfileImage.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false } }
    );
  }

  // System Settings Methods
  private async initializeSystemSettings() {
    // Define default settings
    const defaultSettings = [
      {
        key: 'systemName',
        category: 'general',
        value: 'RoleSphere',
        defaultValue: 'RoleSphere',
      },
      {
        key: 'adminEmail',
        category: 'general',
        value: 'admin@rolesphere.com',
        defaultValue: 'admin@rolesphere.com',
      },
      {
        key: 'dateFormat',
        category: 'general',
        value: 'MM/DD/YYYY',
        defaultValue: 'MM/DD/YYYY',
      },
      {
        key: 'defaultLanguage',
        category: 'general',
        value: 'English',
        defaultValue: 'English',
      },
      {
        key: 'maintenanceMode',
        category: 'general',
        value: false,
        defaultValue: false,
      },
      {
        key: 'sessionTimeout',
        category: 'security',
        value: 30,
        defaultValue: 30,
      },
      {
        key: 'passwordMinLength',
        category: 'security',
        value: 10,
        defaultValue: 8,
      },
      {
        key: 'passwordComplexity',
        category: 'security',
        value: 'medium',
        defaultValue: 'medium',
      },
      {
        key: 'twoFactorAuth',
        category: 'security',
        value: false,
        defaultValue: false,
      },
      {
        key: 'loginAttempts',
        category: 'security',
        value: 5,
        defaultValue: 5,
      },
      {
        key: 'emailNotifications',
        category: 'notifications',
        value: true,
        defaultValue: true,
      },
      {
        key: 'pushNotifications',
        category: 'notifications',
        value: false,
        defaultValue: false,
      },
      {
        key: 'loginAlerts',
        category: 'notifications',
        value: true,
        defaultValue: true,
      },
      {
        key: 'roleChangeAlerts',
        category: 'notifications',
        value: true,
        defaultValue: true,
      },
      {
        key: 'permissionChangeAlerts',
        category: 'notifications',
        value: false,
        defaultValue: false,
      },
      {
        key: 'systemUpdates',
        category: 'notifications',
        value: true,
        defaultValue: true,
      }
    ];
    
    // Insert settings if they don't exist
    for (const setting of defaultSettings) {
      const exists = await SystemSettings.findOne({ key: setting.key });
      if (!exists) {
        await SystemSettings.create({
          ...setting,
          lastUpdated: new Date(),
          updatedBy: 1 // Admin user
        });
      }
    }
  }

  async getSetting(key: string): Promise<SystemSettingsType | null> {
    return SystemSettings.findOne({ key }).lean();
  }
  
  async getSettingsByCategory(category: string): Promise<SystemSettingsType[]> {
    return SystemSettings.find({ category }).sort({ key: 1 }).lean();
  }
  
  async getAllSettings(): Promise<Record<string, SystemSettingsType[]>> {
    const settings = await SystemSettings.find().lean();
    
    // Group settings by category
    const groupedSettings: Record<string, SystemSettingsType[]> = {};
    
    settings.forEach(setting => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = [];
      }
      groupedSettings[setting.category].push(setting);
    });
    
    return groupedSettings;
  }
  
  async updateSetting(key: string, value: any, userId: number = 1): Promise<SystemSettingsType | null> {
    try {
      // First, get the current setting to capture previous value
      const currentSetting = await SystemSettings.findOne({ key }).lean();
      const previousValue = currentSetting?.value;
      
      // Then update the setting
      const updated = await SystemSettings.findOneAndUpdate(
        { key },
        { 
          $set: { 
            value,
            lastUpdated: new Date(),
            updatedBy: userId
          } 
        },
        { new: true }
      ).lean();
      
      // Log the setting update
      if (updated) {
        await this.logActivity(
          'setting_updated',
          `System setting "${key}" was updated`,
          userId,
          { key, newValue: value, previousValue }
        );
      }
      
      return updated;
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      return null;
    }
  }
  
  async updateSettings(settings: { key: string, value: any }[], userId: number = 1): Promise<boolean> {
    try {
      for (const setting of settings) {
        await this.updateSetting(setting.key, setting.value, userId);
      }
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }
  
  async resetSettings(category?: string, userId: number = 1): Promise<boolean> {
    try {
      const query = category ? { category } : {};
      const settings = await SystemSettings.find(query);
      
      for (const setting of settings) {
        await SystemSettings.updateOne(
          { _id: setting._id },
          { 
            $set: { 
              value: setting.defaultValue,
              lastUpdated: new Date(),
              updatedBy: userId
            } 
          }
        );
      }
      
      await this.logActivity(
        'settings_reset',
        category ? `Settings in category "${category}" were reset to defaults` : 'All system settings were reset to defaults',
        userId,
        { category }
      );
      
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }
}