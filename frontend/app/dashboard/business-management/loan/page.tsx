"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Copy,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
  FilterX,
  Settings2,
  CreditCard,
  TrendingUp,
  Calendar as CalendarIcon,
  Building,
  Users,
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatNaira } from "@/utils/currency";
import { exportToExcel, exportToPDF, copyToClipboard } from "@/utils/export";
import { Loan } from "@/types/loan";
import { SearchableSelect } from "@/components/SearchableSelect";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  loansApi,
  unionMembersApi,
  usersApi,
  unionsApi,
  loanTypesApi,
  repaymentsApi,
  handleDatabaseError,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { StaffOnly, AccessDenied } from "@/components/auth/RoleGuard";
import { getUserDisplayName } from "@/utils/user-display";

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  color = "green",
  subtitle,
  trend,
}: {
  title: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  color?: "green" | "emerald" | "teal" | "blue" | "orange" | "red" | "indigo" | "violet" | "amber" | "slate";
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) => {
  const colorConfig: Record<string, string> = {
    green: "from-green-500 to-emerald-600",
    emerald: "from-emerald-500 to-teal-600",
    teal: "from-teal-500 to-green-600",
    blue: "from-blue-500 to-indigo-600",
    orange: "from-orange-500 to-amber-600",
    red: "from-red-500 to-rose-600",
    indigo: "from-indigo-500 to-purple-600",
    violet: "from-violet-500 to-purple-600",
    amber: "from-amber-500 to-orange-600",
    slate: "from-slate-500 to-gray-600",
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 min-w-0 flex-1 mr-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</div>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1">
                <TrendingUp
                  className={`h-3 w-3 ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${colorConfig[color] || colorConfig.blue} shadow-lg flex-shrink-0`}
          >
            {Icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type ColumnKey =
  | "loanNumber"
  | "unionMember"
  | "loanType"
  | "principalAmount"
  | "dueToday"
  | "status"
  | "creditOfficer"
  | "union"
  | "overdue"
  | "paymentStatus"
  | "action";

// Extended Loan interface for display purposes
interface LoanWithRelations extends Loan {
  repaymentsCount?: number;
  scheduleItemsCount?: number;
  dueDate?: string;
  // Payment summary fields
  totalPaid?: number;
  totalOutstanding?: number;
  completionPercentage?: string;
  overdueAmount?: number;
  overdueCount?: number;
  // Remove conflicting property overrides since they're already defined in the base Loan interface
  unionMember?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    code: string;
  };
  createdByUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

function DateRangePicker({
  dateRange,
  onChange,
}: {
  dateRange: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full min-w-[200px] justify-start whitespace-nowrap text-left font-normal"
          aria-label="Select date range"
        >
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} -{" "}
                {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : (
            <span className="text-muted-foreground">Select date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function LoanListPageContent() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  // State management
  const [loans, setLoans] = useState<LoanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Performance optimization: Memoize calculations
  const memoizedCalculations = useMemo(() => {
    return loans.map((loan) => ({
      id: loan.id,
      formattedAmount: formatNaira(loan.principalAmount),
      formattedDate: loan.createdAt
        ? new Date(loan.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "N/A",
      customerName: loan.unionMember
        ? `${loan.unionMember.firstName} ${loan.unionMember.lastName}`
        : "N/A",
      loanTypeName: loan.loanType?.name || "N/A",
    }));
  }, [loans]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>({
    loanNumber: true,
    unionMember: true,
    loanType: true,
    principalAmount: true,
    dueToday: true,
    status: true,
    creditOfficer: true,
    union: true,
    overdue: true,
    paymentStatus: true,
    action: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoanId, setDeleteLoanId] = useState<string | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);
  const [isGeneratingSchedules, setIsGeneratingSchedules] = useState(false);
  // Additional filter states
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedUnion, setSelectedUnion] = useState("all");
  const [quickFilter, setQuickFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Payment record modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] =
    useState<LoanWithRelations | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "TRANSFER",
    notes: "",
    reference: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Master data for dropdowns
  const [creditOfficers, setCreditOfficers] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [unions, setUnions] = useState<Array<{ id: string; name: string }>>([]);
  const [loanTypes, setLoanTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Optimized load loans with better error handling and validation
  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await loansApi.getAll();
      const loansData =
        response.data?.data?.loans ||
        response.data?.data ||
        response.data ||
        [];

      // Parse and validate nested data properly
      const parsedLoans = Array.isArray(loansData)
        ? loansData
            .map(
              (loan: any): LoanWithRelations => ({
                id: loan.id,
                loanNumber: loan.loanNumber || `LOAN-${loan.id.slice(-6)}`,
                principalAmount:
                  typeof loan.principalAmount === "number"
                    ? loan.principalAmount
                    : typeof loan.principalAmount === "string"
                    ? parseFloat(loan.principalAmount) || 0
                    : 0,
                status: (loan.status || "DRAFT") as
                  | "DRAFT"
                  | "PENDING_APPROVAL"
                  | "APPROVED"
                  | "ACTIVE"
                  | "COMPLETED"
                  | "DEFAULTED"
                  | "WRITTEN_OFF"
                  | "CANCELED",
                createdAt: loan.createdAt,
                dueDate: loan.endDate || loan.dueDate,
                unionMemberId: loan.unionMemberId || "",
                unionId: loan.unionId || "",
                currencyCode: loan.currencyCode || "NGN",
                termCount:
                  typeof loan.termCount === "number" ? loan.termCount : 1,
                termUnit: (loan.termUnit || "MONTH") as
                  | "DAY"
                  | "WEEK"
                  | "MONTH",
                startDate: loan.startDate || loan.createdAt,
                processingFeeAmount:
                  typeof loan.processingFeeAmount === "number"
                    ? loan.processingFeeAmount
                    : 0,
                penaltyFeePerDayAmount:
                  typeof loan.penaltyFeePerDayAmount === "number"
                    ? loan.penaltyFeePerDayAmount
                    : 0,
                notes: loan.notes || "",
                loanTypeId: loan.loanTypeId || "",
                createdByUserId: loan.createdByUserId || "",
                assignedOfficerId: loan.assignedOfficerId || "",
                processingFeeCollected: Boolean(loan.processingFeeCollected),
                documents: Array.isArray(loan.documents) ? loan.documents : [],
                updatedAt: loan.updatedAt || loan.createdAt,
                repaymentsCount: loan._count?.repayments ?? 0,
                scheduleItemsCount: loan._count?.scheduleItems ?? 0,
                unionMember: loan.unionMember
                  ? {
                      id: loan.unionMember.id,
                      firstName: loan.unionMember.firstName || "",
                      lastName: loan.unionMember.lastName || "",
                      phone: loan.unionMember.phone || "",
                      email: loan.unionMember.email || "",
                      code: loan.unionMember.code || "",
                    }
                  : undefined,
                loanType: loan.loanType
                  ? {
                      id: loan.loanType.id,
                      name: loan.loanType.name || "Unknown Type",
                    }
                  : undefined,
                createdByUser: loan.createdByUser
                  ? {
                      id: loan.createdByUser.id,
                      email: loan.createdByUser.email || "Unknown User",
                      firstName: loan.createdByUser.firstName,
                      lastName: loan.createdByUser.lastName,
                      role: loan.createdByUser.role,
                    }
                  : undefined,
                union: loan.union
                  ? {
                      id: loan.union.id,
                      name: loan.union.name || "Unknown Union",
                      code: (loan.union as any).code || "",
                    }
                  : undefined,
                assignedOfficer: loan.assignedOfficer
                  ? {
                      id: loan.assignedOfficer.id,
                      email: loan.assignedOfficer.email || "",
                      role: loan.assignedOfficer.role || "",
                    }
                  : undefined,
                // Payment summary fields from backend
                totalPaid:
                  typeof loan.totalPaid === "number"
                    ? loan.totalPaid
                    : typeof loan.totalPaid === "string"
                    ? parseFloat(loan.totalPaid) || 0
                    : 0,
                totalOutstanding:
                  typeof loan.totalOutstanding === "number"
                    ? loan.totalOutstanding
                    : typeof loan.totalOutstanding === "string"
                    ? parseFloat(loan.totalOutstanding) || 0
                    : undefined,
              })
            )
            .filter((loan: LoanWithRelations) => {
              // Validate required fields
              return (
                loan &&
                loan.id &&
                loan.loanNumber &&
                typeof loan.principalAmount === "number" &&
                loan.principalAmount >= 0
              );
            })
        : [];

      setLoans(parsedLoans);
    } catch (error: any) {
      console.error("Failed to load loans:", error);
      setError("Failed to load loans");
      handleDatabaseError(error, "Failed to load loans");
      setLoans([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Load credit officers for filter
  const loadCreditOfficers = async () => {
    try {
      const response = await usersApi.getAll({ role: "CREDIT_OFFICER" });

      // Log the response for debugging
      console.log("Credit Officers Response:", response);

      // Extract users from various possible response structures
      let usersData = [];

      if (response.data?.data?.users) {
        usersData = response.data.data.users;
      } else if (response.data?.data?.data) {
        usersData = response.data.data.data;
      } else if (response.data?.users) {
        usersData = response.data.users;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      }

      console.log("Extracted Users Data:", usersData);

      // Filter and map credit officers
      const officers = Array.isArray(usersData)
        ? usersData
            .filter((user: any) => user.role === "CREDIT_OFFICER" && user.id)
            .map((user: any) => ({
              value: user.id,
              label: getUserDisplayName(user, "Unknown Officer"),
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
        : [];

      console.log("Mapped Officers:", officers);
      setCreditOfficers(officers);

      if (officers.length === 0) {
        console.warn("No credit officers found from API");
      }
    } catch (error: any) {
      console.error("Failed to load credit officers:", error);
      handleDatabaseError(error, "Failed to load credit officers");
    }
  };

  // Load unions and loan types
  const loadMasterData = async () => {
    try {
      const [unionsResponse, loanTypesResponse] = await Promise.all([
        unionsApi.getAll({ limit: 1000 }),
        loanTypesApi.getAll(),
      ]);

      const unionsData = unionsResponse.data;
      const unionsList = unionsData.success
        ? unionsData.data
        : unionsData.data || unionsData || [];
      const loanTypesData =
        loanTypesResponse.data?.data || loanTypesResponse.data || [];

      setUnions(Array.isArray(unionsList) ? unionsList : []);
      setLoanTypes(Array.isArray(loanTypesData) ? loanTypesData : []);
    } catch (error: any) {
      console.error("Failed to load master data:", error);
    }
  };

  // Payment record handlers
  const handleOpenPaymentModal = async (loan: LoanWithRelations) => {
    try {
      // Fetch the latest loan summary to get correct payment calculations
      const summaryResponse = await loansApi.getSummary(loan.id);
      const loanSummary = summaryResponse.data.data || summaryResponse.data;

      // Update the loan with correct payment summary data
      const updatedLoan = {
        ...loan,
        totalPaid: loanSummary.totalPaid || 0,
        totalOutstanding: loanSummary.totalOutstanding || 0,
        completionPercentage: loanSummary.completionPercentage || "0",
      };

      setSelectedLoanForPayment(updatedLoan);
    } catch (error) {
      console.error("Failed to fetch loan summary:", error);
      // Fallback to loan data without summary
      setSelectedLoanForPayment(loan);
    }

    setPaymentForm({
      amount: "",
      method: "TRANSFER",
      notes: "",
      reference: "",
      date: new Date().toISOString().split("T")[0],
    });
    setPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedLoanForPayment(null);
    setPaymentForm({
      amount: "",
      method: "TRANSFER",
      notes: "",
      reference: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleRecordPayment = async () => {
    if (!selectedLoanForPayment || !paymentForm.amount) {
      toast.error("Please enter payment amount");
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    // Validate payment amount does not exceed total outstanding
    const totalOutstanding = parseFloat(
      String(selectedLoanForPayment.totalOutstanding || "0")
    );
    if (paymentAmount > totalOutstanding) {
      toast.error(
        `Payment amount cannot exceed total left to pay (₦${totalOutstanding.toLocaleString()})`
      );
      return;
    }

    setIsRecordingPayment(true);
    try {
      console.log("Recording payment:", {
        loanId: selectedLoanForPayment.id,
        amount: paymentAmount,
        method: paymentForm.method,
        notes: paymentForm.notes,
      });

      const response = await repaymentsApi.create({
        loanId: selectedLoanForPayment.id,
        amount: paymentAmount,
        method: paymentForm.method as
          | "CASH"
          | "TRANSFER"
          | "POS"
          | "MOBILE"
          | "USSD"
          | "OTHER",
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });

      console.log("Payment recorded successfully:", response);

      // Show success message with payment details
      toast.success(
        `Payment of ${formatNaira(paymentAmount)} recorded successfully!`,
        {
          description: `Loan: ${selectedLoanForPayment.loanNumber}`,
          duration: 4000,
        }
      );

      handleClosePaymentModal();

      // Refresh loans data to show updated amounts
      await loadLoans();

      // Also refresh the specific loan with payment summary if it's in the list
      if (selectedLoanForPayment) {
        try {
          const [updatedLoanResponse, loanSummaryResponse] = await Promise.all([
            loansApi.getById(selectedLoanForPayment.id),
            loansApi.getSummary(selectedLoanForPayment.id),
          ]);

          const updatedLoanData =
            updatedLoanResponse.data.data || updatedLoanResponse.data;
          const loanSummary =
            loanSummaryResponse.data.data || loanSummaryResponse.data;

          // Update the specific loan in the loans array with payment information
          setLoans((prevLoans) =>
            prevLoans.map((loan) =>
              loan.id === selectedLoanForPayment.id
                ? {
                    ...loan,
                    ...updatedLoanData,
                    // Add payment summary information
                    totalPaid: loanSummary.totalPaid,
                    totalOutstanding: loanSummary.totalOutstanding,
                    completionPercentage: loanSummary.completionPercentage,
                    overdueAmount: loanSummary.overdueAmount,
                    overdueCount: loanSummary.overdueCount,
                  }
                : loan
            )
          );

          // Show additional success message with updated loan status
          if (loanSummary.completionPercentage === "100.00") {
            toast.success("🎉 Loan fully paid!", {
              description: `Loan ${selectedLoanForPayment.loanNumber} has been completed`,
              duration: 5000,
            });
          }
        } catch (error) {
          console.warn("Could not refresh individual loan data:", error);
        }
      }
    } catch (error: any) {
      console.error("Failed to record payment:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  useEffect(() => {
    loadLoans();
    loadCreditOfficers();
    loadMasterData();
  }, []);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const lower = searchTerm.toLowerCase();
      const matchesSearch =
        loan.loanNumber.toLowerCase().includes(lower) ||
        (loan.unionMember &&
          `${loan.unionMember.firstName} ${loan.unionMember.lastName}`
            .toLowerCase()
            .includes(lower)) ||
        (loan.loanType && loan.loanType.name.toLowerCase().includes(lower)) ||
        (loan.createdByUser &&
          (loan.createdByUser.email.toLowerCase().includes(lower) ||
            (loan.createdByUser.firstName &&
              loan.createdByUser.firstName.toLowerCase().includes(lower)) ||
            (loan.createdByUser.lastName &&
              loan.createdByUser.lastName.toLowerCase().includes(lower)) ||
            `${loan.createdByUser.firstName || ""} ${
              loan.createdByUser.lastName || ""
            }`
              .toLowerCase()
              .includes(lower)));

      const matchesOfficer =
        selectedOfficer === "all" || loan.createdByUser?.id === selectedOfficer;
      const matchesStatus =
        statusFilter === "all" || loan.status === statusFilter;
      const matchesUnion =
        selectedUnion === "all" || loan.unionId === selectedUnion;

      // Amount range filter
      const principalAmount = parseFloat(String(loan.principalAmount || 0));
      const minAmountNum = minAmount ? parseFloat(minAmount) : 0;
      const maxAmountNum = maxAmount ? parseFloat(maxAmount) : Infinity;
      const matchesAmount =
        principalAmount >= minAmountNum && principalAmount <= maxAmountNum;

      // Quick filter for date ranges
      let matchesQuickFilter = true;
      if (quickFilter !== "all") {
        const now = new Date();
        const loanDate = new Date(loan.createdAt);

        if (quickFilter === "today") {
          matchesQuickFilter = loanDate.toDateString() === now.toDateString();
        } else if (quickFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesQuickFilter = loanDate >= weekAgo && loanDate <= now;
        } else if (quickFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesQuickFilter = loanDate >= monthAgo && loanDate <= now;
        }
      }

      // Date range filter
      let matchesDate = true;
      if (dateRange.from) {
        matchesDate = new Date(loan.createdAt) >= dateRange.from;
      }
      if (matchesDate && dateRange.to) {
        matchesDate = new Date(loan.createdAt) <= dateRange.to;
      }

      return (
        matchesSearch &&
        matchesOfficer &&
        matchesStatus &&
        matchesUnion &&
        matchesAmount &&
        matchesQuickFilter &&
        matchesDate
      );
    });
  }, [
    loans,
    searchTerm,
    selectedOfficer,
    statusFilter,
    selectedUnion,
    minAmount,
    maxAmount,
    quickFilter,
    dateRange,
  ]);

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLoans = filteredLoans.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const toggleColumnVisibility = (colName: ColumnKey) => {
    setVisibleCols((prev) => ({
      ...prev,
      [colName]: !prev[colName],
    }));
  };

  const handleExport = (type: "excel" | "pdf" | "copy") => {
    try {
      // Convert to the expected format for export functions
      const exportData: Loan[] = filteredLoans.map((loan) => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        principalAmount: loan.principalAmount,
        status: loan.status,
        createdAt: loan.createdAt,
        unionMemberId: (loan as any).unionMemberId,
        unionId: (loan as any).unionId,
        currencyCode: loan.currencyCode,
        termCount: loan.termCount,
        termUnit: loan.termUnit,
        startDate: loan.startDate,
        endDate: loan.endDate,
        processingFeeAmount: loan.processingFeeAmount,
        penaltyFeePerDayAmount: loan.penaltyFeePerDayAmount,
        processingFeeCollected: loan.processingFeeCollected,
        createdByUserId: loan.createdByUserId,
        assignedOfficerId: loan.assignedOfficerId,
        documents: loan.documents,
        updatedAt: loan.updatedAt,
        // Include nested objects for export
        unionMember: loan.unionMember,
        union: loan.union,
        loanType: loan.loanType,
        createdBy: loan.createdBy || loan.createdByUser,
        assignedOfficer: loan.assignedOfficer,
      }));

      switch (type) {
        case "excel":
          exportToExcel(exportData, "loans-report");
          toast.success("Loans exported to Excel successfully!");
          break;
        case "pdf":
          exportToPDF(exportData, "loans-report");
          toast.success("Loans exported to PDF successfully!");
          break;
        case "copy":
          copyToClipboard(exportData);
          toast.success("Loans data copied to clipboard!");
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    setDeleteLoanId(loanId);
  };

  const confirmDeleteLoan = async () => {
    if (!deleteLoanId) return;

    setIsDeletingLoan(true);
    try {
      await loansApi.remove(deleteLoanId);
      await loadLoans();
      setDeleteLoanId(null);
      toast.success("Loan deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      handleDatabaseError(error, "Failed to delete loan");
    } finally {
      setIsDeletingLoan(false);
    }
  };

  const cancelDeleteLoan = () => {
    setDeleteLoanId(null);
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

      // Reload the loans data
      await loadLoans();
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

  const LoanStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      DRAFT: {
        label: "Draft",
        icon: "📝",
        className:
          "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200",
      },
      PENDING_APPROVAL: {
        label: "Pending Approval",
        icon: "⏳",
        className:
          "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
      },
      APPROVED: {
        label: "Approved",
        icon: "✓",
        className:
          "bg-lime-100 text-lime-700 border-lime-300 hover:bg-lime-200",
      },
      ACTIVE: {
        label: "Active",
        icon: "🔵",
        className:
          "bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200",
      },
      COMPLETED: {
        label: "Completed",
        icon: "✅",
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
      },
      DEFAULTED: {
        label: "Defaulted",
        icon: "⚠️",
        className: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
      },
      WRITTEN_OFF: {
        label: "Written Off",
        icon: "❌",
        className:
          "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200",
      },
      CANCELED: {
        label: "Canceled",
        icon: "🚫",
        className:
          "bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      icon: "•",
      className: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
    };

    return (
      <Badge
        className={`${config.className} border px-3 py-1.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadLoans}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Error boundary for component errors
  if (error && loans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-red-200 dark:border-red-800 p-8 text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              loadLoans();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading && loans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Clean Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-gray-400" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">
                    Loans
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header Content */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Loan Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage and track all loan applications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-700"
                onClick={() => setFilterVisible(!filterVisible)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push("/dashboard/business-management/loan/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Loan
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <SummaryCard
            title="Total Loans"
            value={loans.length}
            icon={<CreditCard className="h-5 w-5 text-white" />}
            color="blue"
            subtitle="All time"
          />
          <SummaryCard
            title="Active Loans"
            value={
              loans.filter(
                (loan) => loan.status === "ACTIVE" || loan.status === "APPROVED"
              ).length
            }
            icon={<Activity className="h-5 w-5 text-white" />}
            color="indigo"
            subtitle="Currently active"
          />
          <SummaryCard
            title="Total Amount"
            value={formatNaira(
              loans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0)
            )}
            icon={<span className="text-white font-bold text-sm">₦</span>}
            color="violet"
            subtitle="Principal amount"
          />
          <SummaryCard
            title="Outstanding"
            value={formatNaira(
              loans
                .filter(
                  (loan) =>
                    loan.status === "ACTIVE" || loan.status === "APPROVED"
                )
                .reduce((sum, loan) => {
                  const outstanding =
                    loan.totalOutstanding !== undefined
                      ? loan.totalOutstanding
                      : Number(loan.principalAmount) - (loan.totalPaid || 0);
                  return sum + outstanding;
                }, 0)
            )}
            icon={<AlertCircle className="h-5 w-5 text-white" />}
            color="amber"
            subtitle="Active loans"
          />
          <SummaryCard
            title="Pending"
            value={
              loans.filter((loan) => loan.status === "PENDING_APPROVAL").length
            }
            icon={<Clock className="h-5 w-5 text-white" />}
            color="slate"
            subtitle="Awaiting review"
          />
        </div>

        {/* Filters and Controls */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Filter className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Loan Filters & Search
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Find and filter loans by various criteria
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedOfficer("all");
                    setStatusFilter("all");
                    setDateRange({ from: undefined, to: undefined });
                    setMinAmount("");
                    setMaxAmount("");
                    setSelectedUnion("all");
                    setQuickFilter("all");
                    setCurrentPage(1);
                  }}
                  className="bg-white hover:bg-gray-50"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLoans}
                  className="bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-4 ${
                currentUser?.role === "CREDIT_OFFICER"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              }`}
            >
              {/* Search */}
              <div className="xl:col-span-2">
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Search Loans
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by loan number, union member..."
                    className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-gray-200 focus:border-green-500">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">
                      Pending Approval
                    </SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DEFAULTED">Defaulted</SelectItem>
                    <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credit Officer Filter - Only show to Admin and Supervisor */}
              {(currentUser?.role === "ADMIN" ||
                currentUser?.role === "SUPERVISOR") && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Credit Officer
                  </Label>
                  <SearchableSelect
                    value={selectedOfficer}
                    onValueChange={setSelectedOfficer}
                    placeholder="All officers"
                    searchPlaceholder="Search officers..."
                    options={[
                      { value: "all", label: "All Officers" },
                      ...creditOfficers.map((officer) => ({
                        value: officer.value,
                        label: officer.label,
                      })),
                    ]}
                    className="bg-white border-gray-200 focus:border-green-500"
                  />
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Date Range
                </Label>
                <DateRangePicker
                  dateRange={dateRange}
                  onChange={setDateRange}
                />
              </div>

              {/* Union Filter - Only show to Admin and Supervisor */}
              {(currentUser?.role === "ADMIN" ||
                currentUser?.role === "SUPERVISOR") && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Union
                  </Label>
                  <Select
                    value={selectedUnion}
                    onValueChange={setSelectedUnion}
                  >
                    <SelectTrigger className="bg-white border-gray-200 focus:border-green-500">
                      <SelectValue placeholder="All unions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Unions</SelectItem>
                      {unions.map((union) => (
                        <SelectItem key={union.id} value={union.id}>
                          {union.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Min Amount Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Min Amount (₦)
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Max Amount Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Amount (₦)
                </Label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Quick Filters
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={quickFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("all")}
                  className={
                    quickFilter === "all"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-white hover:bg-gray-50"
                  }
                >
                  All Time
                </Button>
                <Button
                  variant={quickFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("today")}
                  className={
                    quickFilter === "today"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-white hover:bg-gray-50"
                  }
                >
                  Today
                </Button>
                <Button
                  variant={quickFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("week")}
                  className={
                    quickFilter === "week"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-white hover:bg-gray-50"
                  }
                >
                  This Week
                </Button>
                <Button
                  variant={quickFilter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter("month")}
                  className={
                    quickFilter === "month"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-white hover:bg-gray-50"
                  }
                >
                  This Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Loan Portfolio
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {paginatedLoans.length} of {filteredLoans.length}{" "}
                    loans
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export to PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("copy")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </DropdownMenuItem>
                    {currentUser?.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleGenerateMissingSchedules}
                          disabled={isGeneratingSchedules}
                          className="text-amber-600 focus:text-amber-600"
                        >
                          {isGeneratingSchedules ? (
                            <>
                              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mr-2" />
                              Generating Schedules...
                            </>
                          ) : (
                            <>
                              <Settings2 className="w-4 h-4 mr-2" />
                              Generate Missing Schedules
                            </>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-slate-200 hover:bg-slate-50">
                    {visibleCols.loanNumber && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-500" />
                          Loan #
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.unionMember && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          Union Member
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.loanType && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-500" />
                          Type
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.principalAmount && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-bold text-base">
                            ₦
                          </span>
                          Amount
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.dueToday && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-slate-500" />
                          Due Date
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.status && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-slate-500" />
                          Loan Status
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.creditOfficer && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-500" />
                          Officer
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.union && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-500" />
                          Union
                        </div>
                      </TableHead>
                    )}
                    {visibleCols.overdue && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-slate-500" />
                          Overdue?
                        </div>
                      </TableHead>
                    )}
                    {/* Payment Progress Column - Commented Out */}
                    {/* {visibleCols.paymentStatus && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-500" />
                          Payment Progress
                        </div>
                      </TableHead>
                    )} */}
                    {visibleCols.action && (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-widest py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          Actions
                        </div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLoans.length > 0 ? (
                    paginatedLoans.map((loan) => (
                      <TableRow
                        key={loan.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-150 hover:shadow-sm"
                      >
                        {visibleCols.loanNumber && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📋</span>
                              <span className="font-bold text-slate-900">
                                {loan.loanNumber || loan.id}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.unionMember && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👤</span>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {loan.unionMember
                                    ? `${loan.unionMember.firstName} ${loan.unionMember.lastName}`
                                    : "N/A"}
                                </p>
                                {(loan.unionMember as any)?.code && (
                                  <p className="text-xs text-slate-500">
                                    {(loan.unionMember as any).code}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.loanType && (
                          <TableCell className="py-3 px-4">
                            <span className="font-medium text-slate-900 bg-blue-50 px-2.5 py-1 rounded-md inline-block">
                              {loan.loanType?.name || "N/A"}
                            </span>
                          </TableCell>
                        )}
                        {visibleCols.principalAmount && (
                          <TableCell className="py-3 px-4">
                            <span className="font-bold text-lg text-slate-900 bg-emerald-50 px-3 py-1 rounded-md inline-block">
                              {formatNaira(Number(loan.principalAmount))}
                            </span>
                          </TableCell>
                        )}
                        {visibleCols.dueToday && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📅</span>
                              <span className="font-medium text-slate-900">
                                {loan.status === "PENDING_APPROVAL" ||
                                loan.status === "DRAFT" ? (
                                  <span className="text-slate-500 italic">
                                    Pending Approval
                                  </span>
                                ) : loan.dueDate ? (
                                  format(new Date(loan.dueDate), "MMM dd, yyyy")
                                ) : (
                                  "N/A"
                                )}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.status && (
                          <TableCell className="py-3 px-4">
                            <LoanStatusBadge status={loan.status} />
                          </TableCell>
                        )}
                        {visibleCols.creditOfficer && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👨‍💼</span>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">
                                  {(() => {
                                    // Try assignedOfficer first
                                    const officer = (loan as any).assignedOfficer || (loan as any).createdByUser;
                                    if (officer?.firstName && officer?.lastName) {
                                      return `${officer.firstName} ${officer.lastName}`;
                                    }
                                    if (officer?.email) {
                                      return officer.email;
                                    }
                                    return "Unknown Officer";
                                  })()}
                                </span>
                                {(() => {
                                  const officer = (loan as any).assignedOfficer || (loan as any).createdByUser;
                                  return officer?.role ? (
                                    <span className="text-xs text-slate-500 capitalize">
                                      {officer.role.replace("_", " ").toLowerCase()}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.union && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏢</span>
                              <span className="font-medium text-slate-900">
                                {loan.union?.name || "Unknown Union"}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.overdue && (
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const today = new Date();
                                const endDate = loan.dueDate
                                  ? new Date(loan.dueDate)
                                  : null;
                                const isOverdue =
                                  endDate &&
                                  endDate < today &&
                                  loan.status === "ACTIVE";

                                return (
                                  <>
                                    <span className="text-lg">
                                      {isOverdue ? "⚠️" : "✓"}
                                    </span>
                                    <span
                                      className={`font-semibold ${
                                        isOverdue
                                          ? "text-red-600 bg-red-50"
                                          : "text-emerald-600 bg-emerald-50"
                                      } px-2.5 py-1 rounded-md`}
                                    >
                                      {isOverdue ? "Yes" : "No"}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </TableCell>
                        )}
                        {/* Payment Progress Column - Commented Out */}
                        {/* {visibleCols.paymentStatus && (
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                              {(() => {
                                const repaymentCount =
                                  (loan as any)._count?.repayments || 0;
                                const scheduleCount =
                                  (loan as any)._count?.scheduleItems || 0;

                                // Check if there are pending schedules (not all schedules have corresponding repayments)
                                const hasPendingSchedules =
                                  scheduleCount > 0 &&
                                  repaymentCount < scheduleCount;

                                // Only consider settled if no pending schedules AND totalOutstanding is actually 0
                                const isSettled =
                                  !hasPendingSchedules &&
                                  loan.totalOutstanding === 0;

                                // Check if loan status is "COMPLETED" but payment is not settled
                                // This is a data inconsistency that should be flagged
                                const isStatusCompletedButPaymentPending =
                                  loan.status === "COMPLETED" &&
                                  (hasPendingSchedules ||
                                    loan.totalOutstanding !== 0);

                                const isPaid = repaymentCount > 0;
                                const isFullyPaid =
                                  repaymentCount >= scheduleCount &&
                                  scheduleCount > 0;

                                // Calculate progress percentage
                                const progressPercent =
                                  scheduleCount > 0
                                    ? Math.round(
                                        (repaymentCount / scheduleCount) * 100
                                      )
                                    : 0;

                                return (
                                  <>
                                    {isStatusCompletedButPaymentPending ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                          <span className="font-semibold text-red-600 text-sm block">
                                            Incomplete
                                          </span>
                                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded inline-block mt-1">
                                            Status ≠ Payment
                                          </span>
                                        </div>
                                      </div>
                                    ) : isSettled ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">✅</span>
                                        <div>
                                          <span className="font-semibold text-emerald-600 text-sm block">
                                            Fully Paid
                                          </span>
                                          <span className="text-xs text-emerald-700">
                                            {scheduleCount} of {scheduleCount}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span
                                            className={`text-sm font-semibold ${
                                              isFullyPaid
                                                ? "text-emerald-600"
                                                : isPaid
                                                ? "text-amber-600"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {isFullyPaid
                                              ? "✅ Fully Paid"
                                              : isPaid
                                              ? "⏳ Partially Paid"
                                              : "⭕ Unpaid"}
                                          </span>
                                          <span className="text-xs font-medium text-gray-500">
                                            {repaymentCount}/{scheduleCount}
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              isFullyPaid
                                                ? "bg-emerald-500"
                                                : isPaid
                                                ? "bg-amber-500"
                                                : "bg-gray-400"
                                            }`}
                                            style={{
                                              width: `${progressPercent}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 block">
                                          {progressPercent}% Complete
                                        </span>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </TableCell>
                        )} */}
                        {visibleCols.action && (
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/business-management/loan/${loan.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/business-management/loan/${loan.id}/edit`)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPaymentModal(loan)}
                                disabled={(() => {
                                  // Disable if loan is COMPLETED
                                  if (loan.status === "COMPLETED") {
                                    return true;
                                  }

                                  const repaymentCount =
                                    (loan as any)._count?.repayments || 0;
                                  const scheduleCount =
                                    (loan as any)._count?.scheduleItems || 0;
                                  const hasPendingSchedules =
                                    scheduleCount > 0 &&
                                    repaymentCount < scheduleCount;

                                  // Disable if no pending schedules and totalOutstanding is 0
                                  const shouldDisable =
                                    !hasPendingSchedules &&
                                    loan.totalOutstanding === 0;
                                  return shouldDisable;
                                })()}
                                className={(() => {
                                  // Disable if loan is COMPLETED
                                  if (loan.status === "COMPLETED") {
                                    return "text-gray-400 cursor-not-allowed hover:bg-transparent";
                                  }

                                  const repaymentCount =
                                    (loan as any)._count?.repayments || 0;
                                  const scheduleCount =
                                    (loan as any)._count?.scheduleItems || 0;
                                  const hasPendingSchedules =
                                    scheduleCount > 0 &&
                                    repaymentCount < scheduleCount;
                                  const isSettled =
                                    !hasPendingSchedules &&
                                    loan.totalOutstanding === 0;
                                  return isSettled
                                    ? "text-gray-400 cursor-not-allowed hover:bg-transparent"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50";
                                })()}
                                title={(() => {
                                  // Show message if loan is COMPLETED
                                  if (loan.status === "COMPLETED") {
                                    return "Loan is completed - no further payments allowed";
                                  }

                                  const repaymentCount =
                                    (loan as any)._count?.repayments || 0;
                                  const scheduleCount =
                                    (loan as any)._count?.scheduleItems || 0;
                                  const hasPendingSchedules =
                                    scheduleCount > 0 &&
                                    repaymentCount < scheduleCount;
                                  const isSettled =
                                    !hasPendingSchedules &&
                                    loan.totalOutstanding === 0;
                                  return isSettled
                                    ? "Loan is fully settled"
                                    : "Record Payment";
                                })()}
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLoan(loan.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={
                          Object.values(visibleCols).filter(Boolean).length
                        }
                        className="text-center text-gray-500 py-12"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <CreditCard className="h-12 w-12 text-gray-300" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-600">
                              {filteredLoans.length === 0
                                ? "No loans found"
                                : "No loans match your filters"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {filteredLoans.length === 0
                                ? "Start by creating your first loan"
                                : "Try adjusting your search criteria"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold">
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredLoans.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold">
                      {filteredLoans.length}
                    </span>{" "}
                    loans
                  </div>
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="rows-per-page"
                      className="text-sm font-medium text-gray-600"
                    >
                      Rows per page:
                    </Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-9">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-white hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-white hover:bg-gray-50"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="bg-white hover:bg-gray-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Record Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Loan #{selectedLoanForPayment?.loanNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {/* Loan Info - Compact */}
            <div className="bg-blue-50 border border-blue-200 p-2 rounded">
              <p className="text-xs text-gray-600">Union Member:</p>
              <p className="font-medium text-sm">
                {selectedLoanForPayment?.unionMember?.firstName}{" "}
                {selectedLoanForPayment?.unionMember?.lastName}
              </p>
              <p className="text-xs text-gray-600 mt-1">Amount:</p>
              <p className="font-bold text-green-600 text-sm">
                ₦
                {parseFloat(
                  String(selectedLoanForPayment?.principalAmount || "0")
                ).toLocaleString()}
              </p>
            </div>

            {/* Balance Summary - Compact */}
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded">
              <h4 className="text-xs font-bold text-emerald-900 mb-1 uppercase">
                Balance Summary
              </h4>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Principal Amount:</span>
                  <span className="font-semibold text-blue-600">
                    ₦
                    {parseFloat(
                      String(selectedLoanForPayment?.principalAmount || "0")
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paid So Far:</span>
                  <span className="font-semibold text-blue-600">
                    ₦
                    {parseFloat(
                      String(selectedLoanForPayment?.totalPaid || "0")
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-emerald-100 px-2 py-1 rounded">
                  <span className="font-bold text-emerald-900">
                    Total Left to Pay:
                  </span>
                  <span className="font-bold text-emerald-700">
                    ₦
                    {parseFloat(
                      String(selectedLoanForPayment?.totalOutstanding || "0")
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Amount */}
            <div>
              <Label htmlFor="amount" className="text-xs">
                Payment Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Amount"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                className="mt-0.5 h-8 text-sm"
                max={parseFloat(
                  String(selectedLoanForPayment?.totalOutstanding || "0")
                )}
              />
              {paymentForm.amount &&
                parseFloat(paymentForm.amount) >
                  parseFloat(
                    String(selectedLoanForPayment?.totalOutstanding || "0")
                  ) && (
                  <p className="text-red-500 text-xs mt-0.5">
                    Exceeds balance (₦
                    {parseFloat(
                      String(selectedLoanForPayment?.totalOutstanding || "0")
                    ).toLocaleString()}
                    )
                  </p>
                )}
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="method" className="text-xs">
                Method
              </Label>
              <Select
                value={paymentForm.method}
                onValueChange={(value) =>
                  setPaymentForm({ ...paymentForm, method: value })
                }
              >
                <SelectTrigger className="mt-0.5 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="MOBILE">Mobile Money</SelectItem>
                  <SelectItem value="USSD">USSD</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div>
              <Label htmlFor="reference" className="text-xs">
                Reference (Optional)
              </Label>
              <Input
                id="reference"
                placeholder="Reference"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, reference: e.target.value })
                }
                className="mt-0.5 h-8 text-sm"
              />
            </div>

            {/* Payment Date */}
            <div>
              <Label htmlFor="date" className="text-xs">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.date}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, date: e.target.value })
                }
                className="mt-0.5 h-8 text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-xs">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Notes..."
                value={paymentForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
                className="mt-0.5 text-sm resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={handleClosePaymentModal}
              disabled={isRecordingPayment}
              size="sm"
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isRecordingPayment || !paymentForm.amount}
              className="bg-green-600 hover:bg-green-700 h-8 text-xs"
              size="sm"
            >
              {isRecordingPayment ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Recording...
                </>
              ) : (
                "Record"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteLoanId}
        title="Delete Loan"
        message="Are you sure you want to delete this loan? This action cannot be undone."
        onConfirm={confirmDeleteLoan}
        onCancel={cancelDeleteLoan}
        confirmButtonText={isDeletingLoan ? "Deleting..." : "Delete"}
        confirmButtonVariant="destructive"
        isLoading={isDeletingLoan}
        requireDeleteKeyword={true}
        deleteKeyword="DELETE"
      />
    </div>
  );
}

export default function LoanListPage() {
  return (
    <StaffOnly
      fallback={
        <AccessDenied message="Only staff members can access loan management." />
      }
    >
      <LoanListPageContent />
    </StaffOnly>
  );
}
