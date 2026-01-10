"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]" />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors",
                "min-h-[44px] sm:min-h-[36px]",
                "cursor-pointer"
              )}
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">👤</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 hidden xs:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showUserMenu && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50",
                    "sm:w-48 w-40 max-w-[90vw]"
                  )}
                >
                  <a
                    href="/dashboard/settings"
                    className="block px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </a>
                  <hr className="my-2" />
                  <a
                    href="#"
                    className="block px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    Sign Out
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
