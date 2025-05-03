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
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
  special?: boolean;
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
    special: true,
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
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Check maintenance mode status
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.maintenance === true);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };
    
    checkMaintenanceMode();
    
    // Poll for maintenance mode status every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000);
    return () => clearInterval(interval);
  }, []);
  
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
      <aside className="bg-gradient-to-b from-[#0a1022] via-[#1a1654] to-[#0a1022] text-white w-72 min-h-screen fixed left-0 top-0 z-30 hidden lg:block shadow-xl overflow-hidden border-r border-white/5 transition-all duration-500">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated glowing lines */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute left-0 top-1/4 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse-slow"></div>
            <div className="absolute left-0 top-2/4 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-pulse-slow animation-delay-2000"></div>
            <div className="absolute left-0 top-3/4 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-pulse-slow animation-delay-4000"></div>
          </div>
          
          {/* Gradient orbs */}
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[40%] bg-gradient-to-b from-blue-500/20 to-purple-600/5 rounded-full filter blur-[60px] animate-blob"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[30%] bg-gradient-to-t from-indigo-600/10 to-cyan-400/5 rounded-full filter blur-[60px] animate-blob animation-delay-2000"></div>
          
          {/* Grid overlay with animation */}
          <div className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMzAgNUwzMCAzMCAzMCA1NSI+PC9wYXRoPjxwYXRoIGQ9Ik01IDMwTDMwIDMwIDU1IDMwIj48L3BhdGg+PC9nPjwvc3ZnPg==')]"></div>
          
          {/* Animated cyber dots */}
          <div className="absolute inset-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <div 
                key={`dot-${i}`}
                className="absolute rounded-full bg-blue-500/30 animate-pulse-slow"
                style={{
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 7}s`
                }}
              />
            ))}
          </div>
          
          {/* Particles with better animation */}
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
                boxShadow: "0 0 5px rgba(255, 255, 255, 0.3)"
              }}
            />
          ))}
          
          {/* Scanner effect with improved animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-40 w-full animate-scanner transform translate-y-full"></div>
        </div>
        
        {/* Logo area with enhanced glass morphism */}
        <div className="p-5 flex items-center justify-between backdrop-blur-lg backdrop-filter relative z-10 border-b border-white/10 shadow-lg">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg mr-3 relative overflow-hidden group border border-white/20">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
              
              {/* Animated corner accents */}
              <div className="absolute h-2 w-[120%] top-0 -left-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
              <div className="absolute w-2 h-[120%] right-0 -top-1 bg-gradient-to-b from-transparent via-white/40 to-transparent animate-shimmer" style={{ animationDelay: "1s" }}></div>
              
              {/* Icon with dynamic glow */}
              <div className="relative z-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <Shield className="text-white h-6 w-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                <div className="absolute inset-0 bg-blue-400 rounded-full filter blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
            </div>
            
            <div>
              <h1 className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-indigo-200 to-white relative group">
                RoleSphere
                {/* Text glow on hover with animation */}
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-indigo-400/0 to-white/0 group-hover:via-indigo-400/20 filter blur-sm transition-all duration-500"></span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-indigo-500"></span>
              </h1>
              <div className="flex items-center mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.5)]"></div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-medium">Admin Portal</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main navigation area with fixed height to accommodate logout button */}
        <nav className="mt-6 px-3 relative z-10 overflow-y-auto pb-24 h-[calc(100vh-88px)]">
          {/* User profile card with enhanced styling */}
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg border border-white/10 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            {/* Card accents with animations */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
            <div className="absolute bottom-0 left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full filter blur-xl"></div>
            
            <div className="flex items-center gap-3">
              {/* User avatar with animated border */}
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full opacity-70 blur-sm animate-spin-slow"></div>
                {user?.profileImage ? (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden relative z-10">
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
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 shadow-inner relative z-10">
                    <span className="text-white text-sm font-semibold">{userInitials}</span>
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-800 shadow-[0_0_5px_rgba(52,211,153,0.5)] z-20"></div>
              </div>
              
              {/* User info with better typography */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate text-shadow">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-blue-300/90 flex items-center mt-0.5">
                  <div className="flex-shrink-0 flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-blue-400" />
                    <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent font-medium">Administrator</span>
                  </div>
                </div>
              </div>
              
              {/* Settings button with hover effects */}
              <button className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/20 shadow-lg group/btn overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <Settings className="h-4 w-4 relative z-10 group-hover/btn:rotate-45 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Navigation menu with enhanced styling */}
          <div className="space-y-1.5 pr-3 pl-1 py-1">
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
                      "group flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                      item.special && !isActive && "bg-gradient-to-r from-[#0f1424]/40 to-[#182042]/40 border border-[#304080]/20 shadow-[0_0_10px_rgba(30,64,175,0.07)]",
                      isActive
                        ? "text-white bg-gradient-to-r from-blue-900/40 to-slate-900/40 shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    )}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Enhanced Background pulse effect for Reports */}
                    {item.special && (hoveredItem === item.path || isActive) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-blue-600/10 to-transparent group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    
                    {/* Regular Background pulse effect for other items */}
                    {!item.special && (hoveredItem === item.path || isActive) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    
                    {/* Animated data visualization effect for Reports when hovered */}
                    {item.special && (hoveredItem === item.path || isActive) && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="w-[4px] mx-[2px] bg-blue-500 rounded-t-sm animate-pulse-slow" 
                              style={{ 
                                height: `${Math.max(10, Math.random() * 100)}%`,
                                animationDelay: `${i * 0.1}s`,
                                opacity: 0.7 + (Math.random() * 0.3),
                                backgroundColor: `hsl(${210 + (i * 5)}, 70%, 60%)`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Glowing border for active state */}
                    {isActive && (
                      <div className={cn(
                        "absolute inset-0 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] pointer-events-none",
                        item.special && "border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                      )}></div>
                    )}
                    
                    {/* Icon background with enhanced effects for Reports */}
                    <div className={cn(
                      "relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 overflow-hidden",
                      item.special && !isActive && "bg-gradient-to-br from-blue-700/30 to-indigo-800/30 border border-blue-700/20",
                      item.special && isActive && "bg-gradient-to-br from-blue-600/40 to-indigo-700/50 shadow-inner shadow-indigo-900/30",
                      !item.special && isActive && "bg-gradient-to-br from-blue-600/30 to-indigo-700/40 shadow-inner shadow-blue-900/20",
                      !item.special && !isActive && "bg-slate-800/50 group-hover:bg-gradient-to-br group-hover:from-blue-800/20 group-hover:to-slate-800/50"
                    )}>
                      {/* Special animated background for Reports icon */}
                      {item.special && (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMzAgNUwzMCAzMCAzMCA1NSI+PC9wYXRoPjxwYXRoIGQ9Ik01IDMwTDMwIDMwIDU1IDMwIj48L3BhdGg+PC9nPjwvc3ZnPg==')]"></div>
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 animate-pulse-slow"></div>
                          )}
                        </div>
                      )}
                      
                      {/* Icon glow effect */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-lg",
                        item.special && isActive && "opacity-100 bg-blue-600/20",
                        item.special && !isActive && "group-hover:opacity-80 bg-blue-500/10",
                        !item.special && isActive && "opacity-100 bg-blue-600/10",
                        !item.special && !isActive && "group-hover:opacity-60 bg-blue-500/5"
                      )}></div>
                      
                      {/* Icon with enhanced animations */}
                      <div className={cn(
                        "relative z-10 transition-all duration-300",
                        item.special && isActive && "text-blue-300 scale-110 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)]",
                        item.special && !isActive && "text-blue-400 group-hover:text-blue-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
                        !item.special && isActive && "text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
                        !item.special && !isActive && "text-slate-400 group-hover:text-blue-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]"
                      )}>
                        {item.icon}
                      </div>
                      
                      {/* Special animated particles for Reports icon when active */}
                      {item.special && isActive && (
                        <div className="absolute inset-0 overflow-hidden">
                          {[...Array(4)].map((_, i) => (
                            <div 
                              key={i}
                              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float-particle"
                              style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.5}s`,
                                opacity: 0.6
                              }}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Corner accents for active items */}
                      {isActive && (
                        <>
                          <div className={cn(
                            "absolute h-1.5 w-1.5 top-1 right-1 rounded-full",
                            item.special ? "bg-indigo-400/60" : "bg-blue-400/40"
                          )}></div>
                          <div className={cn(
                            "absolute h-1 w-1 bottom-1 left-1 rounded-full",
                            item.special ? "bg-blue-400/60" : "bg-indigo-400/40"
                          )}></div>
                        </>
                      )}
                    </div>
                    
                    {/* Menu item text with enhanced animations */}
                    <span className={cn(
                      "transition-all duration-300 relative",
                      item.special && isActive && "text-blue-100 font-semibold",
                      item.special && !isActive && "text-blue-200 group-hover:text-blue-100",
                      !item.special && isActive && "text-blue-50 font-semibold",
                      !item.special && !isActive && "group-hover:translate-x-1"
                    )}>
                      {item.name}
                      
                      {/* Underline animation effect */}
                      <span className={cn(
                        "absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300",
                        item.special ? "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" : "bg-gradient-to-r from-blue-400 to-indigo-400",
                        (hoveredItem === item.path || isActive) ? "w-full" : "w-0"
                      )}></span>
                      
                      {/* Special badge for Reports */}
                      {item.special && !isActive && (
                        <span className="absolute -right-7 -top-1 text-[9px] px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                          NEW
                        </span>
                      )}
                    </span>
                    
                    {/* Active indicators with enhanced effects */}
                    {isActive && (
                      <>
                        {/* Glowing side bar */}
                        <div className={cn(
                          "absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-full",
                          item.special 
                            ? "bg-gradient-to-b from-indigo-400 via-blue-400 to-indigo-600" 
                            : "bg-gradient-to-b from-blue-400 via-indigo-400 to-blue-600"
                        )}>
                          <div className={cn(
                            "absolute inset-0 blur-sm",
                            item.special ? "bg-indigo-400" : "bg-blue-400"
                          )}></div>
                        </div>
                        
                        {/* Right icon with animation */}
                        <ChevronRight className={cn(
                          "absolute right-3 h-4 w-4 animate-pulse-slow",
                          item.special ? "text-indigo-400/70" : "text-blue-400/70"
                        )} />
                      </>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
        
        {/* Fixed logout button at the bottom */}
        <div className="absolute left-0 bottom-5 w-full px-4 pb-5 pt-4 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent backdrop-blur">
          {/* Divider with glowing effect */}
          <div className="relative h-[1px] mb-4 mx-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          </div>
          
          {/* Logout button with enhanced effects */}
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl py-3 px-3 transition-all duration-300 bg-gradient-to-r hover:from-indigo-800/40 hover:via-blue-700/30 hover:to-purple-800/40 text-slate-400 hover:text-white border border-transparent hover:border-indigo-500/20 relative group overflow-hidden shadow-sm hover:shadow-[0_0_15px_rgba(79,70,229,0.25)]"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {/* Button accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-blue-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            
            {/* Hover effect */}
            <div className="absolute -top-[150%] left-0 w-[200%] h-[200%] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 rotate-45 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700"></div>
            
            {/* Icon with enhanced background */}
            <div className="relative flex items-center justify-center h-10 w-10 rounded-lg mr-3 bg-slate-800/50 group-hover:bg-indigo-900/40 transition-colors border border-white/5 group-hover:border-indigo-500/30 overflow-hidden">
              {/* Icon glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <LogOut className="h-5 w-5 group-hover:text-indigo-300 transition-all duration-300 group-hover:drop-shadow-[0_0_5px_rgba(165,180,252,0.7)]" />
            </div>
            
            <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">Logout</span>
            
            <ArrowRight className="ml-auto h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform duration-300 group-hover:text-indigo-300/70" />
            
            {/* New: Additional glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-r from-indigo-600/5 via-blue-500/5 to-transparent pointer-events-none"></div>
            <div className="absolute -left-1/4 -top-1/2 w-1/2 h-1/2 opacity-0 group-hover:opacity-30 bg-blue-500/20 blur-3xl rounded-full transition-opacity duration-500 pointer-events-none"></div>
          </Button>
        </div>
        
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

      {/* Main content wrapper */}
      <main className="flex-1 min-h-screen lg:ml-72 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Dynamic gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1323] to-slate-950"></div>
          
          {/* Animated grid effect */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwMCAwIEwgMCAwIDAgMTAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgdyA9IjEwMCUiIGg9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-70"></div>
          
          {/* Large gradient orbs */}
          <div className="absolute top-[-15%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-b from-blue-600/5 to-purple-600/5 rounded-full filter blur-[80px] opacity-70 animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-gradient-to-t from-emerald-600/5 to-cyan-600/5 rounded-full filter blur-[80px] opacity-70 animate-pulse-slow animation-delay-2000"></div>
          
          {/* Scanner line effect */}
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent top-0 animate-scanner-line"></div>
        </div>
        
        {/* Mobile menu button */}
        <div className="lg:hidden absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-white hover:bg-white/10 transition-colors duration-200 backdrop-blur-lg bg-white/5 rounded-xl"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Top header bar */}
        <header className="border-b border-white/5 backdrop-blur-md bg-slate-900/30 relative z-20 px-6 py-4">
          <div className="max-w-[2000px] mx-auto flex justify-between items-center">
            {/* Left side - Page title */}
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-white group">
                {title}
                <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-blue-600 to-indigo-600 mt-1 transition-all duration-300 rounded-full"></div>
              </h1>
              {description && (
                <p className="text-slate-400 text-sm mt-1 max-w-2xl animate-fadeIn">
                  {description}
                </p>
              )}
            </div>
            
            {/* Right side - User controls */}
            <div className="flex items-center gap-3">
              {/* Help button */}
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-md bg-white/5">
                <HelpCircle className="h-5 w-5" />
              </Button>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-md bg-white/5 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 border border-slate-900"></span>
              </Button>
              
              {/* User menu */}
              <div className="flex items-center gap-2 pl-2">
                {/* User avatar */}
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center border border-white/10 shadow-md">
                  <span className="text-white text-sm font-semibold">{userInitials}</span>
                </div>
                
                {/* User name and role */}
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {userRoles?.[0]?.name || "Administrator"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <div className="relative z-10 p-4 lg:p-6">
          <div className="max-w-[2000px] mx-auto">
            {/* Maintenance warning if active */}
            {maintenanceMode && (
              <Alert className="mb-6 border border-amber-800/40 bg-amber-950/30 text-amber-400 backdrop-blur-md animate-fadeIn">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Maintenance Mode Active</AlertTitle>
                <AlertDescription>
                  The system is currently in maintenance mode. Some features may be unavailable.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Content */}
            <div className="animate-fadeIn">
              {children}
            </div>
          </div>
        </div>
      </main>
      
      {/* Enhanced keyframes for particle animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatParticle {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.05;
          }
          50% {
            transform: translateY(-10px) translateX(5px) scale(1.2);
            opacity: 0.2;
          }
          100% {
            transform: translateY(-25px) translateX(15px) scale(1);
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
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-scanner {
          animation: scanner 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
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
        
        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-8px) translateX(5px);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-20px) translateX(15px);
            opacity: 0;
          }
        }
        
        .animate-float-particle {
          animation: float-particle 3s ease-out infinite;
        }
      ` }} />
    </div>
  );
}
