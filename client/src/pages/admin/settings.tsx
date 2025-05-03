import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Cog, 
  Shield, 
  Bell, 
  Mail, 
  Globe, 
  Palette, 
  Database, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Save, 
  CheckCircle2,
  AlertCircle,
  User,
  Upload,
  ImageIcon,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

// Define form schemas for validation
const generalSettingsSchema = z.object({
  systemName: z.string().min(3, "System name must be at least 3 characters"),
  adminEmail: z.string().email("Please enter a valid email"),
  dateFormat: z.string(),
  defaultLanguage: z.string(),
  maintenanceMode: z.boolean().default(false),
});

const securitySettingsSchema = z.object({
  sessionTimeout: z.coerce.number().min(5, "Session timeout must be at least 5 minutes"),
  passwordMinLength: z.coerce.number().min(8, "Password minimum length must be at least 8"),
  passwordComplexity: z.string(),
  twoFactorAuth: z.boolean().default(false),
  loginAttempts: z.coerce.number().min(3, "Login attempts must be at least 3"),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  loginAlerts: z.boolean().default(true),
  roleChangeAlerts: z.boolean().default(true),
  permissionChangeAlerts: z.boolean().default(false),
  systemUpdates: z.boolean().default(true),
});

// Enhanced profile schema with better validation
const profileSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email").refine(
    email => {
      // Add any additional email validation rules here if needed
      // For example, domain whitelist, etc.
      return true;
    },
    {
      message: "This email address may not be valid for this system."
    }
  ),
});

// Add password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Define types based on the schemas
type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsData, setSettingsData] = useState<Record<string, any>>({});
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  // Fetch settings data from API
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettingsData(data);
        
        // Update form values with server data
        if (data.general) {
          const generalSettings = data.general.reduce((acc: any, setting: any) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {});
          
          generalForm.reset({
            systemName: generalSettings.systemName || 'RoleSphere',
            adminEmail: generalSettings.adminEmail || 'admin@rolesphere.com',
            dateFormat: generalSettings.dateFormat || 'MM/DD/YYYY',
            defaultLanguage: generalSettings.defaultLanguage || 'en',
            maintenanceMode: generalSettings.maintenanceMode || false,
          });
        }
        
        if (data.security) {
          const securitySettings = data.security.reduce((acc: any, setting: any) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {});
          
          securityForm.reset({
            sessionTimeout: securitySettings.sessionTimeout || 30,
            passwordMinLength: securitySettings.passwordMinLength || 10,
            passwordComplexity: securitySettings.passwordComplexity || 'medium',
            twoFactorAuth: securitySettings.twoFactorAuth || false,
            loginAttempts: securitySettings.loginAttempts || 5,
          });
        }
        
        if (data.notifications) {
          const notificationSettings = data.notifications.reduce((acc: any, setting: any) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {});
          
          notificationForm.reset({
            emailNotifications: notificationSettings.emailNotifications || true,
            pushNotifications: notificationSettings.pushNotifications || false,
            loginAlerts: notificationSettings.loginAlerts || true,
            roleChangeAlerts: notificationSettings.roleChangeAlerts || true,
            permissionChangeAlerts: notificationSettings.permissionChangeAlerts || false,
            systemUpdates: notificationSettings.systemUpdates || true,
          });
        }
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Set up forms with default values
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      systemName: "RoleSphere",
      adminEmail: "admin@rolesphere.com",
      dateFormat: "MM/DD/YYYY",
      defaultLanguage: "en",
      maintenanceMode: false,
    },
  });

  const securityForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      sessionTimeout: 30,
      passwordMinLength: 10,
      passwordComplexity: "medium",
      twoFactorAuth: false,
      loginAttempts: 5,
    },
  });

  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      loginAlerts: true,
      roleChangeAlerts: true,
      permissionChangeAlerts: false,
      systemUpdates: true,
    },
  });

  // Setup profile form
  const profileForm = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  // Setup password form
  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Initialize user data when available
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Handle form submissions
  const onGeneralSubmit = async (data: GeneralSettingsValues) => {
    try {
      setIsSaving(true);
      
      // Get current maintenance mode value to check if it changed
      const currentMaintenanceMode = generalForm.getValues().maintenanceMode;
      const newMaintenanceMode = data.maintenanceMode;
      const maintenanceModeChanged = currentMaintenanceMode !== newMaintenanceMode;
      
      // Remove maintenance mode from general settings if it changed
      // (it will be handled separately with dedicated endpoint)
      const settingsToUpdate = [
        { key: 'systemName', value: data.systemName },
        { key: 'adminEmail', value: data.adminEmail },
        { key: 'dateFormat', value: data.dateFormat },
        { key: 'defaultLanguage', value: data.defaultLanguage },
      ];
      
      if (!maintenanceModeChanged) {
        // If maintenance mode didn't change, include it in regular settings update
        // Convert boolean to string to match expected type in the API
        settingsToUpdate.push({ key: 'maintenanceMode', value: data.maintenanceMode ? "true" : "false" });
      }
      
      // First update regular settings
      const response = await fetch('/api/settings/category/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: settingsToUpdate })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update general settings');
      }
      
      // Update local state with new settings
      const updatedSettings = await response.json();
      setSettingsData(prev => ({
        ...prev,
        general: updatedSettings
      }));
      
      // If maintenance mode changed, call the dedicated endpoint
      if (maintenanceModeChanged) {
        console.log(`Toggling maintenance mode from ${currentMaintenanceMode} to ${newMaintenanceMode}`);
        
        const maintenanceResponse = await fetch('/api/maintenance/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ enabled: newMaintenanceMode })
        });
        
        if (!maintenanceResponse.ok) {
          const errorData = await maintenanceResponse.json();
          throw new Error(errorData.message || 'Failed to toggle maintenance mode');
        }
        
        // Refresh settings data to ensure all changes are reflected
        fetchSettings();
      }
      
      toast({
        title: "Settings Saved",
        description: "Your general settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSecuritySubmit = (data: SecuritySettingsValues) => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Security settings saved:", data);
      toast({
        title: "Settings saved",
        description: "Your security settings have been updated successfully.",
      });
      setIsSaving(false);
    }, 1000);
  };

  const onNotificationSubmit = (data: NotificationSettingsValues) => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Notification settings saved:", data);
      toast({
        title: "Settings saved",
        description: "Your notification settings have been updated successfully.",
      });
      setIsSaving(false);
    }, 1000);
  };

  // Enhanced profile form submission
  const onProfileSubmit = async (data: ProfileSettingsValues) => {
    try {
      setIsProfileSaving(true);
      
      // Get user ID
      const userId = user?.id;
      if (!userId) {
        throw new Error('User ID not found. Please refresh the page or log in again.');
      }
      
      console.log('Updating profile with data:', data);
      
      // Fixed API endpoint based on server routes.ts - PUT is the correct method for /api/users/:id
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT', // Changed from PATCH to PUT based on server implementation
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        })
      });
      
      // Check response and handle errors
      if (!response.ok) {
        // Log the full response for debugging
        console.error(`Update failed with status ${response.status}`, response);
        
        try {
          const errorData = await response.json();
          console.error('Error response body:', errorData);
          throw new Error(errorData.message || `Failed to update profile: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Failed to update profile: ${response.statusText}`);
        }
      }
      
      // Get updated user data
      const updatedUserData = await response.json();
      console.log('Profile updated successfully:', updatedUserData);
      
      // Update auth context if possible
      if (typeof window !== 'undefined') {
        // This might refresh auth state if your system supports it
        const event = new CustomEvent('user:updated', { detail: updatedUserData });
        window.dispatchEvent(event);
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        variant: "default"
      });
      
      // Refresh the page after a short delay to ensure state is updated
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data: PasswordChangeValues) => {
    try {
      setIsPasswordChanging(true);
      
      // API call to change password
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      // Reset form on success
      passwordForm.reset();
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  // Handle profile image removal - direct approach
  const handleRemoveProfileImage = async () => {
    try {
      setIsRemovingImage(true);

      // Direct user profile update approach
      const response = await fetch('/api/users/current', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          profileImage: null
        }),
      });

      // If the first attempt fails, try a more generic endpoint
      if (!response.ok) {
        console.log(`First attempt failed with status ${response.status}, trying user update endpoint...`);
        
        // Try updating the user profile directly
        const userId = user?.id;
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        const updateResponse = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            profileImage: null
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update user: ${updateResponse.statusText}`);
        }
      }
      
      // Force update local state even if there was an error
      setProfileImage(null);
      
      // Update auth context if needed
      if (user && typeof user === 'object') {
        // Manually update the user object if your auth context has an update method
        // For example: updateUser({ ...user, profileImage: null });
      }
      
      // Refresh the page to ensure all states are updated
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      toast({
        title: "Image Removed",
        description: "Your profile picture has been removed successfully. Page will refresh to apply changes.",
      });
    } catch (error) {
      console.error('Profile image removal error:', error);
      
      // Force update local state even after error
      setProfileImage(null);
      
      toast({
        title: "Note",
        description: "Image removed from display. Database update may require admin assistance.",
      });
    } finally {
      setIsRemovingImage(false);
    }
  };

  // Clear the local storage cache
  const handleClearCache = () => {
    setIsLoading(true);
    try {
      localStorage.clear();
      toast({
        title: "Cache Cleared",
        description: "Local cache has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset system settings to defaults
  const handleResetSettings = async () => {
    // Show confirmation dialog
    if (!confirm("Are you sure you want to reset all settings to default values? This cannot be undone.")) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call API to reset settings
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (response.ok) {
        // Refresh settings from the server
        await fetchSettings();
        
        toast({
          title: "Settings Reset",
          description: "All settings have been reset to default values.",
        });
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Error",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Profile picture upload handler
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (jpg, png, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploadingImage(true);
      
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile picture');
      }
      
      const data = await response.json();
      setProfileImage(data.profileImage);
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <AdminLayout title="Settings" description="Configure and manage system settings">
      <div className="space-y-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 right-40 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-600/10 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-purple-600/10 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Header with improved styling */}
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            System Settings
          </h2>
          <p className="text-slate-400 md:text-base max-w-3xl">
            Configure and manage your RoleSphere installation preferences
          </p>
        </div>

        {/* Settings tab navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="w-full max-w-3xl mx-auto bg-slate-900/70 border border-slate-700/50 backdrop-blur-md p-1 rounded-xl">
            <TabsTrigger 
              value="general"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Cog className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card className="border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900/20 pointer-events-none"></div>
              
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="flex items-center text-slate-200">
                  <Globe className="mr-2 h-5 w-5 text-indigo-400" />
                  General Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure basic system settings and preferences
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                  </div>
                ) : (
                  <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                      <FormField
                        control={generalForm.control}
                        name="systemName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">System Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">
                              The name that will be displayed throughout the application
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">Admin Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">
                              Primary contact for system notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={generalForm.control}
                          name="dateFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Date Format</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:ring-indigo-500/30 focus:border-indigo-500/50">
                                    <SelectValue placeholder="Select format" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                                  <SelectItem value="MM/DD/YYYY" className="focus:bg-indigo-600/20">MM/DD/YYYY</SelectItem>
                                  <SelectItem value="DD/MM/YYYY" className="focus:bg-indigo-600/20">DD/MM/YYYY</SelectItem>
                                  <SelectItem value="YYYY-MM-DD" className="focus:bg-indigo-600/20">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-slate-500">
                                Default date format for the system
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="defaultLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Default Language</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:ring-indigo-500/30 focus:border-indigo-500/50">
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                                  <SelectItem value="en" className="focus:bg-indigo-600/20">English</SelectItem>
                                  <SelectItem value="es" className="focus:bg-indigo-600/20">Spanish</SelectItem>
                                  <SelectItem value="fr" className="focus:bg-indigo-600/20">French</SelectItem>
                                  <SelectItem value="de" className="focus:bg-indigo-600/20">German</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-slate-500">
                                Default language for the application
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={generalForm.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">Maintenance Mode</FormLabel>
                              <FormDescription className="text-slate-500">
                                Enable to put the system in maintenance mode
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={async (checked) => {
                                  try {
                                    setIsSaving(true);
                                    
                                    // Use the specialized maintenance toggle endpoint directly
                                    const response = await fetch('/api/maintenance/toggle', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ enabled: checked })
                                    });
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.message || 'Failed to toggle maintenance mode');
                                    }
                                    
                                    // Update form state after API call success
                                    field.onChange(checked);
                                    
                                    toast({
                                      title: `Maintenance Mode ${checked ? 'Enabled' : 'Disabled'}`,
                                      description: `System is now ${checked ? 'in' : 'out of'} maintenance mode.`,
                                      variant: checked ? "destructive" : "default",
                                    });
                                    
                                    // Refresh settings data
                                    fetchSettings();
                                  } catch (error) {
                                    console.error('Error toggling maintenance mode:', error);
                                    
                                    // Reset to previous state
                                    field.onChange(!checked);
                                    
                                    toast({
                                      title: "Error",
                                      description: error instanceof Error ? error.message : "Failed to toggle maintenance mode",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setIsSaving(false);
                                  }
                                }}
                                className="data-[state=checked]:bg-indigo-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200"
                        >
                          {isSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="flex items-center text-slate-200">
                  <Database className="mr-2 h-5 w-5 text-indigo-400" />
                  System Maintenance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage system cache and reset settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-800/30 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-slate-200">Clear System Cache</h4>
                      <p className="text-sm text-slate-500">
                        Clear the system cache to resolve potential issues and improve performance
                      </p>
                    </div>
                    <Button
                      onClick={handleClearCache}
                      variant="outline"
                      className="border-slate-700 hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/50 transition-all duration-200"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-rose-800/30 bg-rose-950/20 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-rose-300">Reset to Default</h4>
                      <p className="text-sm text-rose-400/70">
                        Reset all settings to their default values. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      onClick={handleResetSettings}
                      variant="destructive"
                      className="bg-rose-600/80 hover:bg-rose-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card className="border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900/20 pointer-events-none"></div>
              
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="flex items-center text-slate-200">
                  <Shield className="mr-2 h-5 w-5 text-indigo-400" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure security policies and authentication options
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                  </div>
                ) : (
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={securityForm.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Session Timeout (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">
                                Time before inactive users are logged out
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="loginAttempts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Max Login Attempts</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">
                                Number of failed attempts before account is locked
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={securityForm.control}
                          name="passwordMinLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Password Min Length</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">
                                Minimum length for new passwords
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="passwordComplexity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">Password Complexity</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:ring-indigo-500/30 focus:border-indigo-500/50">
                                    <SelectValue placeholder="Select complexity" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                                  <SelectItem value="low">Low (letters only)</SelectItem>
                                  <SelectItem value="medium">Medium (letters + numbers)</SelectItem>
                                  <SelectItem value="high">High (letters, numbers, symbols)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-slate-500">
                                Password complexity requirements
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={securityForm.control}
                        name="twoFactorAuth"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">Two-Factor Authentication</FormLabel>
                              <FormDescription className="text-slate-500">
                                Require all users to use 2FA for enhanced security
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-indigo-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200"
                        >
                          {isSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900/20 pointer-events-none"></div>
              
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="flex items-center text-slate-200">
                  <Bell className="mr-2 h-5 w-5 text-indigo-400" />
                  Notification Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure system notifications and alerts
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                  </div>
                ) : (
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
                              <div className="space-y-0.5">
                                <FormLabel className="text-slate-200">Email Notifications</FormLabel>
                                <FormDescription className="text-slate-500">
                                  Send system notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30">
                              <div className="space-y-0.5">
                                <FormLabel className="text-slate-200">Push Notifications</FormLabel>
                                <FormDescription className="text-slate-500">
                                  Send browser push notifications
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator className="my-4" />
                      <h3 className="text-lg font-medium">Alert Types</h3>
                      <p className="text-sm text-muted-foreground mb-4">Select which events trigger notifications</p>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={notificationForm.control}
                          name="loginAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                              <div className="space-y-0.5">
                                <FormLabel className="text-slate-200">Login Alerts</FormLabel>
                                <FormDescription className="text-slate-500">
                                  Notify on successful/failed logins
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="roleChangeAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                              <div className="space-y-0.5">
                                <FormLabel className="text-slate-200">Role Change Alerts</FormLabel>
                                <FormDescription className="text-slate-500">
                                  Notify when user roles are modified
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="permissionChangeAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                              <div className="space-y-0.5">
                                <FormLabel className="text-slate-200">Permission Change Alerts</FormLabel>
                                <FormDescription className="text-slate-500">
                                  Notify when permissions are modified
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="systemUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                              <div className="space-y-0.5">
                                <FormLabel className="text-slate-200">System Updates</FormLabel>
                                <FormDescription className="text-slate-500">
                                  Notify about system updates and maintenance
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200"
                        >
                          {isSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              </div>
              
              <CardHeader className="relative z-10 border-b border-slate-700/50">
                <div className="flex items-center">
                  <div className="bg-indigo-600/20 p-2 rounded-lg mr-3">
                    <User className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      Profile Settings
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      Manage your profile information and preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 relative z-10">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="p-6 rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-slate-700 shadow-inner group-hover:border-indigo-400 transition-all duration-300">
                            {profileImage ? (
                              <img 
                                src={profileImage} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `/placeholder-avatar.png`;
                                }} 
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
                                <User className="h-12 w-12 text-slate-600" />
                              </div>
                            )}
                            
                            {/* Upload button overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                              onClick={triggerFileInput}>
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <h3 className="text-xl font-semibold text-white">Profile Picture</h3>
                          <p className="text-slate-400 text-sm">
                            Upload a professional profile picture to personalize your account.
                            Recommended: Square image, at least 256x256px.
                          </p>
                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              onClick={triggerFileInput}
                              disabled={isUploadingImage}
                              className="bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/50 transition-all duration-200"
                            >
                              {isUploadingImage ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload New Image
                                </>
                              )}
                            </Button>
                            
                            {profileImage && (
                              <Button 
                                variant="outline" 
                                onClick={handleRemoveProfileImage}
                                disabled={isRemovingImage}
                                className="bg-slate-800/80 text-red-400 border-slate-700 hover:bg-red-900/20 hover:text-red-300 hover:border-red-500/50 transition-all duration-200"
                              >
                                {isRemovingImage ? (
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                {isRemovingImage ? "Removing..." : "Remove"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Personal Information Section */}
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="p-6 rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl shadow-lg relative overflow-hidden">
                          {/* Background effect */}
                          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-1000 pointer-events-none"></div>
                          
                          <h3 className="text-xl font-semibold text-white mb-4 flex items-center relative z-10">
                            <div className="bg-indigo-600/20 p-1.5 rounded-md mr-2">
                              <User className="h-4 w-4 text-indigo-400" />
                            </div>
                            Personal Information
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">First Name</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 pointer-events-none"></div>
                                      <Input 
                                        placeholder="First Name" 
                                        {...field} 
                                        className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200 relative z-10"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-rose-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">Last Name</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 pointer-events-none"></div>
                                      <Input 
                                        placeholder="Last Name" 
                                        {...field} 
                                        className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200 relative z-10"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-rose-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel className="text-slate-200">Email Address</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 pointer-events-none"></div>
                                      <Input 
                                        type="email" 
                                        placeholder="Your email" 
                                        {...field} 
                                        className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200 relative z-10"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormDescription className="text-xs text-slate-500">
                                    This email will be used for notifications and account recovery
                                  </FormDescription>
                                  <FormMessage className="text-rose-400" />
                                </FormItem>
                              )}
                            />
                            
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="username" className="text-slate-200">Username</Label>
                              <Input 
                                id="username" 
                                placeholder="Username" 
                                value={user?.username || ""}
                                disabled
                                className="bg-slate-800/50 border-slate-700/50 text-slate-500"
                              />
                              <p className="text-xs text-slate-500">
                                Username cannot be changed
                              </p>
                            </div>
                          </div>
                          
                          {/* Info alert about account changes */}
                          <div className="mt-6 p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/30 text-sm text-indigo-300 space-y-1">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 mt-0.5 text-indigo-400" />
                              <p>
                                Changes to your account information may require you to log in again.
                              </p>
                            </div>
                          </div>
                          
                          <div className="pt-6 mt-6 border-t border-slate-700/50 flex items-center justify-end">
                            {profileForm.formState.isDirty && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => profileForm.reset()}
                                className="mr-3 border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
                              >
                                Cancel
                              </Button>
                            )}
                            <Button 
                              type="submit" 
                              disabled={isProfileSaving || !profileForm.formState.isDirty}
                              className={`bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200 ${!profileForm.formState.isDirty && 'opacity-70 cursor-not-allowed'}`}
                            >
                              {isProfileSaving ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden file input for profile picture upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePictureUpload}
        className="hidden"
      />
    </AdminLayout>
  );
}
