"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/lib/enum";
import { User } from "@/types/user";
import { branchesApi, auth } from "@/lib/api";
import { X } from "lucide-react";
import { toast } from "sonner";
import { PasswordStrengthIndicator } from "@/components/lightswind/password-strength-indicator";

interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  user?: User | null;
  mode: "create" | "edit";
  loading?: boolean;
}

export function UserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode,
  loading = false,
}: UserModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "" as UserRole | "",
    branchId: "",
    isActive: true,
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Role-based permissions for user creation
  const allowedRolesForCreator = React.useMemo(() => {
    if (!currentUser) {
      console.log("UserModal - No current user, returning empty roles");
      return [];
    }

    const userRole = currentUser.role as string;
    console.log("UserModal - Current user role:", userRole);

    if (userRole === UserRole.ADMIN || userRole === "ADMIN") {
      console.log("UserModal - Admin detected, allowing all roles");
      return [UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.CREDIT_OFFICER];
    } else if (
      userRole === UserRole.BRANCH_MANAGER ||
      userRole === "BRANCH_MANAGER"
    ) {
      console.log(
        "UserModal - Branch manager detected, allowing credit officer only"
      );
      return [UserRole.CREDIT_OFFICER]; // Branch managers can only create credit officers
    } else {
      console.log("UserModal - Credit officer or unknown role, no permissions");
      return []; // Credit officers cannot create users
    }
  }, [currentUser?.role]);

  useEffect(() => {
    console.log("UserModal - useEffect triggered:", {
      isOpen,
      mode,
      user: !!user,
    });
    if (isOpen) {
      fetchBranches();
      fetchCurrentUser();
      if (mode === "edit" && user) {
        console.log("UserModal - Setting edit form data for user:", user);
        // Parse the name into firstName and lastName
        const nameParts = (user.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setFormData({
          email: user.email,
          password: "", // Don't pre-fill password for security
          role: user.role,
          branchId: user.branchId || "",
          isActive: user.status?.toLowerCase() === "active",
          firstName: firstName,
          lastName: lastName,
          phone: user.phone || "",
          address: user.address || "",
        });
      } else {
        console.log("UserModal - Setting create form data");
        setFormData({
          email: "",
          password: "",
          role: "", // Will be set when currentUser loads
          branchId: "",
          isActive: true,
          firstName: "",
          lastName: "",
          phone: "",
          address: "",
        });
      }
    }
  }, [isOpen, mode, user]);

  // Update role and branch when current user loads and it's a create mode
  useEffect(() => {
    console.log("UserModal - Role update useEffect triggered:", {
      currentUser: !!currentUser,
      mode,
      allowedRolesLength: allowedRolesForCreator.length,
    });
    if (currentUser && mode === "create" && allowedRolesForCreator.length > 0) {
      console.log("UserModal - Updating role and branch");
      console.log("UserModal - Current user branchId:", currentUser.branchId);
      console.log("UserModal - Previous formData branchId:", formData.branchId);
      setFormData((prev) => {
        const newBranchId = currentUser.branchId || prev.branchId;
        console.log("UserModal - Setting new branchId:", newBranchId);
        return {
          ...prev,
          // Only set role if it's empty
          role: prev.role || allowedRolesForCreator[0],
          // Auto-assign branch for branch managers creating credit officers
          branchId: newBranchId,
        };
      });
    }
  }, [currentUser, mode]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getAll();
      const branchesData = (response.data as any)?.data || response.data || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const profileResponse = await auth.profile();
      const user = profileResponse.data.data || profileResponse.data;
      console.log("UserModal - Current user loaded:", user);
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.firstName.trim()) {
      toast.error("Please enter a first name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (mode === "create" && !formData.password.trim()) {
      toast.error("Please enter a password");
      return;
    }
    if (mode === "create" && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (!formData.role) {
      toast.error("Please select a role");
      return;
    }
    if (formData.role !== UserRole.ADMIN && !formData.branchId) {
      toast.error("Please select a branch");
      return;
    }

    setInternalLoading(true);

    try {
      const submitData = {
        ...formData,
        branchId: formData.branchId || undefined,
        status: formData.isActive ? "active" : "inactive",
      };

      console.log("UserModal - Submitting data:", submitData);
      console.log("UserModal - Mode:", mode);
      console.log("UserModal - User ID:", user?.id);

      await onSubmit(submitData);
    } catch (error) {
      console.error("UserModal - Submit error:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleChange = React.useCallback((field: string, value: any) => {
    console.log(`UserModal - Field changed: ${field} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Create User" : "Edit User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value.trim())}
              required
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter address"
            />
          </div>

          {mode === "create" && (
            <div>
              <PasswordStrengthIndicator
                value={formData.password}
                onChange={(value) => handleChange("password", value.trim())}
                label={
                  <>
                    Password <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Enter password"
                showScore={true}
                showRequirements={true}
                showVisibilityToggle={true}
                inputProps={{
                  minLength: 8,
                  required: true,
                }}
              />
            </div>
          )}

          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role || undefined}
              onValueChange={(value) => handleChange("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {allowedRolesForCreator.includes(UserRole.ADMIN) && (
                  <SelectItem key="admin" value={UserRole.ADMIN}>
                    Admin
                  </SelectItem>
                )}
                {allowedRolesForCreator.includes(UserRole.BRANCH_MANAGER) && (
                  <SelectItem
                    key="branch-manager"
                    value={UserRole.BRANCH_MANAGER}
                  >
                    Branch Manager
                  </SelectItem>
                )}
                {allowedRolesForCreator.includes(UserRole.CREDIT_OFFICER) && (
                  <SelectItem
                    key="credit-officer"
                    value={UserRole.CREDIT_OFFICER}
                  >
                    Credit Officer
                  </SelectItem>
                )}
                {allowedRolesForCreator.length === 0 && (
                  <SelectItem key="no-roles" value="no-roles" disabled>
                    No roles available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.role !== UserRole.ADMIN && (
            <div>
              <Label htmlFor="branch">Branch *</Label>
              <Select
                value={formData.branchId}
                onValueChange={(value) => handleChange("branchId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((branch) => branch.id && branch.id.trim() !== "")
                    .map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isActive">Active User</Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || internalLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading || internalLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {mode === "create" ? "Creating..." : "Updating..."}
                </div>
              ) : mode === "create" ? (
                "Create User"
              ) : (
                "Update User"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
