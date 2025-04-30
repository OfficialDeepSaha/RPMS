import React, { useState, ReactNode, useEffect, useMemo } from "react";
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
  Zap,
  Activity,
  Layers,
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
  {
    name: "User Reports",
    icon: <BarChart3 className="h-5 w-5" />,
    path: "/admin/reports",
    permission: "View Reports",
  },
  {
    name: "Settings",
    icon: <Settings className="h-5 w-5" />,
    path: "/admin/settings",
    permission: "Manage System",
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
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

  // Generate particles dynamically
  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 3,
      posX: Math.random() * 100,
      posY: Math.random() * 100,
      opacity: 0.1 + Math.random() * 0.15,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 20
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar for desktop */}
      <aside className="bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white w-72 min-h-screen fixed left-0 top-0 z-30 hidden lg:block shadow-xl overflow-hidden border-r border-white/5">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[40%] bg-gradient-to-b from-blue-500/20 to-purple-600/5 rounded-full filter blur-[60px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[30%] bg-gradient-to-t from-indigo-600/10 to-cyan-400/5 rounded-full filter blur-[60px] animate-pulse-slow animation-delay-2000"></div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMzAgNUwzMCAzMCAzMCA1NSI+PC9wYXRoPjxwYXRoIGQ9Ik01IDMwTDMwIDMwIDU1IDMwIj48L3BhdGg+PC9nPjwvc3ZnPg==')]"></div>
          
          {/* Particles */}
          {particles.map((particle) => (
            <div 
              key={particle.id}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                top: `${particle.posY}%`,
                left: `${particle.posX}%`,
                opacity: particle.opacity,
                animation: `floatParticle ${particle.duration}s ease-in-out ${particle.delay}s infinite alternate`,
              }}
            />
          ))}
          
          {/* Scanner effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-20 w-full animate-scanner transform translate-y-full"></div>
        </div>
        
        {/* Logo area with enhanced glass morphism */}
        <div className="p-6 flex items-center justify-between backdrop-blur-md backdrop-filter relative z-10 border-b border-white/10">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg mr-3 relative overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-xl border-[1.5px] border-white/20 group-hover:border-white/40 transition-all duration-500"></div>
              
              {/* Icon with glow */}
              <div className="relative z-10 flex items-center justify-center">
                <Shield className="text-white h-5 w-5 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-blue-400 rounded-full filter blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              
              {/* Corner accents */}
              <div className="absolute h-2 w-2 top-0.5 right-0.5 bg-blue-300/40 rounded-full"></div>
              <div className="absolute h-1 w-1 bottom-1 left-1 bg-indigo-300/40 rounded-full"></div>
            </div>
            
            <div>
              <h1 className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-indigo-200 to-white relative group">
                RoleSphere
                {/* Text glow on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-indigo-400/0 to-white/0 group-hover:via-indigo-400/20 filter blur-sm transition-all duration-500"></span>
              </h1>
              <div className="flex items-center mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-medium">Admin Portal</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main navigation */}
        <nav className="mt-6 px-3 relative z-10">


  {/* User profile card */}
  <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/5 relative overflow-hidden group">
              {/* Card accents */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-500/5 to-transparent rounded-full filter blur-xl"></div>
              
              <div className="flex items-center gap-3">
                {/* User avatar */}
                <div className="relative">
                  {user?.profileImage ? (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center border border-white/10 shadow-md overflow-hidden">
                      <img 
                        src={user.profileImage} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-semibold">${userInitials}</span>`;
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center border border-white/10 shadow-md">
                      <span className="text-white text-sm font-semibold">{userInitials}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-800"></div>
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center">
                    <div className="flex-shrink-0 flex items-center">
                      <Shield className="h-3 w-3 mr-1 text-blue-400" />
                      <span>Administrator</span>
                    </div>
                  </div>
                </div>
                
                {/* Settings button */}
                <button className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

          <div className="space-y-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'active-nav-item' : 'inactive-nav-item'
                }
              >
                {({ isActive }) => (
                  <div
                    className={cn(
                      "group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "text-white bg-white/10 shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    )}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Background pulse effect */}
                    {(hoveredItem === item.path || isActive) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    
                    {/* Icon background */}
                    <div className={cn(
                      "relative flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-300 overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-br from-blue-600/20 to-indigo-700/30 shadow-inner" 
                        : "bg-slate-800/50 group-hover:bg-slate-800"
                    )}>
                      {/* Icon glow */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-lg",
                        isActive ? "opacity-100 bg-blue-600/10" : "group-hover:opacity-60 bg-blue-500/5"
                      )}></div>
                      
                      {/* Icon */}
                      <div className={cn(
                        "relative z-10 transition-transform duration-300",
                        isActive ? "text-blue-400 scale-110" : "text-slate-400 group-hover:text-blue-400 group-hover:scale-110"
                      )}>
                        {item.icon}
                      </div>
                    </div>
                    
                    {/* Menu item text */}
                    <span className={cn(
                      "transition-all duration-300",
                      isActive 
                        ? "text-blue-50 font-semibold" 
                        : "group-hover:translate-x-1"
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <>
                        {/* Glowing side bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-400 via-indigo-400 to-blue-600 rounded-r-full">
                          <div className="absolute inset-0 blur-sm bg-blue-400"></div>
                        </div>
                        
                        {/* Right icon */}
                        <ChevronRight className="absolute right-3 h-4 w-4 text-blue-400/70" />
                        
                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                      </>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* User profile and logout */}
          <div className="mt-8 pt-6 pb-8">
          
          
            {/* Logout button */}
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl py-3 px-3 transition-all duration-300 bg-gradient-to-r hover:from-red-900/20 hover:to-transparent text-slate-400 hover:text-white border border-transparent hover:border-white/5 relative group"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {/* Button accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              
              {/* Icon with background */}
              <div className="relative flex items-center justify-center h-9 w-9 rounded-lg mr-3 bg-slate-800/50 group-hover:bg-slate-800/80 transition-colors">
                <LogOut className="h-5 w-5 group-hover:text-red-400 transition-colors duration-300" />
              </div>
              
              <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">Logout</span>
              
              <ArrowRight className="ml-auto h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </nav>
        
        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            ></div>
            
            {/* Mobile menu */}
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg mr-2">
                    <Shield className="text-white h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">RoleSphere</h2>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {filteredMenuItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        isActive ? 'active-nav-item' : 'inactive-nav-item'
                      }
                    >
                      {({ isActive }) => (
                        <a
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl",
                            isActive
                              ? "text-white bg-white/10"
                              : "text-gray-300 hover:bg-white/10 hover:text-white"
                          )}
                          onClick={toggleMobileMenu}
                        >
                          <div className={cn(
                            "bg-white/10 p-2 rounded-lg mr-3",
                            isActive 
                              ? "bg-white/20" 
                              : "group-hover:bg-white/15"
                          )}>
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.name}</span>
                          
                          {isActive && (
                            <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                          )}
                          
                          {/* Active indicator bar */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full" />
                          )}
                        </a>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:ml-72 min-h-screen bg-slate-50">
        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white z-20 flex items-center px-4 shadow-sm border-b">
          <button
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-4 flex items-center">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm mr-2">
              <Shield className="text-white h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-800">RoleSphere</span>
          </div>
        </div>
        
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
      
      {/* Add keyframes for particle animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatParticle {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.05;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.05;
          }
        }
        
        @keyframes scanner {
          0%, 100% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            transform: translateY(100vh);
            opacity: 0.8;
          }
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animate-scanner {
          animation: scanner 8s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes blob {
          0%, 100% {
            transform: scale(1) translate(0, 0);
          }
          25% {
            transform: scale(1.1) translate(5%, 5%);
          }
          50% {
            transform: scale(1) translate(10%, -5%);
          }
          75% {
            transform: scale(1.1) translate(5%, -10%);
          }
        }
        
        .animate-blob {
          animation: blob 10s infinite;
        }
      ` }} />
    </div>
  );
}
