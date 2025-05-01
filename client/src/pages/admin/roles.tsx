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
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Role Management</h1>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* Role list card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Roles</CardTitle>
                <CardDescription>
                  Manage system roles and their permissions
                </CardDescription>
              </div>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : roles.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No roles found. Create your first role to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description || "-"}</TableCell>
                      <TableCell>
                        {role.permissions && role.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              {role.permissions.length}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No permissions</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenViewModal(role)}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(role)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRole(role)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
