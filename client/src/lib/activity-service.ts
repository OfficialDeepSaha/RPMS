import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ActivityItem {
  id: string;
  type: 'user_created' | 'role_updated' | 'permission_added' | 'user_deactivated' | 
         'role_created' | 'permission_created' | 'user_login' | 'user_updated' | 
         'permission_removed' | 'role_deleted' | 'user_role_assigned' | 'settings_updated';
  message: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  details?: Record<string, any>;
}

/**
 * Record a new activity
 * @param activity Activity data to record
 * @returns Promise with the created activity
 */
export async function recordActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<ActivityItem> {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      throw new Error('Failed to record activity');
    }

    return await response.json();
  } catch (error) {
    console.error('Error recording activity:', error);
    throw error;
  }
}

/**
 * Custom hook to fetch activities
 * @param period Time period filter ('today', 'week', 'month', or undefined for all)
 * @param limit Maximum number of activities to fetch
 * @returns Query result with activities data
 */
export function useActivities(period?: 'today' | 'week' | 'month', limit?: number) {
  return useQuery<ActivityItem[]>({
    queryKey: ["activities", period, limit],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (period) queryParams.append('period', period);
      if (limit) queryParams.append('limit', limit.toString());
      
      const url = `/api/activities?${queryParams.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Failed to fetch activities");
      return await res.json();
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });
}

/**
 * Custom hook to add a new activity with automatic refetching
 */
export function useRecordActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: recordActivity,
    onSuccess: () => {
      // Invalidate and refetch activities queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * Helper function to create standardized activity messages
 */
export function createActivityMessage(
  type: ActivityItem['type'], 
  entityName: string, 
  action?: string
): string {
  switch (type) {
    case 'user_created':
      return `User "${entityName}" was created`;
    case 'user_updated':
      return `User "${entityName}" was updated`;
    case 'user_deactivated':
      return `User "${entityName}" was deactivated`;
    case 'role_created':
      return `Role "${entityName}" was created`;
    case 'role_updated':
      return `Role "${entityName}" was updated`;
    case 'role_deleted':
      return `Role "${entityName}" was deleted`;
    case 'permission_added':
      return `Permission "${entityName}" was added to ${action}`;
    case 'permission_created':
      return `Permission "${entityName}" was created`;
    case 'permission_removed':
      return `Permission "${entityName}" was removed from ${action}`;
    case 'user_login':
      return `User "${entityName}" logged in`;
    case 'user_role_assigned':
      return `Role "${entityName}" was assigned to ${action}`;
    case 'settings_updated':
      return `System settings were updated: ${entityName}`;
    default: {
      // TypeScript should narrow the type correctly with this approach
      const actionType = type as string;
      // Convert type string to readable format (e.g., user_action -> user action)
      const readableType = actionType.replace(/_/g, ' ');
      return `${readableType} action performed on ${entityName}`;
    }
  }
} 