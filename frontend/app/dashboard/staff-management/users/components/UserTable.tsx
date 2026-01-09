"use client";

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
  deletingId: string | null;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const pageSizeOptions = [10, 20, 50, 100];

export function UserTable({
  users,
  loading,
  columnVisibility,
  onToggleColumn,
  onView,
  onEdit,
  onChangePassword,
  onDelete,
  deletingId,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: UserTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getDisplayName = (user: SimpleUser) => {
    const firstName = user.firstName?.trim() || "";
    const lastName = user.lastName?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email;
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
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Team members</CardTitle>
            <CardDescription>
              {loading
                ? "Loading the latest staff list..."
                : `${total} user${total === 1 ? "" : "s"} found`}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-gray-700">
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
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {columnVisibility.email && <TableHead>Email</TableHead>}
                {columnVisibility.role && <TableHead>Role</TableHead>}
                {columnVisibility.supervisor && (
                  <TableHead>Supervisor</TableHead>
                )}
                {columnVisibility.activity && <TableHead>Last login</TableHead>}
                {columnVisibility.status && <TableHead>Status</TableHead>}
                {columnVisibility.createdAt && <TableHead>Created</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-12 text-center text-gray-500">
                      Fetching users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-12 text-center text-gray-500">
                      No users match the current filters
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/60">
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
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(user.id)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? (
                              <span className="h-4 w-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete user
                          </button>
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
