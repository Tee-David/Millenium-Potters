"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usersApi, auth } from "@/lib/api";
import { UserRole } from "@/lib/enum";
import {
  AccessDenied,
  BranchManagerOrAdmin,
} from "@/components/auth/RoleGuard";
import { PasswordChangeModal } from "@/components/modals/password-change-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserFilters } from "./components/UserFilters";
import { UserTable } from "./components/UserTable";
import { UserFormModal } from "./components/UserFormModal";
import { UserDetailsModal } from "./components/UserDetailsModal";
import {
  ColumnVisibility,
  SimpleUser,
  SupervisorOption,
  UserFiltersState,
  UserFormState,
} from "./components/types";
import { User as BackendUser } from "@/types/user";

const defaultFilters: UserFiltersState = {
  role: "all",
  status: "all",
  supervisorId: "all",
};

const initialFormState: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: UserRole.CREDIT_OFFICER,
  supervisorId: "",
  phone: "",
  address: "",
  isActive: true,
};

const buildName = (
  first?: string | null,
  last?: string | null,
  fallback?: string
) => {
  const computed = `${first?.trim() ?? ""} ${last?.trim() ?? ""}`.trim();
  return computed || fallback || "";
};

const mapApiUser = (user: any): SimpleUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName ?? "",
  lastName: user.lastName ?? "",
  role: user.role,
  isActive: Boolean(user.isActive),
  supervisorId: user.supervisorId ?? user.supervisor?.id ?? null,
  supervisor: user.supervisor
    ? {
        id: user.supervisor.id,
        firstName: user.supervisor.firstName ?? "",
        lastName: user.supervisor.lastName ?? "",
        email: user.supervisor.email,
      }
    : null,
  phone: user.phone ?? "",
  address: user.address ?? "",
  profileImage: user.profileImage ?? null,
  lastLoginAt: user.lastLoginAt ?? null,
  lastActivityAt: user.lastActivityAt ?? null,
  loginCount: user.loginCount ?? 0,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const mapSupervisorOption = (user: any): SupervisorOption => ({
  id: user.id,
  name: buildName(user.firstName, user.lastName, user.email),
  email: user.email,
});

const getDisplayName = (user: SimpleUser) =>
  buildName(user.firstName, user.lastName, user.email);

const toBackendUser = (user: SimpleUser): BackendUser => ({
  id: user.id,
  email: user.email,
  role: user.role as UserRole,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  name: getDisplayName(user),
  status: user.isActive ? "active" : "inactive",
  firstName: user.firstName ?? undefined,
  lastName: user.lastName ?? undefined,
  phone: user.phone ?? undefined,
  address: user.address ?? undefined,
  branchId: null,
});

function UsersPageContent() {
  const { user: currentUser, isLoading: authLoading, login } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFiltersState>(defaultFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    email: true,
    role: true,
    supervisor: true,
    activity: true,
    status: true,
    createdAt: true,
  });
  const [formModal, setFormModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
  }>({ open: false, mode: "create" });
  const [formState, setFormState] = useState<UserFormState>(initialFormState);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    user: BackendUser | null;
  }>({ open: false, user: null });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      400
    );
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchSupervisors = useCallback(async () => {
    try {
      const [supervisorRes, adminRes] = await Promise.all([
        usersApi.getAll({ role: UserRole.SUPERVISOR, limit: 200, page: 1 }),
        usersApi.getAll({ role: UserRole.ADMIN, limit: 100, page: 1 }),
      ]);

      const mapResponse = (response: any) => {
        const payload = response.data?.data ?? response.data ?? {};
        const list = payload.users ?? payload.data?.users ?? [];
        return list.map(mapSupervisorOption);
      };

      const combined = [
        ...mapResponse(supervisorRes),
        ...mapResponse(adminRes),
      ];
      const unique = combined.filter(
        (option, index, array) =>
          index === array.findIndex((item) => item.id === option.id)
      );

      setSupervisors(unique);
    } catch (err) {
      console.warn("Unable to load supervisors", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getAll({
        page,
        limit: pageSize,
        role: filters.role !== "all" ? filters.role : undefined,
        supervisorId:
          filters.supervisorId !== "all" ? filters.supervisorId : undefined,
        isActive:
          filters.status === "all" ? undefined : filters.status === "active",
        search: debouncedSearch || undefined,
      });

      const payload = response.data?.data ?? response.data ?? {};
      const apiUsers = payload.users ?? payload.data?.users ?? [];
      const mappedUsers = apiUsers.map(mapApiUser);

      setUsers(mappedUsers);
      setTotal(payload.total ?? mappedUsers.length);
    } catch (err: any) {
      console.error("Error fetching users", err);
      const message =
        err?.response?.data?.message || err?.message || "Failed to load users";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [
    currentUser,
    page,
    pageSize,
    filters.role,
    filters.status,
    filters.supervisorId,
    debouncedSearch,
  ]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchSupervisors();
    }
  }, [currentUser, fetchUsers, fetchSupervisors]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.role !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.supervisorId !== "all") count++;
    if (debouncedSearch) count++;
    return count;
  }, [filters, debouncedSearch]);

  const handleFilterChange = (update: Partial<UserFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSearchTerm("");
    setPage(1);
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handleOpenCreate = () => {
    setFormState(initialFormState);
    setEditingUserId(null);
    setFormModal({ open: true, mode: "create" });
  };

  const handleEditUser = (user: SimpleUser) => {
    setFormState({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      password: "",
      role: user.role as UserRole,
      supervisorId: user.supervisorId || "",
      phone: user.phone || "",
      address: user.address || "",
      isActive: user.isActive,
    });
    setEditingUserId(user.id);
    setFormModal({ open: true, mode: "edit" });
  };

  const validateForm = () => {
    if (!formState.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formState.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!formState.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (
      formModal.mode === "create" &&
      (!formState.password || formState.password.length < 8)
    ) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (formState.role === UserRole.CREDIT_OFFICER && !formState.supervisorId) {
      toast.error("Credit officers must have a supervisor");
      return false;
    }
    return true;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    const payload = {
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      email: formState.email.trim().toLowerCase(),
      role: formState.role as UserRole,
      supervisorId: formState.supervisorId || undefined,
      phone: formState.phone?.trim() || undefined,
      address: formState.address?.trim() || undefined,
      isActive: formState.isActive,
    };

    try {
      setSubmitting(true);
      if (formModal.mode === "create") {
        await usersApi.create({
          ...payload,
          password: formState.password,
        });
        toast.success("User created successfully");
      } else if (editingUserId) {
        await usersApi.update(editingUserId, payload);
        toast.success("User updated successfully");
      }
      setFormModal((prev) => ({ ...prev, open: false }));
      setFormState(initialFormState);
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Request failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeletingId(userId);
      await usersApi.remove(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to delete user";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async (userIds: string[]) => {
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      try {
        await usersApi.remove(userId);
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Failed to delete user ${userId}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} user(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} user(s) (may have dependencies)`);
    }

    fetchUsers();
  };

  const handleViewDetails = async (user: SimpleUser) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setSelectedUser(user);
    try {
      const response = await usersApi.getById(user.id);
      const payload = response.data?.data ?? response.data;
      setSelectedUser(mapApiUser(payload));
    } catch (err) {
      console.warn("Unable to fetch user details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePasswordModal = (user: SimpleUser) => {
    setPasswordModal({ open: true, user: toBackendUser(user) });
  };

  const handlePasswordSubmit = async ({
    newPassword,
  }: {
    newPassword: string;
  }) => {
    if (!passwordModal.user) return;
    try {
      setIsPasswordChanging(true);
      await usersApi.resetPassword(passwordModal.user.id, newPassword);
      toast.success("Password updated successfully");
      setPasswordModal({ open: false, user: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reset password";
      toast.error(message);
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handlePageChange = (nextPage: number) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, nextPage), totalPages);
    setPage(safePage);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleImpersonate = async (user: SimpleUser) => {
    if (currentUser?.role !== "ADMIN") {
      toast.error("Only administrators can impersonate users");
      return;
    }

    try {
      setImpersonatingId(user.id);
      const response = await auth.impersonateUser(user.id);
      const data = response.data?.data ?? response.data;

      if (data?.accessToken && data?.refreshToken) {
        // Store tokens directly (don't use login which might have race conditions)
        localStorage.setItem("access_token", data.accessToken);
        localStorage.setItem("refresh_token", data.refreshToken);

        // Store user data for immediate access
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        toast.success(`Now logged in as ${data.user?.email || user.email}`);

        // Full page reload to ensure all components get the new user context
        // This is necessary because role-based navigation needs a fresh state
        window.location.href = "/dashboard";
      } else {
        toast.error("Failed to impersonate user - invalid response");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to impersonate user";
      toast.error(message);
    } finally {
      setImpersonatingId(null);
    }
  };

  const activeUsers = users.filter((user) => user.isActive).length;
  const supervisorCount = users.filter(
    (user) => user.role === UserRole.SUPERVISOR
  ).length;
  const officerCount = users.filter(
    (user) => user.role === UserRole.CREDIT_OFFICER
  ).length;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-600">
          Loading user management...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AccessDenied message="Please sign in to manage staff accounts." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            User management
          </h1>
          <p className="text-sm text-gray-500">
            Create admins, supervisors, and credit officers aligned with the new
            Union-based backend.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New user
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Unable to load users
              </p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            {activeUsers} active on this page
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Supervisors</CardDescription>
            <CardTitle className="text-2xl">{supervisorCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            Showing supervisors in the current result set
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credit officers</CardDescription>
            <CardTitle className="text-2xl">{officerCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            Map to the new Union hierarchy
          </CardContent>
        </Card>
      </div>

      <UserFilters
        search={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        onRefresh={fetchUsers}
        loading={loading}
        supervisorOptions={supervisors}
        activeFilters={activeFiltersCount}
      />

      <UserTable
        users={users}
        loading={loading}
        columnVisibility={columnVisibility}
        onToggleColumn={toggleColumnVisibility}
        onView={handleViewDetails}
        onEdit={handleEditUser}
        onChangePassword={handlePasswordModal}
        onDelete={handleDeleteUser}
        onBulkDelete={handleBulkDelete}
        deletingId={deletingId}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onImpersonate={handleImpersonate}
        impersonatingId={impersonatingId}
        currentUserRole={currentUser?.role}
        currentUserId={currentUser?.id}
      />

      <UserFormModal
        mode={formModal.mode}
        isOpen={formModal.open}
        onOpenChange={(open) => {
          setFormModal((prev) => ({ ...prev, open }));
          if (!open) {
            setFormState(initialFormState);
            setEditingUserId(null);
          }
        }}
        formState={formState}
        onChange={(update) => setFormState((prev) => ({ ...prev, ...update }))}
        onSubmit={handleSubmitForm}
        isSubmitting={submitting}
        supervisorOptions={supervisors}
      />

      <PasswordChangeModal
        isOpen={passwordModal.open}
        user={passwordModal.user}
        onClose={() => setPasswordModal({ open: false, user: null })}
        loading={isPasswordChanging}
        onSubmit={({ newPassword }) => handlePasswordSubmit({ newPassword })}
      />

      <UserDetailsModal
        isOpen={detailsModalOpen}
        onOpenChange={(open) => setDetailsModalOpen(open)}
        user={selectedUser}
        loading={detailsLoading}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <BranchManagerOrAdmin
      fallback={
        <AccessDenied message="Only administrators and supervisors can access user management." />
      }
    >
      <UsersPageContent />
    </BranchManagerOrAdmin>
  );
}
