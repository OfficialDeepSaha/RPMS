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
    const formatMessage = (message: string) => {
      // Enhanced message formatting with better highlighting
      return message.replace(
        /(created|updated|deleted|added|removed|assigned|logged in|logged out)/gi,
        '<span class="font-medium text-indigo-400">$1</span>'
      );
    };
    
    const meta = getActivityMeta(activity.type);
    const timeAgo = getTimeAgo(activity.timestamp);
    
    return (
      <div className="flex items-start gap-3 p-4 group-hover/item:bg-slate-800/20 transition-colors duration-300">
        <div className={`${meta.color} rounded-full p-2 flex-shrink-0 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-3`}>
          <div className={meta.textColor}>{meta.icon}</div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-x-2">
            <div className="font-medium text-slate-200 truncate transition-colors duration-300 group-hover/item:text-white">
              {activity.user?.name || 'System'}
            </div>
            <div className="text-xs text-slate-500 flex-shrink-0 whitespace-nowrap transition-colors duration-300 group-hover/item:text-slate-400">
              {timeAgo}
            </div>
          </div>
          
          <div 
            className="text-sm text-slate-400 mt-1 transition-colors duration-300 group-hover/item:text-slate-300"
            dangerouslySetInnerHTML={{ __html: formatMessage(activity.message) }}
          />
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
      <Card className="bg-gradient-to-br from-slate-950/90 to-slate-900/80 backdrop-blur-lg border-0 shadow-lg rounded-xl overflow-hidden group">
        {/* Glass border effect */}
        <div className="absolute inset-0 rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-700/10 to-slate-700/5 pointer-events-none"></div>
        
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 group-hover:opacity-20 transition-opacity duration-700"></div>
        
        <CardContent className="p-0 relative z-10">
          <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
            <h3 className="text-base font-medium text-slate-200 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              Recent Activities
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchActivities} 
              className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-300 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {activitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-sm text-slate-400">Loading activities...</p>
              </div>
            ) : activitiesError ? (
              <div className="p-5">
                <Alert variant="destructive" className="bg-red-950/30 border-red-900/50 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load activities. Please try again.
                  </AlertDescription>
                </Alert>
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-5">
                <FileQuestion className="h-16 w-16 text-slate-600 mb-3" />
                <p className="text-center text-slate-400 mb-1">No recent activities found</p>
                <p className="text-center text-sm text-slate-500">Activities will appear here as users interact with the system</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {activities.map((activity, index) => (
                  <li 
                    key={activity.id} 
                    className="relative group/item"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <ActivityItem activity={activity} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout 
      title="Admin Dashboard"
      description="Monitor system activity and manage users, roles, and permissions."
    >
      {/* Futuristic animated greeting card */}
      <div className="mb-6">
        <Card className="border-0 shadow-2xl rounded-xl overflow-hidden bg-gradient-to-br from-slate-950/90 to-slate-900/80 backdrop-blur-lg relative">
          {/* Glass border effect */}
          <div className="absolute inset-0 rounded-xl border border-slate-700/30 pointer-events-none"></div>
          
          {/* Animated background patterns */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC41KSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMzAgNUwzMCAzMCAzMCA1NSI+PC9wYXRoPjxwYXRoIGQ9Ik01IDMwTDMwIDMwIDU1IDMwIj48L3BhdGg+PC9nPjwvc3ZnPg==')]"></div>
            
            {/* Animated glowing orbs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-blue-500/10 filter blur-xl animate-pulse-slow"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-indigo-500/10 filter blur-xl animate-pulse-slow animation-delay-2000"></div>
          </div>
          
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-start md:items-center p-6 relative z-10">
              {/* User avatar with animated border */}
              <div className="mr-4 mb-4 md:mb-0 relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-spin-slow opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative border border-slate-700/50 shadow-inner overflow-hidden">
                  <span className="text-xl font-bold text-blue-200">
                    {user?.firstName?.charAt(0) || "A"}
                    {user?.lastName?.charAt(0) || "U"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10"></div>
                </div>
              </div>
              
              {/* Greeting text with animations */}
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-100 to-blue-100 animate-fadeIn">
                  {greeting}, {user?.firstName || "Admin"}!
                </h2>
                <p className="text-slate-400 mt-1 animate-fadeIn" style={{ animationDelay: '100ms' }}>
                  {currentTime}
                </p>
              </div>
              
              {/* Date filter */}
              <div className="mt-4 md:mt-0 self-stretch flex items-center animate-fadeIn" style={{ animationDelay: '200ms' }}>
                <Select
                  value={timePeriod}
                  onValueChange={(value: any) => setTimePeriod(value)}
                >
                  <SelectTrigger className="w-36 bg-slate-900/50 border-slate-700/50 text-slate-300 rounded-lg">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Stats grid with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Apply staggered animation delay to each card */}
        <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <StatCard
            title="Total Roles"
            value={stats?.roles || 0}
            icon={<Shield className="h-4 w-4 text-purple-200" />}
            iconBg="bg-purple-900/50"
            trend={stats?.rolesTrend || 0}
            chartData={generateSingleChartData(stats?.roles || 4)}
            chartColor="#a855f7"
          />
        </div>
        
        <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <StatCard
            title="Total Permissions"
            value={stats?.permissions || 0}
            icon={<Key className="h-4 w-4 text-amber-200" />}
            iconBg="bg-amber-900/50"
            trend={stats?.permissionsTrend || 0}
            chartData={generateSingleChartData(stats?.permissions || 5)}
            chartColor="#f59e0b"
          />
        </div>
        
        <div className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={<UserCheck className="h-4 w-4 text-blue-200" />}
            iconBg="bg-blue-900/50"
            trend={stats?.activeUsersTrend || 0}
            chartData={generateSingleChartData(stats?.activeUsers || 2)}
            chartColor="#3b82f6"
          />
        </div>
        
        <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <StatCard
            title="Total Users"
            value={stats?.users || 0}
            icon={<Users className="h-4 w-4 text-emerald-200" />}
            iconBg="bg-emerald-900/50"
            trend={stats?.usersTrend || 0}
            chartData={generateSingleChartData(stats?.users || 2)}
            chartColor="#10b981"
          />
        </div>
      </div>
      
      {/* Dashboard charts and activities with staggered animation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fadeIn" style={{ animationDelay: '500ms' }}>
          {statsLoading ? (
            <Card className="border-0 bg-slate-900/80 backdrop-blur-lg rounded-xl shadow-lg h-[500px] flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </Card>
          ) : statsError ? (
            <Alert variant="destructive" className="mb-4 bg-red-950/30 border-red-900/50 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load statistics. Please try again.</AlertDescription>
            </Alert>
          ) : (
            <DashboardChart 
              data={generateChartData(
                stats?.roles || 4, 
                stats?.permissions || 5, 
                stats?.activeUsers || 2
              )}
              stats={{
                roles: stats?.roles || 4,
                permissions: stats?.permissions || 5,
                activeUsers: stats?.activeUsers || 2
              }}
            />
          )}
        </div>
        
        <div className="animate-fadeIn" style={{ animationDelay: '600ms' }}>
          <RecentActivities />
        </div>
      </div>
    </AdminLayout>
  );
}