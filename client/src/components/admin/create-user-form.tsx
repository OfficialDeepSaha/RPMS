import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Role } from "@shared/schema";

const userFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }).max(50),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address",
  }).optional().or(z.literal("")),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }).optional(),
  roles: z.array(z.number()),
  status: z.enum(["active", "inactive"])
});

export type UserFormValues = z.infer<typeof userFormSchema>;

interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<UserFormValues>;
  isEdit?: boolean;
  userId?: number;
}

export default function CreateUserForm({
  onSuccess,
  onCancel,
  defaultValues,
  isEdit = false,
  userId
}: CreateUserFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine the validation schema based on whether we're editing or creating
  const validationSchema = isEdit
    ? userFormSchema.partial({ password: true }) // Password is optional when editing
    : userFormSchema; // Password is required when creating

  const form = useForm<UserFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues || {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roles: [],
      status: "active"
    }
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<UserFormValues> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: UserFormValues) => {
    if (isEdit && userId) {
      // Remove password if it's empty (user didn't change it)
      const formData = { ...data };
      if (!formData.password) {
        delete formData.password;
      }
      updateUserMutation.mutate({ id: userId, data: formData });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;
  
  // Group roles by their common features for better organization
  const adminRoles = roles.filter(role => 
    role.name.toLowerCase().includes('admin') || 
    role.name.toLowerCase().includes('manager')
  );
  
  const otherRoles = roles.filter(role => 
    !role.name.toLowerCase().includes('admin') && 
    !role.name.toLowerCase().includes('manager')
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email address" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Login ID</FormLabel>
                <FormControl>
                  <Input placeholder="Username or login ID" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  This will be used to log into the system
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEdit ? "New Password (optional)" : "Password"}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder={isEdit ? "Leave blank to keep current" : "Create a password"} 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                <FormDescription className="text-xs">
                  {isEdit ? "Leave blank to keep the current password" : "Minimum 6 characters"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Account Status</FormLabel>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value === "active"}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? "active" : "inactive");
                    }}
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-normal">
                    {field.value === "active" ? "Active" : "Inactive"}
                  </FormLabel>
                  <FormDescription className="text-xs">
                    {field.value === "active" 
                      ? "User can log in and access the system" 
                      : "User cannot log in or access the system"}
                  </FormDescription>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="roles"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel>Assign Roles</FormLabel>
                <FormDescription>
                  Select the roles to assign to this user
                </FormDescription>
              </div>
              
              {rolesLoading ? (
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  {adminRoles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Administrative Roles</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {adminRoles.map((role) => (
                          <FormField
                            key={role.id}
                            control={form.control}
                            name="roles"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, role.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== role.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      {role.name}
                                    </FormLabel>
                                    {role.description && (
                                      <p className="text-xs text-gray-500">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {otherRoles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Other Roles</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {otherRoles.map((role) => (
                          <FormField
                            key={role.id}
                            control={form.control}
                            name="roles"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, role.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== role.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      {role.name}
                                    </FormLabel>
                                    {role.description && (
                                      <p className="text-xs text-gray-500">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
