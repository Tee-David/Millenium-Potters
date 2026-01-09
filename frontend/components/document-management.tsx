"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { documentsApi, documentTypesApi } from "@/lib/api";

interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Document {
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

interface DocumentManagementProps {
  entityType: "customer" | "loan";
  entityId: string;
  title?: string;
}

export function DocumentManagement({
  entityType,
  entityId,
  title = "Documents",
}: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Fetch documents and document types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [docsResponse, typesResponse] = await Promise.all([
          entityType === "customer"
            ? documentsApi.getCustomerDocuments(entityId)
            : documentsApi.getLoanDocuments(entityId),
          documentTypesApi.getAll(),
        ]);

        setDocuments(docsResponse.data.data || docsResponse.data);
        setDocumentTypes(typesResponse.data.data || typesResponse.data);
      } catch (error) {
        toast.error("Failed to load documents");
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [entityId, entityType]);

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      toast.error("Please select a file and document type");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentTypeId", selectedDocumentType);
      if (issuingAuthority)
        formData.append("issuingAuthority", issuingAuthority);
      if (issueDate) formData.append("issueDate", issueDate);
      if (expiryDate) formData.append("expiryDate", expiryDate);

      if (entityType === "customer") {
        await documentsApi.uploadCustomerDocument(entityId, formData);
      } else {
        await documentsApi.uploadLoanDocument(entityId, formData);
      }

      toast.success("Document uploaded successfully");

      // Reset form
      setSelectedFile(null);
      setSelectedDocumentType("");
      setIssuingAuthority("");
      setIssueDate("");
      setExpiryDate("");

      // Refresh documents list
      const docsResponse =
        entityType === "customer"
          ? await documentsApi.getCustomerDocuments(entityId)
          : await documentsApi.getLoanDocuments(entityId);
      setDocuments(docsResponse.data.data || docsResponse.data);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Handle document verification
  const handleVerifyDocument = async (
    documentId: string,
    verified: boolean,
    notes?: string
  ) => {
    try {
      await documentsApi.verifyDocument(documentId, {
        type: entityType,
        verified,
        verificationNotes: notes,
      });

      toast.success(
        `Document ${verified ? "verified" : "rejected"} successfully`
      );

      // Refresh documents list
      const docsResponse =
        entityType === "customer"
          ? await documentsApi.getCustomerDocuments(entityId)
          : await documentsApi.getLoanDocuments(entityId);
      setDocuments(docsResponse.data.data || docsResponse.data);
    } catch (error) {
      toast.error("Failed to update document verification");
      console.error("Verification error:", error);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentsApi.removeDocument(documentId, entityType);
      toast.success("Document deleted successfully");

      // Refresh documents list
      const docsResponse =
        entityType === "customer"
          ? await documentsApi.getCustomerDocuments(entityId)
          : await documentsApi.getLoanDocuments(entityId);
      setDocuments(docsResponse.data.data || docsResponse.data);
    } catch (error) {
      toast.error("Failed to delete document");
      console.error("Delete error:", error);
    }
  };

  // Get document type name
  const getDocumentTypeName = (documentTypeId: string) => {
    const docType = documentTypes.find((type) => type.id === documentTypeId);
    return docType?.name || "Unknown Type";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">Loading documents...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Upload New Document</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Document Type
              </label>
              <Select
                value={selectedDocumentType}
                onValueChange={setSelectedDocumentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">File</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Issuing Authority (Optional)
              </label>
              <Input
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="e.g., Government Agency"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Issue Date (Optional)
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Expiry Date (Optional)
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !selectedDocumentType}
            className="w-full md:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>

        {/* Documents List */}
        <div>
          <h3 className="font-semibold mb-4">Uploaded Documents</h3>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents uploaded yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Issuing Authority</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {getDocumentTypeName(doc.documentTypeId)}
                    </TableCell>
                    <TableCell>{doc.issuingAuthority || "N/A"}</TableCell>
                    <TableCell>
                      {doc.issueDate
                        ? new Date(doc.issueDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {doc.expiryDate
                        ? new Date(doc.expiryDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.verified ? "default" : "secondary"}>
                        {doc.verified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `${
                                process.env.NEXT_PUBLIC_API_URL ||
                                "https://l-d1.onrender.com/api"
                              }/documents/serve/${doc.id}`,
                              "_blank"
                            )
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {!doc.verified && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyDocument(doc.id, true)}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleVerifyDocument(
                                  doc.id,
                                  false,
                                  "Document rejected"
                                )
                              }
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
