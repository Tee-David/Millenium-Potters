"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { auditLogsApi, handleDatabaseError } from "@/lib/api";

interface AuditLog {
  id: string;
  actorUserId?: string;
  actor?: {
    id: string;
    email: string;
    role: string;
  };
  action: string;
  entityName: string;
  entityId: string;
  before?: any;
  after?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsProps {
  entityName?: string;
  entityId?: string;
  title?: string;
  showFilters?: boolean;
}

export function AuditLogs({
  entityName,
  entityId,
  title = "Audit Logs",
  showFilters = true,
}: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState(entityName || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const itemsPerPage = 20;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch audit logs
  const fetchLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (entityName) params.entityName = entityName;
      if (entityId) params.entityId = entityId;
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (actionFilter && actionFilter !== "all") params.action = actionFilter;
      if (entityFilter && !entityName) params.entityName = entityFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await auditLogsApi.getAll(params);

      // Handle the API response structure: { success, message, data, pagination }
      const apiResponse = response.data;
      const logsData = apiResponse.data || [];
      const pagination = apiResponse.pagination || {};

      setLogs(Array.isArray(logsData) ? logsData : []);
      if (pagination) {
        setTotalPages(
          pagination.totalPages ||
            Math.ceil((pagination.total || logsData.length) / itemsPerPage)
        );
        setTotalItems(pagination.total || logsData.length);
      }
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      setError("Failed to load audit logs");

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load audit logs due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Fallback error handling
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [
    currentPage,
    entityName,
    entityId,
    debouncedSearchTerm,
    actionFilter,
    entityFilter,
    dateFrom,
    dateTo,
  ]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm("");
    setActionFilter("all");
    setEntityFilter(entityName || "");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    fetchLogs();
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLogs(true);
  };

  // Format action name
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE")) return "default";
    if (action.includes("UPDATE")) return "secondary";
    if (action.includes("DELETE")) return "destructive";
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "outline";
    if (action.includes("APPROVE") || action.includes("APPROVED"))
      return "default";
    if (action.includes("REJECT") || action.includes("REJECTED"))
      return "destructive";
    if (action.includes("DISBURSE") || action.includes("DISBURSED"))
      return "secondary";
    if (action.includes("REPAYMENT") || action.includes("PAYMENT"))
      return "outline";
    return "secondary";
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action.includes("CREATE")) return <CheckCircle className="w-3 h-3" />;
    if (action.includes("UPDATE")) return <Info className="w-3 h-3" />;
    if (action.includes("DELETE")) return <AlertCircle className="w-3 h-3" />;
    if (action.includes("LOGIN")) return <CheckCircle className="w-3 h-3" />;
    if (action.includes("LOGOUT")) return <AlertCircle className="w-3 h-3" />;
    if (action.includes("APPROVE")) return <CheckCircle className="w-3 h-3" />;
    if (action.includes("REJECT")) return <AlertCircle className="w-3 h-3" />;
    return <Info className="w-3 h-3" />;
  };

  // View log details
  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              disabled
            >
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-gray-600">Loading audit logs...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Audit Logs
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Info className="w-6 h-6 text-orange-600" />
                </div>
                {title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                System activity logs and audit trail
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 h-10"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              {showFilters && (
                <Button
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  size="sm"
                  variant="outline"
                  className="md:hidden flex items-center gap-2 px-4 py-2 h-10"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  <span className="sm:hidden">Filters</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6 sm:space-y-8">
          {/* Enterprise-Level Filters */}
          {showFilters && (
            <div
              className={`space-y-6 ${
                showFiltersMobile ? "block" : "hidden md:block"
              }`}
            >
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Global Search */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                      Global Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Search logs, actions, entities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-12 pr-4 py-3 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Action Filter */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                      Action Type
                    </label>
                    <Select
                      value={actionFilter}
                      onValueChange={setActionFilter}
                    >
                      <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 h-12">
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="USER_CREATED">
                          User Created
                        </SelectItem>
                        <SelectItem value="USER_UPDATED">
                          User Updated
                        </SelectItem>
                        <SelectItem value="USER_DELETED">
                          User Deleted
                        </SelectItem>
                        <SelectItem value="CUSTOMER_CREATED">
                          Customer Created
                        </SelectItem>
                        <SelectItem value="CUSTOMER_UPDATED">
                          Customer Updated
                        </SelectItem>
                        <SelectItem value="LOAN_CREATED">
                          Loan Created
                        </SelectItem>
                        <SelectItem value="LOAN_APPROVED">
                          Loan Approved
                        </SelectItem>
                        <SelectItem value="LOAN_REJECTED">
                          Loan Rejected
                        </SelectItem>
                        <SelectItem value="LOAN_DISBURSED">
                          Loan Disbursed
                        </SelectItem>
                        <SelectItem value="REPAYMENT_RECORDED">
                          Repayment Recorded
                        </SelectItem>
                        <SelectItem value="BRANCH_CREATED">
                          Branch Created
                        </SelectItem>
                        <SelectItem value="BRANCH_UPDATED">
                          Branch Updated
                        </SelectItem>
                        <SelectItem value="USER_LOGIN">User Login</SelectItem>
                        <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Entity Filter */}
                  {!entityName && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                        Entity Type
                      </label>
                      <Select
                        value={entityFilter}
                        onValueChange={setEntityFilter}
                      >
                        <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 h-12">
                          <SelectValue placeholder="All Entities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Entities</SelectItem>
                          <SelectItem value="User">Users</SelectItem>
                          <SelectItem value="Customer">Customers</SelectItem>
                          <SelectItem value="Loan">Loans</SelectItem>
                          <SelectItem value="Repayment">Repayments</SelectItem>
                          <SelectItem value="Branch">Branches</SelectItem>
                          <SelectItem value="LoanType">Loan Types</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          type="date"
                          placeholder="From date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 h-12"
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          placeholder="To date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 h-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    <span>
                      {logs.length} of {totalItems} logs
                      {(debouncedSearchTerm ||
                        actionFilter !== "all" ||
                        entityFilter !== "all" ||
                        dateFrom ||
                        dateTo) &&
                        " (filtered)"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSearch}
                      className="flex items-center gap-2 px-4 py-2 h-10 bg-orange-600 hover:bg-orange-700"
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </Button>
                    <Button
                      onClick={handleResetFilters}
                      variant="outline"
                      className="flex items-center gap-2 px-4 py-2 h-10 border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Responsive Audit Logs Table */}
          {logs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Info className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  No Audit Logs Found
                </h3>
                <p className="text-gray-600 mb-6">
                  {debouncedSearchTerm ||
                  actionFilter !== "all" ||
                  entityFilter !== "all" ||
                  dateFrom ||
                  dateTo
                    ? "Try adjusting your search criteria to find matching logs"
                    : "No audit logs have been recorded yet. System activities will appear here once they occur."}
                </p>
                {(debouncedSearchTerm ||
                  actionFilter !== "all" ||
                  entityFilter !== "all" ||
                  dateFrom ||
                  dateTo) && (
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Timestamp
                    </TableHead>
                    <TableHead className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Action
                    </TableHead>
                    <TableHead className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Entity
                    </TableHead>
                    <TableHead className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Entity ID
                    </TableHead>
                    <TableHead className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Actor
                    </TableHead>
                    <TableHead className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      IP Address
                    </TableHead>
                    <TableHead className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={getActionBadgeColor(log.action)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getActionIcon(log.action)}
                          <span className="hidden sm:inline">
                            {formatAction(log.action)}
                          </span>
                          <span className="sm:hidden text-xs">
                            {formatAction(log.action).split(" ")[0]}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.entityName}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-600">
                          {log.entityId
                            ? log.entityId.substring(0, 8) + "..."
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium truncate max-w-32 sm:max-w-none">
                            {log.actor?.email || log.actorUserId || "System"}
                          </div>
                          {log.actor?.role && (
                            <div className="text-xs text-gray-500">
                              {log.actor.role}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">
                          {log.ipAddress || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewLogDetails(log)}
                          className="flex items-center gap-1 px-2 sm:px-3"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-6 sm:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  <span className="font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems} entries
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 h-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  {/* Page Info */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 h-10"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Audit Log Details</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDetails(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getActionBadgeColor(selectedLog.action)}
                      className="flex items-center gap-1"
                    >
                      {getActionIcon(selectedLog.action)}
                      {formatAction(selectedLog.action)}
                    </Badge>
                  </div>
                  <div>
                    <strong>Timestamp:</strong>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <strong>Entity:</strong>
                    <p className="text-sm text-gray-600">
                      {selectedLog.entityName}
                    </p>
                  </div>
                  <div>
                    <strong>Entity ID:</strong>
                    <p className="text-sm text-gray-600 font-mono">
                      {selectedLog.entityId}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Actor:</strong>
                    <p className="text-sm text-gray-600">
                      {selectedLog.actor?.email ||
                        selectedLog.actorUserId ||
                        "System"}
                    </p>
                  </div>
                  <div>
                    <strong>IP Address:</strong>
                    <p className="text-sm text-gray-600">
                      {selectedLog.ipAddress || "N/A"}
                    </p>
                  </div>
                  {selectedLog.userAgent && (
                    <div>
                      <strong>User Agent:</strong>
                      <p className="text-sm text-gray-600 break-all">
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedLog.before && (
                <div>
                  <strong className="text-lg">Before:</strong>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.before, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <strong className="text-lg">After:</strong>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.after, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <strong className="text-lg">Metadata:</strong>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
