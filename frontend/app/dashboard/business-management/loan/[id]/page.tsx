"use client";

import { useState, useEffect, useMemo } from "react";
// Link removed - using router.push for navigation to hide URLs
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  FileSpreadsheet,
  FileText,
  Copy,
  Settings2,
  Search,
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Building,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  TrendingUp,
  CalendarDays,
  Users,
  MapPin,
  FileCheck,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Activity,
  PieChart,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth, loansApi, handleDatabaseError } from "@/lib/api";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loan } from "@/types/loan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatNairaCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Reusable Pagination Component
const PaginationComponent = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Show</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span>entries</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Showing {startItem} to {endItem} of {totalItems} entries
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum: number = (() => {
                if (totalPages <= 5) {
                  return i + 1;
                } else if (currentPage <= 3) {
                  return i + 1;
                } else if (currentPage >= totalPages - 2) {
                  return totalPages - 4 + i;
                } else {
                  return currentPage - 2 + i;
                }
              })();

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="h-8 w-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const LoanStatusBadge = ({ status }: { status: Loan["status"] }) => {
  const statusConfig = {
    DRAFT: {
      color:
        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
      label: "Draft",
      icon: FileText,
    },
    PENDING_APPROVAL: {
      color:
        "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border-amber-300",
      label: "Pending Approval",
      icon: Clock,
    },
    APPROVED: {
      color:
        "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300",
      label: "Approved",
      icon: CheckCircle,
    },
    ACTIVE: {
      color:
        "bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border-blue-300",
      label: "Active",
      icon: Activity,
    },
    COMPLETED: {
      color:
        "bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border-purple-300",
      label: "Completed",
      icon: FileCheck,
    },
    DEFAULTED: {
      color:
        "bg-gradient-to-r from-red-100 to-rose-200 text-red-800 border-red-300",
      label: "Defaulted",
      icon: AlertCircle,
    },
    WRITTEN_OFF: {
      color:
        "bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border-gray-300",
      label: "Written Off",
      icon: XCircle,
    },
    CANCELED: {
      color:
        "bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border-gray-300",
      label: "Canceled",
      icon: XCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.DRAFT;
  const IconComponent = config.icon;

  return (
    <Badge
      className={`${config.color} border px-3 py-1.5 font-medium shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <IconComponent className="h-3 w-3 mr-1.5" />
      {config.label}
    </Badge>
  );
};

const DetailField = ({
  label,
  content,
  icon: Icon,
}: {
  label: string;
  content: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="space-y-2 p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-green-600" />}
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
    </div>
    <div className="text-base font-semibold text-gray-900">{content}</div>
  </div>
);

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  subtitle,
}: {
  title: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  color?: "blue" | "green" | "orange" | "purple" | "red";
  subtitle?: string;
}) => {
  const colorConfig = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
  };

  // Helper function to determine text size based on value length
  const getValueTextSize = (val: string | React.ReactNode) => {
    const str = typeof val === "string" ? val : "";
    if (str.length > 20) return "text-lg";
    if (str.length > 15) return "text-xl";
    return "text-2xl";
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2 leading-tight">
              {title}
            </h3>
            <div
              className={`font-bold text-[18px] text-gray-900 leading-tight whitespace-nowrap ${getValueTextSize(
                value
              )}`}
            >
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-2 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${colorConfig[color]} shadow-lg flex-shrink-0`}
          >
            {Icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const loanId = params.id as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [repaymentSchedules, setRepaymentSchedules] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [repaymentSearchTerm, setRepaymentSearchTerm] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Pagination states
  const [scheduleCurrentPage, setScheduleCurrentPage] = useState(1);
  const [repaymentCurrentPage, setRepaymentCurrentPage] = useState(1);
  const [schedulePageSize, setSchedulePageSize] = useState(10);
  const [repaymentPageSize, setRepaymentPageSize] = useState(10);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: "",
    notes: "",
  });
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  useEffect(() => {
    loadLoanData();
  }, [loanId]);

  const handleStatusUpdate = async () => {
    if (!statusUpdateData.status) {
      toast.error("Please select a status");
      return;
    }

    if (
      statusUpdateData.status === "REJECTED" &&
      !statusUpdateData.notes.trim()
    ) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsStatusUpdating(true);

    try {
      await loansApi.updateStatus(loanId, {
        status: statusUpdateData.status,
        notes: statusUpdateData.notes,
      });

      toast.success(
        `Loan ${statusUpdateData.status.toLowerCase()} successfully`
      );
      setShowFinalConfirmation(false);
      setIsStatusModalOpen(false);
      setStatusUpdateData({ status: "", notes: "" });
      loadLoanData(); // Reload loan data
    } catch (error: any) {
      console.error("Failed to update loan status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update loan status"
      );
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const openStatusModal = (status: string) => {
    setStatusUpdateData({ status, notes: "" });
    setIsStatusModalOpen(true);
  };

  const loadLoanData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Loading loan data for ID:", loanId);

      // Load loan details
      const loanResponse = await loansApi.getById(loanId);
      console.log("Loan API response:", loanResponse);

      const loanData = loanResponse.data.data || loanResponse.data;
      console.log("Processed loan data:", loanData);

      // Validate loan data
      if (!loanData || !loanData.id) {
        console.error("Invalid loan data received:", loanData);
        throw new Error("Invalid loan data received from server");
      }

      // Additional validation for nested objects
      if (
        loanData.customer &&
        !loanData.customer.firstName &&
        !loanData.customer.lastName
      ) {
        console.warn(
          "Customer data missing firstName/lastName:",
          loanData.customer
        );
      }

      setLoan(loanData);

      // Extract repayments from loan data if available
      if (loanData.repayments && Array.isArray(loanData.repayments)) {
        setRepayments(loanData.repayments);
      }

      // Load repayment schedules
      try {
        const scheduleResponse = await loansApi.getSchedule(loanId);
        const schedulesData =
          scheduleResponse.data.data?.schedules ||
          scheduleResponse.data.schedules ||
          scheduleResponse.data.data ||
          scheduleResponse.data ||
          [];
        setRepaymentSchedules(
          Array.isArray(schedulesData) ? schedulesData : []
        );
      } catch (scheduleError) {
        console.warn("Could not load repayment schedules:", scheduleError);
        setRepaymentSchedules([]);
      }
    } catch (error: any) {
      console.error("Failed to load loan data:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load loan details due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Fallback error handling
      setError(error.response?.data?.message || "Failed to load loan details");
      toast.error("Failed to load loan details");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: "excel" | "pdf" | "copy") => {
    if (!loan) {
      toast.error("Loan data not available for export");
      return;
    }

    toast(`Exporting loan details as ${type}`, { duration: 2000 });
    // TODO: Implement actual export functionality
  };

  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return repaymentSchedules;

    const lowerSearch = searchTerm.toLowerCase();
    return repaymentSchedules.filter(
      (schedule) =>
        schedule.dueDate?.toLowerCase().includes(lowerSearch) ||
        schedule.status?.toLowerCase().includes(lowerSearch)
    );
  }, [repaymentSchedules, searchTerm]);

  const filteredRepayments = useMemo(() => {
    if (!repaymentSearchTerm) return repayments;

    const lowerSearch = repaymentSearchTerm.toLowerCase();
    return repayments.filter(
      (repayment) =>
        repayment.amount?.toString().includes(lowerSearch) ||
        repayment.method?.toLowerCase().includes(lowerSearch) ||
        repayment.reference?.toLowerCase().includes(lowerSearch) ||
        repayment.receivedBy?.email?.toLowerCase().includes(lowerSearch) ||
        formatDate(repayment.paidAt).toLowerCase().includes(lowerSearch)
    );
  }, [repayments, repaymentSearchTerm]);

  // Paginated data
  const paginatedSchedules = useMemo(() => {
    const startIndex = (scheduleCurrentPage - 1) * schedulePageSize;
    const endIndex = startIndex + schedulePageSize;
    return filteredSchedules.slice(startIndex, endIndex);
  }, [filteredSchedules, scheduleCurrentPage, schedulePageSize]);

  const paginatedRepayments = useMemo(() => {
    const startIndex = (repaymentCurrentPage - 1) * repaymentPageSize;
    const endIndex = startIndex + repaymentPageSize;
    return filteredRepayments.slice(startIndex, endIndex);
  }, [filteredRepayments, repaymentCurrentPage, repaymentPageSize]);

  // Pagination calculations
  const scheduleTotalPages = Math.ceil(
    filteredSchedules.length / schedulePageSize
  );
  const repaymentTotalPages = Math.ceil(
    filteredRepayments.length / repaymentPageSize
  );

  // Reset pagination when search terms change
  useEffect(() => {
    setScheduleCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setRepaymentCurrentPage(1);
  }, [repaymentSearchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading loan details...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch loan information
          </p>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Failed to Load Loan</h3>
              <p className="text-muted-foreground">
                {error || "Loan not found"}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadLoanData} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guard clause to prevent rendering if loan data is not available
  if (!loan || !loan.id) {
    console.log("Loan data not available, showing loading state. Loan:", loan);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading loan details...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch loan information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-950">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-black pb-32">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="pt-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="text-white/80 hover:text-white"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white/60" />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard/business-management/loan"
                    className="text-white/80 hover:text-white"
                  >
                    Loans
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white/60" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white font-semibold">
                    {loan?.loanNumber || loan?.id || "Loading..."}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {loan?.loanNumber || loan?.id || "Loading..."}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Loan Details & Repayment Schedule
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Admin-only approval/rejection buttons */}
                {currentUser?.role === "ADMIN" &&
                  (loan?.status === "PENDING_APPROVAL" ||
                    loan?.status === "DRAFT") && (
                    <>
                      <Button
                        onClick={() => openStatusModal("APPROVED")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Loan
                      </Button>
                      <Button
                        onClick={() => openStatusModal("REJECTED")}
                        className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Loan
                      </Button>
                    </>
                  )}
                {/* Edit button - only for ADMIN/CREDIT_OFFICER and editable statuses */}
                {(currentUser?.role === "ADMIN" ||
                  currentUser?.role === "CREDIT_OFFICER") &&
                  (loan?.status === "DRAFT" ||
                    loan?.status === "PENDING_APPROVAL") && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/dashboard/business-management/loan/${loanId}/edit`
                        )
                      }
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 shadow-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Loan
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 space-y-6 sm:space-y-8">
        {/* Loan Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            title="Principal Amount"
            value={formatNairaCurrency(Number(loan?.principalAmount || 0))}
            icon={<span className="text-white font-bold text-lg">₦</span>}
            color="blue"
            subtitle="Total loan amount"
          />
          <SummaryCard
            title="Processing Fee"
            value={formatNairaCurrency(Number(loan?.processingFeeAmount || 0))}
            icon={<CreditCard className="h-6 w-6 text-white" />}
            color="green"
            subtitle="One-time fee"
          />
          <SummaryCard
            title="Penalty Fee"
            value={formatNairaCurrency(
              Number(loan?.penaltyFeePerDayAmount || 0)
            )}
            icon={<AlertCircle className="h-6 w-6 text-white" />}
            color="red"
            subtitle="Per day overdue"
          />
          <SummaryCard
            title="Term Duration"
            value={`${loan?.termCount || 0} ${
              loan?.termUnit?.toLowerCase() || ""
            }`}
            icon={<CalendarDays className="h-6 w-6 text-white" />}
            color="purple"
            subtitle="Repayment period"
          />
        </div>

        {/* Loan Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Loan Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField
                  label="Loan Number"
                  content={loan?.loanNumber || loan?.id || "N/A"}
                  icon={Building}
                />
                <DetailField
                  label="Loan Type"
                  content={loan?.loanType?.name || "N/A"}
                  icon={FileText}
                />
                <DetailField
                  label="Union/Branch"
                  content={loan?.union?.name || "N/A"}
                  icon={MapPin}
                />
                <DetailField
                  label="Status"
                  content={<LoanStatusBadge status={loan?.status || "DRAFT"} />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer & Officer Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Customer & Officer Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <DetailField
                  label="Customer"
                  content={
                    loan?.unionMember
                      ? `${loan.unionMember?.firstName || ""} ${
                          loan.unionMember?.lastName || ""
                        }`.trim() || "N/A"
                      : "N/A"
                  }
                  icon={User}
                />
                <DetailField
                  label="Credit Officer"
                  content={
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {/* Check assignedOfficer first, then fall back to union's creditOfficer */}
                          {loan?.assignedOfficer?.firstName &&
                          loan?.assignedOfficer?.lastName
                            ? `${loan.assignedOfficer.firstName} ${loan.assignedOfficer.lastName}`
                            : loan?.assignedOfficer?.email
                            ? loan.assignedOfficer.email
                            : (loan?.union as any)?.creditOfficer?.firstName &&
                              (loan?.union as any)?.creditOfficer?.lastName
                            ? `${(loan?.union as any).creditOfficer.firstName} ${(loan?.union as any).creditOfficer.lastName}`
                            : (loan?.union as any)?.creditOfficer?.email || "N/A"}
                        </p>
                        {(loan?.assignedOfficer?.role || (loan?.union as any)?.creditOfficer?.role) && (
                          <p className="text-sm text-gray-500 capitalize">
                            {(loan?.assignedOfficer?.role || (loan?.union as any)?.creditOfficer?.role)?.replace("_", " ").toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  }
                />
                <DetailField
                  label="Created By"
                  content={
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {(loan?.createdByUser as any)?.firstName &&
                          (loan?.createdByUser as any)?.lastName
                            ? `${(loan.createdByUser as any).firstName} ${
                                (loan.createdByUser as any).lastName
                              }`
                            : (loan?.createdByUser as any)?.email || "N/A"}
                        </p>
                        {(loan?.createdByUser as any)?.role && (
                          <p className="text-sm text-gray-500 capitalize">
                            {(loan.createdByUser as any).role
                              .replace("_", " ")
                              .toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline & Dates */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Timeline & Important Dates
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailField
                label="Start Date"
                content={loan?.startDate ? formatDate(loan.startDate) : "N/A"}
                icon={Calendar}
              />
              <DetailField
                label="End Date"
                content={loan?.endDate ? formatDate(loan.endDate) : "N/A"}
                icon={Calendar}
              />
              <DetailField
                label="Created At"
                content={loan?.createdAt ? formatDate(loan.createdAt) : "N/A"}
                icon={Clock}
              />
            </div>

            {loan?.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <DetailField
                  label="Notes"
                  content={
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {loan?.notes || ""}
                    </p>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Loan Documents
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loan?.documents && loan.documents.length > 0 ? (
              <div className="space-y-6">
                {/* Customer Documents */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    Customer Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loan.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900 capitalize">
                              {(doc as any).documentType?.name || "Document"}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {doc.verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                        {(doc as any).verificationNotes && (
                          <p className="text-sm text-gray-600 mb-3">
                            {(doc as any).verificationNotes}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {doc.uploadedAt
                              ? formatDate(doc.uploadedAt)
                              : "Unknown date"}
                          </span>
                          <div className="flex gap-2">
                            {doc.fileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `${
                                      process.env.NEXT_PUBLIC_API_URL ||
                                      "https://l-d1.onrender.com/api"
                                    }/documents/serve/${doc.id}`,
                                    "_blank"
                                  )
                                }
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            {doc.fileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = doc.fileUrl;
                                  link.download =
                                    (doc as any).fileName ||
                                    `document-${doc.id}`;
                                  link.click();
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guarantor Documents */}
                {(loan as any)?.guarantors &&
                  (loan as any).guarantors.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        Guarantor Documents
                      </h4>
                      <div className="space-y-6">
                        {(loan as any).guarantors.map((guarantor: any) => (
                          <div
                            key={guarantor.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h5 className="font-semibold text-gray-800 mb-3">
                              {guarantor.name}
                            </h5>
                            {guarantor.documents &&
                            guarantor.documents.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {guarantor.documents.map((doc: any) => (
                                  <div
                                    key={doc.id}
                                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-green-600" />
                                        <span className="font-medium text-gray-900 text-sm capitalize">
                                          {(doc as any).documentType?.name ||
                                            "Document"}
                                        </span>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {doc.verified ? "Verified" : "Pending"}
                                      </Badge>
                                    </div>
                                    {(doc as any).verificationNotes && (
                                      <p className="text-xs text-gray-600 mb-2">
                                        {(doc as any).verificationNotes}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">
                                        {doc.uploadedAt
                                          ? formatDate(doc.uploadedAt)
                                          : "Unknown date"}
                                      </span>
                                      <div className="flex gap-1">
                                        {doc.fileUrl && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                `${
                                                  process.env
                                                    .NEXT_PUBLIC_API_URL ||
                                                  "https://l-d1.onrender.com/api"
                                                }/documents/serve/${doc.id}`,
                                                "_blank"
                                              )
                                            }
                                            className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1"
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                        )}
                                        {doc.fileUrl && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link =
                                                document.createElement("a");
                                              link.href = `${
                                                process.env
                                                  .NEXT_PUBLIC_API_URL ||
                                                "https://l-d1.onrender.com/api"
                                              }/documents/serve/${doc.id}`;
                                              link.download =
                                                (doc as any).fileName ||
                                                `guarantor-document-${doc.id}`;
                                              link.click();
                                            }}
                                            className="text-green-600 hover:text-green-700 text-xs px-2 py-1"
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm italic">
                                No documents uploaded for this guarantor
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Documents Uploaded
                </h3>
                <p className="text-gray-600">
                  No documents have been uploaded for this loan yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repayment Schedules Card - Only show for approved/active loans */}
        {loan?.status === "APPROVED" || loan?.status === "ACTIVE" ? (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Repayment Schedule
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Track payment due dates and amounts
                    </p>
                  </div>
                </div>

                {/* Export and Search Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-sm"
                      onClick={() => handleExport("excel")}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 shadow-sm"
                      onClick={() => handleExport("pdf")}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-teal-600 to-green-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
                      onClick={() => handleExport("copy")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search schedules..."
                      className="pl-10 w-full sm:w-64 bg-white border-gray-200 focus:border-blue-500 focus:ring-green-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-100">
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Due Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-bold">₦</span>
                          Principal
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Interest
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Total Amount
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Status
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSchedules.length > 0 ? (
                      paginatedSchedules.map((schedule, index) => (
                        <TableRow
                          key={schedule.id || index}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {schedule.dueDate
                                  ? formatDate(schedule.dueDate)
                                  : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 hidden sm:table-cell">
                            <span className="font-semibold text-gray-900">
                              {formatNairaCurrency(
                                Number(
                                  schedule.principalDue ||
                                    schedule.principalAmount ||
                                    0
                                )
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 hidden md:table-cell">
                            <span className="font-semibold text-gray-900">
                              {formatNairaCurrency(
                                Number(
                                  schedule.interestDue ||
                                    schedule.interestAmount ||
                                    0
                                )
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-bold text-lg text-gray-900">
                              {formatNairaCurrency(
                                Number(
                                  schedule.totalDue || schedule.totalAmount || 0
                                )
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={
                                schedule.status === "PAID"
                                  ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300"
                                  : schedule.status === "OVERDUE"
                                  ? "bg-gradient-to-r from-red-100 to-rose-200 text-red-800 border-red-300"
                                  : "bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border-amber-300"
                              }
                            >
                              {schedule.status || "PENDING"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-gray-500 py-12"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Calendar className="h-12 w-12 text-gray-300" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-600">
                                {repaymentSchedules.length === 0
                                  ? "No repayment schedules available"
                                  : "No schedules match your search"}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {repaymentSchedules.length === 0
                                  ? "Repayment schedules will appear here once generated"
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

              <div className="mt-6 pt-4 border-t border-gray-200">
                <PaginationComponent
                  currentPage={scheduleCurrentPage}
                  totalPages={scheduleTotalPages}
                  totalItems={filteredSchedules.length}
                  pageSize={schedulePageSize}
                  onPageChange={setScheduleCurrentPage}
                  onPageSizeChange={(size) => {
                    setSchedulePageSize(size);
                    setScheduleCurrentPage(1);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Message for pending loans */
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-amber-100 rounded-full">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Repayment Schedule Not Available
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Repayment schedules and payment options will be available
                    once this loan is approved by an administrator.
                  </p>
                </div>
                {loan?.status === "PENDING_APPROVAL" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Status:</strong> This loan is currently pending
                      approval. An administrator will review and approve it
                      soon.
                    </p>
                  </div>
                )}
                {loan?.status === "DRAFT" && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Status:</strong> This loan is still in draft
                      status. Please complete the loan application and submit it
                      for approval.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Repayments History Section */}
        {loan && repayments.length > 0 && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Payment History
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Track all payments made for this loan
                    </p>
                  </div>
                </div>

                {/* Export and Search Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-sm"
                      onClick={() => handleExport("excel")}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800 shadow-sm"
                      onClick={() => handleExport("pdf")}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-700 text-white hover:from-purple-700 hover:to-blue-800 shadow-sm"
                      onClick={() => handleExport("copy")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search payments..."
                      className="pl-10 w-full sm:w-64 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={repaymentSearchTerm}
                      onChange={(e) => setRepaymentSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-100">
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Payment Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-bold">₦</span>
                          Amount
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Method
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Reference
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Received By
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-600 uppercase text-xs tracking-wider py-4">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Actions
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRepayments.length > 0 ? (
                      paginatedRepayments.map((repayment, index) => (
                        <TableRow
                          key={repayment.id || index}
                          className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                        >
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">
                                {formatDate(repayment.paidAt)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(repayment.paidAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-bold text-lg text-green-600">
                              {formatNairaCurrency(Number(repayment.amount))}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={
                                repayment.method === "CASH"
                                  ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300"
                                  : repayment.method === "TRANSFER"
                                  ? "bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border-blue-300"
                                  : repayment.method === "POS"
                                  ? "bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border-purple-300"
                                  : repayment.method === "MOBILE"
                                  ? "bg-gradient-to-r from-orange-100 to-amber-200 text-orange-800 border-orange-300"
                                  : "bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border-gray-300"
                              }
                            >
                              {repayment.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 hidden sm:table-cell">
                            <span className="text-sm text-gray-600">
                              {repayment.reference || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {repayment.receivedBy?.email || "Unknown"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                                onClick={() => router.push(`/dashboard/business-management/loan-payment/repayment/${repayment.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <Activity className="h-8 w-8 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {repayments.length === 0
                                  ? "No payments recorded yet"
                                  : "No payments match your search"}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {repayments.length === 0
                                  ? "Payment history will appear here once payments are made"
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

              <div className="mt-6 pt-4 border-t border-gray-200">
                <PaginationComponent
                  currentPage={repaymentCurrentPage}
                  totalPages={repaymentTotalPages}
                  totalItems={filteredRepayments.length}
                  pageSize={repaymentPageSize}
                  onPageChange={setRepaymentCurrentPage}
                  onPageSizeChange={(size) => {
                    setRepaymentPageSize(size);
                    setRepaymentCurrentPage(1);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Confirmation Dialog (Double Confirmation) */}
        <AlertDialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {statusUpdateData.status === "APPROVED"
                  ? "Confirm Loan Approval"
                  : "Confirm Loan Rejection"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {statusUpdateData.status === "APPROVED" ? (
                  <>
                    Are you sure you want to approve this loan? This action will:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Generate the repayment schedule</li>
                      <li>Make the loan active for disbursement</li>
                      <li>Notify the credit officer</li>
                    </ul>
                    <p className="mt-3 font-medium">This action cannot be undone.</p>
                  </>
                ) : (
                  <>
                    Are you sure you want to reject this loan? This action will:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Cancel the loan application</li>
                      <li>Notify the credit officer of the rejection</li>
                      <li>Record the rejection reason in the system</li>
                    </ul>
                    <p className="mt-3 font-medium">This action cannot be undone.</p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isStatusUpdating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusUpdate}
                disabled={isStatusUpdating}
                className={
                  statusUpdateData.status === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isStatusUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : statusUpdateData.status === "APPROVED" ? (
                  "Yes, Approve Loan"
                ) : (
                  "Yes, Reject Loan"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Update Modal */}
        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    statusUpdateData.status === "APPROVED"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {statusUpdateData.status === "APPROVED" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <DialogTitle className="text-xl font-semibold text-gray-800">
                  {statusUpdateData.status === "APPROVED"
                    ? "Approve Loan"
                    : "Reject Loan"}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="notes"
                  className="text-sm font-semibold text-gray-700"
                >
                  {statusUpdateData.status === "APPROVED"
                    ? "Notes (Optional)"
                    : "Reason for Rejection *"}
                </Label>
                <Textarea
                  id="notes"
                  value={statusUpdateData.notes}
                  onChange={(e) =>
                    setStatusUpdateData({
                      ...statusUpdateData,
                      notes: e.target.value,
                    })
                  }
                  placeholder={
                    statusUpdateData.status === "APPROVED"
                      ? "Add any notes about the approval..."
                      : "Please provide a reason for rejecting this loan..."
                  }
                  className="mt-2 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Validate before showing final confirmation
                    if (
                      statusUpdateData.status === "REJECTED" &&
                      !statusUpdateData.notes.trim()
                    ) {
                      toast.error("Please provide a reason for rejection");
                      return;
                    }
                    setShowFinalConfirmation(true);
                  }}
                  disabled={isStatusUpdating}
                  className={
                    statusUpdateData.status === "APPROVED"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg"
                      : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg"
                  }
                >
                  {statusUpdateData.status === "APPROVED" ? (
                    "Continue to Approve"
                  ) : (
                    "Continue to Reject"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
