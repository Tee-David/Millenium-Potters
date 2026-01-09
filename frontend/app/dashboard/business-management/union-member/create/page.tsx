import { Breadcrumb } from "@/components/breadcrumb";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";
import { UnionMemberCreateForm } from "@/components/union-member-create/UnionMemberCreateForm";

export default function UnionMemberCreatePage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can create union members." />
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="px-2 py-4 sm:px-4 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              {
                label: "Union Members",
                href: "/dashboard/business-management/union-member",
              },
              {
                label: "Add Member",
                href: "/dashboard/business-management/union-member/create",
                active: true,
              },
            ]}
          />

          <div className="mt-4 sm:mt-6">
            <UnionMemberCreateForm />
          </div>
        </div>
      </div>
    </StaffOnly>
  );
}
