"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import {
  permissionCategories,
  PermissionCategory,
} from "@/lib/permissionsCategories";

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: { title: string; permissions: string[] }) => void;
  role: {
    id: number;
    name: string;
    assignedPermissions: number;
  } | null;
}

export function EditRoleModal({
  isOpen,
  onClose,
  onSubmit,
  role,
}: EditRoleModalProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!role) return;
    setRoleTitle(role.name);
    // TODO: Load actual permissions for the role if available
    setSelectedPermissions([]);
    setFormError("");
  }, [role]);

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
    onClose();
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions((prev) => [...prev, permission]);
    } else {
      setSelectedPermissions((prev) => prev.filter((p) => p !== permission));
    }
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black/40  flex items-center justify-center z-50 p-4 cursor-default">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg cursor-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Edit Role
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="roleTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Role Title
              </label>
              <Input
                id="roleTitle"
                type="text"
                placeholder="Enter role title"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full max-w-md"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {permissionCategories.map((category: PermissionCategory) => (
                <div
                  key={category.title}
                  className="space-y-3 border p-3 rounded-lg hover:shadow-md transition-shadow cursor-default"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    {category.title}
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {category.permissions.map((permission: string) => (
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
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto cursor-pointer"
                disabled={!roleTitle.trim() || selectedPermissions.length === 0}
              >
                Update
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
