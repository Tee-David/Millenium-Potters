"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  Users,
  ShieldCheck,
  UserPlus,
  FileText,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import {
  BranchManagerOrAdmin,
  AccessDenied,
} from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usersApi, enhancedApi } from "@/lib/api";
import { UserRole } from "@/lib/enum";
import { StaffStatsCards, StaffStats } from "./components/StaffStatsCards";
import {
  StaffActivityList,
  StaffActivity,
} from "./components/StaffActivityList";
import { StaffQuickActions, QuickAction } from "./components/StaffQuickActions";

const buildName = (
  first?: string | null,
  last?: string | null,
  fallback?: string
) => {
  const computed = `${first?.trim() ?? ""} ${last?.trim() ?? ""}`.trim();
  return computed || fallback || "Staff Member";
};

const parseUsersCount = (response: any): number => {
  const payload = response?.data?.data ?? response?.data ?? {};
  if (typeof payload.total === "number") return payload.total;
  if (typeof payload.count === "number") return payload.count;
  if (payload.pagination?.total) return payload.pagination.total;
  if (Array.isArray(payload.users)) return payload.users.length;
  if (Array.isArray(payload.data?.users)) return payload.data.users.length;
  return 0;
};

const mapActivityRecords = (records: any[]): StaffActivity[] =>
  records.slice(0, 5).map((item, index) => ({
    id:
      item.id ||
      item.logId ||
      item.historyId ||
      `${item.userId ?? "activity"}-${index}`,
    userName:
      item.user?.name ||
      buildName(item.user?.firstName, item.user?.lastName, item.user?.email) ||
      item.userName ||
      item.email ||
      "Unknown Staff",
    role: item.user?.role || item.role || undefined,
    description:
      item.description ||
      item.action ||
      item.event ||
      item.activity ||
      "Activity logged",
    timestamp:
      item.timestamp || item.loggedAt || item.createdAt || item.updatedAt,
  }));

export default function StaffManagementPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<StaffStats>({
    totalUsers: 0,
    activeUsers: 0,
    supervisors: 0,
    creditOfficers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [totalRes, activeRes, supervisorRes, officerRes] =
        await Promise.all([
          usersApi.getAll({ page: 1, limit: 1 }),
          usersApi.getAll({ page: 1, limit: 1, isActive: true }),
          usersApi.getAll({ page: 1, limit: 1, role: UserRole.SUPERVISOR }),
          usersApi.getAll({ page: 1, limit: 1, role: UserRole.CREDIT_OFFICER }),
        ]);

      setStats({
        totalUsers: parseUsersCount(totalRes),
        activeUsers: parseUsersCount(activeRes),
        supervisors: parseUsersCount(supervisorRes),
        creditOfficers: parseUsersCount(officerRes),
      });
    } catch (error) {
      console.error("Failed to fetch staff stats", error);
      toast.error("Unable to load staff stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const response = await enhancedApi.userActivity.getLoginHistory({
        limit: 5,
      });
      const payload = response.data?.data ?? response.data ?? {};
      const records =
        payload.records ??
        payload.data ??
        payload.logs ??
        payload.history ??
        [];

      setActivities(Array.isArray(records) ? mapActivityRecords(records) : []);
    } catch (error) {
      console.warn("Failed to fetch staff activity", error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
      fetchActivities();
    }
  }, [currentUser, fetchStats, fetchActivities]);

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: "add-user",
        title: "Add New User",
        description: "Create admins, supervisors or credit officers",
        icon: <UserPlus className="h-4 w-4" />,
        onClick: () => router.push("/dashboard/staff-management/users"),
      },
      {
        id: "review-permissions",
        title: "Review Permissions",
        description: "Audit supervisors and officer assignments",
        icon: <ShieldCheck className="h-4 w-4" />,
        onClick: () =>
          toast.info(
            "Role configuration coming soon. Visit settings to manage roles."
          ),
      },
      {
        id: "staff-report",
        title: "Staff Report",
        description: "Export current staff roster and activity",
        icon: <FileText className="h-4 w-4" />,
        onClick: () =>
          toast.info("Staff reporting is handled from the reports workspace."),
      },
    ],
    [router]
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 text-sm">Loading staff management...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AccessDenied message="Only administrators and supervisors can access staff management." />
    );
  }

  return (
    <BranchManagerOrAdmin
      fallback={
        <AccessDenied message="Only administrators and supervisors can access staff management." />
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Staff Management
            </h1>
            <p className="text-gray-600 mt-1">
              Oversee admins, supervisors, and credit officers across every
              union.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-200"
              onClick={() => {
                fetchStats();
                fetchActivities();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link
              href="/dashboard/staff-management/users"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Manage Users
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            title="Users"
            description="Manage accounts, roles, and supervisors"
            href="/dashboard/staff-management/users"
            icon={<Users className="h-5 w-5" />}
          />
          <FeatureCard
            title="Roles & Permissions"
            description="Keep supervisors and officers aligned"
            href="/dashboard/staff-management/roles"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </div>

        <StaffStatsCards stats={stats} loading={statsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StaffActivityList
              activities={activities}
              loading={activitiesLoading}
              onRefresh={fetchActivities}
            />
          </div>
          <StaffQuickActions actions={quickActions} />
        </div>
      </div>
    </BranchManagerOrAdmin>
  );
}

function FeatureCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-200 transition-colors flex items-start space-x-3"
    >
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <span className="text-sm font-medium text-emerald-600 mt-3 inline-flex items-center">
          Go to section
          <ClipboardList className="h-4 w-4 ml-1" />
        </span>
      </div>
    </Link>
  );
}
