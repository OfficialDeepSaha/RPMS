import React, { useState, ReactNode, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Key,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Sparkles,
  ArrowRight,
  Settings,
  Bell,
  HelpCircle,
  BarChart3,
} from "lucide-react";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
};

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: "/",
    permission: "View Dashboard",
  },
  {
    name: "Users",
    icon: <Users className="h-5 w-5" />,
    path: "/admin/users",
    permission: "Manage Users",
  },
  {
    name: "Roles",
    icon: <ShieldCheck className="h-5 w-5" />,
    path: "/admin/roles",
    permission: "Manage Roles",
  },
  {
    name: "Permissions",
    icon: <Key className="h-5 w-5" />,
    path: "/admin/permissions",
    permission: "Manage Permissions",
  },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function AdminLayout({
  children,
  title,
  description = "",
}: AdminLayoutProps) {
  const location = useLocation();
  const { user, userRoles, hasPermission, logoutMutation, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animateItems, setAnimateItems] = useState(false);
  
  useEffect(() => {
    // Trigger animation after initial render
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.substring(0, 2).toUpperCase() || "U";

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission) || isAdmin
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for desktop */}
      <aside className="bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 text-white w-72 min-h-screen fixed left-0 top-0 z-30 hidden lg:block shadow-xl overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent"></div>
          <div className="absolute -top-24 -right-20 w-64 h-64 bg-blue-500/30 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
          <div className="absolute -bottom-32 -left-20 w-64 h-64 bg-purple-600/20 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        </div>
        
        {/* Logo area with glass morphism effect */}
        <div className="p-6 flex items-center justify-between border-b border-white/10 backdrop-blur-sm relative z-10">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mr-3 relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-50 blur-sm"></div>
              <Shield className="text-white h-5 w-5 relative z-10" />
            </div>
            <h1 className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">RoleSphere</h1>
          </div>
          <Sparkles className="h-5 w-5 text-blue-400" />
        </div>

        <div className="px-4 py-6 relative z-10 flex flex-col h-[calc(100vh-88px)]">
          {/* User profile with glass effect */}
          <div className="mb-8 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500 opacity-50 animate-pulse"></div>
                <User className="h-6 w-6 relative z-10" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {user?.firstName || ""} {user?.lastName || user?.username || ""}
                </p>
                <div className="flex items-center mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2"></div>
                  <p className="text-xs text-gray-300">
                    {userRoles?.length > 0 
                      ? userRoles.map((role) => role.name).join(", ") 
                      : "No roles assigned"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 flex flex-col space-y-1">
            <div className="mb-6">
              <div className="text-xs uppercase text-indigo-300 tracking-wider mb-4 ml-2 font-semibold">
                Management
              </div>
              {filteredMenuItems.map((item, index) => (
                <NavLink key={item.path} to={item.path}>
                  <a
                    className={cn(
                      "menu-item flex items-center py-3 px-3 rounded-xl mb-2 transition-all duration-200 relative group",
                      location.pathname === item.path
                        ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-md"
                        : "text-gray-300 hover:bg-white/10 hover:text-white",
                      // Apply staggered animation on initial load
                      animateItems 
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0",
                      "transition-all duration-300 ease-out"
                    )}
                    style={{ 
                      transitionDelay: `${index * 50}ms` 
                    }}
                  >
                    <div className={cn(
                      "bg-white/10 p-2 rounded-lg mr-3",
                      location.pathname === item.path 
                        ? "bg-white/20" 
                        : "group-hover:bg-white/15"
                    )}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                    
                    {location.pathname === item.path && (
                      <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                    )}
                    
                    {/* Active indicator bar */}
                    {location.pathname === item.path && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full" />
                    )}
                  </a>
                </NavLink>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase text-indigo-300 tracking-wider mb-4 ml-2 font-semibold">
                Support
              </div>
              <NavLink to="/admin/settings">
                <a className="menu-item flex items-center py-3 px-3 rounded-xl mb-2 transition-all duration-200 text-gray-300 hover:bg-white/10 hover:text-white group">
                  <div className="bg-white/10 p-2 rounded-lg mr-3 group-hover:bg-white/15">
                    <Settings className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Settings</span>
                </a>
              </NavLink>
              <NavLink to="/admin/help">
                <a className="menu-item flex items-center py-3 px-3 rounded-xl mb-2 transition-all duration-200 text-gray-300 hover:bg-white/10 hover:text-white group">
                  <div className="bg-white/10 p-2 rounded-lg mr-3 group-hover:bg-white/15">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Help Center</span>
                </a>
              </NavLink>
            </div>

            <div className="mt-auto pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white rounded-xl py-3 px-3 transition-colors duration-200"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium">Logout</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-70" />
              </Button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="mr-2 text-indigo-700"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mr-2 relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400 to-purple-500 opacity-50 blur-sm"></div>
              <Shield className="text-white h-4 w-4 relative z-10" />
            </div>
            <span className="font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">RoleSphere</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-indigo-600">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm shadow-md">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay with blur effect */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 text-white w-[300px] min-h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out transform lg:hidden shadow-2xl",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
        </div>
        
        <div className="p-4 flex items-center justify-between border-b border-white/10 relative z-10">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mr-3 relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-50 blur-sm"></div>
              <Shield className="text-white h-5 w-5 relative z-10" />
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">RoleSphere</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-4 relative z-10 flex flex-col h-[calc(100vh-68px)]">
          {/* Mobile user profile */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500 opacity-50 animate-pulse"></div>
                <User className="h-6 w-6 relative z-10" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {user?.firstName || ""} {user?.lastName || user?.username || ""}
                </p>
                <div className="flex items-center mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2"></div>
                  <p className="text-xs text-gray-300">
                    {userRoles?.length > 0 
                      ? userRoles.map((role) => role.name).join(", ") 
                      : "No roles assigned"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile navigation */}
          <nav className="flex-1 flex flex-col space-y-1">
            <div className="mb-6">
              <div className="text-xs uppercase text-indigo-300 tracking-wider mb-3 ml-2 font-semibold">
                Management
              </div>
              {filteredMenuItems.map((item) => (
                <NavLink key={item.path} to={item.path}>
                  <a
                    className={cn(
                      "menu-item flex items-center py-3 px-3 rounded-xl mb-2 transition-all duration-200 relative group",
                      location.pathname === item.path
                        ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-md"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    )}
                    onClick={toggleMobileMenu}
                  >
                    <div className={cn(
                      "bg-white/10 p-2 rounded-lg mr-3",
                      location.pathname === item.path 
                        ? "bg-white/20" 
                        : "group-hover:bg-white/15"
                    )}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                    
                    {location.pathname === item.path && (
                      <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                    )}
                    
                    {/* Active indicator bar */}
                    {location.pathname === item.path && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full" />
                    )}
                  </a>
                </NavLink>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase text-indigo-300 tracking-wider mb-3 ml-2 font-semibold">
                Support
              </div>
              <NavLink to="/admin/settings">
                <a className="menu-item flex items-center py-3 px-3 rounded-xl mb-2 transition-all duration-200 text-gray-300 hover:bg-white/10 hover:text-white group" onClick={toggleMobileMenu}>
                  <div className="bg-white/10 p-2 rounded-lg mr-3 group-hover:bg-white/15">
                    <Settings className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Settings</span>
                </a>
              </NavLink>
              <NavLink to="/admin/help">
                <a className="menu-item flex items-center py-3 px-3 rounded-xl mb-2 transition-all duration-200 text-gray-300 hover:bg-white/10 hover:text-white group" onClick={toggleMobileMenu}>
                  <div className="bg-white/10 p-2 rounded-lg mr-3 group-hover:bg-white/15">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Help Center</span>
                </a>
              </NavLink>
            </div>

            <div className="mt-auto pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white rounded-xl py-3 px-3 transition-colors duration-200"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium">Logout</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-70" />
              </Button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        {/* Page header */}
        <header className="pt-6 px-6 lg:px-8 pb-5 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md shadow-sm border-b lg:border-0 mb-4 mt-14 lg:mt-0">
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {description && (
              <p className="text-slate-500 text-sm max-w-4xl">{description}</p>
            )}
          </div>
        </header>
        
        {/* Page content with animated entry */}
        <div 
          className={cn(
            "px-4 sm:px-6 lg:px-8 pb-10 transition-all duration-500 ease-out",
            animateItems ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
