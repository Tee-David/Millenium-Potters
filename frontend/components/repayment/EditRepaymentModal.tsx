"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Repayment, RepaymentFormData } from "@/types/repayment";

interface EditRepaymentModalProps {
  repayment: Repayment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRepayment: (updatedRepayment: Repayment) => void;
}

export const EditRepaymentModal: React.FC<EditRepaymentModalProps> = ({
  repayment,
  isOpen,
  onClose,
  onUpdateRepayment,
}) => {
  const [formData, setFormData] = useState<RepaymentFormData>({
    loanNumber: "",
    loanIssuedDate: "",
    repaymentDate: "",
    principalAmount: "",
    processingFee: "",
    loanType: "short-term",
  });

  // Set form data when repayment changes
  useEffect(() => {
    if (repayment) {
      setFormData({
        loanNumber: repayment.loanNumber,
        loanIssuedDate: repayment.loanIssuedDate,
        repaymentDate: repayment.repaymentDate,
        principalAmount: repayment.principalAmount.toString(),
        processingFee: repayment.processingFee.toString(),
        loanType: repayment.loanType,
      });
    }
  }, [repayment]);

  const calculateLoanDeadline = (
    issuedDate: string,
    loanType: string
  ): string => {
    if (!issuedDate) return "";
    const issued = new Date(issuedDate);
    let daysToAdd = 30;

    switch (loanType) {
      case "short-term":
        daysToAdd = 30;
        break;
      case "medium-term":
        daysToAdd = 90;
        break;
      case "long-term":
        daysToAdd = 365;
        break;
    }

    const deadline = new Date(issued);
    deadline.setDate(deadline.getDate() + daysToAdd);
    return deadline.toISOString().split("T")[0];
  };

  const handleUpdate = (): void => {
    if (
      !repayment ||
      !formData.loanNumber ||
      !formData.loanIssuedDate ||
      !formData.principalAmount
    )
      return;

    const principal = Number.parseFloat(formData.principalAmount);
    const processing = Number.parseFloat(formData.processingFee) || 0;
    const loanDeadline = calculateLoanDeadline(
      formData.loanIssuedDate,
      formData.loanType
    );

    const totalDays =
      formData.loanType === "short-term"
        ? 30
        : formData.loanType === "medium-term"
        ? 90
        : 365;
    const dueToday = (principal + processing) / totalDays;
    const newAmountLeftToPay =
      principal + processing - repayment.amountPaidAlready;

    const updatedRepayment: Repayment = {
      ...repayment,
      loanNumber: formData.loanNumber,
      loanIssuedDate: formData.loanIssuedDate,
      loanDeadline,
      repaymentDate: formData.repaymentDate,
      principalAmount: principal,
      processingFee: processing,
      totalAmount: principal + processing + repayment.penaltyFee,
      amountLeftToPay: newAmountLeftToPay,
      dueToday: Math.round(dueToday * 100) / 100,
      loanType: formData.loanType as "short-term" | "medium-term" | "long-term",
    };

    onUpdateRepayment(updatedRepayment);
    onClose();
  };

  if (!repayment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Loan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Loan Number</Label>
            <p className="px-3 py-2 rounded border border-gray-300 bg-gray-100 text-gray-800 cursor-not-allowed select-all">
              {formData.loanNumber}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-loanType">Loan Type</Label>
            <Select
              value={formData.loanType}
              onValueChange={(value: string) =>
                setFormData((prev) => ({ ...prev, loanType: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short-term">Short-term (30 days)</SelectItem>
                <SelectItem value="medium-term">
                  Medium-term (90 days)
                </SelectItem>
                <SelectItem value="long-term">Long-term (365 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-loanIssuedDate">Loan Issued Date</Label>
            <Input
              id="edit-loanIssuedDate"
              type="date"
              value={formData.loanIssuedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  loanIssuedDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-repaymentDate">Repayment Date</Label>
            <Input
              id="edit-repaymentDate"
              type="date"
              value={formData.repaymentDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  repaymentDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-principalAmount">Principal Amount (₦)</Label>
            <Input
              id="edit-principalAmount"
              type="number"
              value={formData.principalAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  principalAmount: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-processingFee">Processing Fee (₦)</Label>
            <Input
              id="edit-processingFee"
              type="number"
              value={formData.processingFee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  processingFee: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleUpdate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Update Loan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
