"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, User, Building2, AlertTriangle } from "lucide-react";
import { UserRole } from "@/lib/enum";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onRoleChanged: () => void;
  loading?: boolean;
}

export function RoleChangeModal({
  isOpen,
  onClose,
  user,
  onRoleChanged,
  loading = false,
}: RoleChangeModalProps) {
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [internalLoading, setInternalLoading] = useState(false);

  const handleRoleChange = async () => {
    if (!user || !newRole) {
      toast.error("Please select a new role");
      return;
    }

    if (newRole === user.role) {
      toast.error("User already has this role");
      return;
    }

    setInternalLoading(true);
    try {
      await usersApi.update(user.id, { role: newRole });
      toast.success(`User role changed to ${getRoleDisplayName(newRole)}`);
      onRoleChanged();
      onClose();
      setNewRole("");
    } catch (error: any) {
      console.error("Failed to change user role:", error);
      toast.error(
        error.response?.data?.message || "Failed to change user role"
      );
    } finally {
      setInternalLoading(false);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Admin";
      case UserRole.BRANCH_MANAGER:
        return "Branch Manager";
      case UserRole.CREDIT_OFFICER:
        return "Credit Officer";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4" />;
      case UserRole.BRANCH_MANAGER:
        return <Building2 className="w-4 h-4" />;
      case UserRole.CREDIT_OFFICER:
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case UserRole.BRANCH_MANAGER:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case UserRole.CREDIT_OFFICER:
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-green-600" />
            <span>Change User Role</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current User Info */}
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Current User
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    {user.branch?.name || "No branch assigned"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(user.role)}
                      <span>{getRoleDisplayName(user.role)}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">
              New Role
            </Label>
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value as UserRole)}
            >
              <SelectTrigger className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl">
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.ADMIN}>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Admin</span>
                  </div>
                </SelectItem>
                <SelectItem value={UserRole.BRANCH_MANAGER}>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Branch Manager</span>
                  </div>
                </SelectItem>
                <SelectItem value={UserRole.CREDIT_OFFICER}>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span>Credit Officer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          {newRole && newRole !== user.role && (
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Role Change Warning</p>
                <p className="mt-1">
                  Changing this user's role may affect their access permissions
                  and branch assignments.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={
                !newRole || newRole === user.role || loading || internalLoading
              }
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              {loading || internalLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Changing...
                </>
              ) : (
                "Change Role"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
