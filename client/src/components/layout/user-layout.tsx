import { useState, ReactNode, useEffect } from "react";
import { Link, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  FileText,
  BarChart,
  Grid,
  KeySquare,
  Clock,
  HelpCircle,
  ChevronRight,
  Home,
  Activity,
  Star,
  History
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserLayoutProps {
  children: ReactNode;
  title: string;
  selectedPermission?: string;
}

// Function to get the appropriate icon for a permission
function getPermissionIcon(permission: any) {
  const permissionName = permission.name?.toLowerCase() || '';
  if (permissionName.includes('dashboard')) {
    return <LayoutDashboard className="h-4 w-4" />;
  } else if (permissionName.includes('user')) {
    return <User className="h-4 w-4" />;
  } else if (permissionName.includes('report')) {
    return <FileText className="h-4 w-4" />;
  } else if (permissionName.includes('analytics') || permissionName.includes('statistics')) {
    return <BarChart className="h-4 w-4" />;
  } else if (permissionName.includes('view')) {
    return <Grid className="h-4 w-4" />;
  } else if (permissionName.includes('permission')) {
    return <KeySquare className="h-4 w-4" />;
  } else if (permissionName.includes('activity') || permissionName.includes('log')) {
    return <Activity className="h-4 w-4" />;
  } else if (permissionName.includes('time') || permissionName.includes('schedule')) {
    return <Clock className="h-4 w-4" />;
  } else if (permissionName.includes('settings')) {
    return <Settings className="h-4 w-4" />;
  } else if (permissionName.includes('help')) {
    return <HelpCircle className="h-4 w-4" />;
  } else {
    return <KeySquare className="h-4 w-4" />;
  }
}

export default function UserLayout({
  children,
  title,
  selectedPermission,
}: UserLayoutProps) {
  const location = useLocation();
  const { user, userRoles, userPermissions, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animateItems, setAnimateItems] = useState(false);
  const [recentPermissions, setRecentPermissions] = useState<any[]>([]);
  const [favoritePermissions, setFavoritePermissions] = useState<any[]>([]);
  
  // Check if current path matches specific routes
  const isDashboard = location.pathname === "/user/dashboard";
  const isReports = location.pathname === "/user/reports";
  const isUsers = location.pathname === "/user/users";

  // Animation effect for sidebar items
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load recent/favorite permissions from localStorage
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem('recentPermissions');
      if (storedRecent) {
        const parsedRecent = JSON.parse(storedRecent);
        // Filter to make sure we only show permissions the user actually has
        const validRecent = parsedRecent.filter((p: any) => 
          userPermissions.some(up => up.id === p.id)
        ).slice(0, 3);
        setRecentPermissions(validRecent);
      }

      const storedFavorites = localStorage.getItem('favoritePermissions');
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        // Filter to make sure we only show permissions the user actually has
        const validFavorites = parsedFavorites.filter((p: any) => 
          userPermissions.some(up => up.id === p.id)
        ).slice(0, 3);
        setFavoritePermissions(validFavorites);
      }
    } catch (error) {
      console.error("Error loading saved permissions:", error);
    }
  }, [userPermissions]);

  // Track recently used permissions
  useEffect(() => {
    if (selectedPermission && isDashboard) {
      const permDetail = userPermissions.find(p => p.name === selectedPermission);
      if (permDetail) {
        try {
          // Update recent permissions in localStorage
          const storedRecent = localStorage.getItem('recentPermissions');
          let recentPerms = storedRecent ? JSON.parse(storedRecent) : [];
          
          // Remove the current permission if it already exists
          recentPerms = recentPerms.filter((p: any) => p.id !== permDetail.id);
          
          // Add the current permission to the beginning
          recentPerms.unshift(permDetail);
          
          // Keep only the most recent 5
          recentPerms = recentPerms.slice(0, 5);
          
          localStorage.setItem('recentPermissions', JSON.stringify(recentPerms));
          
          // Update state
          setRecentPermissions(recentPerms.slice(0, 3));
        } catch (error) {
          console.error("Error saving recent permissions:", error);
        }
      }
    }
  }, [selectedPermission, isDashboard, userPermissions]);

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.substring(0, 2).toUpperCase() || "U";

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleFavorite = (permission: any) => {
    try {
      const storedFavorites = localStorage.getItem('favoritePermissions');
      let favoritePerms = storedFavorites ? JSON.parse(storedFavorites) : [];
      
      const isAlreadyFavorite = favoritePerms.some((p: any) => p.id === permission.id);
      
      if (isAlreadyFavorite) {
        // Remove from favorites
        favoritePerms = favoritePerms.filter((p: any) => p.id !== permission.id);
      } else {
        // Add to favorites
        favoritePerms.push(permission);
      }
      
      localStorage.setItem('favoritePermissions', JSON.stringify(favoritePerms));
      
      // Update state
      setFavoritePermissions(favoritePerms.slice(0, 3));
      
      return !isAlreadyFavorite;
    } catch (error) {
      console.error("Error updating favorite permissions:", error);
      return false;
    }
  };

  const isPermissionFavorite = (permission: any) => {
    return favoritePermissions.some(p => p.id === permission.id);
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

  // Sort categories to have a consistent order
  const sortedCategories = Object.keys(permissionsByCategory).sort((a, b) => {
    // Put 'Dashboard' first, 'Other' last
    if (a === 'Dashboard') return -1;
    if (b === 'Dashboard') return 1;
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  const navigateToPermission = (permission: any) => {
    if (permission) {
      window.location.href = `/user/dashboard?permission=${encodeURIComponent(permission.name)}`;
      setMobileMenuOpen(false);
    }
  };

  // Filter out duplicates from recent permissions that appear in main sections
  const filteredRecentPermissions = recentPermissions.filter(recentPerm => {
    // Skip if the permission is "View Dashboard" since we already have a Home link
    if (recentPerm.name === "View Dashboard") return false;
    
    // Keep all other recent permissions
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for desktop */}
      <aside className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white w-64 min-h-screen fixed left-0 top-0 z-30 hidden lg:flex flex-col shadow-xl">
        <div className="p-4 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-indigo-400" />
            <h1 className="font-semibold text-lg bg-gradient-to-r from-indigo-400 to-indigo-200 text-transparent bg-clip-text">RoleSphere</h1>
          </div>
        </div>

        <div className="p-5 mb-4 shrink-0">
          <div className="flex items-center space-x-3 bg-indigo-900/30 p-3 rounded-xl border border-indigo-800/50 backdrop-blur-sm hover:bg-indigo-900/40 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg ring-2 ring-indigo-700 group-hover:from-indigo-400 group-hover:to-violet-400 transition-all">
              <span className="font-medium">{userInitials}</span>
            </div>
            <div>
              <p className="font-medium text-white line-clamp-1">
                {user?.firstName} {user?.lastName || user?.username}
              </p>
              <p className="text-xs text-indigo-300 line-clamp-1">
                {userRoles.map((role) => role.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-grow overflow-auto px-5">
          {/* My Permissions Section */}
          <div className="menu-section pr-3">
            
            {userPermissions.length === 0 ? (
              <div className="py-4 px-4 bg-indigo-950/50 rounded-xl border border-indigo-900/50 backdrop-blur-sm">
                <p className="text-sm text-indigo-300 mb-2">No permissions assigned</p>
                <p className="text-xs text-indigo-400">Contact your administrator to get access to system features.</p>
                </div>
              ) : sortedCategories.length > 0 ? (
              <TooltipProvider>
                {sortedCategories.map((category, categoryIndex) => (
                  <div key={category} className="mb-5">
                    <div className="text-xs uppercase text-indigo-400 tracking-wider mb-2 pl-2 font-medium">
                      {category}
                    </div>
                    {permissionsByCategory[category].map((permission, index) => (
                      <div key={permission.id} className="relative group">
                        <Link to={`/user/dashboard?permission=${encodeURIComponent(permission.name)}`} className={cn(
                          "menu-item flex items-center py-2.5 px-3 rounded-xl mb-1.5 transition-all duration-300 relative",
                          selectedPermission === permission.name
                            ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md"
                            : "text-indigo-100 hover:bg-white/10 hover:text-white",
                          animateItems 
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-4 opacity-0"
                        )} style={{ transitionDelay: `${(categoryIndex * 100) + (index * 50) + 200}ms` }}>
                          <div className={cn(
                            "bg-white/10 p-2 rounded-lg mr-3 shrink-0",
                            selectedPermission === permission.name
                              ? "bg-white/20" 
                              : "group-hover:bg-white/15"
                          )}>
                            {getPermissionIcon(permission)}
                          </div>
                          <span className="font-medium text-sm truncate">{permission.name}</span>
                          
                          {selectedPermission === permission.name && (
                            <ChevronRight className="h-4 w-4 ml-auto shrink-0 opacity-70" />
                          )}
                          
                          {/* Active indicator bar */}
                          {selectedPermission === permission.name && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full" />
                          )}
                        </Link>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => toggleFavorite(permission)}
                              className={cn(
                                "absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full",
                                isPermissionFavorite(permission) 
                                  ? "text-amber-400 hover:text-amber-300" 
                                  : "opacity-0 group-hover:opacity-100 text-indigo-300 hover:text-indigo-200"
                              )}
                            >
                              <Star className="h-3.5 w-3.5" fill={isPermissionFavorite(permission) ? "currentColor" : "none"} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {isPermissionFavorite(permission) ? "Remove from favorites" : "Add to favorites"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ))}
              </TooltipProvider>
              ) : (
              <p className="text-indigo-300 text-sm">Loading permissions...</p>
            )}
                </div>
          
          {/* Main Navigation Section */}
          <div className="mt-6 pr-3">
            <div className="text-xs uppercase text-indigo-300 tracking-wider mb-4 ml-2 font-semibold">
              NAVIGATION
            </div>

            {/* Reports Link */}
            <Link to="/user/reports" className={cn(
              "menu-item flex items-center py-2.5 px-3 rounded-xl mb-1.5 transition-all duration-300 relative group",
              isReports
                ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md"
                : "text-indigo-100 hover:bg-white/10 hover:text-white",
              animateItems ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
            )} style={{ transitionDelay: "250ms" }}>
              <div className={cn(
                "bg-white/10 p-2 rounded-lg mr-3",
                isReports
                  ? "bg-white/20" 
                  : "group-hover:bg-white/15"
              )}>
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">Reports</span>
              
              {isReports && (
                <>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full" />
                </>
              )}
            </Link>
            
            {/* Users Link */}
            <Link to="/user/users" className={cn(
              "menu-item flex items-center py-2.5 px-3 rounded-xl mb-1.5 transition-all duration-300 relative group",
              isUsers
                ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md"
                : "text-indigo-100 hover:bg-white/10 hover:text-white",
              animateItems ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
            )} style={{ transitionDelay: "300ms" }}>
              <div className={cn(
                "bg-white/10 p-2 rounded-lg mr-3",
                isUsers
                  ? "bg-white/20" 
                  : "group-hover:bg-white/15"
              )}>
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">User Management</span>
              
              {isUsers && (
                <>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full" />
                </>
              )}
            </Link>
        </div>
        </ScrollArea>

        <div className="pt-4 mt-auto border-t border-indigo-800/50 p-5 shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-indigo-200 hover:text-white hover:bg-indigo-800/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-900 to-indigo-950 text-white w-64 min-h-screen fixed left-0 top-0 z-50 transition-transform transform lg:hidden shadow-xl flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-indigo-400" />
            <h1 className="font-semibold text-lg bg-gradient-to-r from-indigo-400 to-indigo-200 text-transparent bg-clip-text">RoleSphere</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-white hover:bg-indigo-800/50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-5 mb-4 shrink-0">
          <div className="flex items-center space-x-3 bg-indigo-900/30 p-3 rounded-xl border border-indigo-800/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg ring-2 ring-indigo-700">
              <span className="font-medium">{userInitials}</span>
            </div>
            <div>
              <p className="font-medium text-white line-clamp-1">
                {user?.firstName} {user?.lastName || user?.username}
              </p>
              <p className="text-xs text-indigo-300 line-clamp-1">
                {userRoles.map((role) => role.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-grow overflow-auto px-5">
          {/* Mobile My Permissions Section */}
          <div className="menu-section pr-3">
            
            {userPermissions.length === 0 ? (
              <div className="py-4 px-4 bg-indigo-950/50 rounded-xl border border-indigo-900/50 backdrop-blur-sm">
                <p className="text-sm text-indigo-300 mb-2">No permissions assigned</p>
                <p className="text-xs text-indigo-400">Contact your administrator to get access to system features.</p>
                </div>
              ) : sortedCategories.length > 0 ? (
              <TooltipProvider>
                {sortedCategories.map((category, categoryIndex) => (
                  <div key={category} className="mb-5">
                    <div className="text-xs uppercase text-indigo-400 tracking-wider mb-2 pl-2 font-medium">
                      {category}
                    </div>
                    {permissionsByCategory[category].map((permission, index) => (
                      <div key={permission.id} className="relative group">
                        <Link to={`/user/dashboard?permission=${encodeURIComponent(permission.name)}`} className={cn(
                          "menu-item flex items-center py-2.5 px-3 rounded-xl mb-1.5 transition-all duration-300 relative",
                          selectedPermission === permission.name
                            ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md"
                            : "text-indigo-100 hover:bg-white/10 hover:text-white"
                        )} onClick={toggleMobileMenu}>
                          <div className={cn(
                            "bg-white/10 p-2 rounded-lg mr-3 shrink-0",
                            selectedPermission === permission.name
                              ? "bg-white/20" 
                              : "group-hover:bg-white/15"
                          )}>
                            {getPermissionIcon(permission)}
                          </div>
                          <span className="font-medium text-sm truncate">{permission.name}</span>
                          
                          {selectedPermission === permission.name && (
                            <ChevronRight className="h-4 w-4 ml-auto shrink-0 opacity-70" />
                          )}
                          
                          {/* Active indicator bar */}
                          {selectedPermission === permission.name && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full" />
                          )}
                        </Link>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => toggleFavorite(permission)}
                              className={cn(
                                "absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full",
                                isPermissionFavorite(permission) 
                                  ? "text-amber-400 hover:text-amber-300" 
                                  : "opacity-0 group-hover:opacity-100 text-indigo-300 hover:text-indigo-200"
                              )}
                            >
                              <Star className="h-3.5 w-3.5" fill={isPermissionFavorite(permission) ? "currentColor" : "none"} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {isPermissionFavorite(permission) ? "Remove from favorites" : "Add to favorites"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ))}
              </TooltipProvider>
              ) : (
              <p className="text-indigo-300 text-sm">Loading permissions...</p>
            )}
                </div>
          
          {/* Mobile Main Navigation Section */}
          <div className="mt-6 pr-3">
            <div className="text-xs uppercase text-indigo-300 tracking-wider mb-4 ml-2 font-semibold">
              NAVIGATION
            </div>

            {/* Reports Link - Mobile */}
            <Link to="/user/reports" className={cn(
              "menu-item flex items-center py-2.5 px-3 rounded-xl mb-1.5 transition-all duration-300 relative group",
              isReports
                ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md"
                : "text-indigo-100 hover:bg-white/10 hover:text-white"
            )} onClick={toggleMobileMenu}>
              <div className={cn(
                "bg-white/10 p-2 rounded-lg mr-3",
                isReports ? "bg-white/20" : "group-hover:bg-white/15"
              )}>
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">Reports</span>
              
              {isReports && (
                <>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full" />
                </>
              )}
            </Link>
            
            {/* Users Link - Mobile */}
            <Link to="/user/users" className={cn(
              "menu-item flex items-center py-2.5 px-3 rounded-xl mb-1.5 transition-all duration-300 relative group",
              isUsers
                ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md"
                : "text-indigo-100 hover:bg-white/10 hover:text-white"
            )} onClick={toggleMobileMenu}>
              <div className={cn(
                "bg-white/10 p-2 rounded-lg mr-3",
                isUsers ? "bg-white/20" : "group-hover:bg-white/15"
              )}>
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">User Management</span>
              
              {isUsers && (
                <>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full" />
                </>
              )}
            </Link>
          </div>
        </ScrollArea>
            
        <div className="pt-4 mt-auto border-t border-indigo-800/50 p-5 shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-indigo-200 hover:text-white hover:bg-indigo-800/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 w-full bg-slate-50 min-h-screen">
        {/* Mobile header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm py-3 px-4 flex items-center justify-between lg:hidden sticky top-0 z-30 border-b border-slate-200/70">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-xl bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent line-clamp-1">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm py-5 px-8 hidden lg:flex items-center justify-between sticky top-0 z-20 border-b border-slate-200/70">
          <h1 className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">{title}</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
        </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-8 max-w-7xl mx-auto animate-fadeIn">
        {children}
      </main>
      </div>
    </div>
  );
}
