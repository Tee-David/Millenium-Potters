"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAccessToken } from "@/lib/api";

import { CompanySettingsEnhanced } from "@/components/settings/company-settings-enhanced";
import { Toaster } from "sonner";
import { SettingsLayout } from "@/components/settings/layout";
import { EmailSettings } from "@/components/settings/email-settings";
import UserProfileSettings from "@/components/settings/user-profile-settings";
import { PasswordSettingsEnhanced } from "@/components/settings/password-settings-enhanced";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { AdminOnly, AccessDenied } from "@/components/auth/RoleGuard";

// Breadcrumb component
function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-2">›</span>}
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug authentication state
  useEffect(() => {
    console.log("Settings Page - Auth state:", {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      token: getAccessToken() ? "present" : "missing",
      userInStorage: localStorage.getItem("user") ? "present" : "missing",
    });
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) return null;

  // Allow admins to access the full settings UI; non-admins get a simplified page
  if (user?.role === "ADMIN") {
    return (
      <AdminOnly
        fallback={
          <AccessDenied message="Only administrators can access system settings." />
        }
      >
        <SettingsPageContent />
      </AdminOnly>
    );
  }

  // Non-admin authenticated users can access their profile and password settings
  if (isAuthenticated) {
    return <NonAdminSettingsPage />;
  }

  return <AccessDenied message="You must be signed in to access settings." />;
}

function SettingsPageContent() {
  const [activeSection, setActiveSection] = useState("user-profile");

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      "user-profile": "User Profile",
      password: "Password",
      company: "Company",
      theme: "Theme & Branding",
      // email: "Email",
    };
    return titles[sectionId] || "System Settings";
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "user-profile":
        return <UserProfileSettings />;
      case "password":
        return <PasswordSettingsEnhanced />;
      case "company":
        return <CompanySettingsEnhanced />;
      case "theme":
        return <ThemeSettings />;
      // case "email":
      //   return <EmailSettings />;
      default:
        return "User Profile";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          System Settings
        </h1>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "System Settings" },
          ]}
        />
      </div>

      {/* Settings Layout */}
      <SettingsLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {renderActiveSection()}
      </SettingsLayout>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "white",
            border: "1px solid #e5e7eb",
            color: "#374151",
          },
        }}
      />
    </div>
  );
}

function NonAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Account Settings
        </h1>
        <p className="text-sm text-gray-600">
          Manage your account and password
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <UserProfileSettings />
        </div>
        <div>
          <PasswordSettingsEnhanced />
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "white",
            border: "1px solid #e5e7eb",
            color: "#374151",
          },
        }}
      />
    </div>
  );
}
