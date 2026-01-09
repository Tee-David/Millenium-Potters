"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, Search, Upload, X, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  loansApi,
  unionsApi,
  unionMembersApi,
  usersApi,
  loanTypesApi,
  documentTypesApi,
  handleDatabaseError,
  auth,
  getAccessToken,
} from "@/lib/api";
import { UserRole } from "@/types";
import {
  calculateInitialLoanPayments,
  calculateDynamicRepaymentSchedule,
  validateLoanTerms,
  type LoanCalculation,
} from "@/utils/loanCalculations";

import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";
interface DocumentUpload {
  id: string;
  type: string;
  file: File | null;
  description: string;
}

interface Guarantor {
  id: string;
  name: string;
  documents: DocumentUpload[];
}

// const SearchableSelect = ({
//   value,
//   onValueChange,
//   placeholder,
//   options,
//   searchPlaceholder = "Search...",
// }: {
//   value: string;
//   onValueChange: (value: string) => void;
//   placeholder: string;
//   options: { value: string; label: string }[];
//   searchPlaceholder?: string;
// }) => {
//   const [open, setOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const filteredOptions = options.filter(
//     (option) =>
//       (option.label ?? "").toLowerCase().includes(searchTerm.toLowerCase()) &&
//       option.value &&
//       option.value.trim() !== "" // Filter out empty values
//   );
//   return (
//     <Select
//       value={value}
//       onValueChange={onValueChange}
//       open={open}
//       onOpenChange={setOpen}
//     >
//       <SelectTrigger className="mt-1">
//         <SelectValue placeholder={placeholder} />
//       </SelectTrigger>
//       <SelectContent>
//         <div className="flex items-center px-3 pb-2">
//           <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
//           <Input
//             placeholder={searchPlaceholder}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="h-8 w-full border-0 p-0 focus-visible:ring-0"
//           />
//         </div>
//         {filteredOptions.map((option) => (
//           <SelectItem key={option.value} value={option.value}>
//             {option.label}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// };

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return parseFloat(size.toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {isDragActive
              ? "Drop the file here..."
              : "Drag & drop a file here, or click to select"}
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, PNG, JPG, JPEG (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-900">
                {file.name}
              </p>
              <p className="text-xs text-emerald-700">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="text-sm text-red-600">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map((error) => (
                <p key={error.code}>{error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function LoanCreatePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUnionDisabled, setIsUnionDisabled] = useState(false);
  const [isCreditOfficerDisabled, setIsCreditOfficerDisabled] = useState(false);

  const [formData, setFormData] = useState({
    union: "",
    loanType: "",
    unionMember: "",
    creditOfficer: "",
    loanStartDate: new Date().toISOString().split("T")[0], // Current date
    loanDueDate: "",
    amount: "",
    loanTerms: "",
    loanTermPeriod: "monthly",
    loanTermMin: "1", // Minimum 1 day
    loanTermMax: "",
    processingFee: "",
    penaltyFee: "",
    purposeOfLoan: "",
    creditOfficerNotes: "",
    adminNotes: "",
    supervisorNotes: "",
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      id: "1",
      type: "",
      file: null,
      description: "",
    },
  ]);

  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    {
      id: Date.now().toString(),
      name: "",
      documents: [
        {
          id: `${Date.now()}-doc1`,
          type: "",
          file: null,
          description: "",
        },
      ],
    },
  ]);

  /* dropdown data */
  const [unions, setUnions] = useState<any[]>([]);
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [unionMembers, setUnionMembers] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [filteredCreditOfficerOptions, setFilteredCreditOfficerOptions] =
    useState<Array<{ value: string; label: string }>>([]);
  const [allOfficersMap, setAllOfficersMap] = useState<
    Record<string, { value: string; label: string }>
  >({});
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(
    new Set()
  );

  // Helper function to format officer label
  const formatOfficerLabel = (officer: any) => {
    if (!officer) return "Credit Officer";
    if (officer.firstName && officer.lastName) {
      return `${officer.firstName} ${officer.lastName} (${officer.email})`;
    }
    if (officer.firstName || officer.lastName) {
      return `${officer.firstName || officer.lastName} (${
        officer.email || ""
      })`;
    }
    return officer.email || `Credit Officer ${officer.id?.slice(-4) || ""}`;
  };

  // Helper function to build credit officer options for a union
  const buildUnionCreditOfficerOptions = (union: any) => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];

    const pushOfficer = (officer?: any, fallbackId?: string) => {
      const officerId = officer?.id || fallbackId;
      if (!officerId || seen.has(officerId)) return;
      const label = officer
        ? formatOfficerLabel(officer)
        : allOfficersMap[officerId]?.label || "Credit Officer";
      options.push({ value: officerId, label });
      seen.add(officerId);
    };

    if (!union) return options;

    // Check creditOfficerAssignments array
    if (Array.isArray(union.creditOfficerAssignments)) {
      union.creditOfficerAssignments.forEach((assignment: any) => {
        pushOfficer(assignment?.creditOfficer, assignment?.creditOfficerId);
      });
    }

    // Check creditOfficers array
    if (Array.isArray(union.creditOfficers)) {
      union.creditOfficers.forEach((officer: any) => {
        pushOfficer(officer, officer?.id);
      });
    }

    // Check single creditOfficer
    if (union.creditOfficer) {
      pushOfficer(union.creditOfficer, union.creditOfficerId);
    }

    // Check creditOfficerId
    if (union.creditOfficerId) {
      pushOfficer(undefined, union.creditOfficerId);
    }

    return options;
  };

  // Load user profile first
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileResponse = await auth.profile();
        const user = profileResponse.data.data || profileResponse.data;
        setCurrentUser(user);

        // Auto-fill based on user role (with fallback for different role formats)
        const userRole = user.role as string;
        if (
          userRole === UserRole.CREDIT_OFFICER ||
          userRole === "CREDIT_OFFICER" ||
          userRole === "credit_officer"
        ) {
          setIsUnionDisabled(false); // Can select from their unions
          setIsCreditOfficerDisabled(true);
          // Auto-select the logged-in credit officer
          setFormData((prev) => ({
            ...prev,
            creditOfficer: user.id || "",
          }));
        } else if (
          userRole === UserRole.SUPERVISOR ||
          userRole === "SUPERVISOR" ||
          userRole === "supervisor"
        ) {
          setIsUnionDisabled(false);
          setIsCreditOfficerDisabled(false);
        } else {
          setIsUnionDisabled(false);
          setIsCreditOfficerDisabled(false);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
        toast.error("Failed to load user profile");
      }
    };

    loadUserProfile();
  }, []);

  useEffect(() => {
    /* load masters */
    Promise.all([
      unionsApi.getAll({ limit: 1000 }).then((r: any) => {
        const unionsData = r.data;
        const unions = unionsData.success
          ? unionsData.data
          : unionsData.data || unionsData || [];
        setUnions(Array.isArray(unions) ? unions : []);
      }),
      loanTypesApi.getAll().then((r: any) => {
        const loanTypesData =
          r.data.data?.loanTypes ||
          r.data.loanTypes ||
          r.data.data ||
          r.data ||
          [];
        setLoanTypes(Array.isArray(loanTypesData) ? loanTypesData : []);
      }),
      unionMembersApi.getAll({ limit: 1000 }).then((r: any) => {
        const membersData = r.data;
        const members = membersData.success
          ? membersData.data
          : membersData.data || membersData || [];
        setUnionMembers(Array.isArray(members) ? members : []);
      }),
      // Load document types
      (async () => {
        try {
          setLoadingDocumentTypes(true);
          const documentTypesResponse = await documentTypesApi.getAll();
          setDocumentTypes(
            documentTypesResponse.data.data || documentTypesResponse.data || []
          );
        } catch (docError) {
          console.error("Error loading document types:", docError);
          toast.warning(
            "Could not load document types from server. Using fallback types."
          );
          // Use fallback document types
          setDocumentTypes([
            { id: "identity", name: "Proof of Identity", code: "PROOF_ID" },
            { id: "address", name: "Proof of Address", code: "PROOF_ADDR" },
            { id: "income", name: "Proof of Income", code: "PROOF_INCOME" },
            {
              id: "employment",
              name: "Employment Certificate",
              code: "EMPLOYMENT",
            },
            { id: "bank", name: "Bank Statement", code: "BANK_STMT" },
          ]);
        } finally {
          setLoadingDocumentTypes(false);
        }
      })(),
      usersApi
        .getAll({ role: "CREDIT_OFFICER", limit: 1000 })
        .then((creditOfficersRes: any) => {
          const creditOfficersData = creditOfficersRes.data.success
            ? creditOfficersRes.data.data?.users ||
              creditOfficersRes.data.data ||
              []
            : creditOfficersRes.data.data?.users ||
              creditOfficersRes.data.users ||
              creditOfficersRes.data.data ||
              creditOfficersRes.data ||
              [];

          // Filter active credit officers
          const activeOfficers = creditOfficersData.filter(
            (o: any) => o.role === "CREDIT_OFFICER" && o.isActive !== false
          );
          console.log("Credit Officers Data:", activeOfficers);
          setOfficers(Array.isArray(activeOfficers) ? activeOfficers : []);

          // Build a lookup map for all officers
          const lookup: Record<string, { value: string; label: string }> = {};
          activeOfficers.forEach((officer: any) => {
            if (!officer?.id) return;
            lookup[officer.id] = {
              value: officer.id,
              label: formatOfficerLabel(officer),
            };
          });
          setAllOfficersMap(lookup);
        }),
    ]).catch((error) => {
      console.error("Failed to load masters:", error);
      handleDatabaseError(
        error,
        "Failed to load loan creation data due to database connection issues. Please try again."
      );
    });
  }, []);

  // Filter credit officers when union selection changes
  useEffect(() => {
    if (!formData.union) {
      // No union selected, show all officers
      const allOptions = (officers || [])
        .filter((officer) => officer && officer.id)
        .map((officer) => ({
          value: officer.id,
          label: formatOfficerLabel(officer),
        }));
      setFilteredCreditOfficerOptions(allOptions);
      return;
    }

    // Find the selected union and get its assigned credit officers
    const selectedUnion = (unions || []).find(
      (u) => u && u.id === formData.union
    );

    if (!selectedUnion) {
      // Union not found yet (still loading), show empty
      setFilteredCreditOfficerOptions([]);
      return;
    }

    const options = buildUnionCreditOfficerOptions(selectedUnion);

    console.log("Filtered Credit Officers for union:", formData.union, options);
    setFilteredCreditOfficerOptions(
      options.filter((opt) => opt && opt.value && opt.label)
    );

    // Clear credit officer selection if the current one is not in the new filtered list
    if (
      formData.creditOfficer &&
      !options.some(
        (option) => option && option.value === formData.creditOfficer
      )
    ) {
      setFormData((prev) => ({ ...prev, creditOfficer: "" }));
    }
  }, [
    formData.union,
    formData.creditOfficer,
    unions,
    officers,
    allOfficersMap,
  ]);

  // Calculate loan payments using dynamic system
  const calculateLoanPayments = (): LoanCalculation | null => {
    if (!formData.amount || !formData.loanTermMax || !formData.loanType) {
      return null;
    }

    const amount = parseFloat(formData.amount);
    const maxTerm = parseInt(formData.loanTermMax);
    if (isNaN(maxTerm) || maxTerm <= 0) return null;

    const selectedLoanType = loanTypes.find(
      (lt) => lt.id === formData.loanType
    );

    if (!selectedLoanType || !amount) return null;

    // Validate loan terms
    const validation = validateLoanTerms(selectedLoanType.termUnit, 1, maxTerm);
    if (!validation.isValid) {
      console.warn("Loan term validation errors:", validation.errors);
    }

    // Calculate initial loan payments using the new system
    return calculateInitialLoanPayments(
      amount,
      maxTerm,
      selectedLoanType.termUnit
    );
  };

  const loanCalculations = calculateLoanPayments();

  /* derive due date when loanType, startDate, or maxTerm changes */
  useEffect(() => {
    if (!formData.loanType || !formData.loanStartDate || !formData.loanTermMax)
      return;
    const lt = loanTypes.find((t) => t.id === formData.loanType);
    if (!lt) return;

    const start = new Date(formData.loanStartDate);
    const due = new Date(start);
    const maxTerm = parseInt(formData.loanTermMax);

    // Calculate due date based on term unit
    switch (lt.termUnit) {
      case "DAY":
        due.setDate(due.getDate() + maxTerm);
        break;
      case "WEEK":
        due.setDate(due.getDate() + maxTerm * 7);
        break;
      case "MONTH":
        due.setMonth(due.getMonth() + maxTerm);
        break;
    }

    setFormData((p) => ({
      ...p,
      loanDueDate: due.toISOString().split("T")[0],
    }));
  }, [
    formData.loanType,
    formData.loanStartDate,
    formData.loanTermMax,
    loanTypes,
  ]);

  // Get current loan type details
  const getCurrentLoanType = () => {
    return loanTypes.find((type) => type.id === formData.loanType);
  };

  useEffect(() => {
    if (formData.loanType) {
      const selectedLoanType = getCurrentLoanType();
      if (selectedLoanType) {
        // Set loan term period and limits from loan type
        setFormData((prev) => ({
          ...prev,
          loanTermPeriod: selectedLoanType.termUnit.toLowerCase(),
          loanTermMin: selectedLoanType.minTerm.toString(),
          loanTermMax: selectedLoanType.maxTerm.toString(),
        }));
      }
    }
  }, [formData.loanType]);

  // Calculate due date when max term changes or loan type changes
  useEffect(() => {
    if (formData.loanStartDate && formData.loanTermMax && formData.loanType) {
      const selectedLoanType = getCurrentLoanType();
      if (selectedLoanType) {
        const startDate = new Date(formData.loanStartDate);
        const dueDate = new Date(startDate);
        const maxTerm = parseInt(formData.loanTermMax);
        if (isNaN(maxTerm) || maxTerm <= 0) return;

        switch (selectedLoanType.termUnit) {
          case "DAY":
            dueDate.setDate(startDate.getDate() + maxTerm);
            break;
          case "WEEK":
            dueDate.setDate(startDate.getDate() + maxTerm * 7);
            break;
          case "MONTH":
            dueDate.setMonth(startDate.getMonth() + maxTerm);
            break;
        }

        setFormData((prev) => ({
          ...prev,
          loanDueDate: dueDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [formData.loanStartDate, formData.loanTermMax, formData.loanType]);

  const handleInputChange = (field: string, value: string) => {
    if (field === "union") {
      // When union changes, filter union members by the selected union
      const unionMembersForUnion = unionMembers.filter(
        (m: any) => m.unionId === value || m.union?.id === value
      );

      // Clear union member if they don't belong to the new union
      const currentMember = unionMembers.find(
        (m: any) => m.id === formData.unionMember
      );
      const shouldClearMember =
        currentMember &&
        currentMember.unionId !== value &&
        currentMember.union?.id !== value;

      if (shouldClearMember) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          unionMember: "",
        }));

        // Show notification
        if (unionMembersForUnion.length === 0) {
          toast.warning(
            "No union members found in the selected union. Please add union members to this union first."
          );
        } else {
          toast.info(
            `Found ${unionMembersForUnion.length} union member(s) in the selected union.`
          );
        }
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Validate loan amount against selected loan type range
  const validateLoanAmount = (amount: string): string | null => {
    if (!amount) return "Loan amount is required";

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

    const currentLoanType = getCurrentLoanType();
    if (
      currentLoanType &&
      currentLoanType.minAmount &&
      currentLoanType.maxAmount
    ) {
      if (numAmount < currentLoanType.minAmount) {
        return `Amount must be at least ₦${currentLoanType.minAmount.toLocaleString()}`;
      }
      if (numAmount > currentLoanType.maxAmount) {
        return `Amount cannot exceed ₦${currentLoanType.maxAmount.toLocaleString()}`;
      }
    }
    return null;
  };

  // Comprehensive form validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.union) errors.push("Union is required");
    if (!formData.loanType) errors.push("Loan type is required");
    if (!formData.unionMember) errors.push("Union member is required");
    if (!formData.creditOfficer) {
      errors.push("Credit officer is required");
    }
    if (!formData.loanStartDate) errors.push("Loan start date is required");

    // Validate loan amount
    const amountError = validateLoanAmount(formData.amount);
    if (amountError) errors.push(amountError);

    // Validate processing fee
    if (formData.processingFee) {
      const processingFee = parseFloat(formData.processingFee);
      if (isNaN(processingFee) || processingFee < 0) {
        errors.push("Processing fee must be a valid positive number");
      }
    }

    // Validate penalty fee
    if (formData.penaltyFee) {
      const penaltyFee = parseFloat(formData.penaltyFee);
      if (isNaN(penaltyFee) || penaltyFee < 0) {
        errors.push("Penalty fee must be a valid positive number");
      }
    }

    // Validate max term
    if (!formData.loanTermMax) {
      errors.push("Maximum term is required");
    } else {
      const maxTerm = parseInt(formData.loanTermMax);
      if (isNaN(maxTerm) || maxTerm < 1) {
        errors.push("Maximum term must be at least 1");
      }

      // Validate term against loan type limit
      const selectedLoanType = loanTypes.find(
        (t) => t.id === formData.loanType
      );
      if (selectedLoanType && maxTerm > selectedLoanType.maxTerm) {
        errors.push(
          `Loan term cannot exceed ${
            selectedLoanType.maxTerm
          } ${selectedLoanType.termUnit.toLowerCase()}(s) for this loan type`
        );
      }
    }

    return errors;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]); // Show first error
        return;
      }

      const currentLoanType = loanTypes.find((t) => t.id === formData.loanType);
      if (!currentLoanType) {
        toast.error("Select a loan type");
        return;
      }

      /* build DTO shape expected by backend */
      const payload = {
        unionMemberId: formData.unionMember, // unionMember field contains union member ID
        loanTypeId: formData.loanType || undefined,
        principalAmount: parseFloat(formData.amount),
        termCount: parseInt(formData.loanTermMax),
        termUnit: currentLoanType.termUnit,
        startDate: new Date(formData.loanStartDate).toISOString(),
        processingFeeAmount: parseFloat(formData.processingFee || "0"),
        penaltyFeePerDayAmount: parseFloat(formData.penaltyFee || "0"),
        assignedOfficerId: formData.creditOfficer, // Add the selected credit officer
        notes:
          formData.creditOfficerNotes ||
          formData.adminNotes ||
          formData.supervisorNotes ||
          undefined,
      };

      console.log("Loan creation payload:", payload);

      const response = await loansApi.create(payload);
      const loanId = response.data.data?.id || response.data.id;

      // Upload loan documents if any
      const validDocuments = documents.filter((doc) => doc.file && doc.type);
      if (validDocuments.length > 0) {
        console.log("Uploading loan documents...");

        for (let i = 0; i < validDocuments.length; i++) {
          const doc = validDocuments[i];
          try {
            // Add this document to uploading set
            setUploadingDocuments((prev) => new Set(prev).add(`loan-${i}`));

            console.log(`Uploading loan document ${i + 1}: ${doc.type}`);

            const docFormData = new FormData();
            docFormData.append("file", doc.file!);
            docFormData.append("documentTypeId", doc.type);
            if (doc.description) {
              docFormData.append("description", doc.description);
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
          } finally {
            // Remove from uploading set
            setUploadingDocuments((prev) => {
              const newSet = new Set(prev);
              newSet.delete(`loan-${i}`);
              return newSet;
            });
          }
        }
      }

      // Upload guarantor documents if any
      for (let gIndex = 0; gIndex < guarantors.length; gIndex++) {
        const guarantor = guarantors[gIndex];
        const validGuarantorDocs = guarantor.documents.filter(
          (doc) => doc.file && doc.type
        );

        if (validGuarantorDocs.length > 0) {
          console.log(`Uploading documents for guarantor ${gIndex + 1}...`);

          for (let dIndex = 0; dIndex < validGuarantorDocs.length; dIndex++) {
            const doc = validGuarantorDocs[dIndex];
            try {
              // Add this document to uploading set
              setUploadingDocuments((prev) =>
                new Set(prev).add(`guarantor-${gIndex}-${dIndex}`)
              );

              console.log(
                `Uploading guarantor ${gIndex + 1} document ${dIndex + 1}: ${
                  doc.type
                }`
              );

              const docFormData = new FormData();
              docFormData.append("file", doc.file!);
              docFormData.append("documentTypeId", doc.type);
              if (doc.description) {
                docFormData.append("description", doc.description);
              }

              const uploadResponse = await fetch(
                `${
                  process.env.NEXT_PUBLIC_API_URL ||
                  "https://l-d1.onrender.com/api"
                }/documents/loan/${loanId}/guarantor/${guarantor.id}`,
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
                  `Failed to upload guarantor ${gIndex + 1} document ${
                    dIndex + 1
                  }:`,
                  errorText
                );
                toast.error(
                  `Failed to upload guarantor ${gIndex + 1} document ${
                    dIndex + 1
                  }: ${errorText}`
                );
              } else {
                const uploadResult = await uploadResponse.json();
                console.log(
                  `Guarantor ${gIndex + 1} document ${
                    dIndex + 1
                  } uploaded successfully:`,
                  uploadResult
                );
              }
            } catch (docError) {
              console.error(
                `Error uploading guarantor ${gIndex + 1} document ${
                  dIndex + 1
                }:`,
                docError
              );
              toast.error(
                `Error uploading guarantor ${gIndex + 1} document ${dIndex + 1}`
              );
            } finally {
              // Remove from uploading set
              setUploadingDocuments((prev) => {
                const newSet = new Set(prev);
                newSet.delete(`guarantor-${gIndex}-${dIndex}`);
                return newSet;
              });
            }
          }
        }
      }

      // Check if current user is admin to show appropriate message
      const isAdmin = currentUser?.role === "ADMIN";
      const docCount =
        validDocuments.length +
        guarantors.reduce(
          (total, g) =>
            total + g.documents.filter((doc) => doc.file && doc.type).length,
          0
        );

      if (docCount > 0) {
        toast.success(
          isAdmin
            ? `Loan created and automatically approved successfully with ${docCount} document${
                docCount > 1 ? "s" : ""
              } uploaded`
            : `Loan created successfully and submitted for approval with ${docCount} document${
                docCount > 1 ? "s" : ""
              } uploaded`
        );
      } else {
        toast.success(
          isAdmin
            ? "Loan created and automatically approved successfully"
            : "Loan created successfully and submitted for approval"
        );
      }

      router.push(`/dashboard/business-management/loan/${loanId}`);
    } catch (err: any) {
      console.error("Failed to create loan:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });

      // Handle database errors with custom message
      if (
        handleDatabaseError(
          err,
          "Failed to create loan due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      // Handle specific error messages
      const message = err.response?.data?.message || "";
      const validationErrors = err.response?.data?.errors || [];
      const status = err.response?.status;

      // Handle validation errors
      if (status === 400 && validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join("\n");
        toast.error(`Validation failed:\n${errorMessages}`);
        return;
      }

      if (message.includes("Customer already has an active loan")) {
        toast.error(
          "This customer already has an active loan. Please complete the existing loan first."
        );
      } else if (message.includes("Loan type not found or inactive")) {
        toast.error(
          "The selected loan type is not available or has been deactivated."
        );
      } else if (message.includes("Principal amount must be between")) {
        toast.error(message);
      } else if (message.includes("Customer not found")) {
        toast.error(
          "The selected customer was not found. Please refresh and try again."
        );
      } else if (message.includes("Credit officer not found")) {
        toast.error(
          "The selected credit officer was not found. Please refresh and try again."
        );
      } else if (status === 400) {
        toast.error(
          `Bad Request: ${message || "Please check your input and try again."}`
        );
      } else if (status === 401) {
        toast.error("Unauthorized: Please log in again.");
      } else if (status === 403) {
        toast.error("Forbidden: You don't have permission to create loans.");
      } else if (status === 404) {
        toast.error("Not Found: The requested resource was not found.");
      } else if (status === 500) {
        toast.error("Server Error: Please try again later.");
      } else {
        toast.error(
          `Error ${status || "Unknown"}: ${
            message || "Failed to create loan. Please try again."
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Union options already created above
  const loanTypeOptions = loanTypes.map((t) => ({
    value: t.id,
    label: t.name
      ? `${t.name} (₦${t.minAmount?.toLocaleString() || 0} - ₦${
          t.maxAmount?.toLocaleString() || 0
        })`
      : t.name || "Unknown Type",
  }));
  const unionMemberOptions = unionMembers
    .filter(
      (member) =>
        (!formData.union ||
          member.unionId === formData.union ||
          member.union?.id === formData.union) &&
        (!formData.creditOfficer ||
          member.currentOfficerId === formData.creditOfficer)
    )
    .map((member) => ({
      value: member.id,
      label: `${member.firstName || ""} ${member.lastName || ""} - ${
        member.phone || member.email
      }`.trim(),
    }));

  const creditOfficerOptions = filteredCreditOfficerOptions;

  const unionOptions = unions.map((union) => ({
    value: union.id,
    label: union.name,
  }));

  // Check if union is selected but no credit officers are assigned
  const noCreditOfficersForUnion =
    formData.union && filteredCreditOfficerOptions.length === 0;

  console.log("Credit Officer Options:", creditOfficerOptions);

  const currentLoanType = getCurrentLoanType();
  const amountError = validateLoanAmount(formData.amount);

  const [loanNumber, setLoanNumber] = useState("");
  useEffect(() => {
    setLoanNumber(String(Date.now()).slice(-4)); // runs only on client
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/business-management/loan">
              Loans
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Loan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">#LON-{loanNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Union */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="union">Union *</Label>
                  {isUnionDisabled ? (
                    <div className="relative">
                      <Input
                        value={
                          unions.find((u) => u.id === formData.union)?.name ||
                          ""
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
                      value={formData.union}
                      onValueChange={(value) =>
                        handleInputChange("union", value)
                      }
                      placeholder="Select Union"
                      options={unionOptions}
                      searchPlaceholder="Search unions..."
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="loanType">Loan Type *</Label>
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

                <div>
                  <Label htmlFor="unionMember">Union Member *</Label>
                  <SearchableSelect
                    value={formData.unionMember}
                    onValueChange={(value) =>
                      handleInputChange("unionMember", value)
                    }
                    placeholder="Select Union Member"
                    options={unionMemberOptions}
                    searchPlaceholder="Search union members..."
                  />
                  {formData.union && (
                    <p className="text-xs text-gray-500 mt-1">
                      Showing union members from selected union only
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="creditOfficer">Credit Officer *</Label>
                  {isCreditOfficerDisabled ? (
                    <div className="relative">
                      <Input
                        value={currentUser?.email || "Current User"}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-xs text-muted-foreground">
                          You
                        </span>
                      </div>
                    </div>
                  ) : noCreditOfficersForUnion ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700 font-medium">
                          No credit officer assigned to this union
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Please assign a credit officer to this union before
                          creating a loan, or select a different union.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <SearchableSelect
                        value={formData.creditOfficer}
                        onValueChange={(value) =>
                          handleInputChange("creditOfficer", value)
                        }
                        placeholder={
                          formData.union
                            ? creditOfficerOptions.length > 0
                              ? "Select Credit Officer"
                              : "No credit officers available"
                            : "Select a union first"
                        }
                        options={creditOfficerOptions}
                        searchPlaceholder="Search officers..."
                      />
                      {formData.union && creditOfficerOptions.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Showing credit officers assigned to the selected union
                        </p>
                      )}
                      {!formData.union && (
                        <p className="text-xs text-gray-500 mt-1">
                          Select a union first to see assigned credit officers
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Other loan detail inputs */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loanStartDate">Loan Start Date *</Label>
                  <Input
                    id="loanStartDate"
                    type="date"
                    value={formData.loanStartDate}
                    onChange={(e) =>
                      handleInputChange("loanStartDate", e.target.value)
                    }
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="loanDueDate">Loan Due Date</Label>
                  <Input
                    id="loanDueDate"
                    type="date"
                    value={formData.loanDueDate}
                    onChange={(e) =>
                      handleInputChange("loanDueDate", e.target.value)
                    }
                    className="mt-1"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-calculated based on maximum term
                  </p>
                </div>

                <div>
                  <Label htmlFor="amount">Loan Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className={`mt-1 ${amountError ? "border-red-500" : ""}`}
                    placeholder="Enter amount in Naira"
                    min={currentLoanType?.minAmount || 1000}
                    max={currentLoanType?.maxAmount || undefined}
                    required
                  />
                  {currentLoanType &&
                    currentLoanType.minAmount &&
                    currentLoanType.maxAmount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: ₦{currentLoanType.minAmount.toLocaleString()} - ₦
                        {currentLoanType.maxAmount.toLocaleString()}
                      </p>
                    )}
                  {amountError && (
                    <p className="text-xs text-red-500 mt-1">{amountError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="processingFee">Processing Fee (₦) *</Label>
                  <Input
                    id="processingFee"
                    type="number"
                    value={formData.processingFee}
                    onChange={(e) =>
                      handleInputChange("processingFee", e.target.value)
                    }
                    className="mt-1"
                    placeholder="Enter processing fee"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="loanTermPeriod">Loan Term Period</Label>
                  <Input
                    id="loanTermPeriod"
                    value={
                      loanTypes
                        .find((lt) => lt.id === formData.loanType)
                        ?.termUnit?.toLowerCase() || "monthly"
                    }
                    className="mt-1 capitalize"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set by loan type
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="loanTermMin">Min Term</Label>
                    <Input
                      id="loanTermMin"
                      type="number"
                      value="1"
                      disabled
                      className="mt-1 bg-gray-50 cursor-not-allowed"
                      min="1"
                      max="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Fixed at 1</p>
                  </div>
                  <div>
                    <Label htmlFor="loanTermMax">Max Term *</Label>
                    <Input
                      id="loanTermMax"
                      type="number"
                      value={formData.loanTermMax}
                      onChange={(e) =>
                        handleInputChange("loanTermMax", e.target.value)
                      }
                      className="mt-1"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="penaltyFee">Penalty Fee (₦) *</Label>
                  <Input
                    id="penaltyFee"
                    type="number"
                    value={formData.penaltyFee}
                    onChange={(e) =>
                      handleInputChange("penaltyFee", e.target.value)
                    }
                    className="mt-1"
                    placeholder="Enter penalty fee"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied per day for overdue payment
                  </p>
                </div>

                <div>
                  <Label htmlFor="purposeOfLoan">Purpose Of Loan</Label>
                  <Textarea
                    id="purposeOfLoan"
                    value={formData.purposeOfLoan}
                    onChange={(e) =>
                      handleInputChange("purposeOfLoan", e.target.value)
                    }
                    className="mt-1 min-h-[80px]"
                    placeholder="Enter purpose of loan"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Role-dependent notes field */}
              {currentUser?.role === UserRole.CREDIT_OFFICER && (
                <div>
                  <Label htmlFor="creditOfficerNotes">
                    Credit Officer Notes
                  </Label>
                  <Textarea
                    id="creditOfficerNotes"
                    value={formData.creditOfficerNotes}
                    onChange={(e) =>
                      handleInputChange("creditOfficerNotes", e.target.value)
                    }
                    className="mt-1 min-h-[80px]"
                    placeholder="Enter notes from credit officer perspective"
                  />
                </div>
              )}

              {currentUser?.role === UserRole.SUPERVISOR && (
                <div>
                  <Label htmlFor="supervisorNotes">Supervisor Notes</Label>
                  <Textarea
                    id="supervisorNotes"
                    value={formData.supervisorNotes}
                    onChange={(e) =>
                      handleInputChange("supervisorNotes", e.target.value)
                    }
                    className="mt-1 min-h-[80px]"
                    placeholder="Enter notes from supervisor perspective"
                  />
                </div>
              )}

              {currentUser?.role === UserRole.ADMIN && (
                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    value={formData.adminNotes}
                    onChange={(e) =>
                      handleInputChange("adminNotes", e.target.value)
                    }
                    className="mt-1 min-h-[80px]"
                    placeholder="Enter administrative notes"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Documents</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((document, index) => (
                <div
                  key={document.id}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border rounded-lg"
                >
                  <div>
                    <Label>Document Type</Label>
                    <Select
                      value={document.type}
                      onValueChange={(value) =>
                        updateDocument(document.id, "type", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingDocumentTypes ? (
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
                          <>
                            <div className="p-2 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded">
                              <span className="inline mr-1">⚠️</span>
                              No document types available. Using default types.
                            </div>
                            {documentTypes.map((docType) => (
                              <SelectItem key={docType.id} value={docType.id}>
                                {docType.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Document Upload</Label>
                    <div className="mt-1">
                      {uploadingDocuments.has(
                        `loan-${documents.findIndex(
                          (d) => d.id === document.id
                        )}`
                      ) ? (
                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-blue-600">
                              Uploading document...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <FileDropzone
                          file={document.file}
                          onFileSelect={(file) =>
                            updateDocument(document.id, "file", file)
                          }
                          onRemoveFile={() =>
                            updateDocument(document.id, "file", null)
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="flex-1">
                      <Label>Description</Label>
                      <Input
                        value={document.description}
                        onChange={(e) =>
                          updateDocument(
                            document.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="mt-1"
                        placeholder="Enter description"
                      />
                    </div>
                    {documents.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDocument(document.id)}
                        className="mt-4 self-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addDocument}
                className="w-full sm:w-auto bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guarantors Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Guarantors</CardTitle>
              <Button
                type="button"
                variant="outline"
                onClick={addGuarantor}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Guarantor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {guarantors.map((guarantor, gIndex) => (
              <div
                key={guarantor.id}
                className="mb-8 p-4 border rounded-lg bg-gray-50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Input
                    placeholder={`Guarantor #${gIndex + 1} Name`}
                    value={guarantor.name}
                    onChange={(e) =>
                      updateGuarantorName(guarantor.id, e.target.value)
                    }
                    className="flex-1"
                  />
                  {guarantors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGuarantor(guarantor.id)}
                      className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Documents UI for guarantor */}
                {guarantor.documents.map((document) => (
                  <div
                    key={document.id}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-white"
                  >
                    <div>
                      <Label>Document Type</Label>
                      <Select
                        value={document.type}
                        onValueChange={(value) =>
                          updateGuarantorDocument(
                            guarantor.id,
                            document.id,
                            "type",
                            value
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Document Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingDocumentTypes ? (
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
                            <>
                              <div className="p-2 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded">
                                <span className="inline mr-1">⚠️</span>
                                No document types available. Using default
                                types.
                              </div>
                              {documentTypes.map((docType) => (
                                <SelectItem key={docType.id} value={docType.id}>
                                  {docType.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Document Upload</Label>
                      <div className="mt-1">
                        {uploadingDocuments.has(
                          `guarantor-${guarantors.findIndex(
                            (g) => g.id === guarantor.id
                          )}-${guarantor.documents.findIndex(
                            (d) => d.id === document.id
                          )}`
                        ) ? (
                          <div className="flex items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm text-blue-600">
                                Uploading document...
                              </span>
                            </div>
                          </div>
                        ) : (
                          <FileDropzone
                            file={document.file}
                            onFileSelect={(file) =>
                              updateGuarantorDocument(
                                guarantor.id,
                                document.id,
                                "file",
                                file
                              )
                            }
                            onRemoveFile={() =>
                              updateGuarantorDocument(
                                guarantor.id,
                                document.id,
                                "file",
                                null
                              )
                            }
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="flex-1">
                        <Label>Description</Label>
                        <Input
                          value={document.description}
                          onChange={(e) =>
                            updateGuarantorDocument(
                              guarantor.id,
                              document.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="mt-1"
                          placeholder="Enter description"
                        />
                      </div>
                      {guarantor.documents.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            removeGuarantorDocument(guarantor.id, document.id)
                          }
                          className="mt-4 self-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addGuarantorDocument(guarantor.id)}
                  className="w-full sm:w-auto bg-transparent mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
          <Link
            href="/dashboard/business-management/loan"
            className="w-full sm:w-auto"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full bg-red-600 hover:bg-red-700 hover:text-white text-white cursor-pointer"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating...
              </div>
            ) : (
              "Create Loan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
