"use client";

import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/aceternity-sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const sidebar = useSidebar();

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuClick}
            className={cn(
              "md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors",
              "min-h-[44px] min-w-[44px]"
            )}
            aria-label="Open mobile menu"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={() => sidebar?.setOpen?.(!sidebar?.open)}
            className={cn(
              "hidden md:flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors",
              "min-h-[36px] min-w-[36px]"
            )}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  );
}
