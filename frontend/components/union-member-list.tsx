"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Download,
  Filter,
  X,
  Loader2,
  AlertCircle,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { ConfirmationModal } from "./modals/confirmation-modal";
import { unionMembersApi, unionsApi } from "@/lib/api";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/SearchableSelect";

interface UnionMember {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified?: boolean;
  profileImage?: string;
  unionId: string;
  union?: {
    id: string;
    name: string;
  };
  currentOfficerId?: string;
  currentOfficer?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
}

interface Union {
  id: string;
  name: string;
}

export function UnionMemberList() {
  const router = useRouter();
  const [members, setMembers] = useState<UnionMember[]>([]);
  const [unions, setUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unionFilter, setUnionFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UnionMember | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);

  const handleToggleVerification = async (member: UnionMember) => {
    setTogglingMemberId(member.id);
    try {
      const response = await unionMembersApi.toggleVerification(member.id);
      if (response.data.success) {
        // Update the member in the list
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id ? { ...m, isVerified: !m.isVerified } : m
          )
        );
        toast.success(
          response.data.message ||
            `Member ${
              member.isVerified ? "unapproved" : "approved"
            } successfully`
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update verification status"
      );
    } finally {
      setTogglingMemberId(null);
    }
  };

  useEffect(() => {
    loadUnions();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [currentPage, pageSize, searchTerm, unionFilter]);

  const loadUnions = async () => {
    try {
      const response = await unionsApi.getAll({ limit: 1000 });
      const data = response.data;
      if (data.success) {
        setUnions(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load unions:", err);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      if (unionFilter !== "all") params.unionId = unionFilter;

      const response = await unionMembersApi.getAll(params);
      const data = response.data;

      if (data.success) {
        setMembers(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalItems(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || "Failed to load union members");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load union members";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      const response = await unionMembersApi.remove(selectedMember.id);

      if (response.data.success) {
        toast.success("Union member deleted successfully");
        setIsDeleteDialogOpen(false);
        setSelectedMember(null);
        loadMembers();
      } else {
        throw new Error(
          response.data.message || "Failed to delete union member"
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete union member";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (unionFilter !== "all") params.unionId = unionFilter;

      const response = await unionMembersApi.export(params);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `union-members-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Union members exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export union members");
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Union Members</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage union members and their information
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() =>
              router.push("/dashboard/business-management/union-member/create")
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Member</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="union">Union</Label>
              <SearchableSelect
                value={unionFilter}
                onValueChange={(value) => {
                  setUnionFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Unions"
                searchPlaceholder="Search unions..."
                options={[
                  { value: "all", label: "All Unions" },
                  ...unions.map((union) => ({
                    value: union.id,
                    label: union.name,
                  })),
                ]}
              />
            </div>
            <div className="flex items-end gap-2">
              {(searchTerm || unionFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setUnionFilter("all");
                    setCurrentPage(1);
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadMembers}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Members</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {totalItems}
              </p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Union Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && members.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error && members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" onClick={loadMembers} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">
                No union members found
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || unionFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first union member to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Union</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={member.profileImage}
                                alt={`${member.firstName} ${member.lastName}`}
                              />
                              <AvatarFallback>
                                {getInitials(member.firstName, member.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {member.firstName} {member.lastName}
                              </div>
                              {member.code && (
                                <div className="text-xs text-gray-500">
                                  Code: {member.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {member.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </div>
                            )}
                            {member.email && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </div>
                            )}
                            {!member.phone && !member.email && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.union ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">
                                {member.union.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={member.isVerified}
                              onCheckedChange={() =>
                                handleToggleVerification(member)
                              }
                              disabled={togglingMemberId === member.id}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <Badge
                              variant={
                                member.isVerified ? "default" : "secondary"
                              }
                              className={
                                member.isVerified
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {member.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/business-management/union-member/${member.id}`
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/business-management/union-member/${member.id}/edit`
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalItems)} of{" "}
                    {totalItems} members
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || loading}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Union Member"
        message={`Are you sure you want to delete "${selectedMember?.firstName} ${selectedMember?.lastName}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonVariant="destructive"
        isLoading={isSubmitting}
      />
    </div>
  );
}
