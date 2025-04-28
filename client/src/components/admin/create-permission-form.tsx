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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permission Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. View Dashboard, Manage Users, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of what this permission allows" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {isEdit ? "Update Permission" : "Create Permission"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
