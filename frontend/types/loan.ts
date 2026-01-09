// export interface LoanType {
//   id: string;
//   name: string;
//   category: "small_business" | "market_women" | "salary_earners" | "students";
//   minAmount: number;
//   maxAmount: number;
//   termLimitDays: number;
//   processingFeeRate: number; // percentage
//   penaltyFeeRate: number; // percentage per day
//   description: string;
// }

// export interface CreditOfficer {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   branch: string;
//   employeeId: string;
// }

// export interface Loan {
//   id: string;
//   loanNumber: string;
//   loanIssuedDate: string;
//   loanDeadline: string;
//   repaymentDate: string;
//   createdAt?: string;
//   principalAmount: number;
//   processingFee: number;
//   amountLeftToPay: number;
//   totalAmount: number;
//   penaltyFee: number;
//   dueToday: number;
//   status:
//     | "processing"
//     | "approved"
//     | "under_repayment"
//     | "overdue"
//     | "fully_paid";
//   customer: {
//     id: string;
//     name: string;
//     phone: string;
//     email: string;
//   };
//   loanType: LoanType;
//   createdBy: CreditOfficer;
//   branch: string;
//   purposeOfLoan: string;
//   notes?: string;
//   documents: LoanDocument[];
//   fullyPaid: boolean;
// }

// export interface LoanDocument {
//   id: string;
//   type: string;
//   fileName: string;
//   status: "pending" | "approved" | "rejected";
//   description: string;
//   uploadedAt: string;
// }

// export interface PaymentAction {
//   id: string;
//   loanId: string;
//   amount: number;
//   type: "due_today" | "custom_amount";
//   paymentDate: string;
//   processedBy: CreditOfficer;
// }

export interface LoanDocument {
  id: string;
  loanId: string;
  documentTypeId: string;
  fileUrl: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  verified: boolean;
  verificationNotes?: string;
  uploadedByUserId: string;
  uploadedAt: string;
  deletedAt?: string;
  documentType?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Guarantor {
  id: string;
  name: string;
  documents: LoanDocument[];
}

export interface Loan {
  id: string;
  loanNumber: string;
  unionMemberId: string;
  unionId: string;
  loanTypeId?: string;
  principalAmount: number;
  currencyCode: string;
  termCount: number;
  termUnit: "DAY" | "WEEK" | "MONTH";
  startDate: string;
  endDate?: string;
  processingFeeAmount: number;
  processingFeeCollected: boolean;
  penaltyFeePerDayAmount: number;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "ACTIVE"
    | "COMPLETED"
    | "DEFAULTED"
    | "WRITTEN_OFF"
    | "CANCELED";
  createdByUserId: string;
  assignedOfficerId: string;
  disbursedAt?: string;
  closedAt?: string;
  notes?: string;
  documents: LoanDocument[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Related entities
  unionMember?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  union?: {
    id: string;
    name: string;
    code: string;
  };
  loanType?: {
    id: string;
    name: string;
    description?: string;
  };
  assignedOfficer?: {
    id: string;
    name?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  createdBy?: {
    id: string;
    name?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export interface CreateLoanFormData {
  branch: string;
  loanType: string;
  customer: string;
  creditOfficer: string;
  loanStartDate: string;
  loanDueDate: string;
  amount: string;
  loanTerms: string;
  loanTermPeriod: string;
  loanTermMin: string;
  loanTermMax: string;
  processingFee: string;
  penaltyFee: string;
  purposeOfLoan: string;
  notes: string;
  documents: Array<{
    id: string;
    type: string;
    file: File | null;
    description: string;
  }>;
  guarantors: Array<{
    id: string;
    name: string;
    documents: Array<{
      id: string;
      type: string;
      file: File | null;
      description: string;
    }>;
  }>;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  status?: string;
  unionMemberId?: string;
  creditOfficerId?: string;
  unionId?: string;
  search?: string;
}

export interface LoanStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  overdue: number;
  totalAmount: number;
  outstandingAmount: number;
}

// Helper function to transform frontend form data to API format
export const transformFormDataToApiFormat = (formData: CreateLoanFormData) => {
  return {
    customerId: formData.customer,
    branchId: formData.branch,
    loanTypeId: formData.loanType,
    creditOfficerId: formData.creditOfficer,
    amount: parseFloat(formData.amount),
    processingFee: parseFloat(formData.processingFee),
    penaltyFee: parseFloat(formData.penaltyFee),
    interestRate: 15, // This should come from loan type
    termMonths: parseInt(formData.loanTermMax),
    termPeriod: formData.loanTermPeriod as
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly",
    loanStartDate: formData.loanStartDate,
    loanDueDate: formData.loanDueDate,
    purposeOfLoan: formData.purposeOfLoan,
    notes: formData.notes,
    documents: formData.documents
      .filter((doc) => doc.type && (doc.file || doc.description))
      .map((doc) => ({
        type: doc.type as
          | "identity"
          | "address"
          | "income"
          | "employment"
          | "bank",
        description: doc.description,
      })),
    guarantors: formData.guarantors
      .filter((guarantor) => guarantor.name.trim())
      .map((guarantor) => ({
        name: guarantor.name,
        documents: guarantor.documents
          .filter((doc) => doc.type && (doc.file || doc.description))
          .map((doc) => ({
            type: doc.type as
              | "identity"
              | "address"
              | "income"
              | "employment"
              | "bank",
            description: doc.description,
          })),
      })),
  };
};

// Helper function to validate loan form data
export const validateLoanFormData = (
  formData: CreateLoanFormData
): string[] => {
  const errors: string[] = [];

  if (!formData.branch) errors.push("Branch is required");
  if (!formData.loanType) errors.push("Loan type is required");
  if (!formData.customer) errors.push("Customer is required");
  if (!formData.creditOfficer) errors.push("Credit officer is required");
  if (!formData.amount || parseFloat(formData.amount) <= 0)
    errors.push("Valid loan amount is required");
  if (!formData.processingFee || parseFloat(formData.processingFee) < 0)
    errors.push("Valid processing fee is required");
  if (!formData.penaltyFee || parseFloat(formData.penaltyFee) < 0)
    errors.push("Valid penalty fee is required");
  if (!formData.loanStartDate) errors.push("Loan start date is required");
  if (!formData.loanDueDate) errors.push("Loan due date is required");

  // Validate that at least one guarantor has a name
  if (!formData.guarantors.some((g) => g.name.trim())) {
    errors.push("At least one guarantor is required");
  }

  return errors;
};
