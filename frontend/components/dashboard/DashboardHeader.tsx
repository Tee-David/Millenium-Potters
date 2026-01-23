"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  usersApi,
  customersApi,
  loansApi,
  branchesApi,
  loanTypesApi,
} from "@/lib/api";
import {
  parseUsers,
  parseCustomers,
  parseLoans,
  parseBranches,
} from "@/lib/api-parser";
import {
  Home,
  Bell,
  Search,
  Settings,
  RefreshCw,
  Filter,
  Download,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  onRefresh: () => void;
  notifications: any[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  searchResults: any[];
  isSearching: boolean;
  onNotificationClick: (notification: any) => void;
  onSearchResultClick: (result: any) => void;
  onCustomizationClick: () => void;
}

export default function DashboardHeader({
  searchTerm,
  setSearchTerm,
  timeRange,
  setTimeRange,
  onRefresh,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  showSearchResults,
  setShowSearchResults,
  searchResults,
  isSearching,
  onNotificationClick,
  onSearchResultClick,
  onCustomizationClick,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const navigate = (href: string) => {
    router.push(href);
  };

  return (
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search customers, loans, users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 sm:w-80 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-2">
                      {searchResults.map((category) => (
                        <div key={category.type} className="mb-4 last:mb-0">
                          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                            <span>{category.type}</span>
                            <span className="text-gray-400">
                              ({category.items.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item: any) => (
                              <button
                                key={item.id}
                                onClick={() => onSearchResultClick(item)}
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
                    <div className="p-4 text-center">
                      <Search className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs">No results found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search */}
            <div className="relative lg:hidden search-container">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-48 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Mobile Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-1">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((category) => (
                        <div key={category.type} className="mb-3 last:mb-0">
                          <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                            <span>{category.type}</span>
                            <span className="text-gray-400">
                              ({category.items.length})
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {category.items.slice(0, 3).map((item: any) => (
                              <button
                                key={item.id}
                                onClick={() => onSearchResultClick(item)}
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
                    <div className="p-3 text-center">
                      <Search className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs">No results found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden lg:inline">Refresh</span>
            </Button>

            {/* Notifications */}
            <div className="relative notification-container">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
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
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle mark all as read
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
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
                          className={`p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => onNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
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
                              <p className="text-sm text-gray-900 font-medium">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                              {notification.action && (
                                <button
                                  onClick={() => {
                                    // Handle notification action
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
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
                                onClick={() => {
                                  // Handle delete notification
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 sm:p-3 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-gray-600 hover:text-gray-800"
                    >
                      View all notifications
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-52">
                <DropdownMenuItem
                  onClick={onCustomizationClick}
                  className="text-xs sm:text-sm"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs sm:text-sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter Options
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs sm:text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm sm:text-lg font-bold text-white">
                {(user as any)?.firstName?.charAt(0) ||
                  user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
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
                  ? "Monitor your branch performance and manage operations"
                  : "Track your assigned customers and loan portfolios"}
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

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              onClick={() => navigate("/dashboard/business-management/customer")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button
              onClick={() => navigate("/dashboard/business-management/loan")}
              variant="outline"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Loan</span>
              <span className="sm:hidden">Loan</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
