import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityItem } from "./activity-service";

// Types for user activity reports
export interface UserActivityReport {
  data: ActivityItem[];
  metadata: {
    totalCount: number;
    startDate: string;
    endDate: string;
  };
}

// Interface for dashboard analytics
export interface DashboardAnalytics {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsers: {
      count: number;
      trend: number; // percentage change
    };
    monthlyGrowth: { month: string; count: number }[];
  };
  roleStats: {
    totalRoles: number;
    usersPerRole: { 
      name: string; 
      count: number; 
      color: string;
      permissions?: { id: number; name: string; }[];
    }[];
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

/**
 * Fetch user activity report for a specific date range
 */
export async function fetchActivityReport(
  startDate: Date,
  endDate: Date,
  options?: {
    activityType?: string;
    userId?: string;
    limit?: number;
    page?: number;
  }
): Promise<UserActivityReport> {
  // Format dates for API
  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate.toISOString();
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    startDate: formattedStartDate,
    endDate: formattedEndDate,
  });
  
  if (options?.activityType) queryParams.append('type', options.activityType);
  if (options?.userId) queryParams.append('userId', options.userId);
  if (options?.limit) queryParams.append('limit', options.limit.toString());
  if (options?.page) queryParams.append('page', options.page.toString());
  
  // Make API request
  try {
    const response = await fetch(`/api/reports/activities?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity report');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching activity report:', error);
    
    // Fallback to mock data if the API fails
    return mockReportService.getMockActivityData(startDate, endDate, options?.limit || 50);
  }
}

/**
 * Fetch dashboard analytics data
 */
export async function fetchDashboardAnalytics(
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
): Promise<DashboardAnalytics> {
  try {
    console.log(`Fetching analytics data for time range: ${timeRange}`);
    const response = await fetch(`/api/reports/analytics?timeRange=${timeRange}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch analytics data');
    }
    
    const data = await response.json();
    console.log('Received analytics data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    
    // Fallback to mock data if the API fails
    console.warn('Using mock data as fallback');
    return mockReportService.getMockDashboardAnalytics(timeRange);
  }
}

/**
 * Custom hook to fetch user activity report
 */
export function useActivityReport(
  startDate: Date,
  endDate: Date,
  options?: {
    activityType?: string;
    userId?: string;
    limit?: number;
    enabled?: boolean;
  }
) {
  return useQuery<{ data: ActivityItem[] }>({
    queryKey: ['activityReport', startDate.toISOString(), endDate.toISOString(), options?.activityType, options?.userId, options?.limit],
    queryFn: async () => {
      // Construct the query parameters
      const params = new URLSearchParams();
      
      // Format dates for API request
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
      
      // Add optional filters if provided and not empty
      if (options?.activityType && options.activityType !== 'all') {
        params.append('type', options.activityType);
      }
      
      if (options?.userId) {
        params.append('userId', options.userId);
      }
      
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      
      try {
        const response = await fetch(`/api/reports/activities?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch activity report data');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching activity report data:", error);
        throw error;
      }
    },
    enabled: options?.enabled !== false, // By default, the query will run
  });
}

/**
 * Custom hook to fetch dashboard analytics
 */
export function useDashboardAnalytics(timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month') {
  return useQuery<DashboardAnalytics>({
    queryKey: ['dashboardAnalytics', timeRange],
    queryFn: () => fetchDashboardAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
}

/**
 * Export report data directly as CSV or JSON
 */
export function exportReportData(
  data: any[],
  format: 'csv' | 'json',
  filename: string
): void {
  let content: string;
  let mimeType: string;
  
  if (format === 'csv') {
    // Convert data to CSV format
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    content = [headers, ...rows].join('\n');
    mimeType = 'text/csv';
    if (!filename.endsWith('.csv')) filename += '.csv';
  } else {
    // Convert data to JSON format
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
    if (!filename.endsWith('.json')) filename += '.json';
  }
  
  // Create a blob and download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Download a report in the specified format (CSV or JSON)
 */
export async function downloadReport({
  format,
  startDate,
  endDate,
  type,
  query
}: {
  format: 'csv' | 'json';
  startDate: Date;
  endDate: Date;
  type?: string;
  query?: string;
}): Promise<void> {
  try {
    // Build the URL for the direct download
    const queryParams = new URLSearchParams({
      format,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    if (type) queryParams.append('type', type);
    if (query) queryParams.append('userId', query);
    
    // Try to use the direct download endpoint first
    const url = `/api/reports/download?${queryParams.toString()}`;
    
    // Create a hidden link and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error downloading report:", error);
    
    // Fallback to client-side generation if API fails
    try {
      // Fetch the report data
      const report = await fetchActivityReport(startDate, endDate, {
        activityType: type,
        userId: query
      });
      
      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `user-activity-report-${dateStr}`;
      
      // Use the export utility to trigger download
      exportReportData(report.data, format, filename);
      
      return Promise.resolve();
    } catch (fallbackError) {
      console.error("Error with fallback download method:", fallbackError);
      return Promise.reject(fallbackError);
    }
  }
}

// Mock implementation functions for development until real API is ready
export const mockReportService = {
  // Generate mock activity data
  getMockActivityData(startDate: Date, endDate: Date, count = 50): UserActivityReport {
    const activityTypes = [
      'user_login', 'user_created', 'user_updated', 'user_deactivated', 
      'role_created', 'role_updated', 'role_deleted',
      'permission_created', 'permission_updated', 'permission_deleted',
      'permission_added', 'permission_removed'
    ];
    
    const userNames = ['John Doe', 'Jane Smith', 'Admin User', 'Guest User', 'Support Agent'];
    
    const generateMessage = (type: string, entityName: string): string => {
      switch(type) {
        case 'user_login': return `${entityName} logged in to the system`;
        case 'user_created': return `New user ${entityName} was created`;
        case 'user_updated': return `User ${entityName} was updated`;
        case 'user_deactivated': return `User ${entityName} was deactivated`;
        case 'role_created': return `Role ${entityName} was created`;
        case 'role_updated': return `Role ${entityName} was updated`;
        case 'role_deleted': return `Role ${entityName} was deleted`;
        case 'permission_created': return `Permission ${entityName} was created`;
        case 'permission_updated': return `Permission ${entityName} was updated`;
        case 'permission_deleted': return `Permission ${entityName} was deleted`;
        case 'permission_added': return `Permission ${entityName} was added to a role`;
        case 'permission_removed': return `Permission ${entityName} was removed from a role`;
        default: return `Action ${type} performed on ${entityName}`;
      }
    };
    
    const activities: ActivityItem[] = Array.from({ length: count }, (_, i) => {
      // Generate a random date between start and end dates
      const timestamp = new Date(
        startDate.getTime() + 
        Math.random() * (endDate.getTime() - startDate.getTime())
      ).toISOString();
      
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const userName = userNames[Math.floor(Math.random() * userNames.length)];
      
      const entityNames = [
        'Admin', 'Editor', 'Viewer', 'Manager',
        'john.doe', 'jane.smith', 'View Dashboard', 'Edit Users'
      ];
      const entityName = entityNames[Math.floor(Math.random() * entityNames.length)];
      
      return {
        id: `activity-${i + 1}`,
        type,
        message: generateMessage(type, entityName),
        timestamp,
        user: {
          id: `user-${Math.floor(Math.random() * 10) + 1}`,
          name: userName,
          image: Math.random() > 0.7 ? `/avatars/${userName}.jpg` : undefined
        },
        details: {
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
          success: Math.random() > 0.1
        }
      };
    });
    
    return {
      data: activities,
      metadata: {
        totalCount: count,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }
    };
  },
  
  // Generate mock dashboard analytics
  getMockDashboardAnalytics(timeRange: string): DashboardAnalytics {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Generate last 12 months in correct order
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (currentMonth - i + 12) % 12;
      return months[monthIndex];
    }).reverse();
    
    // Days for the login history
    const days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    
    // Create more realistic mock data with trends
    const totalUsers = 1200 + Math.floor(Math.random() * 200);
    const activeUsers = Math.floor(totalUsers * (0.6 + Math.random() * 0.3));
    const inactiveUsers = totalUsers - activeUsers;
    
    return {
      userStats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers: {
          count: 45 + Math.floor(Math.random() * 30),
          trend: 5 + Math.floor(Math.random() * 12),
        },
        monthlyGrowth: last12Months.map((month, i) => ({
          month,
          count: 100 + Math.floor(Math.random() * 50) + (i * 10)
        }))
      },
      roleStats: {
        totalRoles: 8 + Math.floor(Math.random() * 5),
        usersPerRole: [
          { 
            name: 'Admin', 
            count: 8, 
            color: '#8884d8', 
            permissions: [
              { id: 1, name: 'View Dashboard' },
              { id: 2, name: 'Manage Users' },
              { id: 3, name: 'Manage Roles' },
            ]
          },
          { 
            name: 'Manager', 
            count: 15, 
            color: '#83a6ed', 
            permissions: [
              { id: 4, name: 'View Reports' },
              { id: 5, name: 'Edit Profile' },
            ]
          },
          { 
            name: 'Editor', 
            count: 23, 
            color: '#8dd1e1', 
            permissions: [
              { id: 6, name: 'Create Content' },
              { id: 7, name: 'Edit Content' },
            ]
          },
          { 
            name: 'Viewer', 
            count: 54, 
            color: '#82ca9d', 
            permissions: [
              { id: 8, name: 'View Content' },
            ]
          },
          { 
            name: 'Support', 
            count: 12, 
            color: '#ffc658', 
            permissions: [
              { id: 9, name: 'Manage Tickets' },
              { id: 10, name: 'View Tickets' },
            ]
          },
        ]
      },
      permissionStats: {
        totalPermissions: 32 + Math.floor(Math.random() * 10),
        usageCount: [
          { name: 'View Dashboard', value: 95 },
          { name: 'Manage Users', value: 45 },
          { name: 'Manage Roles', value: 28 },
          { name: 'Manage Permissions', value: 22 },
          { name: 'View Reports', value: 65 },
          { name: 'Edit Profile', value: 85 },
        ]
      },
      loginStats: {
        totalLogins: 2400 + Math.floor(Math.random() * 1200),
        averageDaily: 80 + Math.floor(Math.random() * 40),
        peakDay: { 
          day: days[Math.floor(Math.random() * days.length)], 
          count: 120 + Math.floor(Math.random() * 60)
        },
        history: days.map(day => ({
          date: day,
          count: 50 + Math.floor(Math.random() * 100)
        }))
      }
    };
  }
};
