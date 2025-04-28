import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search, Filter } from "lucide-react";
import { Permission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreatePermissionForm from "@/components/admin/create-permission-form";

export default function AdminPermissions() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Permission deleted",
        description: "The permission has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete permission",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleOpenEditModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditModalOpen(true);
  };

  const handleDeletePermission = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the permission "${name}"?`)) {
      deletePermissionMutation.mutate(id);
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(permissions.map(p => p.category).filter(Boolean)));

  // Filter permissions based on the category
  const filteredPermissions = categoryFilter 
    ? permissions.filter(p => p.category === categoryFilter)
    : permissions;

  // Define columns for the data table
  const columns = [
    {
      header: "Permission Name",
      accessor: "name",
      cell: (row: Permission) => (
        <div className="font-medium text-gray-900">{row.name}</div>
      ),
      sortable: true,
    },
    {
      header: "Category",
      accessor: "category",
      cell: (row: Permission) => (
        <Badge 
          variant="secondary" 
          className="bg-indigo-100 text-indigo-800 font-normal"
        >
          {row.category || "Uncategorized"}
        </Badge>
      ),
      sortable: true,
    },
    {
      header: "Description",
      accessor: "description",
      cell: (row: Permission) => (
        <div className="text-sm text-gray-500 max-w-md">
          {row.description || "No description available"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Permission) => row.id,
      cell: (row: Permission) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEditModal(row)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeletePermission(row.id, row.name)}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AdminLayout title="Permission Management" description="Create and manage system permissions">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-blue-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || ""}>
                    {category || "Uncategorized"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            data={filteredPermissions}
            isLoading={isLoading}
            keyExtractor={(permission) => permission.id}
            searchable
            searchPlaceholder="Search permissions..."
            emptyMessage="No permissions found. Create a new permission to get started."
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Create Permission Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles.
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update permission details.
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <CreatePermissionForm 
              isEdit
              permissionId={selectedPermission.id}
              defaultValues={{
                name: selectedPermission.name,
                description: selectedPermission.description || "",
                category: selectedPermission.category || ""
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
