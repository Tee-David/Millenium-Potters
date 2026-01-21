"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  Eye,
  Download,
  Copy,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  Building,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Plus,
  Shield,
  Clock,
  AlertTriangle,
  X,
  Save,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { format, startOfDay, endOfDay, isAfter, startOfToday } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  repaymentsApi,
  loansApi,
  usersApi,
  unionsApi,
  handleDatabaseError,
} from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RepaymentSchedule {
  id: string;
  loanId: string;
  sequence: number;
  dueDate: string;
  principalDue: string | number;
  interestDue: string | number;
  feeDue: string | number;
  totalDue: string | number;
  paidAmount: string | number;
  status:
    | "PENDING"
    | "PARTIAL"
    | "PAID"
    | "OVERDUE"
    | "UNDER_REPAYMENT"
    | "FULLY_PAID";
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  loan: {
    id: string;
    loanNumber: string;
    unionMemberId: string;
    unionId: string;
    loanTypeId: string;
    principalAmount: string | number;
    currencyCode: string;
    termCount: number;
    termUnit: "DAY" | "WEEK" | "MONTH";
    startDate: string;
    endDate: string;
    processingFeeAmount: string | number;
    processingFeeCollected: boolean;
    penaltyFeePerDayAmount: string | number;
    status: string;
    disbursedAt?: string;
    closedAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    unionMember: {
      id: string;
      firstName: string;
      lastName: string;
      code: string;
    };
    union: {
      id: string;
      name: string;
    };
    assignedOfficer?: {
      id: string;
      name: string;
      email: string;
    };
    // Calculated fields from backend
    totalPaid?: number;
    totalOutstanding?: number;
  };
}

// Safe number parsing to avoid NaN issues
const safeParseNumber = (value: string | number | undefined | null): number => {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const calculateDaysRemaining = (deadline: string): number => {
  const now = new Date();
  const end = new Date(deadline);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const calculateDailyRepaymentAmount = (
  loan: RepaymentSchedule["loan"]
): number => {
  try {
    if (!loan) return 0;

    const safePrincipalAmount = safeParseNumber(loan.principalAmount);
    const termCount = loan.termCount || 1;
    const termUnit = loan.termUnit || "DAY";

    // Calculate total days based on term
    let totalDays = termCount;
    if (termUnit === "WEEK") {
      totalDays = termCount * 7;
    } else if (termUnit === "MONTH") {
      totalDays = termCount * 30;
    }

    // Avoid division by zero
    if (totalDays === 0) return safePrincipalAmount;

    const dailyPrincipal = safePrincipalAmount / totalDays;

    // For now, we'll use the daily principal as the daily due amount
    // This can be enhanced later to include interest calculations if needed
    return Math.round(dailyPrincipal);
  } catch (error) {
    console.error("Error calculating daily repayment amount:", error);
    return 0;
  }
};

// Memoized calculation function for better performance with NaN protection
const calculateLoanMetrics = (
  loan: RepaymentSchedule["loan"],
  paidAmount: string | number
) => {
  // Validate inputs and provide defaults using safe parsing
  // Use loan.totalPaid (sum of all schedule items) if available, otherwise fallback to individual paidAmount
  const safePaidAmount = loan?.totalPaid !== undefined
    ? safeParseNumber(loan.totalPaid)
    : safeParseNumber(paidAmount);
  const safePrincipalAmount = safeParseNumber(loan?.principalAmount);
  const safePenaltyFeePerDay = safeParseNumber(loan?.penaltyFeePerDayAmount);
  const safeDeadline =
    loan?.endDate || loan?.startDate || new Date().toISOString();

  // Use loan.totalOutstanding if available (calculated by backend), otherwise calculate here
  const totalLeft = loan?.totalOutstanding !== undefined
    ? safeParseNumber(loan.totalOutstanding)
    : Math.max(0, safePrincipalAmount - safePaidAmount);
  const daysRemaining = calculateDaysRemaining(safeDeadline);

  // Calculate the proper daily repayment amount based on loan terms
  const dailyRepaymentAmount = calculateDailyRepaymentAmount(loan);

  // Debug logging for all calculations
  console.log("Loan Metrics Debug:", {
    loanNumber: loan?.loanNumber,
    safePrincipalAmount,
    safePaidAmount,
    totalLeft,
    loanTotalPaid: loan?.totalPaid,
    loanTotalOutstanding: loan?.totalOutstanding,
    dailyRepaymentAmount,
    termCount: loan?.termCount,
    termUnit: loan?.termUnit,
    safePenaltyFeePerDay,
    safeDeadline,
    daysRemaining,
    currentDate: new Date().toISOString(),
    deadlineDate: new Date(safeDeadline).toISOString(),
  });

  // Use the calculated daily repayment amount as "due today"
  // Only if there's still money left to pay and it's not overdue
  let dueToday = 0;
  if (totalLeft > 0) {
    if (daysRemaining >= 0) {
      // Use the daily repayment amount, but don't exceed total left
      dueToday = Math.min(dailyRepaymentAmount, totalLeft);
    } else {
      // If overdue, entire remaining amount is due
      dueToday = totalLeft;
    }
  }

  // Calculate penalty fee with NaN protection
  let penaltyFee = 0;

  // Penalty applies when:
  // 1. Loan is overdue (daysRemaining < 0) AND there's still amount left to pay
  if (daysRemaining < 0 && totalLeft > 0) {
    const overdueDays = Math.abs(daysRemaining);
    penaltyFee = overdueDays * safePenaltyFeePerDay;

    // Debug logging for penalty calculation
    console.log("Penalty Calculation Debug:", {
      daysRemaining,
      overdueDays,
      safePenaltyFeePerDay,
      totalLeft,
      penaltyFee,
      loanData: loan,
    });
  }

  // Ensure no NaN values
  dueToday = isNaN(dueToday) ? 0 : dueToday;
  penaltyFee = isNaN(penaltyFee) ? 0 : penaltyFee;

  let status: RepaymentSchedule["status"];
  if (totalLeft === 0) status = "FULLY_PAID";
  else if (daysRemaining < 0) status = "OVERDUE";
  else status = "UNDER_REPAYMENT";

  return {
    totalLeftToPay: totalLeft,
    dueToday,
    penaltyFee,
    daysRemaining,
    status,
  };
};

const getStatusBadge = (status: RepaymentSchedule["status"]) => {
  switch (status) {
    case "PAID":
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    case "PARTIAL":
      return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    case "OVERDUE":
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    case "UNDER_REPAYMENT":
      return (
        <Badge className="bg-blue-100 text-blue-800">Under Repayment</Badge>
      );
    case "FULLY_PAID":
      return <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>;
    case "PENDING":
    default:
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
  }
};

export default function RepaymentSchedulePage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<RepaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Performance optimization: Memoize expensive calculations
  const memoizedCalculations = useMemo(() => {
    return data.map((item) => ({
      id: item.id,
      metrics: calculateLoanMetrics(item.loan, item.paidAmount),
    }));
  }, [data]);

  // Filters
  const [selectedCreditOfficer, setSelectedCreditOfficer] =
    useState<string>("");
  const [selectedUnion, setSelectedUnion] = useState<string>("");
  const [selectedLoan, setSelectedLoan] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    { from?: Date; to?: Date } | undefined
  >(undefined);
  const [singleDate, setSingleDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [amountTo, setAmountTo] = useState<string>("");

  // Filter mode controls
  const [showTodayOnly, setShowTodayOnly] = useState<boolean>(false); // Default to show all schedules
  const [filterMode, setFilterMode] = useState<"all" | "today" | "single" | "range">(
    "all"
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    dueDate: true,
    loanNumber: true,
    unionMember: true,
    creditOfficer: true,
    union: true,
    principal: true,
    processingFee: true,
    totalLeft: true,
    dueToday: true,
    status: true,
    actions: true,
  });

  const columnLabels: Record<keyof typeof visibleColumns, string> = {
    dueDate: "Due Date",
    loanNumber: "Loan #",
    unionMember: "Union Member",
    creditOfficer: "Credit Officer",
    union: "Union",
    principal: "Principal",
    processingFee: "Processing Fee",
    totalLeft: "Total Left",
    dueToday: "Due Today",
    status: "Status",
    actions: "Actions",
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  // Modals
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    loanData?: RepaymentSchedule;
    paymentType?: "due_today" | "custom";
    amount?: number;
  }>({ isOpen: false });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    notes: "",
  });

  const [paymentErrors, setPaymentErrors] = useState<{
    amount?: string;
    method?: string;
  }>({});

  // Master data
  const [creditOfficers, setCreditOfficers] = useState<any[]>([]);
  const [unions, setUnions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);

  // Responsive calendar months
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Admin controls
  const [isGeneratingSchedules, setIsGeneratingSchedules] = useState(false);
  const handlePayDueToday = (item: RepaymentSchedule, amount: number) => {
    openPaymentModal(item, "due_today", amount);
  };

  const handlePayCustomAmount = (item: RepaymentSchedule) => {
    openPaymentModal(item, "custom");
  };

  // Optimized payment validation with memoization
  const validatePaymentForm = useMemo(() => {
    return () => {
      const errors: { amount?: string; method?: string } = {};

      if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
        errors.amount = "Please enter a valid payment amount";
      } else if (paymentModal.loanData) {
        const metrics = calculateLoanMetrics(
          paymentModal.loanData.loan,
          paymentModal.loanData.paidAmount
        );
        if (parseFloat(paymentForm.amount) > metrics.totalLeftToPay) {
          errors.amount = `Amount cannot exceed total left to pay (${formatCurrency(
            metrics.totalLeftToPay
          )})`;
        }
      }

      if (!paymentForm.method) {
        errors.method = "Please select a payment method";
      }

      setPaymentErrors(errors);
      return Object.keys(errors).length === 0;
    };
  }, [paymentForm.amount, paymentForm.method, paymentModal.loanData]);

  const processPayment = async () => {
    if (!paymentModal.loanData || !validatePaymentForm()) return;

    try {
      setLoading(true);

      const amount = parseFloat(paymentForm.amount);

      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Create payment record with validation
      const paymentData = {
        loanId: paymentModal.loanData.loanId,
        amount: amount,
        method: paymentForm.method.toUpperCase() as
          | "CASH"
          | "TRANSFER"
          | "POS"
          | "MOBILE"
          | "USSD"
          | "OTHER",
        reference: `PAY-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        notes:
          paymentForm.notes ||
          `Payment via ${paymentForm.method} - ${
            paymentModal.paymentType === "due_today"
              ? "Due Today"
              : "Custom Amount"
          }`,
        // Include schedule item ID to ensure payment is allocated to this specific schedule
        scheduleItemId: paymentModal.loanData.id,
      };

      // Call repayment API
      const response = await repaymentsApi.create(paymentData);

      if (response.data?.success || response.status === 200) {
        toast.success(
          `Payment of ${formatCurrency(amount)} processed successfully!`
        );
        setPaymentModal({ isOpen: false });
        setPaymentForm({ amount: "", method: "cash", notes: "" });
        setPaymentErrors({});

        // Refresh data
        await loadRepaymentSchedules();
      } else {
        throw new Error(response.data?.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      const errorMessage = handleDatabaseError(error);
      toast.error(`Payment failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Optimized payment modal opener with validation
  const openPaymentModal = useMemo(() => {
    return (
      item: RepaymentSchedule,
      type: "due_today" | "custom",
      amount?: number
    ) => {
      // Validate item data
      if (!item || !item.loan || !item.loan.unionMember) {
        toast.error("Invalid loan data");
        return;
      }

      const initialAmount =
        type === "due_today" ? amount?.toString() || "" : "";
      setPaymentForm({
        amount: initialAmount,
        method: "cash",
        notes: "",
      });
      setPaymentErrors({});
      setPaymentModal({
        isOpen: true,
        loanData: item,
        paymentType: type,
        amount: amount,
      });
    };
  }, []);

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [officersResponse, unionsResponse, loansResponse] =
          await Promise.all([
            usersApi.getAll({ role: "CREDIT_OFFICER", limit: 1000 }),
            unionsApi.getAll({ limit: 1000 }),
            loansApi.getAll({ limit: 1000 }),
          ]);

        const officersData = officersResponse.data.success
          ? officersResponse.data.data?.users ||
            officersResponse.data.data ||
            []
          : officersResponse.data.data?.users ||
            officersResponse.data.users ||
            officersResponse.data.data ||
            officersResponse.data ||
            [];

        const unionsData = unionsResponse.data;
        const unions = unionsData.success
          ? unionsData.data
          : unionsData.data || unionsData || [];

        const loansData = loansResponse.data.success
          ? loansResponse.data.data || []
          : loansResponse.data.data?.loans ||
            loansResponse.data.loans ||
            loansResponse.data.data ||
            loansResponse.data ||
            [];

        // Filter to only show approved loans
        const approvedLoans = loansData.filter(
          (loan: any) => loan.status === "APPROVED" || loan.status === "ACTIVE"
        );

        setCreditOfficers(Array.isArray(officersData) ? officersData : []);
        setUnions(Array.isArray(unions) ? unions : []);
        setLoans(Array.isArray(approvedLoans) ? approvedLoans : []);
      } catch (error) {
        console.error("Failed to load master data:", error);
        handleDatabaseError(
          error,
          "Failed to load master data due to database connection issues. Please try again."
        );
      }
    };

    loadMasterData();
  }, []);

  // Load repayment schedules
  const loadRepaymentSchedules = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage, // Use configurable items per page
      };

      // Only send parameters that the backend supports
      if (selectedLoan) params.loanId = selectedLoan;
      if (statusFilter) params.status = statusFilter;

      // For "All Schedules" mode, don't send date filters to get all data
      // Client-side filtering will handle the rest
      if (showTodayOnly) {
        // Send today's date for server-side filtering
        const today = new Date().toISOString().split("T")[0];
        params.dateFrom = today;
        params.dateTo = today;
      } else if (dateRange?.from && dateRange?.to) {
        params.dateFrom = dateRange.from.toISOString().split("T")[0];
        params.dateTo = dateRange.to.toISOString().split("T")[0];
      }

      // Note: unionId filtering will be handled client-side
      // as the backend doesn't support these parameters yet

      console.log("🚀 Starting API call to fetch repayment schedules...");
      console.log("📋 API Request params:", params);
      console.log("🔑 Current user:", currentUser);
      console.log("👤 User role:", currentUser?.role);
      // Note: Users don't have a direct unionId, but credit officers are assigned to unions
      console.log("🏢 User info:", {
        id: currentUser?.id,
        role: currentUser?.role,
      });

      const response = await repaymentsApi.getAllRepaymentSchedules(params);

      console.log("✅ API Response received!");
      console.log("📊 Raw API response:", response);
      console.log("📄 Response data:", response.data);
      console.log("⚡ Response status:", response.status);
      console.log("📝 Response headers:", response.headers);

      // The API returns: { success: true, data: [...], pagination: {...} }
      // So response.data is the API response object, not the schedules array
      const apiResponse = response.data;
      const rawSchedulesData = apiResponse.data || [];

      console.log("🔍 Raw schedules data extracted:", rawSchedulesData);
      console.log("📏 Number of schedules:", rawSchedulesData.length);
      console.log("🔢 Type of schedules data:", typeof rawSchedulesData);
      console.log("📚 Is array:", Array.isArray(rawSchedulesData));

      if (rawSchedulesData.length > 0) {
        console.log("📄 First schedule item:", rawSchedulesData[0]);
        console.log("🏦 First loan data:", rawSchedulesData[0]?.loan);
        console.log(
          "👤 First union member data:",
          rawSchedulesData[0]?.loan?.unionMember
        );
      }

      // Transform data to match expected format if needed
      const transformedData = Array.isArray(rawSchedulesData)
        ? rawSchedulesData.map((item: any) => ({
            ...item,
            // Ensure numeric fields are numbers
            principalDue:
              typeof item.principalDue === "string"
                ? parseFloat(item.principalDue)
                : item.principalDue,
            interestDue:
              typeof item.interestDue === "string"
                ? parseFloat(item.interestDue)
                : item.interestDue,
            totalDue:
              typeof item.totalDue === "string"
                ? parseFloat(item.totalDue)
                : item.totalDue,
            paidAmount:
              typeof item.paidAmount === "string"
                ? parseFloat(item.paidAmount)
                : item.paidAmount,
            // Ensure loan data is properly formatted
            loan: {
              ...item.loan,
              principalAmount:
                typeof item.loan?.principalAmount === "string"
                  ? parseFloat(item.loan.principalAmount)
                  : item.loan?.principalAmount,
              termCount:
                typeof item.loan?.termCount === "string"
                  ? parseInt(item.loan.termCount)
                  : item.loan?.termCount,
              processingFeeAmount:
                typeof item.loan?.processingFeeAmount === "string"
                  ? parseFloat(item.loan.processingFeeAmount)
                  : item.loan?.processingFeeAmount,
              penaltyFeePerDayAmount:
                typeof item.loan?.penaltyFeePerDayAmount === "string"
                  ? parseFloat(item.loan.penaltyFeePerDayAmount)
                  : item.loan?.penaltyFeePerDayAmount,
            },
          }))
        : [];

      console.log("🔍 Transformed data:", transformedData);
      console.log(
        "📊 Total items from API:",
        apiResponse.pagination?.total || 0
      );

      // Exclude completed/closed loans and paid/fully paid schedules from the dataset
      const baseData = transformedData.filter((item: any) => {
        const loanStatus = (item.loan?.status || "").toUpperCase();
        const scheduleStatus = (item.status || "").toUpperCase();
        const loanClosed = ["COMPLETED", "CLOSED", "FULLY_PAID"].includes(
          loanStatus
        );
        const schedulePaid = ["PAID", "FULLY_PAID"].includes(scheduleStatus);
        return !loanClosed && !schedulePaid;
      });

      console.log(
        "💾 Setting data state with filtered base data (no PAID/closed)..."
      );
      setData(baseData);

      // Use API pagination totals when available; fallback to client count
      const paginationData = apiResponse.pagination || {};
      const totalCount = Array.isArray(baseData) ? baseData.length : 0;
      setTotalItems(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
    } catch (error: any) {
      console.error("Failed to load repayment schedules:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      // Handle specific error cases
      if (error.response?.status === 500) {
        const errorMessage =
          error.response?.data?.message || "Internal server error";
        console.error("500 Error details:", errorMessage);

        // If it's a "Repayment not found" error, it might mean no schedules exist
        if (
          errorMessage.includes("Repayment not found") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("No repayment schedules") ||
          errorMessage.includes("Database query failed")
        ) {
          console.log("No repayment schedules found - setting empty data");
          console.log("This could mean:");
          console.log("1. No loans have been created yet");
          console.log("2. Loans exist but are not approved yet");
          console.log("3. Repayment schedules were not generated properly");
          console.log("4. There's a database issue");

          setData([]);
          setTotalItems(0);
          setTotalPages(0);
          setError(null); // Clear error since this is expected when no data exists
          return;
        }
      }

      // Handle 404 errors (not found) - treat as empty data
      if (error.response?.status === 404) {
        console.log(
          "404 Error - no repayment schedules found, setting empty data"
        );
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(null);
        return;
      }

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load repayment schedules due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // For any other error, still show empty state instead of error
      console.log(
        "Unknown error occurred - showing empty state instead of error"
      );
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [showTodayOnly, selectedLoan, statusFilter, dateRange]);

  useEffect(() => {
    loadRepaymentSchedules();
  }, [
    currentPage,
    selectedLoan,
    statusFilter,
    showTodayOnly,
    dateRange,
    // Note: Other filters like selectedCreditOfficer, selectedUnion,
    // amountFrom, amountTo, searchTerm are handled client-side in filteredData
    // so they don't need to trigger a new API call
  ]);

  // Keep pagination synced with client-side filters and page size
  // (effect moved below filteredData definition to avoid temporal dead zone)

  const handlePayment = async (amount: number, type: "due" | "custom") => {
    if (!paymentModal.loanData) return;

    try {
      const repaymentData = {
        loanId: paymentModal.loanData.loanId,
        amount: amount,
        method: "CASH" as const,
        notes: `Payment for schedule item ${paymentModal.loanData.sequence}`,
        // Include schedule item ID to ensure payment is allocated to this specific schedule
        scheduleItemId: paymentModal.loanData.id,
      };

      await repaymentsApi.create(repaymentData);
      toast.success("Payment recorded successfully");

      // Refresh data
      await loadRepaymentSchedules();

      // Close modal
      setPaymentModal({ isOpen: false });
    } catch (error: any) {
      console.error("Failed to record payment:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to record payment due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Fallback error handling
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const handleGenerateMissingSchedules = async () => {
    setIsGeneratingSchedules(true);
    try {
      console.log("Generating missing repayment schedules...");
      const response = await loansApi.generateMissingSchedules();

      const result = response.data.data || response.data;
      console.log("Schedule generation result:", result);
      console.log("Full response:", response);

      // Show success message with details
      const generatedCount = result.generatedCount || 0;
      const totalLoans = result.totalLoans || 0;
      const errorCount = result.errorCount || 0;

      toast.success(
        `Successfully generated ${generatedCount} missing schedules out of ${totalLoans} loans${
          errorCount > 0 ? ` (${errorCount} failed)` : ""
        }`,
        { duration: 5000 }
      );

      // Reload the repayment schedules data
      await loadRepaymentSchedules();
    } catch (error: any) {
      console.error("Failed to generate missing schedules:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to generate missing schedules due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      toast.error(
        error.response?.data?.message || "Failed to generate missing schedules"
      );
    } finally {
      setIsGeneratingSchedules(false);
    }
  };

  const filteredData = useMemo(() => {
    console.log("🔍 Running client-side filters...");
    console.log("📊 Initial data array length:", data.length);
    console.log("🎛️ Filters applied:", {
      showTodayOnly,
      searchTerm,
      selectedCreditOfficer,
      selectedUnion,
      statusFilter,
      dateRange,
      amountFrom,
      amountTo,
    });

    let filtered = data;

    // Apply today-only filter first - show schedules due today or overdue (but not paid)
    if (showTodayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      console.log(
        `📅 Applying today-only filter. Today: ${
          today.toISOString().split("T")[0]
        }`
      );

      const beforeTodayFilter = filtered.length;
      filtered = filtered.filter((item) => {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Show schedules that are due today or overdue (past due)
        // but NOT fully paid schedules
        const isPaid = item.status === "PAID";
        const isDueTodayOrOverdue = dueDate.getTime() <= today.getTime();

        // Include if due today/overdue AND not fully paid
        const shouldInclude = isDueTodayOrOverdue && !isPaid;

        if (shouldInclude) {
          console.log(
            `✅ INCLUDED: ${item.loan?.loanNumber} (seq: ${
              item.sequence
            }) due ${dueDate.toISOString().split("T")[0]} - status: ${
              item.status
            }`
          );
        }

        return shouldInclude;
      });

      console.log(
        `📅 Today-only filter: ${beforeTodayFilter} → ${filtered.length} items`
      );
    }
    // When showing all schedules, include everything (PAID, PENDING, PARTIAL, OVERDUE, etc.)

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.loan?.unionMember?.firstName
            ?.toLowerCase()
            .includes(lowerSearch) ||
          item.loan?.unionMember?.lastName
            ?.toLowerCase()
            .includes(lowerSearch) ||
          item.loan?.unionMember?.code?.toLowerCase().includes(lowerSearch) ||
          item.loan?.loanNumber?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply credit officer filter (client-side)
    if (selectedCreditOfficer) {
      filtered = filtered.filter(
        (item) => item.loan?.assignedOfficer?.id === selectedCreditOfficer
      );
    }

    // Apply union filter (client-side)
    if (selectedUnion) {
      filtered = filtered.filter(
        (item) => item.loan?.union?.id === selectedUnion
      );
    }

    // Apply status filter (limit to PENDING, PARTIAL, UNDER_REPAYMENT)
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    } else {
      filtered = filtered.filter((item) =>
        ["PENDING", "PARTIAL", "UNDER_REPAYMENT"].includes(
          (item.status || "").toUpperCase()
        )
      );
    }

    // Apply date range filter (only if not using today-only mode)
    if (!showTodayOnly && dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((item) => {
        const dueDate = new Date(item.dueDate);
        const fromDate = new Date(dateRange.from!);
        const toDate = new Date(dateRange.to!);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return dueDate >= fromDate && dueDate <= toDate;
      });
    }

    // Apply amount range filter
    if (amountFrom || amountTo) {
      filtered = filtered.filter((item) => {
        const metrics = calculateLoanMetrics(item.loan, item.paidAmount);
        const amount = metrics.dueToday;

        if (amountFrom && amount < parseFloat(amountFrom)) return false;
        if (amountTo && amount > parseFloat(amountTo)) return false;

        return true;
      });
    }

    console.log("🎯 Final filtered data:", filtered);
    console.log("📏 Final filtered count:", filtered.length);
    if (filtered.length > 0) {
      console.log("📄 First filtered item:", filtered[0]);
    }

    return filtered;
  }, [
    data,
    searchTerm,
    selectedCreditOfficer,
    selectedUnion,
    statusFilter,
    dateRange,
    amountFrom,
    amountTo,
    showTodayOnly,
  ]);

  const exportToExcel = (data: RepaymentSchedule[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        "Loan Number": item.loan?.loanNumber || "N/A",
        "Union Member": `${item.loan?.unionMember?.firstName || ""} ${
          item.loan?.unionMember?.lastName || ""
        }`,
        Code: item.loan?.unionMember?.code || "N/A",
        Union: item.loan?.union?.name || "N/A",
        "Due Date": formatDate(item.dueDate),
        "Principal Amount": item.principalDue,
        "Interest Amount": item.interestDue,
        "Total Due": item.totalDue,
        "Paid Amount": item.paidAmount,
        Status: item.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Repayment Schedules");
    XLSX.writeFile(workbook, "repayment-schedules.xlsx");
  };

  const exportToPDF = (data: RepaymentSchedule[]) => {
    const doc = new jsPDF();
    doc.text("Repayment Schedules Report", 14, 22);

    const tableData = data.map((item) => [
      item.loan?.loanNumber || "N/A",
      `${item.loan?.unionMember?.firstName || ""} ${
        item.loan?.unionMember?.lastName || ""
      }`,
      item.loan?.unionMember?.code || "N/A",
      formatDate(item.dueDate),
      formatCurrency(safeParseNumber(item.totalDue)),
      formatCurrency(safeParseNumber(item.paidAmount)),
      item.status,
    ]);

    (doc as any).autoTable({
      head: [
        [
          "Loan #",
          "Union Member",
          "Phone",
          "Due Date",
          "Total Due",
          "Paid",
          "Status",
        ],
      ],
      body: tableData,
      startY: 30,
    });

    doc.save("repayment-schedules.pdf");
  };

  const copyToClipboard = (data: RepaymentSchedule[]) => {
    const csvContent = [
      [
        "Loan Number",
        "Customer",
        "Phone",
        "Due Date",
        "Total Due",
        "Paid",
        "Status",
      ],
      ...data.map((item) => [
        item.loan?.loanNumber || "N/A",
        `${item.loan?.unionMember?.firstName || ""} ${
          item.loan?.unionMember?.lastName || ""
        }`,
        item.loan?.unionMember?.code || "N/A",
        formatDate(item.dueDate),
        formatCurrency(safeParseNumber(item.totalDue)),
        formatCurrency(safeParseNumber(item.paidAmount)),
        item.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    navigator.clipboard.writeText(csvContent);
    toast.success("Data copied to clipboard");
  };

  // Keep pagination synced with client-side filters and page size
  useEffect(() => {
    setTotalItems(filteredData.length);
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage) || 1);
    if ((currentPage - 1) * itemsPerPage >= filteredData.length) {
      setCurrentPage(1);
    }
  }, [filteredData, itemsPerPage]);

  const handleExport = (type: "excel" | "pdf" | "copy") => {
    switch (type) {
      case "excel":
        exportToExcel(filteredData);
        toast.success("Repayment schedules exported to Excel");
        break;
      case "pdf":
        exportToPDF(filteredData);
        toast.success("Repayment schedules exported to PDF");
        break;
      case "copy":
        copyToClipboard(filteredData);
        break;
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted-foreground">
              Loading repayment schedules...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="py-12">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No repayment schedules found
              </h2>
              <p className="text-gray-600">
                There are no repayment schedules to display. Please check your
                filters or try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Admin Tools Section */}
      {currentUser?.role === "ADMIN" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-amber-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Administrator Tools
              </h3>
              <p className="text-xs sm:text-sm text-amber-600 mt-1">
                Generate missing repayment schedules for existing loans
              </p>
            </div>
            <Button
              onClick={handleGenerateMissingSchedules}
              disabled={isGeneratingSchedules}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm"
            >
              {isGeneratingSchedules ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Missing Schedules
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Stats Cards - Using Filtered Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                Today's Schedules
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {filteredData.length}
              </p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium">
                Pending Payments
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {
                  filteredData.filter((item) => item.status === "PENDING")
                    .length
                }
              </p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm font-medium">
                Overdue
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {
                  filteredData.filter((item) => item.status === "OVERDUE")
                    .length
                }
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium">
                Total Amount Due
              </p>
              <p className="text-lg sm:text-2xl font-bold mt-1">
                ₦
                {filteredData
                  .reduce(
                    (sum, item) =>
                      sum +
                      (safeParseNumber(item.totalDue) -
                        safeParseNumber(item.paidAmount)),
                    0
                  )
                  .toLocaleString()}
              </p>
            </div>
            <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Enhanced Export Actions */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Export Options
            </h3>
            <span className="text-xs sm:text-sm text-gray-500">
              ({filteredData.length} records)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport("excel")}
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 text-xs sm:text-sm"
            >
              <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export to Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export to PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("copy")}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 text-xs sm:text-sm"
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Copy Data</span>
              <span className="sm:hidden">Copy</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats for Filtered Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Filtered Schedules
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {filteredData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Today's Due
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {filteredData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Overdue (Today)
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {
                    filteredData.filter((item) => item.status === "OVERDUE")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Amount Due
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  ₦
                  {filteredData
                    .reduce(
                      (sum, item) =>
                        sum +
                        (safeParseNumber(item.totalDue) -
                          safeParseNumber(item.paidAmount)),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise-Level Filters */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Filter className="w-6 h-6 text-purple-600" />
                </div>
                Advanced Filters
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Filter and search repayment schedules with precision
              </p>
            </div>

            {/* Filter Mode - Simplified & Clear */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <Button
                variant={filterMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterMode("all");
                  setShowTodayOnly(false);
                  setDateRange(undefined);
                }}
                className={`text-xs ${
                  filterMode === "all"
                    ? "bg-gray-700 hover:bg-gray-800 text-white"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                }`}
              >
                <Eye className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button
                variant={filterMode === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterMode("today");
                  setShowTodayOnly(true);
                  setDateRange(undefined);
                }}
                className={`text-xs ${
                  filterMode === "today"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                }`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Today
              </Button>
              <Button
                variant={filterMode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterMode("single");
                  setShowTodayOnly(false);
                }}
                className={`text-xs ${
                  filterMode === "single"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                }`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Single Day
              </Button>
              <Button
                variant={filterMode === "range" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterMode("range");
                  setShowTodayOnly(false);
                }}
                className={`text-xs ${
                  filterMode === "range"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                }`}
              >
                <Filter className="h-3 w-3 mr-1" />
                Date Range
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          {/* Main Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Global Search */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                Global Search
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search union members, loans, amounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status Filter (limited to allowed statuses) */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                Payment Status
              </Label>
              <SearchableSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                placeholder="All Statuses"
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "PARTIAL", label: "Partial" },
                  { value: "UNDER_REPAYMENT", label: "Under Repayment" },
                ]}
                className="border-gray-300 focus:border-purple-500"
              />
            </div>

            {/* Credit Officer Filter - Admin Only */}
            {currentUser?.role === "ADMIN" && (
              <div>
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                  Credit Officer
                </Label>
                <SearchableSelect
                  value={selectedCreditOfficer}
                  onValueChange={setSelectedCreditOfficer}
                  placeholder="All Officers"
                  options={[
                    { value: "", label: "All Officers" },
                    ...creditOfficers.map((officer) => ({
                      value: officer.id,
                      label: officer.email,
                    })),
                  ]}
                  searchPlaceholder="Search officers..."
                  className="border-gray-300 focus:border-purple-500"
                />
              </div>
            )}

            {/* Union Filter - Admin Only */}
            {currentUser?.role === "ADMIN" && (
              <div>
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                  Union
                </Label>
                <SearchableSelect
                  value={selectedUnion}
                  onValueChange={setSelectedUnion}
                  placeholder="All Unions"
                  options={[
                    { value: "", label: "All Unions" },
                    ...unions.map((union) => ({
                      value: union.id,
                      label: union.name,
                    })),
                  ]}
                  searchPlaceholder="Search unions..."
                  className="border-gray-300 focus:border-purple-500"
                />
              </div>
            )}

            {/* Date Controls - adapt based on filter mode */}
            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                  {filterMode === "range" ? "Due Date Range" : "Due Date"}
                  {filterMode === "all" && (
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Showing all schedules)
                    </span>
                  )}
                  {filterMode === "today" && (
                    <span className="text-xs text-amber-600 font-normal ml-2">
                      (Showing only Today)
                    </span>
                  )}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={filterMode === "today" || filterMode === "all"}
                      className={`w-full justify-start text-left font-normal h-12 px-4 ${
                        filterMode === "today" || filterMode === "all"
                          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 hover:border-purple-500 focus:border-purple-500"
                      }`}
                    >
                      <Calendar className="mr-3 h-5 w-5 text-gray-400" />
                      {filterMode === "range" &&
                      dateRange?.from &&
                      dateRange?.to ? (
                        <span className="text-sm">
                          {format(dateRange.from, "MMM dd")} -{" "}
                          {format(dateRange.to, "MMM dd")}
                        </span>
                      ) : filterMode === "single" && singleDate ? (
                        <span className="text-sm">
                          {format(singleDate, "MMM dd, yyyy")}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {filterMode === "all"
                            ? "All schedules mode"
                            : filterMode === "today"
                            ? "Today Only mode active"
                            : filterMode === "single"
                            ? "Select a date"
                            : "Select date range"}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  {filterMode !== "today" && filterMode !== "all" && (
                    <PopoverContent
                      className="w-auto p-0 max-w-[95vw]"
                      align="start"
                    >
                      {filterMode === "range" ? (
                        <CalendarComponent
                          mode="range"
                          selected={dateRange as any}
                          onSelect={(range) => setDateRange(range as any)}
                          numberOfMonths={isMobile ? 1 : 2}
                          className="rounded-md border"
                        />
                      ) : (
                        <CalendarComponent
                          mode="single"
                          selected={singleDate as any}
                          onSelect={(date) => setSingleDate(date as Date)}
                          numberOfMonths={isMobile ? 1 : 2}
                          className="rounded-md border"
                        />
                      )}
                    </PopoverContent>
                  )}
                </Popover>
              </div>
              {filterMode === "single" && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                    Actions
                  </Label>
                  <Button
                    variant="default"
                    className="w-full"
                    disabled={!singleDate}
                    onClick={() => {
                      if (singleDate) {
                        setDateRange({ from: singleDate, to: singleDate });
                      }
                    }}
                  >
                    Apply Selected Date
                  </Button>
                </div>
              )}
            </div>

            {/* Amount Range Filter */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                Amount Range
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Min amount"
                    type="number"
                    value={amountFrom}
                    onChange={(e) => setAmountFrom(e.target.value)}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Max amount"
                    type="number"
                    value={amountTo}
                    onChange={(e) => setAmountTo(e.target.value)}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                {filteredData.length} of {totalItems} schedules
                {showTodayOnly && " (Today Only)"}
                {(searchTerm ||
                  selectedCreditOfficer ||
                  selectedUnion ||
                  statusFilter ||
                  (!showTodayOnly && dateRange) ||
                  amountFrom ||
                  amountTo) &&
                  " (filtered)"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCreditOfficer("");
                  setSelectedUnion("");
                  setSelectedLoan("");
                  setStatusFilter("");
                  setDateRange(undefined);
                  setSearchTerm("");
                  setAmountFrom("");
                  setAmountTo("");
                  setShowTodayOnly(true); // Reset to default "Today Only" mode
                }}
                className="flex items-center gap-2 px-4 py-2 h-10 border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>

              <Button
                onClick={() => {
                  // Save current filters as preset
                  toast.success("Filter preset saved successfully");
                }}
                className="flex items-center gap-2 px-4 py-2 h-10 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4" />
                Save Preset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Schedules Table */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            Repayment Schedules
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            {filterMode === "all"
              ? "Showing all repayment schedules"
              : filterMode === "today"
              ? "Showing repayment schedules due today"
              : filterMode === "single" && singleDate
              ? `Showing schedules for ${format(singleDate, "MMM dd, yyyy")}`
              : filterMode === "range" && dateRange?.from && dateRange?.to
              ? `Showing schedules from ${format(
                  dateRange.from,
                  "MMM dd"
                )} to ${format(dateRange.to, "MMM dd")}`
              : "Active loan repayment schedules and payment management"}
          </p>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                Math.max(totalItems, 1)
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems} results
            </div>
            <div className="flex items-center gap-4">
              {/* Column Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Settings className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm mb-3">Toggle Columns</h4>
                    {Object.entries(columnLabels).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[key as keyof typeof visibleColumns]}
                          onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Rows per page:
                </span>
                <span className="text-sm text-gray-600 sm:hidden">Per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
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
          </div>

          {/* Table View - Show on all screen sizes */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.dueDate && (
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Due Date
                    </th>
                  )}
                  {visibleColumns.loanNumber && (
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Loan #
                    </th>
                  )}
                  {visibleColumns.unionMember && (
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Union Member
                    </th>
                  )}
                  {visibleColumns.creditOfficer && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Credit Officer
                    </th>
                  )}
                  {visibleColumns.union && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Union
                    </th>
                  )}
                  {visibleColumns.principal && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Principal
                    </th>
                  )}
                  {visibleColumns.processingFee && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Processing Fee
                    </th>
                  )}
                  {visibleColumns.totalLeft && (
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Total Left
                    </th>
                  )}
                  {visibleColumns.dueToday && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Due Today
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Status
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((item) => {
                    console.log(
                      "🎨 Rendering table row for:",
                      item.loan?.loanNumber
                    );
                    const metrics = calculateLoanMetrics(
                      item.loan,
                      item.paidAmount
                    );

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatDate(item.dueDate)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/business-management/loan/${item.loanId}`}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm sm:text-base"
                          >
                            {item.loan?.loanNumber || "N/A"}
                          </Link>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                              {item.loan?.unionMember?.firstName || ""}{" "}
                              {item.loan?.unionMember?.lastName || ""}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {item.loan?.unionMember?.code || "N/A"}
                              </span>
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {item.loan?.assignedOfficer?.email || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">
                              {item.loan?.union?.name || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-sm text-gray-900">
                            {formatCurrency(
                              safeParseNumber(item.loan?.principalAmount)
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(
                              safeParseNumber(item.loan?.processingFeeAmount)
                            )}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-emerald-600 text-sm sm:text-base">
                            {formatCurrency(metrics.totalLeftToPay)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-blue-600 text-sm">
                            {formatCurrency(metrics.dueToday)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(metrics.status)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePayDueToday(item, metrics.dueToday)
                              }
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                              disabled={metrics.totalLeftToPay === 0 || loading}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Pay Due
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePayCustomAmount(item)}
                              className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              disabled={metrics.totalLeftToPay === 0 || loading}
                            >
                              <Banknote className="h-3 w-3 mr-1" />
                              Custom
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/dashboard/business-management/loan-payment/repayment-schedules/${item.loanId}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  <span className="font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems} results
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 h-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  {/* Page Info */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 h-10"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Payment Modal */}
      {paymentModal.isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {paymentModal.paymentType === "due_today"
                    ? "Pay Due Today"
                    : "Pay Custom Amount"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentModal({ isOpen: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>

              {paymentModal.loanData && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Loan Number</p>
                        <p className="font-semibold">
                          {paymentModal.loanData.loan?.loanNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Union Member</p>
                        <p className="font-semibold">
                          {paymentModal.loanData.loan?.unionMember?.firstName}{" "}
                          {paymentModal.loanData.loan?.unionMember?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Left to Pay</p>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(
                            calculateLoanMetrics(
                              paymentModal.loanData.loan,
                              paymentModal.loanData.paidAmount
                            ).totalLeftToPay
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Due Today</p>
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(
                            calculateLoanMetrics(
                              paymentModal.loanData.loan,
                              paymentModal.loanData.paidAmount
                            ).dueToday
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₦
                        </span>
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              amount: e.target.value,
                            })
                          }
                          className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            paymentErrors.amount
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter amount"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {paymentErrors.amount && (
                        <p className="text-red-500 text-xs mt-1">
                          {paymentErrors.amount}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={paymentForm.method}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            method: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          paymentErrors.method
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="cash">Cash</option>
                        <option value="transfer">Bank Transfer</option>
                        <option value="pos">POS</option>
                        <option value="mobile">Mobile Money</option>
                        <option value="ussd">USSD</option>
                        <option value="other">Other</option>
                      </select>
                      {paymentErrors.method && (
                        <p className="text-red-500 text-xs mt-1">
                          {paymentErrors.method}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={paymentForm.notes}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Add payment notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPaymentModal({ isOpen: false });
                          setPaymentForm({
                            amount: "",
                            method: "cash",
                            notes: "",
                          });
                          setPaymentErrors({});
                        }}
                        className="flex-1"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={processPayment}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Process Payment"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
