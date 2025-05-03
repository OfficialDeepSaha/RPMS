import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, LogIn, Shield, Key, UserPlus, Settings, AlertTriangle, FileEdit, Lock } from 'lucide-react';

// Types
interface ActivityItem {
  id: number | string;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: React.ReactNode;
  iconBackground?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  category?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
}

// Map activity types to icons and colors
const getActivityIcon = (title: string, customIcon?: React.ReactNode): React.ReactNode => {
  if (customIcon) return customIcon;
  
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('log') && lowerTitle.includes('in')) return <LogIn className="h-4 w-4" />;
  if (lowerTitle.includes('role')) return <Shield className="h-4 w-4" />;
  if (lowerTitle.includes('permission')) return <Key className="h-4 w-4" />;
  if (lowerTitle.includes('account') || lowerTitle.includes('profile')) return <UserPlus className="h-4 w-4" />;
  if (lowerTitle.includes('setting')) return <Settings className="h-4 w-4" />;
  if (lowerTitle.includes('update') || lowerTitle.includes('change')) return <FileEdit className="h-4 w-4" />;
  if (lowerTitle.includes('security') || lowerTitle.includes('password')) return <Lock className="h-4 w-4" />;
  
  return <AlertTriangle className="h-4 w-4" />;
};

// Generate a color based on text
const getActivityColor = (title: string, status?: string): string => {
  if (status === 'success') return '#10b981';
  if (status === 'warning') return '#f59e0b';
  if (status === 'error') return '#ef4444';
  if (status === 'info') return '#3b82f6';
  
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('log') && lowerTitle.includes('in')) return '#3b82f6';
  if (lowerTitle.includes('role')) return '#8b5cf6';
  if (lowerTitle.includes('permission')) return '#ec4899';
  if (lowerTitle.includes('account') || lowerTitle.includes('profile')) return '#14b8a6';
  if (lowerTitle.includes('setting')) return '#6366f1';
  if (lowerTitle.includes('update') || lowerTitle.includes('change')) return '#f97316';
  if (lowerTitle.includes('security') || lowerTitle.includes('password')) return '#22c55e';
  
  return '#64748b';
};

// Format the timestamp
const formatTimestamp = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (e) {
    return 'Invalid date';
  }
};

// Skeleton loading item
const ActivityItemSkeleton = () => (
  <div className="flex items-start space-x-3 animate-pulse">
    <div className="h-8 w-8 rounded-lg bg-slate-700/50"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
      <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
    </div>
    <div className="h-3 bg-slate-700/40 rounded w-16"></div>
  </div>
);

export function ActivityTimeline({
  activities,
  isLoading = false,
  emptyMessage = "No recent activity to display",
  maxItems = 5
}: ActivityTimelineProps) {
  
  const displayActivities = activities.slice(0, maxItems);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <ActivityItemSkeleton key={index} />
        ))}
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="relative space-y-6">
      {/* Timeline axis */}
      <div className="absolute left-4 top-4 bottom-4 w-[1px] bg-gradient-to-b from-indigo-500/50 via-indigo-400/30 to-transparent"></div>
      
      {displayActivities.map((activity, index) => {
        const activityColor = getActivityColor(activity.title, activity.status);
        const activityIcon = getActivityIcon(activity.title, activity.icon);
        const timeString = formatTimestamp(activity.timestamp);
        
        return (
          <div 
            key={activity.id} 
            className={cn(
              "flex items-start space-x-3 transition-all duration-300 hover:translate-x-1 animate-fadeIn",
              `animation-delay-${index * 100}`
            )}
          >
            {/* Icon with dynamic color and glow */}
            <div 
              className="relative z-10 h-8 w-8 rounded-lg shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3"
              style={{ 
                backgroundColor: `${activityColor}20`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `${activityColor}30`,
              }}
            >
              <div 
                className="text-indigo-400"
                style={{ color: activityColor }}
              >
                {activityIcon}
              </div>
              
              {/* Subtle glow effect */}
              <div 
                className="absolute -inset-1 rounded-lg opacity-0 transition-opacity duration-300 hover:opacity-60 blur-sm -z-10"
                style={{ backgroundColor: activityColor }}
              ></div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-white truncate">{activity.title}</h3>
                
                {/* Timestamp with glass effect */}
                <div className="text-xs text-slate-400 whitespace-nowrap pl-3 flex items-center">
                  {timeString}
                </div>
              </div>
              
              {activity.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{activity.description}</p>
              )}
              
              {activity.category && (
                <Badge 
                  variant="outline" 
                  className="mt-2 text-xs py-0 h-5 px-2 rounded-sm"
                  style={{ 
                    color: activityColor,
                    borderColor: `${activityColor}50`,
                    backgroundColor: `${activityColor}10`
                  }}
                >
                  {activity.category}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
      
      {activities.length > maxItems && (
        <div className="pt-2 text-center">
          <button 
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center mx-auto"
          >
            View all activity
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="ml-1 h-3 w-3"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline; 