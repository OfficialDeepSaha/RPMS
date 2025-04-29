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
  AlertCircle as ExclamationCircle,
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
  FileQuestion
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useActivities, ActivityItem as ActivityItemType } from "@/lib/activity-service";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

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
    const timer = setInterval(formatTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Function to get icon for activity type
  const getActivityMeta = (type: ActivityItemType['type']) => {
    switch (type) {
      case 'user_created':
        return {
          icon: <UserPlus className="h-5 w-5 text-emerald-500" />,
          iconBg: "bg-emerald-900/10",
          iconColor: "text-emerald-600",
        };
      case 'role_updated':
        return {
          icon: <Shield className="h-5 w-5 text-blue-500" />,
          iconBg: "bg-blue-900/10",
          iconColor: "text-blue-600",
        };
      case 'permission_added':
        return {
          icon: <KeySquare className="h-5 w-5 text-purple-500" />,
          iconBg: "bg-purple-900/10",
          iconColor: "text-purple-600",
        };
      case 'user_deactivated':
        return {
          icon: <UserMinus className="h-5 w-5 text-rose-500" />,
          iconBg: "bg-rose-900/10",
          iconColor: "text-rose-600",
        };
      case 'role_created':
        return {
          icon: <FolderPlus size={18} className="text-teal-500" />,
          iconBg: "bg-teal-900/10",
          iconColor: "text-teal-600",
        };
      case 'permission_created':
        return {
          icon: <Shield size={18} className="text-indigo-500" />,
          iconBg: "bg-indigo-900/10",
          iconColor: "text-indigo-600",
        };
      case 'user_login':
        return {
          icon: <UserCheck size={18} className="text-amber-500" />,
          iconBg: "bg-amber-900/10",
          iconColor: "text-amber-600",
        };
      case 'settings_updated':
        return {
          icon: <Settings size={18} className="text-slate-500" />,
          iconBg: "bg-slate-900/10",
          iconColor: "text-slate-600",
        };
      case 'user_updated':
        return {
          icon: <User size={18} className="text-blue-500" />,
          iconBg: "bg-blue-900/10",
          iconColor: "text-blue-600",
        };
      case 'role_deleted':
        return {
          icon: <Shield size={18} className="text-red-500" />,
          iconBg: "bg-red-900/10",
          iconColor: "text-red-600",
        };
      default:
        return {
          icon: <Activity className="h-5 w-5 text-gray-500" />,
          iconBg: "bg-gray-900/10",
          iconColor: "text-gray-600",
        };
    }
  };
  
  // Function to get formatted time from ISO string
  const getTimeAgo = (dateString: string) => {
    try {
      // Check if dateString is valid
      if (!dateString || isNaN(new Date(dateString).getTime())) {
        return 'Unknown date';
      }
      
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return 'just now';
      }
      
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      }
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Yesterday';
      }
      
      if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      }
      
      // Format as a date if older than a week
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown date";
    }
  };
  
  // Function to get icon for role
  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) {
      return <Shield size={16} className="text-red-500" />;
    } else if (name.includes('manager')) {
      return <Users size={16} className="text-blue-500" />;
    } else if (name.includes('editor')) {
      return <ClipboardList size={16} className="text-teal-500" />;
    } else if (name.includes('viewer')) {
      return <BarChart3 size={16} className="text-purple-500" />;
    } else {
      return <Tag size={16} className="text-gray-500" />;
    }
  };
  
  // Activity Item component
  const ActivityItem = ({ activity }: { activity: ActivityItemType }) => {
    // Format the activity message with highlighted entities
    const formatMessage = (message: string) => {
      let formattedMessage = message;
      
      // Handle user actions
      if (message.includes('User ')) {
        formattedMessage = formattedMessage.replace(/User\s+([^"]+?)\s+was/g, 'User <strong class="text-indigo-600">$1</strong> was');
      }
      
      // Handle role actions
      if (message.includes('Role ')) {
        formattedMessage = formattedMessage.replace(/Role\s+["']([^"']+)["']/g, 'Role <strong class="text-purple-600">"$1"</strong>');
      }
      
      // Handle permission actions
      if (message.includes('Permission ')) {
        formattedMessage = formattedMessage.replace(/Permission\s+["']([^"']+)["']/g, 'Permission <strong class="text-emerald-600">"$1"</strong>');
      }
      
      // Highlight action verbs
      formattedMessage = formattedMessage.replace(/(created|updated|deleted|logged in|assigned|removed)/gi, 
        '<span class="text-blue-600">$1</span>');
      
      return formattedMessage;
    };

    // Get icon and styling based on activity type
    const { icon, iconBg, iconColor } = getActivityMeta(activity.type);
    
    return (
      <div className="px-5 py-4 hover:bg-gradient-to-r hover:from-indigo-50/70 hover:to-white transition-all duration-300 group/item relative">
        {/* Left border indicator that animates on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-200 group-hover/item:bg-indigo-400 group-hover/item:h-full transition-all duration-300"></div>
        
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center shadow-sm group-hover/item:shadow-md transition-all duration-300 border border-indigo-100 group-hover/item:border-indigo-200`}>
              {icon}
              {/* Subtle pulse effect */}
              <span className="absolute inset-0 rounded-xl bg-indigo-400/0 group-hover/item:bg-indigo-400/10 group-hover/item:animate-pulse-slow transition-colors duration-300"></span>
            </div>
          </div>
          
          <div className="flex-1 space-y-1.5">
            <div 
              className="text-sm text-slate-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMessage(activity.message) }}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center bg-slate-50 px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                <Clock className="h-3 w-3 mr-1.5 text-slate-400" />
                {getTimeAgo(activity.timestamp)}
              </div>
              
              <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                <UserRound className="h-3 w-3 mr-1.5" />
                {activity.user.name || 'System'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main RecentActivities component
  const RecentActivities = () => {
    const [period, setPeriod] = useState('day');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activities, setActivities] = useState<ActivityItemType[]>([]);

    const fetchActivities = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/activities?period=${period}`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setError('Failed to load activities. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchActivities();
    }, [period]);

    return (
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="p-6 bg-gradient-to-r from-indigo-50/80 to-white border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 border border-indigo-200/60 shadow-sm">
                <Activity className="h-5 w-5 text-indigo-600" />
                {/* Animated ring */}
                <span className="absolute inset-0 rounded-xl border border-indigo-400/30 animate-pulse-slow"></span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Recent Activities</h3>
                <p className="text-sm text-slate-500">System events and user actions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={period}
                onValueChange={setPeriod}
              >
                <SelectTrigger className="border-slate-200 shadow-sm bg-white h-9 w-[140px] text-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 hours</SelectItem>
                  <SelectItem value="week">Last week</SelectItem>
                  <SelectItem value="month">Last month</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                size="sm"
                variant="outline"
                className="h-9 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                onClick={fetchActivities}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {isLoading && activities.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin"></div>
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin absolute" />
              </div>
              <p className="text-slate-500 text-sm">Loading activities...</p>
            </div>
          ) : error ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="relative h-16 w-16 flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-slate-700 font-medium mb-1">Failed to load activities</p>
              <p className="text-slate-500 text-sm mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchActivities} 
                className="border-red-200 text-red-600 hover:bg-red-50"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Try Again
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="relative h-16 w-16 flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-slate-100 rounded-full animate-pulse opacity-50"></div>
                <div className="relative h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileQuestion className="h-6 w-6 text-slate-400" />
                </div>
              </div>
              <p className="text-slate-700 font-medium mb-1">No activities found</p>
              <p className="text-slate-500 text-sm">No system activities in the selected period</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-slate-50">
              {activities.map((activity, index) => (
                <div 
                  key={activity.id || index} 
                  className="animate-fadeIn" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ActivityItem activity={activity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Dashboard" description="System overview and statistics">
      {/* Futuristic Dashboard Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-indigo-500/30 shadow-xl bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950">
        {/* Animated glowing elements */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/30 rounded-full filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 -left-20 w-64 h-64 bg-indigo-500/30 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
          
          {/* Digital circuit lines */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMwIDVMMzAgMzAgMzAgNTUiPjwvcGF0aD48cGF0aCBkPSJNNSAzMEwzMCAzMCA1NSAzMCI+PC9wYXRoPjwvZz48L3N2Zz4=')]"></div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 rounded-full bg-blue-400/80"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${3 + Math.random() * 8}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>
          
          {/* Geometric decoration */}
          <div className="absolute right-10 bottom-10 w-32 h-32 border-2 border-white/10 rounded-lg rotate-12 opacity-20"></div>
          <div className="absolute right-20 bottom-20 w-24 h-24 border-2 border-white/10 rounded-full opacity-20"></div>
          <div className="absolute left-10 top-20 w-16 h-16 border-2 border-white/10 rounded-lg -rotate-12 opacity-20"></div>
        </div>
        
        <div className="relative z-10 p-8">
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-blue-100 mb-3 border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                <span>System Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 flex items-center">
                {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-pink-300 ml-1.5">Administrator</span>
              </h1>
              <div className="flex items-center text-blue-200/80 text-sm backdrop-blur-sm w-fit py-1 px-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                <Clock className="h-3.5 w-3.5 mr-2" />
                <span>{currentTime}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md group transition-all duration-300">
                <Bell className="h-4 w-4 mr-2 group-hover:animate-wiggle" />
                Notifications
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md group transition-all duration-300">
                <Settings className="h-4 w-4 mr-2 group-hover:animate-spin-slow" />
                Settings
              </Button>
            </div>
          </div>
          
          <div className="relative mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 z-10">
            <div className="flex items-center gap-3 rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-300 group">
              <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300 relative">
                <Users className="h-5 w-5 text-blue-300" />
                <span className="absolute inset-0 bg-blue-400/0 group-hover:bg-blue-400/20 rounded-xl group-hover:animate-pulse transition-all duration-300"></span>
              </div>
              <div>
                <div className="text-xs text-white/70 mb-0.5">Total Users</div>
                <div className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-white/20" /> : 
                   stats?.users.toLocaleString() || '0'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-300 group">
              <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all duration-300 relative">
                <Shield className="h-5 w-5 text-indigo-300" />
                <span className="absolute inset-0 bg-indigo-400/0 group-hover:bg-indigo-400/20 rounded-xl group-hover:animate-pulse transition-all duration-300"></span>
              </div>
              <div>
                <div className="text-xs text-white/70 mb-0.5">Total Roles</div>
                <div className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-white/20" /> : 
                   stats?.roles.toLocaleString() || '0'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-300 group">
              <div className="bg-purple-500/20 p-2.5 rounded-xl border border-purple-500/20 group-hover:border-purple-500/40 transition-all duration-300 relative">
                <Key className="h-5 w-5 text-purple-300" />
                <span className="absolute inset-0 bg-purple-400/0 group-hover:bg-purple-400/20 rounded-xl group-hover:animate-pulse transition-all duration-300"></span>
              </div>
              <div>
                <div className="text-xs text-white/70 mb-0.5">Permissions</div>
                <div className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-white/20" /> : 
                   stats?.permissions.toLocaleString() || '0'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-300 group">
              <div className="bg-cyan-500/20 p-2.5 rounded-xl border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all duration-300 relative">
                <UserCheck className="h-5 w-5 text-cyan-300" />
                <span className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/20 rounded-xl group-hover:animate-pulse transition-all duration-300"></span>
              </div>
              <div>
                <div className="text-xs text-white/70 mb-0.5">Active Users</div>
                <div className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-white/20" /> : 
                   stats?.activeUsers.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.users}
              icon={<Users className="h-5 w-5 text-blue-500" />}
              iconBg="bg-blue-50"
              trend={stats?.usersTrend || 0}
              loading={statsLoading}
              chartColor="blue"
              period={timePeriod}
            />
            <StatCard
              title="Total Roles"
              value={stats?.roles}
              icon={<Shield className="h-5 w-5 text-purple-500" />}
              iconBg="bg-purple-50"
              trend={stats?.rolesTrend || 0}
              loading={statsLoading}
              chartColor="purple"
              period={timePeriod}
            />
            <StatCard
              title="Permissions"
              value={stats?.permissions}
              icon={<Key className="h-5 w-5 text-amber-500" />}
              iconBg="bg-amber-50"
              trend={stats?.permissionsTrend || 0}
              loading={statsLoading}
              chartColor="amber"
              period={timePeriod}
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers}
              icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
              iconBg="bg-emerald-50"
              trend={stats?.activeUsersTrend || 0}
              loading={statsLoading}
              chartColor="emerald"
              period={timePeriod}
            />
      </div>

          {/* Roles Overview section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md hover:border-purple-200/70 group">
            <div className="p-6 pb-4 bg-gradient-to-r from-purple-50/80 to-white border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                  <div className="relative mr-3 p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:border-purple-500/40 transition-all duration-300">
                    <Shield className="h-5 w-5 text-purple-500" />
                    {/* Animated pulse on hover */}
                    <span className="absolute inset-0 rounded-xl bg-purple-400/0 group-hover:bg-purple-400/30 group-hover:animate-pulse-slow transition-colors duration-300 opacity-0 group-hover:opacity-100"></span>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight group-hover:text-purple-700 transition-colors">
                    Roles Overview
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center text-purple-500 border-purple-200 hover:bg-purple-50 hover:text-purple-600 transition-all duration-300"
                  onClick={() => rolesRefetch()}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1 group-hover:animate-spin-slow" />
                  Refresh
                </Button>
              </div>
              <p className="text-sm text-slate-500 ml-11">
              Summary of roles in the system
            </p>
          </div>
            
            {/* Roles list items */}
          <div className="p-0">
            {rolesError ? (
              <div className="px-6 py-8 text-center">
                  <div className="inline-flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-100 mb-3 relative">
                    <div className="absolute inset-0 bg-red-200/50 rounded-full animate-ping opacity-75"></div>
                    <ExclamationCircle className="h-6 w-6 text-red-500 relative z-10" />
                  </div>
                <p className="text-sm text-slate-600 mb-3">
                  Failed to load role data
                </p>
                <Button
                  variant="outline"
                  size="sm"
                    className="transition-all border-red-200 hover:bg-red-50 text-red-600"
                  onClick={() => rolesRefetch()}
                >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Try Again
                </Button>
              </div>
            ) : rolesLoading ? (
                <div className="space-y-4 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-lg animate-pulse">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full max-w-[250px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-12 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-0 divide-y divide-slate-100 max-h-[350px] overflow-y-auto scrollbar-thin">
                {roleSummaries && roleSummaries.length > 0 ? (
                    roleSummaries.map((role, index) => (
                      <div 
                        key={role.id} 
                        className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-purple-50/70 hover:to-white transition-all duration-300 group/role relative"
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          animation: 'fadeIn 0.5s ease-out forwards',
                          opacity: 0 
                        }}
                      >
                        {/* Left highlight bar */}
                        <div className="absolute left-0 inset-y-0 w-[3px] bg-transparent group-hover/role:bg-purple-400 transition-all duration-300"></div>
                        
                        <div className="flex-shrink-0 rounded-xl p-2.5 bg-purple-100/70 border border-purple-200/50 group-hover/role:border-purple-300 transition-all duration-300 relative">
                          {getRoleIcon(role.name)}
                          <span className="absolute inset-0 rounded-xl bg-purple-400/0 group-hover/role:bg-purple-400/30 transition-colors duration-300"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium group-hover/role:text-purple-700 transition-colors">{role.name}</div>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {role.description || 'No description provided'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-xs bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-full group-hover/role:bg-purple-100 group-hover/role:text-purple-700 transition-all duration-300">
                            <Users size={14} className="mr-1.5" />
                            {role.userCount}
                          </div>
                          <div className="flex items-center text-xs bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-full group-hover/role:bg-purple-100 group-hover/role:text-purple-700 transition-all duration-300">
                            <Key size={14} className="mr-1.5" />
                            {role.permissionCount}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400 hover:text-purple-500 hover:bg-purple-50 transition-all duration-300 hover:scale-110">
                            <ChevronRight size={16} />
                            <span className="sr-only">View role details</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Shield className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">No roles found</p>
                      <p className="text-xs text-slate-500 mb-4">There are no roles defined in the system yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create Role
                      </Button>
                  </div>
                )}
              </div>
            )}
          </div>
            <div className="px-6 py-3 bg-gradient-to-r from-purple-50/80 to-white border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-300 group"
              >
                View All Roles
                <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
  
        {/* Right Column */}
        <div className="col-span-1 space-y-6">
          {/* Time period selector */}
          <div className="bg-white p-3 rounded-2xl border flex gap-2 mb-4">
            <Button 
              variant={timePeriod === 'today' ? 'default' : 'outline'} 
              size="sm" 
              className={cn(
                "flex-1 text-sm",
                timePeriod === 'today' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-600'
              )}
              onClick={() => setTimePeriod('today')}
            >
              Today
            </Button>
            <Button 
              variant={timePeriod === 'week' ? 'default' : 'outline'} 
              size="sm" 
              className={cn(
                "flex-1 text-sm",
                timePeriod === 'week' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-600'
              )}
              onClick={() => setTimePeriod('week')}
            >
              This Week
            </Button>
            <Button
              variant={timePeriod === 'month' ? 'default' : 'outline'} 
              size="sm"
              className={cn(
                "flex-1 text-sm",
                timePeriod === 'month' ? 'bg-indigo-500 hover:bg-indigo-600' : 'hover:bg-indigo-50 hover:text-indigo-600'
              )}
              onClick={() => setTimePeriod('month')}
            >
              This Month
            </Button>
          </div>
  
          {/* Recent Activity section */}
          <RecentActivities />
          
          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md hover:border-teal-200/70 group">
            <div className="p-6 pb-4 bg-gradient-to-r from-teal-50/80 to-white border-b">
              <div className="flex items-center mb-2">
                <div className="relative mr-3 p-2 bg-teal-500/10 rounded-xl border border-teal-500/20 group-hover:border-teal-500/40 transition-all duration-300">
                  <Zap className="h-5 w-5 text-teal-500" />
                  {/* Animated pulse on hover */}
                  <span className="absolute inset-0 rounded-xl bg-teal-400/0 group-hover:bg-teal-400/30 group-hover:animate-pulse-slow transition-colors duration-300 opacity-0 group-hover:opacity-100"></span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight group-hover:text-teal-700 transition-colors">
                  Quick Actions
                </h3>
              </div>
              <p className="text-sm text-slate-500 ml-11">
                Common administrative tasks
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex flex-col h-24 items-center justify-center space-y-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-500/0 group-hover/btn:bg-indigo-500/5 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500/0 group-hover/btn:bg-indigo-500/70 transition-all duration-300 transform scale-x-0 group-hover/btn:scale-x-100 origin-left"></div>
                <UserPlus className="h-6 w-6 text-slate-500 group-hover/btn:text-indigo-500 group-hover/btn:scale-110 transition-all duration-300" />
                <span className="text-sm relative z-10">Add User</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 items-center justify-center space-y-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-purple-500/0 group-hover/btn:bg-purple-500/5 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500/0 group-hover/btn:bg-purple-500/70 transition-all duration-300 transform scale-x-0 group-hover/btn:scale-x-100 origin-left"></div>
                <Shield className="h-6 w-6 text-slate-500 group-hover/btn:text-purple-500 group-hover/btn:scale-110 transition-all duration-300" />
                <span className="text-sm relative z-10">Create Role</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 items-center justify-center space-y-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-teal-500/0 group-hover/btn:bg-teal-500/5 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500/0 group-hover/btn:bg-teal-500/70 transition-all duration-300 transform scale-x-0 group-hover/btn:scale-x-100 origin-left"></div>
                <Key className="h-6 w-6 text-slate-500 group-hover/btn:text-teal-500 group-hover/btn:scale-110 transition-all duration-300" />
                <span className="text-sm relative z-10">Add Permission</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-24 items-center justify-center space-y-2 border-slate-200 hover:border-amber-300 hover:bg-amber-50 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-amber-500/0 group-hover/btn:bg-amber-500/5 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/0 group-hover/btn:bg-amber-500/70 transition-all duration-300 transform scale-x-0 group-hover/btn:scale-x-100 origin-left"></div>
                <BarChart3 className="h-6 w-6 text-slate-500 group-hover/btn:text-amber-500 group-hover/btn:scale-110 transition-all duration-300" />
                <span className="text-sm relative z-10">View Reports</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface StatCardProps {
  title: string;
  value?: number;
  icon: React.ReactNode;
  iconBg: string;
  trend: number;
  loading?: boolean;
  chartColor: string;
  period: 'today' | 'week' | 'month' | 'thisWeek' | 'thisMonth' | 'thisYear';
}

function StatCard({ title, value, icon, iconBg, trend, loading = false, chartColor, period }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-[1.5px] transition-all duration-300 hover:shadow-lg group rounded-xl border-slate-200/60 hover:border-indigo-300/70 bg-white/60 backdrop-blur-sm">
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br from-${chartColor}-50/50 to-white/0 filter blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300`}></div>
      </div>
      
      {/* Digital circuit lines */}
      <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMwIDVMMzAgMzAgMzAgNTUiPjwvcGF0aD48cGF0aCBkPSJNNSAzMEwzMCAzMCA1NSAzMCI+PC9wYXRoPjwvZz48L3N2Zz4=')]"></div>
      </div>
      
      {loading ? (
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-9 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      ) : (
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{title}</h3>
            <div className={`${iconBg} p-2.5 rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-md border border-transparent group-hover:border-${chartColor}-200 relative overflow-hidden`}>
              {/* Inner glow effect */}
              <div className={`absolute inset-0 bg-${chartColor}-500/0 group-hover:bg-${chartColor}-500/10 transition-colors duration-300 rounded-xl`}></div>
              <div className="relative z-10">{icon}</div>
            </div>
          </div>
          
          <div className="flex items-end gap-2.5 mb-2 relative z-10">
            <span className="text-3xl font-bold tracking-tight text-slate-800 group-hover:text-indigo-700 transition-colors duration-300">
              {value?.toLocaleString() || '0'}
            </span>
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium flex items-center",
              trend > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            )}>
              {trend > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
              {Math.abs(trend)}%
            </div>
          </div>
          
          <p className="text-sm text-slate-500 flex items-center relative z-10">
            <span>{trend > 0 ? 'Increased' : 'Decreased'} from previous {period}</span>
          </p>
          
          {/* Decorative glowing dot */}
          <div className={`absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full bg-${chartColor}-400 opacity-60 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300`}></div>
        </CardContent>
      )}
    </Card>
  );
}