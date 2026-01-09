// Re-export from comprehensive types
export * from "./index";

// Additional customer-specific types
export interface CustomerDocument {
  id: string;
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
}

export interface CreateDocumentDto {
  type: string;
  filename: string;
  fileUrl?: string;
  notes?: string;
}
