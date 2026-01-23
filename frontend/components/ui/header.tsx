"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useSidebar } from "@/components/ui/aceternity-sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api";

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const sidebar = useSidebar();
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "checking">("checking");

  useEffect(() => {
    const checkConnection = async () => {
      const baseUrl = API_URL.replace(/\/api\/?$/, "");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setConnectionStatus(response.ok ? "online" : "offline");
      } catch {
        setConnectionStatus("offline");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuClick}
            className={cn(
              "md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              "min-h-[44px] min-w-[44px]"
            )}
            aria-label="Open mobile menu"
          >
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={() => sidebar?.setOpen?.(!sidebar?.open)}
            className={cn(
              "hidden md:flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              "min-h-[36px] min-w-[36px]"
            )}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium">
            {connectionStatus === "checking" && (
              <span className="flex items-center gap-1 text-gray-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Checking...</span>
              </span>
            )}
            {connectionStatus === "online" && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Online</span>
              </span>
            )}
            {connectionStatus === "offline" && (
              <span className="flex items-center gap-1 text-red-500">
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>

          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  );
}
