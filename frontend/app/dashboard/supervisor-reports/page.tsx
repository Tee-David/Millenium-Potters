"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/enum";
import { supervisorReportsApi, handleApiError } from "@/lib/api";
import { toast } from "sonner";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Activity,
  BarChart3,
  PieChartIcon,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";

// Interfaces
interface OfficerPerformance {
  officerId: string;
  officerName: string;
  email: string;
  totalUnions: number;
  totalMembers: number;
  verifiedMembers: number;
  pendingMembers: number;
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalDisbursed: number;
  totalRepaid: number;
  totalOutstanding: number;
  collectionRate: number;
  lastActivityAt: string | null;
}

interface DashboardSummary {
  totalOfficers: number;
  totalUnions: number;
  totalMembers: number;
  verifiedMembers: number;
  pendingMembers: number;
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalDisbursed: number;
  totalRepaid: number;
  totalOutstanding: number;
  collectionRate: number;
}

interface LoanStatusDistribution {
  status: string;
  count: number;
  amount: number;
}

interface MonthlyTrend {
  month: string;
  disbursed: number;
  repaid: number;
  newLoans: number;
  newMembers: number;
}

interface SupervisorDashboardData {
  supervisor: {
    id: string;
    name: string;
    email: string;
  };
  summary: DashboardSummary;
  officerPerformance: OfficerPerformance[];
  loanStatusDistribution: LoanStatusDistribution[];
  monthlyTrends: MonthlyTrend[];
}

interface ReportSession {
  id: string;
  reportType: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  totalOfficers: number;
  totalUnions: number;
  totalMembers: number;
  totalLoans: number;
  totalDisbursed: string;
  totalRepaid: string;
  collectionRate: string;
  generatedAt: string;
}

// Color palette for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22c55e",
  COMPLETED: "#3b82f6",
  PENDING_APPROVAL: "#f59e0b",
  APPROVED: "#8b5cf6",
  DEFAULTED: "#ef4444",
  WRITTEN_OFF: "#6b7280",
  DRAFT: "#d1d5db",
  CANCELED: "#94a3b8",
};

// Period options
const periodOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export default function SupervisorReportsPage() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    hasAnyRole,
  } = useAuth();

  // Check if user is supervisor or admin
  const isSupervisorOrAdmin = useCallback(() => {
    return hasAnyRole([UserRole.SUPERVISOR, UserRole.ADMIN]);
  }, [hasAnyRole]);

  const [dashboardData, setDashboardData] =
    useState<SupervisorDashboardData | null>(null);
  const [reportSessions, setReportSessions] = useState<ReportSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM"
  >("MONTHLY");

  // Calculate date range based on selected period
  const getDateRange = useCallback(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (selectedPeriod) {
      case "7d":
        start = subDays(now, 7);
        break;
      case "30d":
        start = subDays(now, 30);
        break;
      case "90d":
        start = subDays(now, 90);
        break;
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "custom":
        start = customStartDate ? new Date(customStartDate) : subDays(now, 30);
        end = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        start = subDays(now, 30);
    }

    return { start, end };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    console.log("📊 [SupervisorReports] fetchDashboardData called");
    console.log("📊 [SupervisorReports] Auth state:", {
      isAuthenticated,
      authLoading,
    });
    console.log(
      "📊 [SupervisorReports] isSupervisorOrAdmin():",
      isSupervisorOrAdmin()
    );

    if (!isAuthenticated || !isSupervisorOrAdmin()) {
      console.log(
        "📊 [SupervisorReports] Skipping fetch - auth conditions not met"
      );
      return;
    }

    setLoading(true);
    console.log("📊 [SupervisorReports] Starting dashboard fetch...");

    try {
      const { start, end } = getDateRange();
      console.log("📊 [SupervisorReports] Date range:", {
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const response = await supervisorReportsApi.getDashboard({
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      });

      console.log("📊 [SupervisorReports] Dashboard response:", response);
      console.log("📊 [SupervisorReports] Dashboard data:", response.data);

      setDashboardData(response.data);
      console.log("📊 [SupervisorReports] Dashboard data set successfully");
    } catch (error: any) {
      console.error("❌ [SupervisorReports] Error fetching dashboard:", error);
      console.error("❌ [SupervisorReports] Error response:", error?.response);
      console.error(
        "❌ [SupervisorReports] Error status:",
        error?.response?.status
      );
      console.error(
        "❌ [SupervisorReports] Error data:",
        error?.response?.data
      );

      // Don't show toast for rate limit errors, just retry later
      if (error?.response?.status !== 429) {
        toast.error("Failed to load dashboard data", {
          description: handleApiError(error),
        });
      }
    } finally {
      setLoading(false);
      console.log("📊 [SupervisorReports] Loading set to false");
    }
  }, [isAuthenticated, isSupervisorOrAdmin, getDateRange]);

  // Fetch report sessions
  const fetchReportSessions = useCallback(async () => {
    console.log("📋 [SupervisorReports] fetchReportSessions called");

    if (!isAuthenticated || !isSupervisorOrAdmin() || reportsLoading) {
      console.log("📋 [SupervisorReports] Skipping report sessions fetch");
      return;
    }

    setReportsLoading(true);
    console.log("📋 [SupervisorReports] Fetching report sessions...");

    try {
      const response = await supervisorReportsApi.getReportSessions({
        limit: 10,
      });
      console.log("📋 [SupervisorReports] Report sessions response:", response);
      setReportSessions(response.data.reports || []);
      console.log(
        "📋 [SupervisorReports] Report sessions set:",
        response.data.reports
      );
    } catch (error: any) {
      console.error("❌ [SupervisorReports] Error fetching reports:", error);
      console.error(
        "❌ [SupervisorReports] Error details:",
        error?.response?.data
      );
      // Silently handle rate limit errors
    } finally {
      setReportsLoading(false);
    }
  }, [isAuthenticated, isSupervisorOrAdmin]);

  // Generate report
  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { start, end } = getDateRange();
      await supervisorReportsApi.generateReport({
        reportType,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        title: reportTitle || undefined,
      });

      toast.success("Report generated successfully");
      setGenerateDialogOpen(false);
      setReportTitle("");
      fetchReportSessions();
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report", {
        description: handleApiError(error),
      });
    } finally {
      setGenerating(false);
    }
  };

  // Delete report
  const handleDeleteReport = async (id: string) => {
    try {
      await supervisorReportsApi.deleteReportSession(id);
      toast.success("Report deleted successfully");
      fetchReportSessions();
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report", {
        description: handleApiError(error),
      });
    }
  };

  useEffect(() => {
    console.log("🔄 [SupervisorReports] Initial useEffect triggered");
    console.log("🔄 [SupervisorReports] authLoading:", authLoading);
    console.log("🔄 [SupervisorReports] isAuthenticated:", isAuthenticated);
    console.log("🔄 [SupervisorReports] user:", user);
    console.log(
      "🔄 [SupervisorReports] isSupervisorOrAdmin():",
      isSupervisorOrAdmin()
    );

    if (!authLoading && isAuthenticated && isSupervisorOrAdmin()) {
      console.log(
        "🔄 [SupervisorReports] All conditions met, fetching data..."
      );
      fetchDashboardData();
      fetchReportSessions();
    } else {
      console.log("🔄 [SupervisorReports] Conditions not met, skipping fetch");
    }
  }, [authLoading, isAuthenticated]);

  // Refresh when period changes (with debounce to prevent 429 errors)
  useEffect(() => {
    console.log(
      "🔄 [SupervisorReports] Period change useEffect triggered, period:",
      selectedPeriod
    );

    if (
      !authLoading &&
      isAuthenticated &&
      isSupervisorOrAdmin() &&
      selectedPeriod !== "custom"
    ) {
      console.log(
        "🔄 [SupervisorReports] Period changed, will fetch after 300ms delay"
      );
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedPeriod]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          Please log in to access this page
        </p>
      </div>
    );
  }

  if (!isSupervisorOrAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">
          You don't have permission to access this page
        </p>
        <p className="text-sm text-muted-foreground">
          Only Supervisors and Admins can view reports
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Supervisor Reports
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor your credit officers' performance and team metrics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Period Selector */}
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDashboardData}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === "custom" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full sm:w-[140px]"
              />
              <span className="text-muted-foreground text-center hidden sm:block">
                to
              </span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full sm:w-[140px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                className="w-full sm:w-auto"
              >
                Apply
              </Button>
            </div>
          )}

          {/* Generate Report Dialog */}
          <Dialog
            open={generateDialogOpen}
            onOpenChange={setGenerateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Generate Report</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Report Session</DialogTitle>
                <DialogDescription>
                  Create a snapshot report of the current performance data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reportTitle">Report Title (Optional)</Label>
                  <Input
                    id="reportTitle"
                    placeholder="Enter report title"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportType}
                    onValueChange={(v) =>
                      setReportType(
                        v as
                          | "DAILY"
                          | "WEEKLY"
                          | "MONTHLY"
                          | "QUARTERLY"
                          | "CUSTOM"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setGenerateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport} disabled={generating}>
                  {generating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <Skeleton className="h-4 w-[80px] sm:w-[100px]" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <Skeleton className="h-6 sm:h-8 w-[50px] sm:w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardData ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Credit Officers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">
                  {dashboardData.summary.totalOfficers}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Managing {dashboardData.summary.totalUnions} unions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Members
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">
                  {dashboardData.summary.totalMembers}
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                  <Badge
                    variant="default"
                    className="bg-green-500 text-[10px] sm:text-xs px-1 sm:px-2"
                  >
                    {dashboardData.summary.verifiedMembers} verified
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-1 sm:px-2"
                  >
                    {dashboardData.summary.pendingMembers} pending
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Disbursed
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold truncate">
                  {formatCurrency(dashboardData.summary.totalDisbursed)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  From {dashboardData.summary.totalLoans} loans
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Collection
                </CardTitle>
                {dashboardData.summary.collectionRate >= 80 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 hidden sm:block" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 hidden sm:block" />
                )}
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">
                  {formatPercentage(dashboardData.summary.collectionRate)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {formatCurrency(dashboardData.summary.totalRepaid)} collected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <TabsList className="w-full sm:w-auto inline-flex h-auto p-1 flex-nowrap">
                <TabsTrigger
                  value="overview"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                >
                  <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Overview</span>
                  <span className="xs:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger
                  value="officers"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                >
                  <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Credit Officers</span>
                  <span className="sm:hidden">Officers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="trends"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                >
                  <Activity className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                >
                  <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Report History</span>
                  <span className="sm:hidden">History</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                {/* Loan Status Distribution */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      Loan Status Distribution
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Breakdown of loans by status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[250px] sm:h-[300px] p-2 sm:p-6 pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.loanStatusDistribution}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ status, count }) => `${status}: ${count}`}
                        >
                          {dashboardData.loanStatusDistribution.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  STATUS_COLORS[entry.status] ||
                                  COLORS[index % COLORS.length]
                                }
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} loans`,
                            name,
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Loan Summary Card */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      Loan Summary
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Quick overview of loan metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                          <span className="text-xs sm:text-sm">
                            Active Loans
                          </span>
                        </div>
                        <span className="font-semibold text-sm sm:text-base">
                          {dashboardData.summary.activeLoans}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-blue-500" />
                          <span className="text-xs sm:text-sm">
                            Completed Loans
                          </span>
                        </div>
                        <span className="font-semibold text-sm sm:text-base">
                          {dashboardData.summary.completedLoans}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500" />
                          <span className="text-xs sm:text-sm">
                            Defaulted Loans
                          </span>
                        </div>
                        <span className="font-semibold text-sm sm:text-base">
                          {dashboardData.summary.defaultedLoans}
                        </span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium">
                          Outstanding
                        </span>
                        <span className="font-bold text-sm sm:text-lg">
                          {formatCurrency(
                            dashboardData.summary.totalOutstanding
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Credit Officers Tab */}
            <TabsContent value="officers" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Credit Officer Performance
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Performance metrics for each credit officer
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm min-w-[120px]">
                            Officer
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">
                            Unions
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">
                            Members
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm hidden sm:table-cell">
                            Loans
                          </TableHead>
                          <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">
                            Disbursed
                          </TableHead>
                          <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">
                            Collected
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">
                            Rate
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm hidden lg:table-cell">
                            Last Activity
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.officerPerformance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <p className="text-muted-foreground">
                                No credit officers assigned yet
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          dashboardData.officerPerformance.map((officer) => (
                            <TableRow key={officer.officerId}>
                              <TableCell className="p-2 sm:p-4">
                                <div>
                                  <p className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                                    {officer.officerName}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                                    {officer.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2 sm:p-4 text-xs sm:text-sm">
                                {officer.totalUnions}
                              </TableCell>
                              <TableCell className="text-center p-2 sm:p-4">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs sm:text-sm">
                                    {officer.totalMembers}
                                  </span>
                                  {officer.pendingMembers > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] sm:text-xs mt-1 px-1"
                                    >
                                      {officer.pendingMembers} pending
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2 sm:p-4 hidden sm:table-cell">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs sm:text-sm">
                                    {officer.totalLoans}
                                  </span>
                                  <div className="flex gap-1">
                                    <Badge
                                      variant="default"
                                      className="text-[10px] sm:text-xs bg-green-500 px-1"
                                    >
                                      {officer.activeLoans}
                                    </Badge>
                                    {officer.defaultedLoans > 0 && (
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px] sm:text-xs px-1"
                                      >
                                        {officer.defaultedLoans}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">
                                {formatCurrency(officer.totalDisbursed)}
                              </TableCell>
                              <TableCell className="text-right p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">
                                {formatCurrency(officer.totalRepaid)}
                              </TableCell>
                              <TableCell className="text-center p-2 sm:p-4">
                                <Badge
                                  variant={
                                    officer.collectionRate >= 80
                                      ? "default"
                                      : officer.collectionRate >= 50
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className={`text-[10px] sm:text-xs px-1 sm:px-2 ${
                                    officer.collectionRate >= 80
                                      ? "bg-green-500"
                                      : ""
                                  }`}
                                >
                                  {formatPercentage(officer.collectionRate)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center p-2 sm:p-4 hidden lg:table-cell">
                                {officer.lastActivityAt ? (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    {format(
                                      new Date(officer.lastActivityAt),
                                      "MMM d"
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    Never
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Officer Performance Chart */}
              {dashboardData.officerPerformance.length > 0 && (
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      Officer Performance Comparison
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Disbursed vs Collected amounts by officer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px] sm:h-[350px] p-2 sm:p-6 pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dashboardData.officerPerformance}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="officerName"
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={80}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `₦${(value / 1000000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalDisbursed"
                          name="Disbursed"
                          fill="#3b82f6"
                        />
                        <Bar
                          dataKey="totalRepaid"
                          name="Collected"
                          fill="#22c55e"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Monthly Trends
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Disbursements and collections over the past 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] sm:h-[350px] p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                        yAxisId="left"
                        tickFormatter={(value) =>
                          `₦${(value / 1000000).toFixed(1)}M`
                        }
                      />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "Disbursed" || name === "Repaid") {
                            return formatCurrency(value);
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="disbursed"
                        name="Disbursed"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="repaid"
                        name="Repaid"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="newLoans"
                        name="New Loans"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* New Members Trend */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    New Members Trend
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    New union members registered each month
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="newMembers"
                        name="New Members"
                        fill="#8b5cf6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Report History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Saved Reports
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Previously generated report sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  {reportsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : reportSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        No reports generated yet
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setGenerateDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate First Report
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">
                            Title
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">
                            Type
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm hidden md:table-cell">
                            Period
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm hidden lg:table-cell">
                            Officers
                          </TableHead>
                          <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">
                            Disbursed
                          </TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">
                            Rate
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">
                            Generated
                          </TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportSessions.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium p-2 sm:p-4 text-xs sm:text-sm">
                              <div className="truncate max-w-[80px] sm:max-w-none">
                                {report.title}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                              <Badge
                                variant="outline"
                                className="text-[10px] sm:text-xs"
                              >
                                {report.reportType}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 hidden md:table-cell">
                              <span className="text-[10px] sm:text-xs">
                                {format(new Date(report.periodStart), "MMM d")}{" "}
                                - {format(new Date(report.periodEnd), "MMM d")}
                              </span>
                            </TableCell>
                            <TableCell className="text-center p-2 sm:p-4 hidden lg:table-cell text-xs sm:text-sm">
                              {report.totalOfficers}
                            </TableCell>
                            <TableCell className="text-right p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">
                              {formatCurrency(Number(report.totalDisbursed))}
                            </TableCell>
                            <TableCell className="text-center p-2 sm:p-4">
                              <Badge
                                variant={
                                  Number(report.collectionRate) >= 80
                                    ? "default"
                                    : "secondary"
                                }
                                className={`text-[10px] sm:text-xs ${
                                  Number(report.collectionRate) >= 80
                                    ? "bg-green-500"
                                    : ""
                                }`}
                              >
                                {formatPercentage(
                                  Number(report.collectionRate)
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {format(
                                  new Date(report.generatedAt),
                                  "MMM d, HH:mm"
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right p-2 sm:p-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Unable to load dashboard data
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchDashboardData}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
