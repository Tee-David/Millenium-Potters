"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/enum";

export function AuthTest() {
  const { user, isLoading, isAuthenticated, hasRole, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-100 text-blue-800 rounded">
        Loading auth...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 text-green-800 rounded">
      <h3 className="font-bold">Auth Test Results:</h3>
      <p>User: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <p>Is Admin: {isAdmin() ? "Yes" : "No"}</p>
      <p>Has ADMIN role: {hasRole(UserRole.ADMIN) ? "Yes" : "No"}</p>
    </div>
  );
}
