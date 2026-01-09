"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileContainer } from "@/components/MobileResponsive";
import {
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  User,
  FileText,
  CreditCard,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { enhancedApi } from "@/lib/api";

interface BranchTransfer {
  id: string;
  userId: string;
  fromBranchId?: string;
  toBranchId: string;
  reason?: string;
  transferDate: string;
  effectiveDate: string;
  createdByUserId: string;
  customersTransferred: number;
  loansTransferred: number;
  repaymentsTransferred: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    role: string;
  };
  fromBranch?: {
    id: string;
    name: string;
    code: string;
  };
  toBranch: {
    id: string;
    name: string;
    code: string;
  };
  createdBy: {
    id: string;
    email: string;
  };
}

export default function BranchTransferDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const transferId = params.id as string;

  const [transfer, setTransfer] = useState<BranchTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (transferId) {
      loadTransferData();
    }
  }, [transferId]);

  const loadTransferData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await enhancedApi.branchTransfers.getById(transferId);
      setTransfer(response.data.data || response.data);
    } catch (error: any) {
      console.error("Failed to load transfer:", error);
      setError(
        error.response?.data?.message || "Failed to load transfer details"
      );
      toast.error("Failed to load transfer details");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!transfer) return;

    setExecuting(true);
    try {
      await enhancedApi.branchTransfers.execute(transfer.id);
      toast.success("Transfer executed successfully");
      loadTransferData(); // Refresh data
    } catch (error: any) {
      console.error("Execute transfer error:", error);
      toast.error(
        error.response?.data?.message || "Failed to execute transfer"
      );
    } finally {
      setExecuting(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!transfer) return;

    setCancelling(true);
    try {
      await enhancedApi.branchTransfers.cancel(transfer.id);
      toast.success("Transfer cancelled successfully");
      loadTransferData(); // Refresh data
    } catch (error: any) {
      console.error("Cancel transfer error:", error);
      toast.error(error.response?.data?.message || "Failed to cancel transfer");
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-600 text-xl font-medium">
              Loading transfer details...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Please wait while we fetch transfer information
            </p>
          </div>
        </div>
      </MobileContainer>
    );
  }

  if (error || !transfer) {
    return (
      <MobileContainer>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {error ? "Error Loading Transfer" : "Transfer Not Found"}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The transfer you're looking for could not be found"}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="px-6"
              >
                Go Back
              </Button>
              <Button onClick={loadTransferData} className="px-6">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                <ArrowRightLeft className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Branch Transfer Details
                </h1>
                <p className="text-gray-600 mt-1">Transfer ID: {transfer.id}</p>
              </div>
            </div>
          </div>

          {/* Status Header */}
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-white to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transfer.status)}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Transfer Status
                      </h3>
                      <Badge className={getStatusColor(transfer.status)}>
                        {transfer.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-lg">
                    {formatDateTime(transfer.transferDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - User & Branch Info */}
            <div className="space-y-6">
              {/* User Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-6 w-6 text-emerald-600" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm">
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <User className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-900">
                        {transfer.user.firstName && transfer.user.lastName
                          ? `${transfer.user.firstName} ${transfer.user.lastName}`
                          : transfer.user.name || transfer.user.email}
                      </p>
                      <p className="text-gray-600">{transfer.user.email}</p>
                      <Badge variant="outline" className="mt-2">
                        {transfer.user.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transfer Initiator Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-6 w-6 text-purple-600" />
                    Transfer Initiated By
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-900">
                        {transfer.createdBy?.email || "Unknown"}
                      </p>
                      <p className="text-gray-600">Transfer Initiator</p>
                      <Badge variant="outline" className="mt-2">
                        Administrator
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branch Transfer */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    Branch Transfer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-white rounded-xl border shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-full">
                        <Building2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">From Branch</p>
                        <p className="text-lg font-semibold">
                          {transfer.fromBranch
                            ? `${transfer.fromBranch.name}`
                            : "No Branch"}
                        </p>
                        {transfer.fromBranch && (
                          <p className="text-sm text-gray-400">
                            {transfer.fromBranch.code}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Building2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">To Branch</p>
                        <p className="text-lg font-semibold">
                          {transfer.toBranch.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {transfer.toBranch.code}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Dates & Details */}
            <div className="space-y-6">
              {/* Important Dates */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Transfer Date</p>
                        <p className="text-lg font-semibold">
                          {formatDateTime(transfer.transferDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm">
                      <div className="p-3 bg-emerald-100 rounded-full">
                        <Calendar className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Effective Date</p>
                        <p className="text-lg font-semibold">
                          {formatDateTime(transfer.effectiveDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-6 w-6 text-amber-600" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transfer.reason && (
                    <div className="p-4 bg-white rounded-xl border shadow-sm">
                      <p className="text-sm text-gray-500 mb-2">Reason</p>
                      <p className="text-gray-900">{transfer.reason}</p>
                    </div>
                  )}

                  {transfer.notes && (
                    <div className="p-4 bg-white rounded-xl border shadow-sm">
                      <p className="text-sm text-gray-500 mb-2">Notes</p>
                      <p className="text-gray-900">{transfer.notes}</p>
                    </div>
                  )}

                  <div className="p-4 bg-white rounded-xl border shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">Created By</p>
                    <p className="text-gray-900">{transfer.createdBy.email}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Data Migration Summary - Only for completed transfers */}
          {transfer.status === "completed" && (
            <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Data Migration Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-8 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                    <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {transfer.customersTransferred}
                    </div>
                    <div className="text-lg font-medium text-blue-600">
                      Customers Transferred
                    </div>
                  </div>
                  <div className="text-center p-8 bg-white rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors shadow-sm">
                    <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {transfer.loansTransferred}
                    </div>
                    <div className="text-lg font-medium text-green-600">
                      Loans Transferred
                    </div>
                  </div>
                  <div className="text-center p-8 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors shadow-sm">
                    <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {transfer.repaymentsTransferred}
                    </div>
                    <div className="text-lg font-medium text-purple-600">
                      Repayments Transferred
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {transfer.status === "pending" && (
                  <>
                    <Button
                      onClick={handleExecuteTransfer}
                      disabled={executing}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {executing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Execute Transfer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelTransfer}
                      disabled={cancelling}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {cancelling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Transfer
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="flex-1 sm:flex-none border-2 hover:bg-gray-50 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Transfers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}
