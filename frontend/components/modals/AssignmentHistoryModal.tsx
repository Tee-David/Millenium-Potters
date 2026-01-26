"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface AssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentHistoryModal({
  isOpen,
  onClose,
}: AssignmentHistoryModalProps) {
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      // Check if user is authenticated before loading
      if (!isAuthenticated()) {
        setError("Please log in to view assignment history");
        setLoading(false);
        return;
      }
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      if (!isAuthenticated()) {
        throw new Error("No authentication token found");
      }

      const token = getAccessToken();

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <History className="w-6 h-6" />
            <span>Assignment History</span>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Track all user and manager assignments across branches
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="date-filter">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Assignment History ({filteredHistory.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading history...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-gray-600">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadHistory}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No assignment history found</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant={getTypeBadgeVariant(entry.type)}>
                            {getTypeLabel(entry.type)}
                          </Badge>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{formatTimestamp(entry.timestamp)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          By: {entry.changedByEmail}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {entry.type === "USER_ASSIGNMENT" && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                {entry.userEmail}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center space-x-2">
                              {entry.oldBranchName ? (
                                <>
                                  <Building2 className="w-4 h-4 text-orange-500" />
                                  <span className="text-gray-600">
                                    {entry.oldBranchName}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">
                                  Unassigned
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-green-500" />
                              <span className="font-medium">
                                {entry.newBranchName}
                              </span>
                            </div>
                          </div>
                        )}

                        {entry.type === "MANAGER_ASSIGNMENT" && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                {entry.branchName}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center space-x-2">
                              {entry.oldManagerEmail ? (
                                <>
                                  <User className="w-4 h-4 text-orange-500" />
                                  <span className="text-gray-600">
                                    {entry.oldManagerEmail}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">
                                  No manager
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-green-500" />
                              <span className="font-medium">
                                {entry.newManagerEmail}
                              </span>
                            </div>
                          </div>
                        )}

                        {entry.reason && (
                          <div className="text-sm text-gray-600 mt-2">
                            <strong>Reason:</strong> {entry.reason}
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

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
