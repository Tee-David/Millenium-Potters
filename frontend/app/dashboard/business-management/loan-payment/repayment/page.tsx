"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  Copy,
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  AlertCircle,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Smartphone,
  Building2,
  CreditCardIcon,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Columns,
  MoreHorizontal,
  X,
  RotateCcw,
  Save,
  Download,
  Upload,
  CalendarDays,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  Users,
  FilterX,
} from "lucide-react";
import { formatNaira } from "@/utils/currency";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  repaymentsApi,
  loansApi,
  usersApi,
  unionMembersApi,
  handleDatabaseError,
} from "@/lib/api";
import { toast } from "sonner";
import type { Repayment } from "@/types/repayment";
import { useAuth } from "@/hooks/useAuth";
import { StaffOnly } from "@/components/auth/RoleGuard";
import { SearchableSelect } from "@/components/SearchableSelect";

interface RepaymentWithDetails extends Repayment {
  // Override the loan property to match the actual API response
  loan?: {
    id: string;
    loanNumber: string;
    unionMember?: {
      id: string;
      code: string;
      firstName: string;
      lastName: string;
    };
  };
  receivedBy?: {
    id: string;
    email: string;
    role: string;
  };
}

interface CreateRepaymentData {
  loanId: string;
  amount: number;
  method: "CASH" | "TRANSFER" | "POS" | "MOBILE" | "USSD" | "OTHER";
  reference?: string;
  notes?: string;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "TRANSFER", label: "Bank Transfer" },
  { value: "POS", label: "POS" },
  { value: "MOBILE", label: "Mobile Money" },
  { value: "USSD", label: "USSD" },
  { value: "OTHER", label: "Other" },
];

// Payment method styling
const getPaymentMethodStyle = (method: string) => {
  const styles = {
    CASH: {
      variant: "default" as const,
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CreditCard,
    },
    TRANSFER: {
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Building2,
    },
    POS: {
      variant: "default" as const,
      className: "bg-purple-100 text-purple-800 border-purple-200",
      icon: CreditCardIcon,
    },
    MOBILE: {
      variant: "default" as const,
      className: "bg-orange-100 text-orange-800 border-orange-200",
      icon: Smartphone,
    },
    USSD: {
      variant: "default" as const,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Zap,
    },
    OTHER: {
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: CreditCard,
    },
  };
  return styles[method as keyof typeof styles] || styles.OTHER;
};

// Payment status logic
const getPaymentStatus = (repayment: RepaymentWithDetails) => {
  // For now, all payments are considered successful since they're recorded
  // In a real system, this would check payment gateway status
  const paymentDate = new Date(repayment.paidAt);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    return {
      status: "RECENT",
      label: "Recent",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock,
    };
  } else if (daysDiff <= 7) {
    return {
      status: "SUCCESSFUL",
      label: "Successful",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    };
  } else {
    return {
      status: "COMPLETED",
      label: "Completed",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: CheckCircle,
    };
  }
};

function RepaymentPageContent() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [repayments, setRepayments] = useState<RepaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Performance optimization: Memoize calculations
  const memoizedCalculations = useMemo(() => {
    return repayments.map((repayment) => ({
      id: repayment.id,
      formattedAmount: formatNaira(
        typeof repayment.amount === "string"
          ? parseFloat(repayment.amount)
          : repayment.amount
      ),
      formattedDate: new Date(repayment.paidAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      customerName: repayment.loan?.unionMember
        ? `${repayment.loan.unionMember.firstName} ${repayment.loan.unionMember.lastName}`
        : "N/A",
    }));
  }, [repayments]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Enhanced Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUnionMember, setSelectedUnionMember] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter presets
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

  // Debounce search term
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRepayment, setEditingRepayment] =
    useState<RepaymentWithDetails | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateRepaymentData>({
    loanId: "",
    amount: 0,
    method: "CASH",
    reference: "",
    notes: "",
  });

  // Available loans for selection
  const [availableLoans, setAvailableLoans] = useState<
    Array<{
      id: string;
      principalAmount: number;
      unionMember: { firstName: string; lastName: string };
    }>
  >([]);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    unionMember: true,
    amount: true,
    method: true,
    reference: true,
    receivedBy: true,
    date: true,
    status: true,
    actions: true,
  });

  // Pagination state
  const [pageSize, setPageSize] = useState(10);

  // Handle navigation to repayment details page
  const handleViewRepaymentDetails = (repaymentId: string) => {
    router.push(
      `/dashboard/business-management/loan-payment/repayment/${repaymentId}`
    );
  };

  // Optimized load repayments with better error handling
  const loadRepayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        method: selectedMethod === "all" ? undefined : selectedMethod,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const response = await repaymentsApi.getAll(params);
      const responseData = response.data;

      // Handle the actual API response structure with validation
      let repaymentsData: any[] = [];
      let paginationData: any = {};

      if (responseData.success && responseData.data) {
        repaymentsData = Array.isArray(responseData.data)
          ? responseData.data
          : [];
        paginationData = responseData.pagination || {};
      } else if (Array.isArray(responseData)) {
        repaymentsData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        repaymentsData = responseData.data;
        paginationData = responseData.pagination || {};
      }

      // Validate and sanitize data
      const validatedData = repaymentsData.filter(
        (item: any) =>
          item &&
          item.id &&
          item.loanId &&
          (typeof item.amount === "number" ||
            typeof item.amount === "string") &&
          item.paidAt &&
          !isNaN(new Date(item.paidAt).getTime())
      );

      setRepayments(validatedData);
      setTotalPages(
        paginationData.totalPages || Math.ceil(validatedData.length / pageSize)
      );
      setTotalItems(paginationData.total || validatedData.length);
    } catch (err: any) {
      console.error("Failed to load repayments:", err);

      // Enhanced error handling
      if (
        handleDatabaseError(
          err,
          "Failed to load repayments due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      setError(err.response?.data?.message || "Failed to load repayments");
      toast.error("Failed to load repayments");
      setRepayments([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedMethod, dateFrom, dateTo]);

  // Load available loans
  const loadAvailableLoans = async () => {
    try {
      const response = await loansApi.getAll({ status: "ACTIVE" });
      const loansData =
        response.data.data?.loans ||
        response.data.loans ||
        response.data.data ||
        response.data ||
        [];
      setAvailableLoans(Array.isArray(loansData) ? loansData : []);
    } catch (err: any) {
      console.error("Failed to load loans:", err);
      handleDatabaseError(
        err,
        "Failed to load available loans due to database connection issues. Please try again."
      );
    }
  };

  useEffect(() => {
    loadRepayments();
  }, [
    currentPage,
    selectedMethod,
    dateFrom,
    dateTo,
    pageSize,
    amountFrom,
    amountTo,
    selectedStatus,
    selectedUnionMember,
    sortBy,
    sortOrder,
    debouncedSearchTerm,
  ]);

  useEffect(() => {
    loadAvailableLoans();
  }, []);

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

  // Enhanced filtering and sorting
  const filteredRepayments = useMemo(() => {
    let filtered = [...repayments];

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter((repayment) => {
        const customerName = repayment.loan?.unionMember
          ? `${repayment.loan.unionMember.firstName} ${repayment.loan.unionMember.lastName}`
          : "";
        const receivedBy = repayment.receivedBy?.email || "";
        const loanId = repayment.loanId || "";
        const reference = repayment.reference || "";
        const amount = formatNaira(Number(repayment.amount));

        const searchLower = debouncedSearchTerm.toLowerCase();
        return (
          customerName.toLowerCase().includes(searchLower) ||
          receivedBy.toLowerCase().includes(searchLower) ||
          loanId.toLowerCase().includes(searchLower) ||
          reference.toLowerCase().includes(searchLower) ||
          amount.toLowerCase().includes(searchLower)
        );
      });
    }

    // Method filter
    if (selectedMethod !== "all") {
      filtered = filtered.filter(
        (repayment) => repayment.method === selectedMethod
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((repayment) => {
        const paymentDate = new Date(repayment.paidAt);
        const fromDate = new Date(dateFrom);
        return paymentDate >= fromDate;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((repayment) => {
        const paymentDate = new Date(repayment.paidAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire day
        return paymentDate <= toDate;
      });
    }

    // Amount range filter
    if (amountFrom) {
      filtered = filtered.filter(
        (repayment) => Number(repayment.amount) >= Number(amountFrom)
      );
    }

    if (amountTo) {
      filtered = filtered.filter(
        (repayment) => Number(repayment.amount) <= Number(amountTo)
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((repayment) => {
        const statusInfo = getPaymentStatus(repayment);
        return statusInfo.status === selectedStatus;
      });
    }

    // Union member filter
    if (selectedUnionMember !== "all") {
      filtered = filtered.filter(
        (repayment) => repayment.loan?.unionMember?.id === selectedUnionMember
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.paidAt).getTime();
          bValue = new Date(b.paidAt).getTime();
          break;
        case "amount":
          aValue = Number(a.amount);
          bValue = Number(b.amount);
          break;
        case "customer":
          aValue = a.loan?.unionMember
            ? `${a.loan.unionMember.firstName} ${a.loan.unionMember.lastName}`
            : "";
          bValue = b.loan?.unionMember
            ? `${b.loan.unionMember.firstName} ${b.loan.unionMember.lastName}`
            : "";
          break;
        case "method":
          aValue = a.method;
          bValue = b.method;
          break;
        default:
          aValue = new Date(a.paidAt).getTime();
          bValue = new Date(b.paidAt).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    repayments,
    debouncedSearchTerm,
    selectedMethod,
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
    selectedStatus,
    selectedUnionMember,
    sortBy,
    sortOrder,
  ]);

  // Filter management functions
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedMethod("all");
    setDateFrom("");
    setDateTo("");
    setAmountFrom("");
    setAmountTo("");
    setSelectedStatus("all");
    setSelectedUnionMember("all");
    setSortBy("date");
    setSortOrder("desc");
  }, []);

  const applyFilterPreset = useCallback((preset: any) => {
    setDateFrom(preset.filters.dateFrom || "");
    setDateTo(preset.filters.dateTo || "");
    toast.success(`Applied ${preset.name} filter`);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedMethod !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (amountFrom) count++;
    if (amountTo) count++;
    if (selectedStatus !== "all") count++;
    if (selectedUnionMember !== "all") count++;
    return count;
  }, [
    searchTerm,
    selectedMethod,
    dateFrom,
    dateTo,
    amountFrom,
    amountTo,
    selectedStatus,
    selectedUnionMember,
  ]);

  // Get unique union members for filter
  const uniqueUnionMembers = useMemo(() => {
    const members = repayments
      .map((r) => r.loan?.unionMember)
      .filter(Boolean)
      .map((m) => ({
        value: m!.id,
        label: `${m!.firstName} ${m!.lastName}`,
      }));

    // Remove duplicates
    const unique = members.filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.value === member.value)
    );

    return unique;
  }, [repayments]);

  // Optimized handle create repayment with validation
  const handleCreateRepayment = async () => {
    if (!formData.loanId || !formData.amount || formData.amount <= 0) {
      toast.error("Please fill in all required fields with valid values");
      return;
    }

    setLoading(true);
    try {
      // Add validation for amount
      if (isNaN(formData.amount) || formData.amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Generate unique reference if not provided
      const paymentData = {
        ...formData,
        reference:
          formData.reference ||
          `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      await repaymentsApi.create(paymentData);
      toast.success("Repayment recorded successfully");
      setIsCreateModalOpen(false);
      resetForm();
      loadRepayments();
    } catch (err: any) {
      console.error("Payment creation failed:", err);
      const errorMessage = handleDatabaseError(err);
      toast.error(errorMessage || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  // Handle update repayment
  const handleUpdateRepayment = async () => {
    if (!editingRepayment) return;

    setLoading(true);
    try {
      await repaymentsApi.update(editingRepayment.id, formData);
      toast.success("Repayment updated successfully");
      setIsEditModalOpen(false);
      setEditingRepayment(null);
      resetForm();
      loadRepayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete repayment
  const handleDeleteRepayment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this repayment?")) return;

    setLoading(true);
    try {
      await repaymentsApi.remove(id);
      toast.success("Repayment deleted successfully");
      loadRepayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      loanId: "",
      amount: 0,
      method: "CASH",
      reference: "",
      notes: "",
    });
  };

  // Open edit modal
  const openEditModal = (repayment: RepaymentWithDetails) => {
    setEditingRepayment(repayment);
    setFormData({
      loanId: repayment.loanId,
      amount: Number(repayment.amount),
      method: repayment.method,
      reference: repayment.reference || "",
      notes: repayment.notes || "",
    });
    setIsEditModalOpen(true);
  };

  // Export functions
  const exportToExcel = () => {
    const exportData = filteredRepayments.map((repayment) => ({
      "Loan ID": repayment.loanId,
      "Union Member": repayment.loan?.unionMember
        ? `${repayment.loan.unionMember.firstName} ${repayment.loan.unionMember.lastName}`
        : "N/A",
      Amount: Number(repayment.amount),
      Method: repayment.method,
      Reference: repayment.reference || "",
      "Received By": repayment.receivedBy?.email || "",
      Date: new Date(repayment.paidAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      Notes: repayment.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Repayments");
    XLSX.writeFile(wb, "repayments.xlsx");
    toast.success("Exported to Excel successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Repayments Report", 20, 20);

    const tableData = filteredRepayments.map((repayment) => [
      repayment.loanId,
      repayment.loan?.unionMember
        ? `${repayment.loan.unionMember.firstName} ${repayment.loan.unionMember.lastName}`
        : "N/A",
      formatNaira(Number(repayment.amount)),
      repayment.method,
      repayment.reference || "",
      new Date(repayment.paidAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    ]);

    (doc as any).autoTable({
      head: [
        ["Loan ID", "Union Member", "Amount", "Method", "Reference", "Date"],
      ],
      body: tableData,
      startY: 30,
    });

    doc.save("repayments.pdf");
    toast.success("Exported to PDF successfully");
  };

  const copyToClipboard = () => {
    const text = filteredRepayments
      .map((repayment) => {
        const member = repayment.loan?.unionMember
          ? `${repayment.loan.unionMember.firstName} ${repayment.loan.unionMember.lastName}`
          : "N/A";
        return `${repayment.loanId}\t${member}\t${formatNaira(
          Number(repayment.amount)
        )}\t${repayment.method}\t${repayment.reference || ""}\t${new Date(
          repayment.paidAt
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard successfully");
  };

  // Error boundary for component errors
  if (error && repayments.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="bg-white rounded-xl shadow-xl border border-red-200 p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              loadRepayments();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading && repayments.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading repayments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Mobile-optimized header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Loan Repayments
                </h1>
                <div className="flex gap-2">
                  {currentUser?.role === "SUPERVISOR" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 w-fit"
                    >
                      <Shield className="h-3 w-3" />
                      Supervisor View
                    </Badge>
                  )}
                  {currentUser?.role === "CREDIT_OFFICER" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 w-fit"
                    >
                      <Shield className="h-3 w-3" />
                      Union Loans
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                {currentUser?.role === "SUPERVISOR"
                  ? "Manage and track loan repayments for your supervised unions"
                  : currentUser?.role === "CREDIT_OFFICER"
                  ? "Manage and track repayments for your union loans"
                  : "Manage and track loan repayments"}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Total Repayments
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {totalItems}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-emerald-600 font-medium">
                    All Time
                  </div>
                  <div className="text-xs text-gray-500">Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      This Month
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {
                        repayments.filter((r) => {
                          const paymentDate = new Date(r.paidAt);
                          const currentDate = new Date();
                          return (
                            paymentDate.getMonth() === currentDate.getMonth() &&
                            paymentDate.getFullYear() ===
                              currentDate.getFullYear()
                          );
                        }).length
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-blue-600 font-medium">
                    {new Date().toLocaleDateString("en-GB", { month: "short" })}
                  </div>
                  <div className="text-xs text-gray-500">2025</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-base md:text-lg">
                      ₦
                    </span>
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Total Amount
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {formatNaira(
                        repayments.reduce((sum, r) => sum + Number(r.amount), 0)
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-green-600 font-medium">NGN</div>
                  <div className="text-xs text-gray-500">Currency</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  <div className="ml-3 md:ml-4">
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      Average Payment
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {formatNaira(
                        repayments.length > 0
                          ? repayments.reduce(
                              (sum, r) => sum + Number(r.amount),
                              0
                            ) / repayments.length
                          : 0
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-purple-600 font-medium">
                    Per Payment
                  </div>
                  <div className="text-xs text-gray-500">Average</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise-Level Filters */}
        {/* Enhanced Filters Section */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Advanced Search & Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-100 text-blue-800"
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
                    className="text-xs hover:bg-blue-50 hover:border-blue-200"
                  >
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Main Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700"
                >
                  Search Repayments
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by union member, reference, amount, loan ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
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

              {/* Payment Method */}
              <div>
                <Label
                  htmlFor="method"
                  className="text-sm font-medium text-gray-700"
                >
                  Payment Method
                </Label>
                <Select
                  value={selectedMethod}
                  onValueChange={setSelectedMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700"
                >
                  Payment Status
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
                    <SelectItem value="RECENT">Recent</SelectItem>
                    <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
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

              {/* Amount Range */}
              <div>
                <Label
                  htmlFor="amountFrom"
                  className="text-sm font-medium text-gray-700"
                >
                  Min Amount (₦)
                </Label>
                <Input
                  id="amountFrom"
                  type="number"
                  placeholder="0"
                  value={amountFrom}
                  onChange={(e) => setAmountFrom(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label
                  htmlFor="amountTo"
                  className="text-sm font-medium text-gray-700"
                >
                  Max Amount (₦)
                </Label>
                <Input
                  id="amountTo"
                  type="number"
                  placeholder="No limit"
                  value={amountTo}
                  onChange={(e) => setAmountTo(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Customer */}
              <div>
                <Label
                  htmlFor="unionMember"
                  className="text-sm font-medium text-gray-700"
                >
                  Union Member
                </Label>
                <SearchableSelect
                  options={[
                    { value: "all", label: "All union members" },
                    ...uniqueUnionMembers,
                  ]}
                  value={selectedUnionMember}
                  onValueChange={setSelectedUnionMember}
                  placeholder="All union members"
                  searchPlaceholder="Search union members..."
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
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="customer">Union Member</SelectItem>
                      <SelectItem value="method">Method</SelectItem>
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
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {getActiveFiltersCount()} filter
                      {getActiveFiltersCount() !== 1 ? "s" : ""} applied
                    </span>
                  </div>
                  <div className="text-sm text-blue-600">
                    Showing {filteredRepayments.length} of {repayments.length}{" "}
                    repayments
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="flex-1 sm:flex-none h-10 sm:h-9"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Excel</span>
              <span className="sm:hidden">XLS</span>
            </Button>
            <Button
              variant="outline"
              onClick={exportToPDF}
              className="flex-1 sm:flex-none h-10 sm:h-9"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex-1 sm:flex-none h-10 sm:h-9"
            >
              <Copy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Copy</span>
              <span className="sm:hidden">Copy</span>
            </Button>
          </div>
        </div>

        {/* Repayments Table */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
              Repayments ({totalItems})
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all loan repayment records
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Error Loading Data
                  </h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredRepayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No Repayments Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {getActiveFiltersCount() > 0
                      ? "No repayments match your current filters. Try adjusting your search criteria or clear filters to see all repayments."
                      : "No repayment records have been created yet."}
                  </p>
                  {getActiveFiltersCount() > 0 && (
                    <Button
                      onClick={clearAllFilters}
                      variant="outline"
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <FilterX className="w-4 h-4 mr-1" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Table Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Columns className="w-4 h-4 mr-2" />
                          Columns
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-900 mb-2">
                            Show/Hide Columns
                          </h4>
                          {Object.entries(columnVisibility).map(
                            ([key, visible]) => (
                              <label
                                key={key}
                                className="flex items-center space-x-2 text-sm cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visible}
                                  onChange={(e) => {
                                    setColumnVisibility((prev) => ({
                                      ...prev,
                                      [key]: e.target.checked,
                                    }));
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="capitalize text-gray-700">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">
                      Rows per page:
                    </span>
                    <span className="text-sm text-gray-600 sm:hidden">
                      Per page:
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1); // Reset to first page when changing page size
                      }}
                    >
                      <SelectTrigger className="w-16 sm:w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Responsive Table View - Works on All Screen Sizes */}
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columnVisibility.unionMember && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Union Member
                          </th>
                        )}
                        {columnVisibility.amount && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        )}
                        {columnVisibility.method && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                        )}
                        {columnVisibility.reference && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference
                          </th>
                        )}
                        {columnVisibility.receivedBy && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Received By
                          </th>
                        )}
                        {columnVisibility.date && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        )}
                        {columnVisibility.status && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        )}
                        {columnVisibility.actions && (
                          <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(filteredRepayments || []).map((repayment) => (
                        <tr
                          key={repayment.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {columnVisibility.unionMember && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {repayment.loan?.unionMember
                                    ? `${repayment.loan.unionMember.firstName} ${repayment.loan.unionMember.lastName}`
                                    : "N/A"}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 truncate">
                                  Loan: {repayment.loanId}
                                </div>
                              </div>
                            </td>
                          )}
                          {columnVisibility.amount && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {formatNaira(Number(repayment.amount))}
                              </div>
                            </td>
                          )}
                          {columnVisibility.method && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              {(() => {
                                const methodStyle = getPaymentMethodStyle(
                                  repayment.method
                                );
                                const IconComponent = methodStyle.icon;
                                return (
                                  <Badge
                                    variant={methodStyle.variant}
                                    className={`${methodStyle.className} text-xs`}
                                  >
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      {repayment.method}
                                    </span>
                                    <span className="sm:hidden">
                                      {repayment.method.charAt(0)}
                                    </span>
                                  </Badge>
                                );
                              })()}
                            </td>
                          )}
                          {columnVisibility.reference && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                {repayment.reference || "-"}
                              </div>
                            </td>
                          )}
                          {columnVisibility.receivedBy && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[100px] sm:max-w-none">
                                {repayment.receivedBy?.email || "-"}
                              </div>
                            </td>
                          )}
                          {columnVisibility.date && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                <div className="font-medium">
                                  {new Date(
                                    repayment.paidAt
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-gray-500 hidden sm:block">
                                  {new Date(
                                    repayment.paidAt
                                  ).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </td>
                          )}
                          {columnVisibility.status && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              {(() => {
                                const statusInfo = getPaymentStatus(repayment);
                                const IconComponent = statusInfo.icon;
                                return (
                                  <Badge
                                    variant="default"
                                    className={`${statusInfo.className} text-xs`}
                                  >
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      {statusInfo.label}
                                    </span>
                                    <span className="sm:hidden">
                                      {statusInfo.label.charAt(0)}
                                    </span>
                                  </Badge>
                                );
                              })()}
                            </td>
                          )}
                          {columnVisibility.actions && (
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="flex space-x-1 sm:space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleViewRepaymentDetails(repayment.id)
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 sm:p-2"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Enhanced Pagination */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 md:px-6 py-4 sm:py-6 border-t border-gray-200 gap-4 bg-gray-50 rounded-b-lg">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
                  results
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                  {/* Mobile: Simplified pagination */}
                  <div className="flex items-center gap-1 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Desktop: Full pagination */}
                  <div className="hidden sm:flex items-center gap-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>

                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(
                          1,
                          currentPage - Math.floor(maxVisiblePages / 2)
                        );
                        let endPage = Math.min(
                          totalPages,
                          startPage + maxVisiblePages - 1
                        );

                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(
                            1,
                            endPage - maxVisiblePages + 1
                          );
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={
                                i === currentPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className={`w-8 h-8 p-0 ${
                                i === currentPage
                                  ? "bg-blue-600 text-white"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>

                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Go to Page - Desktop only */}
                  <div className="hidden lg:flex items-center gap-2">
                    <span className="text-sm text-gray-600">Go to:</span>
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 h-8 text-center text-sm"
                    />
                    <span className="text-sm text-gray-600">
                      of {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Repayment Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="loanId">Loan</Label>
                <Select
                  value={formData.loanId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, loanId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLoans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.unionMember.firstName} {loan.unionMember.lastName}{" "}
                        - {formatNaira(loan.principalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="Transaction reference"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRepayment} disabled={loading}>
                  {loading ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Repayment Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="edit-method">Payment Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-reference">Reference</Label>
                <Input
                  id="edit-reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="Transaction reference"
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateRepayment} disabled={loading}>
                  {loading ? "Updating..." : "Update Payment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function RepaymentPage() {
  return (
    <StaffOnly>
      <RepaymentPageContent />
    </StaffOnly>
  );
}
