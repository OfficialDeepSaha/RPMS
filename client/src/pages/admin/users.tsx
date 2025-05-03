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
import { cn } from "@/lib/utils";

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
    <AdminLayout title="User Management" description="Manage system users and their roles">
      <div className="space-y-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-600/10 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-8 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        {/* Header section with improved styling */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
              User Management
            </h2>
            <p className="text-slate-400 md:text-base max-w-3xl">
              Create and manage system users, assign roles and permissions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            
            {selectedUsers.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedUsers)}
                disabled={bulkDeleteMutation.isPending}
                className="bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-700 hover:to-rose-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {bulkDeleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced filter section */}
        <Card className="overflow-hidden border-slate-200/10 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-xl">
          <CardContent className="p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-indigo-400 transition-colors duration-200" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-300 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                <div className="relative">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                      <SelectItem value="all" className="focus:bg-indigo-600/20 cursor-pointer">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem 
                          key={role.id} 
                          value={role.id.toString()}
                          className="focus:bg-indigo-600/20 cursor-pointer"
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                <div className="relative">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                      <SelectItem value="all" className="focus:bg-indigo-600/20 cursor-pointer">All Statuses</SelectItem>
                      <SelectItem value="active" className="focus:bg-indigo-600/20 cursor-pointer">Active</SelectItem>
                      <SelectItem value="inactive" className="focus:bg-indigo-600/20 cursor-pointer">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "border-slate-700/50 hover:border-indigo-500/50 hover:bg-indigo-600/10 transition-all duration-200",
                    viewMode === 'table' ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "bg-slate-800/50 text-slate-400"
                  )}
                >
                  <TableCell className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "border-slate-700/50 hover:border-indigo-500/50 hover:bg-indigo-600/10 transition-all duration-200",
                    viewMode === 'grid' ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "bg-slate-800/50 text-slate-400"
                  )}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content card */}
        <Card className="bg-slate-900/50 border-slate-200/10 overflow-hidden backdrop-blur-xl shadow-xl rounded-xl">
          {/* Table view */}
          {viewMode === 'table' && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-800/50">
                    <TableRow className="hover:bg-slate-800/60 border-b-slate-700/50">
                      <TableHead className="w-12 text-center">
                        <Checkbox 
                          checked={isSelectAllChecked}
                          onCheckedChange={handleSelectAll}
                          className="border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all duration-200"
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer hover:text-indigo-400 transition-colors duration-200" onClick={() => toggleSort('username')}>
                        Username
                        {sortBy.field === 'username' && (
                          <span className="ml-1">{sortBy.direction === 'asc' ? '↓' : '↑'}</span>
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:text-indigo-400 transition-colors duration-200" onClick={() => toggleSort('firstName')}>
                        Name
                        {sortBy.field === 'firstName' && (
                          <span className="ml-1">{sortBy.direction === 'asc' ? '↓' : '↑'}</span>
                        )}
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="cursor-pointer hover:text-indigo-400 transition-colors duration-200" onClick={() => toggleSort('status')}>
                        Status
                        {sortBy.field === 'status' && (
                          <span className="ml-1">{sortBy.direction === 'asc' ? '↓' : '↑'}</span>
                        )}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                            <span className="ml-2 text-slate-400">Loading users...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center h-full">
                            <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                            <span className="text-slate-400">No users found</span>
                            <span className="text-sm text-slate-500 mt-1">Try adjusting your filters</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUsers.map((user) => (
                        <TableRow key={user.id} className="group hover:bg-indigo-600/5 border-b-slate-800/50 transition-colors duration-200 animate-fadeIn">
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                              className="border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all duration-200"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className={`${getAvatarColor(user.id)} border border-white/10 transition-transform duration-200 group-hover:scale-110`}>
                                <AvatarFallback className="text-sm bg-transparent">
                                  {getUserInitials(user)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-300 group-hover:text-white transition-colors duration-200">{user.username}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 group-hover:text-white transition-colors duration-200">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {user.roles?.map((role) => (
                                <Badge key={role.id} variant="outline" className="bg-indigo-600/10 text-indigo-300 border-indigo-700/50 group-hover:bg-indigo-600/20 transition-colors duration-200">
                                  {role.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              user.status === 'active'
                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-700/50 hover:bg-emerald-600/30 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                : 'bg-rose-600/20 text-rose-300 border-rose-700/50 hover:bg-rose-600/30 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                              }>
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
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
                                  onClick={() => handleOpenEditModal(user)}
                                  className="hover:bg-indigo-600/20 hover:text-indigo-200 cursor-pointer transition-colors duration-200"
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                  className="hover:bg-indigo-600/20 hover:text-indigo-200 cursor-pointer transition-colors duration-200"
                                >
                                  {user.status === 'active' ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2 text-rose-400" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2 text-emerald-400" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700/50" />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
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
          )}

          {/* Grid view with glass cards */}
          {viewMode === 'grid' && (
            <CardContent className="p-6">
              {usersLoading ? (
                <div className="h-48 flex justify-center items-center">
                  <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                  <span className="ml-2 text-slate-400">Loading users...</span>
                </div>
              ) : sortedUsers.length === 0 ? (
                <div className="h-48 flex flex-col justify-center items-center">
                  <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
                  <span className="text-slate-400 text-lg">No users found</span>
                  <span className="text-sm text-slate-500 mt-1">Try adjusting your filters</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {sortedUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="group relative overflow-hidden bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] animate-fadeIn"
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                          className="border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all duration-200"
                        />
                      </div>
                      
                      {/* Hover effects */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 via-transparent to-transparent"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:opacity-70 opacity-0 transition-opacity duration-500"></div>
                      </div>
                      
                      <div className="flex flex-col p-5 relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className={`h-12 w-12 ${getAvatarColor(user.id)} border-2 border-slate-700/80 transition-transform duration-300 group-hover:scale-110 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_10px_rgba(79,70,229,0.3)]`}>
                            <AvatarFallback className="text-base bg-transparent">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-slate-200 group-hover:text-white transition-colors duration-200">{user.username}</h3>
                            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles?.map((role) => (
                              <Badge key={role.id} variant="outline" className="bg-indigo-600/10 text-indigo-300 border-indigo-700/50 group-hover:bg-indigo-600/20 transition-colors duration-200">
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Badge className={
                              user.status === 'active'
                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-700/50 group-hover:bg-emerald-600/30 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-300'
                                : 'bg-rose-600/20 text-rose-300 border-rose-700/50 group-hover:bg-rose-600/30 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all duration-300'
                              }>
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditModal(user)}
                                className="h-8 w-8 bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all duration-200 rounded-lg"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                className={cn(
                                  "h-8 w-8 bg-slate-800/80 border border-slate-700/50 transition-all duration-200 rounded-lg",
                                  user.status === 'active' 
                                    ? "text-rose-400 hover:text-rose-300 hover:bg-rose-600/20 hover:border-rose-500/50" 
                                    : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/20 hover:border-emerald-500/50"
                                )}
                              >
                                {user.status === 'active' ? (
                                  <UserX className="h-3.5 w-3.5" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user)}
                                className="h-8 w-8 bg-slate-800/80 border border-slate-700/50 text-rose-400 hover:text-rose-300 hover:bg-rose-600/20 hover:border-rose-500/50 transition-all duration-200 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

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
