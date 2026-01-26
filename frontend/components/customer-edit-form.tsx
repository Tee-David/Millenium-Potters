"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  Upload,
  Check,
  Trash2,
  FileText,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Eye,
  CreditCard,
  RefreshCw,
  CheckCircle,
  Clock,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  unionMembersApi,
  unionsApi,
  usersApi,
  documentTypesApi,
  transformCustomerToFormData,
  transformFormDataToUpdateCustomerDto,
  auth,
  getAccessToken,
} from "@/lib/api";
import { Customer, CustomerDocument } from "@/types/customer";
import { DocumentType } from "@/types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "sonner";

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date | undefined;
  gender: string;
  maritalStatus: string;
  union: string;
  creditOfficer: string;
  profession: string;
  company: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  address: string;
  note: string;
}

interface NewDocument {
  type: string;
  file: File | null;
  notes: string;
}

interface CustomerEditFormProps {
  customerId: string;
}

interface UnionOption {
  value: string;
  label: string;
}

interface CreditOfficerOption {
  value: string;
  label: string;
}

// Separate component for document upload to avoid hook issues
const DocumentUploadItem = ({
  doc,
  index,
  onDrop,
  onTypeChange,
  onNotesChange,
  onRemove,
  documentTypes,
  isLoadingDocumentTypes,
  isUploading,
}: {
  doc: NewDocument;
  index: number;
  onDrop: (index: number, files: File[]) => void;
  onTypeChange: (index: number, value: string) => void;
  onNotesChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  documentTypes: DocumentType[];
  isLoadingDocumentTypes: boolean;
  isUploading: boolean;
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(index, files),
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
  });

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors duration-200">
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start max-w-full">
        {/* Document Type Selection */}
        <div className="w-full lg:w-1/4 min-w-0 flex-shrink-0">
          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
            Document Type
          </Label>
          <Select
            value={doc.type}
            onValueChange={(value) => onTypeChange(index, value)}
            disabled={isUploading}
          >
            <SelectTrigger className="h-12 text-base w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingDocumentTypes ? (
                <div className="flex items-center space-x-2 p-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">
                    Loading document types...
                  </span>
                </div>
              ) : documentTypes.length > 0 ? (
                documentTypes.map((docType) => (
                  <SelectItem key={docType.id} value={docType.id}>
                    {docType.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500">
                  No document types available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload Area */}
        <div className="w-full lg:w-2/4 min-w-0 flex-grow">
          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
            Upload File
          </Label>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[120px] w-full",
              isDragActive
                ? "border-emerald-500 bg-emerald-50 scale-105"
                : isUploading
                  ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                  : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50"
            )}
            aria-label="Drag and drop document, or click to select file"
            style={{ pointerEvents: isUploading ? "none" : "auto" }}
          >
            <input {...getInputProps()} />
            <Upload
              className={cn(
                "mb-3 transition-colors",
                isDragActive ? "text-emerald-600" : "text-gray-400"
              )}
              size={32}
            />
            {isUploading ? (
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-emerald-700 font-medium mb-1">
                  Uploading...
                </p>
                <p className="text-xs text-gray-500">
                  Please wait while we upload your document
                </p>
              </div>
            ) : doc.file ? (
              <div className="text-center">
                <p className="text-emerald-700 font-medium mb-1 truncate">
                  {doc.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(doc.file.size / 1024 / 1024 || 0).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-700 font-medium mb-1">
                  Drop your file here
                </p>
                <p className="text-xs text-gray-500">
                  or click to browse • PDF, JPG, PNG up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="w-full lg:w-1/4 min-w-0 flex-shrink-0">
          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
            Notes (Optional)
          </Label>
          <Textarea
            value={doc.notes}
            onChange={(e) => onNotesChange(index, e.target.value)}
            className="min-h-[120px] text-base resize-none w-full"
            placeholder="Add any notes about this document..."
            disabled={isUploading}
          />
        </div>

        {/* Remove Button */}
        <div className="w-full lg:w-auto flex justify-end lg:justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(index)}
            className="cursor-pointer h-10 w-10 rounded-lg hover:scale-105 transition-transform"
            aria-label="Remove document upload field"
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export function CustomerEditForm({ customerId }: CustomerEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: undefined,
    gender: "",
    maritalStatus: "",
    union: "",
    creditOfficer: "",
    profession: "",
    company: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    address: "",
    note: "",
  });

  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [newDocuments, setNewDocuments] = useState<NewDocument[]>([
    { type: "", file: null, notes: "" },
  ]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUnionDisabled, setIsUnionDisabled] = useState(false);
  const [isCreditOfficerDisabled, setIsCreditOfficerDisabled] = useState(false);

  const [unionOptions, setUnionOptions] = useState<UnionOption[]>([]);
  const [creditOfficerOptions, setCreditOfficerOptions] = useState<
    CreditOfficerOption[]
  >([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);
  const [dateOfBirthError, setDateOfBirthError] = useState<string>("");
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<number>>(
    new Set()
  );

  // Helper function to calculate age
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Calculate exact age considering month and day
    return monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;
  };

  // Load customer data and options on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        console.log("Loading customer data for ID:", customerId);

        // Check if customerId is provided
        if (!customerId) {
          console.log("No customer ID provided, skipping data load");
          setIsLoadingData(false);
          return;
        }

        // Load union member data
        console.log("Fetching union member data...");
        const memberResponse = await unionMembersApi.getById(customerId);
        console.log("Union member response:", memberResponse);

        const memberData = memberResponse.data.success
          ? memberResponse.data.data
          : memberResponse.data.data || memberResponse.data;
        console.log("Union member data:", memberData);

        if (!memberData) {
          throw new Error("Union member data not found in response");
        }

        setCustomer(memberData);
        setDocuments(memberData.documents || []);

        // Transform union member data to form format
        console.log("Transforming union member data...");
        const transformedData = {
          firstName: memberData.firstName || "",
          lastName: memberData.lastName || "",
          email: memberData.email || "",
          phoneNumber: memberData.phone || "",
          dateOfBirth: memberData.dateOfBirth
            ? new Date(memberData.dateOfBirth)
            : undefined,
          gender: memberData.gender || "",
          maritalStatus: memberData.maritalStatus || "",
          union: memberData.unionId || memberData.union?.id || "",
          creditOfficer:
            memberData.currentOfficerId || memberData.currentOfficer?.id || "",
          profession: memberData.profession || "",
          company: memberData.company || "",
          city: memberData.city || "",
          state: memberData.state || "",
          country: memberData.country || "",
          zipCode: memberData.zipCode || "",
          address: memberData.address || "",
          note: memberData.note || "",
        };
        console.log("Transformed data:", transformedData);
        setFormData(transformedData);

        // Load unions
        console.log("Loading unions...");
        const unionsResponse = await unionsApi.getAll({ limit: 1000 });
        console.log("Unions response:", unionsResponse);

        const unionsData = unionsResponse.data;
        const unions = (
          unionsData.success
            ? unionsData.data
            : unionsData.data || unionsData || []
        ).map((union: any) => ({
          value: union.id,
          label: union.name,
        }));
        setUnionOptions(unions);

        // Load credit officers
        console.log("Loading credit officers...");
        const creditOfficersResponse = await usersApi.getAll({
          role: "CREDIT_OFFICER",
          isActive: true,
          limit: 1000,
        });
        console.log("Credit officers response:", creditOfficersResponse);

        const creditOfficersData = creditOfficersResponse.data.success
          ? creditOfficersResponse.data.data?.users ||
          creditOfficersResponse.data.data ||
          []
          : creditOfficersResponse.data.data?.users ||
          creditOfficersResponse.data.users ||
          creditOfficersResponse.data.data ||
          creditOfficersResponse.data ||
          [];

        const creditOfficers = creditOfficersData
          .filter(
            (officer: any) =>
              officer.role === "CREDIT_OFFICER" && officer.isActive !== false
          )
          .map((officer: CreditOfficerOption | any) => ({
            value: officer.id,
            label:
              officer.firstName && officer.lastName
                ? `${officer.firstName} ${officer.lastName} (${officer.email})`
                : officer.email || `Credit Officer ${officer.id.slice(-4)}`,
          }));
        setCreditOfficerOptions(creditOfficers);

        // Load document types
        console.log("Loading document types...");
        setIsLoadingDocumentTypes(true);
        try {
          const documentTypesResponse = await documentTypesApi.getAll();
          console.log("Document types response:", documentTypesResponse);

          const documentTypesData =
            documentTypesResponse.data.data || documentTypesResponse.data || [];
          setDocumentTypes(documentTypesData);
          console.log("Document types loaded:", documentTypesData);
        } catch (docError: any) {
          console.error("Failed to load document types:", docError);
          toast.error("Failed to load document types");
        } finally {
          setIsLoadingDocumentTypes(false);
        }

        // Load current user profile for role-based restrictions
        console.log("Loading current user profile...");
        try {
          const userResponse = await auth.profile();
          console.log("User profile response:", userResponse);

          const userData = userResponse.data.data || userResponse.data;
          setCurrentUser(userData);

          // Set role-based restrictions
          if (userData) {
            const userRole = userData.role as string;
            if (
              userRole === "CREDIT_OFFICER" ||
              userRole === "credit_officer"
            ) {
              console.log(
                "Credit officer detected - disabling branch and credit officer selection"
              );
              setIsUnionDisabled(true);
              setIsCreditOfficerDisabled(true);
            } else if (
              userRole === "BRANCH_MANAGER" ||
              userRole === "branch_manager"
            ) {
              console.log(
                "Branch manager detected - disabling branch selection"
              );
              setIsUnionDisabled(true);
              setIsCreditOfficerDisabled(false);
            } else {
              console.log("Admin detected - allowing all selections");
              setIsUnionDisabled(false);
              setIsCreditOfficerDisabled(false);
            }
          }
        } catch (userError: any) {
          console.error("Failed to load user profile:", userError);
          // Don't show error toast for user profile loading failure
        }

        console.log("Data loading completed successfully");
      } catch (error: any) {
        console.error("Failed to load customer data:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response,
          stack: error.stack,
        });

        const errorMessage =
          error.response?.data?.message || error.message || "Unknown error";
        toast.error(`Failed to load customer data: ${errorMessage}`);

        // Don't redirect immediately, let user see the error
        // router.push("/dashboard/business-management/customer");
      } finally {
        setIsLoadingData(false);
      }
    };

    // Always call loadData, but it will handle the case when customerId is not provided
    loadData();
  }, [customerId, router]);

  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | Date | undefined
  ) => {
    // Handle date of birth validation
    if (field === "dateOfBirth" && value instanceof Date) {
      const age = calculateAge(value);
      if (age < 16) {
        setDateOfBirthError("Customer must be at least 16 years old");
      } else {
        setDateOfBirthError("");
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDrop = useCallback(
    (index: number, acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        setNewDocuments((prev) => {
          const copy = [...prev];
          copy[index].file = acceptedFiles[0];
          return copy;
        });
      }
    },
    [setNewDocuments]
  );

  const handleNewDocTypeChange = (index: number, value: string) => {
    setNewDocuments((prev) => {
      const copy = [...prev];
      copy[index].type = value;
      return copy;
    });
  };

  const handleNewDocNotesChange = (index: number, value: string) => {
    setNewDocuments((prev) => {
      const copy = [...prev];
      copy[index].notes = value;
      return copy;
    });
  };

  const handleAddDocumentField = () => {
    setNewDocuments((prev) => [...prev, { type: "", file: null, notes: "" }]);
  };

  const handleRemoveDocumentField = (index: number) => {
    setNewDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      // Remove document - need to check the correct API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api"
        }/documents/union-member/${customerId}/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to remove document");
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

      toast.success("Document removed successfully");
    } catch (error) {
      console.error("Failed to remove document:", error);

      toast.error("Failed to remove document");
    }
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return "First name is required";
    if (formData.firstName.trim().length < 2)
      return "First name must be at least 2 characters long";

    if (!formData.lastName.trim()) return "Last name is required";
    if (formData.lastName.trim().length < 2)
      return "Last name must be at least 2 characters long";

    if (!formData.phoneNumber.trim()) return "Phone number is required";
    if (!formData.union) return "Union selection is required";
    if (!formData.creditOfficer) return "Credit officer selection is required";
    if (!formData.dateOfBirth) return "Date of birth is required";
    if (!formData.gender) return "Gender is required";
    if (!formData.maritalStatus) return "Marital status is required";

    // Email validation (optional but must be valid if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email))
        return "Please enter a valid email address";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      console.log("Starting customer update process...");
      console.log("Form data:", formData);
      console.log("Customer ID:", customerId);

      // Transform form data to match API expectations
      const updateData = transformFormDataToUpdateCustomerDto(formData);
      console.log("Transformed update data:", updateData);

      // Update customer basic information
      console.log("Updating customer basic information...");
      const updateResponse = await unionMembersApi.update(
        customerId,
        updateData
      );
      console.log("Customer update response:", updateResponse);

      // Handle new document uploads
      let uploadedDocuments = 0;
      for (let i = 0; i < newDocuments.length; i++) {
        const newDoc = newDocuments[i];
        if (newDoc.file && newDoc.type) {
          try {
            // Add this document to uploading set
            setUploadingDocuments((prev) => new Set(prev).add(i));

            console.log(`Uploading document ${i + 1}: ${newDoc.type}`);

            // Add document using union member endpoint
            const docFormData = new FormData();
            docFormData.append("file", newDoc.file!);
            docFormData.append("documentTypeId", newDoc.type);

            const uploadResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL ||
              "https://millenium-potters.onrender.com/api"
              }/documents/union-member/${customerId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "access_token"
                  )}`,
                },
                body: docFormData,
              }
            );

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(errorData.message || "Failed to upload document");
            }

            // Reload documents after upload
            const memberResponse = await unionMembersApi.getById(customerId);
            const memberData = memberResponse.data.success
              ? memberResponse.data.data
              : memberResponse.data.data || memberResponse.data;
            setDocuments(memberData.documents || []);

            uploadedDocuments++;
            console.log(`Document uploaded successfully: ${newDoc.type}`);
          } catch (docError: any) {
            console.error(
              `Failed to upload document ${newDoc.type}:`,
              docError
            );
            toast.error(`Failed to upload document: ${newDoc.type}`);
          } finally {
            // Remove from uploading set
            setUploadingDocuments((prev) => {
              const newSet = new Set(prev);
              newSet.delete(i);
              return newSet;
            });
          }
        }
      }

      if (uploadedDocuments > 0) {
        toast.success(
          `Customer updated successfully with ${uploadedDocuments} new document(s)`
        );
      } else {
        toast.success("Customer updated successfully");
      }

      // Redirect to customer detail page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/business-management/customer/${customerId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Failed to update customer:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      const message = error.response?.data?.message || error.message || "";

      if (message.includes("Email already exists")) {
        toast.error(
          "This email address is already registered. Please use a different email."
        );
      } else if (message.includes("Customer not found")) {
        toast.error(
          "The customer was not found. Please refresh and try again."
        );
      } else if (
        message.includes("Union not found") ||
        message.includes("Branch not found")
      ) {
        toast.error(
          "The selected union was not found. Please refresh and try again."
        );
      } else if (message.includes("Officer not found")) {
        toast.error(
          "The selected credit officer was not found. Please refresh and try again."
        );
      } else if (message.includes("Admin cannot be assigned")) {
        toast.error("Admin users cannot be assigned as customer officers.");
      } else if (
        message.includes("Officer must belong to the same union") ||
        message.includes("Officer must belong to the same branch")
      ) {
        toast.error(
          "The selected credit officer must be assigned to the selected union."
        );
      } else if (message.includes("You do not have permission")) {
        toast.error("You don't have permission to update this customer.");
      } else if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
        router.push("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to update this customer.");
      } else if (error.response?.status === 404) {
        toast.error("Customer not found. Please refresh and try again.");
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(message || "Failed to update customer. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
              onClick={() =>
                router.push("/dashboard/business-management/union-member")
              }
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Union Members</span>
            </Button>
          </div>

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="text-lg font-medium text-gray-700">
                  Loading union member data...
                </span>
              </div>
              <p className="text-gray-500">
                Please wait while we fetch the member information
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
              onClick={() =>
                router.push("/dashboard/business-management/union-member")
              }
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Union Members</span>
            </Button>
          </div>

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6">
              <div className="p-4 bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Union Member Not Found
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  The requested union member could not be found or there was an
                  error loading the data. Please check the member ID and try
                  again.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="px-6 py-3 h-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() =>
                    router.push("/dashboard/business-management/union-member")
                  }
                  className="px-6 py-3 h-auto bg-emerald-600 hover:bg-emerald-700"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Union Members
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
              onClick={() =>
                router.push("/dashboard/business-management/union-member")
              }
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Union Members</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Edit Union Member
                </h1>
                <p className="text-gray-600 mt-1">
                  Update union member information and manage documents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-500">
                  Member ID
                </span>
                <p className="text-lg font-bold text-gray-900">
                  #{customer.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            {/* Main Form Section */}
            <div className="xl:col-span-2 space-y-6 md:space-y-8">
              {/* Personal Information Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Personal Information
                    </CardTitle>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Basic member details and contact information
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="phoneNumber"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          handleInputChange("phoneNumber", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Date Of Birth <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">
                          (Must be 16+ years old)
                        </span>
                      </Label>
                      <div className="relative">
                        <DatePicker
                          selected={formData.dateOfBirth}
                          onChange={(date: Date | null) =>
                            handleInputChange("dateOfBirth", date || undefined)
                          }
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          dateFormat="dd/MM/yyyy"
                          placeholderText="dd/mm/yyyy"
                          maxDate={new Date()}
                          yearDropdownItemNumber={80}
                          scrollableYearDropdown
                          className={cn(
                            "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 hover:border-emerald-500 focus:border-emerald-500",
                            dateOfBirthError &&
                            "border-red-500 focus:border-red-500"
                          )}
                          wrapperClassName="w-full"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                      {dateOfBirthError && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {dateOfBirthError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="gender"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          handleInputChange("gender", value)
                        }
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-emerald-500">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="maritalStatus"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Marital Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) =>
                          handleInputChange("maritalStatus", value)
                        }
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-emerald-500">
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="union"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Union <span className="text-red-500">*</span>
                      </Label>
                      {isUnionDisabled ? (
                        <div className="relative">
                          <Input
                            value={
                              unionOptions.find(
                                (u) => u.value === formData.union
                              )?.label || "Loading..."
                            }
                            disabled
                            className="bg-gray-50 cursor-not-allowed"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-muted-foreground">
                              Auto-assigned
                            </span>
                          </div>
                        </div>
                      ) : (
                        <SearchableSelect
                          options={unionOptions}
                          value={formData.union}
                          onValueChange={(val) =>
                            handleInputChange("union", val)
                          }
                          placeholder="Select Union"
                          searchPlaceholder="Search unions..."
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="creditOfficer"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Credit Officer <span className="text-red-500">*</span>
                    </Label>
                    {isCreditOfficerDisabled ? (
                      <div className="relative">
                        <Input
                          value={
                            creditOfficerOptions.find(
                              (co) => co.value === formData.creditOfficer
                            )?.label || "Loading..."
                          }
                          disabled
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-xs text-muted-foreground">
                            You
                          </span>
                        </div>
                      </div>
                    ) : (
                      <SearchableSelect
                        options={creditOfficerOptions}
                        value={formData.creditOfficer}
                        onValueChange={(val) =>
                          handleInputChange("creditOfficer", val)
                        }
                        placeholder="Select Credit Officer"
                        searchPlaceholder="Search credit officers..."
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Professional & Location Information
                    </CardTitle>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Work details and location information
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="profession"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Profession
                      </Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) =>
                          handleInputChange("profession", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter profession"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="company"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Company
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) =>
                          handleInputChange("company", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="city"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        City
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter city"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="state"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        State
                      </Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="country"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Country
                      </Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) =>
                          handleInputChange("country", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="zipCode"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Zip Code
                      </Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) =>
                          handleInputChange("zipCode", e.target.value)
                        }
                        className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Enter zip code"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="address"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Building className="h-4 w-4" />
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className="min-h-[100px] text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="note"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) =>
                        handleInputChange("note", e.target.value)
                      }
                      className="min-h-[100px] text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                      placeholder="Enter any additional notes about the customer"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Document Section - Enhanced */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Document Management
                    </CardTitle>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Manage customer documents and upload new files
                  </p>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Existing Documents */}
                  {documents.length > 0 && (
                    <div className="space-y-6">
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          Existing Documents
                        </h3>
                        <p className="text-sm text-gray-600">
                          Currently uploaded documents for this customer
                        </p>
                      </div>

                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Document Type */}
                            <div className="lg:col-span-3">
                              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Document Type
                              </Label>
                              <div className="mt-3 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg inline-block font-medium">
                                {document.documentTypeId || "Unknown Type"}
                              </div>
                            </div>

                            {/* Filename */}
                            <div className="lg:col-span-4">
                              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Document File
                              </Label>
                              <div className="mt-3 flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium break-all">
                                  {document.fileUrl
                                    ? document.fileUrl.split("/").pop() ||
                                    "Document"
                                    : "No filename"}
                                </span>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="lg:col-span-4">
                              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Notes
                              </Label>
                              <div className="mt-3 text-gray-800 leading-relaxed">
                                {document.verificationNotes ||
                                  "No notes available"}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-1 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleRemoveDocument(document.id)
                                }
                                className="h-10 w-10 rounded-lg hover:scale-105 transition-transform"
                                aria-label="Remove document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Document Upload */}
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        Upload New Documents
                      </h3>
                      <p className="text-sm text-gray-600">
                        Add additional documents for this customer
                      </p>
                    </div>

                    {newDocuments.map((doc, index) => (
                      <DocumentUploadItem
                        key={index}
                        doc={doc}
                        index={index}
                        onDrop={onDrop}
                        onTypeChange={handleNewDocTypeChange}
                        onNotesChange={handleNewDocNotesChange}
                        onRemove={handleRemoveDocumentField}
                        documentTypes={documentTypes}
                        isLoadingDocumentTypes={isLoadingDocumentTypes}
                        isUploading={uploadingDocuments.has(index)}
                      />
                    ))}

                    {/* Add Upload Field Button */}
                    <div className="flex justify-center pt-4">
                      <Button
                        type="button"
                        onClick={handleAddDocumentField}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 cursor-pointer"
                        aria-label="Add new document upload field"
                        disabled={isLoading || uploadingDocuments.size > 0}
                      >
                        <Check className="h-5 w-5" />
                        Add Another Document
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Quick Actions Card - Commented out */}
              {/* <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Quick Actions
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-12 text-base"
                    onClick={() =>
                      router.push(
                        `/dashboard/business-management/customer/${customer.id}`
                      )
                    }
                  >
                    <Eye className="mr-3 h-4 w-4" />
                    View Customer Details
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-12 text-base"
                    onClick={() =>
                      router.push(
                        `/dashboard/business-management/loan?customerId=${customer.id}`
                      )
                    }
                  >
                    <CreditCard className="mr-3 h-4 w-4" />
                    View Customer Loans
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="mr-3 h-4 w-4" />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card> */}

              {/* Form Progress Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Form Status
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Personal Info
                      </span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Contact Details
                      </span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Professional Info
                      </span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Documents</span>
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Submit Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border-0 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Ready to Update Customer
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review your changes and click update to save
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-3 h-auto border-gray-300 hover:border-gray-400 cursor-pointer"
                  onClick={() =>
                    router.push("/dashboard/business-management/customer")
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 h-auto shadow-lg cursor-pointer"
                  disabled={isLoading || uploadingDocuments.size > 0}
                >
                  {isLoading || uploadingDocuments.size > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {uploadingDocuments.size > 0
                        ? `Uploading ${uploadingDocuments.size} document(s)...`
                        : "Updating Customer..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Update Customer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
