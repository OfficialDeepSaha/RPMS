import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecordActivity, createActivityMessage } from "@/lib/activity-service";
import { useAuth } from "@/hooks/use-auth";

// Sample user form component to demonstrate activity tracking
export default function UserForm({ 
  initialData, 
  onSubmit,
}: { 
  initialData?: { id?: string; firstName?: string; lastName?: string; email?: string; username?: string; }; 
  onSubmit: (data: any) => Promise<void>; 
}) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    username: initialData?.username || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get activity recording mutation
  const recordActivity = useRecordActivity();
  
  // Get current user data for activity tracking
  const { user } = useAuth();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit the form data
      await onSubmit(formData);
      
      // Record the activity
      const isNewUser = !initialData?.id;
      const activityType = isNewUser ? 'user_created' : 'user_updated';
      const entityName = formData.username || `${formData.firstName} ${formData.lastName}`;
      
      recordActivity.mutate({
        type: activityType,
        message: createActivityMessage(activityType, entityName),
        user: {
          id: user?.id?.toString() || 'system',
          name: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.username || 'System'
        },
        details: {
          userId: initialData?.id,
          userData: formData
        }
      });
      
      // Show success message or redirect
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle error 
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData?.id ? "Update User" : "Create User"}
      </Button>
    </form>
  );
} 