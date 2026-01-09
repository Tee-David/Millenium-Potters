"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  TrendingUp,
  Users,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { isAuthenticated, getAccessToken } from "@/lib/api";

interface AssignmentHistoryEntry {
  id: string;
  type: "USER_ASSIGNMENT" | "MANAGER_ASSIGNMENT";
  userId?: string;
  branchId?: string;
  oldBranchId?: string;
  newBranchId?: string;
  oldManagerId?: string;
  newManagerId?: string;
  changedByUserId: string;
  reason?: string;
  timestamp: string;
  userEmail?: string;
  branchName?: string;
  oldBranchName?: string;
  newBranchName?: string;
  oldManagerEmail?: string;
  newManagerEmail?: string;
  changedByEmail?: string;
}

export default function AssignmentHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadHistory();
  }, []);

  // Cleanup effect to reset filters when component unmounts
  useEffect(() => {
    return () => {
      setSearchTerm("");
      setTypeFilter("all");
      setDateFilter("all");
    };
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      if (!isAuthenticated()) {
        throw new Error("No authentication token found");
      }

      const token = getAccessToken();
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://l-d1.onrender.com/api";
      const response = await fetch(
        `${API_URL}/assignment-history?page=1&limit=100`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setHistory(data.data);
      } else {
        throw new Error(data.message || "Failed to load assignment history");
      }
    } catch (error: any) {
      console.error("Failed to load assignment history:", error);

      // Handle specific error cases
      if (error.message === "No authentication token found") {
        setError("Please log in to view assignment history");
        toast.error("Please log in to view assignment history");
      } else if (error.message.includes("401")) {
        setError("Your session has expired. Please log in again.");
        toast.error("Your session has expired. Please log in again.");
      } else {
        setError(error.message || "Failed to load assignment history");
        toast.error(error.message || "Failed to load assignment history");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((entry) => {
    const matchesSearch =
      entry.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.oldBranchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.newBranchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.oldManagerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.newManagerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.changedByEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || entry.type === typeFilter;

    const matchesDate = (() => {
      if (dateFilter === "all") return true;

      const entryDate = new Date(entry.timestamp);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          return entryDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return entryDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesType && matchesDate;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "USER_ASSIGNMENT":
        return "User Assignment";
      case "MANAGER_ASSIGNMENT":
        return "Manager Assignment";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "USER_ASSIGNMENT":
        return "default";
      case "MANAGER_ASSIGNMENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "USER_ASSIGNMENT":
        return <Users className="w-5 h-5" />;
      case "MANAGER_ASSIGNMENT":
        return <Shield className="w-5 h-5" />;
      default:
        return <History className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "USER_ASSIGNMENT":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "MANAGER_ASSIGNMENT":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <History className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Assignment History
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Track all user and manager assignments across branches
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                onClick={loadHistory}
                variant="outline"
                className="flex items-center space-x-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-blue-100/50">
                <CardTitle className="text-sm font-semibold text-blue-700">
                  Total Assignments
                </CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <History className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {history.length}
                </div>
                <p className="text-sm text-blue-600 font-medium">
                  All time assignments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-green-50 to-green-100/50">
                <CardTitle className="text-sm font-semibold text-green-700">
                  User Assignments
                </CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {history.filter((h) => h.type === "USER_ASSIGNMENT").length}
                </div>
                <p className="text-sm text-green-600 font-medium">
                  User branch changes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                <CardTitle className="text-sm font-semibold text-purple-700">
                  Manager Assignments
                </CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {
                    history.filter((h) => h.type === "MANAGER_ASSIGNMENT")
                      .length
                  }
                </div>
                <p className="text-sm text-purple-600 font-medium">
                  Manager changes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-orange-50 to-orange-100/50">
                <CardTitle className="text-sm font-semibold text-orange-700">
                  This Month
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {
                    history.filter((h) => {
                      const entryDate = new Date(h.timestamp);
                      const monthAgo = new Date(
                        Date.now() - 30 * 24 * 60 * 60 * 1000
                      );
                      return entryDate >= monthAgo;
                    }).length
                  }
                </div>
                <p className="text-sm text-orange-600 font-medium">
                  Recent activity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-12 bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Filters & Search
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Search Assignments
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Filter by Type
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="USER_ASSIGNMENT">
                      User Assignments
                    </SelectItem>
                    <SelectItem value="MANAGER_ASSIGNMENT">
                      Manager Assignments
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Date Range
                </Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-6 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <History className="w-5 h-5 text-white" />
              </div>
              <span>Assignment History ({filteredHistory.length})</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loading}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">
                    Loading assignment history...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading History
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadHistory}
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Assignment History Found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || typeFilter !== "all" || dateFilter !== "all"
                      ? "No assignments match your current filters. Try adjusting your search criteria."
                      : "No assignment history has been recorded yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-2xl p-4 sm:p-6 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div
                          className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${getTypeColor(
                            entry.type
                          )}`}
                        >
                          {getTypeIcon(entry.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Badge
                            variant={getTypeBadgeVariant(entry.type)}
                            className="mb-2 text-xs"
                          >
                            {getTypeLabel(entry.type)}
                          </Badge>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimestamp(entry.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 text-right sm:text-right">
                        <p className="font-medium">Changed by:</p>
                        <p className="truncate">{entry.changedByEmail}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {entry.type === "USER_ASSIGNMENT" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                              <span className="font-semibold text-blue-900 text-sm sm:text-base truncate">
                                {entry.userEmail}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                            <div className="flex items-center space-x-2">
                              {entry.oldBranchName ? (
                                <>
                                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                                  <span className="text-gray-700 font-medium text-sm sm:text-base truncate">
                                    {entry.oldBranchName}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500 italic font-medium text-sm sm:text-base">
                                  Unassigned
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                              <span className="font-semibold text-green-900 text-sm sm:text-base truncate">
                                {entry.newBranchName}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {entry.type === "MANAGER_ASSIGNMENT" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                              <span className="font-semibold text-purple-900 text-sm sm:text-base truncate">
                                {entry.branchName}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                            <div className="flex items-center space-x-2">
                              {entry.oldManagerEmail ? (
                                <>
                                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                                  <span className="text-gray-700 font-medium text-sm sm:text-base truncate">
                                    {entry.oldManagerEmail}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500 italic font-medium text-sm sm:text-base">
                                  No manager
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                              <span className="font-semibold text-green-900 text-sm sm:text-base truncate">
                                {entry.newManagerEmail}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {entry.reason && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
                          <div className="text-xs sm:text-sm">
                            <span className="font-semibold text-gray-700">
                              Reason:
                            </span>
                            <p className="text-gray-600 mt-1 break-words">
                              {entry.reason}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
