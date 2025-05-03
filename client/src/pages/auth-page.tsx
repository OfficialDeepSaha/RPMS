import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Shield, AlertCircle, Lock, ArrowRight, User, KeyRound, RefreshCw, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Extract redirect path and maintenance flag from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/";
  const maintenanceParam = searchParams.get("maintenance") === "true";
  
  // Get authentication data once
  const { user, isAdmin, loginMutation } = useAuth();
  
  // Check maintenance mode status
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.maintenance === true);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set maintenance mode from URL parameter or fetch from API
    if (maintenanceParam) {
      setMaintenanceMode(true);
      setIsLoading(false);
    } else {
      checkMaintenanceMode();
    }
  }, [maintenanceParam]);
  
  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1200); // Faster animation
    
    return () => clearTimeout(timer);
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      // If in maintenance mode, add a special flag for maintenance login
      if (maintenanceMode) {
        console.log("System in maintenance mode, attempting admin login");
        // For maintenance mode, ensure we pass a flag to the server
        await loginMutation.mutateAsync({
          ...data, 
          maintenanceMode: true // This flag is now properly typed in LoginData
        });
      } else {
        // Normal login flow
        await loginMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error already handled by the mutation
      console.error("Login error:", error);
    }
  };

  // Handle redirection after login using useEffect rather than during render
  useEffect(() => {
    if (user) {
      navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  // If user is already logged in, show loading state while redirection happens
  if (user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-blue-600/20 animate-ping absolute -inset-2.5"></div>
          <Loader2 className="h-14 w-14 animate-spin text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.7)]" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-blue-600/20 animate-ping absolute -inset-2.5"></div>
          <Loader2 className="h-14 w-14 animate-spin text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.7)]" />
        </div>
      </div>
    );
  }

  // Calculate subtle parallax movement based on mouse position
  const calcMovement = (value: number, range: number, dimension: number) => {
    return ((value / dimension) * range - range / 2).toFixed(1);
  };
  
  const translateX = mousePosition.x ? calcMovement(mousePosition.x, 30, window.innerWidth) : '0';
  const translateY = mousePosition.y ? calcMovement(mousePosition.y, 30, window.innerHeight) : '0';

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center overflow-hidden relative py-12 px-4 sm:px-6 lg:px-8"
      style={{backgroundImage: `radial-gradient(circle at 50% 50%, rgba(20, 30, 58, 0.7) 0%, rgba(10, 12, 25, 0.9) 100%)`}}
    >
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Improved animated gradient background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(125deg, rgba(13, 14, 25, 0) 30%, rgba(59, 130, 246, 0.3) 50%, rgba(99, 102, 241, 0.2) 70%, rgba(13, 14, 25, 0) 100%)`,
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 12s ease infinite'
          }}
        ></div>
        
        {/* Enhanced grid overlay */}
        <div className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMzAgNUwzMCAzMCAzMCA1NSI+PC9wYXRoPjxwYXRoIGQ9Ik01IDMwTDMwIDMwIDU1IDMwIj48L3BhdGg+PC9nPjwvc3ZnPg==')]"></div>
      
        {/* Enhanced gradient orbs with improved parallax effect */}
        <div 
          className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full pointer-events-none opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(56,189,248,0.6) 0%, rgba(59,130,246,0.4) 40%, rgba(30,64,175,0.2) 70%, rgba(17,24,39,0) 100%)',
            transform: `translate(${translateX}px, ${translateY}px) scale(1.05)`,
            transition: 'transform 0.2s ease-out'
          }}
        ></div>
        
        <div 
          className="absolute bottom-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(79,70,229,0.4) 40%, rgba(67,56,202,0.2) 70%, rgba(17,24,39,0) 100%)',
            transform: `translate(${-Number(translateX) * 0.7}px, ${-Number(translateY) * 0.7}px) scale(1.05)`,
            transition: 'transform 0.2s ease-out'
          }}
        ></div>
        
        {/* Enhanced animated particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div 
              key={`particle-${i}`}
              className="absolute rounded-full bg-blue-400/40 animate-float-particle"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 15}s`
              }}
            />
          ))}
        </div>
        
        {/* Enhanced animated scan lines */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZGVmcz4KICA8cGF0dGVybiBpZD0ic2NhbmxpbmVzIiB3aWR0aD0iMSIgaGVpZ2h0PSI0IiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoOTApIj4KICAgIDxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIiBzdHJva2U9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyApIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNzY2FubGluZXMpIiAvPgo8L3N2Zz4=')]"></div>
        
        {/* Improved scanner line effect */}
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent top-0 animate-scanner-line"></div>
      </div>
      
      {/* Improved main content with better entry animations */}
      <div className={cn(
        "relative z-10 w-full max-w-md transition-all duration-800 transform",
        animationComplete ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}>
        {/* Logo and branding - better aligned */}
        <div className="flex flex-col items-center justify-center mb-10">
          {/* Animated logo with enhanced glow */}
          <div className="relative group">
            {/* Improved outer glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000 animate-pulse-slow"></div>
            
            {/* Enhanced main logo container */}
            <div className="relative h-24 w-24 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg overflow-hidden border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-500">
              {/* Improved ambient light reflection */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -left-10 -top-10 h-20 w-20 bg-white rounded-full blur-xl animate-pulse-slow"></div>
              </div>
              
              {/* Enhanced animated corner accents */}
              <div className="absolute h-[2px] w-full top-0 left-0 bg-gradient-to-r from-transparent via-blue-300/90 to-transparent opacity-70 animate-pulse-slow"></div>
              <div className="absolute h-full w-[2px] top-0 right-0 bg-gradient-to-b from-transparent via-indigo-300/90 to-transparent opacity-70 animate-pulse-slow" style={{ animationDelay: "1.5s" }}></div>
              <div className="absolute h-[2px] w-full bottom-0 left-0 bg-gradient-to-r from-transparent via-blue-300/60 to-transparent opacity-70 animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
              <div className="absolute h-full w-[2px] top-0 left-0 bg-gradient-to-b from-transparent via-indigo-300/60 to-transparent opacity-70 animate-pulse-slow" style={{ animationDelay: "0.5s" }}></div>
              
              {/* Enhanced logo icon */}
              <div className="z-10 transform group-hover:scale-110 transition-all duration-700">
                <Shield className="h-12 w-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
              </div>
              
              {/* Enhanced animated particles inside logo */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={`logo-particle-${i}`}
                    className="absolute w-1 h-1 bg-blue-200 rounded-full animate-float-particle"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.3}s`,
                      opacity: 0.8
                    }}
                  />
                ))}
              </div>
              
              {/* Enhanced data scan effect animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent h-[40%] animate-scanner opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          
          {/* Improved animated text with enhanced glow effects */}
          <h2 className="mt-8 text-center text-4xl font-bold tracking-tight relative group">
            <span className="bg-gradient-to-r from-blue-100 via-indigo-200 to-white bg-clip-text text-transparent drop-shadow-sm relative inline-block">
              RoleSphere
              {/* Enhanced text glow effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-indigo-400/0 to-white/0 group-hover:via-indigo-400/30 filter blur-md transition-all duration-500"></span>
            </span>
            
            {/* Enhanced animated underline effect */}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-700 bg-gradient-to-r from-blue-400 to-indigo-500"></span>
          </h2>
          
          {/* Enhanced subtitle with icon and status indicator */}
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.7)]"></div>
            <p className="text-sm text-blue-300/90 flex items-center font-medium tracking-widest uppercase">
              SECURE ACCESS PORTAL
            </p>
          </div>
        </div>
        
        {/* Enhanced futuristic maintenance mode alert with advanced styling */}
        {maintenanceMode && (
          <div className={cn(
            "mb-8 transition-all duration-700 transform",
            animationComplete ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
          )}>
            <div className="relative overflow-hidden rounded-xl">
              {/* Animated neon border effect */}
              <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 animate-gradient-shift"></div>
              <div className="absolute -inset-[1px] rounded-xl z-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50 blur-sm animate-pulse-slow"></div>
              
              {/* Main alert container */}
              <div className="relative z-10 p-5 backdrop-blur-md bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                {/* Animated scanning line effect */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent top-0 animate-scanner-line"></div>
                
                {/* Decorative circuit pattern background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTBIMzBWMzBIMTBWMTBaTTQwIDEwSDYwVjMwSDQwVjEwWk03MCAxMEg5MFYzMEg3MFYxMFpNMTAgNDBIMzBWNjBIMTBWNDBaTTQwIDQwSDYwVjYwSDQwVjQwWk03MCA0MEg5MFY2MEg3MFY0MFpNMTAgNzBIMzBWOTBIMTBWNzBaTTQwIDcwSDYwVjkwSDQwVjcwWk03MCA3MEg5MFY5MEg3MFY3MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5OSwxMDIsMjQxLDAuMikiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]  opacity-10"></div>
                
                {/* Main content */}
                <div className="flex gap-4">
                  {/* Left icon with animated glow */}
                  <div className="shrink-0 relative">
                    <div className="absolute -inset-1 rounded-full bg-indigo-500/30 animate-pulse blur-md"></div>
                    <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-3 rounded-full shadow-lg border border-indigo-400/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-white drop-shadow-glow" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent mb-1 flex items-center">
                      System Maintenance
                      <div className="ml-3 h-2 w-2 rounded-full bg-indigo-400 animate-ping"></div>
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-slate-300 leading-relaxed">
                        The system is currently in maintenance mode.
                      </p>
                      <div className="flex items-center text-indigo-300 font-medium">
                        <div className="h-1 w-1 rounded-full bg-indigo-400 mr-2 animate-pulse"></div>
                        Only administrators can access the system at this time
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Animated particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={`maintenance-particle-${i}`}
                    className="absolute rounded-full bg-indigo-400 animate-float-slow"
                    style={{
                      width: `${3 + Math.random() * 3}px`,
                      height: `${3 + Math.random() * 3}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${10 + Math.random() * 20}s`,
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced login card with improved glassmorphism effect */}
        <div className={cn(
          "transition-all duration-1000 transform",
          animationComplete ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        )}>
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
            {/* Enhanced card ambient glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 via-blue-500/20 to-indigo-500/5 rounded-xl blur-md"></div>
            
            {/* Enhanced card glass container */}
            <div className="relative bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-inner">
              {/* Enhanced card decoration elements */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
              <div className="absolute right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500/40 to-transparent"></div>
              <div className="absolute left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-slate-500/40 to-transparent"></div>
              
              {/* Enhanced card corner accents */}
              <div className="absolute top-0 right-0 h-12 w-12 overflow-hidden">
                <div className="absolute top-0 right-0 h-[1px] w-10 bg-gradient-to-l from-blue-400/90 to-transparent"></div>
                <div className="absolute top-0 right-0 h-10 w-[1px] bg-gradient-to-b from-blue-400/90 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 h-12 w-12 overflow-hidden">
                <div className="absolute bottom-0 left-0 h-[1px] w-10 bg-gradient-to-r from-blue-400/90 to-transparent"></div>
                <div className="absolute bottom-0 left-0 h-10 w-[1px] bg-gradient-to-t from-blue-400/90 to-transparent"></div>
              </div>
              
              {/* Enhanced card content with improved spacing and alignment */}
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 p-3 rounded-lg shadow-inner border border-white/5">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                      {maintenanceMode ? "Administrator Access" : "Welcome Back"}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {maintenanceMode 
                        ? "Admin credentials required" 
                        : "Sign in to your account"}
                    </p>
                  </div>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    {/* Enhanced username input with improved styling */}
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 ml-1 flex items-center gap-1.5 font-medium">
                            <span className="text-blue-400 text-xs font-mono">01</span> Username
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              {/* Enhanced input glow effect on focus */}
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-focus-within:from-blue-500/30 group-focus-within:to-indigo-500/30 rounded-md blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                              
                              <div className="relative bg-slate-800/60 border border-slate-700/60 group-focus-within:border-blue-500/60 rounded-md flex overflow-hidden transition-all duration-300">
                                <div className="flex items-center justify-center w-10 bg-slate-800/90 border-r border-slate-700/50 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                  <User className="h-4 w-4" />
                                </div>
                                <Input 
                                  placeholder={maintenanceMode ? "Admin username" : "Enter your username"} 
                                  {...field} 
                                  className="border-0 bg-transparent rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-500 h-11"
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage className="ml-1 text-rose-400 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                    
                    {/* Enhanced password input with improved styling */}
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 ml-1 flex items-center gap-1.5 font-medium">
                            <span className="text-blue-400 text-xs font-mono">02</span> Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              {/* Enhanced input glow effect on focus */}
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-focus-within:from-blue-500/30 group-focus-within:to-indigo-500/30 rounded-md blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                              
                              <div className="relative bg-slate-800/60 border border-slate-700/60 group-focus-within:border-blue-500/60 rounded-md flex overflow-hidden transition-all duration-300">
                                <div className="flex items-center justify-center w-10 bg-slate-800/90 border-r border-slate-700/50 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                  <KeyRound className="h-4 w-4" />
                                </div>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your password" 
                                  {...field}
                                  className="border-0 bg-transparent rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-500 h-11"
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage className="ml-1 text-rose-400 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                    
                    {/* Enhanced login button with advanced effects */}
                    <div className="pt-4">
                      <div className="relative group">
                        {/* Enhanced button ambient glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-500 animate-pulse-slow"></div>
                        
                        <Button 
                          type="submit" 
                          className="relative w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-md font-medium transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]"
                          disabled={loginMutation.isPending}
                        >
                          {/* Enhanced animated background scan effect */}
                          <div className="absolute inset-0 overflow-hidden rounded-md">
                            <div className="absolute -inset-[400%] h-[600%] w-[100%] bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shine"></div>
                          </div>
                          
                          {/* Enhanced button content with loading state */}
                          <div className="relative flex items-center justify-center gap-2 text-base">
                            {loginMutation.isPending ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Authenticating...</span>
                              </>
                            ) : maintenanceMode ? (
                              <>
                                <Lock className="h-4 w-4" />
                                <span>Administrator Login</span>
                                <Sparkles className="h-3.5 w-3.5 text-blue-300/90 ml-1 animate-pulse-fast" />
                              </>
                            ) : (
                              <>
                                <span>Access Secure Portal</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Enhanced authentication error message with improved styling */}
                    {loginMutation.isError && (
                      <div className="mt-5 animate-fadeIn">
                        <Alert className="bg-gradient-to-r from-rose-900/50 to-rose-800/30 border border-rose-500/30 text-rose-200 rounded-lg backdrop-blur-md overflow-hidden relative">
                          <div className="absolute inset-0 bg-rose-900/10 pulse"></div>
                          <div className="relative z-10 flex">
                            <div className="bg-rose-700/30 p-1.5 rounded-full mr-3">
                              <AlertCircle className="h-4 w-4 text-rose-300" />
                            </div>
                            <div>
                              <AlertTitle className="text-sm font-semibold text-rose-200">Authentication Failed</AlertTitle>
                              <AlertDescription className="text-xs text-rose-200/90 mt-1">
                                {maintenanceMode && loginMutation.error?.message?.includes("maintenance")
                                  ? "Only administrators can login during maintenance mode."
                                  : loginMutation.error?.message || "Invalid username or password."}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      </div>
                    )}
                    
                    {/* Enhanced password recovery or help link */}
                    <div className="mt-6 text-center">
                      <a 
                        href="#" 
                        className="text-sm text-slate-400 hover:text-blue-400 transition-colors duration-300 relative inline-block group"
                      >
                        Forgot password or need help?
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-blue-400/50 group-hover:w-full transition-all duration-300"></span>
                      </a>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </Card>
          
          {/* Enhanced footer text */}
          <div className="mt-8 text-center animate-fadeIn">
            <p className="text-xs text-slate-500/80 tracking-wide">
              © {new Date().getFullYear()} RoleSphere · Secure Role-Based Access Control
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced custom animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes scanner {
          0%, 100% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            transform: translateY(100%);
            opacity: 1;
          }
        }
        
        @keyframes scanner-line {
          0%, 100% {
            transform: translateY(-100vh);
            opacity: 0;
          }
          50% {
            transform: translateY(100vh);
            opacity: 0.8;
          }
        }
        
        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-15px) translateX(10px);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-30px) translateX(20px);
            opacity: 0;
          }
        }
        
        @keyframes float-slow {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-15px) translateX(10px);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }
        
        @keyframes pulse-fast {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          from {
            transform: translateX(-150%);
          }
          to {
            transform: translateX(150%);
          }
        }
        
        @keyframes shine {
          from {
            transform: translateX(-100%) skewX(-15deg);
          }
          to {
            transform: translateX(100%) skewX(-15deg);
          }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 8s ease infinite;
          background-size: 200% 200%;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-particle {
          animation: float-particle 3s ease-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-fast {
          animation: pulse-fast 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-scanner {
          animation: scanner 8s ease infinite;
        }
        
        .animate-scanner-line {
          animation: scanner-line 10s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .drop-shadow-glow {
          filter: drop-shadow(0 0 5px rgba(99, 102, 241, 0.7));
        }
      `}} />
    </div>
  );
}
