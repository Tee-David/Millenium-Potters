// Comprehensive TypeScript type definitions for the loan management system

// ===== ENUMS =====
export enum UserRole {
  ADMIN = "ADMIN",
  SUPERVISOR = "SUPERVISOR",
  CREDIT_OFFICER = "CREDIT_OFFICER",
  BRANCH_MANAGER = "BRANCH_MANAGER", // Legacy alias retained for backward compatibility
}

export enum LoanStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DEFAULTED = "DEFAULTED",
  WRITTEN_OFF = "WRITTEN_OFF",
  CANCELED = "CANCELED",
}

export enum TermUnit {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export enum ScheduleStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

export enum RepaymentMethod {
  CASH = "CASH",
  TRANSFER = "TRANSFER",
  POS = "POS",
  MOBILE = "MOBILE",
  USSD = "USSD",
  OTHER = "OTHER",
}

// ===== BASE INTERFACES =====
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  pagination?: PaginationInfo;
}

// ===== USER TYPES =====
export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  supervisorId?: string | null;
  supervisor?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  profileImage?: string | null;
  loginCount?: number;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  // Additional frontend fields
  name: string;
  status: "active" | "inactive";
  branchId?: string | null; // legacy
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CreateUserDto {
  email: string;
  password?: string;
  role: UserRole;
  firstName: string;
  lastName?: string;
  phone?: string;
  address?: string;
  supervisorId?: string | null;
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  supervisorId?: string | null;
  profileImage?: string | null;
}

export interface BackendUser extends BaseEntity {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  phone?: string | null;
  address?: string | null;
  supervisorId?: string | null;
  supervisor?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  loginCount?: number;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  profileImage?: string | null;
  branchId?: string | null; // legacy
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// ===== BRANCH TYPES =====
export interface Branch extends BaseEntity {
  name: string;
  code: string;
  managerId?: string | null;
  isActive: boolean;
  manager?: {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  };
  users?: User[];
  _count?: {
    customers: number;
    loans: number;
    users?: number;
  };
  _creditOfficersCount?: number;
}

export interface CreateBranchDto {
  name: string;
  managerId?: string;
}

export interface UpdateBranchDto {
  name?: string;
  managerId?: string;
  isActive?: boolean;
}

// ===== CUSTOMER TYPES =====
export interface Customer extends BaseEntity {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  currentOfficerId?: string | null;
  code?: string;
  profileImage?: string;
  isVerified?: boolean;
  // Additional frontend fields
  name: string;
  branchName: string;
  creditOfficerName: string;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  note?: string;
  profileImage?: string;
  isVerified?: boolean;
  branchId: string;
  currentOfficerId?: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  note?: string;
  profileImage?: string;
  isVerified?: boolean;
  branchId?: string;
  currentOfficerId?: string;
}

// ===== LOAN TYPES =====
export interface LoanType extends BaseEntity {
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  termUnit: TermUnit;
  minTerm: number;
  maxTerm: number;
  isActive: boolean;
}

export interface CreateLoanTypeDto {
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  termUnit: TermUnit;
  minTerm: number;
  maxTerm: number;
}

export interface UpdateLoanTypeDto {
  name?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  termUnit?: TermUnit;
  minTerm?: number;
  maxTerm?: number;
  isActive?: boolean;
}

// ===== LOAN TYPES =====
export interface Loan extends BaseEntity {
  loanNumber: string;
  principalAmount: number;
  status: LoanStatus;
  termCount: number;
  termUnit: TermUnit;
  startDate: string;
  dueDate?: string;
  processingFeeAmount: number;
  penaltyFeePerDayAmount: number;
  interestRate?: number;
  notes?: string;
  customerId: string;
  loanTypeId?: string;
  createdByUserId: string;
  assignedOfficerId?: string;
  branchId: string;
  // Related entities
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  loanType?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    email: string;
  };
  assignedOfficer?: {
    id: string;
    name?: string;
    email: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface CreateLoanDto {
  customerId: string;
  loanTypeId?: string;
  principalAmount: number;
  termCount: number;
  termUnit: TermUnit;
  startDate: string;
  processingFeeAmount: number;
  penaltyFeePerDayAmount: number;
  interestRate?: number;
  notes?: string;
}

export interface UpdateLoanDto {
  loanTypeId?: string;
  principalAmount?: number;
  termCount?: number;
  termUnit?: TermUnit;
  startDate?: string;
  processingFeeAmount?: number;
  penaltyFeePerDayAmount?: number;
  notes?: string;
}

// ===== REPAYMENT TYPES =====
export interface Repayment extends BaseEntity {
  amount: number;
  method: RepaymentMethod;
  notes?: string;
  loanId: string;
  createdByUserId: string;
  // Related entities
  loan?: {
    id: string;
    loanNumber: string;
    principalAmount: number;
  };
  createdByUser?: {
    id: string;
    email: string;
  };
}

export interface CreateRepaymentDto {
  amount: number;
  method: RepaymentMethod;
  notes?: string;
  loanId: string;
}

export interface UpdateRepaymentDto {
  amount?: number;
  method?: RepaymentMethod;
  notes?: string;
}

// ===== REPAYMENT SCHEDULE TYPES =====
export interface RepaymentSchedule extends BaseEntity {
  dueDate: string;
  amount: number;
  status: ScheduleStatus;
  paidAmount?: number;
  loanId: string;
  // Related entities
  loan?: {
    id: string;
    loanNumber: string;
  };
}

// ===== DOCUMENT TYPES =====
export interface DocumentType extends BaseEntity {
  name: string;
  description?: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface CreateDocumentTypeDto {
  name: string;
  description?: string;
  isRequired: boolean;
}

export interface UpdateDocumentTypeDto {
  name?: string;
  description?: string;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface CustomerDocument extends BaseEntity {
  type: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  customerId: string;
  uploadedByUserId: string;
  // Related entities
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  uploadedByUser?: {
    id: string;
    email: string;
  };
}

// ===== AUDIT LOG TYPES =====
export interface AuditLog extends BaseEntity {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
  // Related entities
  actor?: {
    id: string;
    email: string;
  };
}

// ===== SETTINGS TYPES =====
export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  description?: string;
}

export interface EmailSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface GeneralSettings {
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// ===== FORM TYPES =====
export interface UserFormData {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  profile?: File | null;
  status: "active" | "inactive";
  branch: string;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  currentOfficerId?: string;
}

export interface LoanFormData {
  customerId: string;
  loanTypeId?: string;
  principalAmount: string;
  termCount: string;
  termUnit: TermUnit;
  startDate: string;
  processingFeeAmount: string;
  penaltyFeePerDayAmount: string;
  interestRate?: string;
  notes?: string;
}

// ===== FILTER TYPES =====
export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  currentOfficerId?: string;
  search?: string;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  status?: LoanStatus;
  branchId?: string;
  assignedOfficerId?: string;
  customerId?: string;
  search?: string;
}

export interface RepaymentFilters {
  page?: number;
  limit?: number;
  loanId?: string;
  method?: RepaymentMethod;
  search?: string;
}

// ===== DASHBOARD TYPES =====
export interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalLoans: number;
  totalBranches: number;
  activeLoans: number;
  overdueLoans: number;
  totalLoanAmount: number;
  totalRepaidAmount: number;
  pendingAmount: number;
  loanApprovalRate: number;
  monthlyGrowth: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: Array<{
    id: number;
    type: string;
    user: string;
    amount: number;
    timestamp: string;
    status: string;
  }>;
  loanStats: Array<{
    month: string;
    approved: number;
    rejected: number;
  }>;
  topBranches: Array<{
    name: string;
    loans: number;
    revenue: number;
  }>;
  loanTypes: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

// ===== UTILITY TYPES =====
export type LoadingState = {
  loading: boolean;
  error: string | null;
  data: any;
};

export type PaginationState = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

export type SortDirection = "asc" | "desc";

export type SortConfig<T> = {
  key: keyof T;
  direction: SortDirection;
};

// ===== API TYPES =====
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ===== COMPONENT PROPS TYPES =====
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface FormProps<T> {
  initialData?: Partial<T>;
  onSubmit: (data: T) => void;
  onCancel?: () => void;
  loading?: boolean;
  validationSchema?: any;
}

// ===== EXPORT TYPES =====
export interface ExportOptions {
  format: "excel" | "pdf" | "csv";
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// ===== NOTIFICATION TYPES =====
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
