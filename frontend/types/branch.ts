// Re-export from comprehensive types
export * from "./index";

// Additional branch-specific types
export interface BranchStats {
  totalUsers: number;
  totalCustomers: number;
  totalLoans: number;
  activeLoans: number;
  pendingLoans: number;
  completedLoans: number;
}
