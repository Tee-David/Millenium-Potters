"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { unionsApi, usersApi } from "@/lib/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Users,
  CreditCard,
  User,
  MapPin,
  Mail,
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
  Eye,
} from "lucide-react";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { SearchableSelect } from "@/components/SearchableSelect";

interface Union {
  id: string;
  name: string;
  location?: string;
  address?: string;
  code?: string;
  creditOfficerId?: string;
  creditOfficer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  _count?: {
    unionMembers: number;
    loans: number;
  };
  createdAt?: string;
}
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function UnionManagementPage() {
  const router = useRouter();
  const [unions, setUnions] = useState<Union[]>([]);
  const [creditOfficers, setCreditOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [creditOfficerFilter, setCreditOfficerFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUnion, setSelectedUnion] = useState<Union | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    creditOfficerId: "",
  });

  useEffect(() => {
    loadCreditOfficers();
  }, []);

  useEffect(() => {
    loadUnions();
  }, [currentPage, pageSize, searchTerm, creditOfficerFilter]);

  const loadUnions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      if (creditOfficerFilter !== "all")
        params.creditOfficerId = creditOfficerFilter;

      const response = await unionsApi.getAll(params);
      const data = response.data;

      if (data.success) {
        setUnions(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalItems(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || "Failed to load unions");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load unions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditOfficers = async () => {
    try {
      const response = await usersApi.getAll({
        role: "CREDIT_OFFICER",
        isActive: true,
        limit: 1000,
      });
      const data = response.data;

      // Parse the response - handle different response structures
      let officers: User[] = [];
      if (data.success && data.data) {
        // New API format: { success: true, data: { users: [...] } }
        officers = data.data.users || data.data || [];
      } else if (data.data) {
        // Alternative format: { data: { users: [...] } }
        officers = data.data.users || data.data || [];
      } else if (Array.isArray(data)) {
        // Direct array response
        officers = data;
      } else if (Array.isArray(data.data)) {
        // Array in data property
        officers = data.data;
      }

      // Filter for active credit officers only
      officers = officers.filter(
        (officer: any) =>
          officer.role === "CREDIT_OFFICER" &&
          officer.isActive !== false &&
          !officer.deletedAt
      );

      setCreditOfficers(officers);
      console.log("Loaded credit officers:", officers.length, officers);
    } catch (err) {
      console.error("Failed to load credit officers:", err);
      toast.error("Failed to load credit officers");
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.creditOfficerId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await unionsApi.create({
        name: formData.name,
        location: formData.location || undefined,
        address: formData.address || undefined,
        creditOfficerId: formData.creditOfficerId,
      });

      if (response.data.success) {
        toast.success("Union created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
        loadUnions();
      } else {
        throw new Error(response.data.message || "Failed to create union");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to create union";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUnion || !formData.name || !formData.creditOfficerId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await unionsApi.update(selectedUnion.id, {
        name: formData.name,
        location: formData.location || undefined,
        address: formData.address || undefined,
        creditOfficerId: formData.creditOfficerId,
      });

      if (response.data.success) {
        toast.success("Union updated successfully");
        setIsEditDialogOpen(false);
        resetForm();
        setSelectedUnion(null);
        loadUnions();
      } else {
        throw new Error(response.data.message || "Failed to update union");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to update union";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnion) return;

    setIsSubmitting(true);
    try {
      const response = await unionsApi.remove(selectedUnion.id);

      if (response.data.success) {
        toast.success("Union deleted successfully");
        setIsDeleteDialogOpen(false);
        setSelectedUnion(null);
        loadUnions();
      } else {
        throw new Error(response.data.message || "Failed to delete union");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to delete union";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      address: "",
      creditOfficerId: "",
    });
  };

  const openEditDialog = (union: Union) => {
    setSelectedUnion(union);
    setFormData({
      name: union.name,
      location: union.location || "",
      address: union.address || "",
      creditOfficerId: union.creditOfficerId || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (union: Union) => {
    setSelectedUnion(union);
    setIsDeleteDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (creditOfficerFilter !== "all")
        params.creditOfficerId = creditOfficerFilter;

      const response = await unionsApi.export(params);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Unions exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export unions");
    }
  };

  const filteredUnions = useMemo(() => {
    return unions;
  }, [unions]);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch (error) {
      return value;
    }
  };

  const openDetailsDialog = (union: Union) => {
    setSelectedUnion(union);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Union Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage unions and their credit officer assignments
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
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Union</span>
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
                  placeholder="Search by name, location..."
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
              <Label htmlFor="creditOfficer">Credit Officer</Label>
              <SearchableSelect
                value={creditOfficerFilter}
                onValueChange={(value) => {
                  setCreditOfficerFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Credit Officers"
                searchPlaceholder="Search credit officers..."
                options={[
                  { value: "all", label: "All Credit Officers" },
                  ...creditOfficers.map((officer) => ({
                    value: officer.id,
                    label:
                      officer.firstName && officer.lastName
                        ? `${officer.firstName} ${officer.lastName}`
                        : officer.email,
                  })),
                ]}
              />
            </div>
            <div className="flex items-end gap-2">
              {(searchTerm || creditOfficerFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setCreditOfficerFilter("all");
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
                onClick={loadUnions}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Unions
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {totalItems}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {unions.reduce(
                    (sum, u) => sum + (u._count?.unionMembers || 0),
                    0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Total Loans
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {unions.reduce((sum, u) => sum + (u._count?.loans || 0), 0)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unions Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Unions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && unions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error && unions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" onClick={loadUnions} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredUnions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">No unions found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || creditOfficerFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first union to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Credit Officer</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead className="text-center">Loans</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnions.map((union) => (
                      <TableRow key={union.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {union.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {union.location && (
                              <>
                                <MapPin className="h-3 w-3" />
                                {union.location}
                              </>
                            )}
                            {!union.location && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {union.creditOfficer ? (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">
                                {union.creditOfficer.firstName &&
                                union.creditOfficer.lastName
                                  ? `${union.creditOfficer.firstName} ${union.creditOfficer.lastName}`
                                  : union.creditOfficer.email}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {union._count?.unionMembers || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {union._count?.loans || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsDialog(union)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(union)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(union)}
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
                    {totalItems} unions
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

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Union Details</DialogTitle>
            <DialogDescription>
              Detailed insights for backend-synced union records.
            </DialogDescription>
          </DialogHeader>
          {selectedUnion ? (
            <div className="space-y-6">
              <div className="rounded-lg border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Union Overview
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  {selectedUnion.name}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium text-slate-800">
                      {selectedUnion.location || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <p className="font-medium text-slate-800">
                      {selectedUnion.code || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-slate-800">
                      {selectedUnion.address || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created At</p>
                    <p className="font-medium text-slate-800">
                      {formatDate(selectedUnion.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Credit Officer
                  </p>
                  {selectedUnion.creditOfficer ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-slate-900">
                          {selectedUnion.creditOfficer.firstName &&
                          selectedUnion.creditOfficer.lastName
                            ? `${selectedUnion.creditOfficer.firstName} ${selectedUnion.creditOfficer.lastName}`
                            : selectedUnion.creditOfficer.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>{selectedUnion.creditOfficer.email}</span>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Not Assigned
                    </Badge>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Assignment Status
                  </p>
                  <div className="space-y-1">
                    <Badge
                      variant={
                        selectedUnion.creditOfficer ? "secondary" : "outline"
                      }
                      className={
                        selectedUnion.creditOfficer
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600"
                      }
                    >
                      {selectedUnion.creditOfficer ? "Assigned" : "Unassigned"}
                    </Badge>
                    <p className="text-sm text-slate-600">
                      Members: {selectedUnion._count?.unionMembers || 0}
                    </p>
                    <p className="text-sm text-slate-600">
                      Loans: {selectedUnion._count?.loans || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-muted-foreground">
                    Backend Identifier
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-800 break-all">
                    {selectedUnion.id}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-muted-foreground">Officer ID</p>
                  <p className="mt-1 font-mono text-sm text-slate-800 break-all">
                    {selectedUnion.creditOfficerId || "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Select a union to view detailed information.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Union</DialogTitle>
            <DialogDescription>
              Create a new union and assign it to a credit officer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter union name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-location">Location</Label>
              <Input
                id="create-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Enter location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-address">Address</Label>
              <Input
                id="create-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-creditOfficer">
                Credit Officer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={formData.creditOfficerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, creditOfficerId: value })
                }
                placeholder="Select credit officer"
                searchPlaceholder="Search credit officers..."
                options={creditOfficers.map((officer) => ({
                  value: officer.id,
                  label:
                    officer.firstName && officer.lastName
                      ? `${officer.firstName} ${officer.lastName} (${officer.email})`
                      : officer.email,
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Union</DialogTitle>
            <DialogDescription>
              Update union information and credit officer assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter union name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Enter location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-creditOfficer">
                Credit Officer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={formData.creditOfficerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, creditOfficerId: value })
                }
                placeholder="Select credit officer"
                searchPlaceholder="Search credit officers..."
                options={creditOfficers.map((officer) => ({
                  value: officer.id,
                  label:
                    officer.firstName && officer.lastName
                      ? `${officer.firstName} ${officer.lastName} (${officer.email})`
                      : officer.email,
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Union"
        message={`Are you sure you want to delete "${selectedUnion?.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonVariant="destructive"
        isLoading={isSubmitting}
      />
    </div>
  );
}
