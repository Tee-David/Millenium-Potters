"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  UserCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { UserRole } from "@/lib/enum";
import { SearchableSelect } from "@/components/SearchableSelect";

interface Branch {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  manager?: {
    id: string;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

interface BranchAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  branch?: Branch | null;
  branches: Branch[];
  users: User[];
  onAssignUser: (userId: string, branchId: string) => Promise<void>;
  onAssignManager: (branchId: string, managerId: string) => Promise<void>;
}

export function BranchAssignmentModal({
  isOpen,
  onClose,
  user,
  branch,
  branches,
  users,
  onAssignUser,
  onAssignManager,
}: BranchAssignmentModalProps) {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setSelectedBranchId(user.branchId || "");
      } else if (branch) {
        setSelectedManagerId(branch.managerId || "");
      }
    } else {
      setSelectedBranchId("");
      setSelectedManagerId("");
    }
  }, [isOpen, user, branch]);

  const handleSubmit = async () => {
    if (!user && !branch) return;

    setLoading(true);
    try {
      if (user && selectedBranchId) {
        await onAssignUser(user.id, selectedBranchId);
      } else if (branch && selectedManagerId) {
        await onAssignManager(branch.id, selectedManagerId);
      }
      onClose();
    } catch (error) {
      console.error("Assignment failed:", error);
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

  const getAvailableManagers = () => {
    return users
      .filter(
        (user) =>
          user.role === UserRole.BRANCH_MANAGER &&
          user.isActive &&
          (!user.branchId || user.branchId === branch?.id) // Allow current manager or unassigned
      )
      .map((user) => ({
        value: user.id,
        label: `${user.name || user.email} (${user.role})`,
      }));
  };

  const getBranchUsers = () => {
    if (!selectedBranchId) return [];
    return users.filter((user) => user.branchId === selectedBranchId);
  };

  const getManagerBranches = () => {
    if (!selectedManagerId) return [];
    return branches.filter((branch) => branch.managerId === selectedManagerId);
  };

  const isFormValid = () => {
    if (user) {
      return selectedBranchId && selectedBranchId !== user.branchId;
    }
    if (branch) {
      return selectedManagerId && selectedManagerId !== branch.managerId;
    }
    return false;
  };

  const getModalTitle = () => {
    if (user) {
      return `Assign User to Branch`;
    }
    if (branch) {
      return `Assign Manager to Branch`;
    }
    return "Assignment";
  };

  const getModalDescription = () => {
    if (user) {
      return `Assign ${user.email} to a branch`;
    }
    if (branch) {
      return `Assign a manager to ${branch.name}`;
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {getModalTitle()}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{getModalDescription()}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Assignment Info */}
          {(user || branch) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{user.email}</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      {user.branch ? (
                        <>
                          <Building2 className="w-5 h-5 text-green-500" />
                          <span>{user.branch.name}</span>
                          <Badge variant="default">Assigned</Badge>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-gray-500">Not assigned</span>
                          <Badge variant="destructive">Unassigned</Badge>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {branch && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{branch.name}</span>
                      <span className="text-sm text-gray-500">
                        ({branch.code})
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      {branch.manager ? (
                        <>
                          <UserCheck className="w-5 h-5 text-green-500" />
                          <span>{branch.manager.email}</span>
                          <Badge variant="default">Has Manager</Badge>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-gray-500">No manager</span>
                          <Badge variant="destructive">No Manager</Badge>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <div>
                  <Label htmlFor="branch-select">Select Branch</Label>
                  <SearchableSelect
                    options={getAvailableBranches()}
                    value={selectedBranchId}
                    onValueChange={setSelectedBranchId}
                    placeholder="Choose a branch..."
                    searchPlaceholder="Search branches..."
                  />
                </div>
              )}

              {branch && (
                <div>
                  <Label htmlFor="manager-select">Select Manager</Label>
                  <SearchableSelect
                    options={getAvailableManagers()}
                    value={selectedManagerId}
                    onValueChange={setSelectedManagerId}
                    placeholder="Choose a manager..."
                    searchPlaceholder="Search managers..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview of New Assignment */}
          {isFormValid() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Assignment Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user && selectedBranchId && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{user.email}</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-green-500" />
                      <span>
                        {branches.find((b) => b.id === selectedBranchId)?.name}
                      </span>
                      <Badge variant="default">Will be assigned</Badge>
                    </div>
                  </div>
                )}

                {branch && selectedManagerId && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">{branch.name}</span>
                      <span className="text-sm text-gray-500">
                        ({branch.code})
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-5 h-5 text-green-500" />
                      <span>
                        {users.find((u) => u.id === selectedManagerId)?.email}
                      </span>
                      <Badge variant="default">Will be manager</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Impact Analysis */}
          {isFormValid() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user && selectedBranchId && (
                  <>
                    <div className="text-sm">
                      <strong>Branch Users:</strong> {getBranchUsers().length}{" "}
                      users currently assigned to this branch
                    </div>
                    {getBranchUsers().length > 0 && (
                      <div className="text-sm text-gray-600">
                        <strong>Current users:</strong>{" "}
                        {getBranchUsers()
                          .map((u) => u.email)
                          .join(", ")}
                      </div>
                    )}
                  </>
                )}

                {branch && selectedManagerId && (
                  <>
                    <div className="text-sm">
                      <strong>Manager's Current Assignment:</strong>{" "}
                      {getManagerBranches().length > 0
                        ? getManagerBranches()
                            .map((b) => b.name)
                            .join(", ")
                        : "No current branch assignment"}
                    </div>
                    {getManagerBranches().length > 0 && (
                      <div className="text-sm text-orange-600">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        This manager is currently assigned to another branch.
                        The assignment will be updated.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
