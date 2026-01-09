"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Mobile-responsive container
export function MobileContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </div>
  );
}

// Mobile-responsive grid
export function MobileGrid({
  children,
  cols = 1,
  className = "",
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  className?: string;
}) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", gridClasses[cols], className)}>
      {children}
    </div>
  );
}

// Mobile-responsive flex
export function MobileFlex({
  children,
  direction = "row",
  wrap = false,
  className = "",
}: {
  children: React.ReactNode;
  direction?: "row" | "col";
  wrap?: boolean;
  className?: string;
}) {
  const flexClasses = {
    row: "flex-row",
    col: "flex-col sm:flex-row",
  };

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-4",
        flexClasses[direction],
        wrap && "flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}

// Mobile-responsive text
export function MobileText({
  children,
  size = "base",
  className = "",
}: {
  children: React.ReactNode;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const sizeClasses = {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    base: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
    xl: "text-lg sm:text-xl",
    "2xl": "text-xl sm:text-2xl",
  };

  return <span className={cn(sizeClasses[size], className)}>{children}</span>;
}

// Mobile-responsive button
export function MobileButton({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
  className?: string;
  [key: string]: any;
}) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm",
    default: "px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base",
    lg: "px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg",
  };

  const variantClasses = {
    default: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Mobile-responsive table
export function MobileTable({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[600px]">{children}</table>
    </div>
  );
}

// Mobile-responsive card
export function MobileCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// Mobile-responsive modal
export function MobileModal({
  isOpen,
  onClose,
  children,
  className = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          "bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Mobile-responsive form
export function MobileForm({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form className={cn("space-y-4 sm:space-y-6", className)}>{children}</form>
  );
}

// Mobile-responsive input
export function MobileInput({
  className = "",
  ...props
}: {
  className?: string;
  [key: string]: any;
}) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
        className
      )}
      {...props}
    />
  );
}

// Mobile-responsive select
export function MobileSelect({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// Mobile-responsive textarea
export function MobileTextarea({
  className = "",
  ...props
}: {
  className?: string;
  [key: string]: any;
}) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none",
        className
      )}
      {...props}
    />
  );
}

// Mobile-responsive navigation
export function MobileNav({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 bg-white border-b border-gray-200",
        className
      )}
    >
      {children}
    </nav>
  );
}

// Mobile-responsive sidebar
export function MobileSidebar({
  isOpen,
  onClose,
  children,
  className = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out sm:translate-x-0 sm:static sm:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

// Mobile-responsive pagination
export function MobilePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <MobileButton
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </MobileButton>

      <div className="flex gap-1">
        {pages
          .slice(Math.max(0, currentPage - 3), currentPage + 2)
          .map((page) => (
            <MobileButton
              key={page}
              size="sm"
              variant={page === currentPage ? "default" : "outline"}
              onClick={() => onPageChange(page)}
            >
              {page}
            </MobileButton>
          ))}
      </div>

      <MobileButton
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </MobileButton>
    </div>
  );
}
