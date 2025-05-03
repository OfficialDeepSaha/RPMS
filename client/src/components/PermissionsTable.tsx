import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout"; // only for import of CreatePermissionForm
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, PlusCircle, Pencil, MoreHorizontal, Loader2, Trash2, AlertCircle, ShieldCheck, Shield } from "lucide-react";
import { Permission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert as UiAlert, AlertDescription } from "@/components/ui/alert";
import CreatePermissionForm from "@/components/admin/create-permission-form";
import { cn } from "@/lib/utils";

export default function PermissionsTable() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/permissions");
      return await res.json();
    },
  });

  // Create
  const createPermissionMutation = useMutation({
    mutationFn: async (data: Omit<Permission, "id">) => {
      const res = await apiRequest("POST", "/api/permissions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Permission created" });
      setIsCreateModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
    },
  });

  // Update
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Permission> }) => {
      const res = await apiRequest("PATCH", `/api/permissions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Permission updated" });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  // Delete
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Permission deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  // Categories
  const categorySet = new Set<string>();
  permissions.forEach(p => { if (p.category) categorySet.add(p.category); });

  // Filter
  const filtered = permissions.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const openEdit = (p: Permission) => { setEditingPermission(p); setIsEditModalOpen(true); };
  const openDelete = (p: Permission) => { setPermissionToDelete(p); setDeleteModalOpen(true); };
  const confirmDelete = () => { if (permissionToDelete) deletePermissionMutation.mutate(permissionToDelete.id); setDeleteModalOpen(false); };

  return (
    <>
      <div className="space-y-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-1000"></div>
        </div>
        
        {/* Header section with improved styling */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
              Permission Management
            </h2>
            <p className="text-slate-400 md:text-base max-w-3xl">
              Create and manage system permissions that control access to features.
            </p>
          </div>

          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 self-start lg:self-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Permission
          </Button>
        </div>

        {/* Enhanced filter section */}
        <Card className="overflow-hidden border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-800/60 bg-slate-900/60">
            <CardTitle className="text-slate-200 text-xl">
              System Permissions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage fine-grained access control for system features
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-indigo-400 transition-colors duration-200" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-300 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="w-full md:w-64 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                <div className="relative">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full bg-slate-800/50 border-slate-700/50 text-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                      <SelectItem value="all" className="focus:bg-indigo-600/20 cursor-pointer">All Categories</SelectItem>
                      {Array.from(categorySet).map(c => (
                        <SelectItem 
                          key={c} 
                          value={c}
                          className="focus:bg-indigo-600/20 cursor-pointer"
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900/20 backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="hover:bg-slate-800/60 border-b-slate-700/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                          <span className="ml-2 text-slate-400">Loading permissions...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center h-full">
                          <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                          <span className="text-slate-400">No permissions found</span>
                          <span className="text-sm text-slate-500 mt-1">Try adjusting your filters</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((permission) => (
                      <TableRow key={permission.id} className="group hover:bg-indigo-600/5 border-b-slate-800/50 transition-colors duration-200 animate-fadeIn">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 transition-all duration-200">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-slate-300 group-hover:text-white transition-colors duration-200">
                              {permission.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-indigo-600/10 text-indigo-300 border-indigo-700/50 group-hover:bg-indigo-600/20 transition-colors duration-200">
                            {permission.category || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                          {permission.description || 'No description provided'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-600/10 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-300">
                              <DropdownMenuItem 
                                onClick={() => openEdit(permission)}
                                className="hover:bg-indigo-600/20 hover:text-indigo-200 cursor-pointer transition-colors duration-200"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700/50" />
                              <DropdownMenuItem 
                                onClick={() => openDelete(permission)}
                                className="text-rose-400 hover:bg-rose-600/20 hover:text-rose-300 cursor-pointer transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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
      </div>
      
      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 text-slate-200 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          </div>
          
          <DialogHeader className="relative z-10 border-b border-slate-700/50 pb-4">
            <div className="flex items-center">
              <div className="bg-indigo-600/20 p-2 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Create New Permission
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  Add a new permission to control access to system features
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="relative z-20 mt-2">
            <CreatePermissionForm onSuccess={() => setIsCreateModalOpen(false)} onCancel={() => setIsCreateModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 text-slate-200 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>
          
          <DialogHeader className="relative z-10 border-b border-slate-700/50 pb-4">
            <div className="flex items-center">
              <div className="bg-blue-600/20 p-2 rounded-lg mr-3">
                <Pencil className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Edit Permission
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  Update permission details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="relative z-20 mt-2">
            {editingPermission && (
              <CreatePermissionForm 
                isEdit 
                permissionId={editingPermission.id} 
                defaultValues={{ 
                  name: editingPermission.name, 
                  description: editingPermission.description || "", 
                  category: editingPermission.category || "" 
                }} 
                onSuccess={() => setIsEditModalOpen(false)} 
                onCancel={() => setIsEditModalOpen(false)} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 text-slate-200 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-3000"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-red-600/20 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          </div>
          
          <DialogHeader className="relative z-10 border-b border-slate-700/50 pb-4">
            <div className="flex items-center">
              <div className="bg-rose-600/20 p-2 rounded-lg mr-3">
                <Trash2 className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Delete Permission
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="relative z-10 space-y-5 mt-2">
            <UiAlert variant="destructive" className="bg-rose-950/50 border-rose-800/50 text-rose-300">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Deleting a permission may affect roles that use it.
              </AlertDescription>
            </UiAlert>
            
            {permissionToDelete && (
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="bg-indigo-600/10 text-indigo-300 border-indigo-700/50">
                    {permissionToDelete.category || 'General'}
                  </Badge>
                  <span className="text-sm text-slate-400">ID: {permissionToDelete.id}</span>
                </div>
                <p className="text-lg font-medium text-white mb-1">{permissionToDelete.name}</p>
                {permissionToDelete.description && (
                  <p className="text-sm text-slate-400">{permissionToDelete.description}</p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="relative z-10 border-t border-slate-700/50 pt-5 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)}
              className="border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePermissionMutation.isPending}
              className="bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-700 hover:to-red-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {deletePermissionMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}