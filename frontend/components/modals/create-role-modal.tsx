"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: { title: string; permissions: string[] }) => void;
}

// Permission categories with permissions
const permissionCategories = [
  {
    title: "User Management",
    permissions: [
      "Manage User",
      "Create User",
      "Edit User",
      "Delete User",
      "Show User",
    ],
  },
  {
    title: "Customer Management",
    permissions: [
      "Manage Customer",
      "Create Customer",
      "Edit Customer",
      "Delete Customer",
      "Show Customer",
      "Create Customer Document",
      "Delete Customer Document",
    ],
  },
  {
    title: "Branch Management",
    permissions: [
      "Manage Branch",
      "Create Branch",
      "Delete Branch",
      "Edit Branch",
    ],
  },
  {
    title: "Loan Management",
    permissions: [
      "Manage Loan Type",
      "Create Loan Type",
      "Edit Loan Type",
      "Delete Loan Type",
      "Show Loan Type",
      "Show Loan",
      "Create Loan",
      "Delete Loan",
    ],
  },
  {
    title: "Account Management",
    permissions: [
      "Manage Account Settings",
      "Manage Account",
      "Create Account Type",
      "Edit Account Type",
      "Delete Account Type",
      "Show Account Type",
      "Create Account",
      "Edit Account",
      "Delete Account",
      "Show Account",
    ],
  },
  {
    title: "Transaction Management",
    permissions: [
      "Manage Transaction",
      "Create Transaction",
      "Edit Transaction",
      "Delete Transaction",
    ],
  },
  {
    title: "Expense Management",
    permissions: [
      "Manage Expense",
      "Create Expense",
      "Edit Expense",
      "Delete Expense",
    ],
  },
  {
    title: "Repayment Management",
    permissions: [
      "Manage Repayment",
      "Create Repayment",
      "Edit Repayment",
      "Delete Repayment",
      "Repayment Schedule Payment",
      "Delete Repayment Schedule",
    ],
  },
  {
    title: "Document Management",
    permissions: [
      "Manage Document Type",
      "Create Document Type",
      "Edit Document Type",
      "Delete Document Type",
    ],
  },
  {
    title: "Contact Management",
    permissions: [
      "Manage Contact",
      "Create Contact",
      "Edit Contact",
      "Delete Contact",
    ],
  },
  {
    title: "Note Management",
    permissions: ["Manage Note", "Create Note", "Edit Note", "Delete Note"],
  },
  {
    title: "System Management",
    permissions: [
      "Manage Logged History",
      "Delete Logged History",
      "Manage Password Settings",
      "Manage 2FA Settings",
      "Manage General Settings",
      "Manage Twilio Settings",
      "Manage Company Settings",
      "Manage Email Settings",
      "Manage Payment Settings",
    ],
  },
];

export function CreateRoleModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateRoleModalProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) {
      setFormError("Role title is required.");
      return;
    }
    if (selectedPermissions.length === 0) {
      setFormError("Please select at least one permission.");
      return;
    }
    setFormError("");
    onSubmit({
      title: roleTitle.trim(),
      permissions: selectedPermissions,
    });
    setRoleTitle("");
    setSelectedPermissions([]);
    onClose();
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions((prev) => [...prev, permission]);
    } else {
      setSelectedPermissions((prev) => prev.filter((p) => p !== permission));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 s">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-lg crollbar-none">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              Create Role and Permissions
            </h2>
            <nav className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 mt-1">
              <span>Dashboard</span>
              <span>›</span>
              <span>Role</span>
              <span>›</span>
              <span>Create</span>
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Title
              </label>
              <Input
                type="text"
                placeholder="Enter role title"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full md:max-w-md"
                required
                aria-invalid={!!formError}
                aria-describedby="roleTitleError"
              />
              {formError && (
                <p id="roleTitleError" className="text-red-600 mt-1 text-sm">
                  {formError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-h-[50vh] overflow-y-auto">
              {permissionCategories.map((category) => (
                <div
                  key={category.title}
                  className="space-y-3 border p-3 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    {category.title}
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {category.permissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center space-x-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={(e) =>
                            handlePermissionChange(permission, e.target.checked)
                          }
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          aria-checked={selectedPermissions.includes(
                            permission
                          )}
                        />
                        <span>{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto"
                disabled={!roleTitle.trim() || selectedPermissions.length === 0}
              >
                Create
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
