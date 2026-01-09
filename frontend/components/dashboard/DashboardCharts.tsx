"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Banknote,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";

interface DashboardChartsProps {
  data: any;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}

export default function DashboardCharts({
  data,
  formatCurrency,
  formatNumber,
}: DashboardChartsProps) {
  // Mock chart data - in a real app, this would come from your API
  const loanStatusData = [
    { name: "Active", value: data.stats.activeLoans, color: "bg-blue-500" },
    {
      name: "Pending",
      value: data.stats.pendingApplications,
      color: "bg-amber-500",
    },
    { name: "Overdue", value: data.stats.overduePayments, color: "bg-red-500" },
    {
      name: "Completed",
      value: Math.max(
        0,
        data.stats.totalCustomers -
          data.stats.activeLoans -
          data.stats.pendingApplications -
          data.stats.overduePayments
      ),
      color: "bg-green-500",
    },
  ];

  const monthlyData = [
    { month: "Jan", loans: 45, revenue: 2500000 },
    { month: "Feb", loans: 52, revenue: 3200000 },
    { month: "Mar", loans: 48, revenue: 2800000 },
    { month: "Apr", loans: 61, revenue: 3800000 },
    { month: "May", loans: 55, revenue: 3400000 },
    { month: "Jun", loans: 67, revenue: 4200000 },
  ];

  const branchPerformance = data.topBranches || [];

  return (
    <div className="space-y-8">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loan Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Loan Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {formatNumber(item.value)}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{
                          width: `${
                            (item.value /
                              Math.max(...loanStatusData.map((d) => d.value))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-green-600" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {monthlyData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.month}</p>
                    <p className="text-sm text-gray-500">{item.loans} loans</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </p>
                    <div className="flex items-center gap-1">
                      {index > 0 &&
                      item.revenue > monthlyData[index - 1].revenue ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : index > 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      ) : null}
                      {index > 0 && (
                        <span
                          className={`text-xs ${
                            item.revenue > monthlyData[index - 1].revenue
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.revenue > monthlyData[index - 1].revenue
                            ? "+"
                            : ""}
                          {(
                            ((item.revenue - monthlyData[index - 1].revenue) /
                              monthlyData[index - 1].revenue) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance */}
      {branchPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Branch Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
              {branchPerformance.map((branch: any, index: number) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{branch.name}</p>
                      <p className="text-sm text-gray-500">
                        {branch.loanCount} loans • {branch.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(branch.revenue)}
                    </p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (branch.revenue /
                              Math.max(
                                ...branchPerformance.map((b: any) => b.revenue)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Loan Approval Rate
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.stats.loanApprovalRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Activity className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <Progress
              value={data.stats.loanApprovalRate}
              className="mt-4 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Collection Rate
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {data.stats.collectionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Banknote className="h-6 w-6 text-green-700" />
              </div>
            </div>
            <Progress value={data.stats.collectionRate} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Customer Growth
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.customerGrowth >= 0 ? "+" : ""}
                  {data.customerGrowth}%
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {data.customerGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm text-gray-600">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">
                  Revenue Growth
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  +{data.revenueGrowth}%
                </p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-700" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
