"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  User,
  Key,
  Settings,
  Building2,
  Mail,
  CreditCard,
  Shield,
  MessageSquare,
  ChevronRight,
  Menu,
  Palette,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const settingsItems: SettingsItem[] = [
  {
    id: "user-profile",
    title: "User Profile",
    description: "User Account Profile Settings",
    icon: User,
  },
  {
    id: "password",
    title: "Password",
    description: "Password Settings",
    icon: Key,
  },
  {
    id: "company",
    title: "Company",
    description: "Company Settings",
    icon: Building2,
  },
  {
    id: "theme",
    title: "Theme & Branding",
    description: "Customize colors and logos",
    icon: Palette,
  },
  {
    id: "data",
    title: "Data Management",
    description: "Backup, restore, and reset system",
    icon: Database,
  },
  // {
  //   id: "email",
  //   title: "Email",
  //   description: "Email SMTP Settings",
  //   icon: Mail,
  // },
  // {
  //   id: "general",
  //   title: "General",
  //   description: "General Settings",
  //   icon: Settings,
  // },
  // {
  //   id: "payment",
  //   title: "Payment",
  //   description: "Payment Settings",
  //   icon: CreditCard,
  // },
  // {
  //   id: "2fa",
  //   title: "2 Factors Authentication",
  //   description: "2 Factors Authentication Settings",
  //   icon: Shield,
  // },
  // {
  //   id: "twilio",
  //   title: "twilio Settings",
  //   description: "twilio Settings",
  //   icon: MessageSquare,
  // },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
}

export function SettingsLayout({
  children,
  activeSection = "user-profile",
  onSectionChange,
}: SettingsLayoutProps) {
  const [selectedSection, setSelectedSection] = useState(activeSection);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    setShowMobileMenu(false);
    onSectionChange?.(sectionId);
  };

  const activeItem = settingsItems.find((item) => item.id === selectedSection);

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">
      {/* Mobile Section Selector */}
      <div className="lg:hidden relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            {activeItem && (
              <activeItem.icon className="w-5 h-5 text-gray-600" />
            )}
            <div className="text-left">
              <div className="font-medium text-gray-900">
                {activeItem?.title}
              </div>
              <div className="text-sm text-gray-500">
                {activeItem?.description}
              </div>
            </div>
          </div>
          <ChevronRight
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform duration-200",
              showMobileMenu ? "rotate-90" : ""
            )}
          />
        </button>

        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto">
              {settingsItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                      selectedSection === item.id
                        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                        : "text-gray-700"
                    )}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-80 xl:w-96">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-6">
          <div className="divide-y divide-gray-100">
            {settingsItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors",
                    selectedSection === item.id
                      ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                      : "text-gray-700"
                  )}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
