import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface UserLayoutProps {
  children: ReactNode;
  title: string;
  selectedPermission?: string;
}

export default function UserLayout({
  children,
  title,
  selectedPermission,
}: UserLayoutProps) {
  const [location] = useLocation();
  const { user, userRoles, userPermissions, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.substring(0, 2).toUpperCase() || "U";

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Group permissions by category
  const permissionsByCategory = userPermissions.reduce((acc, permission) => {
    const category = permission.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, typeof userPermissions>);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <aside className="bg-dark text-white w-64 min-h-screen fixed left-0 top-0 z-30 hidden lg:block">
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center">
            <Shield className="text-primary h-6 w-6 mr-2" />
            <h1 className="font-semibold text-lg">AccessControl</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
              <span className="font-medium">{userInitials}</span>
            </div>
            <div>
              <p className="font-medium">
                {user?.firstName} {user?.lastName || user?.username}
              </p>
              <p className="text-xs text-gray-400">
                {userRoles.map((role) => role.name).join(", ")}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="menu-section">
              <div className="text-xs uppercase text-gray-500 tracking-wider mb-2">
                My Permissions
              </div>
              
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="mb-4">
                  <div className="text-xs uppercase text-gray-500 tracking-wider mb-2 pl-2">
                    {category}
                  </div>
                  {permissions.map((permission) => (
                    <Link 
                      key={permission.id} 
                      href={`/user/dashboard?permission=${encodeURIComponent(permission.name)}`}
                    >
                      <a 
                        className={cn(
                          "menu-item flex items-center py-2 px-3 rounded-md mb-1 transition-colors",
                          selectedPermission === permission.name
                            ? "bg-primary text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        )}
                      >
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        <span>{permission.name}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <hr className="border-gray-700 my-4" />

            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center">
            <Shield className="text-primary h-5 w-5 mr-2" />
            <span className="font-semibold">AccessControl</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm">
          {userInitials}
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "bg-dark text-white w-64 min-h-screen fixed left-0 top-0 z-50 transition-transform transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center">
            <Shield className="text-primary h-6 w-6 mr-2" />
            <h1 className="font-semibold text-lg">AccessControl</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-white hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
              <span className="font-medium">{userInitials}</span>
            </div>
            <div>
              <p className="font-medium">
                {user?.firstName} {user?.lastName || user?.username}
              </p>
              <p className="text-xs text-gray-400">
                {userRoles.map((role) => role.name).join(", ")}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="menu-section">
              <div className="text-xs uppercase text-gray-500 tracking-wider mb-2">
                My Permissions
              </div>
              
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="mb-4">
                  <div className="text-xs uppercase text-gray-500 tracking-wider mb-2 pl-2">
                    {category}
                  </div>
                  {permissions.map((permission) => (
                    <Link 
                      key={permission.id} 
                      href={`/user/dashboard?permission=${encodeURIComponent(permission.name)}`}
                    >
                      <a 
                        className={cn(
                          "menu-item flex items-center py-2 px-3 rounded-md mb-1 transition-colors",
                          selectedPermission === permission.name
                            ? "bg-primary text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        )}
                        onClick={toggleMobileMenu}
                      >
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        <span>{permission.name}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <hr className="border-gray-700 my-4" />

            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 p-6 pt-20 lg:pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <p className="text-gray-500">This is a placeholder page for the selected permission</p>
        </div>
        {children}
      </main>
    </div>
  );
}
