"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Banknote,
  Calendar,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  BranchManagerOrAdmin,
  AccessDenied,
} from "@/components/auth/RoleGuard";
import { auth, enhancedApi, handleDatabaseError } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MobileContainer } from "@/components/ui/mobile-container";
import { MobileCard } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface BranchAnalytics {
  id: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalLoans: number;
  activeLoans: number;
  totalLoanAmount: number;
  outstandingAmount: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
  dailyLogins: number;
  weeklyLogins: number;
  monthlyLogins: number;
  collectionRate: number;
  overdueLoans: number;
  defaultedLoans: number;
  periodType: string;
  periodStart: string;
  periodEnd: string;
}

interface SystemAnalytics {
  periodType: string;
  periodStart: string;
  periodEnd: string;
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalLoans: number;
  activeLoans: number;
  totalLoanAmount: number;
  outstandingAmount: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
  dailyLogins: number;
  weeklyLogins: number;
  monthlyLogins: number;
  overdueLoans: number;
  defaultedLoans: number;
  collectionRate: number;
  branchAnalytics: BranchAnalytics[];
}

function AnalyticsDashboardPageContent() {
  const [branchAnalytics, setBranchAnalytics] = useState<BranchAnalytics[]>([]);
  const [systemAnalytics, setSystemAnalytics] =
    useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalytics();
  }, [periodType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [branchRes, systemRes] = await Promise.all([
        enhancedApi.analytics.getBranchAnalytics({ periodType }),
        enhancedApi.analytics.getSystemAnalytics(periodType),
      ]);

      setBranchAnalytics(branchRes.data.data || []);
      setSystemAnalytics(systemRes.data.data || null);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load analytics due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Show specific error messages
      const message = error.response?.data?.message || "";
      if (message.includes("Not authorized")) {
        toast.error("You don't have permission to view analytics.");
      } else if (message.includes("Branch not found")) {
        toast.error("Branch analytics not available.");
      } else {
        toast.error("Failed to fetch analytics. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(0);
    }
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0";
    }
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const formatPercentage = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0.0%";
    }
    return `${num.toFixed(1)}%`;
  };

  // Chart data preparation
  const branchPerformanceData = branchAnalytics.map((analytic) => ({
    name: analytic.branch?.name || "Unknown Branch",
    users: analytic.activeUsers || 0,
    customers: analytic.totalCustomers || 0,
    loans: analytic.activeLoans || 0,
    revenue: Number(analytic.monthlyRevenue) || 0,
    collectionRate: Number(analytic.collectionRate) || 0,
  }));

  const revenueData = branchAnalytics.map((analytic) => ({
    name: analytic.branch?.name || "Unknown Branch",
    monthly: Number(analytic.monthlyRevenue) || 0,
    quarterly: Number(analytic.quarterlyRevenue) || 0,
    yearly: Number(analytic.yearlyRevenue) || 0,
  }));

  const collectionData = branchAnalytics.map((analytic) => ({
    name: analytic.branch?.name || "Unknown Branch",
    rate: Number(analytic.collectionRate) || 0,
  }));

  const pieData = [
    {
      name: "Active Loans",
      value: systemAnalytics?.activeLoans || 0,
      color: "#10b981",
    },
    {
      name: "Overdue Loans",
      value: systemAnalytics?.overdueLoans || 0,
      color: "#f59e0b",
    },
    {
      name: "Defaulted Loans",
      value: systemAnalytics?.defaultedLoans || 0,
      color: "#ef4444",
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  // Safety check for missing data
  if (!systemAnalytics && branchAnalytics.length === 0) {
    return (
      <MobileContainer>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <div className="flex gap-2">
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Analytics Data Available
                </h3>
                <p className="text-gray-600 mb-4">
                  Analytics data is not available for the selected period. This
                  could be because:
                </p>
                <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
                  <li>• No data has been generated for this period</li>
                  <li>• You don't have permission to view analytics</li>
                  <li>• The analytics service is not configured</li>
                </ul>
                <Button onClick={fetchAnalytics} className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Overview Cards */}
            {systemAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold">
                          {formatNumber(systemAnalytics?.totalUsers)}
                        </p>
                        <p className="text-sm text-green-600">
                          {formatNumber(systemAnalytics?.activeUsers)} active
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Customers
                        </p>
                        <p className="text-2xl font-bold">
                          {formatNumber(systemAnalytics?.totalCustomers)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Across all branches
                        </p>
                      </div>
                      <Building2 className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Loans
                        </p>
                        <p className="text-2xl font-bold">
                          {formatNumber(systemAnalytics?.totalLoans)}
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatNumber(systemAnalytics?.activeLoans)} active
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Outstanding Amount
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(systemAnalytics?.outstandingAmount)}
                        </p>
                        <p className="text-sm text-gray-500">Total portfolio</p>
                      </div>
                      <Banknote className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </MobileCard>
              </div>
            )}

            {/* Revenue Overview */}
            {systemAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Monthly Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(systemAnalytics?.monthlyRevenue)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Quarterly Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(systemAnalytics?.quarterlyRevenue)}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Yearly Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(systemAnalytics?.yearlyRevenue)}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </MobileCard>
              </div>
            )}

            {/* Activity Overview */}
            {systemAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Daily Logins
                        </p>
                        <p className="text-2xl font-bold">
                          {formatNumber(systemAnalytics?.dailyLogins)}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Weekly Logins
                        </p>
                        <p className="text-2xl font-bold">
                          {formatNumber(systemAnalytics?.weeklyLogins)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </MobileCard>

                <MobileCard>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Monthly Logins
                        </p>
                        <p className="text-2xl font-bold">
                          {formatNumber(systemAnalytics?.monthlyLogins)}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </MobileCard>
              </div>
            )}

            {/* Loan Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          const safePercent = percent || 0;
                          const percentage = safePercent * 100;
                          return `${name} ${percentage.toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            {/* Branch Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#3b82f6" name="Active Users" />
                      <Bar
                        dataKey="customers"
                        fill="#10b981"
                        name="Customers"
                      />
                      <Bar dataKey="loans" fill="#8b5cf6" name="Active Loans" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Branch Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Analytics Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchAnalytics.map((analytic) => (
                    <Card key={analytic.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {analytic.branch.name}
                          </h3>
                          <Badge variant="outline">
                            {analytic.branch.code}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Users</p>
                            <p className="text-lg font-semibold">
                              {analytic.activeUsers}/{analytic.totalUsers}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Customers</p>
                            <p className="text-lg font-semibold">
                              {analytic.totalCustomers}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Loans</p>
                            <p className="text-lg font-semibold">
                              {analytic.activeLoans}/{analytic.totalLoans}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Collection Rate
                            </p>
                            <p className="text-lg font-semibold">
                              {formatPercentage(analytic.collectionRate)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Outstanding Amount
                            </p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(analytic.outstandingAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Monthly Revenue
                            </p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(analytic.monthlyRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Overdue Loans
                            </p>
                            <p className="text-lg font-semibold text-red-600">
                              {analytic.overdueLoans}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Branch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar
                        dataKey="monthly"
                        fill="#3b82f6"
                        name="Monthly Revenue"
                      />
                      <Bar
                        dataKey="quarterly"
                        fill="#10b981"
                        name="Quarterly Revenue"
                      />
                      <Bar
                        dataKey="yearly"
                        fill="#8b5cf6"
                        name="Yearly Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Rate Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={collectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatPercentage(Number(value))}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Performance Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Collection Rate</span>
                      <Badge variant="outline" className="text-green-600">
                        {systemAnalytics
                          ? formatPercentage(systemAnalytics?.collectionRate)
                          : "0%"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>User Activity Rate</span>
                      <Badge variant="outline" className="text-blue-600">
                        {systemAnalytics
                          ? formatPercentage(
                              systemAnalytics?.activeUsers &&
                                systemAnalytics?.totalUsers
                                ? (systemAnalytics.activeUsers /
                                    systemAnalytics.totalUsers) *
                                    100
                                : 0
                            )
                          : "0%"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Branches</span>
                      <Badge variant="outline" className="text-purple-600">
                        {branchAnalytics.length || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Risk Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Overdue Loans</span>
                      <Badge variant="destructive">
                        {systemAnalytics
                          ? formatNumber(systemAnalytics?.overdueLoans)
                          : "0"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Defaulted Loans</span>
                      <Badge variant="destructive">
                        {systemAnalytics
                          ? formatNumber(systemAnalytics?.defaultedLoans)
                          : "0"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Risk Level</span>
                      <Badge
                        variant={
                          (systemAnalytics?.overdueLoans || 0) > 100
                            ? "destructive"
                            : (systemAnalytics?.overdueLoans || 0) > 50
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {(systemAnalytics?.overdueLoans || 0) > 100
                          ? "High"
                          : (systemAnalytics?.overdueLoans || 0) > 50
                          ? "Medium"
                          : "Low"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Branches */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchAnalytics
                    .sort((a, b) => b.collectionRate - a.collectionRate)
                    .slice(0, 5)
                    .map((analytic, index) => (
                      <div
                        key={analytic.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {analytic.branch.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {analytic.branch.code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPercentage(analytic.collectionRate)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Collection Rate
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileContainer>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <BranchManagerOrAdmin
      fallback={
        <AccessDenied message="Only administrators and branch managers can access analytics." />
      }
    >
      <AnalyticsDashboardPageContent />
    </BranchManagerOrAdmin>
  );
}
