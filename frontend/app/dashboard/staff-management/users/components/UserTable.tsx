"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Eye,
  Edit,
  KeyRound,
  MoreHorizontal,
  Trash2,
  Activity,
  UserCheck,
  Mail,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  LogIn,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { backupApi } from "@/lib/api";
import { SimpleUser, ColumnVisibility } from "./types";

interface UserTableProps {
  users: SimpleUser[];
  loading: boolean;
  columnVisibility: ColumnVisibility;
  onToggleColumn: (column: keyof ColumnVisibility) => void;
  onView: (user: SimpleUser) => void;
  onEdit: (user: SimpleUser) => void;
  onChangePassword: (user: SimpleUser) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onImpersonate?: (user: SimpleUser) => void;
  deletingId: string | null;
  impersonatingId?: string | null;
  currentUserRole?: string;
  currentUserId?: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const pageSizeOptions = [10, 20, 50, 100];

interface DependencyInfo {
  canDelete: boolean;
  dependencies: {
    unions?: number;
    loans?: number;
    supervisedUsers?: number;
  };
  message: string;
}

export function UserTable({
  users,
  loading,
  columnVisibility,
  onToggleColumn,
  onView,
  onEdit,
  onChangePassword,
  onDelete,
  onBulkDelete,
  deletingId,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onImpersonate,
  impersonatingId,
  currentUserRole,
  currentUserId,
}: UserTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SimpleUser | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<DependencyInfo | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Reset selection when users change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [users]);

  const getDisplayName = (user: SimpleUser) => {
    const firstName = user.firstName?.trim() || "";
    const lastName = user.lastName?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email;
  };

  const handleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleSelectOne = (userId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteClick = async (user: SimpleUser) => {
    setUserToDelete(user);
    setCheckingDependencies(true);
    setDeleteDialogOpen(true);

    try {
      const response = await backupApi.checkDependencies("user", user.id);
      const data = response.data?.data ?? response.data;
      setDependencyInfo(data);
    } catch (err) {
      // If dependency check fails, allow delete with warning
      setDependencyInfo({
        canDelete: true,
        dependencies: {},
        message: "Could not check dependencies. Proceed with caution.",
      });
    } finally {
      setCheckingDependencies(false);
    }
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDelete(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setDependencyInfo(null);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderStatusBadge = (user: SimpleUser) => (
    <Badge
      variant={user.isActive ? "default" : "secondary"}
      className={
        user.isActive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }
    >
      {user.isActive ? "Active" : "Inactive"}
    </Badge>
  );

  return (
    <>
    <Card className="border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <CardTitle className="text-xl dark:text-white">Team members</CardTitle>
            <CardDescription className="dark:text-gray-400">
              {loading
                ? "Loading the latest staff list..."
                : `${total} user${total === 1 ? "" : "s"} found`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteClick}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedIds.size} selected
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-gray-700 dark:text-gray-300 dark:border-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(
                  Object.keys(columnVisibility) as (keyof ColumnVisibility)[]
                ).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column}
                    checked={columnVisibility[column]}
                    onCheckedChange={() => onToggleColumn(column)}
                    className="capitalize"
                  >
                    {column}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="w-12">
                  <Checkbox
                    checked={users.length > 0 && selectedIds.size === users.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="dark:text-gray-300">Name</TableHead>
                {columnVisibility.email && <TableHead className="dark:text-gray-300">Email</TableHead>}
                {columnVisibility.role && <TableHead className="dark:text-gray-300">Role</TableHead>}
                {columnVisibility.supervisor && (
                  <TableHead className="dark:text-gray-300">Supervisor</TableHead>
                )}
                {columnVisibility.activity && <TableHead className="dark:text-gray-300">Last login</TableHead>}
                {columnVisibility.status && <TableHead className="dark:text-gray-300">Status</TableHead>}
                {columnVisibility.createdAt && <TableHead className="dark:text-gray-300">Created</TableHead>}
                <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell colSpan={9}>
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      Fetching users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell colSpan={9}>
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No users match the current filters
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/50 dark:border-gray-700">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => handleSelectOne(user.id)}
                        aria-label={`Select ${getDisplayName(user)}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {user.profileImage ? (
                            <AvatarImage
                              src={user.profileImage}
                              alt={getDisplayName(user)}
                            />
                          ) : (
                            <AvatarImage
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                getDisplayName(user)
                              )}&background=10b981&color=fff`}
                              alt={getDisplayName(user)}
                            />
                          )}
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getDisplayName(user).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getDisplayName(user)}
                          </p>
                          {user.phone && (
                            <p className="text-sm text-gray-500">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {columnVisibility.email && (
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.role && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="uppercase tracking-wide text-xs border-gray-300"
                        >
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.supervisor && (
                      <TableCell className="text-sm text-gray-600">
                        {user.supervisor
                          ? `${user.supervisor.firstName || ""} ${
                              user.supervisor.lastName || ""
                            }`.trim() || user.supervisor.email
                          : "—"}
                      </TableCell>
                    )}
                    {columnVisibility.activity && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800">
                            {formatDateTime(user.lastLoginAt)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {user.loginCount ?? 0} logins
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.status && (
                      <TableCell>{renderStatusBadge(user)}</TableCell>
                    )}
                    {columnVisibility.createdAt && (
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDateTime(user.createdAt)}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50"
                            onClick={() => onView(user)}
                          >
                            <Eye className="h-4 w-4" />
                            View details
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50"
                            onClick={() => onChangePassword(user)}
                          >
                            <KeyRound className="h-4 w-4" />
                            Reset password
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50"
                            onClick={() => onEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit user
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteClick(user)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? (
                              <span className="h-4 w-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete user
                          </button>
                          {currentUserRole === "ADMIN" &&
                            user.id !== currentUserId &&
                            onImpersonate && (
                              <button
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 mt-1 pt-2"
                                onClick={() => onImpersonate(user)}
                                disabled={impersonatingId === user.id}
                              >
                                {impersonatingId === user.id ? (
                                  <span className="h-4 w-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                  <LogIn className="h-4 w-4" />
                                )}
                                Login as user
                              </button>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserCheck className="h-4 w-4 text-gray-400" />
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-4">
            <SelectPageSize value={pageSize} onChange={onPageSizeChange} />
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-700 px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Single Delete Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {userToDelete ? getDisplayName(userToDelete) : "this user"}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        {checkingDependencies ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Checking dependencies...</span>
          </div>
        ) : dependencyInfo && !dependencyInfo.canDelete ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Cannot delete this user</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{dependencyInfo.message}</p>
                {dependencyInfo.dependencies && (
                  <ul className="text-sm text-red-600 dark:text-red-300 mt-2 space-y-1">
                    {dependencyInfo.dependencies.unions && dependencyInfo.dependencies.unions > 0 && (
                      <li>• {dependencyInfo.dependencies.unions} union(s) assigned</li>
                    )}
                    {dependencyInfo.dependencies.loans && dependencyInfo.dependencies.loans > 0 && (
                      <li>• {dependencyInfo.dependencies.loans} active loan(s)</li>
                    )}
                    {dependencyInfo.dependencies.supervisedUsers && dependencyInfo.dependencies.supervisedUsers > 0 && (
                      <li>• {dependencyInfo.dependencies.supervisedUsers} supervised user(s)</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : dependencyInfo && dependencyInfo.canDelete && Object.values(dependencyInfo.dependencies || {}).some(v => v && v > 0) ? (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Warning</p>
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                  This user has associated data that may be affected:
                </p>
                <ul className="text-sm text-amber-600 dark:text-amber-300 mt-2 space-y-1">
                  {dependencyInfo.dependencies.unions && dependencyInfo.dependencies.unions > 0 && (
                    <li>• {dependencyInfo.dependencies.unions} union(s) will be unassigned</li>
                  )}
                  {dependencyInfo.dependencies.supervisedUsers && dependencyInfo.dependencies.supervisedUsers > 0 && (
                    <li>• {dependencyInfo.dependencies.supervisedUsers} supervised user(s) will lose supervisor</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteDialogOpen(false);
              setUserToDelete(null);
              setDependencyInfo(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={checkingDependencies || (dependencyInfo && !dependencyInfo.canDelete)}
          >
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Bulk Delete Confirmation Dialog */}
    <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Delete Multiple Users
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedIds.size} users</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Warning</p>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                Users with active assignments (unions, loans, supervised users) will not be deleted.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setBulkDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmBulkDelete}
          >
            Delete {selectedIds.size} Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

interface SelectPageSizeProps {
  value: number;
  onChange: (value: number) => void;
}

function SelectPageSize({ value, onChange }: SelectPageSizeProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      Rows per page:
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 bg-white"
      >
        {pageSizeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
