import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SearchIcon, PlusCircle, Pencil, MoreHorizontal, Loader2, Trash2, AlertCircle, ShieldCheck } from "lucide-react";
import { Permission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreatePermissionForm from "@/components/admin/create-permission-form";

const AdminPermissions = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/permissions");
      return await res.json();
    },
  });

  // Create mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: Omit<Permission, "id">) => {
      const res = await apiRequest("POST", "/api/permissions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast({
        title: "Success",
        description: "Permission created successfully",
      });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create permission: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Permission> }) => {
      const res = await apiRequest("PATCH", `/api/permissions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update permission: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete permission: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Get unique categories
  const categorySet = new Set<string>();
  permissions.forEach(permission => {
    if (permission.category) {
      categorySet.add(permission.category);
    }
  });

  // Filter permissions by search query and category
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = !searchQuery || 
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (permission.description && permission.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleOpenEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setIsEditModalOpen(true);
  };

  const handleDeletePermission = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!permissionToDelete?.id) return;
    
    deletePermissionMutation.mutate(permissionToDelete.id);
    setDeleteModalOpen(false);
    setPermissionToDelete(null);
  };

  return (
    <AdminLayout title="Permission Management" description="Create and manage system permissions">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Permission
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Manage system permissions that can be assigned to roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative w-full sm:w-96">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search permissions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(categorySet).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No permissions found. Create your first permission or adjust your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                            {permission.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {permission.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-sm truncate">
                          {permission.description || "No description"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(permission)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeletePermission(permission)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Permission Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Permission</DialogTitle>
              <DialogDescription>
                Add a new permission to the system
              </DialogDescription>
            </DialogHeader>
            <CreatePermissionForm 
              onSuccess={() => setIsCreateModalOpen(false)}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Permission Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Permission</DialogTitle>
              <DialogDescription>
                Update permission details
              </DialogDescription>
            </DialogHeader>
            {editingPermission && (
              <CreatePermissionForm 
                isEdit
                permissionId={editingPermission.id}
                defaultValues={{
                  name: editingPermission.name,
                  description: editingPermission.description || "",
                  category: editingPermission.category || undefined,
                }}
                onSuccess={() => setIsEditModalOpen(false)}
                onCancel={() => setIsEditModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Permission</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this permission? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Deleting a permission may affect roles that use it. Make sure it's not in use.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deletePermissionMutation.isPending}
              >
                {deletePermissionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Permission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPermissions;
