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
  ImageIcon
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

// Define types based on the schemas
type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

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

  // Handle form submissions
  const onGeneralSubmit = async (data: GeneralSettingsValues) => {
    try {
      setIsSaving(true);
      
      // Prepare settings in the format expected by the API
      const settings = [
        { key: 'systemName', value: data.systemName },
        { key: 'adminEmail', value: data.adminEmail },
        { key: 'dateFormat', value: data.dateFormat },
        { key: 'defaultLanguage', value: data.defaultLanguage },
        { key: 'maintenanceMode', value: data.maintenanceMode },
      ];
      
      // Send to API
      const response = await fetch('/api/settings/category/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        // Update local state with new settings
        const updatedSettings = await response.json();
        setSettingsData(prev => ({
          ...prev,
          general: updatedSettings
        }));
        
        toast({
          title: "Settings Saved",
          description: "Your general settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
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
    <AdminLayout 
      title="System Settings" 
      description="Configure and manage system-wide settings for your application."
    >
      <div className="container mx-auto py-4">
        {/* System information banner */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">System Information</h3>
                  <p className="text-sm text-blue-600">RoleSphere v1.5.2 • Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  System healthy
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                  5 users online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings tabs */}
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto mb-8">
            <TabsTrigger value="general" className="flex flex-col items-center gap-1 p-2">
              <Cog className="h-5 w-5" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col items-center gap-1 p-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center gap-1 p-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col items-center gap-1 p-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex flex-col items-center gap-1 p-2">
              <Database className="h-5 w-5" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general">
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage basic system settings and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={generalForm.control}
                      name="systemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Name</FormLabel>
                          <FormControl>
                            <Input placeholder="System name" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the name that will be displayed in the application
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
                          <FormLabel>Admin Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            System notifications will be sent to this email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={generalForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="defaultLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={generalForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Maintenance Mode</FormLabel>
                            <FormDescription>
                              When enabled, only administrators can access the system
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => generalForm.reset()}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
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
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>
          
          {/* Security Settings Tab */}
          <TabsContent value="security">
            <Form {...securityForm}>
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure security policies and authentication options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={securityForm.control}
                        name="sessionTimeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Timeout (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
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
                            <FormLabel>Max Login Attempts</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of failed attempts before account is locked
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={securityForm.control}
                        name="passwordMinLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password Min Length</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="passwordComplexity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password Complexity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select complexity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low (letters only)</SelectItem>
                                <SelectItem value="medium">Medium (letters + numbers)</SelectItem>
                                <SelectItem value="high">High (letters, numbers, symbols)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                            <FormDescription>
                              Require all users to use 2FA for enhanced security
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle>Security Best Practices</AlertTitle>
                      <AlertDescription>
                        We recommend setting password complexity to high and enabling two-factor authentication for maximum security.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => securityForm.reset()}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
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
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-6 items-center pb-6">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = `/placeholder-avatar.png`;
                          }} 
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-100">
                          <ImageIcon className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Upload button overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={triggerFileInput}>
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                    />
                    
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={triggerFileInput}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Profile Picture
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended: Square image, at least 256x256px
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          placeholder="First Name" 
                          defaultValue={user?.firstName || ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Last Name" 
                          defaultValue={user?.lastName || ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="Your email" 
                          defaultValue={user?.email || ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          placeholder="Username" 
                          defaultValue={user?.username || ""}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Username cannot be changed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notification Settings Tab */}
          <TabsContent value="notifications">
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Configure system notifications and alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Send system notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Send browser push notifications
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium">Alert Types</h3>
                    <p className="text-sm text-muted-foreground mb-4">Select which events trigger notifications</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={notificationForm.control}
                        name="loginAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Login Alerts</FormLabel>
                              <FormDescription>
                                Notify on successful/failed logins
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="roleChangeAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Role Change Alerts</FormLabel>
                              <FormDescription>
                                Notify when user roles are modified
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="permissionChangeAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Permission Change Alerts</FormLabel>
                              <FormDescription>
                                Notify when permissions are modified
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="systemUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">System Updates</FormLabel>
                              <FormDescription>
                                Notify about system updates and maintenance
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => notificationForm.reset()}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
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
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>
          
          {/* Maintenance Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Manage system data and perform maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Clear Cache</CardTitle>
                      <CardDescription>Clear application cache to refresh data</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        This will clear all temporary data stored in the browser. It doesn't affect user data or settings.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleClearCache}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Clear Cache
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Reset Settings</CardTitle>
                      <CardDescription>Reset all settings to default values</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        This will reset all system settings to their default values. User data will not be affected.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full text-amber-600 border-amber-200 hover:bg-amber-50" 
                        onClick={handleResetSettings}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset to Defaults
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <Separator className="my-4" />
                
                <div className="rounded-md bg-red-50 p-4 border border-red-100">
                  <div className="flex">
                    <div className="shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Danger Zone</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          The following actions are destructive and cannot be undone. Please proceed with caution.
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={!isAdmin}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Purge All Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
