"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  calculateFlexibleRepayment,
  calculateLoanExtension,
  type LoanTermAdjustment,
} from "@/utils/loanCalculations";
import { Calendar, Calculator, TrendingUp, AlertCircle } from "lucide-react";

interface LoanRepaymentCalculatorProps {
  originalAmount: number;
  currentRemainingAmount: number;
  originalTerm: number;
  termUnit: "DAY" | "WEEK" | "MONTH";
  originalDueDate: Date;
  onRepaymentCalculated?: (calculation: any) => void;
}

export function LoanRepaymentCalculator({
  originalAmount,
  currentRemainingAmount,
  originalTerm,
  termUnit,
  originalDueDate,
  onRepaymentCalculated,
}: LoanRepaymentCalculatorProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [calculation, setCalculation] = useState<any>(null);
  const [showExtension, setShowExtension] = useState(false);
  const [extensionAmount, setExtensionAmount] = useState<string>("");

  const calculateRepayment = () => {
    if (!paymentAmount || !paymentDate) return;

    const paidAmount = parseFloat(paymentAmount);
    const remainingAmount = currentRemainingAmount - paidAmount;
    const paymentDateObj = new Date(paymentDate);

    if (remainingAmount < 0) {
      alert("Payment amount cannot exceed remaining amount");
      return;
    }

    const result = calculateFlexibleRepayment(
      originalAmount,
      paidAmount,
      remainingAmount,
      originalTerm,
      termUnit,
      paymentDateObj,
      originalDueDate
    );

    setCalculation(result);
    onRepaymentCalculated?.(result);
  };

  const calculateExtension = () => {
    if (!extensionAmount) return;

    const extensionAmt = parseFloat(extensionAmount);
    const result = calculateLoanExtension(
      currentRemainingAmount,
      extensionAmt,
      originalTerm,
      termUnit,
      3 // Max 3 terms extension
    );

    setCalculation({
      ...calculation,
      extension: result,
    });
  };

  const getTermUnitLabel = (unit: "DAY" | "WEEK" | "MONTH") => {
    switch (unit) {
      case "DAY":
        return "Daily";
      case "WEEK":
        return "Weekly";
      case "MONTH":
        return "Monthly";
    }
  };

  const getDaysPerTerm = (unit: "DAY" | "WEEK" | "MONTH") => {
    switch (unit) {
      case "DAY":
        return 1;
      case "WEEK":
        return 7;
      case "MONTH":
        return 30;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Loan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Current Loan Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Original Amount</p>
              <p className="text-lg font-semibold">
                ₦{originalAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Remaining Amount</p>
              <p className="text-lg font-semibold text-orange-600">
                ₦{currentRemainingAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Term Unit</p>
              <Badge variant="outline">{getTermUnitLabel(termUnit)}</Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Original Due Date</p>
              <p className="text-sm font-medium">
                {originalDueDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Dynamic Repayment Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={currentRemainingAmount}
              />
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calculateRepayment} className="flex-1">
              Calculate New Terms
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExtension(!showExtension)}
            >
              {showExtension ? "Hide Extension" : "Show Extension"}
            </Button>
          </div>

          {showExtension && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                Loan Extension
              </h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Extension amount"
                  value={extensionAmount}
                  onChange={(e) => setExtensionAmount(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={calculateExtension} variant="outline">
                  Calculate Extension
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculation Results */}
      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Payment Schedule */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">New Daily Payment</p>
                <p className="text-lg font-semibold text-green-700">
                  ₦{calculation.newDailyPayment.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">New Weekly Payment</p>
                <p className="text-lg font-semibold text-blue-700">
                  ₦{calculation.newWeeklyPayment.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">New Monthly Payment</p>
                <p className="text-lg font-semibold text-purple-700">
                  ₦{calculation.newMonthlyPayment.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Remaining Days</p>
                <p className="text-lg font-semibold text-orange-700">
                  {calculation.remainingDays} days
                </p>
              </div>
            </div>

            {/* New Due Date */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">New Due Date</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {calculation.newDueDate.toLocaleDateString()}
              </p>
            </div>

            {/* Term Adjustment */}
            {calculation.adjustment && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Term Adjustment
                </h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    <strong>Original Term:</strong>{" "}
                    {calculation.adjustment.originalTerm}{" "}
                    {termUnit.toLowerCase()}s
                  </p>
                  <p>
                    <strong>Adjusted Term:</strong>{" "}
                    {calculation.adjustment.adjustedTerm}{" "}
                    {termUnit.toLowerCase()}s
                  </p>
                  <p>
                    <strong>Reason:</strong>{" "}
                    {calculation.adjustment.adjustmentReason}
                  </p>
                </div>
              </div>
            )}

            {/* Extension Results */}
            {calculation.extension && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  Extension Results
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>New Amount:</strong> ₦
                    {calculation.extension.newAmount.toLocaleString()}
                  </p>
                  <p>
                    <strong>New Term:</strong> {calculation.extension.newTerm}{" "}
                    {termUnit.toLowerCase()}s
                  </p>
                  <p>
                    <strong>Extension Terms:</strong>{" "}
                    {calculation.extension.extensionTerms}{" "}
                    {termUnit.toLowerCase()}s
                  </p>
                  <p>
                    <strong>New Daily Payment:</strong> ₦
                    {calculation.extension.newDailyPayment.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Example Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Example Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Scenario:</strong> ₦30,000 loan for 30 days
            </p>
            <p>
              <strong>Original Daily Payment:</strong> ₦1,000 (₦30,000 ÷ 30
              days)
            </p>
            <p>
              <strong>After ₦5,000 payment:</strong> ₦25,000 remaining
            </p>
            <p>
              <strong>New Daily Payment:</strong> ₦893 (₦25,000 ÷ 28 remaining
              days)
            </p>
            <p>
              <strong>Due Date Adjustment:</strong> Automatically recalculated
              based on remaining amount and days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
