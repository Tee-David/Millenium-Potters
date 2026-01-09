"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  ChevronLeft,
  UserPlus,
  Search,
  Filter,
  CheckSquare,
  Square,
} from "lucide-react";
import { UserRole } from "@/lib/enum";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "sonner";
import { branchesApi, usersApi, handleDatabaseError } from "@/lib/api";

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

export default function BulkAssignmentPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [targetBranchId, setTargetBranchId] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [branchesResponse, usersResponse] = await Promise.all([
        branchesApi.getAll(),
        usersApi.getAll(),
      ]);

      const branchesData =
        (branchesResponse.data as any)?.data || branchesResponse.data || [];
      const usersData =
        (usersResponse.data as any)?.data?.users ||
        (usersResponse.data as any)?.data ||
        usersResponse.data ||
        [];

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && user.branchId) ||
      (assignmentFilter === "unassigned" && !user.branchId);

    return matchesSearch && matchesRole && matchesAssignment;
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
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (!targetBranchId) {
      toast.error("Please select a target branch");
      return;
    }

    setSubmitting(true);
    try {
      const userIds = Array.from(selectedUsers);

      // Use bulk operation API for better performance
      const response = await usersApi.bulkOperation({
        operation: "assignBranch",
        userIds,
        data: { branchId: targetBranchId },
      });

      if (response.data.success) {
        toast.success(
          `Successfully assigned ${userIds.length} users to branch`
        );
        router.back();
      } else {
        throw new Error(response.data.message || "Bulk assignment failed");
      }
    } catch (error: any) {
      console.error("Bulk assignment failed:", error);
      toast.error(error.response?.data?.message || "Bulk assignment failed");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading assignment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={loadData}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Bulk User Assignment
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Assign multiple users to a branch at once
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                onClick={loadData}
                variant="outline"
                className="flex items-center space-x-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-blue-100/50">
                <CardTitle className="text-sm font-semibold text-blue-700">
                  Total Users
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {users.length}
                </div>
                <p className="text-sm text-blue-600 font-medium">
                  All users in system
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-50 to-green-100/50">
                <CardTitle className="text-sm font-semibold text-green-700">
                  Selected Users
                </CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {selectedUsers.size}
                </div>
                <p className="text-sm text-green-600 font-medium">
                  Ready for assignment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-orange-50 to-orange-100/50">
                <CardTitle className="text-sm font-semibold text-orange-700">
                  Unassigned Users
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <UserX className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {users.filter((u) => !u.branchId).length}
                </div>
                <p className="text-sm text-orange-600 font-medium">
                  Need assignment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                <CardTitle className="text-sm font-semibold text-purple-700">
                  Available Branches
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {branches.length}
                </div>
                <p className="text-sm text-purple-600 font-medium">
                  Target branches
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Target Branch Selection */}
          <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-green-100/50">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  Target Branch
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Select Branch
                  </Label>
                  <SearchableSelect
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: `${branch.name} (${branch.code})`,
                      description: "Branch assignment target",
                    }))}
                    value={targetBranchId}
                    onValueChange={setTargetBranchId}
                    placeholder="Choose target branch..."
                    className="w-full"
                  />
                </div>

                {targetBranchId && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">
                          {branches.find((b) => b.id === targetBranchId)?.name}
                        </h4>
                        <p className="text-sm text-green-700">
                          Code:{" "}
                          {branches.find((b) => b.id === targetBranchId)?.code}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleBulkAssign}
                    disabled={
                      submitting || selectedUsers.size === 0 || !targetBranchId
                    }
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Assigning {selectedUsers.size} users...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Assign {selectedUsers.size} Users
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Selection */}
          <Card className="lg:col-span-2 bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Select Users ({selectedUsers.size} selected)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                >
                  {selectedUsers.size === filteredUsers.length ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Search Users
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Filter by Role
                  </Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl">
                      <SelectValue placeholder="All roles" />
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
                  <Label className="text-sm font-semibold text-gray-700">
                    Assignment Status
                  </Label>
                  <Select
                    value={assignmentFilter}
                    onValueChange={setAssignmentFilter}
                  >
                    <SelectTrigger className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 sm:p-4 border rounded-xl transition-all duration-200 ${
                      selectedUsers.has(user.id)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {user.email}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <Badge
                                className={`${getRoleBadgeColor(
                                  user.role
                                )} text-xs`}
                              >
                                {getRoleDisplayName(user.role)}
                              </Badge>
                              {user.branch && (
                                <Badge variant="outline" className="text-xs">
                                  {user.branch.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            {user.branch ? (
                              <div className="flex items-center space-x-1 text-green-600">
                                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Assigned
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-orange-600">
                                <UserX className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Unassigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No users match your current filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
