export interface LoanType {
  id: string;
  name: string;
  category: "small_business" | "market_women" | "personal" | "emergency";
  amountRange: {
    min: number;
    max: number;
  };
  termPeriod: "daily" | "weekly" | "monthly" | "yearly";
  termLimit: {
    min: number;
    max: number;
  };
  processingFeeRate: number; // percentage
  penaltyFeeRate: number; // percentage per day overdue
  description: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType?: string;
}

export interface CreditOfficer {
  id: string;
  name: string;
  employeeId: string;
  branch: string;
  phone: string;
  email: string;
}

export interface EnhancedLoan {
  id: string;
  loanNumber: string;
  customer: Customer;
  loanType: LoanType;
  branch: Branch;
  createdBy: CreditOfficer;
  loanIssuedDate: string;
  loanDeadline: string;
  repaymentDate: string;
  principalAmount: number;
  processingFee: number;
  amountLeftToPay: number;
  totalAmount: number;
  penaltyFee: number;
  dueToday: number;
  status:
    | "processing"
    | "approved"
    | "under_repayment"
    | "overdue"
    | "fully_paid";
  purposeOfLoan: string;
  notes?: string;
  fullyPaid: boolean;
  createdAt: string;
  updatedAt: string;
}
