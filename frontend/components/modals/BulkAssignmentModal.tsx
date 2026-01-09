"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { UserRole } from "@/lib/enum";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  code: string;
  managerId?: string;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

interface BulkAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  branches: Branch[];
  onBulkAssign: (
    assignments: { userId: string; branchId: string }[]
  ) => Promise<void>;
}

export function BulkAssignmentModal({
  isOpen,
  onClose,
  users,
  branches,
  onBulkAssign,
}: BulkAssignmentModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [targetBranchId, setTargetBranchId] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedUsers(new Set());
      setTargetBranchId("");
      setRoleFilter("all");
      setAssignmentFilter("all");
    }
  }, [isOpen]);

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && user.branchId) ||
      (assignmentFilter === "unassigned" && !user.branchId);

    return matchesRole && matchesAssignment;
  });

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.size === 0 || !targetBranchId) return;

    setLoading(true);
    try {
      const assignments = Array.from(selectedUsers).map((userId) => ({
        userId,
        branchId: targetBranchId,
      }));

      await onBulkAssign(assignments);
      toast.success(
        `Successfully assigned ${assignments.length} users to branch`
      );
      onClose();
    } catch (error: any) {
      console.error("Bulk assignment failed:", error);
      toast.error(error.response?.data?.message || "Bulk assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableBranches = () => {
    return branches.map((branch) => ({
      value: branch.id,
      label: `${branch.name} (${branch.code})`,
    }));
  };

  const getSelectedUsersData = () => {
    return Array.from(selectedUsers)
      .map((userId) => users.find((user) => user.id === userId))
      .filter(Boolean) as User[];
  };

  const getAssignmentPreview = () => {
    const selectedUsersData = getSelectedUsersData();
    const targetBranch = branches.find(
      (branch) => branch.id === targetBranchId
    );

    if (!targetBranch || selectedUsersData.length === 0) return null;

    return {
      users: selectedUsersData,
      targetBranch,
      currentAssignments: selectedUsersData.filter((user) => user.branchId),
      unassignedUsers: selectedUsersData.filter((user) => !user.branchId),
      reassignments: selectedUsersData.filter(
        (user) => user.branchId && user.branchId !== targetBranchId
      ),
    };
  };

  const preview = getAssignmentPreview();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <span>Bulk User Assignment</span>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Assign multiple users to a branch at once
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4 overflow-y-auto max-h-[70vh]">
          {/* Target Branch Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Target Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="target-branch">Select Branch</Label>
                <SearchableSelect
                  options={getAvailableBranches()}
                  value={targetBranchId}
                  onValueChange={setTargetBranchId}
                  placeholder="Choose target branch..."
                  searchPlaceholder="Search branches..."
                />
              </div>
            </CardContent>
          </Card>

          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role-filter">Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRole.BRANCH_MANAGER}>
                        Branch Manager
                      </SelectItem>
                      <SelectItem value={UserRole.CREDIT_OFFICER}>
                        Credit Officer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignment-filter">Assignment Status</Label>
                  <Select
                    value={assignmentFilter}
                    onValueChange={setAssignmentFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Select Users ({filteredUsers.length} available)
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedUsers.size === filteredUsers.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Badge variant="outline">{selectedUsers.size} selected</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.email}</span>
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Current: {user.branch ? user.branch.name : "Unassigned"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Preview */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Assignment Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">
                      {preview.users.length} users
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">
                      {preview.targetBranch.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preview.unassignedUsers.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <UserX className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          New Assignments
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        {preview.unassignedUsers.length} users will be assigned
                      </div>
                    </div>
                  )}

                  {preview.reassignments.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowRight className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-900">
                          Reassignments
                        </span>
                      </div>
                      <div className="text-sm text-orange-700">
                        {preview.reassignments.length} users will be reassigned
                      </div>
                    </div>
                  )}

                  {preview.currentAssignments.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">
                          Already Assigned
                        </span>
                      </div>
                      <div className="text-sm text-green-700">
                        {preview.currentAssignments.length} users already in
                        this branch
                      </div>
                    </div>
                  )}
                </div>

                {preview.reassignments.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        <strong>Note:</strong> Some users are currently assigned
                        to other branches. They will be moved to the target
                        branch.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkAssign}
            disabled={selectedUsers.size === 0 || !targetBranchId || loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedUsers.size} Users`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
