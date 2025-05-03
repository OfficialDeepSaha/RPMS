import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, Info, Tag, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const permissionFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required")
});

export type PermissionFormValues = z.infer<typeof permissionFormSchema>;

interface CreatePermissionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<PermissionFormValues>;
  isEdit?: boolean;
  permissionId?: number;
}

// Predefined permission categories
const CATEGORIES = [
  "Dashboard", 
  "User Management", 
  "Reports", 
  "Content Management",
  "System Settings",
  "API Access",
  "Other"
];

export default function CreatePermissionForm({
  onSuccess,
  onCancel,
  defaultValues,
  isEdit = false,
  permissionId
}: CreatePermissionFormProps) {
  const { toast } = useToast();
  const [categoryBadgeHover, setCategoryBadgeHover] = useState<string | null>(null);
  
  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      category: ""
    }
  });

  const createPermissionMutation = useMutation({
    mutationFn: async (data: PermissionFormValues) => {
      const res = await apiRequest("POST", "/api/permissions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Permission created",
        description: "The permission has been created successfully.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create permission",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: PermissionFormValues }) => {
      const res = await apiRequest("PUT", `/api/permissions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Permission updated",
        description: "The permission has been updated successfully.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update permission",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PermissionFormValues) => {
    if (isEdit && permissionId) {
      updatePermissionMutation.mutate({ id: permissionId, data });
    } else {
      createPermissionMutation.mutate(data);
    }
  };

  const isSubmitting = createPermissionMutation.isPending || updatePermissionMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Permission name field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-slate-200 font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-indigo-400" />
                Permission Name
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 pointer-events-none"></div>
                  <Input 
                    placeholder="e.g. View Dashboard, Manage Users, etc." 
                    {...field} 
                    className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200 pl-10 relative z-10"
                  />
                  <Shield className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors duration-200 pointer-events-none z-20" />
                </div>
              </FormControl>
              <FormMessage className="text-rose-400" />
            </FormItem>
          )}
        />
        
        {/* Description field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-slate-200 font-medium flex items-center">
                <Info className="h-4 w-4 mr-2 text-indigo-400" />
                Description
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 pointer-events-none"></div>
                  <Textarea 
                    placeholder="Brief description of what this permission allows" 
                    {...field} 
                    value={field.value || ""}
                    className="min-h-24 bg-slate-800/70 border-slate-700/50 text-slate-300 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200 resize-none relative z-10"
                  />
                </div>
              </FormControl>
              <p className="text-xs text-slate-500">Provide clear details about the capabilities this permission grants to users</p>
              <FormMessage className="text-rose-400" />
            </FormItem>
          )}
        />
        
        {/* Category field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-slate-200 font-medium flex items-center">
                <Tag className="h-4 w-4 mr-2 text-indigo-400" />
                Category
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 pointer-events-none"></div>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="bg-slate-800/70 border-slate-700/50 text-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200 relative z-10">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                      {CATEGORIES.map((category) => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          className="focus:bg-indigo-600/20 cursor-pointer"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((category) => (
                  <Badge 
                    key={category}
                    variant="outline"
                    className={cn(
                      "bg-indigo-600/10 text-indigo-300 border-indigo-700/50 cursor-pointer transition-all duration-200 hover:bg-indigo-600/30",
                      field.value === category && "bg-indigo-600/30 border-indigo-500",
                      categoryBadgeHover === category && "bg-indigo-600/20"
                    )}
                    onClick={() => form.setValue('category', category)}
                    onMouseEnter={() => setCategoryBadgeHover(category)}
                    onMouseLeave={() => setCategoryBadgeHover(null)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              <FormMessage className="text-rose-400" />
            </FormItem>
          )}
        />
        
        {/* Validation tips */}
        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/30 text-sm text-indigo-300 space-y-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-indigo-400" />
            <div>
              <p className="font-medium">Important Tips:</p>
              <ul className="text-xs text-indigo-300/80 mt-1.5 ml-1 space-y-1">
                <li>• Use clear, descriptive names for permissions</li>
                <li>• Categorize permissions logically for easier management</li>
                <li>• Avoid overlapping permission scopes</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-slate-700/50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {isEdit ? "Update Permission" : "Create Permission"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
