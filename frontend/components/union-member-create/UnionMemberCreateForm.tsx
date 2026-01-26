"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  CheckCircle,
  Briefcase,
  Globe,
  Plus
} from "lucide-react";
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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

import {
  unionsApi,
  unionMembersApi,
  usersApi,
  documentTypesApi,
  auth
} from "@/lib/api";
import { DocumentType } from "@/types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { COUNTRIES } from "@/lib/countries";
import { DocumentUploadItem } from "./DocumentUploadItem";

// Form Data Interface
interface CreateMemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date | null;
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

export function UnionMemberCreateForm() {
  const router = useRouter();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateMemberFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: null,
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

  const [newDocuments, setNewDocuments] = useState<NewDocument[]>([
    { type: "", file: null, notes: "" },
  ]);

  // Options State
  const [unionOptions, setUnionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [creditOfficerOptions, setCreditOfficerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  // Loading States
  const [loadingUnions, setLoadingUnions] = useState(true);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);

  // Permission States
  const [isCreditOfficerDisabled, setIsCreditOfficerDisabled] = useState(false);
  const [allCreditOfficersMap, setAllCreditOfficersMap] = useState<Record<string, { value: string; label: string }>>({});
  const [unionRecords, setUnionRecords] = useState<any[]>([]);

  // --- Helpers ---
  const formatOfficerLabel = (officer: any) => {
    if (!officer) return "Credit Officer";
    if (officer.firstName && officer.lastName) return `${officer.firstName} ${officer.lastName}`;
    return officer.email || "Credit Officer";
  };

  const calculateAge = (date: Date) => {
    const ageDifMs = Date.now() - date.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // --- Data Loading ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 1. User Profile (for role restrictions)
        const profileRes = await auth.profile();
        const user = profileRes.data.data || profileRes.data;
        if (["CREDIT_OFFICER", "credit_officer"].includes(user.role)) {
          setIsCreditOfficerDisabled(true);
          setFormData(prev => ({ ...prev, creditOfficer: user.id || "" }));
        }

        // 2. Unions
        setLoadingUnions(true);
        const unionsRes = await unionsApi.getAll({ limit: 1000 });
        const unionsList = unionsRes.data.data || [];
        setUnionRecords(unionsList);
        setUnionOptions(unionsList.map((u: any) => ({ value: u.id, label: u.name || "Unnamed Union" })));
        setLoadingUnions(false);

        // 3. Document Types
        setLoadingDocTypes(true);
        const docTypesRes = await documentTypesApi.getAll();
        setDocumentTypes(docTypesRes.data.data || []);
        setLoadingDocTypes(false);

        // 4. All Credit Officers (for lookup)
        setLoadingOfficers(true);
        const officersRes = await usersApi.getAll({ role: "CREDIT_OFFICER", isActive: true, limit: 1000 });
        const officersList = officersRes.data.data?.users || [];
        const lookup: Record<string, any> = {};
        officersList.forEach((off: any) => {
          if (off.id) lookup[off.id] = { value: off.id, label: formatOfficerLabel(off) };
        });
        setAllCreditOfficersMap(lookup);
        setLoadingOfficers(false);

      } catch (error) {
        console.error("Failed to load initial data", error);
        toast.error("Failed to load form data. Please refresh.");
      }
    };
    loadInitialData();
  }, []);

  // Filter Credit Officers when Union Changes
  useEffect(() => {
    if (!formData.union) {
      setCreditOfficerOptions([]);
      return;
    }

    // Logic to extract assigned officers from the union record
    const selectedUnion = unionRecords.find(u => u.id === formData.union);
    if (!selectedUnion) return;

    const officerIds = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];

    const addOption = (id: string, label?: string) => {
      if (!id || officerIds.has(id)) return;
      officerIds.add(id);
      options.push({ value: id, label: label || allCreditOfficersMap[id]?.label || "Unknown Officer" });
    };

    // Check assignments
    selectedUnion.creditOfficerAssignments?.forEach((a: any) => addOption(a.creditOfficerId, formatOfficerLabel(a.creditOfficer)));
    selectedUnion.creditOfficers?.forEach((o: any) => addOption(o.id, formatOfficerLabel(o)));
    if (selectedUnion.creditOfficerId) addOption(selectedUnion.creditOfficerId, formatOfficerLabel(selectedUnion.creditOfficer));

    setCreditOfficerOptions(options);

    // Clear selected officer if not in the new list (unless disabled due to role)
    if (!isCreditOfficerDisabled && formData.creditOfficer && !officerIds.has(formData.creditOfficer)) {
      setFormData(prev => ({ ...prev, creditOfficer: "" }));
    }
  }, [formData.union, unionRecords, allCreditOfficersMap, isCreditOfficerDisabled]);

  // --- Handlers ---
  const handleInputChange = (field: keyof CreateMemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Document Handlers
  const onDrop = useCallback((index: number, acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      setNewDocuments(prev => {
        const copy = [...prev];
        copy[index].file = acceptedFiles[0];
        return copy;
      });
    }
  }, []);

  const handleUpdateDoc = (index: number, field: keyof NewDocument, value: any) => {
    setNewDocuments(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // --- Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: string[] = [];
    if (!formData.firstName) errors.push("First Name is required");
    if (!formData.lastName) errors.push("Last Name is required");
    if (!formData.phoneNumber) errors.push("Phone Number is required");
    if (!formData.union) errors.push("Union is required");
    if (!formData.creditOfficer) errors.push("Credit Officer is required");
    // Date of Birth is optional now, but if provided, check age
    if (formData.dateOfBirth && calculateAge(formData.dateOfBirth) < 16) errors.push("Member must be at least 16 years old");

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare Payload
      const formPayload = new FormData();

      // Basic Fields
      // Basic Fields
      formPayload.append("unionId", formData.union);
      formPayload.append("currentOfficerId", formData.creditOfficer);
      formPayload.append("firstName", formData.firstName);
      formPayload.append("lastName", formData.lastName);
      formPayload.append("phone", formData.phoneNumber);

      if (formData.email) formPayload.append("email", formData.email);
      if (formData.dateOfBirth) formPayload.append("dateOfBirth", formData.dateOfBirth.toISOString());
      if (formData.gender) formPayload.append("gender", formData.gender);
      if (formData.maritalStatus) formPayload.append("maritalStatus", formData.maritalStatus);

      if (formData.address) formPayload.append("address", formData.address);
      if (formData.city) formPayload.append("city", formData.city);
      if (formData.state) formPayload.append("state", formData.state);
      if (formData.country) formPayload.append("country", formData.country);
      if (formData.zipCode) formPayload.append("zipCode", formData.zipCode);
      if (formData.profession) formPayload.append("profession", formData.profession);
      if (formData.company) formPayload.append("company", formData.company);
      if (formData.note) formPayload.append("note", formData.note);

      // Documents (Upload as part of creation)
      newDocuments.forEach((doc) => {
        if (doc.file && doc.type) {
          formPayload.append("documents", doc.file);
          // We need a way to map files to types if the backend supports it.
          // Based on previous code, it supported "documentDescriptions".
          // If backend only takes 'documents' array, we might lose the type info if created in one go.
          // However, for consistency with the *nice* form, let's treat it as a bundled upload.
          // If the backend expects specific keys, we might need adjustments.
          // Assuming the backend handles the multipart array.

          // CRITICAL: The previous form appended "documentDescriptions". 
          // We will append the TYPE ID as the description for now to ensure some metadata flows through, 
          // or ideally, we should split the upload if the backend requires strict type association per file.
          formPayload.append("documentDescriptions", `Type: ${doc.type} | Notes: ${doc.notes || ''}`);
        }
      });

      // 2. Submit
      const response = await unionMembersApi.create(formPayload);

      if (response.data.success) {
        toast.success("Union Member created successfully!");
        router.push("/dashboard/business-management/union-member");
      } else {
        throw new Error(response.data.message || "Creation failed");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* Header Info */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Union Member</h1>
        <p className="text-gray-500">Fill in the details below to register a new member.</p>
      </div>

      {/* 1. Assignment Details */}
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Building className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2">
            <Label>Union <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={unionOptions}
              value={formData.union}
              onValueChange={(val) => handleInputChange("union", val)}
              placeholder="Select Union"
              searchPlaceholder="Search unions..."
            />
          </div>
          <div className="space-y-2">
            <Label>Credit Officer <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={creditOfficerOptions}
              value={formData.creditOfficer}
              onValueChange={(val) => handleInputChange("creditOfficer", val)}
              placeholder="Select Officer"
              searchPlaceholder="Search officers..."
              disabled={isCreditOfficerDisabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Personal Information */}
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2">
            <Label>First Name <span className="text-red-500">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="John"
                value={formData.firstName}
                onChange={e => handleInputChange("firstName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Last Name <span className="text-red-500">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Doe"
                value={formData.lastName}
                onChange={e => handleInputChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={e => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone Number <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="0902 123 4567"
                value={formData.phoneNumber}
                onChange={e => handleInputChange("phoneNumber", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Date of Birth <span className="text-xs font-normal text-muted-foreground ml-1">(Must be at least 16 years old - Optional)</span>
            </Label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-10 w-10 flex items-center justify-center pointer-events-none z-10">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <DatePicker
                selected={formData.dateOfBirth}
                onChange={(date) => handleInputChange("dateOfBirth", date)}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholderText="Select date"
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(val) => handleInputChange("gender", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select value={formData.maritalStatus} onValueChange={(val) => handleInputChange("maritalStatus", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MARRIED">Married</SelectItem>
                  <SelectItem value="DIVORCED">Divorced</SelectItem>
                  <SelectItem value="WIDOWED">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Address & Reference */}
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            Address & Professional Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2 md:col-span-2">
            <Label>Street Address</Label>
            <Input
              placeholder="123 Main St"
              value={formData.address}
              onChange={e => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Input
              placeholder="City"
              value={formData.city}
              onChange={e => handleInputChange("city", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <Input
              placeholder="State"
              value={formData.state}
              onChange={e => handleInputChange("state", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <SearchableSelect
              options={COUNTRIES}
              value={formData.country}
              onValueChange={(val) => handleInputChange("country", val)}
              placeholder="Select Country"
              searchPlaceholder="Search countries..."
            />
          </div>

          <div className="space-y-2">
            <Label>Zip Code</Label>
            <Input
              placeholder="Zip Code"
              value={formData.zipCode}
              onChange={e => handleInputChange("zipCode", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Profession</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Software Engineer"
                value={formData.profession}
                onChange={e => handleInputChange("profession", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Company Name"
                value={formData.company}
                onChange={e => handleInputChange("company", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Internal Note (Optional)</Label>
            <Textarea
              placeholder="Add any additional notes here..."
              value={formData.note}
              onChange={e => handleInputChange("note", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Documents */}
      <Card>
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setNewDocuments([...newDocuments, { type: "", file: null, notes: "" }])}>
            <Plus className="h-4 w-4 mr-2" />
            Add Another Document
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {newDocuments.map((doc, index) => (
            <DocumentUploadItem
              key={index}
              doc={doc}
              index={index}
              onDrop={onDrop}
              onTypeChange={(idx, val) => handleUpdateDoc(idx, "type", val)}
              onNotesChange={(idx, val) => handleUpdateDoc(idx, "notes", val)}
              onRemove={(idx) => setNewDocuments(prev => prev.filter((_, i) => i !== idx))}
              documentTypes={documentTypes}
              isLoadingDocumentTypes={loadingDocTypes}
            />
          ))}
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/business-management/union-member")}
          className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Member
            </>
          )}
        </Button>
      </div>

    </form>
  );
}
