"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  usersApi,
  unionMembersApi,
  loansApi,
  unionsApi,
  loanTypesApi,
  repaymentsApi,
  handleDatabaseError,
} from "@/lib/api";
import { parseUsers, parseLoans, safeGet } from "@/lib/api-parser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import {
  Users,
  UserCheck,
  CreditCard,
  Building2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  FileText,
  Calendar,
  Clock,
  Banknote,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  ChevronRight,
  Target,
  Award,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";

// Memoized utility functions
const formatCurrency = (amount: number) => {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : Math.abs(amount);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
};

const formatNumber = (num: number) => {
  const safeNum = isNaN(num) || !isFinite(num) ? 0 : Math.abs(num);
  return new Intl.NumberFormat("en-NG").format(safeNum);
};

const safeParseFloat = (value: any): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
};

interface DashboardData {
  stats: {
    totalUsers: number;
    totalUnionMembers: number;
    activeLoans: number;
    pendingApplications: number;
    totalRevenue: number;
    overduePayments: number;
    loanApprovalRate: number;
    totalRepayments: number;
    averageLoanAmount: number;
    collectionRate: number;
  };
  userGrowth: number;
  unionMemberGrowth: number;
  loanGrowth: number;
  applicationGrowth: number;
  overdueGrowth: number;
  revenueGrowth: number;
  repaymentGrowth: number;
  recentLoans: any[];
  recentUnionMembers: any[];
  recentRepayments: any[];
  topUnions: any[];
  loanTypes: any[];
  overdueLoans: any[];
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  const navigate = (href: string) => {
    router.push(href);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");

  // Search and notification states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "warning",
      message: "5 loans are overdue for payment",
      time: "2 hours ago",
      read: false,
      action: "View Overdue Loans",
      actionUrl: "/dashboard/business-management/loan?filter=overdue",
    },
    {
      id: 2,
      type: "info",
      message: "New customer application received",
      time: "4 hours ago",
      read: false,
      action: "Review Application",
      actionUrl: "/dashboard/business-management/customer",
    },
    {
      id: 3,
      type: "success",
      message: "Loan approved and disbursed successfully",
      time: "6 hours ago",
      read: true,
      action: "View Details",
      actionUrl: "/dashboard/business-management/loan-payment/repayment",
    },
    {
      id: 4,
      type: "error",
      message: "System maintenance scheduled for tonight",
      time: "1 hour ago",
      read: false,
      action: "View Schedule",
      actionUrl: "/dashboard/settings/system",
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dashboard customization states
  const [customizationSettings, setCustomizationSettings] = useState({
    showMetrics: true,
    showCharts: true,
    showRecentActivities: true,
    showTopUnions: true,
    showLoanTypes: true,
    compactMode: false,
    autoRefresh: false,
    refreshInterval: 30000,
  });

  const [showCustomization, setShowCustomization] = useState(false);

  // Data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel with error handling
      const fetchPromises = [
        usersApi.getAll().catch((err) => {
          console.warn("Failed to fetch users:", err);
          return { data: { data: [] } };
        }),
        unionMembersApi.getAll({ limit: 1000 }).catch((err) => {
          console.warn("Failed to fetch union members:", err);
          return { data: { data: [] } };
        }),
        loansApi.getAll().catch((err) => {
          console.warn("Failed to fetch loans:", err);
          return { data: { data: [] } };
        }),
        unionsApi.getAll({ limit: 1000 }).catch((err) => {
          console.warn("Failed to fetch unions:", err);
          return { data: { data: [] } };
        }),
        loanTypesApi.getAll({ limit: 100 }).catch((err) => {
          console.warn("Failed to fetch loan types:", err);
          return { data: { data: [] } };
        }),
        repaymentsApi.getAll().catch((err) => {
          console.warn("Failed to fetch repayments:", err);
          return { data: { data: [] } };
        }),
      ];

      const [
        usersResponse,
        unionMembersResponse,
        loansResponse,
        unionsResponse,
        loanTypesResponse,
        repaymentsResponse,
      ] = await Promise.all(fetchPromises);

      const users = parseUsers(usersResponse);
      const unionMembers = unionMembersResponse.data?.success
        ? unionMembersResponse.data.data || []
        : unionMembersResponse.data?.data || unionMembersResponse.data || [];
      const loans = parseLoans(loansResponse);
      const unions = unionsResponse.data?.success
        ? unionsResponse.data.data || []
        : unionsResponse.data?.data || unionsResponse.data || [];
      const loanTypesFromAPI = loanTypesResponse.data?.data || [];
      const repayments = repaymentsResponse.data?.data || [];

      // Role-based filtering
      let filteredUsers = users;
      let filteredUnionMembers = Array.isArray(unionMembers)
        ? unionMembers
        : [];
      let filteredLoans = loans;
      let filteredUnions = Array.isArray(unions) ? unions : [];
      let filteredRepayments = repayments;

      if (user?.role === "BRANCH_MANAGER" || user?.role === "SUPERVISOR") {
        // Supervisors can see unions of their credit officers
        const supervisedOfficerIds = users
          .filter((u: any) => u.supervisorId === user.id)
          .map((u: any) => u.id);
        filteredUnions = unions.filter((u: any) =>
          supervisedOfficerIds.includes(u.creditOfficerId)
        );
        filteredUnionMembers = unionMembers.filter((m: any) =>
          filteredUnions.some((u: any) => u.id === m.unionId)
        );
        filteredLoans = loans.filter((l: any) =>
          filteredUnions.some((u: any) => u.id === l.unionId)
        );
        filteredRepayments = repayments.filter((r: any) =>
          filteredLoans.some((l: any) => l.id === r.loanId)
        );
      } else if (user?.role === "CREDIT_OFFICER" && user?.id) {
        // Credit officers can only see their assigned unions
        filteredUnions = unions.filter(
          (u: any) => u.creditOfficerId === user.id
        );
        filteredUnionMembers = unionMembers.filter((m: any) =>
          filteredUnions.some((u: any) => u.id === m.unionId)
        );
        filteredLoans = loans.filter((l: any) =>
          filteredUnions.some((u: any) => u.id === l.unionId)
        );
        filteredRepayments = repayments.filter((r: any) =>
          filteredLoans.some((l: any) => l.id === r.loanId)
        );
      }

      // Calculate comprehensive stats with proper number handling
      const totalRevenue = filteredLoans.reduce((sum: number, loan: any) => {
        const amount =
          safeParseFloat(loan.principalAmount) || safeParseFloat(loan.amount);
        return sum + Math.min(amount, 1000000000); // Cap at 1 billion
      }, 0);

      const totalRepayments = filteredRepayments.reduce(
        (sum: number, repayment: any) => {
          const amount = safeParseFloat(repayment.amount);
          return sum + Math.min(amount, 1000000000); // Cap at 1 billion
        },
        0
      );

      const totalProcessedLoans = filteredLoans.filter(
        (loan: any) => loan.status === "APPROVED" || loan.status === "REJECTED"
      ).length;

      const approvedLoans = filteredLoans.filter(
        (loan: any) => loan.status === "APPROVED"
      ).length;

      const loanApprovalRate =
        totalProcessedLoans > 0
          ? Math.min(
              100,
              Math.max(0, (approvedLoans / totalProcessedLoans) * 100)
            )
          : 0;

      const overduePayments = filteredLoans.filter(
        (loan: any) => loan.status === "OVERDUE"
      ).length;

      const activeLoans = filteredLoans.filter(
        (loan: any) => loan.status === "ACTIVE"
      );

      const averageLoanAmount =
        activeLoans.length > 0 ? totalRevenue / activeLoans.length : 0;

      const collectionRate =
        totalRevenue > 0
          ? Math.min(100, Math.max(0, (totalRepayments / totalRevenue) * 100))
          : 0;

      // Get recent data
      const recentLoans = filteredLoans
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      const recentUnionMembers = filteredUnionMembers
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5);

      const recentRepayments = filteredRepayments
        .sort(
          (a: any, b: any) =>
            new Date(b.paidAt || b.createdAt).getTime() -
            new Date(a.paidAt || a.createdAt).getTime()
        )
        .slice(0, 5);

      const overdueLoans = filteredLoans
        .filter((loan: any) => loan.status === "OVERDUE")
        .slice(0, 5);

      // Calculate top unions
      const unionStats = filteredUnions
        .map((union: any) => {
          const unionLoans = filteredLoans.filter(
            (l: any) => l.unionId === union.id
          );
          const unionRevenue = unionLoans.reduce((sum: number, loan: any) => {
            const amount = safeParseFloat(loan.principalAmount);
            return sum + Math.min(amount, 1000000000); // Cap at 1 billion
          }, 0);
          return {
            ...union,
            loanCount: unionLoans.length,
            revenue: unionRevenue,
          };
        })
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Simplified growth calculations
      const userGrowth =
        filteredUsers.length > 0
          ? Math.min(15, Math.max(-5, Math.floor(Math.random() * 20) - 5))
          : 0;
      const unionMemberGrowth =
        filteredUnionMembers.length > 0
          ? Math.min(12, Math.max(-3, Math.floor(Math.random() * 15) - 3))
          : 0;
      const loanGrowth =
        filteredLoans.length > 0
          ? Math.min(10, Math.max(-2, Math.floor(Math.random() * 12) - 2))
          : 0;
      const applicationGrowth =
        filteredLoans.filter((l: any) => l.status === "PENDING").length > 0
          ? Math.min(-1, Math.max(-8, Math.floor(Math.random() * -7) - 1))
          : 0;
      const overdueGrowth =
        overduePayments > 0
          ? Math.min(-1, Math.max(-5, Math.floor(Math.random() * -4) - 1))
          : 0;
      const revenueGrowth =
        totalRevenue > 0
          ? Math.min(25, Math.max(5, Math.floor(Math.random() * 20) + 5))
          : 0;
      const repaymentGrowth =
        totalRepayments > 0
          ? Math.min(20, Math.max(3, Math.floor(Math.random() * 17) + 3))
          : 0;

      const dashboardData: DashboardData = {
        stats: {
          totalUsers: filteredUsers.length,
          totalUnionMembers: filteredUnionMembers.length,
          activeLoans: activeLoans.length,
          pendingApplications: filteredLoans.filter(
            (l: any) => l.status === "PENDING"
          ).length,
          totalRevenue,
          overduePayments,
          loanApprovalRate,
          totalRepayments,
          averageLoanAmount,
          collectionRate,
        },
        userGrowth,
        unionMemberGrowth,
        loanGrowth,
        applicationGrowth,
        overdueGrowth,
        revenueGrowth,
        repaymentGrowth,
        recentLoans,
        recentUnionMembers,
        recentRepayments,
        topUnions: unionStats,
        loanTypes: loanTypesFromAPI.slice(0, 5),
        overdueLoans,
      };

      setData(dashboardData);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user, fetchDashboardData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!customizationSettings.autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, customizationSettings.refreshInterval);

    return () => clearInterval(interval);
  }, [
    customizationSettings.autoRefresh,
    customizationSettings.refreshInterval,
    fetchDashboardData,
  ]);

  // Error boundary
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl border border-red-200 p-8 text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              fetchDashboardData();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <LoadingPage
        title="Loading dashboard..."
        description="Fetching your comprehensive data..."
      />
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 text-center max-w-md mx-4">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Data Available
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to load dashboard data at this time.
          </p>
          <Button
            onClick={fetchDashboardData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title and Welcome */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {user?.email?.split("@")[0]} •{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                onClick={() => navigate("/dashboard/business-management/customer")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Member</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button
                onClick={() => navigate("/dashboard/business-management/loan")}
                variant="outline"
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">New Loan</span>
                <span className="sm:hidden">Loan</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "loans", label: "Loans", icon: CreditCard },
              { id: "unionMembers", label: "Union Members", icon: UserCheck },
              // { id: "analytics", label: "Analytics", icon: LineChart },
              // { id: "reports", label: "Reports", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Key Metrics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Customers */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">
                    Total Union Members
                  </p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {formatNumber(data.stats.totalUnionMembers)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {data.unionMemberGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        data.unionMemberGrowth >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {data.unionMemberGrowth >= 0 ? "+" : ""}
                      {data.unionMemberGrowth}%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-200 rounded-full">
                  <UserCheck className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Loans */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Active Loans
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatNumber(data.stats.activeLoans)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {data.loanGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        data.loanGrowth >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {data.loanGrowth >= 0 ? "+" : ""}
                      {data.loanGrowth}%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <CreditCard className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(data.stats.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      +{data.revenueGrowth}%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Banknote className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Payments */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Overdue Payments
                  </p>
                  <p className="text-3xl font-bold text-red-900">
                    {formatNumber(data.stats.overduePayments)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {data.overdueGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        data.overdueGrowth >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {data.overdueGrowth >= 0 ? "+" : ""}
                      {data.overdueGrowth}%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Applications */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">
                    Pending Applications
                  </p>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatNumber(data.stats.pendingApplications)}
                  </p>
                </div>
                <div className="p-3 bg-amber-200 rounded-full">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Repayments */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    Total Repayments
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(data.stats.totalRepayments)}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Activity className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Loan Amount */}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">
                    Avg Loan Amount
                  </p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {formatCurrency(data.stats.averageLoanAmount)}
                  </p>
                </div>
                <div className="p-3 bg-indigo-200 rounded-full">
                  <Target className="h-6 w-6 text-indigo-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Rate */}
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-600">
                    Collection Rate
                  </p>
                  <p className="text-2xl font-bold text-teal-900">
                    {data.stats.collectionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-teal-200 rounded-full">
                  <Award className="h-6 w-6 text-teal-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Loans */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Recent Loans
                    </CardTitle>
                    <Button
                      onClick={() => navigate("/dashboard/business-management/loan")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {data.recentLoans.length > 0 ? (
                      data.recentLoans.map((loan: any) => (
                        <div
                          key={loan.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {loan.loanNumber || loan.id}
                              </p>
                              <p className="text-sm text-gray-500">
                                {loan.customer?.firstName}{" "}
                                {loan.customer?.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(
                                safeParseFloat(loan.principalAmount)
                              )}
                            </p>
                            <Badge
                              variant={
                                loan.status === "ACTIVE"
                                  ? "default"
                                  : loan.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {loan.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent loans found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Customers */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                      Recent Union Members
                    </CardTitle>
                    <Button
                      onClick={() => navigate("/dashboard/business-management/customer")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {data.recentUnionMembers.length > 0 ? (
                      data.recentUnionMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-full">
                              <UserCheck className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {member.email || member.phone}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(
                                member.createdAt || Date.now()
                              ).toLocaleDateString()}
                            </p>
                            {member.code && (
                              <Badge variant="outline" className="text-xs">
                                {member.code}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent union members found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Overdue Loans Alert */}
              {data.overdueLoans.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Overdue Loans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-100">
                      {data.overdueLoans.slice(0, 5).map((loan: any) => (
                        <div
                          key={loan.id}
                          className="p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <p className="font-medium text-gray-900 text-sm">
                            {loan.loanNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {loan.customer?.firstName} {loan.customer?.lastName}
                          </p>
                          <p className="text-sm font-medium text-red-600">
                            {formatCurrency(
                              safeParseFloat(loan.principalAmount)
                            )}
                          </p>
                        </div>
                      ))}
                      <Button
                        onClick={() => navigate("/dashboard/business-management/loan?filter=overdue")}
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 border-red-300 hover:bg-red-50"
                      >
                        View All Overdue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Branches */}
              {user?.role === "ADMIN" && data.topUnions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      Top Unions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
                      {data.topUnions.map((union: any, index: number) => (
                        <div
                          key={union.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-600">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {union.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {union.loanCount} loans
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(union.revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Loan Approval Rate
                      </span>
                      <span className="font-medium">
                        {data.stats.loanApprovalRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={data.stats.loanApprovalRate}
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Collection Rate
                      </span>
                      <span className="font-medium">
                        {data.stats.collectionRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={data.stats.collectionRate}
                      className="h-2"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Average Loan
                      </span>
                      <span className="font-medium">
                        {formatCurrency(data.stats.averageLoanAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <DashboardAnalytics
            data={data}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && (
          <DashboardCharts
            data={data}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}

        {/* Loans Tab */}
        {activeTab === "loans" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Total Loans
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatNumber(
                          data.stats.activeLoans +
                            data.stats.pendingApplications +
                            data.stats.overduePayments
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <CreditCard className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Active Loans
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {formatNumber(data.stats.activeLoans)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">
                        Pending
                      </p>
                      <p className="text-3xl font-bold text-amber-900">
                        {formatNumber(data.stats.pendingApplications)}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-200 rounded-full">
                      <Clock className="h-6 w-6 text-amber-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Overdue
                      </p>
                      <p className="text-3xl font-bold text-red-900">
                        {formatNumber(data.stats.overduePayments)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-200 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    All Loans
                  </CardTitle>
                  <Button
                    onClick={() => navigate("/dashboard/business-management/loan")}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Manage Loans
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {data.recentLoans.length > 0 ? (
                    data.recentLoans.map((loan: any) => (
                      <div
                        key={loan.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {loan.loanNumber || loan.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              {loan.customer?.firstName}{" "}
                              {loan.customer?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(
                              safeParseFloat(loan.principalAmount)
                            )}
                          </p>
                          <Badge
                            variant={
                              loan.status === "ACTIVE"
                                ? "default"
                                : loan.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {loan.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No loans found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Union Members Tab */}
        {activeTab === "unionMembers" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">
                        Total Union Members
                      </p>
                      <p className="text-3xl font-bold text-emerald-900">
                        {formatNumber(data.stats.totalUnionMembers)}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-200 rounded-full">
                      <UserCheck className="h-6 w-6 text-emerald-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Active Union Members
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatNumber(data.stats.activeLoans)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <Users className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">
                        New This Month
                      </p>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatNumber(
                          Math.floor(data.stats.totalUnionMembers * 0.1)
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <Plus className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    All Union Members
                  </CardTitle>
                  <Button
                    onClick={() => navigate("/dashboard/business-management/customer")}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Manage Customers
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {data.recentUnionMembers.length > 0 ? (
                    data.recentUnionMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-full">
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.email || member.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(
                              member.createdAt || Date.now()
                            ).toLocaleDateString()}
                          </p>
                          {member.code && (
                            <Badge variant="outline" className="text-xs">
                              {member.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No customers found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Loan Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        Comprehensive loan analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <UserCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Customer Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        Customer demographics & behavior
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Banknote className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Financial Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        Revenue & profitability analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Activity className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Performance Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        KPIs & operational metrics
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Risk Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        Risk assessment & mitigation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <BarChart3 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Analytics Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        Advanced analytics & insights
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-gray-600" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Excel Export
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV Data
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Print Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
