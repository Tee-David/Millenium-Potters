"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Check, Loader2, CalendarIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { format } from "date-fns";
import {
  auth,
  unionsApi,
  unionMembersApi,
  documentTypesApi,
  transformFormDataToCreateCustomerDto,
  usersApi,
  getAccessToken,
} from "@/lib/api";
import { UserRole } from "@/types";
import { toast } from "sonner";

interface DocumentItem {
  id: string;
  type: string;
  file: File | null;
  description?: string;
}

interface CustomerFormData {
  union: string;
  creditOfficer: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profile?: File | null;
  dateOfBirth: Date | undefined;
  gender: string;
  maritalStatus: string;
  profession: string;
  company: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  address: string;
  note?: string;
  documents: DocumentItem[];
  role: UserRole | "customer" | "";
}

interface UnionOption {
  value: string;
  label: string;
}

interface CreditOfficerOption {
  value: string;
  label: string;
  branchId?: string;
  role?: string;
}

interface UserProfile {
  id: string;
  role:
  | UserRole
  | "customer"
  | "CREDIT_OFFICER"
  | "credit_officer"
  | "BRANCH_MANAGER"
  | "branch_manager";
  branchId?: string;
  email: string;
}

export function CustomerCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [unionOptions, setUnionOptions] = useState<UnionOption[]>([]);
  const [creditOfficerOptions, setCreditOfficerOptions] = useState<
    CreditOfficerOption[]
  >([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUnionDisabled, setIsUnionDisabled] = useState(false);
  const [isCreditOfficerDisabled, setIsCreditOfficerDisabled] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);
  const [dateOfBirthError, setDateOfBirthError] = useState<string>("");
  const [isLoadingOfficers, setIsLoadingOfficers] = useState<boolean>(true);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] =
    useState<boolean>(true);
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

  const [formData, setFormData] = useState<CustomerFormData>({
    union: "",
    creditOfficer: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profile: null,
    dateOfBirth: undefined,
    gender: "",
    maritalStatus: "",
    profession: "",
    company: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    address: "",
    note: "",
    documents: [
      {
        id: "default-doc-1",
        type: "",
        file: null,
        description: "",
      },
    ],
    role: "",
  });

  // Load user profile and set up form based on role
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profileResponse = await auth.profile();
        console.log("Customer form - Full profile response:", profileResponse);
        const user = (profileResponse.data.data ||
          profileResponse.data) as UserProfile;
        console.log("Customer form - User profile response:", user);
        console.log("Customer form - User profile keys:", Object.keys(user));
        console.log("Customer form - User role:", user.role);
        console.log("Customer form - User role property:", user["role"]);
        console.log("Customer form - User data property:", (user as any).data);
        console.log(
          "Customer form - User data role:",
          (user as any).data?.role
        );
        console.log(
          "Customer form - UserRole.CREDIT_OFFICER:",
          UserRole.CREDIT_OFFICER
        );
        console.log(
          "Customer form - Role comparison result:",
          user.role === UserRole.CREDIT_OFFICER
        );
        console.log("Customer form - Role type:", typeof user.role);
        console.log("Customer form - Role length:", user.role?.length);
        setCurrentUser(user);

        // Auto-fill based on user role (with fallback for different role formats)
        const userRole = user.role as string;
        if (
          userRole === UserRole.CREDIT_OFFICER ||
          userRole === "CREDIT_OFFICER" ||
          userRole === "credit_officer"
        ) {
          console.log("Credit officer detected - auto-filling form");
          console.log("User id:", user.id);
          // Credit officer: auto-fill credit officer, union will be filtered
          setFormData((prev) => ({
            ...prev,
            creditOfficer: user.id,
          }));
          setIsUnionDisabled(false); // Credit officers can select from their unions
          setIsCreditOfficerDisabled(true);
        } else if (
          userRole === UserRole.BRANCH_MANAGER ||
          userRole === "BRANCH_MANAGER" ||
          userRole === "branch_manager"
        ) {
          // Supervisor: can see all unions under their supervision
          setIsUnionDisabled(false);
          setIsCreditOfficerDisabled(false); // Allow selection but default to themselves
        } else {
          // Admin: can select both freely
          setIsUnionDisabled(false);
          setIsCreditOfficerDisabled(false);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
        toast.error("Failed to load user profile");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  // Load unions, credit officers, and document types
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load unions
        setIsLoadingBranches(true);
        const unionsResponse = await unionsApi.getAll({ limit: 1000 });
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
        setIsLoadingBranches(false);

        // Load credit officers
        console.log("Loading credit officers...");

        const creditOfficersResponse = await usersApi.getAll({
          role: "CREDIT_OFFICER",
          isActive: true,
          limit: 1000,
        });

        console.log("Credit Officers Response:", creditOfficersResponse.data);

        const creditOfficersData = creditOfficersResponse.data.success
          ? creditOfficersResponse.data.data?.users ||
          creditOfficersResponse.data.data ||
          []
          : creditOfficersResponse.data.data?.users ||
          creditOfficersResponse.data.users ||
          creditOfficersResponse.data.data ||
          creditOfficersResponse.data ||
          [];

        console.log("Credit Officers Data:", creditOfficersData);

        // Map credit officers - they're assigned to unions, not branches
        const allOfficers = creditOfficersData
          .filter(
            (officer: any) =>
              officer.role === "CREDIT_OFFICER" && officer.isActive !== false
          )
          .map((officer: any) => ({
            value: officer.id,
            label:
              officer.firstName && officer.lastName
                ? `${officer.firstName} ${officer.lastName}`
                : officer.firstName ||
                officer.lastName ||
                officer.email ||
                `Credit Officer ${officer.id.slice(-4)}`,
            role: "credit_officer",
          }));

        console.log("All Officers Combined:", allOfficers);
        setCreditOfficerOptions(allOfficers);
        setIsLoadingOfficers(false);

        // Load document types
        setIsLoadingDocumentTypes(true);
        try {
          const documentTypesResponse = await documentTypesApi.getAll();
          setDocumentTypes(
            documentTypesResponse.data.data || documentTypesResponse.data || []
          );
          setIsLoadingDocumentTypes(false);
        } catch (docError) {
          console.error("Error loading document types:", docError);
          toast.warning(
            "Could not load document types from server. Using fallback types."
          );
          // Use fallback document types
          setDocumentTypes([
            {
              id: "proof-identity",
              name: "Proof of Identity",
              code: "PROOF_ID",
            },
            {
              id: "proof-address",
              name: "Proof of Address",
              code: "PROOF_ADDR",
            },
            { id: "bank-statement", name: "Bank Statement", code: "BANK_STMT" },
            { id: "utility-bill", name: "Utility Bill", code: "UTILITY" },
            {
              id: "employment-letter",
              name: "Employment Letter",
              code: "EMPLOYMENT",
            },
            {
              id: "tax-certificate",
              name: "Tax Certificate",
              code: "TAX_CERT",
            },
          ]);
          setIsLoadingDocumentTypes(false);
        }
      } catch (error) {
        console.error("Failed to load options:", error);
        toast.error("Failed to load unions and credit officers");
        setIsLoadingOfficers(false);
        setIsLoadingBranches(false);
        setIsLoadingDocumentTypes(false);
      }
    };

    loadOptions();
  }, []);

  // Filter credit officers - for unions, credit officer is determined by union's creditOfficerId
  const filteredCreditOfficers = React.useMemo(() => {
    // Show all credit officers - the backend will handle union assignment
    return creditOfficerOptions;
  }, [creditOfficerOptions]);

  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | Date | File | null | DocumentItem[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation for date of birth
    if (field === "dateOfBirth" && value instanceof Date) {
      const exactAge = calculateAge(value);

      if (exactAge < 16) {
        setDateOfBirthError(
          "Customer must be at least 16 years old to register"
        );
      } else {
        setDateOfBirthError("");
      }
    } else if (field === "dateOfBirth" && !value) {
      setDateOfBirthError("");
    }
  };

  // Document management functions
  const addDocument = () => {
    const newDocument: DocumentItem = {
      id: Date.now().toString(),
      type: "",
      file: null,
      description: "",
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, newDocument],
    }));
  };

  const removeDocument = (documentId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }));
  };

  const updateDocument = (
    documentId: string,
    field: keyof DocumentItem,
    value: string | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === documentId ? { ...doc, [field]: value } : doc
      ),
    }));
  };

  // React Dropzone for Profile Upload
  const onDropProfile = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      handleInputChange("profile", acceptedFiles[0]);
    }
  }, []);

  const {
    getRootProps: getProfileRootProps,
    getInputProps: getProfileInputProps,
    isDragActive: isProfileDragActive,
  } = useDropzone({
    onDrop: onDropProfile,
    accept: { "image/*": [] },
    multiple: false,
  });

  const onDropDocument = useCallback(
    (acceptedFiles: File[], documentId: string) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFormData((prev) => ({
          ...prev,
          documents: prev.documents.map((doc) =>
            doc.id === documentId ? { ...doc, file } : doc
          ),
        }));
      }
    },
    []
  );

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

    // Date of birth validation - must be 16 years or older
    if (!formData.dateOfBirth) return "Date of birth is required";

    const exactAge = calculateAge(formData.dateOfBirth);

    if (exactAge < 16) {
      return "Customer must be at least 16 years old to register";
    }

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
      // Transform form data to match API expectations
      const customerData = transformFormDataToCreateCustomerDto(formData);

      // Debug: Log the data being sent
      console.log("Form data being sent:", formData);
      console.log("Transformed customer data:", customerData);

      // Prepare documents array from multiple documents
      const documents = formData.documents
        .filter((doc) => doc.file && doc.type)
        .map((doc) => ({
          type: doc.type,
          filename: doc.file!.name,
          notes: doc.description || "",
        }));

      // Prepare files for upload
      const files: { profile?: File; documents?: File[] } = {};
      if (formData.profile) {
        files.profile = formData.profile;
      }
      const documentFiles = formData.documents
        .filter((doc) => doc.file)
        .map((doc) => doc.file!);
      if (documentFiles.length > 0) {
        files.documents = documentFiles;
      }

      console.log("Files being uploaded:", files);
      console.log("Documents metadata:", documents);

      // Debug: Log what will be sent in FormData
      const debugFormData = new FormData();
      Object.keys(customerData).forEach((key) => {
        const value = (customerData as any)[key];
        if (value !== undefined && value !== null) {
          if (key === "documents" && Array.isArray(value)) {
            debugFormData.append(key, JSON.stringify(value));
          } else {
            debugFormData.append(key, value.toString());
          }
        }
      });

      console.log("FormData entries that will be sent:");
      for (let [key, value] of debugFormData.entries()) {
        console.log(`${key}:`, value);
      }

      // Create customer first
      console.log("Creating customer...");
      console.log(
        "Customer data being sent:",
        JSON.stringify(customerData, null, 2)
      );

      const customerResponse = await unionMembersApi.create(customerData);
      const createdCustomer =
        customerResponse.data.data || customerResponse.data;
      console.log("Customer created successfully:", createdCustomer);

      // Upload documents if any
      if (documents.length > 0 && documentFiles.length > 0) {
        console.log("Uploading documents...");

        // Upload each document
        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          const file = documentFiles[i];

          if (file && doc.type) {
            try {
              // Add this document to uploading set
              setUploadingDocuments((prev) => new Set(prev).add(i));

              console.log(`Uploading document ${i + 1}: ${doc.type}`);

              // doc.type is now the document type ID, not the name
              const documentTypeId = doc.type;

              // Create FormData for document upload
              const docFormData = new FormData();
              docFormData.append("file", file);
              docFormData.append("documentTypeId", documentTypeId);

              // Upload document using the document API
              const uploadResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL ||
                "https://millenium-potters.onrender.com/api"
                }/documents/union-member/${createdCustomer.id}`,
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
                const errorText = await uploadResponse.text();
                console.error(`Failed to upload document ${i + 1}:`, errorText);
                toast.error(`Failed to upload document ${i + 1}: ${errorText}`);
              } else {
                const uploadResult = await uploadResponse.json();
                console.log(
                  `Document ${i + 1} uploaded successfully:`,
                  uploadResult
                );
                console.log(
                  `Document upload response status: ${uploadResponse.status}`
                );
                console.log(
                  `Document upload response headers:`,
                  uploadResponse.headers
                );
                toast.success(`Document ${i + 1} uploaded successfully`);
              }
            } catch (docError) {
              console.error(`Error uploading document ${i + 1}:`, docError);
              toast.error(`Error uploading document ${i + 1}`);
              // Continue with other documents even if one fails
            } finally {
              // Remove this document from uploading set
              setUploadingDocuments((prev) => {
                const newSet = new Set(prev);
                newSet.delete(i);
                return newSet;
              });
            }
          }
        }
      }

      // Upload profile image if provided
      if (formData.profile) {
        try {
          console.log("Uploading profile image...");
          const profileFormData = new FormData();
          profileFormData.append("file", formData.profile);
          profileFormData.append("type", "profile");

          const profileUploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api"
            }/documents/union-member/${createdCustomer.id}/profile`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${getAccessToken()}`,
              },
              body: profileFormData,
            }
          );

          if (!profileUploadResponse.ok) {
            const errorText = await profileUploadResponse.text();
            console.error("Failed to upload profile:", errorText);
            toast.error("Customer created but profile upload failed");
          } else {
            const profileResult = await profileUploadResponse.json();
            console.log("Profile uploaded successfully:", profileResult);
            toast.success("Profile image uploaded successfully");
          }
        } catch (profileError) {
          console.error("Error uploading profile:", profileError);
          toast.error("Customer created but profile upload failed");
        }
      }

      // Show success message with document upload info
      const docCount = formData.documents.filter(
        (doc) => doc.file && doc.type
      ).length;
      if (docCount > 0) {
        toast.success(
          `Customer created successfully with ${docCount} document${docCount > 1 ? "s" : ""
          } uploaded`
        );
      } else {
        toast.success("Customer created successfully");
      }

      // Redirect to customers list
      router.push("/dashboard/business-management/customer");
    } catch (error: any) {
      console.error("Failed to create customer:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        fullResponse: error.response,
      });

      const message = error.response?.data?.message || "";
      const validationErrors = error.response?.data?.errors || [];
      const status = error.response?.status;
      const fullResponseData = error.response?.data;

      // Log the full response data for debugging
      console.log("Full response data:", fullResponseData);

      // Handle validation errors - check multiple possible locations
      if (status === 400) {
        // Check for validation errors in different possible locations
        const errors =
          validationErrors ||
          fullResponseData?.validationErrors ||
          fullResponseData?.details ||
          fullResponseData?.error?.details ||
          [];

        if (errors.length > 0) {
          const errorMessages = errors
            .map((err: any) => {
              if (typeof err === "string") return err;
              return `${err.field || err.path || "Field"}: ${err.message || err.msg || err
                }`;
            })
            .join("\n");
          toast.error(`Validation failed:\n${errorMessages}`);
          return;
        }

        // If no specific errors but we have a message, show it
        if (message && message !== "Validation failed") {
          toast.error(`Validation Error: ${message}`);
          return;
        }

        // Generic validation error
        toast.error(
          "Validation failed: Please check all required fields and try again."
        );
        return;
      }

      // Handle specific error messages
      if (message.includes("Email already exists")) {
        toast.error(
          "This email address is already registered. Please use a different email."
        );
      } else if (
        message.includes("Union not found") ||
        message.includes("branch not found")
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
      } else if (status === 400) {
        toast.error(
          `Bad Request: ${message || "Please check your input and try again."}`
        );
      } else if (status === 401) {
        toast.error("Unauthorized: Please log in again.");
      } else if (status === 403) {
        toast.error(
          "Forbidden: You don't have permission to create customers."
        );
      } else if (status === 404) {
        toast.error("Not Found: The requested resource was not found.");
      } else if (status === 500) {
        toast.error("Server Error: Please try again later.");
      } else {
        toast.error(
          `Error ${status || "Unknown"}: ${message || "Failed to create customer. Please try again."
          }`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateCustomerId = () => {
    return `#CST-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  };

  const allowedRolesForCreator = React.useMemo(() => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case UserRole.CREDIT_OFFICER:
        return ["customer"];
      case UserRole.BRANCH_MANAGER:
        return ["customer", "credit_officer"];
      case UserRole.ADMIN:
        return ["customer", "credit_officer", "branch_manager", "admin"];
      default:
        return [];
    }
  }, [currentUser]);

  // Get selected union name for display
  const selectedUnionName = React.useMemo(() => {
    if (!formData.union) return "";

    const union = unionOptions.find((u) => u.value === formData.union);
    if (union) return union.label;

    // If union options haven't loaded yet, show a loading state
    if (unionOptions.length === 0) return "Loading union...";

    // If union not found in options, show the union ID
    return `Union ${formData.union.slice(-4)}`;
  }, [formData.union, unionOptions]);

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Loading Customer Form
          </p>
          <p className="text-sm text-gray-600">
            Please wait while we load your profile and form options...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Create Customer
                </CardTitle>
                <div className="text-sm font-medium text-muted-foreground">
                  {generateCustomerId()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Union Selection */}
              <div className="space-y-2">
                <Label htmlFor="union">
                  Union <span className="text-red-500">*</span>
                </Label>
                {isUnionDisabled ? (
                  <div className="relative">
                    <Input
                      value={selectedUnionName}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const currentUserRole = currentUser?.role as string;
                          return currentUserRole === UserRole.CREDIT_OFFICER ||
                            currentUserRole === "CREDIT_OFFICER" ||
                            currentUserRole === "credit_officer"
                            ? "Auto-assigned"
                            : "Your union";
                        })()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {isLoadingBranches ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">
                          Loading unions...
                        </span>
                      </div>
                    ) : (
                      <SearchableSelect
                        options={unionOptions}
                        value={formData.union}
                        onValueChange={(val) => handleInputChange("union", val)}
                        placeholder="Select Union"
                        searchPlaceholder="Search unions..."
                      />
                    )}
                  </>
                )}
              </div>

              {/* Credit Officer Selection */}
              <div className="space-y-2">
                <Label htmlFor="creditOfficer">
                  Credit Officer <span className="text-red-500">*</span>
                </Label>
                {isCreditOfficerDisabled ? (
                  <div className="relative">
                    <Input
                      value={currentUser?.email || "Current User"}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-muted-foreground">You</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isLoadingOfficers ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">
                          Loading credit officers...
                        </span>
                      </div>
                    ) : (
                      <>
                        <SearchableSelect
                          options={filteredCreditOfficers}
                          value={formData.creditOfficer}
                          onValueChange={(val) =>
                            handleInputChange("creditOfficer", val)
                          }
                          placeholder="Select Credit Officer"
                          searchPlaceholder="Search credit officers..."
                        />
                        {formData.union && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="mr-1">ℹ️</span>
                            Credit officer will be automatically assigned based
                            on the selected union.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Enter First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Enter Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email (optional)"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Profile Upload with Dropzone */}
              <div className="space-y-2">
                <Label htmlFor="profile">Profile</Label>
                <div
                  {...getProfileRootProps()}
                  tabIndex={0}
                  className={cn(
                    "flex items-center justify-center border border-dashed rounded-md p-4 cursor-pointer transition-colors",
                    isProfileDragActive
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-300 hover:border-emerald-400",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  )}
                >
                  <input {...getProfileInputProps()} />
                  {formData.profile ? (
                    <span className="text-emerald-600 font-medium">
                      {formData.profile.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Drag & drop profile image here, or click to select file
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Date Of Birth <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (Must be 16+ years old)
                    </span>
                  </Label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.dateOfBirth}
                      onChange={(date: Date | null) =>
                        handleInputChange("dateOfBirth", date)
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
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        dateOfBirthError &&
                        "border-red-500 focus:border-red-500"
                      )}
                      wrapperClassName="w-full"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {dateOfBirthError && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {dateOfBirthError}
                    </p>
                  )}
                  {formData.dateOfBirth && !dateOfBirthError && (
                    <p className="text-sm text-green-600 flex items-center">
                      <span className="mr-1">✅</span>
                      Age: {calculateAge(formData.dateOfBirth)} years old
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      {/* <SelectItem value="other">Other</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) =>
                    handleInputChange("maritalStatus", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Marital Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Document Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Documents
                </CardTitle>
                <Button
                  type="button"
                  onClick={addDocument}
                  size="sm"
                  className="cursor-pointer flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <span>+</span>
                  <span>Add Another Document</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.documents.map((document, index) => {
                return (
                  <div
                    key={document.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">Document {index + 1}</h4>
                        {uploadingDocuments.has(index) && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-blue-600">
                              Uploading...
                            </span>
                          </div>
                        )}
                      </div>
                      {formData.documents.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeDocument(document.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                          disabled={uploadingDocuments.has(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select
                          value={document.type}
                          onValueChange={(value) =>
                            updateDocument(document.id, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Document Type" />
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
                              <>
                                <div className="p-2 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded">
                                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                                  No document types available. Using default
                                  types.
                                </div>
                                <SelectItem value="proof-identity">
                                  Proof of Identity
                                </SelectItem>
                                <SelectItem value="proof-address">
                                  Proof of Address
                                </SelectItem>
                                <SelectItem value="bank-statement">
                                  Bank Statement
                                </SelectItem>
                                <SelectItem value="utility-bill">
                                  Utility Bill
                                </SelectItem>
                                <SelectItem value="employment-letter">
                                  Employment Letter
                                </SelectItem>
                                <SelectItem value="tax-certificate">
                                  Tax Certificate
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Document File</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              updateDocument(document.id, "file", file);
                            }
                          }}
                        />
                        {document.file && (
                          <p className="text-sm text-green-600">
                            ✓ {document.file.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Enter description for this document"
                        value={document.description || ""}
                        onChange={(e) =>
                          updateDocument(
                            document.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Additional Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Additional Detail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    placeholder="Enter profession"
                    value={formData.profession}
                    onChange={(e) =>
                      handleInputChange("profession", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Enter company"
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="Enter zip code"
                    value={formData.zipCode}
                    onChange={(e) =>
                      handleInputChange("zipCode", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  placeholder="Enter notes"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 cursor-pointer"
          disabled={isLoading || uploadingDocuments.size > 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : uploadingDocuments.size > 0 ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading Documents...
            </>
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </form>
  );
}
