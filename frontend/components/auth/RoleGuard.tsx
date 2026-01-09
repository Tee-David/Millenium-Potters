"use client";

import { ReactNode } from "react";
import { UserRole } from "@/lib/enum";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles: UserRole | UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles; if false, user needs ANY role
}

export function RoleGuard({
  children,
  requiredRoles,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // If not authenticated, show fallback without extra checks
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const hasAccess = requireAll
    ? Array.isArray(requiredRoles)
      ? requiredRoles.every((role) => hasRole(role))
      : hasRole(requiredRoles)
    : hasAnyRole(
        Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common role checks
export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard requiredRoles={UserRole.ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function BranchManagerOrAdmin({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[
        UserRole.ADMIN,
        UserRole.SUPERVISOR,
        UserRole.BRANCH_MANAGER,
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function SupervisorOrAdmin({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function StaffOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredRoles={[
        UserRole.ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.CREDIT_OFFICER,
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

// Access denied component
export function AccessDenied({
  message = "You don't have permission to access this resource.",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
