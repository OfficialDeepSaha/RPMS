import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import UserLayout from "@/components/layout/user-layout";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function UserDashboard() {
  const [location] = useLocation();
  const { userPermissions } = useAuth();
  const [selectedPermission, setSelectedPermission] = useState<string | null>(null);

  // Parse the permission from the URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const permissionParam = params.get("permission");
    
    if (permissionParam && userPermissions.some(p => p.name === permissionParam)) {
      setSelectedPermission(permissionParam);
    } else if (userPermissions.length > 0) {
      // Default to the first permission if none is selected
      setSelectedPermission(userPermissions[0].name);
    }
  }, [location, userPermissions]);

  return (
    <UserLayout title={selectedPermission || "Dashboard"} selectedPermission={selectedPermission || undefined}>
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Placeholder Content</h3>
            <p className="text-gray-500 mb-6">
              This is a placeholder page for demonstration purposes. In a real application, 
              this would display the actual content related to the permission you selected.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm border border-gray-200">
              <p>You accessed this page using the <span className="font-semibold text-primary">{selectedPermission}</span> permission</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </UserLayout>
  );
}
