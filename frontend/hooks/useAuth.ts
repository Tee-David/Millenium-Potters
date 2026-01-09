"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRole } from "@/lib/enum";
import { auth, getAccessToken, clearAccessToken } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
  branch?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.log("No token found, user not authenticated");
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      console.log("Fetching user profile...");
      const response = await auth.profile();
      const userData = response.data.data || response.data;

      if (!userData || typeof userData !== "object") {
        throw new Error("Invalid user data received");
      }

      console.log("User profile loaded successfully:", userData.email);

      // Store user data in localStorage for other components
      localStorage.setItem("user", JSON.stringify(userData));

      setAuthState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);

      // Clear any stored data
      clearAccessToken();
      localStorage.removeItem("user");

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    } finally {
      clearAccessToken();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      window.location.href = "/login";
    }
  };

  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!authState.user) return false;

    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    return roles.includes(authState.user.role);
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return requiredRoles.includes(authState.user.role);
  };

  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  const isBranchManager = (): boolean => {
    return hasAnyRole([UserRole.BRANCH_MANAGER, UserRole.SUPERVISOR]);
  };

  const isCreditOfficer = (): boolean => {
    return hasRole(UserRole.CREDIT_OFFICER);
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole([
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.SUPERVISOR,
    ]);
  };

  const canManageSystemConfig = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  const canManageBranch = (): boolean => {
    return hasAnyRole([
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.SUPERVISOR,
    ]);
  };

  const canManageLoans = (): boolean => {
    return hasAnyRole([
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.SUPERVISOR,
      UserRole.CREDIT_OFFICER,
    ]);
  };

  const canViewAuditLogs = (): boolean => {
    return hasAnyRole([
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.SUPERVISOR,
    ]);
  };

  return {
    ...authState,
    logout,
    hasRole,
    hasAnyRole,
    isAdmin,
    isBranchManager,
    isCreditOfficer,
    canManageUsers,
    canManageSystemConfig,
    canManageBranch,
    canManageLoans,
    canViewAuditLogs,
  };
}
