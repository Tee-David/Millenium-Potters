"use client";

import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { getSafeImageUrl } from "@/lib/image-utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  User,
  Banknote,
  Receipt,
  Clipboard,
  UserCheck,
  Target,
  FileType,
  Folder,
  Activity,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  UsersRound,
  Briefcase,
  PieChart,
  Cog,
  UserCircle,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { UserRole } from "@/lib/enum";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
  roles?: UserRole[];
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger";
}

export interface NavigationData {
  main: NavItem[];
  sections: { title: string; items: NavItem[]; icon?: LucideIcon }[];
}

const navigationData: NavigationData = {
  main: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [UserRole.CREDIT_OFFICER, UserRole.ADMIN, UserRole.SUPERVISOR],
    },
  ],
  sections: [
    {
      title: "Staff",
      icon: UsersRound,
      items: [
        {
          name: "Users & Roles",
          href: "/dashboard/staff-management/users",
          icon: Users,
          roles: [UserRole.ADMIN, UserRole.SUPERVISOR],
        },
      ],
    },
    {
      title: "Business",
      icon: Briefcase,
      items: [
        {
          name: "Unions",
          href: "/dashboard/business-management/union",
          icon: Building2,
          roles: [UserRole.ADMIN, UserRole.SUPERVISOR],
        },
        {
          name: "Union Assignment",
          href: "/dashboard/business-management/union-assignment",
          icon: UserCheck,
          roles: [UserRole.ADMIN, UserRole.SUPERVISOR],
        },
        {
          name: "Members",
          href: "/dashboard/business-management/customer",
          icon: User,
          roles: [UserRole.CREDIT_OFFICER, UserRole.ADMIN, UserRole.SUPERVISOR],
        },
        {
          name: "Loans",
          href: "/dashboard/business-management/loan",
          icon: Banknote,
          roles: [UserRole.CREDIT_OFFICER, UserRole.ADMIN, UserRole.SUPERVISOR],
        },
        {
          name: "Repayments",
          href: "/dashboard/business-management/loan-payment/repayment",
          icon: Receipt,
          roles: [UserRole.CREDIT_OFFICER, UserRole.ADMIN, UserRole.SUPERVISOR],
        },
        {
          name: "Schedules",
          href: "/dashboard/business-management/loan-payment/repayment-schedules",
          icon: Clipboard,
          roles: [UserRole.CREDIT_OFFICER, UserRole.ADMIN, UserRole.SUPERVISOR],
        },
      ],
    },
    {
      title: "Analytics",
      icon: PieChart,
      items: [
        {
          name: "Supervisor Reports",
          href: "/dashboard/supervisor-reports",
          icon: Target,
          roles: [UserRole.ADMIN, UserRole.SUPERVISOR],
        },
      ],
    },
    {
      title: "Configuration",
      icon: Cog,
      items: [
        {
          name: "Loan Types",
          href: "/dashboard/system-configuration/loan-type",
          icon: FileType,
          roles: [UserRole.ADMIN],
        },
        {
          name: "Document Types",
          href: "/dashboard/system-configuration/document-type",
          icon: Folder,
          roles: [UserRole.ADMIN],
        },
        {
          name: "Audit Logs",
          href: "/dashboard/system-configuration/audit-logs",
          icon: Activity,
          roles: [UserRole.ADMIN, UserRole.SUPERVISOR],
        },
        {
          name: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
          roles: [UserRole.ADMIN],
        },
      ],
    },
  ],
};

function normalizeUserRoles(userRoles?: UserRole[] | UserRole): UserRole[] {
  if (!userRoles) return [];
  return Array.isArray(userRoles) ? userRoles : [userRoles];
}

function filterNavItemsByRoles(
  items: NavItem[],
  userRoles: UserRole[]
): NavItem[] {
  return items
    .filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((role) => userRoles.includes(role));
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavItemsByRoles(item.children, userRoles)
        : undefined,
    }))
    .filter((item) => !(item.children && item.children.length === 0));
}

const SidebarContext = createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}>({
  open: false,
  setOpen: () => {},
  animate: true,
});

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface AceternitySidebarProps {
  userRoles?: UserRole[] | UserRole;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  children: React.ReactNode;
}

export function AceternitySidebar({
  userRoles,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  children,
}: AceternitySidebarProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarBodyProps {
  className?: string;
  userRoles?: UserRole[] | UserRole;
}

export function SidebarBody({
  className,
  userRoles,
  ...props
}: SidebarBodyProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const { logo } = useCompany();
  const { open, setOpen, animate } = useSidebar();

  const rolesArray = normalizeUserRoles(userRoles);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((t) => t !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const filteredMain = filterNavItemsByRoles(navigationData.main, rolesArray);
  const filteredSections = navigationData.sections
    .map((section) => ({
      ...section,
      items: filterNavItemsByRoles(section.items, rolesArray),
    }))
    .filter((section) => section.items.length > 0);

  // Auto-expand sections containing active items
  React.useEffect(() => {
    const activeSections = filteredSections
      .filter((section) => section.items.some((item) => isActive(item.href)))
      .map((section) => section.title);

    setExpandedSections((prev) => {
      const newExpanded = [...new Set([...prev, ...activeSections])];
      return newExpanded;
    });
  }, [pathname, filteredSections.length]);

  const effectiveOpen = open || isHovering;

  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-white dark:bg-neutral-900 w-[250px] flex-shrink-0 relative",
        className
      )}
      animate={{
        width: animate ? (effectiveOpen ? "250px" : "60px") : "250px",
      }}
      onMouseEnter={() => !open && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <DesktopSidebar
        logo={logo}
        open={effectiveOpen}
        setOpen={setOpen}
        filteredMain={filteredMain}
        filteredSections={filteredSections}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        isActive={isActive}
        animate={animate}
      />
    </motion.div>
  );
}

interface DesktopSidebarProps {
  logo: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  filteredMain: NavItem[];
  filteredSections: { title: string; items: NavItem[]; icon?: LucideIcon }[];
  expandedSections: string[];
  toggleSection: (title: string) => void;
  isActive: (href: string) => boolean;
  animate: boolean;
}

function DesktopSidebar({
  logo,
  open,
  setOpen,
  filteredMain,
  filteredSections,
  expandedSections,
  toggleSection,
  isActive,
  animate,
}: DesktopSidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {open ? <Logo logo={logo} /> : <LogoIcon logo={logo} />}
        <div className="mt-8 flex flex-col gap-2">
          {filteredMain.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              open={open}
            />
          ))}
          {filteredSections.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
              open={open}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              isActive={isActive}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <SidebarLink
          item={{
            name: "Profile",
            href: "/dashboard/settings",
            icon: UserCircle,
          }}
          isActive={isActive("/dashboard/settings")}
          open={open}
        />
        <SidebarLink
          item={{
            name: "Sign Out",
            href: "#",
            icon: LogOut,
          }}
          isActive={false}
          open={open}
          onClick={handleLogout}
        />
        <SidebarLink
          item={{
            name: open ? "Collapse" : "Expand",
            href: "#",
            icon: open ? ChevronRight : Menu,
          }}
          isActive={false}
          open={open}
          onClick={() => setOpen(!open)}
        />
      </div>
    </>
  );
}

function Logo({ logo }: { logo: string | null }) {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <Image
        src="/logo-horizontal.png"
        alt="Company Logo"
        width={200}
        height={60}
        className="h-16 w-auto object-contain"
        priority
        onError={(e) => {
          e.currentTarget.src = "/logo.png";
        }}
      />
    </Link>
  );
}

function LogoIcon({ logo }: { logo: string | null }) {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <Image
        src="/logo-favicon.png"
        alt="Company Logo"
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        priority
        onError={(e) => {
          e.currentTarget.src = "/logo-favicon.png";
        }}
      />
    </Link>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  isActive: boolean;
  open: boolean;
  onClick?: () => void;
}

function SidebarLink({ item, isActive, open, onClick }: SidebarLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={onClick ? "#" : item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 group/sidebar py-2 px-2 rounded-md transition-colors",
        open ? "justify-start" : "justify-center",
        isActive
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          isActive
            ? "text-white"
            : "text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-green-600"
        )}
      />
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className={cn(
          "text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
          isActive
            ? "text-white font-medium"
            : "text-neutral-700 dark:text-neutral-200"
        )}
      >
        {item.name}
      </motion.span>
    </Link>
  );
}

interface SidebarSectionProps {
  section: { title: string; items: NavItem[]; icon?: LucideIcon };
  open: boolean;
  expandedSections: string[];
  toggleSection: (title: string) => void;
  isActive: (href: string) => boolean;
}

function SidebarSection({
  section,
  open,
  expandedSections,
  toggleSection,
  isActive,
}: SidebarSectionProps) {
  const SectionIcon = section.icon || Folder;
  const isExpanded = expandedSections.includes(section.title);
  const hasActiveItem = section.items.some((item) => isActive(item.href));

  return (
    <div className="flex flex-col">
      <button
        onClick={() => open && toggleSection(section.title)}
        className={cn(
          "flex items-center justify-between gap-2 py-2 px-2 rounded-md transition-colors",
          hasActiveItem
            ? "bg-green-50 text-green-700"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          !open && "justify-center"
        )}
      >
        <div className="flex items-center gap-2">
          <SectionIcon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              hasActiveItem ? "text-green-600" : "text-neutral-500"
            )}
          />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider whitespace-nowrap",
                  hasActiveItem ? "text-green-700" : "text-neutral-500"
                )}
              >
                {section.title}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {open && (
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180" : "",
              hasActiveItem ? "text-green-600" : "text-neutral-400"
            )}
          />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1 mt-1 ml-2 pl-4 border-l border-neutral-200 dark:border-neutral-700"
          >
            {section.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                open={open}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Sidebar
export function MobileSidebar({
  userRoles,
  open,
  setOpen,
}: {
  userRoles?: UserRole[] | UserRole;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { logo } = useCompany();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  const rolesArray = normalizeUserRoles(userRoles);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((t) => t !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const filteredMain = filterNavItemsByRoles(navigationData.main, rolesArray);
  const filteredSections = navigationData.sections
    .map((section) => ({
      ...section,
      items: filterNavItemsByRoles(section.items, rolesArray),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between md:hidden"
            )}
          >
            <div
              className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
              onClick={() => setOpen(false)}
            >
              <X className="h-6 w-6" />
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              <Logo logo={logo} />
              <div className="mt-8 flex flex-col gap-2">
                {filteredMain.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                    open={true}
                  />
                ))}
                {filteredSections.map((section) => (
                  <SidebarSection
                    key={section.title}
                    section={section}
                    open={true}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    isActive={isActive}
                  />
                ))}
              </div>
              <div className="mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                <SidebarLink
                  item={{
                    name: "Profile",
                    href: "/dashboard/settings",
                    icon: UserCircle,
                  }}
                  isActive={isActive("/dashboard/settings")}
                  open={true}
                  onClick={() => setOpen(false)}
                />
                <SidebarLink
                  item={{
                    name: "Sign Out",
                    href: "#",
                    icon: LogOut,
                  }}
                  isActive={false}
                  open={true}
                  onClick={handleLogout}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
