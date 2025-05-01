import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layout/user-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useEffect } from "react";

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function UserRoles() {
  const { data: roles = [], isLoading, error } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    }
  });

  return (
    <UserLayout title="Roles">
      {isLoading ? (
        <div className="p-8 text-center">Loading roles...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">Error loading roles</div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </UserLayout>
  );
}