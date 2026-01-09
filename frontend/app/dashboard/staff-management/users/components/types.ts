import { UserRole } from "@/lib/enum";

export interface SimpleUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole | string;
  isActive: boolean;
  supervisorId?: string | null;
  supervisor?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  phone?: string | null;
  address?: string | null;
  profileImage?: string | null;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  loginCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupervisorOption {
  id: string;
  name: string;
  email: string;
}

export interface UserFiltersState {
  role: string;
  status: string;
  supervisorId: string;
}

export interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole | string;
  supervisorId: string;
  phone: string;
  address: string;
  isActive: boolean;
}

export type ColumnVisibility = {
  email: boolean;
  role: boolean;
  supervisor: boolean;
  activity: boolean;
  status: boolean;
  createdAt: boolean;
};
