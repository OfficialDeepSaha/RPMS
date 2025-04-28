import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  ShieldCheck, 
  Key, 
  UserCheck,
  UserPlus,
  Layers,
  KeySquare,
  UserMinus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  users: number;
  roles: number;
  permissions: number;
  activeUsers: number;
}

interface Activity {
  id: number;
  type: "user_created" | "role_updated" | "permission_added" | "user_deactivated";
  content: string;
  time: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface RoleSummary {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
  icon: React.ReactNode;
  iconBg: string;
}

// Mock activity data
const activities: Activity[] = [
  {
    id: 1,
    type: "user_created",
    content: "<span class='font-medium'>New user</span> was created by admin",
    time: "2 hours ago",
    icon: <UserPlus className="text-primary" />,
    iconBg: "bg-blue-100",
  },
  {
    id: 2,
    type: "role_updated",
    content: "<span class='font-medium'>Admin role</span> permissions updated",
    time: "5 hours ago",
    icon: <ShieldCheck className="text-secondary" />,
    iconBg: "bg-green-100",
  },
  {
    id: 3,
    type: "permission_added",
    content: "<span class='font-medium'>New permission</span> \"Manage Reports\" added",
    time: "Yesterday",
    icon: <KeySquare className="text-accent" />,
    iconBg: "bg-indigo-100",
  },
  {
    id: 4,
    type: "user_deactivated",
    content: "<span class='font-medium'>User John Doe</span> deactivated",
    time: "Yesterday",
    icon: <UserMinus className="text-error" />,
    iconBg: "bg-red-100",
  },
];

// Mock role summaries
const roleSummaries: RoleSummary[] = [
  {
    id: 1,
    name: "Administrator",
    description: "All permissions",
    userCount: 3,
    permissionCount: 32,
    icon: <Users className="text-primary" />,
    iconBg: "bg-blue-100",
  },
  {
    id: 2,
    name: "Manager",
    description: "Limited admin access",
    userCount: 8,
    permissionCount: 24,
    icon: <ShieldCheck className="text-secondary" />,
    iconBg: "bg-green-100",
  },
  {
    id: 3,
    name: "Editor",
    description: "Content management",
    userCount: 6,
    permissionCount: 12,
    icon: <Layers className="text-warning" />,
    iconBg: "bg-yellow-100",
  },
  {
    id: 4,
    name: "Viewer",
    description: "Read-only access",
    userCount: 7,
    permissionCount: 5,
    icon: <Users className="text-purple-500" />,
    iconBg: "bg-purple-100",
  },
];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  return (
    <AdminLayout title="Dashboard" description="System overview and statistics">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mt-4 md:mt-0">
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-primary rounded-full text-sm font-medium">Today</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">This Week</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">This Month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat Cards */}
        <StatCard
          title="Total Users"
          value={stats?.users}
          icon={<Users className="text-primary text-xl" />}
          iconBg="bg-blue-100"
          trend={+12}
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Roles"
          value={stats?.roles}
          icon={<ShieldCheck className="text-secondary text-xl" />}
          iconBg="bg-green-100"
          trend={+5}
          loading={statsLoading}
        />
        
        <StatCard
          title="Total Permissions"
          value={stats?.permissions}
          icon={<Key className="text-accent text-xl" />}
          iconBg="bg-indigo-100"
          trend={+8}
          loading={statsLoading}
        />
        
        <StatCard
          title="Active Users"
          value={stats?.activeUsers}
          icon={<UserCheck className="text-warning text-xl" />}
          iconBg="bg-yellow-100"
          trend={-3}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Recent Activity</h3>
              <button className="text-primary text-sm font-medium">View All</button>
            </div>
            
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start py-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0", activity.iconBg)}>
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: activity.content }}></p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Roles Overview</h3>
              <button className="text-primary text-sm font-medium">View All</button>
            </div>
            
            <div className="space-y-4 mb-4">
              {roleSummaries.map(role => (
                <div key={role.id} className="flex items-center justify-between pb-2">
                  <div className="flex items-center">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3", role.iconBg)}>
                      {role.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{role.name}</p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{role.userCount} users</p>
                    <p className="text-xs text-gray-500">{role.permissionCount} permissions</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-full py-2 rounded-lg text-sm font-medium transition-colors">
              Add New Role
            </button>
          </CardContent>
        </Card>
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
}

function StatCard({ title, value, icon, iconBg, trend, loading = false }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <h3 className="text-2xl font-semibold mt-1">{value}</h3>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", iconBg)}>
            {icon}
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <span className={cn("flex items-center", trend > 0 ? "text-success" : "text-error")}>
            {trend > 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-500 ml-2">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
