import { CustomerEditForm } from "@/components/customer-edit-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";

interface CustomerEditPageProps {
  params: Promise<{ id: string }>; // ← promise
}

export default async function CustomerEditPage({
  params,
}: CustomerEditPageProps) {
  const { id } = await params; // ← await before use

  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can edit customers." />
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="px-2 py-4 sm:px-4 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              {
                label: "Customer",
                href: "/dashboard/business-management/customer",
              },
              {
                label: "Edit",
                href: `/dashboard/business-management/customer/${id}/edit`,
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
