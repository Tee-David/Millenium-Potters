"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  loansApi,
  customersApi,
  loanTypesApi,
  usersApi,
  branchesApi,
  documentTypesApi,
  handleDatabaseError,
  getAccessToken,
} from "@/lib/api";
import { Loan } from "@/types/loan";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";

interface DocumentUpload {
  id: string;
  type: string;
  file: File | null;
  fileName?: string;
  description: string;
}

interface Guarantor {
  id: string;
  name: string;
  documents: DocumentUpload[];
}

// File Dropzone Component
const FileDropzone = ({
  onFileSelect,
  file,
  onRemoveFile,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg"],
    "application/pdf": [".pdf"],
  },
}: {
  onFileSelect: (file: File) => void;
  file: File | null;
  onRemoveFile: () => void;
  accept?: Record<string, string[]>;
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10MB
    });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{file.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile();
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the file here..."
                : "Drag & drop a file here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, PDF up to 10MB
            </p>
          </div>
        )}
      </div>
      {fileRejections.length > 0 && (
        <div className="text-sm text-red-600">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map((error) => (
                <div key={error.code}>{error.message}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchableSelect = ({
  value,
  onValueChange,
  placeholder,
  options,
  searchPlaceholder = "Search...",
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  searchPlaceholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      option.value &&
      option.value.trim() !== "" // Filter out empty values
  );

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="mt-1 h-11 rounded-lg border-gray-300">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="flex items-center px-3 pb-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full border-0 p-0 focus-visible:ring-0"
          />
        </div>
        {filteredOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default function LoanEditPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;

  const [formData, setFormData] = useState({
    branch: "",
    loanType: "",
    customer: "",
    creditOfficer: "",
    loanStartDate: null as Date | null,
    loanDueDate: null as Date | null,
    amount: "",
    loanTerms: "",
    loanTermPeriod: "monthly",
    loanTermMin: "1",
    loanTermMax: "",
    processingFee: "",
    penaltyFee: "",
    purposeOfLoan: "",
    notes: "",
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);

  // Dropdown data
  const [branches, setBranches] = useState<any[]>([]);
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);
  const [loanStatus, setLoanStatus] = useState<string | null>(null);

  // Double confirmation states
  const [showFirstConfirmation, setShowFirstConfirmation] = useState(false);
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [pendingAdditionalData, setPendingAdditionalData] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, [loanId]);

  const loadInitialData = async () => {
    setInitialLoading(true);
    setError(null);

    try {
      // Load all master data and loan details in parallel
      const [
        loanResponse,
        branchesResponse,
        loanTypesResponse,
        customersResponse,
        officersResponse,
        documentTypesResponse,
      ] = await Promise.all([
        loansApi.getById(loanId),
        branchesApi.getAll(),
        loanTypesApi.getAll(),
        customersApi.getAll({ limit: 500 }),
        usersApi.getAll({ role: "CREDIT_OFFICER", limit: 100 }),
        documentTypesApi.getAll(),
      ]);

      // Process loan data
      const loanData = loanResponse.data.data || loanResponse.data;
      if (!loanData) {
        throw new Error("Loan not found");
      }

      // Process master data
      const branchesData =
        branchesResponse.data.data?.branches ||
        branchesResponse.data.branches ||
        branchesResponse.data.data ||
        branchesResponse.data ||
        [];
      const loanTypesData =
        loanTypesResponse.data.data?.loanTypes ||
        loanTypesResponse.data.loanTypes ||
        loanTypesResponse.data.data ||
        loanTypesResponse.data ||
        [];
      const customersData =
        customersResponse.data.data?.customers ||
        customersResponse.data.customers ||
        customersResponse.data.data ||
        customersResponse.data ||
        [];
      const officersData =
        officersResponse.data.data?.users ||
        officersResponse.data.users ||
        officersResponse.data.data ||
        officersResponse.data ||
        [];

      const documentTypesData =
        documentTypesResponse.data.data || documentTypesResponse.data || [];

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setLoanTypes(Array.isArray(loanTypesData) ? loanTypesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setOfficers(Array.isArray(officersData) ? officersData : []);
      setDocumentTypes(
        Array.isArray(documentTypesData) ? documentTypesData : []
      );

      // Store loan status
      setLoanStatus(loanData.status || null);

      // Populate form with loan data
      setFormData({
        branch: loanData.branchId || "",
        loanType: loanData.loanTypeId || "",
        customer: loanData.customerId || "",
        creditOfficer: loanData.assignedOfficerId || "",
        loanStartDate: loanData.startDate ? new Date(loanData.startDate) : null,
        loanDueDate: loanData.endDate ? new Date(loanData.endDate) : null,
        amount: loanData.principalAmount?.toString() || "",
        loanTerms: loanData.termCount?.toString() || "",
        loanTermPeriod: loanData.termUnit?.toLowerCase() || "monthly",
        loanTermMin: "1",
        loanTermMax: loanData.termCount?.toString() || "",
        processingFee: loanData.processingFeeAmount?.toString() || "",
        penaltyFee: loanData.penaltyFeePerDayAmount?.toString() || "",
        purposeOfLoan: "", // Not available in current schema
        notes: loanData.notes || "",
      });
    } catch (error: any) {
      console.error("Failed to load loan data:", error);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to load loan data due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Fallback error handling
      setError(error.response?.data?.message || "Failed to load loan data");
      toast.error("Failed to load loan data");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | null) => {
    if (field === "branch") {
      // When branch changes, check if current customer belongs to new branch
      const currentCustomer = customers.find((c) => c.id === formData.customer);
      const newBranchCustomers = customers.filter(
        (c) => c.branchId === (value as string)
      );

      // Clear customer if they don't belong to the new branch
      if (currentCustomer && currentCustomer.branchId !== value) {
        setFormData((prev) => ({
          ...prev,
          [field]: value as string,
          customer: "", // Clear customer selection
        }));

        // Show notification
        if (newBranchCustomers.length === 0) {
          toast.warning("No customers found in the selected branch.");
        } else {
          toast.info(
            `Found ${newBranchCustomers.length} customer(s) in the selected branch.`
          );
        }
      } else {
        setFormData((prev) => ({ ...prev, [field]: value as string }));

        // Show notification about available customers
        if (newBranchCustomers.length === 0) {
          toast.warning("No customers found in the selected branch.");
        } else {
          toast.info(
            `Found ${newBranchCustomers.length} customer(s) in the selected branch.`
          );
        }
      }
    } else if (field === "loanStartDate" || field === "loanDueDate") {
      setFormData((prev) => ({ ...prev, [field]: value as Date | null }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value as string }));
    }
  };

  const addDocument = () => {
    const newDoc: DocumentUpload = {
      id: Date.now().toString(),
      type: "",
      file: null,
      description: "",
    };
    setDocuments((prev) => [...prev, newDoc]);
  };

  const removeDocument = (id: string) => {
    if (documents.length > 1) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }
  };

  const updateDocument = (
    id: string,
    field: keyof DocumentUpload,
    value: any
  ) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const handleFileChange = (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    updateDocument(id, "file", file);
  };

  // Guarantor handlers
  const addGuarantor = () => {
    setGuarantors((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        documents: [
          {
            id: Date.now().toString() + "-doc1",
            type: "",
            file: null,
            description: "",
          },
        ],
      },
    ]);
  };

  const removeGuarantor = (id: string) => {
    if (guarantors.length > 1) {
      setGuarantors((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const updateGuarantorName = (id: string, name: string) => {
    setGuarantors((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name } : g))
    );
  };

  const addGuarantorDocument = (guarantorId: string) => {
    setGuarantors((prev) =>
      prev.map((g) =>
        g.id === guarantorId
          ? {
              ...g,
              documents: [
                ...g.documents,
                {
                  id: Date.now().toString(),
                  type: "",
                  file: null,
                  description: "",
                },
              ],
            }
          : g
      )
    );
  };

  const removeGuarantorDocument = (guarantorId: string, docId: string) => {
    setGuarantors((prev) =>
      prev.map((g) =>
        g.id === guarantorId
          ? {
              ...g,
              documents:
                g.documents.length > 1
                  ? g.documents.filter((doc) => doc.id !== docId)
                  : g.documents,
            }
          : g
      )
    );
  };

  const updateGuarantorDocument = (
    guarantorId: string,
    docId: string,
    field: keyof DocumentUpload,
    value: any
  ) => {
    setGuarantors((prev) =>
      prev.map((g) =>
        g.id === guarantorId
          ? {
              ...g,
              documents: g.documents.map((doc) =>
                doc.id === docId ? { ...doc, [field]: value } : doc
              ),
            }
          : g
      )
    );
  };

  const handleGuarantorFileChange = (
    guarantorId: string,
    docId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    updateGuarantorDocument(guarantorId, docId, "file", file);
  };

  const validateLoanAmount = (amount: string): string | null => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid loan amount";
    }
    if (numAmount < 1000) {
      return "Minimum loan amount is ₦1,000";
    }
    if (numAmount > 10000000) {
      return "Maximum loan amount is ₦10,000,000";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if loan can be edited
    if (
      loanStatus !== null &&
      loanStatus !== "DRAFT" &&
      loanStatus !== "PENDING_APPROVAL"
    ) {
      toast.error("This loan cannot be edited due to its current status");
      return;
    }

    // Validate required fields
    if (
      !formData.branch ||
      !formData.loanType ||
      !formData.customer ||
      !formData.creditOfficer ||
      !formData.amount ||
      !formData.processingFee ||
      !formData.penaltyFee
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate loan amount
    const amountError = validateLoanAmount(formData.amount);
    if (amountError) {
      toast.error(amountError);
      return;
    }

    const currentLoanType = loanTypes.find((t) => t.id === formData.loanType);
    if (!currentLoanType) {
      toast.error("Select a loan type");
      return;
    }

    const amount = Number(formData.amount);
    if (
      amount < currentLoanType.minAmount ||
      amount > currentLoanType.maxAmount
    ) {
      toast.error(
        `Amount must be between ₦${Number(
          currentLoanType.minAmount
        ).toLocaleString()} and ₦${Number(
          currentLoanType.maxAmount
        ).toLocaleString()}`
      );
      return;
    }

    // Build update payload (excluding customerId and assignedOfficerId which have separate endpoints)
    const payload: any = {};

    // Only include fields that have values to avoid sending undefined
    if (formData.loanType) payload.loanTypeId = formData.loanType;
    if (formData.amount) payload.principalAmount = parseFloat(formData.amount);
    if (formData.loanTermMax)
      payload.termCount = parseInt(formData.loanTermMax);
    if (formData.loanTermPeriod)
      payload.termUnit = formData.loanTermPeriod.toUpperCase() as
        | "DAY"
        | "WEEK"
        | "MONTH";
    if (formData.loanStartDate)
      payload.startDate = formData.loanStartDate.toISOString();
    if (formData.processingFee)
      payload.processingFeeAmount = parseFloat(formData.processingFee);
    if (formData.penaltyFee)
      payload.penaltyFeePerDayAmount = parseFloat(formData.penaltyFee);
    if (formData.notes) payload.notes = formData.notes;

    // Store additional data for separate API calls
    const additionalData = {
      assignedOfficerId: formData.creditOfficer,
    };

    // Store payloads and show first confirmation
    setPendingPayload(payload);
    setPendingAdditionalData(additionalData);
    setShowFirstConfirmation(true);
  };

  const handleFirstConfirmation = () => {
    setShowFirstConfirmation(false);
    setShowSecondConfirmation(true);
  };

  const handleSecondConfirmation = async () => {
    if (!pendingPayload) return;

    setShowSecondConfirmation(false);
    setLoading(true);

    try {
      // Debug: Log the payload being sent
      console.log("Sending loan update payload:", pendingPayload);

      // Update loan details
      await loansApi.update(loanId, pendingPayload);

      // Handle assigned officer change if needed
      if (pendingAdditionalData?.assignedOfficerId) {
        try {
          await loansApi.assign(loanId, {
            assignedOfficerId: pendingAdditionalData.assignedOfficerId,
            reason: "Updated during loan edit",
          });
        } catch (assignError: any) {
          console.error("Failed to assign loan officer:", assignError);
          // Don't fail the entire operation if assignment fails
          toast.warning(
            "Loan updated but failed to assign officer. Please assign manually."
          );
        }
      }

      // Upload loan documents if any
      const validDocuments = documents.filter((doc) => doc.file && doc.type);
      if (validDocuments.length > 0) {
        console.log("Uploading loan documents...");

        for (let i = 0; i < validDocuments.length; i++) {
          const doc = validDocuments[i];
          try {
            console.log(`Uploading loan document ${i + 1}: ${doc.type}`);

            const docFormData = new FormData();
            docFormData.append("file", doc.file!);
            docFormData.append("documentTypeId", doc.type);
            if (doc.description) {
              docFormData.append("issuingAuthority", doc.description);
            }

            const uploadResponse = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL ||
                "https://l-d1.onrender.com/api"
              }/documents/loan/${loanId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${getAccessToken()}`,
                },
                body: docFormData,
              }
            );

            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              console.error(
                `Failed to upload loan document ${i + 1}:`,
                errorText
              );
              toast.error(
                `Failed to upload loan document ${i + 1}: ${errorText}`
              );
            } else {
              const uploadResult = await uploadResponse.json();
              console.log(
                `Loan document ${i + 1} uploaded successfully:`,
                uploadResult
              );
            }
          } catch (docError) {
            console.error(`Error uploading loan document ${i + 1}:`, docError);
            toast.error(`Error uploading loan document ${i + 1}`);
          }
        }
      }

      if (validDocuments.length > 0) {
        toast.success(
          `Loan updated successfully with ${validDocuments.length} new document(s)`
        );
      } else {
        toast.success("Loan updated successfully");
      }

      router.push(`/dashboard/business-management/loan/${loanId}`);
    } catch (error: any) {
      console.error("Failed to update loan:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          error,
          "Failed to update loan due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Show more detailed error message
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update loan";
      console.error("Detailed error message:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setPendingPayload(null);
      setPendingAdditionalData(null);
    }
  };

  const handleCancelConfirmation = () => {
    setShowFirstConfirmation(false);
    setShowSecondConfirmation(false);
    setPendingPayload(null);
    setPendingAdditionalData(null);
  };

  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const loanTypeOptions = loanTypes.map((type) => ({
    value: type.id,
    label: `${type.name} (₦${Number(
      type.minAmount
    ).toLocaleString()} - ₦${Number(type.maxAmount).toLocaleString()})`,
  }));

  const customerOptions = customers
    .filter(
      (customer) => !formData.branch || customer.branchId === formData.branch
    )
    .map((customer) => ({
      value: customer.id,
      label: `${customer.firstName} ${customer.lastName} - ${customer.phone}`,
    }));

  const creditOfficerOptions = officers.map((officer) => ({
    value: officer.id,
    label: `${officer.email} - ${officer.branch?.name || "No Branch"}`,
  }));

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground">
                Loading loan data...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Failed to Load Loan</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={loadInitialData} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => router.back()} variant="outline">
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Mobile-optimized breadcrumb */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap">
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-sm">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard/business-management/loan"
                  className="text-sm"
                >
                  Loans
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/dashboard/business-management/loan/${loanId}`}
                  className="text-sm truncate max-w-[120px] sm:max-w-none"
                >
                  {loanId}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium text-emerald-600">
                  Edit
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Mobile-optimized header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Edit Loan
                </h1>
                <p className="text-sm text-gray-500 mt-1">Loan ID: {loanId}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Status Warning */}
          {loanStatus !== null &&
            loanStatus !== "DRAFT" &&
            loanStatus !== "PENDING_APPROVAL" && (
              <Card className="shadow-sm border-0 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        Loan Cannot Be Edited
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This loan has a status of <strong>{loanStatus}</strong>{" "}
                        and cannot be modified. Only draft and pending approval
                        loans can be edited.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Main Loan Details Card */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                Loan Details
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Update the loan information below
              </p>
              {loanStatus && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {loanStatus.replace("_", " ")}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Branch & Customer Information */}
                <div className="space-y-5 sm:space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="branch"
                      className="text-sm font-medium text-gray-700"
                    >
                      Branch *
                    </Label>
                    <SearchableSelect
                      value={formData.branch}
                      onValueChange={(value) =>
                        handleInputChange("branch", value)
                      }
                      placeholder="Select Branch"
                      options={branchOptions}
                      searchPlaceholder="Search branches..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="loanType"
                      className="text-sm font-medium text-gray-700"
                    >
                      Loan Type *
                    </Label>
                    <SearchableSelect
                      value={formData.loanType}
                      onValueChange={(value) =>
                        handleInputChange("loanType", value)
                      }
                      placeholder="Select Loan Type"
                      options={loanTypeOptions}
                      searchPlaceholder="Search loan types..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="customer"
                      className="text-sm font-medium text-gray-700"
                    >
                      Customer *
                    </Label>
                    <SearchableSelect
                      value={formData.customer}
                      onValueChange={(value) =>
                        handleInputChange("customer", value)
                      }
                      placeholder="Select Customer"
                      options={customerOptions}
                      searchPlaceholder="Search customers..."
                    />
                    {formData.branch && (
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        Showing customers from selected branch only
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="creditOfficer"
                      className="text-sm font-medium text-gray-700"
                    >
                      Credit Officer *
                    </Label>
                    <SearchableSelect
                      value={formData.creditOfficer}
                      onValueChange={(value) =>
                        handleInputChange("creditOfficer", value)
                      }
                      placeholder="Select Credit Officer"
                      options={creditOfficerOptions}
                      searchPlaceholder="Search officers..."
                    />
                  </div>
                </div>

                {/* Dates & Financial Information */}
                <div className="space-y-5 sm:space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="loanStartDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Loan Start Date *
                    </Label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.loanStartDate}
                        onChange={(date: Date | null) =>
                          handleInputChange("loanStartDate", date)
                        }
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select start date"
                        minDate={new Date()}
                        yearDropdownItemNumber={10}
                        scrollableYearDropdown
                        className={cn(
                          "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        wrapperClassName="w-full"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="loanDueDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Loan Due Date
                    </Label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.loanDueDate}
                        onChange={(date: Date | null) =>
                          handleInputChange("loanDueDate", date)
                        }
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select due date"
                        minDate={formData.loanStartDate || new Date()}
                        yearDropdownItemNumber={10}
                        scrollableYearDropdown
                        className={cn(
                          "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        wrapperClassName="w-full"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="amount"
                      className="text-sm font-medium text-gray-700"
                    >
                      Loan Amount (₦) *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter amount in Naira"
                      min="1000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="processingFee"
                      className="text-sm font-medium text-gray-700"
                    >
                      Processing Fee (₦)
                    </Label>
                    <Input
                      id="processingFee"
                      type="number"
                      value={formData.processingFee}
                      onChange={(e) =>
                        handleInputChange("processingFee", e.target.value)
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter processing fee"
                    />
                  </div>
                </div>

                {/* Terms & Additional Information */}
                <div className="space-y-5 sm:space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="loanTermPeriod"
                      className="text-sm font-medium text-gray-700"
                    >
                      Loan Term Period
                    </Label>
                    <Input
                      id="loanTermPeriod"
                      value={formData.loanTermPeriod}
                      className="h-11 rounded-lg border-gray-300 capitalize bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="loanTermMin"
                        className="text-sm font-medium text-gray-700"
                      >
                        Min Term
                      </Label>
                      <Input
                        id="loanTermMin"
                        value={formData.loanTermMin}
                        className="h-11 rounded-lg border-gray-300 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="loanTermMax"
                        className="text-sm font-medium text-gray-700"
                      >
                        Max Term
                      </Label>
                      <Input
                        id="loanTermMax"
                        value={formData.loanTermMax}
                        onChange={(e) =>
                          handleInputChange("loanTermMax", e.target.value)
                        }
                        className="h-11 rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter max term"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="penaltyFee"
                      className="text-sm font-medium text-gray-700"
                    >
                      Penalty Fee (₦)
                    </Label>
                    <Input
                      id="penaltyFee"
                      type="number"
                      value={formData.penaltyFee}
                      onChange={(e) =>
                        handleInputChange("penaltyFee", e.target.value)
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter penalty fee"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="purposeOfLoan"
                      className="text-sm font-medium text-gray-700"
                    >
                      Purpose Of Loan
                    </Label>
                    <Textarea
                      id="purposeOfLoan"
                      value={formData.purposeOfLoan}
                      onChange={(e) =>
                        handleInputChange("purposeOfLoan", e.target.value)
                      }
                      className="min-h-[100px] rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      placeholder="Enter purpose of loan"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium text-gray-700"
                  >
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="min-h-[100px] rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Enter additional notes about this loan..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-900">
                <Upload className="h-5 w-5 text-emerald-600" />
                Document Upload
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Upload supporting documents for this loan
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 sm:space-y-6">
                {documents.map((document, index) => (
                  <div
                    key={document.id}
                    className="border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        Document {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(document.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Document Type
                        </Label>
                        <Select
                          value={document.type}
                          onValueChange={(value) =>
                            updateDocument(document.id, "type", value)
                          }
                        >
                          <SelectTrigger className="h-11 rounded-lg border-gray-300">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingDocumentTypes ? (
                              <SelectItem value="" disabled>
                                Loading document types...
                              </SelectItem>
                            ) : documentTypes.length > 0 ? (
                              documentTypes.map((docType) => (
                                <SelectItem key={docType.id} value={docType.id}>
                                  {docType.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No document types available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Description
                        </Label>
                        <Input
                          value={document.description}
                          onChange={(e) =>
                            updateDocument(
                              document.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="h-11 rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Enter document description"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Document Upload
                      </Label>
                      <FileDropzone
                        file={document.file}
                        onFileSelect={(file) =>
                          updateDocument(document.id, "file", file)
                        }
                        onRemoveFile={() =>
                          updateDocument(document.id, "file", null)
                        }
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addDocument}
                  className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
              <Link
                href={`/dashboard/business-management/loan/${loanId}`}
                className="w-full sm:w-auto"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 sm:h-10 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-colors"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="w-full sm:w-auto h-11 sm:h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  loading ||
                  (loanStatus !== null &&
                    loanStatus !== "DRAFT" &&
                    loanStatus !== "PENDING_APPROVAL")
                }
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="h-4 w-4 mr-2" />
                    Update Loan
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* First Confirmation Modal */}
        <ConfirmationModal
          isOpen={showFirstConfirmation}
          title="Confirm Loan Update"
          message="Are you sure you want to update this loan? This action will modify the loan details permanently."
          onConfirm={handleFirstConfirmation}
          onCancel={handleCancelConfirmation}
          confirmButtonText="Continue"
          cancelButtonText="Cancel"
          confirmButtonVariant="default"
          maxWidth="md"
        />

        {/* Second Confirmation Modal with Loan Details Summary */}
        <ConfirmationModal
          isOpen={showSecondConfirmation}
          title="Final Confirmation - Review Loan Changes"
          message={
            <div className="space-y-4 sm:space-y-6">
              <p className="text-gray-700 text-sm sm:text-base">
                Please review the loan changes below before confirming the
                update:
              </p>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">Branch:</span>
                    <p className="text-gray-900">
                      {branches.find((b) => b.id === formData.branch)?.name ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">
                      Loan Type:
                    </span>
                    <p className="text-gray-900">
                      {loanTypes.find((t) => t.id === formData.loanType)
                        ?.name || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">Customer:</span>
                    <p className="text-gray-900">
                      {(() => {
                        const customer = customers.find(
                          (c) => c.id === formData.customer
                        );
                        return customer
                          ? `${customer.firstName} ${customer.lastName}`
                          : "N/A";
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">
                      Credit Officer:
                    </span>
                    <p className="text-gray-900">
                      {officers.find(
                        (o) => o.id === pendingAdditionalData?.assignedOfficerId
                      )?.email || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">Amount:</span>
                    <p className="text-gray-900 font-semibold">
                      ₦{Number(formData.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">Term:</span>
                    <p className="text-gray-900">
                      {formData.loanTermMax} {formData.loanTermPeriod}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">
                      Processing Fee:
                    </span>
                    <p className="text-gray-900">
                      ₦{Number(formData.processingFee).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium text-gray-600">
                      Penalty Fee:
                    </span>
                    <p className="text-gray-900">
                      ₦{Number(formData.penaltyFee).toLocaleString()}
                    </p>
                  </div>
                </div>
                {formData.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-600 text-sm">
                      Notes:
                    </span>
                    <p className="text-gray-700 text-sm mt-1 bg-white p-2 rounded border">
                      {formData.notes}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                <p className="text-yellow-800 text-sm sm:text-base">
                  <strong>Warning:</strong> This action cannot be undone. The
                  loan details will be permanently updated.
                </p>
              </div>
            </div>
          }
          onConfirm={handleSecondConfirmation}
          onCancel={handleCancelConfirmation}
          confirmButtonText="Confirm Update"
          cancelButtonText="Go Back"
          confirmButtonVariant="destructive"
          maxWidth="lg"
          isLoading={loading}
        />
      </div>
    </div>
  );
}
