import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  SearchIcon, 
  PlusCircle, 
  Pencil, 
  MoreHorizontal, 
  Loader2, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  Users 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreateRoleForm from "@/components/admin/create-role-form";

// Define interfaces
interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: number[]; // Array of permission IDs
}

// Fetch functions
const fetchRoles = async (): Promise<Role[]> => {
  const res = await fetch("/api/roles");
  if (!res.ok) {
    throw new Error("Failed to fetch roles");
  }
  
  // Transform API response to match our Role interface
  const data = await res.json();
  return data.map((role: any) => ({
    ...role,
    // If permissions are objects, extract their IDs
    permissions: Array.isArray(role.permissions)
      ? role.permissions.map((p: any) => typeof p === 'object' && p !== null ? p.id : p)
      : []
  }));
};

const fetchPermissions = async (): Promise<Permission[]> => {
  const res = await fetch("/api/permissions");
  if (!res.ok) {
    throw new Error("Failed to fetch permissions");
  }
  return res.json();
};

const AdminRoles = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  // Fetch roles with react-query
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: fetchRoles
  });

  // Fetch permissions with react-query
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/permissions"],
    queryFn: fetchPermissions
  });

  // Create mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: Omit<Role, "id">) => {
      const response = await apiRequest("POST", "/api/roles", data);
      return response.json() as Promise<Role>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create role: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Role> }) => {
      // Ensure permissions is an array of IDs
      const formattedData = { ...data };
      
      if (formattedData.permissions && Array.isArray(formattedData.permissions)) {
        formattedData.permissions = formattedData.permissions.map(p => 
          typeof p === 'object' && p !== null ? (p as any).id : p
        );
      }
      
      const response = await apiRequest("PUT", `/api/roles/${id}`, formattedData);
      return response.json() as Promise<Role>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update role: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/roles/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDeleteModalOpen(false);
      setRoleToDelete(null);
      toast({
        title: "Role deleted",
        description: "The role has been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete role",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const confirmDelete = () => {
    if (!roleToDelete?.id) return;
    deleteRoleMutation.mutate(roleToDelete.id);
  };

  // Handlers
  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = (role: Role) => {
    setViewingRole(role);
    setIsViewModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  // Filter roles by search query
  const filteredRoles = roles.filter((role: Role) => {
    return !searchQuery || 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Helper function to get permission names for a role
  const getPermissionNames = (permissionIds: number[]) => {
    return permissions
      .filter((permission: Permission) => permissionIds.includes(permission.id))
      .map((permission: Permission) => permission.name);
  };

  return (
    <AdminLayout title="Role Management" description="Create and manage system roles">
      <div className="space-y-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-10 right-20 w-80 h-80 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-40 -left-20 w-72 h-72 bg-blue-600/10 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        </div>
        
        {/* Header section with improved styling */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
              Role Management
            </h2>
            <p className="text-slate-400 md:text-base max-w-3xl">
              Create and manage system roles and their associated permissions.
            </p>
          </div>

          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 self-start lg:self-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Role list card */}
        <Card className="overflow-hidden border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-800/60 bg-slate-900/60">
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
              <CardTitle className="text-slate-200 text-xl">
                System Roles
              </CardTitle>
              <div className="relative w-full md:w-64 lg:w-72 group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-indigo-400 transition-colors duration-200" />
                  <Input
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-300 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {rolesLoading ? (
              <div className="h-60 flex justify-center items-center">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-t-4 border-l-4 border-indigo-500 animate-spin"></div>
                    <ShieldCheck className="h-6 w-6 text-indigo-500 absolute inset-0 m-auto" />
                  </div>
                  <p className="mt-4 text-slate-400">Loading roles...</p>
                </div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="h-60 flex flex-col justify-center items-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
                <span className="text-slate-400 text-lg">No roles found</span>
                <span className="text-sm text-slate-500 mt-1">Try adjusting your search</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {filteredRoles.map((role) => (
                  <div key={role.id} className="group p-5 hover:bg-indigo-600/5 transition-colors duration-200 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-slate-200 font-medium group-hover:text-white transition-colors duration-200 flex items-center">
                          <div className="h-8 w-8 mr-3 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 transition-all duration-200">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          {role.name}
                        </h3>
                        <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-200">
                          {role.description || "No description available"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:self-start">
                        <div className="flex -space-x-2 mr-4">
                          {[...Array(Math.min(3, role.permissions?.length || 0))].map((_, idx) => (
                            <div 
                              key={idx} 
                              className="h-8 w-8 rounded-full flex items-center justify-center text-xs bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-sm text-indigo-300"
                              title={permissions.find(p => p.id === role.permissions[idx])?.name}
                            >
                              P
                            </div>
                          ))}
                          {(role.permissions?.length || 0) > 3 && (
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-sm text-indigo-300">
                              +{(role.permissions?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenViewModal(role)}
                          className="h-8 w-8 bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all duration-200 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(role)}
                          className="h-8 w-8 bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all duration-200 rounded-lg"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(role)}
                          className="h-8 w-8 bg-slate-800/80 border border-slate-700/50 text-rose-400 hover:text-rose-300 hover:bg-rose-600/20 hover:border-rose-500/50 transition-all duration-200 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions?.length > 0 ? (
                          getPermissionNames(role.permissions).map((permission, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="bg-indigo-600/10 text-indigo-300 border-indigo-700/50 group-hover:bg-indigo-600/20 transition-colors duration-200"
                            >
                              {permission}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm italic">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create role dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <CreateRoleForm
              onSuccess={() => {
                setIsCreateModalOpen(false);
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit role dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Modify existing role properties and permissions
              </DialogDescription>
            </DialogHeader>
            {editingRole && (
              <CreateRoleForm
                isEdit={true}
                roleId={editingRole.id}
                defaultValues={{
                  name: editingRole.name,
                  description: editingRole.description || "",
                  permissions: editingRole.permissions || [],
                }}
                onSuccess={() => {
                  setIsEditModalOpen(false);
                  setEditingRole(null);
                }}
                onCancel={() => {
                  setIsEditModalOpen(false);
                  setEditingRole(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View role dialog */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription>
                View comprehensive details about this role
              </DialogDescription>
            </DialogHeader>
            {viewingRole && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Role Name</h4>
                  <p>{viewingRole.name}</p>
                </div>
                {viewingRole.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p>{viewingRole.description}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-2">Permissions ({viewingRole.permissions?.length || 0})</h4>
                  {viewingRole.permissions && viewingRole.permissions.length > 0 ? (
                    <div className="space-y-2">
                      {permissions
                        .filter(p => viewingRole.permissions?.includes(p.id))
                        .map(permission => (
                          <div key={permission.id} className="p-2 bg-gray-50 rounded-md">
                            <div className="font-medium">{permission.name}</div>
                            {permission.description && (
                              <div className="text-sm text-gray-500">{permission.description}</div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">This role has no permissions assigned.</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this role? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {roleToDelete && (
                <p>
                  You are about to delete the role <strong>{roleToDelete.name}</strong>.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteRoleMutation.isPending}
              >
                {deleteRoleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : "Delete Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
