export interface LoanType {
  id: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  termUnit: "DAY" | "WEEK" | "MONTH";
  minTerm: number;
  maxTerm: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
