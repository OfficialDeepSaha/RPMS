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
import { SearchIcon, PlusCircle, Pencil, MoreHorizontal, Loader2, Trash2, AlertCircle, ShieldCheck } from "lucide-react";
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />Create Permission
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Manage system permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative w-full sm:w-96">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search permissions..." className="pl-8" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(categorySet).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionsLoading
                    ? <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="animate-spin" /></TableCell></TableRow>
                    : filtered.length === 0
                      ? <TableRow><TableCell colSpan={4} className="text-center">No permissions found.</TableCell></TableRow>
                      : filtered.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell><Badge>{p.category}</Badge></TableCell>
                          <TableCell className="max-w-xs truncate">{p.description}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => openDelete(p)}><Trash2 className="mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}><DialogContent>
        <DialogHeader><DialogTitle>Create Permission</DialogTitle><DialogDescription>Add a new permission</DialogDescription></DialogHeader>
        <CreatePermissionForm onSuccess={() => setIsCreateModalOpen(false)} onCancel={() => setIsCreateModalOpen(false)} />
      </DialogContent></Dialog>
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}><DialogContent>
        <DialogHeader><DialogTitle>Edit Permission</DialogTitle><DialogDescription>Update permission</DialogDescription></DialogHeader>
        {editingPermission && <CreatePermissionForm isEdit permissionId={editingPermission.id} defaultValues={{ name: editingPermission.name, description: editingPermission.description||"", category: editingPermission.category }} onSuccess={() => setIsEditModalOpen(false)} onCancel={() => setIsEditModalOpen(false)} />}
      </DialogContent></Dialog>
      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <UiAlert variant="destructive">
            <AlertCircle className="mr-2" />
            <AlertDescription>Deleting may affect roles.</AlertDescription>
          </UiAlert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePermissionMutation.isPending}
            >
              {deletePermissionMutation.isPending && <Loader2 className="mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}