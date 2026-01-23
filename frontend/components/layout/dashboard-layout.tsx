"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "../ui/header";
import {
  AceternitySidebar,
  SidebarBody,
  MobileSidebar,
} from "@/components/ui/aceternity-sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AceternitySidebar>
      <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 overflow-hidden h-screen">
        {/* Desktop Sidebar */}
        <SidebarBody
          className="hidden md:flex"
          userRoles={user?.role ? [user.role] : []}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          open={mobileOpen}
          setOpen={setMobileOpen}
          userRoles={user?.role ? [user.role] : []}
        />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMobileMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </AceternitySidebar>
  );
}
