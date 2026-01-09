"use client";

import { Users, Activity, ShieldCheck, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StaffStats {
  totalUsers: number;
  activeUsers: number;
  supervisors: number;
  creditOfficers: number;
}

interface StaffStatsCardsProps {
  stats: StaffStats;
  loading: boolean;
}

const STAT_ITEMS = [
  {
    key: "totalUsers" as const,
    label: "Total Staff",
    description: "All active and archived staff accounts",
    icon: Users,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "activeUsers" as const,
    label: "Active Users",
    description: "Currently enabled user accounts",
    icon: Activity,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    key: "supervisors" as const,
    label: "Supervisors",
    description: "Admins & supervisors overseeing unions",
    icon: ShieldCheck,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    key: "creditOfficers" as const,
    label: "Credit Officers",
    description: "Frontline officers assigned to unions",
    icon: UserCheck,
    accent: "bg-purple-50 text-purple-600",
  },
];

export function StaffStatsCards({ stats, loading }: StaffStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {item.label}
              </CardTitle>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${item.accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-10 w-24 rounded-md bg-gray-100 animate-pulse" />
              ) : (
                <p className="text-3xl font-semibold text-gray-900">
                  {stats[item.key].toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
