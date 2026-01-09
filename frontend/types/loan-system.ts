export interface CreditOfficer {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  employeeId: string;
  totalLoansManaged: number;
  activeLoans: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditOfficerId: string;
}

export interface RepaymentSchedule {
  id: string;
  loanNo: string;
  customerId: string;
  customerName: string;
  loanIssuedDate: string;
  repaymentDate: string;
  loanDeadline: string;
  principalAmount: number;
  processingFee: number;
  penalty: number;
  totalAmount: number;
  amountLeftToPay: number;
  dueToday: number;
  status:
    | "processing"
    | "approved"
    | "under repayment"
    | "overdue"
    | "fully paid";
  fullyPaid: boolean;
  creditOfficerId: string;
  loanType: string;
}

export interface LoanDetails extends RepaymentSchedule {
  from: {
    company: string;
    phone: string;
    email: string;
  };
  to: {
    name: string;
    phone: string;
    address: string;
  };
  paymentHistory: RepaymentSchedule[];
  creditOfficer: CreditOfficer;
}
