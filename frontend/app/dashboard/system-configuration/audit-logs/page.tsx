import { AuditLogs } from "@/components/audit-logs";
import { Breadcrumb } from "@/components/breadcrumb";
import { SupervisorOrAdmin, AccessDenied } from "@/components/auth/RoleGuard";

export default function AuditLogsPage() {
  return (
    <SupervisorOrAdmin
      fallback={
        <AccessDenied message="Only administrators and supervisors can access audit logs." />
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="px-2 py-3 sm:px-3 lg:px-4">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              {
                label: "System Configuration",
                href: "/dashboard/system-configuration",
              },
              {
                label: "Audit Logs",
                href: "/dashboard/system-configuration/audit-logs",
                active: true,
              },
            ]}
          />

          <div className="mt-6">
            <AuditLogs title="System Audit Logs" showFilters={true} />
          </div>
        </div>
      </div>
    </SupervisorOrAdmin>
  );
}
