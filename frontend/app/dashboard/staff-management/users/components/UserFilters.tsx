"use client";

import { Search, FilterX, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/lib/enum";
import { SupervisorOption, UserFiltersState } from "./types";
import { SearchableSelect } from "@/components/SearchableSelect";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: UserFiltersState;
  onFilterChange: (update: Partial<UserFiltersState>) => void;
  onClear: () => void;
  onRefresh: () => void;
  loading: boolean;
  supervisorOptions: SupervisorOption[];
  activeFilters: number;
}

export function UserFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  onRefresh,
  loading,
  supervisorOptions,
  activeFilters,
}: UserFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium text-gray-600">
            Search users
          </Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email"
              className="pl-9"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <div>
            <Label className="text-sm font-medium text-gray-600">
              Filter by role
            </Label>
            <Select
              value={filters.role}
              onValueChange={(value) => onFilterChange({ role: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
                <SelectItem value={UserRole.CREDIT_OFFICER}>
                  Credit Officer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">
              Filter by status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFilterChange({ status: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">
              Supervisor
            </Label>
            <SearchableSelect
              value={filters.supervisorId}
              onValueChange={(value) => onFilterChange({ supervisorId: value })}
              placeholder="All supervisors"
              searchPlaceholder="Search supervisors..."
              options={[
                { value: "all", label: "All supervisors" },
                ...supervisorOptions.map((option) => ({
                  value: option.id,
                  label: `${option.name} (${option.email})`,
                })),
              ]}
              className="mt-1"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {activeFilters > 0
            ? `${activeFilters} active ${
                activeFilters === 1 ? "filter" : "filters"
              }`
            : "No filters applied"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-900"
            disabled={activeFilters === 0 && !search}
          >
            <FilterX className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
