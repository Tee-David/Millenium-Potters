"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BranchManagerOrAdmin,
  AccessDenied,
} from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/SearchableSelect";
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
  Plus,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  FileText,
  CreditCard,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { auth, enhancedApi, api, usersApi } from "@/lib/api";
import { UserRole } from "@/lib/enum";
import { parseUsers, transformUser } from "@/lib/api-parser";
import { getAccessToken } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MobileContainer } from "@/components/ui/mobile-container";
import { MobileTable } from "@/components/ui/mobile-table";
import { MobileCard } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";

interface BranchTransfer {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role: string;
    branchId?: string;
    branch?: {
      id: string;
      name: string;
      code: string;
    };
  };
  fromBranch?: {
    id: string;
    name: string;
    code: string;
  };
  toBranch: {
    id: string;
    name: string;
    code: string;
  };
  reason?: string;
  status: string;
  transferDate: string;
  effectiveDate: string;
  customersTransferred: number;
  loansTransferred: number;
  repaymentsTransferred: number;
  notes?: string;
  createdBy: {
    id: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Branch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

function BranchTransferManagementPageContent() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingTransfer, setCreatingTransfer] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [executingTransferId, setExecutingTransferId] = useState<string | null>(
    null
  );
  const [cancellingTransferId, setCancellingTransferId] = useState<
    string | null
  >(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  // Create transfer form
  const [transferForm, setTransferForm] = useState({
    userId: "",
    fromBranchId: "",
    toBranchId: "",
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0], // Set to today by default
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check authentication
      const token = getAccessToken();
      const user = localStorage.getItem("user");
      console.log("Auth check - Token exists:", !!token);
      console.log("Auth check - User exists:", !!user);
      console.log(
        "Auth check - User role:",
        user ? JSON.parse(user).role : "No user"
      );

      if (!token) {
        console.error("No authentication token found");
        toast.error("Please log in to view branch transfers");
        return;
      }
      const [transfersRes, usersRes, branchesRes] = await Promise.all([
        enhancedApi.branchTransfers.getAll().catch((err) => {
          console.error("Transfers API error:", err);
          console.error("Error details:", err.response?.data);
          console.error("Error status:", err.response?.status);
          return { data: { data: { transfers: [] } } };
        }),
        api.get("/users?role=CREDIT_OFFICER").catch((err) => {
          console.error("Credit Officers API error:", err);
          console.error("Error details:", err.response?.data);
          // Fallback: try alternative endpoint
          return api
            .get("/users")
            .then((res) => {
              console.log("Fetched all users, will filter for CREDIT_OFFICER");
              return res;
            })
            .catch(() => ({ data: { data: [] } }));
        }),
        api.get("/branches").catch((err) => {
          console.error("Branches API error:", err);
          return { data: { data: [] } };
        }),
      ]);

      // Ensure all data is arrays to prevent .map() errors
      console.log("Transfers API response:", transfersRes.data);
      console.log("Transfers data structure:", {
        "transfersRes.data": transfersRes.data,
        "transfersRes.data.data": transfersRes.data.data,
        "transfersRes.data.data.transfers": transfersRes.data.data?.transfers,
        "transfersRes.data.data.data": transfersRes.data.data?.data,
        "transfersRes.data.data.data.transfers":
          transfersRes.data.data?.data?.transfers,
      });

      let transfersData = [];
      if (Array.isArray(transfersRes.data.data?.transfers)) {
        transfersData = transfersRes.data.data.transfers;
      } else if (Array.isArray(transfersRes.data.data?.data?.transfers)) {
        transfersData = transfersRes.data.data.data.transfers;
      } else if (Array.isArray(transfersRes.data.data)) {
        transfersData = transfersRes.data.data;
      } else if (Array.isArray(transfersRes.data)) {
        transfersData = transfersRes.data;
      }

      console.log("Final transfers data:", transfersData);
      console.log("Number of transfers found:", transfersData.length);
      setTransfers(transfersData);

      // Extract credit officers from various possible response structures
      let creditOfficersData = [];
      console.log("Users API response:", usersRes.data);

      if (usersRes.data?.data?.users) {
        creditOfficersData = usersRes.data.data.users;
      } else if (usersRes.data?.data?.data) {
        creditOfficersData = usersRes.data.data.data;
      } else if (usersRes.data?.users) {
        creditOfficersData = usersRes.data.users;
      } else if (usersRes.data?.data && Array.isArray(usersRes.data.data)) {
        creditOfficersData = usersRes.data.data;
      } else if (Array.isArray(usersRes.data)) {
        creditOfficersData = usersRes.data;
      }

      console.log("Extracted credit officers data:", creditOfficersData);
      console.log("Total users fetched:", creditOfficersData.length);

      // Filter and map credit officers
      const creditOfficers = Array.isArray(creditOfficersData)
        ? creditOfficersData
          .filter(
            (user: any) => user.role === UserRole.CREDIT_OFFICER && user.id
          )
          .map((user: any) => ({
            id: user.id,
            email: user.email,
            name:
              user.name ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            branchId: user.branchId,
            branch: user.branch,
          }))
          .sort((a: any, b: any) =>
            (a.name || a.email).localeCompare(b.name || b.email)
          )
        : [];

      console.log("Final credit officers list:", creditOfficers);
      console.log(
        "Number of credit officers available:",
        creditOfficers.length
      );

      if (creditOfficers.length === 0) {
        console.warn("No credit officers found from API");
      }

      setUsers(creditOfficers);
      setBranches(
        Array.isArray(branchesRes.data.data) ? branchesRes.data.data : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data. Some features may not work properly.");

      // Ensure arrays are always initialized even on error
      setTransfers([]);
      setUsers([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    console.log("Filtering transfers:", {
      totalTransfers: transfers.length,
      searchTerm,
      statusFilter,
      branchFilter,
      userFilter,
    });

    return transfers.filter((transfer) => {
      // Enhanced search logic
      const searchTermLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchTermLower ||
        (() => {
          // Create a comprehensive search string from all user fields
          const userFullName = [
            transfer.user.firstName,
            transfer.user.lastName,
            transfer.user.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const userEmail = transfer.user.email.toLowerCase();
          const reason = transfer.reason?.toLowerCase() || "";
          const fromBranchName = transfer.fromBranch?.name?.toLowerCase() || "";
          const toBranchName = transfer.toBranch.name?.toLowerCase() || "";
          const status = transfer.status.toLowerCase();

          // Check if search term matches any of these fields
          return (
            userFullName.includes(searchTermLower) ||
            userEmail.includes(searchTermLower) ||
            reason.includes(searchTermLower) ||
            fromBranchName.includes(searchTermLower) ||
            toBranchName.includes(searchTermLower) ||
            status.includes(searchTermLower)
          );
        })();

      const matchesStatus =
        statusFilter === "all" || transfer.status === statusFilter;
      const matchesBranch =
        branchFilter === "all" ||
        transfer.fromBranch?.id === branchFilter ||
        transfer.toBranch.id === branchFilter;
      const matchesUser =
        userFilter === "all" || transfer.userId === userFilter;

      const result =
        matchesSearch && matchesStatus && matchesBranch && matchesUser;

      if (searchTermLower && result) {
        console.log("Match found:", {
          transferId: transfer.id,
          userEmail: transfer.user.email,
          userName:
            transfer.user.name ||
            `${transfer.user.firstName} ${transfer.user.lastName}`,
          searchTerm: searchTermLower,
        });
      }

      return result;
    });
  }, [transfers, searchTerm, statusFilter, branchFilter, userFilter]);

  const handleCreateTransfer = async () => {
    if (!transferForm.userId || !transferForm.toBranchId) {
      toast.error("Please select user and destination branch");
      return;
    }

    // Validation: Check if transferring to the same branch
    if (
      transferForm.fromBranchId &&
      transferForm.fromBranchId === transferForm.toBranchId
    ) {
      toast.error(
        "Cannot transfer to the same branch. Please select a different destination branch."
      );
      return;
    }

    setCreatingTransfer(true);
    try {
      // Get current user ID from auth context
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await enhancedApi.branchTransfers.create({
        userId: transferForm.userId,
        fromBranchId: transferForm.fromBranchId || undefined,
        toBranchId: transferForm.toBranchId,
        reason: transferForm.reason || undefined,
        effectiveDate: transferForm.effectiveDate
          ? new Date(transferForm.effectiveDate)
          : new Date(),
        notes: transferForm.notes || undefined,
      });

      console.log("Create transfer response:", response);
      toast.success("Branch transfer created successfully");
      setTransferForm({
        userId: "",
        fromBranchId: "",
        toBranchId: "",
        reason: "",
        effectiveDate: new Date().toISOString().split("T")[0], // Set to today
        notes: "",
      });
      setIsCreateModalOpen(false);

      // Wait a moment before refreshing to ensure the transfer is saved
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error: any) {
      console.error("Create transfer error:", error);
      toast.error(error.response?.data?.message || "Failed to create transfer");
    } finally {
      setCreatingTransfer(false);
    }
  };

  const handleExecuteTransfer = async (transferId: string) => {
    console.log("Executing transfer:", transferId);
    setExecutingTransferId(transferId);
    try {
      console.log("Calling enhancedApi.branchTransfers.execute...");
      const response = await enhancedApi.branchTransfers.execute(transferId);
      console.log("Execute transfer response:", response.data);
      toast.success("Transfer executed successfully");
      console.log("Refreshing data after successful execution...");
      fetchData();
    } catch (error: any) {
      console.error("Execute transfer error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to execute transfer"
      );
    } finally {
      setExecutingTransferId(null);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    setCancellingTransferId(transferId);
    try {
      await enhancedApi.branchTransfers.cancel(transferId);
      toast.success("Transfer cancelled successfully");
      fetchData();
    } catch (error) {
      console.error("Cancel transfer error:", error);
      toast.error("Failed to cancel transfer");
    } finally {
      setCancellingTransferId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border border-green-200 font-medium";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200 font-medium";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200 font-medium";
      case "failed":
        return "bg-red-100 text-red-800 border border-red-300 font-medium";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading branch transfers...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch transfer information
          </p>
        </div>
      </div>
    );
  }

  return (
    <MobileContainer>
      <div className="p-6 space-y-6">
        {/* Top - Mobile Responsive */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold break-words max-w-full">
            Branch Transfer Management
          </h1>
          <div className="flex flex-wrap gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
            <Button
              onClick={fetchData}
              variant="outline"
              title="Refresh transfers data"
              disabled={loading}
              className="flex-1 min-w-[120px] sm:w-auto"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            {transfers.length === 0 && (
              <Button
                onClick={async () => {
                  console.log("Testing API directly...");
                  try {
                    const token = getAccessToken();
                    console.log(
                      "Using token:",
                      token ? "Token exists" : "No token"
                    );

                    const response = await fetch(
                      "https://millenium-potters.onrender.com/api/branch-transfers",
                      {
                        method: "GET",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    console.log("Direct API call status:", response.status);
                    const data = await response.json();
                    console.log("Direct API call response:", data);

                    if (!response.ok) {
                      console.error("API Error:", data);
                      toast.error(
                        `API Error: ${data.message || "Unknown error"}`
                      );
                    } else {
                      toast.success(
                        "API call successful - check console for details"
                      );
                    }
                  } catch (error) {
                    console.error("Direct API call error:", error);
                    toast.error("Network error - check console");
                  }
                }}
                variant="outline"
                title="Test API directly"
                className="flex-1 min-w-[120px] sm:w-auto"
              >
                <FileText className="w-4 h-4 mr-2" />
                Test API
              </Button>
            )}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              title="Create a new branch transfer request"
              className="flex-1 min-w-[120px] sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Transfer
            </Button>
          </div>
        </div>

        {/* Debug Information - Commented out as it's working well now */}
        {/* <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-sm">
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>Total Transfers: {transfers.length}</p>
              <p>Filtered Transfers: {filteredTransfers.length}</p>
              <p>Loading: {loading ? "Yes" : "No"}</p>
              <p>Search Term: "{searchTerm}"</p>
              <p>Status Filter: "{statusFilter}"</p>
              <p>Branch Filter: "{branchFilter}"</p>
              <p>User Filter: "{userFilter}"</p>
            </div>
          </CardContent>
        </Card> */}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Transfers
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {transfers.length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">All time</p>
                </div>
                <div className="bg-blue-600 p-3 rounded-full">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Pending</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {transfers.filter((t) => t.status === "PENDING").length}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Awaiting action</p>
                </div>
                <div className="bg-amber-600 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {transfers.filter((t) => t.status === "COMPLETED").length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Successfully processed
                  </p>
                </div>
                <div className="bg-green-600 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Cancelled</p>
                  <p className="text-3xl font-bold text-red-900">
                    {transfers.filter((t) => t.status === "CANCELLED").length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Not processed</p>
                </div>
                <div className="bg-red-600 p-3 rounded-full">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-md border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Filter className="w-5 h-5 text-green-600" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="search-input">Search</Label>
                  <span
                    className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                    title="Search transfers by user name, branch name, or reason"
                  >
                    !
                  </span>
                </div>
                <Input
                  id="search-input"
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <span
                    className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                    title="Filter transfers by their current status"
                  >
                    !
                  </span>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="branch-filter">Branch</Label>
                  <span
                    className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                    title="Filter transfers by source or destination branch"
                  >
                    !
                  </span>
                </div>
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Branches" },
                    ...(branches || []).map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    })),
                  ]}
                  value={branchFilter}
                  onValueChange={setBranchFilter}
                  placeholder="All branches"
                  searchPlaceholder="Search branches..."
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="user-filter">User</Label>
                  <span
                    className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                    title="Filter transfers by credit officer"
                  >
                    !
                  </span>
                </div>
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Users" },
                    ...(users || []).map((user) => ({
                      value: user.id,
                      label: user.name || user.email,
                    })),
                  ]}
                  value={userFilter}
                  onValueChange={setUserFilter}
                  placeholder="All users"
                  searchPlaceholder="Search users..."
                  className="w-full"
                />
                {userFilter !== "all" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing transfers for:{" "}
                    {users.find((u) => u.id === userFilter)?.name ||
                      users.find((u) => u.id === userFilter)?.email ||
                      "Unknown User"}
                  </p>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm ||
              statusFilter !== "all" ||
              branchFilter !== "all" ||
              userFilter !== "all") && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setBranchFilter("all");
                      setUserFilter("all");
                    }}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Clear All Filters
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-green-50">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                <CardTitle className="text-white">Branch Transfers</CardTitle>
              </div>
              <Badge
                variant="secondary"
                className="bg-white text-green-700 font-semibold"
              >
                {transfers.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MobileTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead title="Credit officer being transferred">
                      User
                    </TableHead>
                    <TableHead title="Person who initiated the transfer">
                      Created By
                    </TableHead>
                    <TableHead title="Current branch of the user">
                      From Branch
                    </TableHead>
                    <TableHead title="Destination branch for the transfer">
                      To Branch
                    </TableHead>
                    <TableHead title="Current status of the transfer">
                      Status
                    </TableHead>
                    <TableHead title="Date when the transfer was created">
                      Transfer Date
                    </TableHead>
                    <TableHead title="Date when the transfer becomes effective">
                      Effective Date
                    </TableHead>
                    <TableHead title="Number of customers transferred">
                      Customers
                    </TableHead>
                    <TableHead title="Number of loans transferred">
                      Loans
                    </TableHead>
                    <TableHead title="Number of repayments transferred">
                      Repayments
                    </TableHead>
                    <TableHead title="Available actions for this transfer">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <ArrowRightLeft className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-500">
                            {transfers.length === 0
                              ? "No branch transfers found. Create your first transfer to get started."
                              : "No transfers match your current filters. Try adjusting your search criteria."}
                          </p>
                          {transfers.length > 0 && (
                            <div className="text-sm text-gray-400 mt-2">
                              <p>Active filters:</p>
                              <ul className="list-disc list-inside mt-1">
                                {searchTerm && <li>Search: "{searchTerm}"</li>}
                                {statusFilter !== "all" && (
                                  <li>Status: {statusFilter}</li>
                                )}
                                {branchFilter !== "all" && (
                                  <li>
                                    Branch:{" "}
                                    {branches.find((b) => b.id === branchFilter)
                                      ?.name || "Unknown"}
                                  </li>
                                )}
                                {userFilter !== "all" && (
                                  <li>
                                    User:{" "}
                                    {users.find((u) => u.id === userFilter)
                                      ?.name ||
                                      users.find((u) => u.id === userFilter)
                                        ?.email ||
                                      "Unknown"}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          {transfers.length === 0 && (
                            <Button
                              onClick={() => setIsCreateModalOpen(true)}
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Transfer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <div>
                              <div className="font-medium">
                                {transfer.user.firstName &&
                                  transfer.user.lastName
                                  ? `${transfer.user.firstName} ${transfer.user.lastName}`
                                  : transfer.user.name || transfer.user.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transfer.user.role}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <div>
                              <div className="font-medium text-purple-700">
                                {transfer.createdBy?.email || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                Initiator
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transfer.fromBranch ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <div>
                                <div className="font-medium">
                                  {transfer.fromBranch.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {transfer.fromBranch.code}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No Branch</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">
                                {transfer.toBranch.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transfer.toBranch.code}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(transfer.status)}
                            <Badge className={getStatusColor(transfer.status)}>
                              {transfer.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(transfer.transferDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(transfer.effectiveDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-700">
                              {transfer.customersTransferred || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-700">
                              {transfer.loansTransferred || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-700">
                              {transfer.repaymentsTransferred || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {/* View Details Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                router.push(
                                  `/dashboard/business-management/branch-transfers/${transfer.id}`
                                );
                              }}
                              title="View transfer details"
                              className="w-full sm:w-auto"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>

                            {/* Action Buttons */}
                            <div className="flex gap-1 w-full sm:w-auto">
                              {/* Execute button with loading state */}
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleExecuteTransfer(transfer.id)
                                }
                                title="Execute this transfer"
                                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed flex-1 sm:flex-none"
                                disabled={
                                  executingTransferId === transfer.id ||
                                  transfer.status === "COMPLETED" ||
                                  transfer.status === "CANCELLED"
                                }
                              >
                                {executingTransferId === transfer.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                    <span className="hidden sm:inline">
                                      Executing...
                                    </span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      Execute
                                    </span>
                                    <span className="sm:hidden">✓</span>
                                  </>
                                )}
                              </Button>

                              {/* Cancel button with loading state */}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleCancelTransfer(transfer.id)
                                }
                                title="Cancel this transfer"
                                className="disabled:bg-gray-400 disabled:cursor-not-allowed flex-1 sm:flex-none"
                                disabled={
                                  cancellingTransferId === transfer.id ||
                                  transfer.status === "COMPLETED" ||
                                  transfer.status === "CANCELLED"
                                }
                              >
                                {cancellingTransferId === transfer.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                    <span className="hidden sm:inline">
                                      Cancelling...
                                    </span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      Cancel
                                    </span>
                                    <span className="sm:hidden">✕</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </MobileTable>
          </CardContent>
        </Card>

        {/* Create Transfer Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Branch Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Main Transfer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Selection - SearchableSelect */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="user-select">User *</Label>
                    <span
                      className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                      title="Select a credit officer to transfer"
                    >
                      !
                    </span>
                  </div>
                  <SearchableSelect
                    options={(users || []).map((user) => ({
                      value: user.id,
                      label: user.name || user.email,
                      description:
                        user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName} - ${user.role}`
                          : user.role,
                    }))}
                    value={transferForm.userId}
                    onValueChange={(value) => {
                      const selectedUser = users.find(
                        (user) => user.id === value
                      );
                      setTransferForm({
                        ...transferForm,
                        userId: value,
                        fromBranchId: selectedUser?.branchId || "",
                      });
                    }}
                    placeholder="Search and select credit officer..."
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only credit officers are available for transfer
                  </p>
                </div>

                {/* From Branch */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="from-branch">From Branch</Label>
                    <span
                      className="text-green-500 cursor-pointer hover:text-green-700 transition-colors"
                      title="Automatically set to the selected user's current branch"
                    >
                      ✓
                    </span>
                  </div>
                  {transferForm.userId ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {(() => {
                            const selectedUser = users.find(
                              (user) => user.id === transferForm.userId
                            );
                            const fromBranch = branches.find(
                              (branch) => branch.id === selectedUser?.branchId
                            );
                            return fromBranch
                              ? `${fromBranch.name} (${fromBranch.code})`
                              : "No Branch";
                          })()}
                        </span>
                      </div>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Auto-selected
                      </span>
                    </div>
                  ) : (
                    <SearchableSelect
                      options={[
                        { value: "none", label: "No Branch" },
                        ...(branches || []).map((branch) => ({
                          value: branch.id,
                          label: `${branch.name} (${branch.code})`,
                        })),
                      ]}
                      value={transferForm.fromBranchId}
                      onValueChange={(value) =>
                        setTransferForm({
                          ...transferForm,
                          fromBranchId: value,
                          toBranchId:
                            value === transferForm.toBranchId
                              ? ""
                              : transferForm.toBranchId, // Clear destination if same as source
                        })
                      }
                      placeholder="Select source branch (optional)"
                      searchPlaceholder="Search branches..."
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {transferForm.userId
                      ? "Automatically set to the selected user's current branch"
                      : "Will be set automatically when you select a user"}
                  </p>
                </div>

                {/* To Branch */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="to-branch">To Branch *</Label>
                    <span
                      className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                      title="Required: Select the destination branch for the transfer"
                    >
                      !
                    </span>
                  </div>
                  <SearchableSelect
                    options={(branches || [])
                      .filter(
                        (branch) => branch.id !== transferForm.fromBranchId
                      )
                      .map((branch) => ({
                        value: branch.id,
                        label: `${branch.name} (${branch.code})`,
                      }))}
                    value={transferForm.toBranchId}
                    onValueChange={(value) =>
                      setTransferForm({
                        ...transferForm,
                        toBranchId: value,
                      })
                    }
                    placeholder="Select destination branch"
                    searchPlaceholder="Search branches..."
                  />
                </div>

                {/* Effective Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="effective-date">Effective Date</Label>
                    <span
                      className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                      title="Optional: Leave empty to use current date"
                    >
                      !
                    </span>
                  </div>
                  <Input
                    id="effective-date"
                    type="date"
                    value={transferForm.effectiveDate}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        effectiveDate: e.target.value,
                      })
                    }
                    placeholder="Select effective date (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use current date
                  </p>
                </div>
              </div>

              {/* Transfer Preview */}
              {transferForm.userId && transferForm.toBranchId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">
                      Transfer Preview
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Customers
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-800">
                        {(() => {
                          const selectedUser = users.find(
                            (u) => u.id === transferForm.userId
                          );
                          // This would need to be fetched from API - for now showing placeholder
                          return "~";
                        })()}
                      </div>
                      <div className="text-xs text-blue-600">
                        Will be transferred
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Loans
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        {(() => {
                          const selectedUser = users.find(
                            (u) => u.id === transferForm.userId
                          );
                          // This would need to be fetched from API - for now showing placeholder
                          return "~";
                        })()}
                      </div>
                      <div className="text-xs text-green-600">
                        Will be transferred
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                          Repayments
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-800">
                        {(() => {
                          const selectedUser = users.find(
                            (u) => u.id === transferForm.userId
                          );
                          // This would need to be fetched from API - for now showing placeholder
                          return "~";
                        })()}
                      </div>
                      <div className="text-xs text-purple-600">
                        Will be transferred
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-100 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> When this transfer is executed, all
                      customers, loans, and repayment schedules associated with
                      the selected credit officer will be moved to the
                      destination branch.
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reason */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="reason">Reason</Label>
                      <span
                        className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                        title="Optional: Provide a reason for the transfer"
                      >
                        !
                      </span>
                    </div>
                    <Textarea
                      id="reason"
                      value={transferForm.reason}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          reason: e.target.value,
                        })
                      }
                      placeholder="Enter reason for transfer (optional)"
                      rows={3}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="notes">Notes</Label>
                      <span
                        className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                        title="Optional: Additional notes or comments"
                      >
                        !
                      </span>
                    </div>
                    <Textarea
                      id="notes"
                      value={transferForm.notes}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Enter additional notes (optional)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleCreateTransfer}
                  disabled={creatingTransfer}
                  title="Create a new branch transfer request"
                  className="flex-1"
                >
                  {creatingTransfer ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Transfer...
                    </>
                  ) : (
                    "Create Transfer"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  title="Cancel and close the form"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileContainer>
  );
}

export default function BranchTransferManagementPage() {
  return (
    <BranchManagerOrAdmin
      fallback={
        <AccessDenied message="Only administrators and branch managers can access branch transfers." />
      }
    >
      <BranchTransferManagementPageContent />
    </BranchManagerOrAdmin>
  );
}
