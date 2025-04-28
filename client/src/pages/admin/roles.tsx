import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { RoleWithPermissions } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateRoleForm, { RoleFormValues } from "@/components/admin/create-role-form";
import { cn } from "@/lib/utils";

export default function AdminRoles() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);

  const { data: roles = [], isLoading } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/roles"],
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Role deleted",
        description: "The role has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleOpenEditModal = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the role "${name}"?`)) {
      deleteRoleMutation.mutate(id);
    }
  };

  // For icons next to role cards
  const getRoleIcon = (name: string) => {
    name = name.toLowerCase();
    if (name.includes('admin')) {
      return { icon: <Shield className="text-primary text-lg" />, bg: "bg-blue-100" };
    } else if (name.includes('manager')) {
      return { icon: <Shield className="text-secondary text-lg" />, bg: "bg-green-100" };
    } else if (name.includes('editor')) {
      return { icon: <Shield className="text-warning text-lg" />, bg: "bg-yellow-100" };
    } else {
      return { icon: <Shield className="text-purple-500 text-lg" />, bg: "bg-purple-100" };
    }
  };

  return (
    <AdminLayout title="Role Management" description="Create and manage system roles">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-blue-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-5 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-3 w-3/4 mb-2" />
                <div className="flex flex-wrap gap-2 mb-6">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => {
            const { icon, bg } = getRoleIcon(role.name);
            return (
              <Card key={role.id} className="border border-gray-100">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-3", bg)}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-xs text-gray-500">Users: {role.userCount || 0}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenEditModal(role)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4 text-gray-500 hover:text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{role.description || "No description available."}</p>
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="font-medium">{role.permissions?.length || 0} permissions</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 uppercase font-medium">Key Permissions</div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions?.slice(0, 4).map((permission) => (
                        <Badge 
                          key={permission.id} 
                          variant="secondary"
                          className="bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                        >
                          {permission.name}
                        </Badge>
                      ))}
                      {role.permissions?.length > 4 && (
                        <Badge className="bg-blue-100 text-primary rounded-full hover:bg-blue-200">
                          +{role.permissions.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Add New Role Card */}
          <Card 
            className="bg-gray-50 rounded-xl border border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="font-medium text-gray-800">Create New Role</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4">Add a new role with custom permissions</p>
              <Button variant="secondary" size="sm">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Role Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions to it.
            </DialogDescription>
          </DialogHeader>
          <CreateRoleForm 
            onSuccess={() => setIsCreateModalOpen(false)}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <CreateRoleForm 
              isEdit
              roleId={selectedRole.id}
              defaultValues={{
                name: selectedRole.name,
                description: selectedRole.description || "",
                permissions: selectedRole.permissions?.map(p => p.id) || []
              }}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
