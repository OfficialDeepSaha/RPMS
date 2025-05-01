import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Shield, AlertCircle, Lock, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      // If in maintenance mode, add a warning for non-admin users 
      if (maintenanceMode && data.username !== 'admin') {
        console.log("Warning: System in maintenance mode, only admins can login");
      }

      await loginMutation.mutateAsync(data);
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
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          RoleSphere
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure Access Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {maintenanceMode && (
          <Alert variant="destructive" className="mb-6 border-amber-500 bg-amber-50 border-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-800 text-lg font-semibold">System Maintenance</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mt-1">The system is currently in maintenance mode.</p>
              <p className="mt-2 font-medium">Only administrators can access the system at this time.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="border shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              {maintenanceMode 
                ? "Administrator access only during maintenance" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={maintenanceMode ? "Admin username" : "Enter your username"} 
                          {...field} 
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : maintenanceMode ? (
                    <Lock className="mr-2 h-4 w-4" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {maintenanceMode ? "Administrator Login" : "Sign In"}
                </Button>
                
                {loginMutation.isError && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {maintenanceMode && loginMutation.error?.message?.includes("maintenance")
                        ? "Only administrators can login during maintenance mode."
                        : loginMutation.error?.message || "Invalid username or password."}
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter className="pt-0">
            {maintenanceMode && (
              <p className="text-xs text-gray-500 w-full text-center">
                The system is undergoing scheduled maintenance. 
                Regular users will regain access once maintenance is complete.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
