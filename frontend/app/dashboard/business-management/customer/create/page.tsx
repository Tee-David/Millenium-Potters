import { CustomerCreateForm } from "@/components/customer-create-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";

export default function CustomerCreatePage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can create customers." />
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
                label: "Create",
                href: "/dashboard/business-management/customer/create",
                active: true,
              },
            ]}
          />

          <div className="mt-4 sm:mt-6">
            <CustomerCreateForm />
          </div>
        </div>
      </div>
    </StaffOnly>
  );
}
