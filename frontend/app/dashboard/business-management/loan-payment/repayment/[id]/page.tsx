"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Eye,
  CreditCard,
  Users,
  TrendingUp,
  Copy,
  ArrowLeft,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Building2,
  CreditCardIcon,
  Zap,
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
  FilterX,
  FileText,
} from "lucide-react";
import { formatNaira } from "@/utils/currency";
import { repaymentsApi, handleDatabaseError } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { StaffOnly } from "@/components/auth/RoleGuard";
import Link from "next/link";

interface RepaymentWithDetails {
  id: string;
  loanId: string;
  receivedByUserId: string;
  amount: string;
  currencyCode: string;
  paidAt: string;
  method: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  loan: {
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
    endDate: string;
    processingFeeAmount: string;
    processingFeeCollected: boolean;
    penaltyFeePerDayAmount: string;
    status: string;
    createdByUserId: string;
    assignedOfficerId: string;
    disbursedAt: string | null;
    closedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    customer: {
      id: string;
      code: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string | null;
      address: string;
      dateOfBirth: string;
      gender: string;
      maritalStatus: string;
      profession: string;
      company: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
      note: string | null;
      branchId: string;
      currentOfficerId: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
    branch: {
      id: string;
      name: string;
      code: string;
      managerId: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
    assignedOfficer: {
      id: string;
      email: string;
      role: string;
    };
    createdBy: {
      id: string;
      email: string;
      role: string;
    };
  };
  receivedBy: {
    id: string;
    email: string;
    role: string;
  };
  allocations: Array<{
    id: string;
    repaymentId: string;
    scheduleItemId: string;
    amount: string;
    createdAt: string;
    scheduleItem: {
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
      closedAt: string | null;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
  }>;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card Payment" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHEQUE", label: "Cheque" },
];

const getPaymentMethodStyle = (method: string) => {
  switch (method) {
    case "CASH":
      return {
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-200",
        icon: DollarSign,
      };
    case "TRANSFER":
      return {
        variant: "default" as const,
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Building2,
      };
    case "CARD":
      return {
        variant: "default" as const,
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: CreditCardIcon,
      };
    case "MOBILE_MONEY":
      return {
        variant: "default" as const,
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Zap,
      };
    case "CHEQUE":
      return {
        variant: "default" as const,
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: FileText,
      };
    default:
      return {
        variant: "default" as const,
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: CreditCard,
      };
  }
};

const getPaymentStatus = (repayment: RepaymentWithDetails) => {
  const paidDate = new Date(repayment.paidAt);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    return {
      label: "Recent",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock,
    };
  } else if (daysDiff <= 7) {
    return {
      label: "Successful",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    };
  } else {
    return {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: CheckCircle,
    };
  }
};

function RepaymentDetailsPageContent() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const repaymentId = params.id as string;

  const [repayment, setRepayment] = useState<RepaymentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load repayment details
  useEffect(() => {
    const loadRepaymentDetails = async () => {
      if (!repaymentId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await repaymentsApi.getById(repaymentId);

        // Handle the API response structure: { success, message, data }
        if (response.data && response.data.success && response.data.data) {
          setRepayment(response.data.data);
        } else if (response.data) {
          // Fallback: if response.data is the repayment object directly
          setRepayment(response.data);
        } else {
          throw new Error("Failed to load repayment details");
        }
      } catch (err: any) {
        console.error("Failed to load repayment details:", err);

        const errorMessage = handleDatabaseError(err);
        const errorText =
          typeof errorMessage === "string" ? errorMessage : "An error occurred";
        setError(errorText);
        toast.error(errorText);
      } finally {
        setLoading(false);
      }
    };

    loadRepaymentDetails();
  }, [repaymentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading repayment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !repayment) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error Loading Repayment
                </h3>
                <p className="text-red-600 mb-4">
                  {error || "Repayment not found"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header with Back Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Loan Repayments</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                Repayment Details
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  Repayment Details
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                  Comprehensive view of payment information and allocations
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentUser?.role === "BRANCH_MANAGER" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Branch View
                  </Badge>
                )}
                {currentUser?.role === "CREDIT_OFFICER" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Assigned Loans
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Repayment Details Content */}
        <div className="space-y-8 sm:space-y-10">
          {/* Payment Overview */}
          <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 p-6 sm:p-8 rounded-xl border border-emerald-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-800">
                  Payment Amount
                </h3>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-900">
                  {formatNaira(Number(repayment.amount))}
                </p>
                <p className="text-sm text-emerald-700 font-medium">
                  Payment processed successfully
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4">
                {(() => {
                  const methodStyle = getPaymentMethodStyle(repayment.method);
                  const statusInfo = getPaymentStatus(repayment);
                  const MethodIcon = methodStyle.icon;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <>
                      <Badge
                        variant={methodStyle.variant}
                        className={`${methodStyle.className} px-4 py-2 text-base font-medium`}
                      >
                        <MethodIcon className="w-5 h-5 mr-2" />
                        {repayment.method}
                      </Badge>
                      <Badge
                        variant="default"
                        className={`${statusInfo.className} px-4 py-2 text-base font-medium`}
                      >
                        <StatusIcon className="w-5 h-5 mr-2" />
                        {statusInfo.label}
                      </Badge>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Main Details Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
            {/* Payment Information */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  Payment Information
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Transaction details and payment metadata
                </p>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Payment ID
                    </Label>
                    <p className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {repayment.id}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Reference
                    </Label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {repayment.reference || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Payment Date
                    </Label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {new Date(repayment.paidAt).toLocaleDateString("en-GB", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Payment Time
                    </Label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {new Date(repayment.paidAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {repayment.notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Notes
                    </Label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                      {repayment.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer & Loan Information */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  Customer & Loan Details
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Customer information and loan details
                </p>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Customer
                  </Label>
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {(() => {
                      // Handle both customer and unionMember (backend uses unionMember)
                      const member = (repayment.loan as any)?.customer || (repayment.loan as any)?.unionMember;
                      return member
                        ? `${member.firstName} ${member.lastName}`
                        : "N/A";
                    })()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Loan Number
                  </Label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {repayment.loan?.loanNumber || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Loan ID
                  </Label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {repayment.loanId}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Received By
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {repayment.receivedBy?.email || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Allocations */}
          {repayment.allocations && repayment.allocations.length > 0 && (
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  Payment Allocations
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  This payment was allocated to the following schedule items
                </p>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Sequence
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Allocated Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {repayment.allocations.map((allocation) => (
                        <tr
                          key={allocation.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {allocation.scheduleItem?.sequence || "N/A"}
                                </span>
                              </div>
                              <span>
                                #{allocation.scheduleItem?.sequence || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {allocation.scheduleItem?.dueDate
                              ? new Date(
                                  allocation.scheduleItem.dueDate
                                ).toLocaleDateString("en-GB", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {formatNaira(Number(allocation.amount))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 px-3 py-1 font-medium"
                            >
                              Allocated
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 sm:pt-8 border-t border-gray-200 bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none h-12 text-base font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => {
                if (repayment.reference) {
                  navigator.clipboard.writeText(repayment.reference);
                  toast.success("Reference copied to clipboard");
                } else {
                  toast.error("No reference to copy");
                }
              }}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
            >
              <Copy className="w-5 h-5 mr-2" />
              Copy Reference
            </Button>
            <Link href="/dashboard/business-management/loan-payment/repayment">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none h-12 text-base font-medium"
              >
                <Eye className="w-5 h-5 mr-2" />
                View All Repayments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RepaymentDetailsPage() {
  return (
    <StaffOnly>
      <RepaymentDetailsPageContent />
    </StaffOnly>
  );
}
