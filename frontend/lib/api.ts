import axios from "axios";
import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "@/types/customer";
import { Branch, CreateBranchDto, UpdateBranchDto } from "@/types/branch";
import { CreateUserDto, UpdateUserDto } from "@/types/user";
import { toast } from "sonner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://l-d1.onrender.com/api";

/**
 * Get access token from storage
 * Checks localStorage first (for "remember me"), then sessionStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
};

/**
 * Clear access token from both storages
 */
export const clearAccessToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("remember_me");
  sessionStorage.removeItem("access_token");
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/*  attach JWT  */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Debug logging for user creation requests
  if (config.url?.includes("/users") && config.method === "post") {
    console.log("API Request - Creating user:", {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
    });
  }

  return config;
});

/*  auto logout on 401 and handle database errors  */
api.interceptors.response.use(
  (res) => {
    // Debug logging for user creation responses
    if (res.config.url?.includes("/users") && res.config.method === "post") {
      console.log("API Response - User creation:", {
        status: res.status,
        data: res.data,
        headers: res.headers,
      });
    }
    return res;
  },
  async (err) => {
    // Debug logging for user creation errors
    if (err.config?.url?.includes("/users") && err.config?.method === "post") {
      console.error("API Error - User creation failed:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        config: err.config,
      });
    }

    // Handle 401 unauthorized - Only for actual authentication failures
    if (err.response?.status === 401) {
      console.log("API interceptor: 401 detected for URL:", err.config?.url);

      // Only handle 401s for protected routes, not auth routes
      if (!err.config?.url?.includes("/auth/")) {
        console.log(
          "API interceptor: 401 on protected route, clearing session"
        );
        clearAccessToken();
        localStorage.removeItem("user");

        // Only redirect if not already on login page and not in iframe
        if (
          !window.location.pathname.includes("/login") &&
          window.top === window.self
        ) {
          console.log("API interceptor: Redirecting to login");
          window.location.href = "/login";
        }
      }

      return Promise.reject(err);
    }

    // Handle 429 rate limiting with retry
    if (err.response?.status === 429) {
      const config = err.config;
      config._retryCount = config._retryCount || 0;

      // Only retry up to 3 times
      if (config._retryCount < 3) {
        config._retryCount++;
        const delay = Math.pow(2, config._retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.warn(
          `⚠️ Rate limited - retrying in ${delay / 1000}s (attempt ${
            config._retryCount
          }/3)`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }

      console.warn("⚠️ Rate limited - max retries reached");
      toast.error("Too many requests", {
        description: "Please wait a moment and try again",
        duration: 3000,
      });
      return Promise.reject(err);
    }

    // Handle database connection errors
    if (err.response?.data?.message) {
      const message = err.response.data.message;

      // Check for database connection errors
      if (
        message.includes("Can't reach database server") ||
        message.includes("database server is running") ||
        message.includes("Connection terminated") ||
        message.includes("Connection timeout") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ETIMEDOUT") ||
        message.includes("ENOTFOUND")
      ) {
        toast.error("Database Connection Error", {
          description: `Backend Error: ${message}`, // Show exact error message
          duration: 5000,
        });
        return Promise.reject(err);
      }

      // Check for Prisma database errors
      if (
        message.includes("Invalid prisma") ||
        message.includes("PrismaClientKnownRequestError") ||
        message.includes("PrismaClientUnknownRequestError") ||
        message.includes("PrismaClientRustPanicError")
      ) {
        toast.error("Database Error", {
          description: `Database Error: ${message}`, // Show exact error message
          duration: 5000,
        });
        return Promise.reject(err);
      }

      // For all other server errors, show the exact message
      toast.error("Server Error", {
        description: message, // Show exact backend error message
        duration: 5000,
      });
      return Promise.reject(err);
    }

    // Handle network errors with retry
    if (
      err.code === "NETWORK_ERROR" ||
      err.code === "ECONNABORTED" ||
      err.message.includes("Network Error") ||
      err.message.includes("timeout") ||
      !err.response
    ) {
      const config = err.config;
      config._networkRetryCount = config._networkRetryCount || 0;

      // Retry network errors up to 3 times
      if (config._networkRetryCount < 3) {
        config._networkRetryCount++;
        const delay = Math.pow(2, config._networkRetryCount) * 1000; // 2s, 4s, 8s
        console.warn(
          `⚠️ Network error - retrying in ${delay / 1000}s (attempt ${config._networkRetryCount}/3)`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }

      toast.error("Network Error", {
        description:
          "Unable to connect to the server. Please check your internet connection.",
        duration: 5000,
      });
      return Promise.reject(err);
    }

    // Handle 5xx server errors with retry
    if (err.response?.status >= 500 && err.response?.status < 600) {
      const config = err.config;
      config._serverRetryCount = config._serverRetryCount || 0;

      // Retry server errors up to 2 times
      if (config._serverRetryCount < 2) {
        config._serverRetryCount++;
        const delay = Math.pow(2, config._serverRetryCount) * 1000; // 2s, 4s
        console.warn(
          `⚠️ Server error (${err.response.status}) - retrying in ${delay / 1000}s (attempt ${config._serverRetryCount}/2)`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }

      toast.error("Server Error", {
        description: "The server is experiencing issues. Please try again later.",
        duration: 5000,
      });
      return Promise.reject(err);
    }

    return Promise.reject(err);
  }
);

// Enhanced API endpoints
export const enhancedApi = {
  // Branch Transfer Management
  branchTransfers: {
    getAll: (params?: any) => api.get("/branch-transfers", { params }),
    getById: (id: string) => api.get(`/branch-transfers/${id}`),
    create: (data: any) => api.post("/branch-transfers", data),
    execute: (id: string) => api.post(`/branch-transfers/${id}/execute`),
    cancel: (id: string) => api.post(`/branch-transfers/${id}/cancel`),
  },

  // User Activity Tracking
  userActivity: {
    getLoginHistory: (params?: any) =>
      api.get("/user-activity/login-history", { params }),
    getUserActivitySummary: (userId: string, period?: string) =>
      api.get(`/user-activity/user/${userId}/summary`, { params: { period } }),
    getUnionActivitySummary: (unionId: string, period?: string) =>
      api.get(`/user-activity/union/${unionId}/summary`, {
        params: { period },
      }),
    getSystemActivitySummary: (period?: string) =>
      api.get("/user-activity/system/summary", { params: { period } }),
    updateActivity: () => api.post("/user-activity/update"),
  },

  // Notes Management
  notes: {
    getAll: (params?: any) => api.get("/notes", { params }),
    getById: (id: string) => api.get(`/notes/${id}`),
    getUserNotes: (userId: string) => api.get(`/notes/user/${userId}`),
    getCategories: () => api.get("/notes/categories"),
    getByCategory: (category: string, params?: any) =>
      api.get(`/notes/category/${category}`, { params }),
    create: (data: any) => api.post("/notes", data),
    update: (id: string, data: any) => api.put(`/notes/${id}`, data),
    delete: (id: string) => api.delete(`/notes/${id}`),
  },

  // Branch Analytics
  analytics: {
    getBranchAnalytics: (params?: any) =>
      api.get("/analytics/branch", { params }),
    generateBranchAnalytics: (branchId: string, periodType?: string) =>
      api.post(`/analytics/branch/${branchId}/generate`, { periodType }),
    getPerformanceComparison: (branchIds: string[], periodType?: string) =>
      api.post("/analytics/comparison", { branchIds, periodType }),
    getSystemAnalytics: (periodType?: string) =>
      api.get("/analytics/system", { params: { periodType } }),
  },

  // Enhanced User Management
  users: {
    getAll: (params?: any) => api.get("/users", { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post("/users", data),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
    bulkOperation: (data: any) => api.post("/users/bulk-operation", data),
    export: (params?: any) => api.get("/users/export", { params }),
    import: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post("/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    resetPassword: (id: string, newPassword: string) =>
      api.post(`/users/${id}/reset-password`, { newPassword }),
  },
};

// Enhanced auth helpers with better error handling
export const auth = {
  register: (dto: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post("/auth/register", dto),
  login: (dto: any) => api.post("/auth/login", dto),

  // Enhanced profile endpoint - updated for new backend
  profile: () => api.get("/auth/me"),

  // Profile update with file support
  updateProfile: (userId: string, data: any, profileImage?: File) => {
    if (profileImage) {
      const formData = new FormData();

      // Append user data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append profile image
      formData.append("profileImage", profileImage);

      return api.put(`/users/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      return api.put(`/users/${userId}`, data);
    }
  },

  logout: () => api.post("/auth/logout"),
  forgotPassword: (dto: { email: string }) =>
    api.post("/auth/forgot-password", dto),
  resetPassword: (dto: { email: string; token: string; newPassword: string }) =>
    api.post("/auth/reset-password", dto),
  changePassword: (dto: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", dto),

  // Session management
  getActiveSessions: () => api.get("/auth/sessions"),
  revokeSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
  revokeOtherSessions: () => api.post("/auth/sessions/revoke-others"),

  // Admin impersonation
  impersonateUser: (userId: string) => api.post(`/auth/impersonate/${userId}`),
};

// Branches API - matches backend endpoints
export const branchesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    return api.get(`/branches?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/branches/${id}`),

  create: (data: CreateBranchDto) => api.post("/branches", data),

  update: (id: string, data: UpdateBranchDto) =>
    api.put(`/branches/${id}`, data),

  toggleStatus: (id: string) => api.patch(`/branches/${id}/toggle-status`),

  remove: (id: string) => api.delete(`/branches/${id}`),

  // Get branch statistics
  getStats: (id: string) => api.get(`/branches/${id}/stats`),
};

export const usersApi = {
  /*  get all users  */
  getAll: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    supervisorId?: string;
    isActive?: boolean;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.role) searchParams.append("role", params.role);
    if (params?.supervisorId)
      searchParams.append("supervisorId", params.supervisorId);
    if (params?.isActive !== undefined)
      searchParams.append("isActive", String(params.isActive));
    if (params?.search) searchParams.append("search", params.search);
    return api.get(`/users?${searchParams.toString()}`);
  },

  /*  single user  */
  getById: (id: string) => api.get(`/users/${id}`),

  /*  create user  */
  create: (data: CreateUserDto) => api.post("/users", data),

  /*  update user  */
  update: (id: string, data: UpdateUserDto) => api.put(`/users/${id}`, data),

  /*  delete user  */
  remove: (id: string) => api.delete(`/users/${id}`),

  /*  reset user password  */
  resetPassword: (id: string, newPassword: string) =>
    api.put(`/users/${id}/reset-password`, { newPassword }),

  /*  enable/disable user  */
  disableUser: (id: string) => api.put(`/users/${id}`, { isActive: false }),
  enableUser: (id: string) => api.put(`/users/${id}`, { isActive: true }),

  /*  get credit officers  */
  getCreditOfficers: () => api.get("/users?role=CREDIT_OFFICER"),

  /*  get supervisors (formerly branch managers)  */
  getBranchManagers: () => api.get("/users?role=SUPERVISOR"),

  /*  get credit officer by id  */
  getCreditOfficerById: (id: string) => api.get(`/users/${id}`),

  /*  bulk operations  */
  bulkOperation: (data: { operation: string; userIds: string[]; data?: any }) =>
    api.post("/users/bulk-operation", data),
};

// Customers API
export const customersApi = {
  // Basic CRUD operations with proper pagination support
  getAll: (params?: {
    page?: number;
    limit?: number;
    branchId?: string;
    currentOfficerId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.branchId) searchParams.append("branchId", params.branchId);
    if (params?.currentOfficerId)
      searchParams.append("currentOfficerId", params.currentOfficerId);
    if (params?.search) searchParams.append("search", params.search);

    return api.get(`/customers?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/customers/${id}`),

  // Get customer loans
  getLoans: (id: string) => api.get(`/customers/${id}/loans`),

  // Basic create
  create: (data: CreateCustomerDto) => api.post("/customers", data),

  // Create with files
  createWithFiles: (
    data: CreateCustomerDto,
    files?: { profile?: File; documents?: File[] }
  ) => {
    const formData = new FormData();

    // Append customer data fields directly (not wrapped in "data")
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (value !== undefined && value !== null) {
        if (key === "documents" && Array.isArray(value)) {
          // Don't append documents metadata here - we'll handle it with the actual files
          // Skip this field as we'll append the actual document files separately
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Append profile picture if provided
    if (files?.profile) {
      formData.append("profile", files.profile);
    }

    // Append documents if provided
    if (files?.documents && files.documents.length > 0) {
      files.documents.forEach((file, index) => {
        formData.append(`documents`, file);
      });
    }

    return api.post("/customers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Basic update
  update: (id: string, data: UpdateCustomerDto) =>
    api.put(`/customers/${id}`, data),

  // Delete customer
  remove: (id: string) => api.delete(`/customers/${id}`),

  // Reassign customer
  reassign: (
    id: string,
    data: { newBranchId: string; newOfficerId?: string; reason: string }
  ) => api.post(`/customers/${id}/reassign`, data),

  // Document management
  addDocument: (customerId: string, documentData: any, file?: File) => {
    const formData = new FormData();

    // Add document type ID (not name)
    if (documentData.type) {
      formData.append("documentTypeId", documentData.type);
    }

    // Add optional metadata
    if (documentData.notes) {
      formData.append("issuingAuthority", documentData.notes);
    }

    if (file) {
      formData.append("file", file);
    }

    return api.post(`/documents/customer/${customerId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  removeDocument: (customerId: string, documentId: string) =>
    api.delete(`/customers/${customerId}/documents/${documentId}`),
};

// Loans API
export const loansApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    unionId?: string;
    unionMemberId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.unionId) searchParams.append("unionId", params.unionId);
    if (params?.unionMemberId)
      searchParams.append("unionMemberId", params.unionMemberId);
    if (params?.search) searchParams.append("search", params.search);
    return api.get(`/loans?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/loans/${id}`),

  // Get loan schedule
  getSchedule: (id: string) => api.get(`/loans/${id}/schedule`),

  // Get loan summary
  getSummary: (id: string) => api.get(`/loans/${id}/summary`),
  // Create loan
  create: (data: {
    unionMemberId: string;
    loanTypeId?: string;
    principalAmount: number;
    termCount: number;
    termUnit: "DAY" | "WEEK" | "MONTH";
    startDate: string;
    processingFeeAmount: number;
    penaltyFeePerDayAmount: number;
    notes?: string;
    assignedOfficerId?: string;
  }) => api.post("/loans", data),

  // Update loan
  update: (id: string, data: any) => api.put(`/loans/${id}`, data),

  // Update loan status
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.put(`/loans/${id}/status`, data),

  // Disburse loan
  disburse: (id: string, data?: { disbursedAt?: string }) =>
    api.post(`/loans/${id}/disburse`, data || {}),

  // Note: Loan assignment is now handled through union assignment, not individual loan assignment
  // This endpoint may be deprecated in favor of union-based assignment
  assign: (id: string, data: { assignedOfficerId: string; reason?: string }) =>
    api.post(`/loans/${id}/assign`, data),

  // Delete loan
  remove: (id: string) => api.delete(`/loans/${id}`),

  // Get loan statistics
  getStats: () => api.get("/loans/stats"),

  // Generate missing repayment schedules (Admin only)
  generateMissingSchedules: () => api.post("/loans/generate-missing-schedules"),
};

// Repayments API
export const repaymentsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    loanId?: string;
    receivedByUserId?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.loanId) searchParams.append("loanId", params.loanId);
    if (params?.receivedByUserId)
      searchParams.append("receivedByUserId", params.receivedByUserId);
    if (params?.method) searchParams.append("method", params.method);
    if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
    return api.get(`/repayments?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/repayments/${id}`),

  // Record new repayment
  create: (data: {
    loanId: string;
    amount: number;
    method: "CASH" | "TRANSFER" | "POS" | "MOBILE" | "USSD" | "OTHER";
    reference?: string;
    notes?: string;
  }) => api.post("/repayments", data),

  // Update repayment
  update: (id: string, data: any) => api.put(`/repayments/${id}`, data),

  // Delete repayment
  remove: (id: string) => api.delete(`/repayments/${id}`),

  // Get repayment schedules
  getAllRepaymentSchedules: (params?: {
    page?: number;
    limit?: number;
    loanId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    unionId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.loanId) searchParams.append("loanId", params.loanId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
    if (params?.unionId) searchParams.append("unionId", params.unionId);
    return api.get(`/repayments/schedules?${searchParams.toString()}`);
  },

  // Get repayment schedule for specific loan
  getRepaymentSchedule: (loanId: string) =>
    api.get(`/repayments/schedules/${loanId}`),

  // Get repayment summary
  getSummary: (params?: {
    loanId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.loanId) searchParams.append("loanId", params.loanId);
    if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
    return api.get(`/repayments/summary?${searchParams.toString()}`);
  },
};

// Document types API
export const documentTypesApi = {
  getAll: () => api.get("/documents/types"),

  getById: (id: string) => api.get(`/documents/types/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post("/documents/types", data),

  update: (
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      isActive?: boolean;
    }
  ) => api.put(`/documents/types/${id}`, data),

  remove: (id: string) => api.delete(`/documents/types/${id}`),
};

// Loan types API
export const loanTypesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.isActive !== undefined)
      searchParams.append("isActive", params.isActive.toString());
    if (params?.search) searchParams.append("search", params.search);
    return api.get(`/loan-types?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/loan-types/${id}`),

  create: (data: {
    name: string;
    description?: string;
    minAmount: number;
    maxAmount: number;
    termUnit: "DAY" | "WEEK" | "MONTH";
    minTerm: number;
    maxTerm: number;
  }) => api.post("/loan-types", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      minAmount?: number;
      maxAmount?: number;
      termUnit?: "DAY" | "WEEK" | "MONTH";
      minTerm?: number;
      maxTerm?: number;
    }
  ) => api.put(`/loan-types/${id}`, data),

  toggleStatus: (id: string) => api.put(`/loan-types/${id}/toggle-status`),

  remove: (id: string) => api.delete(`/loan-types/${id}`),
};

// Documents API
export const documentsApi = {
  // Union member documents (renamed from customer)
  uploadUnionMemberDocument: (unionMemberId: string, formData: FormData) =>
    api.post(`/documents/union-member/${unionMemberId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getUnionMemberDocuments: (unionMemberId: string) =>
    api.get(`/documents/union-member/${unionMemberId}`),

  // Loan documents
  uploadLoanDocument: (loanId: string, formData: FormData) =>
    api.post(`/documents/loan/${loanId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getLoanDocuments: (loanId: string) => api.get(`/documents/loan/${loanId}`),

  // Verify document
  verifyDocument: (
    id: string,
    data: {
      type: "unionMember" | "loan";
      verified: boolean;
      verificationNotes?: string;
    }
  ) => api.put(`/documents/${id}/verify`, data),

  // Delete document
  removeDocument: (id: string, type: "unionMember" | "loan") =>
    api.delete(`/documents/${id}?type=${type}`),
};

// Audit logs API
export const auditLogsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    entityName?: string;
    entityId?: string;
    actorUserId?: string;
    action?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.entityName)
      searchParams.append("entityName", params.entityName);
    if (params?.entityId) searchParams.append("entityId", params.entityId);
    if (params?.actorUserId)
      searchParams.append("actorUserId", params.actorUserId);
    if (params?.action) searchParams.append("action", params.action);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.append("dateTo", params.dateTo);
    return api.get(`/audit-logs?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/audit-logs/${id}`),

  getEntityAuditTrail: (entityName: string, entityId: string) =>
    api.get(`/audit-logs/entity/${entityName}/${entityId}`),
};

// Enhanced error handling utility
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    // Always return the exact message from the backend if available
    if (message) {
      return message;
    }

    // Fallback to status-based messages only if no specific message is available
    switch (status) {
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        clearAccessToken();
        window.location.href = "/login";
        return "Your session has expired. Please login again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "A conflict occurred. The resource may already exist.";
      case 422:
        return "Please check your input and try again.";
      case 429:
        return "Too many requests. Please wait a moment before trying again.";
      case 500:
        return "A server error occurred. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  } else if (error.request) {
    // Request was made but no response received
    return `Network Error: ${
      error.message || "Unable to connect to the server"
    }`;
  } else {
    // Something else happened
    return error.message || "An unexpected error occurred";
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    // Basic JWT token validation (check if it's not expired)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Utility function to get current user role from token
export const getCurrentUserRole = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch (error) {
    return null;
  }
};

// Utility function to get current user ID from token
export const getCurrentUserId = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch (error) {
    return null;
  }
};

// Helper function to transform form data to API format
export const transformFormDataToCreateCustomerDto = (formData: any): any => {
  // Transform to union member format (unionId instead of branchId)
  const result: any = {
    firstName: formData.firstName || "",
    lastName: formData.lastName || "",
    phone: formData.phoneNumber || formData.phone,
    email: formData.email || undefined, // Send undefined instead of empty string
    address: formData.address || undefined,
    unionId:
      formData.unionId ||
      formData.union ||
      formData.branchId ||
      formData.branch,
    currentOfficerId: formData.currentOfficerId || formData.creditOfficer,
  };

  // Add optional fields only if they exist
  if (formData.dateOfBirth) result.dateOfBirth = formData.dateOfBirth;
  if (formData.gender) result.gender = formData.gender;
  if (formData.maritalStatus) result.maritalStatus = formData.maritalStatus;
  if (formData.profession) result.profession = formData.profession;
  if (formData.company) result.company = formData.company;
  if (formData.city) result.city = formData.city;
  if (formData.state) result.state = formData.state;
  if (formData.country) result.country = formData.country;
  if (formData.zipCode) result.zipCode = formData.zipCode;
  if (formData.note) result.note = formData.note;

  return result;
};

// Helper function to transform form data to update API format
export const transformFormDataToUpdateCustomerDto = (
  formData: any
): UpdateCustomerDto => {
  // Only send fields that the backend validation schema expects for updates
  const updateData: UpdateCustomerDto = {};

  if (formData.firstName && formData.firstName.trim())
    updateData.firstName = formData.firstName.trim();
  if (formData.lastName && formData.lastName.trim())
    updateData.lastName = formData.lastName.trim();
  if (
    (formData.phoneNumber && formData.phoneNumber.trim()) ||
    (formData.phone && formData.phone.trim())
  )
    updateData.phone =
      (formData.phoneNumber && formData.phoneNumber.trim()) ||
      (formData.phone && formData.phone.trim());
  if (formData.email && formData.email.trim())
    updateData.email = formData.email.trim();
  if (formData.address && formData.address.trim())
    updateData.address = formData.address.trim();
  if (formData.dateOfBirth) {
    // Convert Date object to ISO string for backend
    updateData.dateOfBirth =
      formData.dateOfBirth instanceof Date
        ? formData.dateOfBirth
        : new Date(formData.dateOfBirth);
  }
  if (formData.gender && formData.gender.trim())
    updateData.gender = formData.gender.trim();
  if (formData.maritalStatus && formData.maritalStatus.trim())
    updateData.maritalStatus = formData.maritalStatus.trim();
  if (formData.profession && formData.profession.trim())
    updateData.profession = formData.profession.trim();
  if (formData.company && formData.company.trim())
    updateData.company = formData.company.trim();
  if (formData.city && formData.city.trim())
    updateData.city = formData.city.trim();
  if (formData.state && formData.state.trim())
    updateData.state = formData.state.trim();
  if (formData.country && formData.country.trim())
    updateData.country = formData.country.trim();
  if (formData.zipCode && formData.zipCode.trim())
    updateData.zipCode = formData.zipCode.trim();
  if (formData.note && formData.note.trim())
    updateData.note = formData.note.trim();
  if (formData.branchId || formData.branch)
    updateData.branchId = formData.branchId || formData.branch;
  if (formData.currentOfficerId || formData.creditOfficer)
    updateData.currentOfficerId =
      formData.currentOfficerId || formData.creditOfficer;

  console.log("Final update data being sent to backend:", updateData);
  return updateData;
};

// Helper function to transform API response to form data
export const transformCustomerToFormData = (customer: any) => {
  console.log("Transforming customer data:", customer);

  // Parse date of birth if it exists
  let dateOfBirth: Date | undefined = undefined;
  if (customer.dateOfBirth) {
    try {
      dateOfBirth = new Date(customer.dateOfBirth);
      // Check if the date is valid
      if (isNaN(dateOfBirth.getTime())) {
        dateOfBirth = undefined;
      }
    } catch (error) {
      console.warn("Invalid date of birth:", customer.dateOfBirth);
      dateOfBirth = undefined;
    }
  }

  const transformedData = {
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email || "",
    phoneNumber: customer.phone || "",
    dateOfBirth: dateOfBirth,
    gender: customer.gender || "",
    maritalStatus: customer.maritalStatus || "",
    branch: customer.branchId || "",
    creditOfficer: customer.currentOfficerId || "",
    profession: customer.profession || "",
    company: customer.company || "",
    city: customer.city || "",
    state: customer.state || "",
    country: customer.country || "",
    zipCode: customer.zipCode || "",
    address: customer.address || "",
    note: customer.note || "",
  };

  console.log("Transformed data:", transformedData);
  return transformedData;
};

// Transform backend user to frontend format
export const transformBackendUserToFrontend = (backendUser: any) => {
  return {
    id: backendUser.id,
    name: backendUser.email, // Use email as name since backend doesn't have firstName/lastName
    email: backendUser.email,
    phone: "", // Not available in new backend
    role: backendUser.role,
    branchId: backendUser.branchId,
    status: backendUser.isActive ? "active" : "inactive",
    createdAt: backendUser.createdAt,
  };
};

// Database error handler utility
export const handleDatabaseError = (error: any, customMessage?: string) => {
  if (error.response?.data?.message) {
    const message = error.response.data.message;

    // Check for database connection errors
    if (
      message.includes("Can't reach database server") ||
      message.includes("database server is running") ||
      message.includes("Connection terminated") ||
      message.includes("Connection timeout") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ENOTFOUND")
    ) {
      toast.error("Database Connection Error", {
        description: customMessage || `Backend Error: ${message}`, // Show exact error
        duration: 5000,
      });
      return true; // Indicates error was handled
    }

    // Check for Prisma database errors
    if (
      message.includes("Invalid prisma") ||
      message.includes("PrismaClientKnownRequestError") ||
      message.includes("PrismaClientUnknownRequestError") ||
      message.includes("PrismaClientRustPanicError")
    ) {
      toast.error("Database Error", {
        description: customMessage || `Database Error: ${message}`, // Show exact error
        duration: 5000,
      });
      return true; // Indicates error was handled
    }

    // For any other backend error with a message, show it exactly
    toast.error("Error", {
      description: customMessage || message, // Show exact backend error message
      duration: 5000,
    });
    return true;
  }

  // Handle network errors
  if (
    error.code === "NETWORK_ERROR" ||
    error.message.includes("Network Error")
  ) {
    toast.error("Network Error", {
      description: customMessage || `Network Error: ${error.message}`, // Show exact network error
      duration: 5000,
    });
    return true; // Indicates error was handled
  }

  // Handle other errors with exact messages
  if (error.message) {
    toast.error("Error", {
      description: customMessage || error.message, // Show exact error message
      duration: 5000,
    });
    return true;
  }

  return false; // Error was not handled
};

// Enhanced error handling for file uploads
export const handleFileUploadError = (error: any) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 400:
        if (message.includes("file size")) {
          return "File size is too large. Maximum size is 10MB.";
        }
        if (message.includes("file type")) {
          return "Invalid file type. Please upload images (JPG, PNG, GIF, WebP) or documents (PDF, DOC, DOCX).";
        }
        return `Bad Request: ${message}`;
      case 413:
        return "File size is too large. Please choose a smaller file.";
      case 422:
        return "File validation failed. Please check your file and try again.";
      default:
        return handleApiError(error);
    }
  }
  return "An unexpected error occurred during file upload.";
};

// Enhanced customer data validation for new backend
export const validateCustomerData = (data: any) => {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters long");
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters long");
  }

  if (!data.phone || data.phone.trim().length === 0) {
    errors.push("Phone number is required");
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.branchId) {
    errors.push("Branch selection is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// File validation helpers
export const validateImageFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (file.size > maxSize) {
    throw new Error("Image file size must be less than 10MB");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed");
  }

  return true;
};

export const validateDocumentFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (file.size > maxSize) {
    throw new Error("Document file size must be less than 10MB");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PDF, DOC, DOCX, and image files are allowed");
  }

  return true;
};

// Settings API
export const settingsApi = {
  // Company Settings
  getCompanySettings: () => api.get("/settings/company"),
  updateCompanySettings: (data: any) => api.put("/settings/company", data),

  // File Upload
  uploadFile: (file: File, type: "logo" | "document" = "logo") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return api.post("/settings/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Email Settings
  getEmailSettings: () => api.get("/settings/email"),
  updateEmailSettings: (data: any) => api.put("/settings/email", data),
  testEmailSettings: (data: any) => api.post("/settings/email/test", data),

  // General Settings
  getGeneralSettings: () => api.get("/settings/general"),
  updateGeneralSettings: (data: any) => api.put("/settings/general", data),

  // Password Settings
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/settings/password", data),

  // System Settings
  getSystemSettings: () => api.get("/settings/system"),
  updateSystemSettings: (data: any) => api.put("/settings/system", data),
};

// Utility to create file preview URLs
export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Response wrapper for new backend API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Unions API
export const unionsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    creditOfficerId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.creditOfficerId)
      searchParams.append("creditOfficerId", params.creditOfficerId);
    return api.get(`/unions?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/unions/${id}`),

  create: (data: any) => api.post("/unions", data),

  update: (id: string, data: any) => api.put(`/unions/${id}`, data),

  remove: (id: string) => api.delete(`/unions/${id}`),

  // Get union statistics
  getStats: (id: string) => api.get(`/unions/${id}/stats`),

  // Assign union to credit officer
  assign: (
    unionId: string,
    data: { creditOfficerId: string; reason?: string }
  ) => api.post(`/unions/${unionId}/assign`, data),

  // Export unions
  export: (params?: { search?: string; creditOfficerId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.creditOfficerId)
      searchParams.append("creditOfficerId", params.creditOfficerId);
    return api.get(`/unions/export/csv?${searchParams.toString()}`, {
      responseType: "blob",
    });
  },
};

// Union Members API
export const unionMembersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    unionId?: string;
    currentOfficerId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.unionId) searchParams.append("unionId", params.unionId);
    if (params?.currentOfficerId)
      searchParams.append("currentOfficerId", params.currentOfficerId);
    if (params?.search) searchParams.append("search", params.search);

    return api.get(`/union-members?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get(`/union-members/${id}`),

  create: (data: any) => api.post("/union-members", data),

  update: (id: string, data: any) => api.put(`/union-members/${id}`, data),

  remove: (id: string) => api.delete(`/union-members/${id}`),

  // Check email uniqueness
  checkEmailUnique: (email: string) =>
    api.get(`/union-members/check-email?email=${encodeURIComponent(email)}`),

  // Reassign union member to another union
  reassign: (id: string, data: { newUnionId: string; reason?: string }) =>
    api.post(`/union-members/${id}/reassign`, data),

  // Toggle member verification/approval status
  toggleVerification: (id: string) =>
    api.patch(`/union-members/${id}/toggle-verification`),

  // Export union members
  export: (params?: {
    unionId?: string;
    currentOfficerId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.unionId) searchParams.append("unionId", params.unionId);
    if (params?.currentOfficerId)
      searchParams.append("currentOfficerId", params.currentOfficerId);
    if (params?.search) searchParams.append("search", params.search);
    return api.get(`/union-members/export/csv?${searchParams.toString()}`, {
      responseType: "blob",
    });
  },
};

// Supervisor Reports API
export const supervisorReportsApi = {
  // Get real-time dashboard data
  getDashboard: (params?: {
    supervisorId?: string;
    periodStart?: string;
    periodEnd?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.supervisorId)
      searchParams.append("supervisorId", params.supervisorId);
    if (params?.periodStart)
      searchParams.append("periodStart", params.periodStart);
    if (params?.periodEnd) searchParams.append("periodEnd", params.periodEnd);
    return api.get(`/supervisor-reports/dashboard?${searchParams.toString()}`);
  },

  // Generate and save a report session
  generateReport: (data: {
    supervisorId?: string;
    reportType: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM";
    periodStart: string;
    periodEnd: string;
    title?: string;
  }) => api.post("/supervisor-reports/generate", data),

  // Get all report sessions
  getReportSessions: (params?: {
    supervisorId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.supervisorId)
      searchParams.append("supervisorId", params.supervisorId);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    return api.get(`/supervisor-reports/sessions?${searchParams.toString()}`);
  },

  // Get a single report session by ID
  getReportSessionById: (id: string, supervisorId?: string) => {
    const searchParams = new URLSearchParams();
    if (supervisorId) searchParams.append("supervisorId", supervisorId);
    return api.get(
      `/supervisor-reports/sessions/${id}?${searchParams.toString()}`
    );
  },

  // Delete a report session
  deleteReportSession: (id: string) =>
    api.delete(`/supervisor-reports/sessions/${id}`),

  // Get credit officers under a supervisor
  getCreditOfficers: (supervisorId?: string) => {
    const searchParams = new URLSearchParams();
    if (supervisorId) searchParams.append("supervisorId", supervisorId);
    return api.get(`/supervisor-reports/officers?${searchParams.toString()}`);
  },
};
