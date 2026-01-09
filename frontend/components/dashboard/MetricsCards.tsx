"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Clock,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface MetricsCardsProps {
  data: any;
  user: any;
  formatCurrency: (amount: number) => string;
}

export default function MetricsCards({
  data,
  user,
  formatCurrency,
}: MetricsCardsProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Key Performance Indicators
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time metrics and performance insights
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      <div
        className={`grid gap-4 sm:gap-6 ${(() => {
          const isCreditOfficer = user?.role === "CREDIT_OFFICER";
          return isCreditOfficer
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
        })()}`}
      >
        {/* Total Users - Only show for Admins and Branch Managers */}
        {(user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER") && (
          <Link href="/dashboard/staff-management/users">
            <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 hover:from-blue-100 hover:via-blue-200 hover:to-indigo-200 relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <CardTitle className="text-xs sm:text-sm font-bold text-blue-800 mb-1 sm:mb-2 truncate">
                      {user?.role === "BRANCH_MANAGER"
                        ? "Branch Staff"
                        : "Total Users"}
                    </CardTitle>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-900 group-hover:scale-105 transition-transform duration-300">
                      {data?.stats?.totalUsers?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    {(data?.userGrowth || 0) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 animate-pulse" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 animate-pulse" />
                    )}
                    <span
                      className={`font-bold ${
                        (data?.userGrowth || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(data?.userGrowth || 0) >= 0 ? "+" : ""}
                      {data?.userGrowth || 0}%
                    </span>
                    <span className="text-gray-600">vs last month</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 sm:mt-3 w-full bg-blue-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 group-hover:bg-blue-700"
                    style={{
                      width: `${Math.min(
                        (data?.stats?.totalUsers || 0) / 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </CardContent>

              {/* Corner Badge */}
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 group-hover:bg-white transition-colors duration-300">
                <ExternalLink className="h-3 w-3 text-blue-600" />
              </div>
            </Card>
          </Link>
        )}

        {/* Total Customers */}
        <Link href="/dashboard/business-management/customer">
          <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 hover:from-emerald-100 hover:via-emerald-200 hover:to-green-200 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-sm font-bold text-emerald-800 mb-2">
                    {user?.role === "CREDIT_OFFICER"
                      ? "My Customers"
                      : "Total Customers"}
                  </CardTitle>
                  <div className="text-4xl font-black text-emerald-900 group-hover:scale-105 transition-transform duration-300">
                    {data?.stats?.totalCustomers?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {(data?.customerGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 animate-pulse" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 animate-pulse" />
                  )}
                  <span
                    className={`font-bold ${
                      (data?.customerGrowth || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(data?.customerGrowth || 0) >= 0 ? "+" : ""}
                    {data?.customerGrowth || 0}%
                  </span>
                  <span className="text-gray-600">vs last month</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-emerald-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500 group-hover:bg-emerald-700"
                  style={{
                    width: `${Math.min(
                      (data?.stats?.totalCustomers || 0) / 1000,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>

            {/* Corner Badge */}
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 group-hover:bg-white transition-colors duration-300">
              <ExternalLink className="h-3 w-3 text-emerald-600" />
            </div>
          </Card>
        </Link>

        {/* Active Loans */}
        <Link href="/dashboard/business-management/loan">
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-sm font-semibold text-purple-700 mb-1">
                    {user?.role === "CREDIT_OFFICER"
                      ? "My Active Loans"
                      : "Active Loans"}
                  </CardTitle>
                  <div className="text-3xl font-bold text-purple-900">
                    {data?.stats?.activeLoans || 0}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                {(data?.loanGrowth || 0) >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    (data?.loanGrowth || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(data?.loanGrowth || 0) >= 0 ? "+" : ""}
                  {data?.loanGrowth || 0}%
                </span>
                <span className="text-gray-600">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Applications */}
        <Link
          href={
            user?.role === "ADMIN"
              ? "/dashboard/admin/loan-management"
              : "/dashboard/business-management/loan"
          }
        >
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-sm font-semibold text-amber-700 mb-1">
                    Pending Applications
                  </CardTitle>
                  <div className="text-3xl font-bold text-amber-900">
                    {data?.stats?.pendingApplications || 0}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                {(data?.applicationGrowth || 0) >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    (data?.applicationGrowth || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(data?.applicationGrowth || 0) >= 0 ? "+" : ""}
                  {data?.applicationGrowth || 0}%
                </span>
                <span className="text-gray-600">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Revenue */}
        <Link href="/dashboard">
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-sm font-semibold text-green-700 mb-1">
                    Total Revenue
                  </CardTitle>
                  <div className="text-3xl font-bold text-green-900">
                    {formatCurrency(data?.stats?.totalRevenue || 0)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">+12.5%</span>
                <span className="text-gray-600">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Overdue Payments */}
        <Link href="/dashboard/business-management/loan">
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-sm font-semibold text-red-700 mb-1">
                    Overdue Payments
                  </CardTitle>
                  <div className="text-3xl font-bold text-red-900">
                    {data?.stats?.overduePayments || 0}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                {(data?.overdueGrowth || 0) >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                )}
                <span
                  className={`font-medium ${
                    (data?.overdueGrowth || 0) >= 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {(data?.overdueGrowth || 0) >= 0 ? "+" : ""}
                  {data?.overdueGrowth || 0}%
                </span>
                <span className="text-gray-600">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
