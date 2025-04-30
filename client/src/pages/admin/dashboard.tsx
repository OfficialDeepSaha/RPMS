import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Shield,
  Key, 
  UserCheck,
  UserPlus,
  Layers,
  KeySquare,
  UserMinus,
  ChevronRight, 
  Activity,
  BarChart3,
  ArrowUpRight,
  Clock,
  Plus,
  AlertCircle,
  ClipboardList,
  ExternalLink,
  Tag,
  LockOpen,
  FolderPlus,
  ArrowDownRight,
  Zap,
  LayoutGrid,
  Settings,
  Bell,
  User,
  FileSearch,
  UserRound,
  ShieldCheck,
  Lock,
  LogIn,
  Loader2,
  RefreshCw,
  FileQuestion,
  DollarSign,
  Laptop,
  Tablet,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useActivities, ActivityItem as ActivityItemType } from "@/lib/activity-service";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

// Import chart components
import StatCard from "@/components/admin/StatCard";
import DashboardChart from "@/components/admin/DashboardChart";

interface Stats {
  users: number;
  roles: number;
  permissions: number;
  activeUsers: number;
  usersTrend: number;
  rolesTrend: number;
  permissionsTrend: number;
  activeUsersTrend: number;
}

interface RoleSummary {
  id: number;
  name: string;
  description: string | null;
  userCount: number;
  permissionCount: number;
}

export default function AdminDashboard() {
  // Time period state
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'thisWeek' | 'thisMonth' | 'thisYear'>('today');
  
  // Current time for dynamic greeting
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  // Auth state
  const { isAdmin, user } = useAuth();
  
  // Redirect non-admin users to user dashboard
  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/user/dashboard";
    }
  }, [isAdmin, user]);
  
  // Stats data query
  const { 
    data: stats, 
    isLoading: statsLoading,
    error: statsError
  } = useQuery<Stats>({
    queryKey: ["stats", timePeriod],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/stats?period=${timePeriod}`);
        if (!res.ok) throw new Error("Failed to fetch statistics");
        return await res.json();
      } catch (err) {
        console.error("Stats fetch error:", err);
        throw err;
      }
    },
    retry: 1,
  });
  
  // Activities data using our custom hook
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
    refetch: activitiesRefetch
  } = useActivities(
    // Convert the timePeriod to a compatible type
    timePeriod === 'today' ? 'today' : 
    timePeriod === 'week' ? 'week' : 
    timePeriod === 'month' ? 'month' : 'today', 
    20
  ); // Limit to 20 most recent activities
  
  // Roles summary query
  const {
    data: roleSummaries,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: rolesRefetch
  } = useQuery<RoleSummary[]>({
    queryKey: ["roles-summary"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/roles/summary");
        if (!res.ok) throw new Error("Failed to fetch role summaries");
        return await res.json();
      } catch (err) {
        console.error("Roles summary fetch error:", err);
        throw err;
      }
    },
    retry: 1,
  });
  
  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    // Format current time
    const formatTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    };
    
    formatTime();
    
    // Update time every minute
    const timeInterval = setInterval(formatTime, 60000);
    
    return () => clearInterval(timeInterval);
  }, []);
  
  // Function to get icon for activity type
  const getActivityMeta = (type: ActivityItemType['type']) => {
    switch (type) {
      case 'user_login':
        return {
          icon: <LogIn className="h-4 w-4" />,
          color: 'bg-blue-600/20',
          textColor: 'text-blue-500'
        };
      case 'user_created':
        return {
          icon: <UserPlus className="h-4 w-4" />,
          color: 'bg-green-600/20',
          textColor: 'text-green-500'
        };
      case 'user_updated':
        return {
          icon: <User className="h-4 w-4" />,
          color: 'bg-orange-600/20',
          textColor: 'text-orange-500'
        };
      case 'user_deleted':
        return {
          icon: <UserMinus className="h-4 w-4" />,
          color: 'bg-red-600/20',
          textColor: 'text-red-500'
        };
      case 'role_created':
        return {
          icon: <Shield className="h-4 w-4" />,
          color: 'bg-purple-600/20',
          textColor: 'text-purple-500'
        };
      case 'role_updated':
        return {
          icon: <ShieldCheck className="h-4 w-4" />,
          color: 'bg-indigo-600/20',
          textColor: 'text-indigo-500'
        };
      case 'role_deleted':
        return {
          icon: <Shield className="h-4 w-4" />,
          color: 'bg-red-600/20',
          textColor: 'text-red-500'
        };
      case 'permission_created':
        return {
          icon: <Lock className="h-4 w-4" />,
          color: 'bg-emerald-600/20',
          textColor: 'text-emerald-500'
        };
      case 'permission_updated':
        return {
          icon: <LockOpen className="h-4 w-4" />,
          color: 'bg-teal-600/20',
          textColor: 'text-teal-500'
        };
      case 'permission_deleted':
        return {
          icon: <Key className="h-4 w-4" />,
          color: 'bg-red-600/20',
          textColor: 'text-red-500'
        };
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          color: 'bg-slate-600/20',
          textColor: 'text-slate-500'
        };
    }
  };
  
  // Function to get formatted time from ISO string
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? `${interval} year ago` : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? `${interval} month ago` : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? `${interval} day ago` : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? `${interval} hour ago` : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? `${interval} minute ago` : `${interval} minutes ago`;
    }
    
    if (seconds < 10) return 'just now';
    
    return `${Math.floor(seconds)} seconds ago`;
  };
  
  // Function to get icon for role
  const getRoleIcon = (roleName: string) => {
    const lowerName = roleName.toLowerCase();
    if (lowerName.includes('admin')) {
      return <Shield className="h-4 w-4" />;
    } else if (lowerName.includes('manager')) {
      return <User className="h-4 w-4" />;
    } else if (lowerName.includes('editor')) {
      return <FileSearch className="h-4 w-4" />;
    } else {
      return <UserRound className="h-4 w-4" />;
    }
  };
  
  // Activity Item component
  const ActivityItem = ({ activity }: { activity: ActivityItemType }) => {
    // Format the activity message with highlighted entities
    const formatMessage = (message: string) => {
      const entities = [
        { regex: /"([^"]+)"/g, className: 'text-sky-400 font-medium' },           // Quoted text
        { regex: /@([a-zA-Z0-9_-]+)/g, className: 'text-indigo-400 font-medium' }, // @mentions
        { regex: /#([a-zA-Z0-9_-]+)/g, className: 'text-purple-400 font-medium' }  // #tags
      ];
      
      let parts = [{ text: message, isMatch: false }];
      
      entities.forEach(entity => {
        let newParts: { text: string; isMatch: boolean; className?: string }[] = [];
        
        parts.forEach(part => {
          if (part.isMatch) {
            newParts.push(part);
            return;
          }
          
          const splits = part.text.split(entity.regex);
          if (splits.length === 1) {
            newParts.push(part);
            return;
          }
          
          let lastIndex = 0;
          part.text.replace(entity.regex, (match, p1, offset) => {
            newParts.push({ 
              text: part.text.substring(lastIndex, offset), 
              isMatch: false 
            });
            newParts.push({ 
              text: match, 
              isMatch: true, 
              className: entity.className 
            });
            lastIndex = offset + match.length;
            return match;
          });
          
          if (lastIndex < part.text.length) {
            newParts.push({ 
              text: part.text.substring(lastIndex), 
              isMatch: false 
            });
          }
        });
        
        parts = newParts;
      });
      
      return parts.map((part, index) => 
        part.isMatch ? 
          <span key={index} className="font-medium text-blue-400">{part.text}</span> : 
          <span key={index}>{part.text}</span>
      );
    };
    
    const meta = getActivityMeta(activity.type);
    
    return (
      <div className="relative flex gap-4 pb-8 last:pb-0 group">
        {/* Connector line */}
        <div className="absolute left-[1.1rem] top-[2.3rem] bottom-0 w-px bg-slate-800 group-last:hidden"></div>
        
        {/* Icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm mt-1",
          meta.color
        )}>
          <span className={meta.textColor}>{meta.icon}</span>
        </div>
        
        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium text-white">
              {activity.user?.name || 'System'}
            </span>
            <span className="text-slate-400 line-clamp-2">
              {formatMessage(activity.message)}
            </span>
          </div>
          <time className="mt-1 text-xs text-slate-500">{getTimeAgo(activity.timestamp)}</time>
        </div>
      </div>
    );
  };
  
  // Main RecentActivities component
  // Generate dynamic chart data for the dashboard chart
  const generateChartData = (baseRoles: number, basePermissions: number, baseActiveUsers: number) => {
    const randomFactor = () => 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
    
    return Array.from({ length: 7 }, (_, i) => ({
      name: `Day ${i+1}`,
      roles: Math.round(baseRoles * randomFactor()),
      permissions: Math.round(basePermissions * randomFactor()),
      activeUsers: Math.round(baseActiveUsers * randomFactor())
    }));
  };
  
  // Generate charts data for individual stat cards
  const generateSingleChartData = (baseValue: number) => {
    const randomFactor = () => 0.7 + Math.random() * 0.6; // Random between 0.7 and 1.3
    
    return Array.from({ length: 7 }, (_, i) => ({
      name: `Day ${i+1}`,
      value: Math.round(baseValue * randomFactor())
    }));
  };
  
  // Generate chart data based on stats if available
  const userChartData = stats ? generateSingleChartData(stats.users) : [];
  const roleChartData = stats ? generateSingleChartData(stats.roles) : [];
  const permissionChartData = stats ? generateSingleChartData(stats.permissions) : [];
  const activeUsersChartData = stats ? generateSingleChartData(stats.activeUsers) : [];
  
  // Generate comprehensive chart data for the main dashboard chart
  const dashboardChartData = useMemo(() => {
    if (!stats) return [];
    return generateChartData(stats.roles, stats.permissions, stats.activeUsers);
  }, [stats]);
  
  // Stats data for the dashboard chart
  const dashboardStats = stats ? {
    roles: stats.roles,
    permissions: stats.permissions,
    activeUsers: stats.activeUsers
  } : {
    roles: 0,
    permissions: 0,
    activeUsers: 0
  };

  // Recent Activities component
  const RecentActivities = () => {
    const fetchActivities = () => {
      activitiesRefetch();
    };
    
    return (
      <Card className="border-[1.5px] rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-slate-400 hover:text-white"
              onClick={fetchActivities}
              disabled={activitiesLoading}
            >
              {activitiesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
          
          {activitiesError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load activities. Please try again.
              </AlertDescription>
            </Alert>
          ) : activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 rounded-xl bg-slate-800/70 p-3">
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-white">No activities yet</h3>
              <p className="mt-1 text-xs text-slate-400">
                Activities will appear here as users interact with the system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      description="Monitor system activity and manage users, roles, and permissions."
    >
      <div className="space-y-8">
        {/* Welcome section with time-based greeting */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                  {user?.firstName && user?.lastName ? (
                    <span className="text-white font-semibold text-lg">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {greeting},&nbsp;
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      {user?.firstName || 'Administrator'}!
                    </span>
                  </h1>
                  <p className="text-slate-400 text-sm">{currentTime}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Select
                value={timePeriod}
                onValueChange={(value: any) => setTimePeriod(value)}
              >
                <SelectTrigger className="w-[180px] bg-slate-800 text-white border-slate-700 focus:ring-indigo-500">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="today" className="focus:bg-slate-700">Today</SelectItem>
                  <SelectItem value="week" className="focus:bg-slate-700">This Week</SelectItem>
                  <SelectItem value="month" className="focus:bg-slate-700">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Roles"
            value={stats ? stats.roles : "-"}
            type="number"
            icon={<Shield className="h-5 w-5 text-white" />}
            iconBg="bg-purple-900"
            trend={stats ? stats.rolesTrend : 0}
            trendText={`from previous ${timePeriod}`}
            chartData={roleChartData}
            chartColor="#a855f7"
          />
          
          <StatCard
            title="Total Permissions"
            value={stats ? stats.permissions : "-"}
            type="number"
            icon={<Key className="h-5 w-5 text-white" />}
            iconBg="bg-amber-900"
            trend={stats ? stats.permissionsTrend : 0}
            trendText={`from previous ${timePeriod}`}
            chartData={permissionChartData}
            chartColor="#f59e0b"
          />
          
          <StatCard
            title="Active Users"
            value={stats ? stats.activeUsers : "-"}
            type="number"
            icon={<Users className="h-5 w-5 text-white" />}
            iconBg="bg-blue-900"
            trend={stats ? stats.activeUsersTrend : 0}
            trendText={`from previous ${timePeriod}`}
            chartData={activeUsersChartData}
            chartColor="#3b82f6"
          />
          
          <StatCard
            title="Total Users"
            value={stats ? stats.users : "-"}
            type="number"
            icon={<UserCheck className="h-5 w-5 text-white" />}
            iconBg="bg-indigo-900"
            trend={stats ? stats.usersTrend : 0}
            trendText={`from previous ${timePeriod}`}
            chartData={userChartData}
            chartColor="#8b5cf6"
          />
        </div>
        
        {/* Bottom row with activities and dashboard chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivities />
          
          <DashboardChart 
            title="System Analytics" 
            data={dashboardChartData}
            stats={dashboardStats}
          />
        </div>
      </div>
    </AdminLayout>
  );
}