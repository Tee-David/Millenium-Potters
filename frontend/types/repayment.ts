export interface Repayment {
  id: string;
  loanId: string;
  receivedByUserId: string;
  amount: string; // API returns as string
  currencyCode: string;
  paidAt: string;
  method: "CASH" | "TRANSFER" | "POS" | "MOBILE" | "USSD" | "OTHER";
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  loan?: {
    id: string;
    loanNumber: string;
    customer?: {
      id: string;
      code: string;
      firstName: string;
      lastName: string;
    };
  };
  receivedBy?: {
    id: string;
    email: string;
    role: string;
  };
  allocations?: Array<{
    id: string;
    repaymentId: string;
    scheduleItemId: string;
    amount: string;
    createdAt: string;
    scheduleItem: {
      id: string;
      sequence: number;
      dueDate: string;
    };
  }>;
}

// Legacy interface for backward compatibility
export interface LegacyRepayment {
  id: number | string | any;
  loanNumber: string;
  loanIssuedDate: string;
  loanDeadline: string;
  repaymentDate: string;
  principalAmount: number;
  processingFee: number;
  amountLeftToPay: number;
  totalAmount: number;
  penaltyFee?: number | any;
  dueToday: number;
  status?:
    | "processing"
    | "approved"
    | "under repayment"
    | "overdue"
    | "fully paid";
  loanType: "short-term" | "medium-term" | "long-term";
  amountPaidAlready: number;
  creditOfficerId?: string | any;
  branch?: string;
}

export interface RepaymentFormData {
  loanNumber: string;
  loanIssuedDate: string;
  repaymentDate: string;
  principalAmount: string;
  processingFee: string;
  loanType: "short-term" | "medium-term" | "long-term";
}
