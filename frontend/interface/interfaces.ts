import { UserRole } from "@/lib/enum";
import { LucideIcon } from "lucide-react";

// User interface
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profile?: File | any | null;
  avatar?: string;
  createdAt: string;
  status: "active" | "inactive";
}

// Create/Edit User Modal Component
export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<User>) => void;
  user?: User | null;
  mode: "create" | "edit";
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface NavigationData {
  main: NavItem[];
  sections: { title: string; items: NavItem[] }[];
}

// / Types for other entities (keeping existing for compatibility)
interface Manager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

interface CreditOfficer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  joinDate: string;
  status: "Active" | "Inactive";
  branchIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for creating/updating (keeping existing for compatibility)
interface CreateManagerDto {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}

interface UpdateManagerDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: "Active" | "Inactive";
}

interface CreateCreditOfficerDto {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  password: string;
  branchIds?: string[];
}

interface UpdateCreditOfficerDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  status?: "Active" | "Inactive";
  branchIds?: string[];
}
