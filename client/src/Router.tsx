import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import MaintenancePage from "@/pages/maintenance";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminRoles from "@/pages/admin/roles";
import AdminPermissions from "@/pages/admin/permissions";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";
import UserDashboard from "@/pages/user/dashboard";
import UserRoles from "@/pages/user/roles";
import UserReports from "@/pages/user/reports";
import UserUsers from "@/pages/user/users";
import UserPermissions from "@/pages/user/permissions";
import { useEffect, useState } from "react";

type ProtectedRouteProps = {
  requireAdmin?: boolean;
  element: React.ReactNode;
};

// Check if maintenance mode is active
const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          setIsMaintenanceMode(data.maintenance === true);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkMaintenanceMode();
  }, []);
  
  return { isMaintenanceMode, isLoading, canBypassMaintenance: isAdmin };
};

// ProtectedRoute wrapper based on react-router-dom v6
const ProtectedRoute = ({ requireAdmin = false, element }: ProtectedRouteProps) => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { isMaintenanceMode, isLoading: maintenanceLoading, canBypassMaintenance } = useMaintenanceMode();
  const isLoading = authLoading || maintenanceLoading;
  
  // Show loading indicator if still checking auth status or maintenance mode
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Check maintenance mode first - redirect to maintenance page for non-admins
  if (isMaintenanceMode && !canBypassMaintenance) {
    return <Navigate to="/maintenance" replace />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Restrict admin routes to admins only
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }
  
  return <>{element}</>;
};

// AdminRoute specifically for admin access - prevents non-admins from accessing even via direct URL
const AdminRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }
  
  return <>{element}</>;
};

// UserRoute specifically for regular users
const UserRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isMaintenanceMode, isLoading: maintenanceLoading, canBypassMaintenance } = useMaintenanceMode();
  const isLoading = authLoading || maintenanceLoading;
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Check maintenance mode first - redirect to maintenance page for non-admins
  if (isMaintenanceMode && !canBypassMaintenance) {
    return <Navigate to="/maintenance" replace />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{element}</>;
};

// Component to handle root path redirection
function RootRedirect() {
  const { isAdmin, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Navigate to={isAdmin ? "/admin/dashboard" : "/user/dashboard"} replace />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth and Maintenance Routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        
        {/* Admin Routes - require admin role */}
        <Route path="/admin/dashboard" element={<AdminRoute element={<AdminDashboard />} />} />
        <Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
        <Route path="/admin/roles" element={<AdminRoute element={<AdminRoles />} />} />
        <Route path="/admin/permissions" element={<AdminRoute element={<AdminPermissions />} />} />
        <Route path="/admin/reports" element={<AdminRoute element={<AdminReports />} />} />
        <Route path="/admin/settings" element={<AdminRoute element={<AdminSettings />} />} />
        
        {/* User Routes - for regular users */}
        <Route path="/user/dashboard" element={<UserRoute element={<UserDashboard />} />} />
        <Route path="/user/roles" element={<UserRoute element={<UserRoles />} />} />
        <Route path="/user/reports" element={<UserRoute element={<UserReports />} />} />
        <Route path="/user/permissions" element={<UserRoute element={<UserPermissions />} />} />
        <Route path="/user/users" element={<UserRoute element={<UserUsers />} />} />
        
        {/* Root route - redirect based on role */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Fallback to 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter; 