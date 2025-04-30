import mongoose, { Schema, Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  id: number;
  username: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: string | null;
  lastLogin: Date | null;
  profileImage: string | null;
}

// Permission Interface
export interface IPermission extends Document {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
}

// Role Interface
export interface IRole extends Document {
  id: number;
  name: string;
  description: string | null;
}

// Role-Permission Interface
export interface IRolePermission extends Document {
  roleId: number;
  permissionId: number;
}

// User-Role Interface
export interface IUserRole extends Document {
  userId: number;
  roleId: number;
}

// Activity Log Interface
export interface IActivityLog extends Document {
  id: number;
  type: string;
  content: string;
  message: string;
  createdAt: Date;
  timestamp: Date;
  userId: number;
  username: string;
  userName: string;
  userImage: string;
  userAvatar: string;
  details: Record<string, any>;
}

// Profile Image Interface
export interface IProfileImage extends Document {
  id: string;
  userId: number;
  imageUrl: string;
  filename: string;
  createdAt: Date;
  isActive: boolean;
  metadata?: {
    originalFilename?: string;
    mimeType?: string;
    size?: number;
  };
}

// System Settings Interface
export interface ISystemSettings extends Document {
  key: string;
  category: string;
  value: any;
  defaultValue: any;
  lastUpdated: Date;
  updatedBy: number;
}

// Create a counter model for auto-incrementing IDs
interface ICounter extends Document {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);

// Function to get next sequence value
const getNextSequence = async (name: string): Promise<number> => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

// User Schema
const userSchema = new Schema<IUser>({
  id: { type: Number, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  email: { type: String, default: null },
  status: { type: String, default: 'active' },
  lastLogin: { type: Date, default: Date.now },
  profileImage: { type: String, default: null }
});

// Pre-save hook for auto-incrementing ID
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.id = await getNextSequence('userId');
  }
  next();
});

// Permission Schema
const permissionSchema = new Schema<IPermission>({
  id: { type: Number, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  category: { type: String, default: null }
});

// Pre-save hook for auto-incrementing ID
permissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.id = await getNextSequence('permissionId');
  }
  next();
});

// Role Schema
const roleSchema = new Schema<IRole>({
  id: { type: Number, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null }
});

// Pre-save hook for auto-incrementing ID
roleSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.id = await getNextSequence('roleId');
  }
  next();
});

// Role-Permission Schema
const rolePermissionSchema = new Schema<IRolePermission>({
  roleId: { type: Number, required: true },
  permissionId: { type: Number, required: true }
});

// Compound index for uniqueness
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

// User-Role Schema
const userRoleSchema = new Schema<IUserRole>({
  userId: { type: Number, required: true },
  roleId: { type: Number, required: true }
});

// Compound index for uniqueness
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

// Activity Log Schema
const activityLogSchema = new Schema<IActivityLog>({
  id: { type: Number, unique: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  message: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  timestamp: { type: Date, required: false },
  userId: { type: Number, required: true },
  username: { type: String },
  userName: { type: String },
  userImage: String,
  userAvatar: String,
  details: { type: Schema.Types.Mixed, default: {} }
});

// Add pre-save hook to sync field names
activityLogSchema.pre('save', function(next) {
  // Ensure both field naming conventions are populated
  if (this.content && !this.message) this.message = this.content;
  if (this.message && !this.content) this.content = this.message;
  if (this.createdAt && !this.timestamp) this.timestamp = this.createdAt;
  if (this.timestamp && !this.createdAt) this.createdAt = this.timestamp;
  if (this.username && !this.userName) this.userName = this.username;
  if (this.userName && !this.username) this.username = this.userName;
  
  next();
});

// Pre-save hook for auto-incrementing ID
activityLogSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.id = await getNextSequence('activityLogId');
  }
  next();
});

// Create index on createdAt for faster queries
activityLogSchema.index({ createdAt: -1 });

// Profile Image Schema
const profileImageSchema = new Schema<IProfileImage>({
  id: { type: String, required: true, unique: true },
  userId: { type: Number, required: true, index: true },
  imageUrl: { type: String, required: true },
  filename: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  metadata: {
    originalFilename: { type: String },
    mimeType: { type: String },
    size: { type: Number }
  }
});

// Add index for faster lookup
profileImageSchema.index({ userId: 1, isActive: 1 });

// System Settings Schema
const systemSettingsSchema = new Schema<ISystemSettings>({
  key: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  defaultValue: { type: Schema.Types.Mixed, required: true },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: Number, required: false }
});

// Create compound index for category and key
systemSettingsSchema.index({ category: 1, key: 1 });

// Create Models
export const User = mongoose.model<IUser>('User', userSchema);
export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);
export const Role = mongoose.model<IRole>('Role', roleSchema);
export const RolePermission = mongoose.model<IRolePermission>('RolePermission', rolePermissionSchema);
export const UserRole = mongoose.model<IUserRole>('UserRole', userRoleSchema);
export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
export const ProfileImage = mongoose.model<IProfileImage>('ProfileImage', profileImageSchema);
export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

// Export types
export type UserType = IUser;
export type PermissionType = IPermission;
export type RoleType = IRole;
export type RolePermissionType = IRolePermission;
export type UserRoleType = IUserRole;
export type ActivityLogType = IActivityLog;
export type ProfileImageType = IProfileImage;
export type SystemSettingsType = ISystemSettings;