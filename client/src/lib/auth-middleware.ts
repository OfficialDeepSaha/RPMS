import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * A custom hook that handles redirection based on user authentication status
 * and role. This can be used in layout components or at the top level of
 * page components.
 * 
 * @param redirectIfFound - If true, authenticated users will be redirected away from the page
 * @param redirectTo - Where to redirect authenticated users (if redirectIfFound is true)
 * @returns { user, isLoading } - The current user and loading state
 */
export function useAuthRedirect(
  redirectIfFound = false, 
  redirectTo = "/dashboard"
) {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isAdmin } = useAuth();
  
  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;
    
    // If user is not found and we should redirect
    if (!redirectIfFound && !user) {
      // Remember where they're trying to go for later
      const destination = encodeURIComponent(location);
      setLocation(`/auth?redirect=${destination}`);
      return;
    }
    
    // If user is found and we should redirect (login pages)
    if (redirectIfFound && user) {
      // Check if there's a redirect destination
      const params = new URLSearchParams(window.location.search);
      const redirectDestination = params.get("redirect");
      
      // If there is, go there, otherwise choose based on role
      if (redirectDestination) {
        setLocation(decodeURIComponent(redirectDestination));
      } else {
        const roleDashboard = isAdmin ? "/admin/dashboard" : "/user/dashboard";
        setLocation(roleDashboard);
      }
    }
  }, [user, isLoading, redirectIfFound, redirectTo, location, setLocation, isAdmin]);
  
  return { user, isLoading };
}

/**
 * A custom hook that performs role-based authorization
 * 
 * @param isAdminRoute - Whether this is an admin route
 * @returns { isAuthorized, isLoading } - Whether the user is authorized and if auth is still loading
 */
export function useRoleAuthorization(isAdminRoute: boolean) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      setLocation("/auth");
      return;
    }
    
    // Redirect admin users trying to access user routes
    if (!isAdminRoute && isAdmin) {
      setLocation("/admin/dashboard");
      return;
    }
    
    // Redirect regular users trying to access admin routes
    if (isAdminRoute && !isAdmin) {
      setLocation("/user/dashboard");
      return;
    }
    
    // If we got here, the user is authorized
    setIsAuthorized(true);
  }, [user, isLoading, isAdmin, isAdminRoute, setLocation]);
  
  return { isAuthorized, isLoading };
} 