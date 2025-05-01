import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import UserLayout from "@/components/layout/user-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Shield, 
  Key, 
  Info, 
  Clock, 
  Calendar,
  CheckCircle, 
  XCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Flag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Define type for Role with permissions
interface ExtendedRole {
  id: number;
  name: string;
  description: string | null;
  permissions?: number[]; // Array of permission IDs
}

export default function UserDashboard() {
  // React Router location includes search query
  const location = useLocation();
  const { userPermissions, userRoles, isAdmin } = useAuth();
  const [selectedPermission, setSelectedPermission] = useState<string | null>(null);
  const [permissionDetails, setPermissionDetails] = useState<any>(null);
  const [animateCards, setAnimateCards] = useState(false);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      window.location.href = "/admin/dashboard";
    }
  }, [isAdmin]);

  // Parse the permission from the URL query parameter when search or permissions change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const permissionParam = params.get("permission");
    
    if (permissionParam && userPermissions.some(p => p.name === permissionParam)) {
      setSelectedPermission(permissionParam);
      // Find the permission details
      const permDetail = userPermissions.find(p => p.name === permissionParam);
      setPermissionDetails(permDetail);
    } else if (userPermissions.length > 0) {
      // Default to the first permission if none is selected
      setSelectedPermission(userPermissions[0].name);
      setPermissionDetails(userPermissions[0]);
    }

    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setAnimateCards(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.search, userPermissions]);

  // Get roles that grant this permission
  const rolesWithPermission = userRoles.filter(role => {
    return (role as ExtendedRole).permissions?.some(
      (permId: number) => permId === permissionDetails?.id
    );
  });

  const permissionSource = rolesWithPermission.length > 0 
    ? `Granted via role${rolesWithPermission.length > 1 ? 's' : ''}: ${rolesWithPermission.map(r => r.name).join(', ')}`
    : 'Directly assigned to your user account';
  
  // Format date for "granted at" (mock data, could be replaced with real data)
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <UserLayout title={selectedPermission || "Dashboard"} selectedPermission={selectedPermission || undefined}>
      {userPermissions.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/70 overflow-hidden transform transition-all duration-500 hover:shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
          <CardContent className="p-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-200/50">
                <Shield className="h-9 w-9 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">No Permissions Assigned</h3>
              <p className="text-slate-500 mb-6">
                You currently don't have any permissions assigned to your account. 
                Please contact your system administrator to request access to system features.
              </p>
              <div className="p-4 bg-amber-50/80 rounded-xl text-amber-700 text-sm border border-amber-200/70 shadow-sm">
                <h4 className="font-medium mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1.5" />
                  What are permissions?
                </h4>
                <p>
                  Permissions determine what actions you can perform in the system. 
                  Each permission grants access to specific features or functionality.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !selectedPermission ? (
        <Card className={cn(
          "bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/70 overflow-hidden transform transition-all duration-500",
          animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-500"></div>
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-slate-200/70">
                <Info className="h-9 w-9 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">Select a Permission</h3>
              <p className="text-slate-500 mb-6">
                Please select a permission from the sidebar to view its content and access the related features.
              </p>
              <div className="flex justify-center">
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md">
                  <Eye className="h-4 w-4 mr-2" />
                  View Available Permissions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Permission Details Card */}
          <Card className={cn(
            "bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/70 overflow-hidden transform transition-all duration-500",
            animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            <div className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 p-6 border-b border-slate-200/70 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute h-40 w-40 rounded-full bg-indigo-700 blur-3xl -top-20 -right-20"></div>
                <div className="absolute h-32 w-32 rounded-full bg-violet-700 blur-3xl -bottom-10 -left-10"></div>
              </div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl flex items-center justify-center mr-4 border border-indigo-500/20 shadow-md">
                    <Key className="h-7 w-7 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      {permissionDetails?.name || selectedPermission}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {permissionDetails?.category || 'Uncategorized'} • Permission
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white/80 text-indigo-700 border-indigo-200 shadow-sm">
                  Active
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-700 mb-6">
                    {permissionDetails?.description || 'This permission grants access to specific system functionality.'}
                  </p>
                  
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Source</h4>
                  <div className="flex items-center p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/60">
                    <Shield className="h-5 w-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-slate-700 text-sm font-medium">{permissionSource}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        This determines how you received this permission
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 p-5 rounded-xl border border-slate-200/60 shadow-sm">
                  <h4 className="text-sm font-medium text-slate-600 mb-4 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5 text-indigo-500" />
                    Permission Details
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-2.5 bg-white/80 rounded-lg shadow-sm border border-slate-200/60">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-indigo-400 mr-2.5" />
                        <span className="text-sm text-slate-600">Granted Date</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{formatDate(new Date())}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2.5 bg-white/80 rounded-lg shadow-sm border border-slate-200/60">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-indigo-400 mr-2.5" />
                        <span className="text-sm text-slate-600">Status</span>
                      </div>
                      <span className="flex items-center">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-none text-white shadow-sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2.5 bg-white/80 rounded-lg shadow-sm border border-slate-200/60">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-indigo-400 mr-2.5" />
                        <span className="text-sm text-slate-600">Parent Roles</span>
                      </div>
                      <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md">
                        {rolesWithPermission.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Content Placeholder Card */}
          <Card className={cn(
            "bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/70 overflow-hidden transform transition-all duration-500",
            animateCards ? "translate-y-0 opacity-100 delay-100" : "translate-y-4 opacity-0"
          )}>
            <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-slate-100/80">
              <CardTitle className="text-lg font-semibold text-slate-800">Permission Content</CardTitle>
              <CardDescription>
                This is a placeholder for the actual content that would be displayed for this permission
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center text-center p-12 bg-indigo-50/50">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-indigo-200/50">
                  <LayoutDashboard className="h-10 w-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Content for {permissionDetails?.name}
                </h3>
                <p className="text-slate-500 max-w-lg mx-auto mb-6">
                  In a production application, this would display the actual functionality associated with 
                  the <span className="font-semibold text-indigo-600">{permissionDetails?.name}</span> permission.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    <Flag className="h-4 w-4 mr-2" />
                    Explore Features
                  </Button>
                  <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </UserLayout>
  );
}
