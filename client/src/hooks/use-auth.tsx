import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, Permission, Role } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthUser = Omit<User, "password"> & {
  roles?: Role[];
  permissions?: Permission[];
  isAdmin?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  userRoles: Role[];
  userPermissions: Permission[];
  hasPermission: (permissionName: string) => boolean;
  isAdmin: boolean;
  loginMutation: UseMutationResult<AuthUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading: userLoading,
  } = useQuery<AuthUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Use roles and permissions from the user object if available, otherwise fetch separately
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/user/roles"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && !user.roles, // Only fetch if not already included in user
  });

  const { data: userPermissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/user/permissions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && !user.permissions, // Only fetch if not already included in user
  });

  // Consider loading complete if we have the user with included roles/permissions
  const isLoading = userLoading || 
    (!!user && !user.roles && !user.permissions && (rolesLoading || permissionsLoading));

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // First check maintenance mode status if not admin
      if (credentials.username !== 'admin') {
        console.log('Checking maintenance mode status before login attempt');
        const maintenanceResponse = await fetch('/api/settings/key/maintenanceMode');
        
        if (maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json();
          if (maintenanceData?.value === 'true') {
            console.log('Maintenance mode is enabled - blocking non-admin login');
            throw new Error('System is in maintenance mode. Only administrators can log in at this time.');
          }
        }
      }
      
      // Proceed with normal login flow
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      // Save JWT token to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // Enhanced login flow: immediately fetch roles and permissions in parallel
      // to prevent the no-permissions page from briefly appearing
      if (data.user) {
        try {
          // Only fetch if not already included in the user object
          if (!data.user.roles) {
            const rolesRes = await apiRequest("GET", "/api/user/roles");
            if (rolesRes.ok) {
              const roles = await rolesRes.json();
              data.user.roles = roles;
            }
          }
          if (!data.user.permissions) {
            const permissionsRes = await apiRequest("GET", "/api/user/permissions");
            if (permissionsRes.ok) {
              const permissions = await permissionsRes.json();
              data.user.permissions = permissions;
            }
          }
          // Update isAdmin property based on roles
          data.user.isAdmin = data.user.isAdmin || 
            (data.user.roles?.some((role: Role) => role.name === 'Administrator') ?? false);
        } catch (err) {
          console.error("Failed to prefetch user data after login:", err);
          // Continue with login even if prefetch fails - the app will fetch later
        }
      }
      
      return data.user;
    },
    onSuccess: (user: AuthUser) => {
      // Update all necessary query data at once to avoid flickering
      queryClient.setQueryData(["/api/user"], user);
      if (user.roles) {
        queryClient.setQueryData(["/api/user/roles"], user.roles);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user/roles"] });
      }
      if (user.permissions) {
        queryClient.setQueryData(["/api/user/permissions"], user.permissions);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user/permissions"] });
      }
      toast({
        title: "Login successful",
        description: `Welcome back${user.firstName ? `, ${user.firstName}` : ""}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      localStorage.removeItem("token");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/user/roles"], []);
      queryClient.setQueryData(["/api/user/permissions"], []);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasPermission = (permissionName: string): boolean => {
    // Use permissions from user object if available, otherwise use separately fetched permissions
    const permissions = user?.permissions || userPermissions;
    return permissions.some(p => p.name === permissionName);
  };

  // Use isAdmin from user object if available, otherwise calculate from roles
  const isAdmin = user?.isAdmin ?? userRoles.some(role => role.name === 'Administrator');

  // Combine roles and permissions from user object and separate queries
  const combinedRoles = user?.roles || userRoles;
  const combinedPermissions = user?.permissions || userPermissions;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        userRoles: combinedRoles,
        userPermissions: combinedPermissions,
        hasPermission,
        isAdmin,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
