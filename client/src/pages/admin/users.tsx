import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent 
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckSquare, X, AlertTriangle, Users, Search as SearchIcon, Pencil, MoreHorizontal, Loader2, UserX, UserCheck, Trash2, AlertCircle } from "lucide-react";
import { UserWithRoles, Role } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreateUserForm, { UserFormValues } from "@/components/admin/create-user-form";

// Define the schema once and reuse it
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roles: z.array(z.number()),
  status: z.enum(["active", "inactive"])
});

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [sortBy, setSortBy] = useState<{ field: keyof UserWithRoles; direction: 'asc' | 'desc' }>({ 
    field: 'id', 
    direction: 'asc' 
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithRoles[]>({
    queryKey: ["/api/users"],
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'active' | 'inactive' }) => {
      return await apiRequest("PATCH", `/api/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });
      // Clear selected users after deletion
      setSelectedUsers([]);
      setIsSelectAllChecked(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", `/api/users/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Users deleted",
        description: `${selectedUsers.length} users have been deleted successfully.`,
      });
      setSelectedUsers([]);
      setIsSelectAllChecked(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete users",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Apply search, role, and status filters
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const matchesSearch = search === "" || 
      (user.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (user.roles || []).some(role => role?.id?.toString() === roleFilter);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Apply sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const fieldA = a[sortBy.field] || '';
    const fieldB = b[sortBy.field] || '';
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortBy.direction === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    }
    
    // Handle number comparison
    const numA = Number(fieldA);
    const numB = Number(fieldB);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortBy.direction === 'asc' ? numA - numB : numB - numA;
    }
    
    return 0;
  });

  const handleOpenEditModal = (user: UserWithRoles) => {
    if (!user) return;
    
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: UserWithRoles) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete?.id) return;
    
    deleteUserMutation.mutate(userToDelete.id);
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const toggleSort = (field: keyof UserWithRoles) => {
    if (sortBy.field === field) {
      setSortBy({
        field,
        direction: sortBy.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortBy({ field, direction: 'asc' });
    }
  };

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(sortedUsers.map(user => user.id));
    }
    setIsSelectAllChecked(!isSelectAllChecked);
  };

  const handleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setIsSelectAllChecked(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      if (selectedUsers.length + 1 === sortedUsers.length) {
        setIsSelectAllChecked(true);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    
    bulkDeleteMutation.mutate(selectedUsers);
  };

  const handleToggleStatus = (userId: number, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toggleUserStatus.mutate({ id: userId, status: newStatus });
  };

  // Generate user initials for avatars
  const getUserInitials = (user: UserWithRoles): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Get background color for avatar based on user id (for visual distinction)
  const getAvatarColor = (userId: number): string => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-indigo-100 text-indigo-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-rose-100 text-rose-600',
      'bg-amber-100 text-amber-600',
      'bg-green-100 text-green-600',
      'bg-emerald-100 text-emerald-600',
      'bg-teal-100 text-teal-600',
      'bg-cyan-100 text-cyan-600',
    ];
    return colors[userId % colors.length];
  };

  return (
    <AdminLayout title="User Management" description="Create and manage system users">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-slate-500 mt-1">Manage system users and their permissions</p>
        </div>
        
        <Button
          onClick={() => {
            setIsCreateModalOpen(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-indigo-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl text-white border border-slate-700/50 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-indigo-400" />
              <span><strong>{selectedUsers.length}</strong> users selected</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedUsers([])}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Clear
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="bg-red-500/90 hover:bg-red-600 text-white border-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-lg p-5 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Search Users</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium text-slate-600">Role</label>
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle view mode */}
      <div className="flex justify-end mb-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/70 p-1 flex space-x-1 shadow-md">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className={viewMode === 'table' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-indigo-600'}
            onClick={() => setViewMode('table')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <line x1="3" x2="21" y1="9" y2="9"></line>
              <line x1="3" x2="21" y1="15" y2="15"></line>
              <line x1="9" x2="9" y1="3" y2="21"></line>
              <line x1="15" x2="15" y1="3" y2="21"></line>
            </svg>
            Table
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className={viewMode === 'grid' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-indigo-600'}
            onClick={() => setViewMode('grid')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <rect width="7" height="7" x="3" y="3" rx="1"></rect>
              <rect width="7" height="7" x="14" y="3" rx="1"></rect>
              <rect width="7" height="7" x="14" y="14" rx="1"></rect>
              <rect width="7" height="7" x="3" y="14" rx="1"></rect>
            </svg>
            Grid
          </Button>
        </div>
      </div>

      {usersLoading ? (
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200/70 shadow-xl p-8 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full border-t-4 border-l-4 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium mb-1">Loading users...</p>
          <p className="text-slate-500 text-sm">Please wait while we fetch the user data</p>
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200/70 shadow-xl p-8 flex flex-col items-center justify-center">
          <div className="mb-4 relative">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 shadow-inner">
              <UserX className="h-10 w-10 text-slate-400" />
            </div>
            <div className="absolute top-0 right-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center shadow-sm">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-1">No users found</h3>
          <p className="text-slate-500 text-center mb-4 max-w-md">There are no users matching your current filter criteria. Try adjusting your search or filters.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
            className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-indigo-700 transition-all shadow-sm"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <Card className="border-slate-200/70 shadow-xl rounded-xl overflow-hidden backdrop-blur-sm bg-white/90">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={isSelectAllChecked}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => toggleSort('username')}
                    >
                      <div className="flex items-center">
                        User
                        {sortBy.field === 'username' && (
                          <span className="ml-1 text-indigo-600">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortBy.field === 'status' && (
                          <span className="ml-1 text-indigo-600">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user, index) => (
                    <TableRow 
                      key={user.id}
                      className="group hover:bg-indigo-50/40 transition-all duration-200 animate-fadeIn"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="pr-0">
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                          aria-label={`Select user ${user.username}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-10 w-10 ${getAvatarColor(user.id)} shadow-md ring-2 ring-white`}>
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-800">{user.username}</div>
                            <div className="text-xs text-slate-500">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {user.email || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map((role) => (
                            <Badge key={role?.id} variant="outline" className="bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm">
                              {role?.name}
                            </Badge>
                          ))}
                          {(user.roles || []).length === 0 && (
                            <span className="text-slate-400 text-sm italic">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.status === "active" 
                          ? "bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white shadow-sm border-none"
                          : "bg-gradient-to-r from-rose-500/90 to-rose-600/90 text-white shadow-sm border-none"
                        }>
                          {user.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleToggleStatus(user.id, user.status as 'active' | 'inactive')}
                          >
                            {user.status === "active" ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-indigo-600 hover:bg-indigo-50"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="shadow-lg border-slate-200">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(user)} className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status as 'active' | 'inactive')} className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer">
                                {user.status === "active" ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedUsers.map((user, index) => (
            <div 
              key={user.id} 
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/70 shadow-lg overflow-hidden hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 group animate-fadeIn"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleSelectUser(user.id)}
                    aria-label={`Select user ${user.username}`}
                  />
                  <span className="font-medium text-slate-800">{user.username}</span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-full"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="shadow-lg border-slate-200">
                    <DropdownMenuItem onClick={() => handleOpenEditModal(user)} className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status as 'active' | 'inactive')} className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer">
                      {user.status === "active" ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="p-5">
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <Avatar className={`h-20 w-20 ${getAvatarColor(user.id)} shadow-xl ring-4 ring-white`}>
                      <AvatarFallback className="text-xl font-medium">{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-200">
                      <div className={`h-3 w-3 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  {user.firstName || user.lastName ? (
                    <p className="text-slate-700 font-medium mb-1">
                      {user.firstName} {user.lastName}
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-600">{user.email || "—"}</p>
                </div>
                
                <div className="flex flex-wrap gap-1.5 justify-center mb-4 min-h-[28px]">
                  {(user.roles || []).map((role) => (
                    <Badge key={role?.id} variant="outline" className="bg-indigo-50/70 text-indigo-700 border-indigo-200 shadow-sm">
                      {role?.name}
                    </Badge>
                  ))}
                  {(user.roles || []).length === 0 && (
                    <span className="text-slate-400 text-sm italic">No roles assigned</span>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <Badge className={user.status === "active" 
                    ? "bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white shadow-sm border-none"
                    : "bg-gradient-to-r from-rose-500/90 to-rose-600/90 text-white shadow-sm border-none"
                  }>
                    {user.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm"
                    onClick={() => handleOpenEditModal(user)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant={user.status === "active" ? "destructive" : "default"}
                    size="sm"
                    className={`w-full shadow-sm ${
                      user.status === "active" 
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700" 
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    }`}
                    onClick={() => handleToggleStatus(user.id, user.status as 'active' | 'inactive')}
                  >
                    {user.status === "active" ? (
                      <>
                        <UserX className="h-3.5 w-3.5 mr-1.5" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm border-slate-200/70 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They'll be able to log in once you've set their roles and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <CreateUserForm
            defaultValues={{
              username: "",
              email: "",
              password: "",
              firstName: "",
              lastName: "",
              status: "active",
              roles: [],
            }}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              toast({
                title: "User created",
                description: "The user has been created successfully.",
              });
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm border-slate-200/70 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Edit User</DialogTitle>
            <DialogDescription>
              Update user information, roles, or status. Leave the password field empty to keep the current password.
            </DialogDescription>
          </DialogHeader>
          
          <CreateUserForm
            defaultValues={{
              username: editingUser?.username || "",
              firstName: editingUser?.firstName || "",
              lastName: editingUser?.lastName || "",
              email: editingUser?.email || "",
              password: "",
              roles: (editingUser?.roles || []).map(role => role?.id).filter(Boolean) as number[],
              status: (editingUser?.status as "active" | "inactive") || "active"
            }}
            isEdit={true}
            userId={editingUser?.id}
            onSuccess={() => {
              setIsEditModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              toast({
                title: "User updated",
                description: "The user has been updated successfully.",
              });
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white/95 backdrop-blur-sm border-slate-200/70 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "<span className="font-semibold">{userToDelete?.username}</span>"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm text-red-700 border-red-200 shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Deleting this user will remove their account and all associated data from the system.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
