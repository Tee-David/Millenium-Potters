import { CustomerEditForm } from "@/components/customer-edit-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";

interface UnionMemberEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function UnionMemberEditPage({
  params,
}: UnionMemberEditPageProps) {
  const { id } = await params;

  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can edit union members." />
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
                label: "Edit",
                href: `/dashboard/business-management/union-member/${id}/edit`,
                active: true,
              },
            ]}
          />

          <div className="mt-4 sm:mt-6">
            <CustomerEditForm customerId={id} />
          </div>
        </div>
      </div>
    </StaffOnly>
  );
}
