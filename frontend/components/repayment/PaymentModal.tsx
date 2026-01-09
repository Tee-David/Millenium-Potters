"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData?: {
    id: string;
    loanId: string;
    sequence: number;
    dueDate: string;
    totalDue: number;
    paidAmount: number;
    status: string;
    loan: {
      loanNumber: string;
      principalAmount: number;
      termUnit: "DAY" | "WEEK" | "MONTH";
      maxTerm: number;
      startDate: string;
      dueDate: string;
      customer: {
        firstName: string;
        lastName: string;
      };
    };
  };
  onPayment: (amount: number, type: "due" | "custom") => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  loanData,
  onPayment,
}: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<"due" | "custom">("due");
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  // Calculate due today amount based on your requirements
  const calculateDueToday = () => {
    if (!loanData) return 0;

    const today = new Date();
    const dueDate = new Date(loanData.dueDate);
    const startDate = new Date(loanData.loan.startDate);

    // Calculate total days between start and due date
    const totalDays = Math.ceil(
      (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate days remaining from today to due date
    const daysRemaining = Math.max(
      1,
      Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate remaining amount to pay
    const remainingAmount = loanData.totalDue - loanData.paidAmount;

    // Due today = remaining amount / days remaining
    const dueToday = Math.ceil(remainingAmount / daysRemaining);

    return Math.min(dueToday, remainingAmount); // Don't exceed remaining amount
  };

  const dueTodayAmount = calculateDueToday();

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const amount =
        paymentType === "due"
          ? dueTodayAmount
          : Number.parseFloat(customAmount);

      if (paymentType === "custom") {
        if (!customAmount || isNaN(amount) || amount <= 0) {
          toast.error("Please enter a valid amount");
          return;
        }
        if (amount > loanData!.totalDue - loanData!.paidAmount) {
          toast.error("Amount cannot exceed the remaining balance");
          return;
        }
      }

      await onPayment(amount, paymentType);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingAmount = loanData
    ? loanData.totalDue - loanData.paidAmount
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {loanData && (
          <div className="space-y-4">
            {/* Loan Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Loan Information
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Loan #:</span>{" "}
                  {loanData.loan.loanNumber}
                </p>
                <p>
                  <span className="font-medium">Customer:</span>{" "}
                  {loanData.loan.customer.firstName}{" "}
                  {loanData.loan.customer.lastName}
                </p>
                <p>
                  <span className="font-medium">Schedule #:</span>{" "}
                  {loanData.sequence}
                </p>
                <p>
                  <span className="font-medium">Due Date:</span>{" "}
                  {new Date(loanData.dueDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Total Due:</span>{" "}
                  {formatCurrency(loanData.totalDue)}
                </p>
                <p>
                  <span className="font-medium">Paid:</span>{" "}
                  {formatCurrency(loanData.paidAmount)}
                </p>
                <p>
                  <span className="font-medium">Remaining:</span>{" "}
                  <span className="text-emerald-600 font-medium">
                    {formatCurrency(remainingAmount)}
                  </span>
                </p>
              </div>
            </div>

            {/* Payment Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Payment Type</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="due"
                    checked={paymentType === "due"}
                    onChange={(e) =>
                      setPaymentType(e.target.value as "due" | "custom")
                    }
                    className="text-emerald-600"
                  />
                  <span>Pay Due Today ({formatCurrency(dueTodayAmount)})</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="custom"
                    checked={paymentType === "custom"}
                    onChange={(e) =>
                      setPaymentType(e.target.value as "due" | "custom")
                    }
                    className="text-emerald-600"
                  />
                  <span>Pay Custom Amount</span>
                </label>
              </div>
            </div>

            {/* Custom Amount Input */}
            {paymentType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customAmount">Amount</Label>
                <Input
                  id="customAmount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={`Enter amount (max ${formatCurrency(
                    remainingAmount
                  )})`}
                  min="0"
                  max={remainingAmount}
                  step="0.01"
                />
                <p className="text-sm text-gray-500">
                  Maximum: {formatCurrency(remainingAmount)}
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-900 mb-2">
                Payment Summary
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Amount to Pay:</span>
                  <span className="text-emerald-600 font-medium ml-2">
                    {paymentType === "due"
                      ? formatCurrency(dueTodayAmount)
                      : customAmount
                      ? formatCurrency(Number.parseFloat(customAmount))
                      : "₦0.00"}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Remaining After Payment:</span>
                  <span className="ml-2">
                    {paymentType === "due"
                      ? formatCurrency(remainingAmount - dueTodayAmount)
                      : customAmount
                      ? formatCurrency(
                          Math.max(
                            0,
                            remainingAmount - Number.parseFloat(customAmount)
                          )
                        )
                      : formatCurrency(remainingAmount)}
                  </span>
                </p>
                {paymentType === "due" && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">Calculation:</span> Remaining
                    Amount ({formatCurrency(remainingAmount)}) ÷ Days Remaining
                    = Due Today ({formatCurrency(dueTodayAmount)})
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={
              isProcessing ||
              (paymentType === "custom" &&
                (!customAmount || Number.parseFloat(customAmount) <= 0))
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              "Record Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
