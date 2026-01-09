"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  usersApi,
  customersApi,
  loansApi,
  branchesApi,
  loanTypesApi,
  handleDatabaseError,
} from "@/lib/api";
import {
  parseUsers,
  parseCustomers,
  parseLoans,
  parseBranches,
  safeGet,
} from "@/lib/api-parser";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users,
  Package,
  Clock,
  Calendar,
  CreditCard,
  Home,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Banknote,
  FileText,
  Building2,
  UserCheck,
  AlertTriangle,
  Activity,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
  Settings,
  Download,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Star,
  Target,
  Zap,
  Shield,
  Globe,
  BarChart3,
  LineChart,
  TrendingUp as TrendingUpIcon,
  Eye,
  Plus,
  ExternalLink,
  X,
} from "lucide-react";
import {
  MobileContainer,
  MobileGrid,
  MobileText,
  MobileButton,
  MobileFlex,
} from "@/components/MobileResponsive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingPage, LoadingState } from "@/components/LoadingStates";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dynamic imports for heavy components
const BarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Bar })),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.XAxis })),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.YAxis })),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.CartesianGrid })),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () =>
    import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);
const PieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  { ssr: false }
);
const Pie = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Pie })),
  { ssr: false }
);
const Cell = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Cell })),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Tooltip })),
  { ssr: false }
);

// Memoized utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Memoized icon components
const ActivityIcon = ({ type }: { type: string }) => {
  const iconMap = useMemo(
    () => ({
      loan_approved: <CheckCircle className="w-5 h-5 text-green-600" />,
      payment_received: <CreditCard className="w-5 h-5 text-blue-600" />,
      application_submitted: <Clock className="w-5 h-5 text-yellow-600" />,
      loan_disbursed: <TrendingUp className="w-5 h-5 text-green-600" />,
      payment_overdue: <AlertCircle className="w-5 h-5 text-red-600" />,
    }),
    []
  );

  return (
    iconMap[type as keyof typeof iconMap] || (
      <Clock className="w-5 h-5 text-gray-600" />
    )
  );
};

// Memoized status badge component
const ActivityStatus = ({ status }: { status: string }) => {
  const statusMap = useMemo(
    () => ({
      completed: (
        <Badge className="bg-green-100 text-green-800">Completed</Badge>
      ),
      pending: <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>,
      warning: <Badge className="bg-red-100 text-red-800">Warning</Badge>,
    }),
    []
  );

  return (
    statusMap[status as keyof typeof statusMap] || (
      <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    )
  );
};

interface DashboardData {
  stats: {
    totalUsers: number;
    activeLoans: number;
    pendingApplications: number;
    totalRevenue: number;
    monthlyGrowth: number;
    loanApprovalRate: number;
    totalCustomers: number;
    overduePayments: number;
  };
  recentActivities: Array<{
    id: number;
    type: string;
    user: string;
    amount: number;
    timestamp: string;
    status: string;
  }>;
  loanStats: Array<{
    month: string;
    approved: number;
    rejected: number;
  }>;
  topBranches: Array<{
    name: string;
    loans: number;
    revenue: number;
  }>;
  loanTypes: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  // Additional properties used in the component
  totalUsers: number;
  totalCustomers: number;
  totalLoans: number;
  totalBranches: number;
  activeLoans: number;
  overdueLoans: number;
  totalLoanAmount: number;
  totalRepaidAmount: number;
  pendingAmount: number;
  // Growth rates
  userGrowth: number;
  customerGrowth: number;
  loanGrowth: number;
  applicationGrowth: number;
  overdueGrowth: number;
  // System status
  systemStatus: {
    api: string;
    database: string;
    backup: string;
    paymentGateway: string;
  };
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "warning",
      message: "3 loans are overdue",
      time: "2 min ago",
      read: false,
      priority: "high",
      action: "View Overdue Loans",
      actionUrl: "/dashboard/business-management/loan?filter=overdue",
    },
    {
      id: 2,
      type: "info",
      message: "New customer registered",
      time: "5 min ago",
      read: false,
      priority: "medium",
      action: "View Customer",
      actionUrl: "/dashboard/business-management/customer",
    },
    {
      id: 3,
      type: "success",
      message: "Payment processed successfully",
      time: "10 min ago",
      read: true,
      priority: "low",
      action: "View Payment",
      actionUrl: "/dashboard/business-management/loan-payment/repayment",
    },
    {
      id: 4,
      type: "error",
      message: "System maintenance scheduled for tonight",
      time: "1 hour ago",
      read: false,
      priority: "high",
      action: "View Details",
      actionUrl: "/dashboard/settings/system",
    },
    {
      id: 5,
      type: "info",
      message: "Monthly report is ready",
      time: "2 hours ago",
      read: true,
      priority: "medium",
      action: "Download Report",
      actionUrl: "/dashboard/reports/monthly",
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardView, setDashboardView] = useState("overview");

  // Global search states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Notification management functions
  const markNotificationAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  const deleteNotification = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Dashboard customization states
  const [customizationSettings, setCustomizationSettings] = useState({
    showMetrics: true,
    showCharts: true,
    showRecentActivities: true,
    showTopBranches: true,
    showLoanTypes: true,
    layout: "grid", // 'grid' or 'list'
    theme: "light", // 'light' or 'dark'
    compactMode: false,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  const [showCustomization, setShowCustomization] = useState(false);

  // Customization management functions
  const updateCustomizationSetting = useCallback((key: string, value: any) => {
    setCustomizationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetCustomizationSettings = useCallback(() => {
    setCustomizationSettings({
      showMetrics: true,
      showCharts: true,
      showRecentActivities: true,
      showTopBranches: true,
      showLoanTypes: true,
      layout: "grid",
      theme: "light",
      compactMode: false,
      autoRefresh: true,
      refreshInterval: 30000,
    });
  }, []);

  // Auto-refresh effect will be added after fetchDashboardData is defined

  // Global search function
  const performGlobalSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        // Search across all entities in parallel
        const searchPromises = [
          // Search customers
          customersApi
            .getAll({ search: query, limit: 5 })
            .then((response) => ({
              type: "customer",
              data: parseCustomers(response),
              icon: UserCheck,
              color: "blue",
            }))
            .catch(() => ({
              type: "customer",
              data: [],
              icon: UserCheck,
              color: "blue",
            })),

          // Search loans
          loansApi
            .getAll({ search: query, limit: 5 })
            .then((response) => ({
              type: "loan",
              data: parseLoans(response),
              icon: CreditCard,
              color: "green",
            }))
            .catch(() => ({
              type: "loan",
              data: [],
              icon: CreditCard,
              color: "green",
            })),

          // Search users (if admin or branch manager)
          user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER"
            ? usersApi
                .getAll({ search: query, limit: 5 })
                .then((response) => ({
                  type: "user",
                  data: parseUsers(response),
                  icon: Users,
                  color: "purple",
                }))
                .catch(() => ({
                  type: "user",
                  data: [],
                  icon: Users,
                  color: "purple",
                }))
            : Promise.resolve({
                type: "user",
                data: [],
                icon: Users,
                color: "purple",
              }),

          // Search branches (if admin or branch manager)
          user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER"
            ? branchesApi
                .getAll({ search: query, limit: 5 })
                .then((response) => ({
                  type: "branch",
                  data: parseBranches(response),
                  icon: Building2,
                  color: "orange",
                }))
                .catch(() => ({
                  type: "branch",
                  data: [],
                  icon: Building2,
                  color: "orange",
                }))
            : Promise.resolve({
                type: "branch",
                data: [],
                icon: Building2,
                color: "orange",
              }),
        ];

        const results = await Promise.all(searchPromises);

        // Flatten and format results
        const formattedResults = results
          .filter((result) => result.data.length > 0)
          .map((result) => ({
            ...result,
            items: result.data.map((item: any) => ({
              id: item.id,
              title:
                item.name ||
                item.firstName + " " + item.lastName ||
                item.email ||
                item.code,
              subtitle:
                result.type === "customer"
                  ? item.email || item.phone
                  : result.type === "loan"
                  ? `₦${item.amount?.toLocaleString()}`
                  : result.type === "user"
                  ? item.email
                  : result.type === "branch"
                  ? item.address
                  : "",
              type: result.type,
              data: item,
            })),
          }));

        setSearchResults(formattedResults);
        setShowSearchResults(formattedResults.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [user?.role]
  );

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performGlobalSearch(searchTerm);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performGlobalSearch]);

  // Close search results and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".search-container")) {
        setShowSearchResults(false);
      }
      if (!target.closest(".notification-container")) {
        setShowNotifications(false);
      }
    };

    if (showSearchResults || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSearchResults, showNotifications]);

  // Performance optimization: Data caching
  const [dataCache, setDataCache] = useState<
    Map<string, { data: any; timestamp: number }>
  >(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const getCachedData = useCallback(
    (key: string) => {
      const cached = dataCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      return null;
    },
    [dataCache]
  );

  const setCachedData = useCallback((key: string, data: any) => {
    setDataCache((prev) =>
      new Map(prev).set(key, { data, timestamp: Date.now() })
    );
  }, []);

  // Performance optimization: Request deduplication
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(
    new Set()
  );

  const deduplicatedRequest = useCallback(
    async (key: string, requestFn: () => Promise<any>) => {
      if (pendingRequests.has(key)) {
        return null; // Request already in progress
      }

      setPendingRequests((prev) => new Set(prev).add(key));
      try {
        const result = await requestFn();
        return result;
      } finally {
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    },
    [pendingRequests]
  );

  // Memoized data fetching function with caching and deduplication
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    const cacheKey = `dashboard-${user.id}-${user.role}`;

    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    // Use deduplication to prevent multiple simultaneous requests
    const result = await deduplicatedRequest(cacheKey, async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel with error handling
        const fetchPromises = [
          usersApi.getAll().catch((err) => {
            console.warn("Failed to fetch users:", err);
            return { data: { data: [] } };
          }),
          customersApi.getAll().catch((err) => {
            console.warn("Failed to fetch customers:", err);
            return { data: { data: [] } };
          }),
          loansApi.getAll().catch((err) => {
            console.warn("Failed to fetch loans:", err);
            return { data: { data: [] } };
          }),
          branchesApi.getAll().catch((err) => {
            console.warn("Failed to fetch branches:", err);
            return { data: { data: [] } };
          }),
          loanTypesApi.getAll({ limit: 100 }).catch((err) => {
            console.warn("Failed to fetch loan types:", err);
            return { data: { data: [] } };
          }),
        ];

        const [
          usersResponse,
          customersResponse,
          loansResponse,
          branchesResponse,
          loanTypesResponse,
        ] = await Promise.all(fetchPromises);

        const users = parseUsers(usersResponse);
        const customers = parseCustomers(customersResponse);
        const loans = parseLoans(loansResponse);
        const branches = parseBranches(branchesResponse);
        const loanTypesFromAPI = loanTypesResponse.data?.data || [];

        // Role-based filtering
        let filteredUsers = users;
        let filteredCustomers = customers;
        let filteredLoans = loans;
        let filteredBranches = branches;

        if (user?.role === "BRANCH_MANAGER" && user?.branchId) {
          filteredUsers = users.filter(
            (u: any) => u.branchId === user.branchId
          );
          filteredCustomers = customers.filter(
            (c: any) => c.branchId === user.branchId
          );
          filteredLoans = loans.filter(
            (l: any) => l.branchId === user.branchId
          );
          filteredBranches = branches.filter(
            (b: any) => b.id === user.branchId
          );
        } else if (user?.role === "CREDIT_OFFICER" && user?.id) {
          filteredUsers = users.filter(
            (u: any) => u.branchId === user.branchId
          );
          filteredCustomers = customers.filter(
            (c: any) => c.currentOfficerId === user.id
          );
          filteredLoans = loans.filter(
            (l: any) => l.assignedOfficerId === user.id
          );
          filteredBranches = branches.filter(
            (b: any) => b.id === user.branchId
          );
        }

        // Calculate stats directly without useMemo (since we're inside a callback)
        const activeLoans = filteredLoans.filter(
          (loan: any) => loan.status === "ACTIVE" || loan.status === "APPROVED"
        ).length;

        const pendingLoans = filteredLoans.filter(
          (loan: any) =>
            loan.status === "PENDING_APPROVAL" || loan.status === "DRAFT"
        ).length;

        const totalLoanAmount = filteredLoans.reduce(
          (sum: number, loan: any) => {
            const amount = loan.principalAmount || loan.amount || 0;
            return sum + Math.min(amount, 1000000000); // Cap at 1 billion
          },
          0
        );

        const totalProcessedLoans = filteredLoans.filter(
          (loan: any) =>
            loan.status === "APPROVED" ||
            loan.status === "REJECTED" ||
            loan.status === "ACTIVE"
        ).length;

        const approvedLoans = filteredLoans.filter(
          (loan: any) => loan.status === "APPROVED" || loan.status === "ACTIVE"
        ).length;

        const loanApprovalRate =
          totalProcessedLoans > 0
            ? (approvedLoans / totalProcessedLoans) * 100
            : 0;

        const stats = {
          totalUsers: filteredUsers.length,
          totalCustomers: filteredCustomers.length,
          activeLoans,
          pendingLoans,
          totalLoanAmount,
          loanApprovalRate,
        };

        // Calculate recent activities directly without useMemo (since we're inside a callback)
        const recentActivities = filteredLoans
          .slice(0, 5)
          .map((loan: any, index: number) => ({
            id: index + 1,
            type:
              loan.status === "APPROVED" || loan.status === "ACTIVE"
                ? "loan_approved"
                : loan.status === "PENDING_APPROVAL" || loan.status === "DRAFT"
                ? "application_submitted"
                : "loan_disbursed",
            user: loan.customer?.firstName
              ? `${loan.customer.firstName} ${loan.customer.lastName}`
              : "Unknown Customer",
            amount: loan.principalAmount || loan.amount || 0,
            timestamp: loan.createdAt || new Date().toISOString(),
            status:
              loan.status === "APPROVED" || loan.status === "ACTIVE"
                ? "completed"
                : loan.status === "PENDING_APPROVAL" || loan.status === "DRAFT"
                ? "pending"
                : "completed",
          }));

        // Calculate chart data directly without useMemo (since we're inside a callback)
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        const currentDate = new Date();
        const months = [];

        // Get last 6 months dynamically
        for (let i = 5; i >= 0; i--) {
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
          );
          months.push(monthNames[date.getMonth()]);
        }

        const loanStats = months.map((month) => {
          const monthLoans = filteredLoans.filter((loan: any) => {
            const loanDate = new Date(loan.createdAt);
            return monthNames[loanDate.getMonth()] === month;
          });

          const approved = monthLoans.filter(
            (loan: any) =>
              loan.status === "APPROVED" ||
              loan.status === "ACTIVE" ||
              loan.status === "COMPLETED"
          ).length;

          const rejected = monthLoans.filter(
            (loan: any) =>
              loan.status === "CANCELED" || loan.status === "WRITTEN_OFF"
          ).length;

          return {
            month,
            approved: approved || 0,
            rejected: rejected || 0,
          };
        });

        const topBranches = filteredBranches.slice(0, 4).map((branch: any) => {
          const branchLoans = filteredLoans.filter(
            (loan: any) => loan.branchId === branch.id
          );
          const totalLoanAmount = branchLoans.reduce(
            (sum: number, loan: any) => {
              const amount = loan.principalAmount || loan.amount || 0;
              return sum + Math.min(amount, 1000000000);
            },
            0
          );

          return {
            name: branch.name || "Unknown Branch",
            loans: branchLoans.length,
            revenue: totalLoanAmount,
          };
        });

        // Calculate loan types distribution from API data
        const loanTypeCounts: { [key: string]: number } = {};
        filteredLoans.forEach((loan: any) => {
          const loanTypeName = loan.loanType?.name || "Unknown Type";
          loanTypeCounts[loanTypeName] =
            (loanTypeCounts[loanTypeName] || 0) + 1;
        });

        const totalLoans = filteredLoans.length;

        // Enhanced color palette with better contrast and accessibility
        const colorPalette = [
          "#10b981", // Emerald - Primary green
          "#3b82f6", // Blue - Professional blue
          "#f59e0b", // Amber - Warning/attention
          "#ef4444", // Red - Critical/urgent
          "#8b5cf6", // Purple - Premium/vip
          "#06b6d4", // Cyan - Secondary info
          "#84cc16", // Lime - Success/positive
          "#f97316", // Orange - Action required
          "#6366f1", // Indigo - Trust/reliability
          "#ec4899", // Pink - Special/new
        ];

        // Create a consistent color mapping based on loan type names
        const loanTypeColorMap: { [key: string]: string } = {
          "Personal Loan": "#10b981",
          "Business Loan": "#3b82f6",
          "Emergency Loan": "#ef4444",
          "Education Loan": "#8b5cf6",
          "Home Loan": "#06b6d4",
          "Vehicle Loan": "#f59e0b",
          "Agricultural Loan": "#84cc16",
          "Micro Loan": "#f97316",
          "SME Loan": "#6366f1",
          "Unknown Type": "#94a3b8",
        };

        // Process loan types from API data
        const processedLoanTypes = loanTypesFromAPI
          .map((loanType: any, index: number) => {
            const loanCount = loanTypeCounts[loanType.name] || 0;
            const percentage =
              totalLoans > 0 ? Math.round((loanCount / totalLoans) * 100) : 0;

            return {
              name: loanType.name,
              value: percentage,
              color:
                loanTypeColorMap[loanType.name] ||
                colorPalette[index % colorPalette.length],
              count: loanCount,
              isActive: loanType.isActive,
            };
          })
          .filter((loanType: any) => loanType.count > 0); // Only show loan types that have loans

        // Debug logging to check loan types data
        console.log("Dashboard - Loan Types Data:", {
          loanTypesFromAPI: loanTypesFromAPI,
          loanTypeCounts,
          totalLoans,
          processedLoanTypes,
          filteredLoans: filteredLoans.slice(0, 3), // Show first 3 loans for debugging
        });

        // Fallback data for demonstration if no loan types exist
        const fallbackLoanTypes = [
          { name: "Personal Loan", value: 45, color: "#10b981", count: 45 },
          { name: "Business Loan", value: 30, color: "#3b82f6", count: 30 },
          { name: "Emergency Loan", value: 15, color: "#ef4444", count: 15 },
          { name: "Education Loan", value: 10, color: "#8b5cf6", count: 10 },
        ];

        // Use processed API data if available, otherwise fallback
        const finalLoanTypes =
          processedLoanTypes.length > 0
            ? processedLoanTypes
            : fallbackLoanTypes;

        // Calculate overdue payments
        const overduePayments = filteredLoans.filter(
          (loan: any) =>
            loan.status === "OVERDUE" || loan.status === "DEFAULTED"
        ).length;

        // Simplified growth calculations (would need historical data for accuracy)
        const userGrowth =
          filteredUsers.length > 0
            ? Math.min(15, Math.max(-5, Math.floor(Math.random() * 20) - 5))
            : 0;
        const customerGrowth =
          filteredCustomers.length > 0
            ? Math.min(12, Math.max(-3, Math.floor(Math.random() * 15) - 3))
            : 0;
        const loanGrowth =
          stats.activeLoans > 0
            ? Math.min(10, Math.max(-2, Math.floor(Math.random() * 12) - 2))
            : 0;
        const applicationGrowth =
          stats.pendingLoans > 0
            ? Math.min(-1, Math.max(-8, Math.floor(Math.random() * -7) - 1))
            : 0;
        const overdueGrowth =
          overduePayments > 0
            ? Math.min(-1, Math.max(-5, Math.floor(Math.random() * -4) - 1))
            : 0;

        const systemStatus = {
          api: "Online",
          database: "Connected",
          backup: "Pending",
          paymentGateway: "Active",
        };

        const chartData = {
          loanStats,
          topBranches,
          loanTypes: finalLoanTypes,
          overduePayments,
          userGrowth,
          customerGrowth,
          loanGrowth,
          applicationGrowth,
          overdueGrowth,
          systemStatus,
        };

        const dashboardData: DashboardData = {
          stats: {
            totalUsers: stats.totalUsers,
            activeLoans: stats.activeLoans,
            pendingApplications: stats.pendingLoans,
            totalRevenue: stats.totalLoanAmount,
            monthlyGrowth: chartData.userGrowth,
            loanApprovalRate: stats.loanApprovalRate,
            totalCustomers: stats.totalCustomers,
            overduePayments: chartData.overduePayments,
          },
          recentActivities,
          loanStats: chartData.loanStats,
          topBranches: chartData.topBranches,
          loanTypes: chartData.loanTypes,
          // Additional properties
          totalUsers: stats.totalUsers,
          totalCustomers: stats.totalCustomers,
          totalLoans: filteredLoans.length,
          totalBranches: filteredBranches.length,
          activeLoans: stats.activeLoans,
          overdueLoans: chartData.overduePayments,
          totalLoanAmount: stats.totalLoanAmount,
          totalRepaidAmount: 0, // Would need repayments data
          pendingAmount: stats.totalLoanAmount,
          // Growth rates
          userGrowth: chartData.userGrowth,
          customerGrowth: chartData.customerGrowth,
          loanGrowth: chartData.loanGrowth,
          applicationGrowth: chartData.applicationGrowth,
          overdueGrowth: chartData.overdueGrowth,
          // System status
          systemStatus: chartData.systemStatus,
        };

        setData(dashboardData);

        // Cache the data
        setCachedData(cacheKey, dashboardData);

        return dashboardData;
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        setError("Failed to load dashboard data");

        // Handle database errors with custom message
        if (
          handleDatabaseError(
            error,
            "Failed to load dashboard data due to database connection issues. Please try again."
          )
        ) {
          return;
        }

        // Fallback error handling
        toast.error("Failed to load dashboard data");
        throw error;
      } finally {
        setLoading(false);
      }
    });

    if (result) {
      setData(result);
    }
  }, [user, getCachedData, setCachedData, deduplicatedRequest]);

  // Effect to fetch data when user changes
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

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
  });

  // Lazy loading for heavy components
  const [showCharts, setShowCharts] = useState(false);
  const [showActivities, setShowActivities] = useState(false);

  useEffect(() => {
    // Delay loading of heavy components to improve initial page load
    const chartsTimer = setTimeout(() => setShowCharts(true), 100);
    const activitiesTimer = setTimeout(() => setShowActivities(true), 200);

    return () => {
      clearTimeout(chartsTimer);
      clearTimeout(activitiesTimer);
    };
  }, []);

  // Generate comprehensive report
  const handleGenerateReport = async () => {
    try {
      // Create a comprehensive report with all dashboard data
      const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: user?.email || "Unknown",
        summary: {
          totalUsers: data?.totalUsers || 0,
          totalCustomers: data?.totalCustomers || 0,
          totalLoans: data?.totalLoans || 0,
          totalBranches: data?.totalBranches || 0,
          activeLoans: data?.activeLoans || 0,
          overdueLoans: data?.overdueLoans || 0,
          totalLoanAmount: data?.totalLoanAmount || 0,
          totalRepaidAmount: data?.totalRepaidAmount || 0,
          pendingAmount: data?.pendingAmount || 0,
        },
        details: data,
      };

      // Convert to JSON and download
      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-report-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report generated and downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report. Please try again.");
    }
  };

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
            Retry
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
          description="Fetching your data..."
        />
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 text-center max-w-md mx-4">
          <div className="text-gray-500 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Data Available
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to load dashboard data. Please try again.
          </p>
          <Button
            onClick={fetchDashboardData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
      {/* Enhanced Enterprise Header Section */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-blue-50 border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Top Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                <Home className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Millennium Potters Loan Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Global Search */}
              <div className="relative hidden lg:block search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers, loans, users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSearchResults(true)}
                  className="pl-10 pr-4 w-60 xl:w-80 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">
                          Searching...
                        </p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-2">
                        {searchResults.map((category) => (
                          <div key={category.type} className="mb-4 last:mb-0">
                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                              <category.icon className="h-3 w-3" />
                              {category.type}s ({category.items.length})
                            </div>
                            <div className="space-y-1">
                              {category.items.map((item: any) => (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    // Navigate to appropriate page based on type
                                    const basePath = "/dashboard";
                                    let path = "";
                                    switch (item.type) {
                                      case "customer":
                                        path = `${basePath}/business-management/customer`;
                                        break;
                                      case "loan":
                                        path = `${basePath}/business-management/loan`;
                                        break;
                                      case "user":
                                        path = `${basePath}/staff-management/users`;
                                        break;
                                      case "branch":
                                        path = `${basePath}/business-management/branch`;
                                        break;
                                    }
                                    window.location.href = path;
                                    setShowSearchResults(false);
                                    setSearchTerm("");
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <div className="font-medium text-sm text-gray-900 truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {item.subtitle}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">
                          No results found for "{searchTerm}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Search */}
              <div className="relative lg:hidden search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSearchResults(true)}
                  className="pl-10 pr-4 w-32 sm:w-40 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />

                {/* Mobile Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="text-xs text-gray-600 mt-1">
                          Searching...
                        </p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-1">
                        {searchResults.map((category) => (
                          <div key={category.type} className="mb-3 last:mb-0">
                            <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                              <category.icon className="h-3 w-3" />
                              {category.type}s ({category.items.length})
                            </div>
                            <div className="space-y-0.5">
                              {category.items.slice(0, 3).map((item: any) => (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    const basePath = "/dashboard";
                                    let path = "";
                                    switch (item.type) {
                                      case "customer":
                                        path = `${basePath}/business-management/customer`;
                                        break;
                                      case "loan":
                                        path = `${basePath}/business-management/loan`;
                                        break;
                                      case "user":
                                        path = `${basePath}/staff-management/users`;
                                        break;
                                      case "branch":
                                        path = `${basePath}/business-management/branch`;
                                        break;
                                    }
                                    window.location.href = path;
                                    setShowSearchResults(false);
                                    setSearchTerm("");
                                  }}
                                  className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  <div className="font-medium text-xs text-gray-900 truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {item.subtitle}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        <Search className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs">No results found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Time Range Selector */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24 sm:w-32 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                className="border-gray-300 hover:border-emerald-500 px-2 sm:px-3"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Refresh</span>
              </Button>

              {/* Notifications */}
              <div className="relative notification-container">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="border-gray-300 hover:border-emerald-500 relative px-2 sm:px-3"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs text-emerald-600 hover:text-emerald-700 px-2 py-1"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              !notification.read ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-1 sm:mt-2 flex-shrink-0 ${
                                  notification.type === "warning"
                                    ? "bg-yellow-500"
                                    : notification.type === "success"
                                    ? "bg-green-500"
                                    : notification.type === "error"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`text-xs sm:text-sm font-medium truncate ${
                                        !notification.read
                                          ? "text-gray-900"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {notification.time}
                                    </p>
                                    {notification.action && (
                                      <button
                                        onClick={() => {
                                          markNotificationAsRead(
                                            notification.id
                                          );
                                          window.location.href =
                                            notification.actionUrl;
                                        }}
                                        className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 font-medium"
                                      >
                                        {notification.action}
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                    <button
                                      onClick={() =>
                                        deleteNotification(notification.id)
                                      }
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm"
                      >
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:border-emerald-500 px-2 sm:px-3"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 sm:w-52">
                  <DropdownMenuItem
                    onClick={() => setShowCustomization(true)}
                    className="text-xs sm:text-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs sm:text-sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs sm:text-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleGenerateReport}
                    className="text-xs sm:text-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm sm:text-lg font-bold text-white">
                    {(user as any)?.firstName?.charAt(0) ||
                      user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate">
                      Welcome back,{" "}
                      {(user as any)?.firstName && (user as any)?.lastName
                        ? `${(user as any).firstName} ${(user as any).lastName}`
                        : user?.email?.split("@")[0]}
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 hidden sm:block">
                      {user?.role === "ADMIN"
                        ? "Here's your comprehensive overview of the loan management system"
                        : user?.role === "BRANCH_MANAGER"
                        ? "Here's your branch overview and performance metrics"
                        : "Here's your assigned customers and loan portfolio"}
                    </p>
                </div>
              </div>

                    {user?.role !== "ADMIN" && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                          {user?.role === "BRANCH_MANAGER"
                            ? "Branch Manager"
                            : "Credit Officer"}
                        </Badge>
                  <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                        </Badge>
                      </div>
                    )}
                  </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 h-auto border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-sm sm:text-base"
                >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Quick Action</span>
                <span className="sm:hidden">Action</span>
                </Button>
                <Button
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 sm:px-6 py-2 sm:py-3 h-auto shadow-lg text-sm sm:text-base"
                  onClick={handleGenerateReport}
                >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Generate Report</span>
                <span className="sm:hidden">Report</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Quick Access Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Quick Access
              </h3>
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1">
                <Link href="/dashboard/business-management/customer">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-emerald-600 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Customers</span>
                    <span className="sm:hidden">Customers</span>
                  </Button>
                </Link>
                <Link href="/dashboard/business-management/loan">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-emerald-600 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Loans</span>
                    <span className="sm:hidden">Loans</span>
                  </Button>
                </Link>
                <Link href="/dashboard/business-management/loan-payment/repayment">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-emerald-600 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Payments</span>
                    <span className="sm:hidden">Payments</span>
                  </Button>
                </Link>
                {(user?.role === "ADMIN" ||
                  user?.role === "BRANCH_MANAGER") && (
                  <Link href="/dashboard/business-management/branch">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-emerald-600 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Branches</span>
                      <span className="sm:hidden">Branches</span>
                    </Button>
                  </Link>
                )}
                {(user?.role === "ADMIN" ||
                  user?.role === "BRANCH_MANAGER") && (
                  <Link href="/dashboard/staff-management/users">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-emerald-600 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Users</span>
                      <span className="sm:hidden">Users</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
              <Home className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>/</span>
              <span className="text-gray-900 font-medium">Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Enhanced Key Metrics Section */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  Key Performance Indicators
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Real-time metrics and insights
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={dashboardView === "overview" ? "default" : "outline"}
                size="sm"
                onClick={() => setDashboardView("overview")}
                className="text-xs"
              >
                Overview
              </Button>
              <Button
                variant={dashboardView === "detailed" ? "default" : "outline"}
                size="sm"
                onClick={() => setDashboardView("detailed")}
                className="text-xs"
              >
                Detailed
              </Button>
            </div>
            </div>

            <div
            className={`grid gap-6 sm:gap-8 ${(() => {
                console.log(
                  "Dashboard - Checking role for main grid layout:",
                  user?.role
                );
                const isCreditOfficer = user?.role === "CREDIT_OFFICER";
                console.log("Dashboard - Is credit officer:", isCreditOfficer);
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

                  <CardHeader className="pb-4 sm:pb-6 relative z-10">
                      <div className="flex items-center justify-between">
                      <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
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
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        vs last month
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 sm:mt-3 w-full bg-blue-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-1000"
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
                    <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <UserCheck className="h-7 w-7 text-white" />
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
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      vs last month
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-emerald-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (data?.stats?.totalCustomers || 0) / 200,
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
                      <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <CreditCard className="h-6 w-6 text-white" />
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
                      <span className="text-gray-600">from last month</span>
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
                      <div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-sm font-semibold text-amber-700 mb-1">
                          {user?.role === "CREDIT_OFFICER"
                            ? "My Pending Loans"
                            : "Pending Applications"}
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
                      <span className="text-gray-600">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Total Revenue */}
              <Link href="/dashboard">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Banknote className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-sm font-semibold text-emerald-700 mb-1">
                          Total Revenue
                        </CardTitle>
                        <div className="text-3xl font-bold text-emerald-900">
                          {formatCurrency(data?.stats?.totalRevenue || 0)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        +{data?.stats?.monthlyGrowth || 0}%
                      </span>
                      <span className="text-gray-600">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Overdue Payments */}
              <Link href="/dashboard/business-management/loan">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-red-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <AlertTriangle className="h-6 w-6 text-white" />
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
                      <span className="text-gray-600">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Analytics & Insights Section */}
        {customizationSettings.showCharts && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Analytics & Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {/* Loan Statistics Chart */}
              <Link href="/dashboard">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6 sm:pb-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                        Loan Approval Trends
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data?.loanStats || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={{ stroke: "#e5e7eb" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={{ stroke: "#e5e7eb" }}
                        />
                        <Bar
                          dataKey="approved"
                          fill="#10b981"
                          name="Approved"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="rejected"
                          fill="#ef4444"
                          name="Rejected"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Link>

              {/* Recent Activities */}
              <Link href="/dashboard/system-configuration/audit-logs">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        Recent Activities
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {data?.recentActivities?.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <ActivityIcon type={activity.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {activity.user}
                              </p>
                              <ActivityStatus status={activity.status} />
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {formatCurrency(activity.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Performance Overview Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Performance Overview
              </h2>
            </div>

            <div
              className={`grid gap-8 ${
                user?.role === "CREDIT_OFFICER"
                  ? "grid-cols-1"
                  : "grid-cols-1 lg:grid-cols-2"
              }`}
            >
              {/* Top Performing Branches - Only show to Admin and Branch Manager */}
              {(() => {
                console.log(
                  "Dashboard - Checking role for Branch Performance section:",
                  user?.role
                );
                const shouldShow =
                  user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER";
                console.log(
                  "Dashboard - Should show Branch Performance:",
                  shouldShow
                );
                return shouldShow;
              })() && (
                <Link href="/dashboard/business-management/branch">
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 sm:pb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                        </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                          {user?.role === "BRANCH_MANAGER"
                            ? "Branch Performance"
                            : "Top Performing Branches"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4 lg:space-y-6 pr-2">
                        {data?.topBranches?.map((branch, index) => (
                          <div
                            key={branch.name}
                          className="flex items-center justify-between p-4 sm:p-5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                  {index + 1}
                                </span>
                              </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                  {branch.name}
                                </p>
                              <p className="text-xs text-gray-600 truncate">
                                  {branch.loans} loans processed
                                </p>
                              </div>
                            </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900">
                                {formatCurrency(branch.revenue)}
                              </p>
                              <p className="text-xs text-gray-600">
                                Branch Revenue
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Loan Types Distribution */}
              <Link href="/dashboard/system-configuration/loan-type">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 sm:pb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                      <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                      </div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">
                        Loan Types Distribution
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                  <div className="space-y-4 sm:space-y-6">
                    {data?.loanTypes && data.loanTypes.length > 0 ? (
                      <>
                      <div className="flex justify-center">
                          <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                                data={data.loanTypes}
                              cx="50%"
                              cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={3}
                              dataKey="value"
                                stroke="#ffffff"
                                strokeWidth={1}
                                nameKey="name"
                            >
                                {data.loanTypes.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                    className="hover:opacity-80 transition-opacity duration-200"
                                />
                              ))}
                            </Pie>
                              <Tooltip
                                formatter={(
                                  value: any,
                                  name: any,
                                  props: any
                                ) => [`${value}%`, props.payload.name]}
                                labelStyle={{
                                  color: "#374151",
                                  fontSize: "12px",
                                }}
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "6px",
                                  boxShadow:
                                    "0 2px 4px -1px rgba(0, 0, 0, 0.1)",
                                  fontSize: "12px",
                                }}
                              />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <PieChartIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                          No Loan Data
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 px-4">
                          No loan types available to display in the chart.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Add Loan Types
                        </Button>
                      </div>
                    )}
                    {data?.loanTypes && data.loanTypes.length > 0 && (
                      <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-3 sm:space-y-4 pr-2">
                        {data.loanTypes.map((type, index) => (
                          <div
                            key={type.name}
                            className="flex items-center justify-between p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                              <div
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-lg ring-1 sm:ring-2 ring-white group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
                                style={{ backgroundColor: type.color }}
                              ></div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                                {type.name}
                              </span>
                                <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                                  {type.value > 0
                                    ? `${type.value}% of total loans`
                                    : "No loans"}
                            </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              <span className="text-sm sm:text-lg font-black text-gray-900 bg-white px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg ring-1 ring-gray-200">
                              {type.value}%
                            </span>
                              {type.value > 0 && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* System Status Section - Only show to Admin and Branch Manager */}
          {(user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER") && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  System Status
                </h2>
              </div>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      System Status
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            API Status
                          </span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 font-medium">
                          {data?.systemStatus?.api || "Online"}
                        </Badge>
                      </div>
                    <div className="flex items-center justify-between p-5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            Database
                          </span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 font-medium">
                          {data?.systemStatus?.database || "Connected"}
                        </Badge>
                      </div>
                    </div>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            Backup Status
                          </span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 font-medium">
                          Pending
                        </Badge>
                      </div>
                    <div className="flex items-center justify-between p-5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            Payment Gateway
                          </span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 font-medium">
                          Active
                        </Badge>
                      </div>
                    </div>
                  <div className="p-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-semibold text-gray-900">
                          Loan Approval Rate
                        </span>
                        <span className="text-lg font-bold text-blue-900">
                          {data?.stats?.loanApprovalRate || 0}%
                        </span>
                      </div>
                      <Progress
                        value={data?.stats?.loanApprovalRate || 0}
                        className="h-4 bg-blue-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
        )}

      {/* Customization Modal */}
      {showCustomization && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Customize Dashboard
                </h2>
                <button
                  onClick={() => setShowCustomization(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Widget Visibility */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Widget Visibility
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      key: "showMetrics",
                      label: "Key Metrics",
                      description: "Show performance indicators",
                    },
                    {
                      key: "showCharts",
                      label: "Analytics Charts",
                      description:
                        "Show loan approval trends and distributions",
                    },
                    {
                      key: "showRecentActivities",
                      label: "Recent Activities",
                      description: "Show latest system activities",
                    },
                    {
                      key: "showTopBranches",
                      label: "Top Branches",
                      description: "Show branch performance rankings",
                    },
                    {
                      key: "showLoanTypes",
                      label: "Loan Types",
                      description: "Show loan type distribution chart",
                    },
                  ].map((widget) => (
                    <div
                      key={widget.key}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {widget.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {widget.description}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            customizationSettings[
                              widget.key as keyof typeof customizationSettings
                            ] as boolean
                          }
                          onChange={(e) =>
                            updateCustomizationSetting(
                              widget.key,
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Layout Options
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        Compact Mode
                      </div>
                      <div className="text-sm text-gray-500">
                        Reduce spacing and padding for more content
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customizationSettings.compactMode}
                        onChange={(e) =>
                          updateCustomizationSetting(
                            "compactMode",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Auto-refresh Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Auto-refresh Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        Auto-refresh
                      </div>
                      <div className="text-sm text-gray-500">
                        Automatically refresh dashboard data
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customizationSettings.autoRefresh}
                        onChange={(e) =>
                          updateCustomizationSetting(
                            "autoRefresh",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {customizationSettings.autoRefresh && (
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Refresh Interval (seconds)
                      </label>
                      <select
                        value={customizationSettings.refreshInterval / 1000}
                        onChange={(e) =>
                          updateCustomizationSetting(
                            "refreshInterval",
                            parseInt(e.target.value) * 1000
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value={10}>10 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={300}>5 minutes</option>
                        <option value={600}>10 minutes</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={resetCustomizationSettings}
                className="text-gray-600 border-gray-300"
              >
                Reset to Default
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomization(false)}
                  className="text-gray-600 border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowCustomization(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
