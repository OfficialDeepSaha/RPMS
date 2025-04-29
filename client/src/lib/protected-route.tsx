import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  requireAdmin?: boolean;
};

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to={`/auth?redirect=${encodeURIComponent(location)}`} />
      </Route>
    );
  }

  // Redirect admin users accessing user routes to admin dashboard
  if (!requireAdmin && isAdmin && path.startsWith('/user')) {
    return (
      <Route path={path}>
        <Redirect to="/admin/dashboard" />
      </Route>
    );
  }
  
  // Redirect non-admin users accessing admin routes to user dashboard
  if (requireAdmin && !isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/user/dashboard" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
