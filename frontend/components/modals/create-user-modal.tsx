"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/lib/enum";
import { User } from "@/types/user";
import { branchesApi, auth, getAccessToken } from "@/lib/api";
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
}

export function UserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode,
}: UserModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserBranch, setCurrentUserBranch] = useState<Branch | null>(
    null
  );
  const [formData, setFormData] = useState({
    role: UserRole.CREDIT_OFFICER,
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    profile: null as File | null,
    status: "active" as "active" | "inactive",
    branch: "",
  });

  // Fetch current user profile to get their branch
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const role = getCurrentUserRole();
        setCurrentUserRole(role);

        if (
          role === UserRole.CREDIT_OFFICER ||
          role === UserRole.BRANCH_MANAGER
        ) {
          const response = await auth.profile();
          const userBranchId = response.data.branchId;

          if (userBranchId) {
            // Fetch the full branch details
            const branchResponse = await branchesApi.getById(userBranchId);
            setCurrentUserBranch(branchResponse.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch branches when component mounts or role changes
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchesApi.getAll();
        const branchesData = response.data?.data || response.data || [];

        // Filter out branches with empty IDs and parse properly
        const validBranches = Array.isArray(branchesData)
          ? branchesData
              .filter((branch: any) => branch.id && branch.id.trim() !== "")
              .map((branch: any) => ({
                id: branch.id,
                name: branch.name || "Unknown Branch",
                address: branch.address || "",
                isActive:
                  branch.isActive !== undefined ? branch.isActive : true,
              }))
          : [];

        setBranches(validBranches);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      }
    };

    fetchBranches();
  }, []);

  // Helper function to get current user role
  const getCurrentUserRole = (): string => {
    // This should be replaced with actual auth context
    const token = getAccessToken();
    if (!token) return UserRole.ADMIN;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role || UserRole.ADMIN;
    } catch {
      return UserRole.ADMIN;
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        profile: acceptedFiles[0],
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: false,
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        branchId: formData.branch || undefined,
      };

      // Remove profile from submit data if it's a File object
      if (submitData.profile instanceof File) {
        // Handle file upload separately if needed
        submitData.profile = null;
      }

      onSubmit(submitData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && user) {
        setFormData({
          role: user.role,
          name: user.name || "",
          email: user.email,
          password: "",
          phone: user.phone || "",
          address: user.address || "",
          profile: null,
          status: user.status,
          branch: user.branchId || "",
        });
      } else {
        // For create mode, auto-fill branch if user is credit officer or branch manager
        const defaultBranch =
          (currentUserRole === UserRole.CREDIT_OFFICER ||
            currentUserRole === UserRole.BRANCH_MANAGER) &&
          currentUserBranch
            ? currentUserBranch.id
            : "";

        setFormData({
          role: UserRole.CREDIT_OFFICER,
          name: "",
          email: "",
          password: "",
          phone: "",
          address: "",
          profile: null,
          status: "active",
          branch: defaultBranch,
        });
      }
    }
  }, [isOpen, mode, user, currentUserRole, currentUserBranch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "Create New User" : "Edit User"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1"
          >
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as UserRole })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.BRANCH_MANAGER}>Branch Manager</option>
              <option value={UserRole.CREDIT_OFFICER}>Credit Officer</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Password */}
          <div>
            {mode === "create" ? (
              <PasswordStrengthIndicator
                value={formData.password}
                onChange={(value) =>
                  setFormData({ ...formData, password: value })
                }
                label={
                  <>
                    Password <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Enter password"
                showScore={true}
                showVisibilityToggle={true}
                inputProps={{
                  required: true,
                }}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current password"
                  required={false}
                />
              </>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter address"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={formData.branch}
              onChange={(e) =>
                setFormData({ ...formData, branch: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {formData.profile ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Selected: {formData.profile.name}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, profile: null });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag & drop a profile picture, or click to select"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "active" | "inactive",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
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
