import React from "react";
import { User } from "@/types/user"; // Changed from @/interface/interfaces
import { UserRole } from "@/lib/enum";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Activity,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnrichedUser extends User {
  branchName?: string;
  lastLogin?: string;
  activityCount?: number;
  permissions?: string[];
  fullName?: string;
}

interface UserProfileModalProps {
  user: EnrichedUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !user) return null;

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Admin";
      case UserRole.BRANCH_MANAGER:
        return "Branch Manager";
      case UserRole.CREDIT_OFFICER:
        return "Credit Officer";
      default:
        return role;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge className="bg-purple-100 text-purple-800 text-xs">Admin</Badge>
        );
      case UserRole.BRANCH_MANAGER:
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            Branch Manager
          </Badge>
        );
      case UserRole.CREDIT_OFFICER:
        return (
          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
            Credit Officer
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 text-xs">User</Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === "ACTIVE" || status === "active";
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 text-xs">Inactive</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.name || user.email}
                </h2>
                <p className="text-emerald-100">User ID: {user.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-200 transition-colors"
              aria-label="Close user profile"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status and Role */}
          <div className="flex items-center space-x-4 mb-6">
            {getRoleBadge(user.role)}
            {getStatusBadge(user.status)}
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Address
                      </p>
                      <p className="text-gray-900">{user.address}</p>
                    </div>
                  </div>
                )}

                {(user as EnrichedUser).branchName && (
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Branch
                      </p>
                      <p className="text-gray-900">
                        {(user as EnrichedUser).branchName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity & Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Activity & Timestamps
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-gray-900">
                      {formatDate(user.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Last Updated
                    </p>
                    <p className="text-gray-900">
                      {formatDate(user.updatedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(user.updatedAt)}
                    </p>
                  </div>
                </div>

                {(user as EnrichedUser).lastLogin && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Last Login
                      </p>
                      <p className="text-gray-900">
                        {formatDate((user as EnrichedUser).lastLogin!)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo((user as EnrichedUser).lastLogin!)}
                      </p>
                    </div>
                  </div>
                )}

                {(user as EnrichedUser).activityCount !== undefined && (
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Activity Count
                      </p>
                      <p className="text-gray-900">
                        {(user as EnrichedUser).activityCount}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          {(user as EnrichedUser).permissions &&
            (user as EnrichedUser).permissions!.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Permissions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(user as EnrichedUser).permissions!.map(
                    (permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
