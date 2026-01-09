"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SimpleUser } from "./types";

interface UserDetailsModalProps {
  user: SimpleUser | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
}

export function UserDetailsModal({
  user,
  isOpen,
  onOpenChange,
  loading = false,
}: UserDetailsModalProps) {
  const getDisplayName = () => {
    if (!user) return "";
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>User profile</DialogTitle>
          <DialogDescription>
            Detailed profile information, activity, and reporting lines.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading user...</div>
        ) : user ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={
                    user.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      getDisplayName()
                    )}&background=10b981&color=fff`
                  }
                  alt={getDisplayName()}
                />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {getDisplayName().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {getDisplayName()}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="uppercase tracking-wide text-xs"
                  >
                    {user.role.replace("_", " ")}
                  </Badge>
                  <Badge
                    className={
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Contact
                </h4>
                <dl className="space-y-2 text-sm text-gray-700">
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="font-medium">
                      {user.phone || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Address</dt>
                    <dd className="font-medium whitespace-pre-line">
                      {user.address || "Not provided"}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Reporting
                </h4>
                <dl className="space-y-2 text-sm text-gray-700">
                  <div>
                    <dt className="text-gray-500">Supervisor</dt>
                    <dd className="font-medium">
                      {user.supervisor
                        ? `${user.supervisor.firstName || ""} ${
                            user.supervisor.lastName || ""
                          }`.trim() || user.supervisor.email
                        : "Reports to Admin"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Last login</dt>
                    <dd className="font-medium">
                      {formatDateTime(user.lastLoginAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Logins</dt>
                    <dd className="font-medium">
                      {user.loginCount ?? 0} total sessions
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <p className="text-gray-500">Created at</p>
                <p className="font-medium">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Last updated</p>
                <p className="font-medium">{formatDateTime(user.updatedAt)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            Unable to load user details.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
