"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";

export function UnionMemberDetailsForm({
  formData,
  setFormData,
  unionOptions,
  creditOfficerOptions,
  loadingUnions,
  loadingOfficers,
}: any) {
  const [errors, setErrors] = useState<any>({});

  // Validation logic for required fields
  const validateField = (field: string, value: string) => {
    switch (field) {
      case "firstName":
        if (!value || value.trim().length < 2)
          return "First name must be at least 2 characters.";
        break;
      case "lastName":
        if (!value || value.trim().length < 2)
          return "Last name must be at least 2 characters.";
        break;
      case "phoneNumber":
        if (!value || value.trim().length === 0)
          return "Phone number is required.";
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format.";
        break;
      default:
        return "";
    }
    return "";
  };

  // Handle change and validate
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setErrors((prev: any) => ({
      ...prev,
      [field]: validateField(field, value),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 text-lg font-semibold text-primary">Assignment</div>
      <div className="space-y-2">
        <Label htmlFor="unionId">
          Union <span className="text-red-500">*</span>
        </Label>
        <SearchableSelect
          value={formData.union}
          onValueChange={(val: string) => handleChange("union", val)}
          placeholder={loadingUnions ? "Loading unions..." : "Select Union"}
          searchPlaceholder="Search unions..."
          options={unionOptions}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currentOfficerId">
          Credit Officer <span className="text-red-500">*</span>
        </Label>
        {formData.union === "" && (
          <p className="text-xs text-muted-foreground">
            Select a union first to view the assigned credit officer.
          </p>
        )}
        <SearchableSelect
          value={formData.creditOfficer}
          onValueChange={(val: string) => handleChange("creditOfficer", val)}
          placeholder={
            loadingOfficers
              ? "Loading credit officers..."
              : !formData.union
              ? "Select a union to continue"
              : creditOfficerOptions.length === 0
              ? "No credit officers assigned"
              : "Select Credit Officer"
          }
          searchPlaceholder="Search credit officers..."
          options={creditOfficerOptions}
        />
        {formData.union &&
          !loadingOfficers &&
          creditOfficerOptions.length === 0 && (
            <p className="text-sm text-amber-600">
              No credit officer is assigned to this union yet. Please assign a
              credit officer before adding members.
            </p>
          )}
      </div>
      <div className="mb-2 mt-6 text-lg font-semibold text-primary">
        Personal Details
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Enter First Name"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
            minLength={2}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <div className="text-xs text-destructive">{errors.firstName}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Enter Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
            minLength={2}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <div className="text-xs text-destructive">{errors.lastName}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email (optional)"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <div className="text-xs text-destructive">{errors.email}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="Enter phone number"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            required
            className={errors.phoneNumber ? "border-destructive" : ""}
          />
          {errors.phoneNumber && (
            <div className="text-xs text-destructive">{errors.phoneNumber}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Input
            id="gender"
            placeholder="Enter gender"
            value={formData.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Input
            id="maritalStatus"
            placeholder="Enter marital status"
            value={formData.maritalStatus}
            onChange={(e) => handleChange("maritalStatus", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profession">Profession</Label>
          <Input
            id="profession"
            placeholder="Enter profession"
            value={formData.profession}
            onChange={(e) => handleChange("profession", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Enter company"
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Enter city"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="Enter state"
            value={formData.state}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            placeholder="Enter country"
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            placeholder="Enter zip code"
            value={formData.zipCode}
            onChange={(e) => handleChange("zipCode", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Input
            id="note"
            placeholder="Enter note"
            value={formData.note}
            onChange={(e) => handleChange("note", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
