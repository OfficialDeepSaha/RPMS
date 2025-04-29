import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import UserLayout from "@/components/layout/user-layout";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, User as UserIcon, Search, Loader2, UserX, UserCheck, Edit, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

// Define user schema for validation
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roles: z.array(z.number()).min(1, "At least one role must be selected"),
  status: z.enum(["active", "inactive"])
});

// For editing, password is optional
const editUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type UserFormValues = z.infer<typeof userSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

type UserWithRoles = {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: "active" | "inactive";
  roles: Array<{id: number, name: string}>;
};

export default function UsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [userToModify, setUserToModify] = useState<{id: number, action: 'activate' | 'deactivate'} | null>(null);

  // Create form
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roles: [],
      status: "active"
    }
  });

  // Edit form
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roles: [],
      status: "active"
    }
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      createForm.reset();
    }
  }, [isCreateModalOpen, createForm]);

  // Set form values when editing user changes
  useEffect(() => {
    if (editingUser && isEditModalOpen) {
      editForm.reset({
        username: editingUser.username,
        firstName: editingUser.firstName || "",
        lastName: editingUser.lastName || "",
        email: editingUser.email || "",
        password: "", // Empty for editing
        roles: editingUser.roles.map(r => r.id),
        status: editingUser.status
      });
    }
  }, [editingUser, isEditModalOpen, editForm]);

  // Fetch users data
  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithRoles[]>({
    queryKey: ["/api/users"],
  });

  // Fetch roles for user creation/editing
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Array<{id: number, name: string}>>({
    queryKey: ["/api/roles"],
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      setIsCreateModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<EditUserFormValues> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle user status mutation
  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'active' | 'inactive' }) => {
      try {
        // The server expects a PUT request to update user data
        const res = await apiRequest("PUT", `/api/users/${id}`, { 
          status: status 
        });
        
        // Check if response is OK before trying to parse JSON
        if (!res.ok) {
          // Try to get error message from response if possible
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Server error: ${res.status}`);
          } else {
            // Not JSON, throw a generic error with status code
            throw new Error(`Server error: ${res.status}`);
          }
        }

        // Only try to parse JSON if we have a successful response
        try {
          return await res.json();
        } catch (err) {
          // If JSON parsing fails but response was OK, just return success
          return { success: true };
        }
      } catch (error) {
        console.error("Error toggling user status:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Status updated",
        description: "User status has been updated successfully.",
      });
      setConfirmModalOpen(false);
      setUserToModify(null);
    },
    onError: (error: Error) => {
      console.error("Status update error details:", error);
      toast({
        title: "Failed to update status",
        description: error.message || "There was an error updating the user status. Please try again.",
        variant: "destructive",
      });
      setConfirmModalOpen(false);
    }
  });

  // Filter users based on search and status filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = search === "" || 
      (user.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Function to handle opening the edit modal
  const handleOpenEditModal = (user: UserWithRoles) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // Function to handle status change confirmation
  const handleStatusChange = (userId: number, currentStatus: 'active' | 'inactive') => {
    setUserToModify({
      id: userId,
      action: currentStatus === 'active' ? 'deactivate' : 'activate'
    });
    setConfirmModalOpen(true);
  };

  // Function to confirm status change
  const confirmStatusChange = () => {
    if (!userToModify) return;
    
    // Log what we're trying to do
    console.log(`Attempting to ${userToModify.action} user ${userToModify.id}`);
    
    const newStatus = userToModify.action === 'activate' ? 'active' : 'inactive';
    console.log(`Setting status to: ${newStatus}`);
    
    toggleUserStatus.mutate({
      id: userToModify.id,
      status: newStatus
    });
  };

  // Function to get user initials for avatar
  const getUserInitials = (user: UserWithRoles): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user.firstName) {
      return user.firstName[0].toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Function to get a color for the avatar based on the user id
  const getAvatarColor = (userId: number): string => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ];
    return colors[userId % colors.length];
  };

  // Function to handle user creation form submission
  const onCreateSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Function to handle user editing form submission
  const onEditSubmit = (data: EditUserFormValues) => {
    if (!editingUser) return;
    
    // Remove password if it's empty (user didn't change it)
    if (data.password === "") {
      delete data.password;
    }
    
    updateUserMutation.mutate({ id: editingUser.id, data });
  };

  return (
    <UserLayout title="User Management">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Manage Users</h1>
            <p className="text-gray-600">View and manage user accounts and roles</p>
          </div>
          
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search users..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              A list of all users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                <p className="text-gray-500 mt-2">
                  {search || statusFilter !== 'all' 
                    ? "Try adjusting your filters"
                    : "Create a new user to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className={`h-8 w-8 ${getAvatarColor(user.id)}`}>
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{user.username}</div>
                            {(user.firstName || user.lastName) && (
                              <div className="text-xs text-gray-500">
                                {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        {user.roles?.map((role, i) => (
                          <Badge key={i} variant="outline" className="mr-1">
                            {role.name}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge className={user.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {user.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEditModal(user)}
                          className="text-gray-600"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleStatusChange(user.id, user.status as 'active' | 'inactive')}
                          className={user.status === "active" ? "text-red-600" : "text-green-600"}
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. All fields are required unless specified.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username or login ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be used to log into the system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Minimum 6 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Roles</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {rolesLoading ? (
                        <div className="col-span-2 flex items-center text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading roles...
                        </div>
                      ) : (
                        roles.map((role) => (
                          <FormField
                            key={role.id}
                            control={createForm.control}
                            name="roles"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, role.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== role.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {role.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Account Status</FormLabel>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="status-active"
                          value="active"
                          checked={field.value === "active"}
                          onChange={() => field.onChange("active")}
                          className="h-4 w-4"
                        />
                        <FormLabel htmlFor="status-active" className="text-sm font-normal cursor-pointer">
                          Active
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="status-inactive"
                          value="inactive"
                          checked={field.value === "inactive"}
                          onChange={() => field.onChange("inactive")}
                          className="h-4 w-4"
                        />
                        <FormLabel htmlFor="status-inactive" className="text-sm font-normal cursor-pointer">
                          Inactive
                        </FormLabel>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's information below. All fields are required except password.
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Username or login ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Leave blank to keep current" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to keep the current password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="roles"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Roles</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {rolesLoading ? (
                          <div className="col-span-2 flex items-center text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading roles...
                          </div>
                        ) : (
                          roles.map((role) => (
                            <FormField
                              key={role.id}
                              control={editForm.control}
                              name="roles"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={role.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(role.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, role.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== role.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {role.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Account Status</FormLabel>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="edit-status-active"
                            value="active"
                            checked={field.value === "active"}
                            onChange={() => field.onChange("active")}
                            className="h-4 w-4"
                          />
                          <FormLabel htmlFor="edit-status-active" className="text-sm font-normal cursor-pointer">
                            Active
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="edit-status-inactive"
                            value="inactive"
                            checked={field.value === "inactive"}
                            onChange={() => field.onChange("inactive")}
                            className="h-4 w-4"
                          />
                          <FormLabel htmlFor="edit-status-inactive" className="text-sm font-normal cursor-pointer">
                            Inactive
                          </FormLabel>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Status Change */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm {userToModify?.action === 'activate' ? 'Activation' : 'Deactivation'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {userToModify?.action === 'activate' ? 'activate' : 'deactivate'} this user?
              {userToModify?.action === 'deactivate' && (
                <p className="mt-2 text-amber-600">
                  The user will not be able to log in until reactivated.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button 
              variant={userToModify?.action === 'deactivate' ? "destructive" : "default"}
              onClick={confirmStatusChange}
              disabled={toggleUserStatus.isPending}
            >
              {toggleUserStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userToModify?.action === 'activate' ? 'Activate User' : 'Deactivate User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
} 