"use client";

import type React from "react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Repayment, RepaymentFormData } from "@/types/repayment";

interface CreateRepaymentModalProps {
  onCreateRepayment: (repayment: Omit<Repayment, "id">) => void;
}

export const CreateRepaymentModal: React.FC<CreateRepaymentModalProps> = ({
  onCreateRepayment,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<RepaymentFormData>({
    loanNumber: "",
    loanIssuedDate: "",
    repaymentDate: new Date().toISOString().split("T")[0], // Default to today
    principalAmount: "",
    processingFee: "",
    loanType: "short-term",
  });

  const calculateLoanDeadline = (
    issuedDate: string,
    loanType: string
  ): string => {
    if (!issuedDate) return "";
    const issued = new Date(issuedDate);
    let daysToAdd = 30; // default short-term

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

  const resetForm = (): void => {
    setFormData({
      loanNumber: "",
      loanIssuedDate: "",
      repaymentDate: new Date().toISOString().split("T")[0],
      principalAmount: "",
      processingFee: "",
      loanType: "short-term",
    });
  };

  const handleCreate = (): void => {
    if (
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

    const newRepayment: Omit<Repayment, "id"> = {
      loanNumber: formData.loanNumber,
      loanIssuedDate: formData.loanIssuedDate,
      loanDeadline,
      repaymentDate: formData.repaymentDate,
      principalAmount: principal,
      processingFee: processing,
      amountLeftToPay: principal + processing,
      totalAmount: principal + processing,
      penaltyFee: 0,
      dueToday: Math.round(dueToday * 100) / 100,
      status: "processing",
      loanType: formData.loanType as "short-term" | "medium-term" | "long-term",
      amountPaidAlready: 0,
    };

    onCreateRepayment(newRepayment);
    setIsOpen(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Loan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="loanNumber">Loan Number</Label>
            <Input
              id="loanNumber"
              placeholder="Enter loan number (e.g., #LON-0001)"
              value={formData.loanNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, loanNumber: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanType">Loan Type</Label>
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
            <Label htmlFor="loanIssuedDate">Loan Issued Date</Label>
            <Input
              id="loanIssuedDate"
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
            <Label htmlFor="repaymentDate">Repayment Date</Label>
            <Input
              id="repaymentDate"
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
            <Label htmlFor="principalAmount">Principal Amount (₦)</Label>
            <Input
              id="principalAmount"
              type="number"
              placeholder="Enter principal amount"
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
            <Label htmlFor="processingFee">Processing Fee (₦)</Label>
            <Input
              id="processingFee"
              type="number"
              placeholder="Enter processing fee"
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
              onClick={handleCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Create Loan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
