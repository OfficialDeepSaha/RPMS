import PermissionsTable from "@/components/PermissionsTable";
import UserLayout from "@/components/layout/user-layout";

export default function UserPermissions() {
  return (
    <UserLayout title="Permission Management">
      <PermissionsTable />
    </UserLayout>
  );
}