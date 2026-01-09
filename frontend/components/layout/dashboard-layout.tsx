"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "../ui/sidebar";
import { Header } from "../ui/header";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/enum";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // Detect mobile window size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, sidebarOpen]);

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || sidebarOpen) && (
        <div
          className={`
            ${isMobile ? "fixed inset-y-0 left-0 z-50" : "flex-shrink-0"}
            ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
            transition-transform duration-300 ease-in-out
          `}
        >
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            isMobile={isMobile}
            isOpen={sidebarOpen}
            userRoles={user?.role ? [user.role] : []}
            onNavigation={closeMobileSidebar}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onSidebarToggle={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div onClick={closeMobileSidebar}>{children}</div>
        </main>
      </div>
    </div>
  );
}

// "use client";

// import type React from "react";

// import { useState, useEffect } from "react";
// import { Sidebar } from "../ui/sidebar";
// import { Header } from "../ui/header";

// interface DashboardLayoutProps {
//   children: React.ReactNode;
// }

// export function DashboardLayout({ children }: DashboardLayoutProps) {
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);

//       if (mobile) {
//         setSidebarCollapsed(true);
//         setSidebarOpen(false);
//       } else {
//         setSidebarOpen(false);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     handleResize(); // Check on mount

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const toggleSidebar = () => {
//     if (isMobile) {
//       setSidebarOpen(!sidebarOpen);
//     } else {
//       setSidebarCollapsed(!sidebarCollapsed);
//     }
//   };

//   const closeMobileSidebar = () => {
//     if (isMobile && sidebarOpen) {
//       setSidebarOpen(false);
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50 overflow-hidden">
//       {isMobile && sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
//           onClick={closeMobileSidebar}
//         />
//       )}

//       <div
//         className={`
//         ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"}
//         ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
//         transition-transform duration-300 ease-in-out
//       `}
//       >
//         <Sidebar
//           isCollapsed={sidebarCollapsed}
//           onToggle={toggleSidebar}
//           isMobile={isMobile}
//           isOpen={sidebarOpen}
//         />
//       </div>

//       {/* Main Content */}
//       {/* <div className="flex-1 flex flex-col overflow-hidden min-w-0"> */}
//       <div
//         className={`flex-1 flex flex-col overflow-hidden min-w-0 ${
//           sidebarCollapsed ? "ml-16" : "ml-64"
//         }`}
//       >
//         {/* Header */}
//         <Header onSidebarToggle={toggleSidebar} />

//         <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }
