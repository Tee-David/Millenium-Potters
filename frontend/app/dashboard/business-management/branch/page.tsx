"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";
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
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Building2,
  Users,
  UserCheck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  MoreVertical,
  Download,
  FileText,
  FileSpreadsheet,
  Copy,
  X,
  CalendarDays,
  RotateCcw,
  Save,
  Columns,
  MoreHorizontal,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { branchesApi, handleDatabaseError } from "@/lib/api";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usersApi } from "@/lib/api";

interface Branch {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  manager?: {
    id: string;
    email: string;
    role: string;
  };
  _count?: {
    users: number;
    customers: number;
    loans: number;
  };
}

interface FormData {
  name: string;
  managerId: string | null;
}

const PAGE_SIZE = 10;

function BranchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State variables
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    code: true,
    manager: true,
    status: true,
    users: true,
    customers: true,
    loans: true,
    createdAt: true,
    actions: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [managers, setManagers] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [filterPresets, setFilterPresets] = useState([
    {
      name: "Today",
      filters: {
        dateFrom: new Date().toISOString().split("T")[0],
        dateTo: new Date().toISOString().split("T")[0],
      },
    },
    {
      name: "This Week",
      filters: {
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        dateTo: new Date().toISOString().split("T")[0],
      },
    },
    {
      name: "This Month",
      filters: {
        dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0],
        dateTo: new Date().toISOString().split("T")[0],
      },
    },
  ]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteBranchId, setDeleteBranchId] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: "",
    managerId: null,
  });

  // Load branches
  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesApi.getAll({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchTerm,
      });

      const branchesData = response.data.data || response.data || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);

      // Handle pagination
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages || 1);
      }
    } catch (error: any) {
      console.error("Failed to load branches:", error);
      setError("Failed to load branches");
      handleDatabaseError(error, "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    loadBranches();
  }, [currentPage, debouncedSearchTerm, pageSize]);

  // Load managers for filter
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const response = await usersApi.getAll();
        const managerUsers = response.data.data.filter(
          (user: any) => user.role === "BRANCH_MANAGER" || user.role === "ADMIN"
        );
        const managerOptions = managerUsers.map((user: any) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email})`,
        }));
        setManagers(managerOptions);
      } catch (error) {
        console.warn("Failed to load managers:", error);
      }
    };
    loadManagers();
  }, []);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    let filtered = branches.filter((branch) => {
      const matchesSearch =
        !debouncedSearchTerm ||
        branch.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        branch.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        branch.manager?.email
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && branch.isActive) ||
        (statusFilter === "inactive" && !branch.isActive);

      const matchesManager =
        selectedManager === "all" || branch.managerId === selectedManager;

      const matchesDateRange = (() => {
        if (!dateFrom && !dateTo) return true;
        if (!branch.createdAt) return false;

        const branchDate = new Date(branch.createdAt);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && toDate) {
          return branchDate >= fromDate && branchDate <= toDate;
        } else if (fromDate) {
          return branchDate >= fromDate;
        } else if (toDate) {
          return branchDate <= toDate;
        }
        return true;
      })();

      return (
        matchesSearch && matchesStatus && matchesManager && matchesDateRange
      );
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "code":
          aValue = a.code.toLowerCase();
          bValue = b.code.toLowerCase();
          break;
        case "manager":
          aValue = a.manager?.email?.toLowerCase() || "";
          bValue = b.manager?.email?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        case "users":
          aValue = a._count?.users || 0;
          bValue = b._count?.users || 0;
          break;
        case "customers":
          aValue = a._count?.customers || 0;
          bValue = b._count?.customers || 0;
          break;
        case "loans":
          aValue = a._count?.loans || 0;
          bValue = b._count?.loans || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || "").getTime();
          bValue = new Date(b.createdAt || "").getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    branches,
    debouncedSearchTerm,
    statusFilter,
    selectedManager,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  ]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalBranches = branches.length;
    const activeBranches = branches.filter((b) => b.isActive).length;
    const totalUsers = branches.reduce(
      (sum, b) => sum + (b._count?.users || 0),
      0
    );
    const totalCustomers = branches.reduce(
      (sum, b) => sum + (b._count?.customers || 0),
      0
    );
    const totalLoans = branches.reduce(
      (sum, b) => sum + (b._count?.loans || 0),
      0
    );

    return {
      totalBranches,
      activeBranches,
      totalUsers,
      totalCustomers,
      totalLoans,
    };
  }, [branches]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      managerId: null,
    });
  };

  // Create new branch
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    setLoading(true);
    try {
      const createDto = {
        name: formData.name.trim(),
        // Only include managerId if it's not null or empty
        ...(formData.managerId &&
          formData.managerId.trim() !== "" && {
            managerId: formData.managerId,
          }),
      };

      await branchesApi.create(createDto);
      await loadBranches();
      resetForm();
      setIsCreateOpen(false);
      toast.success("Branch created successfully");
    } catch (error: any) {
      console.error("Failed to create branch", error);
      handleDatabaseError(error, "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal with branch data
  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      managerId: branch.managerId || null,
    });
    setIsEditOpen(true);
  };

  // Update existing branch
  const handleUpdate = async () => {
    if (!editingBranch) return;

    setLoading(true);
    try {
      const updateDto = {
        name: formData.name.trim(),
        // Handle managerId properly - send undefined if empty, otherwise send the value
        managerId:
          formData.managerId && formData.managerId.trim() !== ""
            ? formData.managerId
            : undefined,
      };

      await branchesApi.update(editingBranch.id, updateDto);
      await loadBranches();
      resetForm();
      setIsEditOpen(false);
      setEditingBranch(null);
      toast.success("Branch updated successfully");
    } catch (error: any) {
      console.error("Failed to update branch", error);
      handleDatabaseError(error, "Failed to update branch");
    } finally {
      setLoading(false);
    }
  };

  // Delete branch
  const handleDelete = async () => {
    if (!deleteBranchId) return;

    setLoading(true);
    try {
      await branchesApi.remove(deleteBranchId);
      await loadBranches();
      setDeleteBranchId(null);
      toast.success("Branch deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete branch", error);
      handleDatabaseError(error, "Failed to delete branch");
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadBranches();
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  // Filter management functions
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setStatusFilter("all");
    setSelectedManager("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
  }, []);

  const applyFilterPreset = useCallback((preset: any) => {
    setDateFrom(preset.filters.dateFrom || "");
    setDateTo(preset.filters.dateTo || "");
    toast.success(`Applied ${preset.name} filter`);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "all") count++;
    if (selectedManager !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [searchTerm, statusFilter, selectedManager, dateFrom, dateTo]);

  const resetFilters = () => {
    clearAllFilters();
  };

  const navigateToBranchDetails = (branchId: string) => {
    router.push(`/dashboard/business-management/branch/${branchId}`);
  };

  if (loading && branches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading branches...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch branch information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Branch Management
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 mt-1">
                    Manage your branch locations and operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Branch
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-700">
                    Total Branches
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {summaryStats.totalBranches}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-50 to-green-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-green-700">
                    Active Branches
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {summaryStats.activeBranches}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-purple-700">
                    Total Staff
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {summaryStats.totalUsers}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-orange-700">
                    Total Customers
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {summaryStats.totalCustomers}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-indigo-50 to-indigo-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-indigo-700">
                    Total Loans
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {summaryStats.totalLoans}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-indigo-500 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch List Section */}
        <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Branch List
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {filteredBranches.length} of {branches.length} branches
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="px-4 sm:px-6 py-4 bg-white space-y-4">
            {/* Export and Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300 text-xs sm:text-sm"
                >
                  <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Excel</span>
                  <span className="sm:hidden">XLS</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300 text-xs sm:text-sm"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300 text-xs sm:text-sm"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Copy</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                  <Input
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl h-10 sm:h-11"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Filters Section */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-green-600" />
                    Advanced Search & Filters
                    {getActiveFiltersCount() > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-green-100 text-green-800"
                      >
                        {getActiveFiltersCount()} active
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <FilterX className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Filter Presets */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Quick Filters
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {filterPresets.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => applyFilterPreset(preset)}
                        className="text-xs hover:bg-green-50 hover:border-green-200"
                      >
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Main Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <Label
                      htmlFor="status"
                      className="text-sm font-medium text-gray-700"
                    >
                      Branch Status
                    </Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Manager Filter */}
                  <div>
                    <Label
                      htmlFor="manager"
                      className="text-sm font-medium text-gray-700"
                    >
                      Branch Manager
                    </Label>
                    <SearchableSelect
                      options={[
                        { value: "all", label: "All managers" },
                        ...managers,
                      ]}
                      value={selectedManager}
                      onValueChange={setSelectedManager}
                      placeholder="All managers"
                      searchPlaceholder="Search managers..."
                      className="text-sm"
                    />
                  </div>

                  {/* Date Range */}
                  <div>
                    <Label
                      htmlFor="dateFrom"
                      className="text-sm font-medium text-gray-700"
                    >
                      From Date
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="dateTo"
                      className="text-sm font-medium text-gray-700"
                    >
                      To Date
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Sort Options */}
                  <div>
                    <Label
                      htmlFor="sortBy"
                      className="text-sm font-medium text-gray-700"
                    >
                      Sort By
                    </Label>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="loans">Loans</SelectItem>
                          <SelectItem value="createdAt">
                            Created Date
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        className="px-3"
                      >
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filter Summary */}
                {getActiveFiltersCount() > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {getActiveFiltersCount()} filter
                          {getActiveFiltersCount() !== 1 ? "s" : ""} applied
                        </span>
                      </div>
                      <div className="text-sm text-green-600">
                        Showing {filteredBranches.length} of {branches.length}{" "}
                        branches
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table Controls */}
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Columns className="w-4 h-4 mr-1" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">
                        Toggle columns
                      </Label>
                      {Object.entries(columnVisibility).map(
                        ([key, visible]) => (
                          <div
                            key={key}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={key}
                              checked={visible}
                              onChange={(e) =>
                                setColumnVisibility((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={key} className="text-xs capitalize">
                              {key === "createdAt" ? "Created Date" : key}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-xs text-gray-600">
                    Rows per page:
                  </Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredBranches.length)} of{" "}
                {filteredBranches.length} branches
              </div>
            </div>
          </div>

          {/* Branches Table */}
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No branches found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Create your first branch to get started"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Branch
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    {columnVisibility.name && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">
                            Branch Details
                          </span>
                          <span className="sm:hidden">Branch</span>
                        </div>
                      </th>
                    )}
                    {columnVisibility.code && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                        Code
                      </th>
                    )}
                    {columnVisibility.manager && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                        Manager
                      </th>
                    )}
                    {columnVisibility.status && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {columnVisibility.users && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Users
                      </th>
                    )}
                    {columnVisibility.customers && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Customers
                      </th>
                    )}
                    {columnVisibility.loans && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Loans
                      </th>
                    )}
                    {columnVisibility.createdAt && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Created</span>
                        </div>
                      </th>
                    )}
                    {columnVisibility.actions && (
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBranches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-white transition-all duration-200 border-b border-gray-100 cursor-pointer"
                      onClick={() => navigateToBranchDetails(branch.id)}
                    >
                      {columnVisibility.name && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors">
                                {branch.name}
                              </div>
                              <div className="sm:hidden mt-1">
                                <Badge
                                  variant={
                                    branch.isActive ? "default" : "secondary"
                                  }
                                  className={
                                    branch.isActive
                                      ? "bg-green-100 text-green-800 text-xs"
                                      : "bg-gray-100 text-gray-600 text-xs"
                                  }
                                >
                                  {branch.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.code && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm font-medium text-gray-900 font-mono">
                            {branch.code}
                          </div>
                        </td>
                      )}
                      {columnVisibility.manager && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 hidden sm:table-cell">
                          {branch.manager ? (
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-blue-100 rounded-full">
                                <UserCheck className="w-3 h-3 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {branch.manager.email}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {branch.manager.role
                                    .toLowerCase()
                                    .replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Unassigned
                            </div>
                          )}
                        </td>
                      )}
                      {columnVisibility.status && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                          <Badge
                            variant={branch.isActive ? "default" : "secondary"}
                            className={
                              branch.isActive
                                ? "bg-green-100 text-green-800 text-xs"
                                : "bg-gray-100 text-gray-600 text-xs"
                            }
                          >
                            {branch.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      )}
                      {columnVisibility.users && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {branch._count?.users || 0}
                            </div>
                            <div className="text-xs text-gray-500">Staff</div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.customers && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {branch._count?.customers || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Customers
                            </div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.loans && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {branch._count?.loans || 0}
                            </div>
                            <div className="text-xs text-gray-500">Loans</div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.createdAt && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm font-medium text-gray-900">
                            {branch.createdAt
                              ? formatDate(branch.createdAt)
                              : "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {branch.createdAt
                              ? getTimeAgo(branch.createdAt)
                              : ""}
                          </div>
                        </td>
                      )}
                      {columnVisibility.actions && (
                        <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToBranchDetails(branch.id);
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg p-1.5 sm:p-2"
                              aria-label={`View details for ${branch.name}`}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(branch);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-1.5 sm:p-2"
                              aria-label={`Edit ${branch.name}`}
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteBranchId(branch.id);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5 sm:p-2"
                              aria-label={`Delete ${branch.name}`}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Enhanced Pagination */}
              {filteredBranches.length > pageSize && (
                <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(
                        currentPage * pageSize,
                        filteredBranches.length
                      )}{" "}
                      of {filteredBranches.length} branches
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          {
                            length: Math.min(
                              5,
                              Math.ceil(filteredBranches.length / pageSize)
                            ),
                          },
                          (_, i) => {
                            const pageNum = Math.max(1, currentPage - 2) + i;
                            const totalPages = Math.ceil(
                              filteredBranches.length / pageSize
                            );
                            if (pageNum > totalPages) return null;

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="px-3 py-1 min-w-[32px]"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          currentPage >=
                          Math.ceil(filteredBranches.length / pageSize)
                        }
                        className="px-2 py-1"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            Math.ceil(filteredBranches.length / pageSize)
                          )
                        }
                        disabled={
                          currentPage >=
                          Math.ceil(filteredBranches.length / pageSize)
                        }
                        className="px-2 py-1"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Branch Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-600" />
              <span>Create New Branch</span>
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Enter the basic information for the new branch. You can assign
              managers and staff after creation.
            </p>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg">
              <div>
                <Label
                  htmlFor="create-name"
                  className="text-sm font-semibold text-gray-700"
                >
                  Branch Name *
                </Label>
                <Input
                  id="create-name"
                  placeholder="e.g., Lagos Main Branch"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-2 border-green-200 focus:border-green-500 focus:ring-green-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name for easy identification
                </p>
              </div>
            </div>

            {/* Always show the Create Branch button when modal is open */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !formData.name.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Branch
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Edit className="w-5 h-5 text-green-600" />
              <span>Edit Branch</span>
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Update branch information. Changes will be reflected immediately.
            </p>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg">
              <div>
                <Label
                  htmlFor="edit-name"
                  className="text-sm font-semibold text-gray-700"
                >
                  Branch Name *
                </Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Lagos Main Branch"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-2 border-green-200 focus:border-green-500 focus:ring-green-500/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name for easy identification
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  resetForm();
                  setEditingBranch(null);
                }}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading || !formData.name.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Branch
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={deleteBranchId !== null}
        title="Confirm Branch Deletion"
        message={
          deleteBranchId ? (
            <div>
              <p className="mb-2">
                Are you sure you want to delete{" "}
                <strong>
                  {branches.find((b) => b.id === deleteBranchId)?.name}
                </strong>
                ?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone and will remove all associated
                data.
              </p>
            </div>
          ) : (
            ""
          )
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteBranchId(null)}
        isLoading={loading}
      />
    </div>
  );
}

export default function BranchPage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can access branch management." />
      }
    >
      <BranchPageContent />
    </StaffOnly>
  );
}
