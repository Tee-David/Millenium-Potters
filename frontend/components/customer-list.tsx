"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getUserDisplayName } from "@/utils/user-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  FileSpreadsheet,
  FileText,
  Copy,
  Settings2,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  CalendarDays,
  RotateCcw,
  Save,
  Download,
  Upload,
  Users,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  FilterX,
  Columns,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ConfirmationModal } from "./modals/confirmation-modal";
import { useRouter } from "next/navigation";
import { Customer } from "@/types/customer";
import {
  branchesApi,
  customersApi,
  usersApi,
  loansApi,
  handleDatabaseError,
  auth,
} from "@/lib/api";
import {
  parseCustomers,
  parseUsers,
  parseBranches,
  parseLoans,
  transformCustomer,
  safeGet,
} from "@/lib/api-parser";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/SearchableSelect";

interface EnrichedCustomer extends Customer {
  branchName: string;
  creditOfficerName: string;
  name: string; // Computed from firstName + lastName
  loanCount?: number;
  totalLoanAmount?: number;
  lastActivity?: string;
  verificationStatus?: "VERIFIED" | "PENDING" | "REJECTED";
  registrationDate?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface UserProfile {
  id: string;
  role: string;
  branchId?: string;
  email: string;
}

interface FilterPreset {
  name: string;
  dateFrom: string;
  dateTo: string;
}

interface CustomerStats {
  totalCustomers: number;
  verifiedCustomers: number;
  pendingVerification: number;
  activeLoans: number;
  totalLoanAmount: number;
}

export function CustomerList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Enhanced state management
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTimeoutRef, setSearchTimeoutRef] =
    useState<NodeJS.Timeout | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedOfficer, setSelectedOfficer] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [branches, setBranches] = useState<{ value: string; label: string }[]>(
    []
  );
  const [officers, setOfficers] = useState<{ value: string; label: string }[]>(
    []
  );
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    verifiedCustomers: 0,
    pendingVerification: 0,
    activeLoans: 0,
    totalLoanAmount: 0,
  });

  const [visibleCols, setVisibleCols] = useState({
    name: true,
    email: true,
    phone: true,
    branch: true,
    creditOfficer: true,
    registrationDate: true,
    verificationStatus: true,
    loanCount: true,
    lastActivity: true,
    action: true,
  });
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

  // Filter presets
  const filterPresets: FilterPreset[] = [
    {
      name: "Today",
      dateFrom: new Date().toISOString().split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
    },
    {
      name: "This Week",
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
    },
    {
      name: "This Month",
      dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
    },
  ];

  // Load current user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileResponse = await auth.profile();
        const user = profileResponse.data as UserProfile;
        setCurrentUser(user);
        console.log("Current user loaded:", user);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    loadUserProfile();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef) {
      clearTimeout(searchTimeoutRef);
    }

    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    setSearchTimeoutRef(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm]);

  // Load branches and officers
  useEffect(() => {
    const loadBranchesAndOfficers = async () => {
      try {
        const [branchesResponse, officersResponse] = await Promise.all([
          branchesApi.getAll().catch(() => ({ data: { data: [] } })),
          usersApi.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        const branchesData = parseBranches(branchesResponse);
        const officersData = parseUsers(officersResponse);

        setBranches([
          { value: "all", label: "All branches" },
          ...branchesData.map((branch: any) => ({
            value: branch.id,
            label: branch.name,
          })),
        ]);

        setOfficers([
          { value: "all", label: "All officers" },
          ...officersData
            .filter(
              (user: any) =>
                user.role === "CREDIT_OFFICER" || user.role === "BRANCH_MANAGER"
            )
            .map((officer: any) => ({
              value: officer.id,
              label: officer.email,
            })),
        ]);
      } catch (error) {
        console.error("Failed to load branches and officers:", error);
      }
    };

    if (currentUser) {
      loadBranchesAndOfficers();
    }
  }, [currentUser]);

  // Fetch customers with enhanced filtering and statistics
  const fetchCustomers = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log("Fetching customers with enhanced filters");

      // Prepare API parameters
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      // Add search if provided
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const [customerResp, loansResp] = await Promise.all([
        customersApi.getAll(params).catch(() => ({ data: { data: [] } })),
        loansApi.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      // Use standardized parsing
      const customersData = parseCustomers(customerResp);
      const loansData = parseLoans(loansResp);

      // Transform customers to include computed fields
      const transformedCustomers = customersData.map((customer: any) => {
        const customerLoans = loansData.filter(
          (loan: any) => loan.customerId === customer.id
        );
        const activeLoans = customerLoans.filter(
          (loan: any) =>
            loan.status === "APPROVED" ||
            loan.status === "DISBURSED" ||
            loan.status === "ACTIVE"
        );

        return {
          ...customer,
          name:
            `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
            "Unknown Customer",
          branchName: customer.branch?.name || "Unknown Branch",
          creditOfficerName: getUserDisplayName(
            customer.currentOfficer,
            "Unassigned"
          ),
          loanCount: customerLoans.length,
          totalLoanAmount: customerLoans.reduce(
            (sum: number, loan: any) =>
              sum + (parseFloat(loan.principalAmount) || 0),
            0
          ),
          lastActivity: customer.updatedAt || customer.createdAt,
          verificationStatus:
            customer.isVerified === false ? "PENDING" : "VERIFIED",
          registrationDate: customer.createdAt,
        };
      });

      // Apply advanced filtering
      let filteredData = transformedCustomers;

      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        filteredData = filteredData.filter(
          (customer: any) =>
            customer.firstName?.toLowerCase().includes(searchLower) ||
            customer.lastName?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower) ||
            customer.phone?.toLowerCase().includes(searchLower) ||
            customer.id?.toLowerCase().includes(searchLower) ||
            customer.branchName?.toLowerCase().includes(searchLower) ||
            customer.creditOfficerName?.toLowerCase().includes(searchLower)
        );
      }

      // Branch filter
      if (selectedBranch !== "all") {
        filteredData = filteredData.filter(
          (customer: any) => customer.branchId === selectedBranch
        );
      }

      // Officer filter
      if (selectedOfficer !== "all") {
        filteredData = filteredData.filter(
          (customer: any) => customer.currentOfficerId === selectedOfficer
        );
      }

      // Status filter
      if (selectedStatus !== "all") {
        filteredData = filteredData.filter(
          (customer: any) => customer.verificationStatus === selectedStatus
        );
      }

      // Date range filter
      if (dateFrom) {
        filteredData = filteredData.filter(
          (customer: any) =>
            customer.registrationDate &&
            new Date(customer.registrationDate) >= new Date(dateFrom)
        );
      }
      if (dateTo) {
        filteredData = filteredData.filter(
          (customer: any) =>
            customer.registrationDate &&
            new Date(customer.registrationDate) <= new Date(dateTo)
        );
      }

      // Sorting
      filteredData.sort((a: any, b: any) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Calculate statistics
      const totalCustomers = filteredData.length;
      const verifiedCustomers = filteredData.filter(
        (c: any) => c.verificationStatus === "VERIFIED"
      ).length;
      const pendingVerification = filteredData.filter(
        (c: any) => c.verificationStatus === "PENDING"
      ).length;
      const activeLoans = filteredData.reduce(
        (sum: number, c: any) => sum + (c.loanCount || 0),
        0
      );
      const totalLoanAmount = filteredData.reduce(
        (sum: number, c: any) => sum + (c.totalLoanAmount || 0),
        0
      );

      setStats({
        totalCustomers,
        verifiedCustomers,
        pendingVerification,
        activeLoans,
        totalLoanAmount,
      });

      // Client-side pagination
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = filteredData.slice(
        startIndex,
        startIndex + pageSize
      );

      setCustomers(paginatedData as EnrichedCustomer[]);
      setPagination({
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
      });
    } catch (error: any) {
      console.error("Failed to fetch customers", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load customers due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      const message = error.response?.data?.message || "";
      if (
        message.includes("You can only view customers from your own branch")
      ) {
        toast.error("You can only view customers from your own branch.");
      } else {
        toast.error("Failed to load customers", {
          description: message || "An unexpected error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentUser,
    currentPage,
    pageSize,
    debouncedSearchTerm,
    selectedBranch,
    selectedOfficer,
    selectedStatus,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser, fetchCustomers]);

  const toggleColumnVisibility = (colName: keyof typeof visibleCols) => {
    setVisibleCols((prev) => ({
      ...prev,
      [colName]: !prev[colName],
    }));
  };

  // Filter management functions
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedBranch("all");
    setSelectedOfficer("all");
    setSelectedStatus("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
  }, []);

  const applyFilterPreset = useCallback((preset: FilterPreset) => {
    setDateFrom(preset.dateFrom);
    setDateTo(preset.dateTo);
    setCurrentPage(1);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (debouncedSearchTerm) count++;
    if (selectedBranch !== "all") count++;
    if (selectedOfficer !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [
    debouncedSearchTerm,
    selectedBranch,
    selectedOfficer,
    selectedStatus,
    dateFrom,
    dateTo,
  ]);

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            Verified
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
            Pending
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">Rejected</Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 text-xs">Unknown</Badge>
        );
    }
  };

  const exportData = () => {
    const cols = Object.keys(visibleCols).filter(
      (k) => visibleCols[k as keyof typeof visibleCols]
    ) as (keyof typeof visibleCols)[];
    const rows = customers.map((customer) =>
      cols.reduce((acc, key) => {
        switch (key) {
          case "name":
            acc[key] = customer.name || "";
            break;
          case "email":
            acc[key] = customer.email || "";
            break;
          case "phone":
            acc[key] = customer.phone || "";
            break;
          case "branch":
            acc[key] = customer.branchName || "N/A";
            break;
          case "creditOfficer":
            acc[key] = customer.creditOfficerName || "N/A";
            break;
          case "registrationDate":
            acc[key] = customer.registrationDate
              ? formatDate(customer.registrationDate)
              : "N/A";
            break;
          case "verificationStatus":
            acc[key] = customer.verificationStatus || "N/A";
            break;
          case "loanCount":
            acc[key] = customer.loanCount?.toString() || "0";
            break;
          case "lastActivity":
            acc[key] = customer.lastActivity
              ? getTimeAgo(customer.lastActivity)
              : "N/A";
            break;
          default:
            acc[key] = "";
        }
        return acc;
      }, {} as Record<string, string>)
    );

    return { cols, rows };
  };

  const exportExcel = () => {
    const { rows } = exportData();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

  const exportPDF = () => {
    const { cols, rows } = exportData();
    const doc = new jsPDF();
    autoTable(doc, {
      head: [cols.map((c) => c.charAt(0).toUpperCase() + c.slice(1))],
      body: rows.map((r) => cols.map((c) => r[c])),
      startY: 10,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10 },
    });
    doc.save("customers.pdf");
  };

  const copyClipboard = () => {
    const { cols, rows } = exportData();
    const header = cols.join("\t");
    const body = rows.map((r) => cols.map((c) => r[c]).join("\t")).join("\n");
    navigator.clipboard.writeText(`${header}\n${body}`);
    alert("Copied customer data to clipboard");
  };

  const handleDelete = async (customerId: string) => {
    try {
      await customersApi.remove(customerId);
      fetchCustomers(); // Refresh the list
      setDeleteCustomerId(null);
    } catch (error: any) {
      console.error("Failed to delete customer:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to delete customer due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      const message = error.response?.data?.message || "";
      if (
        message.includes("You can only delete customers from your own branch")
      ) {
        toast.error("You can only delete customers from your own branch.");
      } else if (message.includes("Customer not found")) {
        toast.error(
          "The customer was not found. Please refresh and try again."
        );
      } else if (message.includes("You do not have permission")) {
        toast.error("You don't have permission to delete this customer.");
      } else {
        toast.error("Failed to delete customer", {
          description: message || "An unexpected error occurred",
        });
      }
    }
  };

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(
    () => goToPage(pagination.totalPages),
    [goToPage, pagination.totalPages]
  );
  const goToPrevPage = useCallback(
    () => goToPage(Math.max(currentPage - 1, 1)),
    [goToPage, currentPage]
  );
  const goToNextPage = useCallback(
    () => goToPage(Math.min(currentPage + 1, pagination.totalPages)),
    [goToPage, currentPage, pagination.totalPages]
  );

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(pagination.totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < pagination.totalPages - 1) {
      rangeWithDots.push("...", pagination.totalPages);
    } else {
      rangeWithDots.push(pagination.totalPages);
    }

    return rangeWithDots;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading customers...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch customer data
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Customers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.verifiedCustomers}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingVerification}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Loans
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeLoans}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{stats.totalLoanAmount.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-600" />
              Customer Management
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={exportExcel}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                aria-label="Export to Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPDF}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                aria-label="Export to PDF"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyClipboard}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                aria-label="Copy table data"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Copy</span>
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() =>
                  router.push("/dashboard/business-management/customer/create")
                }
                aria-label="Create customer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Create Customer</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Enhanced Filters Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-emerald-600" />
                  Advanced Search & Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-emerald-100 text-emerald-800"
                    >
                      {getActiveFiltersCount()} active
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
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
                      className="text-xs hover:bg-emerald-50 hover:border-emerald-200"
                    >
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Main Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Search */}
                <div className="xl:col-span-2">
                  <Label
                    htmlFor="search"
                    className="text-sm font-medium text-gray-700"
                  >
                    Search Customers
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, phone, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Branch Filter */}
                <div>
                  <Label
                    htmlFor="branch"
                    className="text-sm font-medium text-gray-700"
                  >
                    Branch
                  </Label>
                  <SearchableSelect
                    options={branches}
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                    placeholder="All branches"
                    searchPlaceholder="Search branches..."
                    className="text-sm"
                  />
                </div>

                {/* Officer Filter */}
                <div>
                  <Label
                    htmlFor="officer"
                    className="text-sm font-medium text-gray-700"
                  >
                    Credit Officer
                  </Label>
                  <SearchableSelect
                    options={officers}
                    value={selectedOfficer}
                    onValueChange={setSelectedOfficer}
                    placeholder="All officers"
                    searchPlaceholder="Search officers..."
                    className="text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <Label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700"
                  >
                    Verification Status
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
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
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="branchName">Branch</SelectItem>
                        <SelectItem value="creditOfficerName">
                          Officer
                        </SelectItem>
                        <SelectItem value="registrationDate">
                          Registration Date
                        </SelectItem>
                        <SelectItem value="verificationStatus">
                          Verification Status
                        </SelectItem>
                        <SelectItem value="loanCount">Loan Count</SelectItem>
                        <SelectItem value="lastActivity">
                          Last Activity
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
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">
                        {getActiveFiltersCount()} filter
                        {getActiveFiltersCount() !== 1 ? "s" : ""} applied
                      </span>
                    </div>
                    <div className="text-sm text-emerald-600">
                      Showing {customers.length} of {stats.totalCustomers}{" "}
                      customers
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="w-4 h-4 mr-1" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    {Object.entries(visibleCols).map(([key, visible]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={visible}
                          onChange={() =>
                            toggleColumnVisibility(
                              key as keyof typeof visibleCols
                            )
                          }
                          className="rounded"
                        />
                        <Label htmlFor={key} className="text-sm">
                          {key.charAt(0).toUpperCase() +
                            key.slice(1).replace(/([A-Z])/g, " $1")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="pageSize" className="text-sm text-gray-600">
                Rows per page:
              </Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table - Always visible across sizes */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleCols.name && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Customer Details</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.email && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Email</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.phone && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Phone</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.branch && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Branch</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.creditOfficer && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Credit Officer</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.registrationDate && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Registered</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.verificationStatus && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Status</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.loanCount && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Loans</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.lastActivity && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Last Activity</span>
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.action && (
                      <TableHead className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={
                          Object.values(visibleCols).filter(Boolean).length
                        }
                        className="text-center py-12 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-gray-300" />
                          <div className="text-lg font-medium">
                            {loading
                              ? "Loading customers..."
                              : debouncedSearchTerm ||
                                getActiveFiltersCount() > 0
                              ? "No customers found matching your filters."
                              : "No customers found."}
                          </div>
                          <div className="text-sm text-gray-500">
                            {loading
                              ? "Please wait while we fetch customer data"
                              : debouncedSearchTerm ||
                                getActiveFiltersCount() > 0
                              ? "Try adjusting your search criteria or filters."
                              : "Get started by creating your first customer."}
                          </div>
                          {(debouncedSearchTerm ||
                            getActiveFiltersCount() > 0) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearAllFilters}
                              className="mt-2"
                            >
                              <FilterX className="w-4 h-4 mr-1" />
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-white transition-all duration-200 border-b border-gray-100"
                      >
                        {visibleCols.name && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="p-2 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg">
                                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                                    {customer.name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/dashboard/business-management/customer/${customer.id}`}
                                  className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors block truncate"
                                >
                                  {customer.name}
                                </Link>
                                <div className="text-xs text-gray-500 font-mono truncate">
                                  ID: {customer.id}
                                </div>
                                <div className="sm:hidden mt-1">
                                  {getVerificationBadge(
                                    customer.verificationStatus || "PENDING"
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.email && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                            <div className="text-sm text-emerald-600 font-medium">
                              {customer.email || "N/A"}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.phone && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.phone || "N/A"}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.branch && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-blue-100 rounded-full">
                                <Building2 className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {customer.branchName}
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.creditOfficer && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-purple-100 rounded-full">
                                <UserCheck className="w-3 h-3 text-purple-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {customer.creditOfficerName}
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.registrationDate && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.registrationDate
                                ? formatDate(customer.registrationDate)
                                : "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.registrationDate
                                ? getTimeAgo(customer.registrationDate)
                                : ""}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.registrationDate && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                            {getVerificationBadge(
                              customer.verificationStatus || "PENDING"
                            )}
                          </TableCell>
                        )}
                        {visibleCols.loanCount && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden md:table-cell">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-gray-900">
                                {customer.loanCount || 0}
                              </div>
                              <div className="text-xs text-gray-500">Loans</div>
                              {customer.totalLoanAmount && (
                                <div className="text-xs text-emerald-600 font-medium">
                                  ₦{customer.totalLoanAmount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.lastActivity && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.lastActivity
                                ? getTimeAgo(customer.lastActivity)
                                : "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.lastActivity
                                ? formatDate(customer.lastActivity)
                                : ""}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.action && (
                          <TableCell className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                              <Link
                                href={`/dashboard/business-management/customer/${customer.id}`}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg p-1.5 sm:p-2"
                                  title={`View details of ${customer.name}`}
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </Link>
                              <Link
                                href={`/dashboard/business-management/customer/${customer.id}/edit`}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-1.5 sm:p-2"
                                  title={`Edit ${customer.name}`}
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </Link>
                              {currentUser?.role === "ADMIN" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5 sm:p-2"
                                  title={`Delete ${customer.name}`}
                                  onClick={() =>
                                    setDeleteCustomerId(customer.id)
                                  }
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View removed as requested */}

          {/* Enhanced Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, pagination.totalItems)} of{" "}
                  {pagination.totalItems} customers
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
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
                          Math.ceil(pagination.totalItems / pageSize)
                        ),
                      },
                      (_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        const totalPages = Math.ceil(
                          pagination.totalItems / pageSize
                        );
                        if (pageNum > totalPages) return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(pageNum)}
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
                    onClick={goToNextPage}
                    disabled={
                      currentPage >= Math.ceil(pagination.totalItems / pageSize)
                    }
                    className="px-2 py-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={
                      currentPage >= Math.ceil(pagination.totalItems / pageSize)
                    }
                    className="px-2 py-1"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={deleteCustomerId !== null}
        title="Confirm Delete"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={() => {
          if (deleteCustomerId) {
            handleDelete(deleteCustomerId);
          }
        }}
        onCancel={() => setDeleteCustomerId(null)}
      />
    </>
  );
}
