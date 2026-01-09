import type { LucideIcon } from "lucide-react";
import {
  Users,
  Building2,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  ArrowRightLeft,
  MessageSquare,
  Activity,
  Target,
  TrendingUp,
  Shield,
  KeyRound,
  Bell,
  HelpCircle,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
  badge?: string;
  roles?: string[];
}

export interface NavigationData {
  main: NavItem[];
  sections: {
    title: string;
    items: NavItem[];
  }[];
}

export const navigationData: NavigationData = {
  main: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
    },
    {
      name: "Users",
      href: "/dashboard/staff-management/users",
      icon: Users,
      children: [
        {
          name: "All Users",
          href: "/dashboard/staff-management/users",
          icon: Users,
        },
        {
          name: "Enhanced Management",
          href: "/dashboard/staff-management/users/enhanced-page",
          icon: UserCheck,
        },
        {
          name: "Activity Tracking",
          href: "/dashboard/staff-management/users/activity",
          icon: Activity,
        },
      ],
    },
    {
      name: "Branches",
      href: "/dashboard/business-management/branch",
      icon: Building2,
      children: [
        {
          name: "Branch Management",
          href: "/dashboard/business-management/branch",
          icon: Building2,
        },
        {
          name: "Branch Transfers",
          href: "/dashboard/business-management/branch-transfers",
          icon: ArrowRightLeft,
        },
        {
          name: "Branch Analytics",
          href: "/dashboard/business-management/branch/analytics",
          icon: TrendingUp,
        },
      ],
    },
    {
      name: "Customers",
      href: "/dashboard/business-management/customer",
      icon: UserCheck,
    },
    {
      name: "Loans",
      href: "/dashboard/business-management/loan",
      icon: Target,
    },
    {
      name: "Repayments",
      href: "/dashboard/business-management/loan-payment",
      icon: TrendingUp,
    },
    {
      name: "Notes",
      href: "/dashboard/business-management/notes",
      icon: MessageSquare,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      children: [
        {
          name: "Overview",
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
        {
          name: "Supervisor Reports",
          href: "/dashboard/supervisor-reports",
          icon: Target,
          roles: ["SUPERVISOR", "ADMIN"],
        },
        {
          name: "Branch Performance",
          href: "/dashboard/analytics/branches",
          icon: Building2,
        },
        {
          name: "User Activity",
          href: "/dashboard/analytics/activity",
          icon: Activity,
        },
        {
          name: "Revenue Analysis",
          href: "/dashboard/analytics/revenue",
          icon: TrendingUp,
        },
      ],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      children: [
        {
          name: "General",
          href: "/dashboard/settings",
          icon: Settings,
        },
        {
          name: "Company",
          href: "/dashboard/settings/company",
          icon: Building2,
        },
        {
          name: "Email",
          href: "/dashboard/settings/email",
          icon: Bell,
        },
        {
          name: "Security",
          href: "/dashboard/settings/security",
          icon: Shield,
        },
        {
          name: "Password",
          href: "/dashboard/settings/password",
          icon: KeyRound,
        },
      ],
    },
  ],
  sections: [
    {
      title: "Business Management",
      items: [
        {
          name: "Customers",
          href: "/dashboard/business-management/customer",
          icon: UserCheck,
        },
        {
          name: "Loans",
          href: "/dashboard/business-management/loan",
          icon: Target,
        },
        {
          name: "Repayments",
          href: "/dashboard/business-management/loan-payment",
          icon: TrendingUp,
        },
        {
          name: "Branches",
          href: "/dashboard/business-management/branch",
          icon: Building2,
        },
        {
          name: "Branch Transfers",
          href: "/dashboard/business-management/branch-transfers",
          icon: ArrowRightLeft,
        },
        {
          name: "Notes",
          href: "/dashboard/business-management/notes",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Staff Management",
      items: [
        {
          name: "Users",
          href: "/dashboard/staff-management/users",
          icon: Users,
        },
        {
          name: "Enhanced Users",
          href: "/dashboard/staff-management/users/enhanced-page",
          icon: UserCheck,
        },
        {
          name: "Roles & Permissions",
          href: "/dashboard/staff-management/roles",
          icon: Shield,
        },
        {
          name: "Activity Logs",
          href: "/dashboard/staff-management/activity",
          icon: Activity,
        },
      ],
    },
    {
      title: "Analytics & Reports",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
        {
          name: "Supervisor Reports",
          href: "/dashboard/supervisor-reports",
          icon: Target,
          roles: ["SUPERVISOR", "ADMIN"],
        },
        {
          name: "Branch Performance",
          href: "/dashboard/analytics/branches",
          icon: Building2,
        },
        {
          name: "User Activity",
          href: "/dashboard/analytics/activity",
          icon: Activity,
        },
        {
          name: "Revenue Analysis",
          href: "/dashboard/analytics/revenue",
          icon: TrendingUp,
        },
        {
          name: "System Reports",
          href: "/dashboard/analytics/reports",
          icon: FileText,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          name: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
        {
          name: "Audit Logs",
          href: "/dashboard/system/audit-logs",
          icon: FileText,
        },
        {
          name: "System Health",
          href: "/dashboard/system/health",
          icon: Activity,
        },
        {
          name: "Help & Support",
          href: "/dashboard/system/help",
          icon: HelpCircle,
        },
      ],
    },
  ],
};
