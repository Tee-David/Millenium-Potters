import { UnionMemberList } from "@/components/union-member-list";
import { Breadcrumb } from "@/components/breadcrumb";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";

export default function UnionMembersPage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can access union member management." />
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="px-2 py-3 sm:px-3 lg:px-4">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              {
                label: "Union Members",
                href: "/dashboard/business-management/union-member",
                active: true,
              },
            ]}
          />

          <div className="mt-6">
            <UnionMemberList />
          </div>
        </div>
      </div>
    </StaffOnly>
  );
}
