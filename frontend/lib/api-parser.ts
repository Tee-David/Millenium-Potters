// Standardized API response parser utility
export interface StandardApiResponse<T = any> {
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

// Generic data parser that handles different API response structures
export function parseApiResponse<T>(response: any, dataPath?: string): T[] {
  try {
    // Handle different response structures
    let data = response?.data;

    // If dataPath is provided, navigate to that path
    if (dataPath) {
      const paths = dataPath.split(".");
      for (const path of paths) {
        data = data?.[path];
      }
    }

    // Handle different data structures
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object") {
      // Check for common array properties
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data.users)) return data.users;
      if (Array.isArray(data.customers)) return data.customers;
      if (Array.isArray(data.loans)) return data.loans;
      if (Array.isArray(data.branches)) return data.branches;
      if (Array.isArray(data.repayments)) return data.repayments;
      if (Array.isArray(data.loanTypes)) return data.loanTypes;
      if (Array.isArray(data.documentTypes)) return data.documentTypes;
      if (Array.isArray(data.auditLogs)) return data.auditLogs;

      // If it's a single object, wrap it in an array
      return [data];
    }

    return [];
  } catch (error) {
    console.error("Error parsing API response:", error);
    return [];
  }
}

// Specific parsers for different data types
export const parseUsers = (response: any) =>
  parseApiResponse(response, "data.users");
export const parseCustomers = (response: any) =>
  parseApiResponse(response, "data");
export const parseLoans = (response: any) => parseApiResponse(response, "data");
export const parseBranches = (response: any) =>
  parseApiResponse(response, "data");
export const parseRepayments = (response: any) =>
  parseApiResponse(response, "data");
export const parseLoanTypes = (response: any) =>
  parseApiResponse(response, "data");
export const parseDocumentTypes = (response: any) =>
  parseApiResponse(response, "data");
export const parseAuditLogs = (response: any) =>
  parseApiResponse(response, "data");

// Safe data access utility
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split(".");
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Data transformation utilities
export function transformUser(user: any) {
  try {
    // Validate input
    if (!user || typeof user !== "object") {
      console.error("transformUser: Invalid user data:", user);
      throw new Error("Invalid user data provided");
    }

    // Construct name from firstName/lastName or fallback to email
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : "";
    const displayName = fullName || user.name || user.email || "Unknown User";

    return {
      id: user.id || "unknown",
      email: user.email || "",
      role: user.role || "CREDIT_OFFICER",
      branchId: user.branchId || null,
      isActive: user.isActive !== undefined ? user.isActive : true,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
      // Additional fields for frontend
      name: displayName,
      firstName: firstName,
      lastName: lastName,
      phone: user.phone || "",
      address: user.address || "",
      status: (user.isActive ? "active" : "inactive") as "active" | "inactive",
    };
  } catch (error) {
    console.error("transformUser: Error transforming user:", user, error);
    // Return a safe fallback user object
    return {
      id: "unknown",
      email: "unknown@example.com",
      role: "CREDIT_OFFICER",
      branchId: null,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: "Unknown User",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      status: "inactive" as "active" | "inactive",
    };
  }
}

export function transformCustomer(customer: any) {
  return {
    id: customer.id,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    branchId: customer.branchId || null,
    currentOfficerId: customer.currentOfficerId || null,
    createdAt: customer.createdAt || new Date().toISOString(),
    updatedAt: customer.updatedAt || new Date().toISOString(),
    // Additional fields for frontend
    name:
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      "Unknown Customer",
    branchName: customer.branch?.name || "Unknown Branch",
    creditOfficerName: customer.currentOfficer?.email || "Unassigned",
  };
}

export function transformLoan(loan: any) {
  return {
    id: loan.id,
    loanNumber: loan.loanNumber || `LOAN-${loan.id.slice(-6)}`,
    principalAmount: loan.principalAmount || 0,
    status: loan.status || "DRAFT",
    createdAt: loan.createdAt || new Date().toISOString(),
    dueDate: loan.dueDate,
    customer: loan.customer
      ? {
          id: loan.customer.id,
          firstName: loan.customer.firstName || "",
          lastName: loan.customer.lastName || "",
        }
      : undefined,
    loanType: loan.loanType
      ? {
          id: loan.loanType.id,
          name: loan.loanType.name || "Unknown Type",
        }
      : undefined,
    createdByUser: loan.createdByUser
      ? {
          id: loan.createdByUser.id,
          email: loan.createdByUser.email || "Unknown User",
        }
      : undefined,
    branch: loan.branch
      ? {
          id: loan.branch.id,
          name: loan.branch.name || "Unknown Branch",
        }
      : undefined,
  };
}

export function transformBranch(branch: any) {
  return {
    id: branch.id,
    name: branch.name || "Unknown Branch",
    code: branch.code || "UNKNOWN",
    managerId: branch.managerId || null,
    isActive: branch.isActive !== undefined ? branch.isActive : true,
    createdAt: branch.createdAt || new Date().toISOString(),
    updatedAt: branch.updatedAt || new Date().toISOString(),
    // Additional fields for frontend
    manager: branch.manager
      ? {
          id: branch.manager.id,
          email: branch.manager.email || "Unknown Manager",
          role: branch.manager.role || "BRANCH_MANAGER",
        }
      : undefined,
    _creditOfficersCount: branch._count?.users || 0,
  };
}

// Error handling utility
export function handleApiError(error: any, context: string = "API call") {
  console.error(`${context} failed:`, error);

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "An unexpected error occurred";
}

// Loading state utility
export function createLoadingState() {
  return {
    loading: false,
    error: null as string | null,
    data: null as any,
  };
}

// Pagination utility
export function createPaginationState() {
  return {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
}
