"use client";

import React, { useEffect, useState } from "react";
import { loansApi, repaymentsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
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

const LoanPaymentSystem: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await loansApi.getAll();
        setLoans(res.data.loans || []);
      } catch (err: any) {
        setError("Failed to fetch loans");
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  useEffect(() => {
    if (!selectedLoanId) return;
    setLoading(true);
    setError("");
    repaymentsApi
      .getRepaymentSchedule(selectedLoanId)
      .then((res) => {
        setSchedule(res.data.schedule || []);
      })
      .catch(() => setError("Failed to fetch repayment schedule"))
      .finally(() => setLoading(false));
  }, [selectedLoanId]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Repayment Schedules
            </h1>
            <span className="text-sm text-gray-500">
              Dashboard &gt; Repayment
            </span>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="loan-select">Select Loan:</Label>
              <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a loan" />
                </SelectTrigger>
                <SelectContent>
                  {loans.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.loanNumber} - {loan.unionMember?.firstName}{" "}
                      {loan.unionMember?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {schedule.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Principal Due
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Interest Due
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.map((item: any, idx: number) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.sequence}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.principalDue}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.interestDue}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LoanPaymentSystem;
