"use client";

import React, { useState } from "react";
import { validateDocumentFile, auth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { unionsApi, unionMembersApi, usersApi } from "@/lib/api";
import { UnionMemberDetailsForm } from "./UnionMemberDetailsForm";
import { UnionMemberDocumentsForm } from "./UnionMemberDocumentsForm";
import { UserRole } from "@/lib/enum";

export function UnionMemberCreateForm() {
  const router = useRouter();
  type DocumentItem = { file: File | null; description: string };
  const [formData, setFormData] = useState({
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
    documents: [] as DocumentItem[],
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unionOptions, setUnionOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [creditOfficerOptions, setCreditOfficerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [allCreditOfficersMap, setAllCreditOfficersMap] = useState<
    Record<string, { value: string; label: string }>
  >({});
  const [unionRecords, setUnionRecords] = useState<any[]>([]);
  const [loadingUnions, setLoadingUnions] = useState(true);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreditOfficerDisabled, setIsCreditOfficerDisabled] = useState(false);

  const formatOfficerLabel = (officer: any) => {
    if (!officer) return "Credit Officer";
    if (officer.firstName && officer.lastName) {
      return `${officer.firstName} ${officer.lastName}`;
    }
    if (officer.firstName || officer.lastName) {
      return officer.firstName || officer.lastName;
    }
    return officer.email || "Credit Officer";
  };

  const buildUnionOfficerOptions = (union: any) => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];

    const pushOfficer = (officer?: any, fallbackId?: string) => {
      const officerId = officer?.id || fallbackId;
      if (!officerId || seen.has(officerId)) return;
      const label = officer
        ? formatOfficerLabel(officer)
        : allCreditOfficersMap[officerId]?.label || "Credit Officer";
      options.push({ value: officerId, label });
      seen.add(officerId);
    };

    if (!union) return options;

    if (Array.isArray(union.creditOfficerAssignments)) {
      union.creditOfficerAssignments.forEach((assignment: any) => {
        pushOfficer(assignment?.creditOfficer, assignment?.creditOfficerId);
      });
    }

    if (Array.isArray(union.creditOfficers)) {
      union.creditOfficers.forEach((officer: any) => {
        pushOfficer(officer, officer?.id);
      });
    }

    if (union.creditOfficer) {
      pushOfficer(union.creditOfficer, union.creditOfficerId);
    }

    if (union.creditOfficerId) {
      pushOfficer(undefined, union.creditOfficerId);
    }

    return options;
  };

  // Fetch unions
  React.useEffect(() => {
    setLoadingUnions(true);
    unionsApi
      .getAll({ limit: 1000 })
      .then((res) => {
        const data = res.data;
        const unionsList = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : Array.isArray(data)
          ? data
          : [];

        const normalizedUnions = Array.isArray(unionsList) ? unionsList : [];
        setUnionRecords(normalizedUnions);
        setUnionOptions(
          normalizedUnions.map((u: any) => ({
            value: u.id,
            label: u.name || "Unnamed Union",
          }))
        );
      })
      .catch((err) => {
        setError("Failed to load unions");
      })
      .finally(() => setLoadingUnions(false));
  }, []);

  // Fetch credit officers
  React.useEffect(() => {
    setLoadingOfficers(true);
    usersApi
      .getAll({ role: "CREDIT_OFFICER", isActive: true, limit: 1000 })
      .then((res) => {
        const data = res.data;
        const officersList = data?.success
          ? data?.data?.users || data?.data || []
          : data?.data?.users || data?.data || data || [];

        const normalizedOfficers = Array.isArray(officersList)
          ? officersList
          : [];

        const lookup: Record<string, { value: string; label: string }> = {};
        normalizedOfficers.forEach((officer: any) => {
          if (!officer?.id) return;
          lookup[officer.id] = {
            value: officer.id,
            label: formatOfficerLabel(officer),
          };
        });

        setAllCreditOfficersMap(lookup);
      })
      .catch((err) => {
        setError("Failed to load credit officers");
      })
      .finally(() => setLoadingOfficers(false));
  }, []);

  // Fetch user profile and auto-select credit officer if logged-in user is a credit officer
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileResponse = await auth.profile();
        const user = profileResponse.data.data || profileResponse.data;

        // Auto-fill based on user role (with fallback for different role formats)
        const userRole = user.role as string;
        if (
          userRole === UserRole.CREDIT_OFFICER ||
          userRole === "CREDIT_OFFICER" ||
          userRole === "credit_officer"
        ) {
          setIsCreditOfficerDisabled(true);
          // Auto-select the logged-in credit officer
          setFormData((prev) => ({
            ...prev,
            creditOfficer: user.id || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Derive available credit officers whenever union selection changes
  React.useEffect(() => {
    if (!formData.union) {
      setCreditOfficerOptions([]);
      return;
    }

    const selectedUnion = unionRecords.find(
      (union) => union.id === formData.union
    );
    const options = buildUnionOfficerOptions(selectedUnion);
    setCreditOfficerOptions(options);

    if (
      formData.creditOfficer &&
      !options.some((option) => option.value === formData.creditOfficer)
    ) {
      setFormData((prev: any) => ({ ...prev, creditOfficer: "" }));
    }
  }, [
    formData.union,
    formData.creditOfficer,
    unionRecords,
    allCreditOfficersMap,
  ]);
  // Enhanced validation
  const validateForm = async () => {
    const errors: string[] = [];
    if (!formData.union) errors.push("Union is required.");
    if (!formData.creditOfficer) errors.push("Credit Officer is required.");
    if (!formData.firstName || formData.firstName.trim().length < 2)
      errors.push("First name must be at least 2 characters.");
    if (!formData.lastName || formData.lastName.trim().length < 2)
      errors.push("Last name must be at least 2 characters.");
    if (!formData.phoneNumber || formData.phoneNumber.trim().length === 0)
      errors.push("Phone number is required.");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.push("Invalid email format.");
    // Validate documents
    for (const doc of formData.documents as DocumentItem[]) {
      if (!doc.file) {
        errors.push("Each document must have a file attached.");
      } else {
        try {
          validateDocumentFile(doc.file);
        } catch (err: any) {
          errors.push(err.message);
        }
      }
    }
    // Backend email uniqueness check (simulate API call)
    if (formData.email) {
      try {
        const res = await unionMembersApi.checkEmailUnique(formData.email);
        if (!res.data.success) {
          errors.push("Email already exists.");
        }
      } catch {
        // Ignore API error, handled on submit
      }
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const errors = await validateForm();
    setValidationErrors(errors);
    if (errors.length > 0) {
      setIsSubmitting(false);
      return;
    }
    try {
      // Prepare payload for backend
      const payload = {
        unionId: formData.union,
        currentOfficerId: formData.creditOfficer,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        profession: formData.profession,
        company: formData.company,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,
        note: formData.note,
      };
      // Prepare FormData for file upload
      const formPayload = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formPayload.append(key, value as any);
        }
      });
      // Documents
      if (Array.isArray(formData.documents)) {
        formData.documents.forEach((doc: any) => {
          if (doc.file) formPayload.append("documents", doc.file);
          if (doc.description)
            formPayload.append("documentDescriptions", doc.description);
        });
      }
      // Call backend API
      const response = await unionMembersApi.create(formPayload);
      if (response.data.success) {
        toast.success("Union member created successfully");
        router.push("/dashboard/business-management/union-member");
      } else {
        throw new Error(
          response.data.message || "Failed to create union member"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create union member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Union Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Section */}
          <div className="mb-4">
            <UnionMemberDetailsForm
              formData={formData}
              setFormData={setFormData}
              unionOptions={unionOptions}
              creditOfficerOptions={creditOfficerOptions}
              loadingUnions={loadingUnions}
              loadingOfficers={loadingOfficers}
              isCreditOfficerDisabled={isCreditOfficerDisabled}
            />
          </div>
          {/* Documents Section */}
          <div className="mb-4">
            <UnionMemberDocumentsForm
              formData={formData}
              setFormData={setFormData}
            />
          </div>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <ul className="text-red-500 mt-2 list-disc pl-5">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Member"}
            </Button>
          </div>
          {/* Error Message */}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </CardContent>
      </Card>
    </form>
  );
}
