"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Users,
  UserCheck,
  CreditCard,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Search,
  Eye,
  MoreVertical,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { branchesApi, customersApi, loansApi } from "@/lib/api";
import { Branch, BranchStats } from "@/types/branch";
import { User, Customer, Loan } from "@/types";
import { toast } from "sonner";
import { getUserDisplayName } from "@/utils/user-display";

export default function BranchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loanSearchTerm, setLoanSearchTerm] = useState("");

  useEffect(() => {
    if (branchId) {
      loadBranchData();
    }
  }, [branchId]);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load branch details - the API now includes users, customers, loans, and _count
      const branchResponse = await branchesApi.getById(branchId);
      const branchData = branchResponse.data.data || branchResponse.data;
      setBranch(branchData);

      // Set customers and loans from the enriched API response
      if (branchData.customers) {
        setCustomers(branchData.customers);
      }
      if (branchData.loans) {
        setLoans(branchData.loans);
      }
    } catch (error: any) {
      console.error("Failed to load branch data:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load branch data"
      );
      toast.error("Failed to load branch data");
    } finally {
      setLoading(false);
    }
  };

  // Filtered customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;

    return customers.filter((customer) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.firstName?.toLowerCase().includes(searchLower) ||
        customer.lastName?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.code?.toLowerCase().includes(searchLower)
      );
    });
  }, [customers, searchTerm]);

  // Filtered loans based on search
  const filteredLoans = useMemo(() => {
    if (!loanSearchTerm) return loans;

    return loans.filter((loan) => {
      const searchLower = loanSearchTerm.toLowerCase();
      return (
        loan.loanNumber?.toLowerCase().includes(searchLower) ||
        loan.customer?.firstName?.toLowerCase().includes(searchLower) ||
        loan.customer?.lastName?.toLowerCase().includes(searchLower) ||
        loan.customer?.email?.toLowerCase().includes(searchLower) ||
        loan.status?.toLowerCase().includes(searchLower) ||
        loan.loanType?.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [loans, loanSearchTerm]);

  // Utility functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const getLoanStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "DEFAULTED":
        return "bg-red-100 text-red-800";
      case "WRITTEN_OFF":
        return "bg-orange-100 text-orange-800";
      case "CANCELED":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getLoanStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return "Draft";
      case "PENDING_APPROVAL":
        return "Pending Approval";
      case "APPROVED":
        return "Approved";
      case "ACTIVE":
        return "Active";
      case "COMPLETED":
        return "Completed";
      case "DEFAULTED":
        return "Defaulted";
      case "WRITTEN_OFF":
        return "Written Off";
      case "CANCELED":
        return "Canceled";
      default:
        return status;
    }
  };

  const handleEditBranch = () => {
    // Navigate back to the main branch page with edit mode for this branch
    router.push(`/dashboard/business-management/branch?edit=${branchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">
            Loading branch details...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch branch information
          </p>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Branch
          </h3>
          <p className="text-gray-600 mb-4">{error || "Branch not found"}</p>
          <Button
            onClick={() => router.push("/dashboard/business-management/branch")}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            Back to Branches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() =>
                  router.push("/dashboard/business-management/branch")
                }
                className="flex items-center space-x-2 hover:bg-green-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {branch.name}
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 mt-1">
                    Branch Code: {branch.code}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleEditBranch}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Branch
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-700">
                    Total Staff
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {branch.users?.length || 0}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-50 to-green-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-green-700">
                    Total Customers
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {branch._count?.customers || 0}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-purple-700">
                    Total Loans
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {branch._count?.loans || 0}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-orange-700">
                    Status
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {branch.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Information and Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Branch Information */}
          <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <span>Branch Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Branch Name
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {branch.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Branch Code
                    </span>
                    <span className="text-lg font-semibold text-gray-900 font-mono">
                      {branch.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Manager
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {getUserDisplayName(branch.manager, "Unassigned")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Created
                    </span>
                    <span className="text-sm text-gray-600">
                      {branch.createdAt
                        ? formatDate(branch.createdAt)
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branch Staff */}
          <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Branch Staff</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {branch.users && branch.users.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {branch.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                          <Users className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </p>
                          <p className="text-sm text-gray-500 capitalize truncate">
                            {user.role.toLowerCase().replace("_", " ")}
                          </p>
                          {user.firstName && user.lastName && (
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className={`flex-shrink-0 ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">
                    No staff assigned to this branch
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8 sm:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Loan Amount */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Loan Portfolio
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        loans.reduce(
                          (total, loan) =>
                            total +
                            parseFloat(String(loan.principalAmount || "0")),
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Loans */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Loans
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        loans.filter(
                          (loan) =>
                            loan.status === "ACTIVE" ||
                            loan.status === "APPROVED"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Loans */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Loans
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        loans.filter(
                          (loan) =>
                            loan.status === "PENDING_APPROVAL" ||
                            loan.status === "DRAFT"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Loan Amount */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg Loan Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loans.length > 0
                        ? formatCurrency(
                            loans.reduce(
                              (total, loan) =>
                                total +
                                parseFloat(String(loan.principalAmount || "0")),
                              0
                            ) / loans.length
                          )
                        : formatCurrency(0)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Customers Section */}
        <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span>Branch Customers</span>
                <Badge variant="outline" className="ml-2">
                  {filteredCustomers.length} customers
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {filteredCustomers.length > 0 ? (
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <UserCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {customer.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.email || "No email"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.phone || "No phone"}
                          </div>
                          {(customer as any).currentOfficer && (
                            <div className="text-xs text-blue-600 mt-1">
                              Officer:{" "}
                              {(customer as any).currentOfficer.firstName &&
                              (customer as any).currentOfficer.lastName
                                ? `${
                                    (customer as any).currentOfficer.firstName
                                  } ${
                                    (customer as any).currentOfficer.lastName
                                  }`
                                : (customer as any).currentOfficer.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.createdAt
                              ? formatDate(customer.createdAt)
                              : "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.createdAt
                              ? getTimeAgo(customer.createdAt)
                              : ""}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/business-management/customer/${customer.id}`
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "No customers found" : "No customers yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Customers will appear here once they are registered for this branch"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() =>
                      router.push(
                        "/dashboard/business-management/customer/create"
                      )
                    }
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    Add Customer
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loans Section */}
        <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Branch Loans</span>
                <Badge variant="outline" className="ml-2">
                  {filteredLoans.length} loans
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search loans..."
                    value={loanSearchTerm}
                    onChange={(e) => setLoanSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Loan Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Officer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {loan.loanNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                {loan.loanType?.name || "No type"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {loan.customer?.firstName} {loan.customer?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {loan.customer?.email || "No email"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(loan.principalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {loan.termCount} {loan.termUnit?.toLowerCase()}(s)
                          </div>
                          <div className="text-xs text-orange-600">
                            Fee: {formatCurrency(loan.processingFeeAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={getLoanStatusColor(loan.status)}>
                            {getLoanStatusDisplay(loan.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-sm text-gray-900">
                            {getUserDisplayName(
                              loan.assignedOfficer,
                              "Unassigned"
                            )}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {(loan.assignedOfficer as any)?.role
                              ?.toLowerCase()
                              .replace("_", " ") || ""}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-900">
                            {loan.createdAt
                              ? formatDate(loan.createdAt)
                              : "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {loan.createdAt ? getTimeAgo(loan.createdAt) : ""}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/business-management/loan/${loan.id}`
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {loan.customer && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/business-management/customer/${loan.customer?.id}`
                                    )
                                  }
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  View Customer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {loanSearchTerm ? "No loans found" : "No loans yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {loanSearchTerm
                    ? "Try adjusting your search criteria"
                    : "Loans will appear here once they are created for this branch"}
                </p>
                {!loanSearchTerm && (
                  <Button
                    onClick={() =>
                      router.push("/dashboard/business-management/loan/create")
                    }
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    Create Loan
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
