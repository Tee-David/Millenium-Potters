export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTypeDto {
  name: string;
  description?: string;
}

export interface UpdateDocumentTypeDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}
