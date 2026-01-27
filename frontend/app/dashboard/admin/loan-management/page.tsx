"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loansApi } from "@/lib/api";
import { parseLoans } from "@/lib/api-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdminOnly, AccessDenied } from "@/components/auth/RoleGuard";
import { getUserDisplayName } from "@/utils/user-display";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  User,
  Building,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  AlertTriangle,
  CreditCard,
  Users,
  Settings,
  FileText,
  Trash2,
} from "lucide-react";

// Helper functions
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (error) {
    return "Invalid Date";
  }
};

const formatCurrency = (
  amount: number | string | undefined,
  currencyCode: string = "NGN"
) => {
  if (!amount) return "₦0";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "₦0";

  const symbol = currencyCode === "NGN" ? "₦" : currencyCode;
  return `${symbol}${numAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface Loan {
  id: string;
  loanNumber: string;
  customerId: string;
  branchId: string;
  loanTypeId: string;
  principalAmount: string;
  currencyCode: string;
  termCount: number;
  termUnit: string;
  startDate: string;
  endDate?: string;
  processingFeeAmount: string;
  processingFeeCollected: boolean;
  penaltyFeePerDayAmount: string;
  status: string;
  createdByUserId: string;
  assignedOfficerId: string;
  disbursedAt?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  customer: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    phone: string;
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
    zipCode?: string;
    note?: string;
    branchId: string;
    currentOfficerId?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  };
  loanType: {
    id: string;
    name: string;
    description?: string;
    minAmount: string;
    maxAmount: string;
    termUnit: string;
    minTerm: number;
    maxTerm: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  };
  branch: {
    id: string;
    name: string;
    code: string;
    managerId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  };
  assignedOfficer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  createdBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  scheduleItems?: Array<{
    id: string;
    loanId: string;
    sequence: number;
    dueDate: string;
    principalDue: string;
    interestDue: string;
    feeDue: string;
    totalDue: string;
    paidAmount: string;
    status: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  }>;
  repayments?: Array<any>;
  documents?: Array<any>;
  _count?: {
    repayments: number;
    scheduleItems: number;
    documents: number;
  };
}

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  loan: Loan | null;
  isLoading: boolean;
}

function ApprovalDialog({
  isOpen,
  onClose,
  onApprove,
  onReject,
  loan,
  isLoading,
}: ApprovalDialogProps) {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setAction(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (action === "approve") {
      onApprove(notes);
    } else if (action === "reject") {
      onReject(notes);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Loan Decision
          </DialogTitle>
          <DialogDescription>
            Review loan details and make your decision for loan #
            {loan?.loanNumber}
          </DialogDescription>
        </DialogHeader>

        {loan ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Customer Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Full Name
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.customer
                      ? `${loan.customer.firstName} ${loan.customer.lastName}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Phone
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.customer?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Email
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.customer?.email || "N/A"}
                  </p>
                </div>
                {loan.customer?.address && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Address
                    </Label>
                    <p className="text-sm sm:text-base font-semibold">
                      {loan.customer?.address}
                    </p>
                  </div>
                )}
                {loan.customer?.dateOfBirth && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Date of Birth
                    </Label>
                    <p className="text-sm sm:text-base font-semibold">
                      {formatDate(loan.customer?.dateOfBirth)}
                    </p>
                  </div>
                )}
                {loan.customer?.gender && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Gender
                    </Label>
                    <p className="text-sm sm:text-base font-semibold capitalize">
                      {loan.customer?.gender}
                    </p>
                  </div>
                )}
                {loan.customer?.maritalStatus && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Marital Status
                    </Label>
                    <p className="text-sm sm:text-base font-semibold capitalize">
                      {loan.customer?.maritalStatus}
                    </p>
                  </div>
                )}
                {loan.customer?.profession && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Profession
                    </Label>
                    <p className="text-sm sm:text-base font-semibold">
                      {loan.customer?.profession}
                    </p>
                  </div>
                )}
                {loan.customer?.company && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Company
                    </Label>
                    <p className="text-sm sm:text-base font-semibold">
                      {loan.customer?.company}
                    </p>
                  </div>
                )}
                {(loan.customer?.city || loan.customer?.state) && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      Location
                    </Label>
                    <p className="text-sm sm:text-base font-semibold">
                      {[loan.customer?.city, loan.customer?.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Branch Information */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Branch Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-green-50 rounded-lg">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Branch Name
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.branch?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Branch Code
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.branch?.code || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Loan Details
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Loan Number
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.loanNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Loan Type
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.loanType?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Status
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.status}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Principal Amount
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatCurrency(loan.principalAmount, loan.currencyCode)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Term
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.termCount} {loan.termUnit.toLowerCase()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Start Date
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatDate(loan.startDate)}
                  </p>
                </div>
                {loan.endDate && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-600">
                      End Date
                    </Label>
                    <p className="text-sm sm:text-base font-semibold">
                      {formatDate(loan.endDate)}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Processing Fee
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatCurrency(
                      loan.processingFeeAmount,
                      loan.currencyCode
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Created Date
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatDate(loan.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Information */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Staff Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-orange-50 rounded-lg">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Assigned Officer
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.assignedOfficer?.firstName &&
                      loan.assignedOfficer?.lastName
                      ? `${loan.assignedOfficer.firstName} ${loan.assignedOfficer.lastName}`
                      : loan.assignedOfficer?.email || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loan.assignedOfficer?.email || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {loan.assignedOfficer?.role
                      ?.toLowerCase()
                      .replace("_", " ") || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Created By
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {loan.createdBy?.firstName && loan.createdBy?.lastName
                      ? `${loan.createdBy.firstName} ${loan.createdBy.lastName}`
                      : loan.createdBy?.email || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loan.createdBy?.email || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {loan.createdBy?.role?.toLowerCase().replace("_", " ") ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Loan Type Constraints */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Loan Type Constraints
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 rounded-lg">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Minimum Amount
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatCurrency(
                      loan.loanType?.minAmount,
                      loan.currencyCode
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">
                    Maximum Amount
                  </Label>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatCurrency(
                      loan.loanType?.maxAmount,
                      loan.currencyCode
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {loan.notes && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Loan Notes
                  </h3>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-700">
                    {loan.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Action Selection */}
            <div className="space-y-4">
              <Label>Select Action</Label>
              <div className="flex gap-4">
                <Button
                  variant={action === "approve" ? "default" : "outline"}
                  onClick={() => setAction("approve")}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Loan
                </Button>
                <Button
                  variant={action === "reject" ? "destructive" : "outline"}
                  onClick={() => setAction("reject")}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Loan
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Decision Notes{" "}
                {action && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === "approve"
                    ? "Add any notes about the approval..."
                    : action === "reject"
                      ? "Provide reason for rejection..."
                      : "Select an action first..."
                }
                className="min-h-[100px]"
                disabled={!action}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Invalid Loan Data
            </p>
            <p className="text-sm text-gray-600">
              The loan data is incomplete or corrupted. Please try refreshing
              the page.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || !notes.trim() || isLoading}
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : action === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
            }
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {action === "approve" && "Approve Loan"}
            {action === "reject" && "Reject Loan"}
            {!action && "Select Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminLoanManagementPageContent() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  const [deleteLoanId, setDeleteLoanId] = useState<string | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);

  // Load pending loans
  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoading(true);
        const response = await loansApi.getAll();
        console.log("API Response:", response);
        console.log("Response data:", response.data);
        console.log("Response data type:", typeof response.data);
        console.log("Is response.data array?", Array.isArray(response.data));

        // The API returns { success: true, data: [loans], message: "...", pagination: {...} }
        let loansData: Loan[] = [];

        // Check if response.data exists and is an array
        if (response && response.data && Array.isArray(response.data)) {
          loansData = response.data as Loan[];
          console.log("Using response.data as array");
        } else if (
          response &&
          response.data &&
          typeof response.data === "object"
        ) {
          // Check if response.data has a 'data' property that contains the array
          if (response.data.data && Array.isArray(response.data.data)) {
            loansData = response.data.data as Loan[];
            console.log("Using response.data.data as array");
          } else {
            // Single loan object - wrap in array
            loansData = [response.data as Loan];
            console.log("Wrapping single object in array");
          }
        } else {
          console.warn("Unexpected API response structure:", response);
          loansData = [];
        }

        console.log("Processed loans data:", loansData);
        console.log("Loans count:", loansData.length);
        console.log(
          "Loan statuses:",
          loansData.map((loan) => ({ id: loan.id, status: loan.status }))
        );

        // Filter for pending loans by default
        const pendingLoans = loansData.filter(
          (loan: Loan) => loan.status === "PENDING_APPROVAL"
        );

        console.log("Pending loans found:", pendingLoans.length);
        console.log("Pending loans:", pendingLoans);

        setLoans(loansData);
        setFilteredLoans(pendingLoans);
      } catch (error: any) {
        console.error("Failed to load loans:", error);
        toast.error("Failed to load loans");
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = loans;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }

    // Branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter((loan) => loan.branchId === branchFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (loan) =>
          loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${loan.customer.firstName} ${loan.customer.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          loan.customer.phone.includes(searchTerm) ||
          loan.branch.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLoans(filtered);
  }, [loans, statusFilter, branchFilter, searchTerm]);

  const handleApproveLoan = async (notes: string) => {
    if (!selectedLoan) return;

    try {
      setProcessingLoanId(selectedLoan.id);

      // Call API to approve loan
      await loansApi.updateStatus(selectedLoan.id, {
        status: "APPROVED",
        notes: notes,
      });

      toast.success("Loan approved successfully");

      // Update local state
      setLoans((prev) =>
        prev.map((loan) =>
          loan.id === selectedLoan.id ? { ...loan, status: "APPROVED" } : loan
        )
      );

      setApprovalDialogOpen(false);
      setSelectedLoan(null);
    } catch (error: any) {
      console.error("Failed to approve loan:", error);
      toast.error("Failed to approve loan");
    } finally {
      setProcessingLoanId(null);
    }
  };

  const handleRejectLoan = async (notes: string) => {
    if (!selectedLoan) return;

    try {
      setProcessingLoanId(selectedLoan.id);

      // Call API to reject loan
      await loansApi.updateStatus(selectedLoan.id, {
        status: "REJECTED",
        notes: notes,
      });

      toast.success("Loan rejected successfully");

      // Update local state
      setLoans((prev) =>
        prev.map((loan) =>
          loan.id === selectedLoan.id ? { ...loan, status: "REJECTED" } : loan
        )
      );

      setApprovalDialogOpen(false);
      setSelectedLoan(null);
    } catch (error: any) {
      console.error("Failed to reject loan:", error);
      toast.error("Failed to reject loan");
    } finally {
      setProcessingLoanId(null);
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    // Find the loan to check its status
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    // Rules for Admin page (mostly triggered by Admins anyway, but good to be safe)
    const isAdmin = user?.role === "ADMIN";
    const isCreditOfficer = user?.role === "CREDIT_OFFICER";

    // On this admin page, we assume admins can delete anything.
    if (isAdmin) {
      setDeleteLoanId(loanId);
    } else {
      toast.error("Permission Denied", {
        description: "Only Admins can delete loans from this page.",
      });
    }
  };

  const confirmDeleteLoan = async () => {
    if (!deleteLoanId) return;

    setIsDeletingLoan(true);
    try {
      await loansApi.remove(deleteLoanId);
      setLoans((prev) => prev.filter((loan) => loan.id !== deleteLoanId));
      setDeleteLoanId(null);
      toast.success("Loan deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete loan");
    } finally {
      setIsDeletingLoan(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING_APPROVAL: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
      },
      APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
      ACTIVE: { label: "Active", color: "bg-blue-100 text-blue-800" },
      COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-800" },
      OVERDUE: { label: "Overdue", color: "bg-orange-100 text-orange-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Loading Loans...</p>
          <p className="text-sm text-gray-600">
            Please wait while we fetch the data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600 mt-1">
            Review and manage loan applications
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredLoans.length} loan{filteredLoans.length !== 1 ? "s" : ""}{" "}
          found
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search loans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {/* Add branch options here if needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("PENDING_APPROVAL");
                  setBranchFilter("all");
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">
                No loans found
              </p>
              <p className="text-sm text-gray-600">
                {statusFilter === "PENDING_APPROVAL"
                  ? "No pending loans to review"
                  : "No loans match your current filters"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          #{loan.loanNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {loan.customer
                                ? `${loan.customer.firstName} ${loan.customer.lastName}`
                                : "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {loan.customer?.phone || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{loan.branch?.name || "N/A"}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            loan.principalAmount,
                            loan.currencyCode
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell>{formatDate(loan.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "Review button clicked for loan:",
                                  loan
                                );
                                console.log("Loan customer:", loan.customer);
                                console.log("Loan branch:", loan.branch);
                                console.log("Loan loanType:", loan.loanType);
                                setSelectedLoan(loan);
                                setApprovalDialogOpen(true);
                              }}
                              disabled={processingLoanId === loan.id}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteLoan(loan.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {filteredLoans.map((loan) => (
                  <Card key={loan.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          #{loan.loanNumber}
                        </h3>
                        {getStatusBadge(loan.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Customer</p>
                          <p className="font-medium">
                            {loan.customer
                              ? `${loan.customer.firstName} ${loan.customer.lastName}`
                              : "N/A"}
                          </p>
                          <p className="text-gray-500">
                            {loan.customer?.phone || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Branch</p>
                          <p className="font-medium">
                            {loan.branch?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium">
                            {formatCurrency(
                              loan.principalAmount,
                              loan.currencyCode
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">
                            {formatDate(loan.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log(
                              "Mobile Review button clicked for loan:",
                              loan
                            );
                            console.log("Loan customer:", loan.customer);
                            console.log("Loan branch:", loan.branch);
                            console.log("Loan loanType:", loan.loanType);
                            setSelectedLoan(loan);
                            setApprovalDialogOpen(true);
                          }}
                          disabled={processingLoanId === loan.id}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review Loan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteLoan(loan.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Loan
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        isOpen={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false);
          setSelectedLoan(null);
        }}
        onApprove={handleApproveLoan}
        onReject={handleRejectLoan}
        loan={selectedLoan}
        isLoading={processingLoanId !== null}
      />

      <ConfirmationModal
        isOpen={!!deleteLoanId}
        title="Delete Loan"
        message="Are you sure you want to delete this loan? This action cannot be undone."
        onConfirm={confirmDeleteLoan}
        onCancel={() => setDeleteLoanId(null)}
        confirmButtonText={isDeletingLoan ? "Deleting..." : "Delete"}
        confirmButtonVariant="destructive"
        isLoading={isDeletingLoan}
        requireDeleteKeyword={true}
        deleteKeyword="DELETE"
      />
    </div>
  );
}

export default function AdminLoanManagementPage() {
  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Admin", href: "/dashboard/admin" },
              {
                label: "Loan Management",
                href: "/dashboard/admin/loan-management",
              },
            ]}
          />
          <AdminLoanManagementPageContent />
        </div>
      </div>
    </AdminOnly>
  );
}
