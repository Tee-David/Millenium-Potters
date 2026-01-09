"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { repaymentsApi, loansApi } from "@/lib/api";
import { handleDatabaseError } from "@/lib/api";

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  loan: {
    id: string;
    loanNumber: string;
    customerId: string;
    branchId: string;
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
      firstName: string;
      lastName: string;
      code: string;
    };
    branch: {
      id: string;
      name: string;
    };
    assignedOfficer: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData?: RepaymentSchedule;
  paymentType: "due_today" | "custom";
  onPaymentSuccess: () => void;
}

// Helper function to safely parse numbers
const safeParseNumber = (value: any): number => {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper function to check if amount exceeds maximum
const isAmountExceeded = (amount: string, maxAmount: number): boolean => {
  const parsedAmount = safeParseNumber(amount);
  return parsedAmount > maxAmount && parsedAmount > 0;
};

// Schedule-level metrics for "Pay Due Today" - shows amount for specific schedule item
const computeScheduleMetrics = (item: RepaymentSchedule) => {
  const safeTotalDue = safeParseNumber(item.totalDue);
  const safePaid = safeParseNumber(item.paidAmount);
  const totalLeftToPay = Math.max(0, safeTotalDue - safePaid);

  // Determine if due today or overdue
  const dueDate = new Date(item.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateMidnight = new Date(dueDate);
  dueDateMidnight.setHours(0, 0, 0, 0);

  const isOverdue = dueDateMidnight.getTime() < today.getTime();
  const isDueToday = dueDateMidnight.getTime() === today.getTime();

  // If it's due today or overdue, the remaining on this schedule is due
  const dueToday = isDueToday || isOverdue ? totalLeftToPay : 0;

  return {
    totalLeftToPay,
    dueToday,
    penaltyFee: 0,
    daysRemaining: Math.ceil(
      (dueDateMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ),
  };
};

// Loan-level metrics for "Pay Custom Amount" - shows total loan balance
const computeLoanMetrics = (item: RepaymentSchedule) => {
  const safePrincipal = safeParseNumber(item.loan.principalAmount);

  // Calculate total paid across all schedules (sum of all paidAmount)
  // Note: In a real scenario, you'd sum across all schedule items for this loan
  // For now, we'll use the schedule's paidAmount as an approximation
  const totalPaid = safeParseNumber(item.paidAmount);
  const totalLeftToPay = Math.max(0, safePrincipal - totalPaid);

  return {
    totalLeftToPay,
    principal: safePrincipal,
    totalPaid,
  };
};

export default function PaymentModal({
  isOpen,
  onClose,
  loanData,
  paymentType,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    notes: "",
  });

  const [paymentErrors, setPaymentErrors] = useState<{
    amount?: string;
    method?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [loanSummary, setLoanSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch loan summary when modal opens or loan changes
  useEffect(() => {
    if (isOpen && loanData) {
      fetchLoanSummary();
    }
  }, [isOpen, loanData?.loanId]);

  const fetchLoanSummary = async () => {
    if (!loanData) return;

    try {
      setSummaryLoading(true);
      const response = await loansApi.getSummary(loanData.loanId);
      const summary = response.data.data || response.data;
      setLoanSummary(summary);
      console.log("Loan summary fetched:", summary);
    } catch (error) {
      console.error("Failed to fetch loan summary:", error);
      toast.error("Failed to fetch loan payment information");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Compute metrics based on payment type
  const scheduleMetrics = useMemo(() => {
    if (!loanData) return null;
    return computeScheduleMetrics(loanData);
  }, [loanData]);

  const loanMetrics = useMemo(() => {
    if (!loanData) return null;

    // If we have the loan summary from the backend, use that (source of truth)
    if (loanSummary && !summaryLoading) {
      const safePrincipal = safeParseNumber(loanSummary.principalAmount);
      const totalPaid = safeParseNumber(loanSummary.totalPaid);
      const totalLeftToPay = safeParseNumber(loanSummary.totalOutstanding);

      return {
        totalLeftToPay,
        principal: safePrincipal,
        totalPaid,
      };
    }

    // Fallback to computing from schedule item if summary not available
    return computeLoanMetrics(loanData);
  }, [loanData, loanSummary, summaryLoading]);

  // Determine which metrics to use based on payment type
  const displayMetrics = useMemo(() => {
    if (!loanData || !loanMetrics) return null;

    if (paymentType === "due_today") {
      // For "Pay Due Today", show schedule-specific metrics
      const metrics = computeScheduleMetrics(loanData);
      return {
        totalLeftToPay: metrics.totalLeftToPay,
        dueToday: metrics.dueToday,
        maxAmount: metrics.totalLeftToPay, // Can't pay more than this schedule's balance
      };
    } else {
      // For "Custom Amount", show total loan balance (use loanMetrics which has the correct data)
      return {
        totalLeftToPay: loanMetrics.totalLeftToPay,
        dueToday: loanMetrics.totalLeftToPay,
        maxAmount: loanMetrics.totalLeftToPay, // Can't pay more than total left to pay
      };
    }
  }, [loanData, loanMetrics, paymentType]);

  // Real-time validation for payment amount
  const amountExceedsMax = useMemo(() => {
    if (!paymentForm.amount || !displayMetrics) return false;

    const enteredAmount = parseFloat(paymentForm.amount);
    if (isNaN(enteredAmount)) return false;

    return enteredAmount > displayMetrics.maxAmount;
  }, [paymentForm.amount, displayMetrics]);

  const isPaymentAmountValid = useMemo(() => {
    if (!paymentForm.amount || !displayMetrics) return false;

    const enteredAmount = parseFloat(paymentForm.amount);
    if (isNaN(enteredAmount) || enteredAmount <= 0) return false;

    return enteredAmount <= displayMetrics.maxAmount;
  }, [paymentForm.amount, displayMetrics]);

  // Initialize amount when modal opens
  useMemo(() => {
    if (isOpen && loanData && displayMetrics) {
      const initialAmount =
        paymentType === "due_today" ? displayMetrics.dueToday.toString() : "";
      setPaymentForm({
        amount: initialAmount,
        method: "cash",
        notes: "",
      });
      setPaymentErrors({});
    }
  }, [isOpen, loanData, paymentType, displayMetrics]);

  // Optimized payment validation with memoization
  const validatePaymentForm = useMemo(() => {
    return () => {
      const errors: { amount?: string; method?: string } = {};

      if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
        errors.amount = "Please enter a valid payment amount";
      } else if (displayMetrics) {
        if (parseFloat(paymentForm.amount) > displayMetrics.maxAmount) {
          errors.amount = `Amount cannot exceed total left to pay (${formatCurrency(
            displayMetrics.maxAmount
          )})`;
        }
      }

      if (!paymentForm.method) {
        errors.method = "Please select a payment method";
      }

      setPaymentErrors(errors);
      return Object.keys(errors).length === 0;
    };
  }, [paymentForm.amount, paymentForm.method, displayMetrics]);

  const processPayment = async () => {
    if (!loanData || !validatePaymentForm()) return;

    try {
      setLoading(true);

      const amount = parseFloat(paymentForm.amount);

      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Create payment record with validation
      const paymentData = {
        loanId: loanData.loanId,
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
            paymentType === "due_today" ? "Due Today" : "Custom Amount"
          }`,
      };

      // Call repayment API
      const response = await repaymentsApi.create(paymentData);

      if (response.data?.success || response.status === 200) {
        toast.success(
          `Payment of ${formatCurrency(amount)} processed successfully!`
        );
        setPaymentForm({ amount: "", method: "cash", notes: "" });
        setPaymentErrors({});
        onPaymentSuccess();
        onClose();
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

  if (!isOpen || !loanData || !displayMetrics) return null;

  // Check if loan is fully settled
  const isLoanFullySettled = loanMetrics && loanMetrics.totalLeftToPay === 0;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isLoanFullySettled
                ? "Loan Completed"
                : paymentType === "due_today"
                ? "Pay Due Today"
                : "Pay Custom Amount"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>

          {isLoanFullySettled ? (
            <div className="space-y-4">
              {/* Completion Message */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Loan Fully Settled!
                </h2>
                <p className="text-green-700 mb-4">
                  This loan has been completely paid off and is now closed.
                </p>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Loan Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {loanData.loan?.loanNumber}
                  </p>
                  <p className="text-sm text-gray-600 mt-3">Customer</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {loanData.loan?.customer?.firstName}{" "}
                    {loanData.loan?.customer?.lastName}
                  </p>
                </div>
                <div className="bg-emerald-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-emerald-700">Total Amount Paid</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(loanMetrics?.totalPaid || 0)}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  No further payments are required for this loan.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Loan Information Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Loan Number</p>
                    <p className="font-semibold text-blue-900">
                      {loanData.loan?.loanNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-semibold text-blue-900">
                      {loanData.loan?.customer?.firstName}{" "}
                      {loanData.loan?.customer?.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Balance Summary - TOTAL LOAN LEVEL */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-emerald-900 mb-3 uppercase tracking-wide">
                  Loan Balance Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                    <span className="text-sm text-gray-600">
                      Principal Amount
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(loanMetrics?.principal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                    <span className="text-sm text-gray-600">Paid So Far</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(loanMetrics?.totalPaid || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 bg-emerald-100 px-3 py-2 rounded">
                    <span className="text-sm font-bold text-emerald-900">
                      Total Left to Pay
                    </span>
                    <span className="font-bold text-lg text-emerald-700">
                      {formatCurrency(loanMetrics?.totalLeftToPay || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Payment Schedule Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  This Payment Schedule
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Schedule Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(loanData.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Due Today (This Schedule)</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(displayMetrics.dueToday)}
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
                        paymentErrors.amount || amountExceedsMax
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      max={displayMetrics.maxAmount}
                    />
                  </div>
                  {paymentErrors.amount && (
                    <p className="text-red-500 text-xs mt-1">
                      {paymentErrors.amount}
                    </p>
                  )}
                  {amountExceedsMax && (
                    <p className="text-red-500 text-xs mt-1 font-medium animate-pulse">
                      ⚠️ Amount exceeds maximum allowed! Cannot exceed{" "}
                      {formatCurrency(displayMetrics.maxAmount)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {formatCurrency(displayMetrics.maxAmount)}
                  </p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Add payment notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={processPayment}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={
                    loading ||
                    Object.keys(paymentErrors).length > 0 ||
                    !isPaymentAmountValid ||
                    amountExceedsMax
                  }
                >
                  {loading ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
