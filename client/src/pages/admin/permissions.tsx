import AdminLayout from "@/components/layout/admin-layout";
import PermissionsTable from "@/components/PermissionsTable";

export default function AdminPermissions() {
  return (
    <AdminLayout title="Permission Management" description="Create and manage system permissions">
      <PermissionsTable />
    </AdminLayout>
  );
}