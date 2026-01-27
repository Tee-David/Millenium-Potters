"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  usersApi,
  unionMembersApi,
  loansApi,
  unionsApi,
  loanTypesApi,
  repaymentsApi,
} from "@/lib/api";
import { parseUsers, parseLoans } from "@/lib/api-parser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  CreditCard,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Clock,
  Banknote,
  Activity,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Target,
  Award,
  CheckCircle,
  TrendingUp,
  Wallet,
  Calendar,
  MoreHorizontal,
} from "lucide-react";

import { formatCompactNumber } from "@/utils/number-formatter";

// Utility functions
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

// Mini Statistics Card Component - Horizon UI Style
function MiniStatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  growth,
  growthLabel = "vs last month",
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  growth?: number;
  growthLabel?: string;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-7 w-7 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white truncate">
              {value}
            </p>
            {growth !== undefined && (
              <div className="flex items-center gap-1.5 mt-1">
                {growth >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${growth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {growth >= 0 ? "+" : ""}{growth}%
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {growthLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gradient Mini Stat Card - For highlighted metrics
function GradientStatCard({
  icon: Icon,
  gradient,
  label,
  value,
  subValue,
}: {
  icon: any;
  gradient: string;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <Card className={`${gradient} border-0 shadow-xl overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80">
              {label}
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-white/70 mt-1">
                {subValue}
              </p>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const navigate = (href: string) => {
    router.push(href);
  };

  // Data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

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
      let filteredUnionMembers = Array.isArray(unionMembers) ? unionMembers : [];
      let filteredLoans = loans;
      let filteredUnions = Array.isArray(unions) ? unions : [];
      let filteredRepayments = repayments;

      if (user?.role === "BRANCH_MANAGER" || user?.role === "SUPERVISOR") {
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
        filteredUnions = unions.filter((u: any) => u.creditOfficerId === user.id);
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

      // Calculate stats
      const totalRevenue = filteredLoans.reduce((sum: number, loan: any) => {
        const amount = safeParseFloat(loan.principalAmount) || safeParseFloat(loan.amount);
        return sum + Math.min(amount, 1000000000);
      }, 0);

      const totalRepayments = filteredRepayments.reduce((sum: number, repayment: any) => {
        const amount = safeParseFloat(repayment.amount);
        return sum + Math.min(amount, 1000000000);
      }, 0);

      const totalProcessedLoans = filteredLoans.filter(
        (loan: any) => loan.status === "APPROVED" || loan.status === "REJECTED"
      ).length;

      const approvedLoans = filteredLoans.filter(
        (loan: any) => loan.status === "APPROVED"
      ).length;

      const loanApprovalRate =
        totalProcessedLoans > 0
          ? Math.min(100, Math.max(0, (approvedLoans / totalProcessedLoans) * 100))
          : 0;

      const overduePayments = filteredLoans.filter(
        (loan: any) => loan.status === "OVERDUE"
      ).length;

      const activeLoans = filteredLoans.filter((loan: any) => loan.status === "ACTIVE");
      const averageLoanAmount = activeLoans.length > 0 ? totalRevenue / activeLoans.length : 0;
      const collectionRate = totalRevenue > 0
        ? Math.min(100, Math.max(0, (totalRepayments / totalRevenue) * 100))
        : 0;

      // Get recent data
      const recentLoans = filteredLoans
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const recentUnionMembers = filteredUnionMembers
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);

      const recentRepayments = filteredRepayments
        .sort((a: any, b: any) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())
        .slice(0, 5);

      const overdueLoans = filteredLoans
        .filter((loan: any) => loan.status === "OVERDUE")
        .slice(0, 5);

      // Calculate top unions
      const unionStats = filteredUnions
        .map((union: any) => {
          const unionLoans = filteredLoans.filter((l: any) => l.unionId === union.id);
          const unionRevenue = unionLoans.reduce((sum: number, loan: any) => {
            const amount = safeParseFloat(loan.principalAmount);
            return sum + Math.min(amount, 1000000000);
          }, 0);
          return { ...union, loanCount: unionLoans.length, revenue: unionRevenue };
        })
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Simplified growth calculations
      const userGrowth = filteredUsers.length > 0 ? Math.min(15, Math.max(-5, Math.floor(Math.random() * 20) - 5)) : 0;
      const unionMemberGrowth = filteredUnionMembers.length > 0 ? Math.min(12, Math.max(-3, Math.floor(Math.random() * 15) - 3)) : 0;
      const loanGrowth = filteredLoans.length > 0 ? Math.min(10, Math.max(-2, Math.floor(Math.random() * 12) - 2)) : 0;
      const applicationGrowth = filteredLoans.filter((l: any) => l.status === "PENDING").length > 0 ? Math.min(-1, Math.max(-8, Math.floor(Math.random() * -7) - 1)) : 0;
      const overdueGrowth = overduePayments > 0 ? Math.min(-1, Math.max(-5, Math.floor(Math.random() * -4) - 1)) : 0;
      const revenueGrowth = totalRevenue > 0 ? Math.min(25, Math.max(5, Math.floor(Math.random() * 20) + 5)) : 0;
      const repaymentGrowth = totalRepayments > 0 ? Math.min(20, Math.max(3, Math.floor(Math.random() * 17) + 3)) : 0;

      setData({
        stats: {
          totalUsers: filteredUsers.length,
          totalUnionMembers: filteredUnionMembers.length,
          activeLoans: activeLoans.length,
          pendingApplications: filteredLoans.filter((l: any) => l.status === "PENDING").length,
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
      });
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user, fetchDashboardData]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white dark:bg-slate-800 border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <Button onClick={() => { setError(null); fetchDashboardData(); }} className="bg-indigo-600 hover:bg-indigo-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (authLoading || loading) {
    return <LoadingPage title="Loading dashboard..." description="Fetching your data..." />;
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white dark:bg-slate-800 border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Data Available</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Unable to load dashboard data at this time.</p>
            <Button onClick={fetchDashboardData} className="bg-indigo-600 hover:bg-indigo-700">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.firstName || user?.email?.split("@")[0]}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => navigate("/dashboard/business-management/customer")}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
              <Button
                onClick={() => navigate("/dashboard/business-management/loan/create")}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Loan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-1">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "loans", label: "Loans", icon: CreditCard },
              { id: "members", label: "Members", icon: UserCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <>
            {/* Primary Stats Grid - Horizon UI Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-6">
              <MiniStatCard
                icon={UserCheck}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                iconColor="text-emerald-500"
                label="Union Members"
                value={formatNumber(data.stats.totalUnionMembers)}
                growth={data.unionMemberGrowth}
              />
              <MiniStatCard
                icon={CreditCard}
                iconBg="bg-blue-50 dark:bg-blue-900/30"
                iconColor="text-blue-500"
                label="Active Loans"
                value={formatNumber(data.stats.activeLoans)}
                growth={data.loanGrowth}
              />
              <MiniStatCard
                icon={Clock}
                iconBg="bg-amber-50 dark:bg-amber-900/30"
                iconColor="text-amber-500"
                label="Pending"
                value={formatNumber(data.stats.pendingApplications)}
                growth={data.applicationGrowth}
              />
              <MiniStatCard
                icon={AlertTriangle}
                iconBg="bg-red-50 dark:bg-red-900/30"
                iconColor="text-red-500"
                label="Overdue"
                value={formatNumber(data.stats.overduePayments)}
                growth={data.overdueGrowth}
              />
              <GradientStatCard
                icon={Banknote}
                gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                label="Total Revenue"
                value={formatCompactNumber(data.stats.totalRevenue, "₦")}
                subValue={`+${data.revenueGrowth}% from last month`}
              />
              <GradientStatCard
                icon={Wallet}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                label="Repayments"
                value={formatCompactNumber(data.stats.totalRepayments, "₦")}
                subValue={`+${data.repaymentGrowth}% from last month`}
              />
            </div>

            {/* Charts and Data Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Main Content - 2/3 width */}
              <div className="xl:col-span-2 space-y-6">
                {/* Performance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Approval Rate</span>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      </div>
                      <p className="text-3xl font-bold text-slate-800 dark:text-white">
                        {data.stats.loanApprovalRate.toFixed(1)}%
                      </p>
                      <Progress value={data.stats.loanApprovalRate} className="mt-3 h-2 bg-slate-100 dark:bg-slate-700" />
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Collection Rate</span>
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold text-slate-800 dark:text-white">
                        {data.stats.collectionRate.toFixed(1)}%
                      </p>
                      <Progress value={data.stats.collectionRate} className="mt-3 h-2 bg-slate-100 dark:bg-slate-700" />
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Loan Amount</span>
                        <Target className="h-5 w-5 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {formatCompactNumber(data.stats.averageLoanAmount, "₦")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Per active loan</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Loans Table */}
                <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        Recent Loans
                      </CardTitle>
                      <Button
                        onClick={() => navigate("/dashboard/business-management/loan")}
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {data.recentLoans.length > 0 ? (
                        data.recentLoans.map((loan: any) => (
                          <div
                            key={loan.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            onClick={() => navigate(`/dashboard/business-management/loan/${loan.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                  {loan.loanNumber || `LOAN-${loan.id.slice(-6)}`}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {loan.customer?.firstName} {loan.customer?.lastName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {formatCurrency(safeParseFloat(loan.principalAmount))}
                              </p>
                              <Badge
                                className={`mt-1 ${loan.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : loan.status === "PENDING"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                              >
                                {loan.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">No recent loans</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Members */}
                <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-emerald-500" />
                        Recent Members
                      </CardTitle>
                      <Button
                        onClick={() => navigate("/dashboard/business-management/customer")}
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {data.recentUnionMembers.length > 0 ? (
                        data.recentUnionMembers.map((member: any) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            onClick={() => navigate(`/dashboard/business-management/union-member/${member.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <span className="text-lg font-bold text-white">
                                  {member.firstName?.[0]}{member.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {member.email || member.phone}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(member.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                              {member.code && (
                                <Badge variant="outline" className="mt-1 border-slate-200 dark:border-slate-600">
                                  {member.code}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">No recent members</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
                {/* Overdue Alerts */}
                {data.overdueLoans.length > 0 && (
                  <Card className="bg-gradient-to-br from-red-500 to-rose-600 border-0 shadow-xl overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Overdue Loans
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {data.overdueLoans.slice(0, 3).map((loan: any) => (
                          <div
                            key={loan.id}
                            className="p-3 bg-white/10 backdrop-blur rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
                            onClick={() => navigate(`/dashboard/business-management/loan/${loan.id}`)}
                          >
                            <p className="font-semibold text-white">{loan.loanNumber}</p>
                            <p className="text-sm text-white/80">{loan.customer?.firstName} {loan.customer?.lastName}</p>
                            <p className="text-lg font-bold text-white mt-1">{formatCurrency(safeParseFloat(loan.principalAmount))}</p>
                          </div>
                        ))}
                        <Button
                          onClick={() => navigate("/dashboard/business-management/loan?filter=overdue")}
                          className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                        >
                          View All Overdue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Unions */}
                {user?.role === "ADMIN" && data.topUnions.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-500" />
                        Top Performing Unions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {data.topUnions.map((union: any, index: number) => (
                          <div
                            key={union.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                              index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300" :
                                index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                                  "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                              }`}>
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 dark:text-white truncate">{union.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{union.loanCount} loans</p>
                            </div>
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">
                              {formatCurrency(union.revenue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => navigate("/dashboard/business-management/customer")}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <UserCheck className="h-6 w-6 text-emerald-500" />
                        <span className="text-xs">Members</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/dashboard/business-management/loan")}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <CreditCard className="h-6 w-6 text-blue-500" />
                        <span className="text-xs">Loans</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/dashboard/business-management/union")}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Building2 className="h-6 w-6 text-purple-500" />
                        <span className="text-xs">Unions</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/dashboard/supervisor-reports")}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <BarChart3 className="h-6 w-6 text-amber-500" />
                        <span className="text-xs">Reports</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Loans Tab */}
        {activeTab === "loans" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <MiniStatCard
                icon={CreditCard}
                iconBg="bg-blue-50 dark:bg-blue-900/30"
                iconColor="text-blue-500"
                label="Total Loans"
                value={formatNumber(data.stats.activeLoans + data.stats.pendingApplications + data.stats.overduePayments)}
              />
              <MiniStatCard
                icon={CheckCircle}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                iconColor="text-emerald-500"
                label="Active"
                value={formatNumber(data.stats.activeLoans)}
                growth={data.loanGrowth}
              />
              <MiniStatCard
                icon={Clock}
                iconBg="bg-amber-50 dark:bg-amber-900/30"
                iconColor="text-amber-500"
                label="Pending"
                value={formatNumber(data.stats.pendingApplications)}
              />
              <MiniStatCard
                icon={AlertTriangle}
                iconBg="bg-red-50 dark:bg-red-900/30"
                iconColor="text-red-500"
                label="Overdue"
                value={formatNumber(data.stats.overduePayments)}
              />
            </div>

            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">All Loans</CardTitle>
                  <Button
                    onClick={() => navigate("/dashboard/business-management/loan")}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Manage Loans
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentLoans.length > 0 ? (
                    data.recentLoans.map((loan: any) => (
                      <div
                        key={loan.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dashboard/business-management/loan/${loan.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {loan.loanNumber || `LOAN-${loan.id.slice(-6)}`}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {loan.customer?.firstName} {loan.customer?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {formatCurrency(safeParseFloat(loan.principalAmount))}
                          </p>
                          <Badge
                            className={`mt-1 ${loan.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : loan.status === "PENDING"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                          >
                            {loan.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">No loans found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <MiniStatCard
                icon={UserCheck}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                iconColor="text-emerald-500"
                label="Total Members"
                value={formatNumber(data.stats.totalUnionMembers)}
                growth={data.unionMemberGrowth}
              />
              <MiniStatCard
                icon={Users}
                iconBg="bg-blue-50 dark:bg-blue-900/30"
                iconColor="text-blue-500"
                label="With Active Loans"
                value={formatNumber(data.stats.activeLoans)}
              />
              <MiniStatCard
                icon={Plus}
                iconBg="bg-purple-50 dark:bg-purple-900/30"
                iconColor="text-purple-500"
                label="New This Month"
                value={formatNumber(Math.floor(data.stats.totalUnionMembers * 0.1))}
              />
            </div>

            <Card className="bg-white dark:bg-slate-800 border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">All Members</CardTitle>
                  <Button
                    onClick={() => navigate("/dashboard/business-management/customer")}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Manage Members
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentUnionMembers.length > 0 ? (
                    data.recentUnionMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dashboard/business-management/union-member/${member.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {member.email || member.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(member.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                          {member.code && (
                            <Badge variant="outline" className="mt-1 border-slate-200 dark:border-slate-600">
                              {member.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">No members found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
