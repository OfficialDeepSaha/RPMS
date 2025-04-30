// Activity model for tracking user actions
export interface Activity {
  id: string;
  type: string;
  message?: string;
  content?: string;
  createdAt: Date;
  userId: string;
  userName?: string;
  username?: string;
  userImage?: string;
  userAvatar?: string;
  details?: Record<string, any>;
} 

// Analytics models for reports

// User analytics data for dashboard
export interface UserAnalytics {
  date: Date;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsers: {
    count: number;
    trend: number; // percentage change
  };
  usersByRole: Array<{ 
    name: string; 
    count: number;
    color: string;
  }>;
}

// Login statistics
export interface LoginStats {
  date: Date;
  count: number;
  uniqueUsers: number;
}

// Permission usage data
export interface PermissionUsage {
  name: string;
  value: number;
  lastUsed: Date;
}

// Dashboard analytics combined data
export interface DashboardAnalytics {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsers: {
      count: number;
      trend: number;
    };
    monthlyGrowth: { month: string; count: number }[];
  };
  roleStats: {
    totalRoles: number;
    usersPerRole: { name: string; count: number; color: string }[];
  };
  permissionStats: {
    totalPermissions: number;
    usageCount: { name: string; value: number }[];
  };
  loginStats: {
    totalLogins: number;
    averageDaily: number;
    peakDay: { day: string; count: number };
    history: { date: string; count: number }[];
  };
}