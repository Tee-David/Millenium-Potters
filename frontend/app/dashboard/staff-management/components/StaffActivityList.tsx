"use client";

import { Clock3, RefreshCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface StaffActivity {
  id: string;
  userName: string;
  role?: string;
  description: string;
  timestamp?: string;
}

interface StaffActivityListProps {
  activities: StaffActivity[];
  loading: boolean;
  onRefresh?: () => void;
}

export function StaffActivityList({
  activities,
  loading,
  onRefresh,
}: StaffActivityListProps) {
  const renderSkeleton = () =>
    Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-4 rounded-lg border border-dashed border-gray-200 animate-pulse"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-100" />
          <div>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    ));

  const renderEmpty = () => (
    <div className="text-center text-sm text-gray-500 py-6">
      No recent staff activity logged yet.
    </div>
  );

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg text-gray-900">
            Recent Staff Activity
          </CardTitle>
          <CardDescription>
            Last sign-ins and actions recorded across the team
          </CardDescription>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading
            ? renderSkeleton()
            : activities.length === 0
            ? renderEmpty()
            : activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white text-emerald-600 font-semibold flex items-center justify-center border border-emerald-100">
                      {activity.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.role ? `${activity.role} • ` : ""}
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 space-x-1">
                    <Clock3 className="h-3 w-3" />
                    <span>
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Just now"}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
