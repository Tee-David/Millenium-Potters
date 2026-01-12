"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Copy,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  Shield,
  Eye,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { repaymentsApi, loansApi, handleDatabaseError } from "@/lib/api";
import { toast } from "sonner";
import { formatNaira } from "@/utils/currency";
import { useAuth } from "@/hooks/useAuth";
import { StaffOnly } from "@/components/auth/RoleGuard";

interface LoanScheduleData {
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
      profession: string | null;
      company: string | null;
      city: string;
      state: string;
      country: string;
      zipCode: string | null;
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
      passwordHash: string;
      role: string;
      isActive: boolean;
      branchId: string;
      firstName: string | null;
      lastName: string | null;
      phone: string;
      address: string;
      profileImage: string | null;
      lastLoginAt: string;
      lastActivityAt: string;
      loginCount: number;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
  };
  schedule: Array<{
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
    allocations: Array<{
      id: string;
      repaymentId: string;
      scheduleItemId: string;
      amount: string;
      createdAt: string;
      repayment: {
        id: string;
        amount: string;
        method: string;
        paidAt: string;
        reference: string | null;
        notes: string | null;
        receivedBy: {
          id: string;
          email: string;
        };
      };
    }>;
  }>;
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case "PAID":
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    case "PARTIAL":
      return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    case "PENDING":
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    case "OVERDUE":
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getLoanStatusBadge = (status: string) => {
  if (!status) {
    return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
  }
  switch (status.toUpperCase()) {
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "ACTIVE":
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
      );
    case "CLOSED":
      return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
    case "PENDING_APPROVAL":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Pending Approval
        </Badge>
      );
    case "DRAFT":
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

function LoanScheduleDetailsPageContent() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const loanId = params.loanId as string;

  const [scheduleData, setScheduleData] = useState<LoanScheduleData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load loan schedule data
  useEffect(() => {
    const loadScheduleData = async () => {
      if (!loanId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await repaymentsApi.getRepaymentSchedule(loanId);

        // Handle the API response structure: { success, message, data }
        if (response.data && response.data.success && response.data.data) {
          setScheduleData(response.data.data);
        } else if (response.data) {
          // Fallback: if response.data is the schedule object directly
          setScheduleData(response.data);
        } else {
          throw new Error("Failed to load loan schedule data");
        }
      } catch (err: any) {
        console.error("Failed to load loan schedule data:", err);

        const errorMessage = handleDatabaseError(err);
        const errorText =
          typeof errorMessage === "string" ? errorMessage : "An error occurred";
        setError(errorText);
        toast.error(errorText);
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [loanId]);

  const exportToExcel = () => {
    if (!scheduleData) return;

    try {
      setExporting(true);
      const { loan, schedule } = scheduleData;

      // Prepare data for Excel
      const exportData = schedule.map((item) => ({
        Sequence: item.sequence,
        "Due Date": new Date(item.dueDate).toLocaleDateString("en-GB"),
        "Principal Due": Number(item.principalDue),
        "Interest Due": Number(item.interestDue),
        "Total Due": Number(item.totalDue),
        "Paid Amount": Number(item.paidAmount),
        Status: item.status,
      }));

      // Add summary rows
      const totalDue = schedule.reduce(
        (sum, item) => sum + Number(item.totalDue),
        0
      );
      const totalPaid = schedule.reduce(
        (sum, item) => sum + Number(item.paidAmount),
        0
      );

      exportData.push({
        Sequence: 0,
        "Due Date": "SUMMARY",
        "Principal Due": 0,
        "Interest Due": 0,
        "Total Due": totalDue,
        "Paid Amount": totalPaid,
        Status: `Outstanding: ${totalDue - totalPaid}`,
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 12 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      worksheet["!cols"] = columnWidths;

      // Add title and loan info
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ["LOAN REPAYMENT SCHEDULE"],
          [`Loan Number: ${loan.loanNumber}`],
          [
            `Customer: ${loan.customer?.firstName || ""} ${
              loan.customer?.lastName || ""
            }`.trim(),
          ],
          [
            `Principal Amount: ₦${Number(
              loan.principalAmount
            ).toLocaleString()}`,
          ],
          [`Status: ${loan.status}`],
          [],
        ],
        { origin: "A1" }
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Repayment Schedule");
      XLSX.writeFile(
        workbook,
        `Loan_${loan.loanNumber}_Schedule_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      toast.success("Schedule exported to Excel successfully!");
    } catch (error) {
      console.error("Export to Excel error:", error);
      toast.error("Failed to export to Excel");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    if (!scheduleData) return;

    try {
      setExporting(true);
      const { loan, schedule } = scheduleData;

      // Create PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Add title
      doc.setFontSize(18);
      doc.setFont("", "bold");
      doc.text("LOAN REPAYMENT SCHEDULE", margin, 20);

      // Add loan information
      doc.setFontSize(10);
      doc.setFont("", "normal");
      let yPosition = 30;

      const loanInfo = [
        `Loan Number: ${loan.loanNumber || "N/A"}`,
        `Customer: ${loan.customer?.firstName || ""} ${
          loan.customer?.lastName || ""
        }`.trim(),
        `Principal Amount: ₦${Number(loan.principalAmount).toLocaleString()}`,
        `Status: ${loan.status}`,
        `Term: ${loan.termCount} ${loan.termUnit?.toLowerCase() || ""}(s)`,
        `Start Date: ${
          loan.startDate
            ? new Date(loan.startDate).toLocaleDateString("en-GB")
            : "N/A"
        }`,
        `End Date: ${
          loan.endDate
            ? new Date(loan.endDate).toLocaleDateString("en-GB")
            : "N/A"
        }`,
      ];

      loanInfo.forEach((info) => {
        const text = String(info || " ");
        doc.text(text, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Prepare table data
      const tableData: string[][] = schedule.map((item) => [
        String(item.sequence),
        item.dueDate
          ? new Date(item.dueDate).toLocaleDateString("en-GB")
          : "N/A",
        `₦${Number(item.principalDue).toLocaleString()}`,
        `₦${Number(item.interestDue).toLocaleString()}`,
        `₦${Number(item.totalDue).toLocaleString()}`,
        `₦${Number(item.paidAmount).toLocaleString()}`,
        String(item.status),
      ]);

      // Add summary row
      const totalDue = schedule.reduce(
        (sum, item) => sum + Number(item.totalDue),
        0
      );
      const totalPaid = schedule.reduce(
        (sum, item) => sum + Number(item.paidAmount),
        0
      );

      tableData.push([
        "",
        "SUMMARY",
        "",
        "",
        `₦${totalDue.toLocaleString()}`,
        `₦${totalPaid.toLocaleString()}`,
        `Outstanding: ₦${(totalDue - totalPaid).toLocaleString()}`,
      ]);

      // Add table using autotable
      (doc as any).autoTable({
        head: [
          [
            "Seq",
            "Due Date",
            "Principal",
            "Interest",
            "Total Due",
            "Paid",
            "Status",
          ],
        ],
        body: tableData,
        startY: yPosition,
        margin: margin,
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        footerStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      // Add footer with date and page numbers
      const now = new Date().toLocaleString("en-GB");
      const pageCount = (doc as any).internal.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("", "normal");
        doc.text(
          `Generated on: ${now} | Page ${i} of ${pageCount}`,
          margin,
          pageHeight - 10
        );
      }

      doc.save(
        `Loan_${String(loan.loanNumber || "Schedule")}_Schedule_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      toast.success("Schedule exported to PDF successfully!");
    } catch (error) {
      console.error("Export to PDF error:", error);
      toast.error("Failed to export to PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading loan schedule details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheduleData) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error Loading Loan Schedule
                </h3>
                <p className="text-red-600 mb-4">
                  {error || "Loan schedule not found"}
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

  const { loan, schedule } = scheduleData;

  // Check if loan is completed/closed - show completion message
  if (loan.status === "COMPLETED" || loan.status === "CLOSED") {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
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
                <span>Repayment Schedules</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-gray-900">
                  {loan.loanNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 max-w-md mx-auto">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                  Loan Completed
                </h3>
                <p className="text-emerald-600 mb-4">
                  This loan has been fully paid and completed. The repayment
                  schedule is no longer active.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Link href="/dashboard/business-management/loan-payment/repayment-schedules">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      View All Schedules
                    </Button>
                  </Link>
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
              <span>Repayment Schedules</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                {loan.loanNumber}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  Loan Repayment Schedule
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                  Detailed view of payment schedule and history for{" "}
                  {loan.loanNumber}
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
                    Assigned Loan
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loan Overview */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-6 sm:p-8 rounded-xl border border-blue-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-800">
                Loan Overview
              </h3>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-900">
                {formatNaira(Number(loan.principalAmount))}
              </p>
              <p className="text-sm text-blue-700 font-medium">
                Principal Amount
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4">
              {getLoanStatusBadge(loan.status)}
              <Badge
                variant="outline"
                className="px-4 py-2 text-base font-medium"
              >
                <User className="w-5 h-5 mr-2" />
                {loan.assignedOfficer?.firstName &&
                loan.assignedOfficer?.lastName
                  ? `${loan.assignedOfficer.firstName} ${loan.assignedOfficer.lastName}`
                  : loan.assignedOfficer?.email || "Unassigned"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10 mb-8">
          {/* Loan Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                Loan Information
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Basic loan details and terms
              </p>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Loan Number
                  </Label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {loan.loanNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Loan ID
                  </Label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {loan.id}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Start Date
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {new Date(loan.startDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    End Date
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {new Date(loan.endDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Term
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {loan.termCount} {loan.termUnit?.toLowerCase() || ""}(s)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Processing Fee
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {formatNaira(Number(loan.processingFeeAmount))}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Assigned Officer
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {loan.assignedOfficer?.firstName &&
                    loan.assignedOfficer?.lastName
                      ? `${loan.assignedOfficer.firstName} ${loan.assignedOfficer.lastName}`
                      : loan.assignedOfficer?.email || "Unassigned"}
                  </p>
                </div>
              </div>
              {loan.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Notes
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                    {loan.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                Customer Information
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Customer details and contact information
              </p>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Customer Name
                </Label>
                <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {loan.customer?.firstName || "N/A"} {loan.customer?.lastName || ""}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Customer Code
                </Label>
                <p className="text-sm font-mono text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {loan.customer?.code || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Phone Number
                </Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {loan.customer?.phone || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Email Address
                </Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {loan.customer?.email || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Address
                </Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {loan.customer?.address || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repayment Schedule Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              Repayment Schedule
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Payment schedule and allocation details
            </p>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
            {schedule && schedule.length > 0 ? (
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
                        Principal Due
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Interest Due
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Total Due
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Paid Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.map((scheduleItem) => (
                      <tr
                        key={scheduleItem.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                {scheduleItem.sequence}
                              </span>
                            </div>
                            <span>#{scheduleItem.sequence}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(scheduleItem.dueDate).toLocaleDateString(
                            "en-GB",
                            {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatNaira(Number(scheduleItem.principalDue))}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatNaira(Number(scheduleItem.interestDue))}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {formatNaira(Number(scheduleItem.totalDue))}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {formatNaira(Number(scheduleItem.paidAmount))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(scheduleItem.status)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex space-x-2">
                            {scheduleItem.allocations &&
                              scheduleItem.allocations.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Show payment allocations
                                    toast.info(
                                      `Viewing ${scheduleItem.allocations.length} payment(s) for this schedule item`
                                    );
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No Schedule Items
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No repayment schedule items have been generated for this
                    loan yet.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

          {/* Export Schedule Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={
                  exporting ||
                  !scheduleData ||
                  !scheduleData.schedule ||
                  scheduleData.schedule.length === 0
                }
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                {exporting ? "Exporting..." : "Export Schedule"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel} disabled={exporting}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} disabled={exporting}>
                <FileText className="w-4 h-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/dashboard/business-management/loan-payment/repayment-schedules">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-12 text-base font-medium"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View All Schedules
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoanScheduleDetailsPage() {
  return (
    <StaffOnly>
      <LoanScheduleDetailsPageContent />
    </StaffOnly>
  );
}
