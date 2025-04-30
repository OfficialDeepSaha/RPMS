import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminRoles from "@/pages/admin/roles";
import AdminPermissions from "@/pages/admin/permissions";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";
import UserDashboard from "@/pages/user/dashboard";
import UserReports from "@/pages/user/reports";
import UserUsers from "@/pages/user/users";

type ProtectedRouteProps = {
  requireAdmin?: boolean;
  element: React.ReactNode;
};

// ProtectedRoute wrapper based on react-router-dom v6
const ProtectedRoute = ({ requireAdmin = false, element }: ProtectedRouteProps) => {
  const { user, isAdmin, isLoading } = useAuth();
  
  // Show loading indicator if still checking auth status
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
        {/* Auth Route */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Admin Routes - require admin role */}
        <Route path="/admin/dashboard" element={<AdminRoute element={<AdminDashboard />} />} />
        <Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
        <Route path="/admin/roles" element={<AdminRoute element={<AdminRoles />} />} />
        <Route path="/admin/permissions" element={<AdminRoute element={<AdminPermissions />} />} />
        <Route path="/admin/reports" element={<AdminRoute element={<AdminReports />} />} />
        <Route path="/admin/settings" element={<AdminRoute element={<AdminSettings />} />} />
        
        {/* User Routes - for regular users */}
        <Route path="/user/dashboard" element={<UserRoute element={<UserDashboard />} />} />
        <Route path="/user/reports" element={<UserRoute element={<UserReports />} />} />
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