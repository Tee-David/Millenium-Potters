"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Coins,
  Users,
  CreditCard,
  Activity,
  Calendar,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface DashboardAnalyticsProps {
  data: any;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}

export default function DashboardAnalytics({
  data,
  formatCurrency,
  formatNumber,
}: DashboardAnalyticsProps) {
  // Calculate additional analytics
  const totalLoans =
    data.stats.activeLoans +
    data.stats.pendingApplications +
    data.stats.overduePayments;
  const completionRate =
    totalLoans > 0 ? (data.stats.activeLoans / totalLoans) * 100 : 0;
  const riskScore =
    data.stats.overduePayments > 0
      ? Math.min(100, (data.stats.overduePayments / totalLoans) * 100)
      : 0;

  // Mock detailed analytics data
  const loanTypeDistribution = [
    { name: "Personal", count: 45, amount: 15000000, percentage: 35 },
    { name: "Business", count: 32, amount: 25000000, percentage: 25 },
    { name: "Emergency", count: 28, amount: 8000000, percentage: 20 },
    { name: "Education", count: 15, amount: 5000000, percentage: 12 },
    { name: "Other", count: 10, amount: 3000000, percentage: 8 },
  ];

  const repaymentTrends = [
    { month: "Jan", onTime: 85, late: 10, overdue: 5 },
    { month: "Feb", onTime: 88, late: 8, overdue: 4 },
    { month: "Mar", onTime: 82, late: 12, overdue: 6 },
    { month: "Apr", onTime: 90, late: 7, overdue: 3 },
    { month: "May", onTime: 87, late: 9, overdue: 4 },
    { month: "Jun", onTime: 92, late: 5, overdue: 3 },
  ];

  const customerSegments = [
    { segment: "High Value", count: 25, avgLoan: 500000, risk: "Low" },
    { segment: "Medium Value", count: 45, avgLoan: 250000, risk: "Medium" },
    { segment: "Low Value", count: 30, avgLoan: 100000, risk: "High" },
  ];

  return (
    <div className="space-y-8">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {completionRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+2.3%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Target className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <Progress value={completionRate} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Risk Score</p>
                <p className="text-3xl font-bold text-green-900">
                  {riskScore.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">-1.2%</span>
                </div>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Award className="h-6 w-6 text-green-700" />
              </div>
            </div>
            <Progress value={100 - riskScore} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Avg Processing Time
                </p>
                <p className="text-3xl font-bold text-purple-900">2.3</p>
                <p className="text-sm text-gray-600 mt-1">days</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Clock className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">
                  Customer Satisfaction
                </p>
                <p className="text-3xl font-bold text-amber-900">4.8</p>
                <p className="text-sm text-gray-600 mt-1">out of 5</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <Users className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loan Type Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Loan Type Distribution
              </CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanTypeDistribution.map((type, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium text-gray-900">
                        {type.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatNumber(type.count)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(type.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12">
                      {type.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Repayment Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-600" />
                Repayment Trends
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repaymentTrends.map((trend, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">
                      {trend.month}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          {trend.onTime}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-600">
                          {trend.late}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">
                          {trend.overdue}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{ width: `${trend.onTime}%` }}
                    />
                    <div
                      className="bg-amber-500"
                      style={{ width: `${trend.late}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${trend.overdue}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segmentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Customer Segmentation Analysis
            </CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerSegments.map((segment, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {segment.segment}
                  </h3>
                  <Badge
                    variant={
                      segment.risk === "Low"
                        ? "default"
                        : segment.risk === "Medium"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {segment.risk} Risk
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Customers</span>
                    <span className="font-bold text-gray-900">
                      {segment.count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Loan</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(segment.avgLoan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(segment.count * segment.avgLoan)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-600" />
              Processing Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Application Processing
                </span>
                <span className="font-bold text-gray-900">94.2%</span>
              </div>
              <Progress value={94.2} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Document Verification
                </span>
                <span className="font-bold text-gray-900">98.7%</span>
              </div>
              <Progress value={98.7} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Disbursement Time</span>
                <span className="font-bold text-gray-900">2.1 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-green-600" />
              Financial Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ROI</span>
                <span className="font-bold text-green-600">+18.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profit Margin</span>
                <span className="font-bold text-green-600">12.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cost per Loan</span>
                <span className="font-bold text-gray-900">₦2,500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Revenue per Customer
                </span>
                <span className="font-bold text-gray-900">₦45,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-600" />
              Customer Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retention Rate</span>
                <span className="font-bold text-gray-900">87.3%</span>
              </div>
              <Progress value={87.3} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Referral Rate</span>
                <span className="font-bold text-gray-900">23.1%</span>
              </div>
              <Progress value={23.1} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Loan Size</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(data.stats.averageLoanAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Action Items & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Immediate Actions</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      Follow up on overdue loans
                    </p>
                    <p className="text-sm text-red-700">
                      {data.stats.overduePayments} loans require attention
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">
                      Review pending applications
                    </p>
                    <p className="text-sm text-amber-700">
                      {data.stats.pendingApplications} applications pending
                      review
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Recommendations</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Optimize loan approval process
                    </p>
                    <p className="text-sm text-blue-700">
                      Current rate: {data.stats.loanApprovalRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Improve collection strategies
                    </p>
                    <p className="text-sm text-green-700">
                      Current rate: {data.stats.collectionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
