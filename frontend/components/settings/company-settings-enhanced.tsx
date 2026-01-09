"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Save,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  ImagePlus,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { settingsApi, handleDatabaseError } from "@/lib/api";
import { useCompany } from "@/contexts/CompanyContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSafeImageUrl, transformImageUrl } from "@/lib/image-utils";

// Form data interface
interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Validation error interface
interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Company Logo Component
interface CompanyLogoProps {
  logoUrl: string | null;
  isUploading: boolean;
  onRemove: () => void;
}

function CompanyLogo({ logoUrl, isUploading, onRemove }: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const safeLogoUrl = useMemo(() => {
    if (!logoUrl) return null;
    return getSafeImageUrl(logoUrl);
  }, [logoUrl]);

  if (isUploading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-green-600 mb-2" />
        <p className="text-sm text-gray-600 font-medium">Uploading logo...</p>
      </div>
    );
  }

  if (safeLogoUrl && !imageError) {
    return (
      <div className="relative w-full h-full group">
        <img
          src={safeLogoUrl}
          alt="Company Logo"
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="cursor-pointer"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <ImageIcon className="w-16 h-16 text-gray-300 mb-2" />
      <p className="text-sm text-gray-500 text-center font-medium">
        No Company Logo
      </p>
      <p className="text-xs text-gray-400 mt-1">Upload a logo to display</p>
    </div>
  );
}

export function CompanySettingsEnhanced() {
  const {
    companyData,
    logo,
    updateCompanyData,
    updateLogo,
    refreshCompanyData,
  } = useCompany();

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load company settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        if (companyData) {
          setFormData({
            name: companyData.name || "",
            email: companyData.email || "",
            phone: companyData.phone || "",
            address: companyData.address || "",
          });

          if (companyData.logo || logo) {
            const currentLogo = companyData.logo || logo || "";
            // Transform localhost URL to deployed backend URL
            const transformedLogo = transformImageUrl(currentLogo);
            console.log("Loading logo - Original:", currentLogo);
            console.log("Loading logo - Transformed:", transformedLogo);
            setLogoPreview(transformedLogo);
          }
        }
      } catch (error) {
        console.error("Error loading company settings:", error);
        toast.error("Failed to load company settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [companyData, logo]);

  // Validate email format
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate phone format
  const validatePhone = useCallback((phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setHasUnsavedChanges(true);

      // Clear specific field error
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    },
    []
  );

  // Upload logo to server
  const uploadLogo = useCallback(
    async (file: File) => {
      try {
        setIsUploadingLogo(true);

        // Try backend upload first
        try {
          const response = await settingsApi.uploadFile(file, "logo");
          const logoUrl = response.data.data?.url || response.data.url;

          if (logoUrl) {
            // Transform localhost URL to deployed backend URL
            const transformedUrl = transformImageUrl(logoUrl);
            console.log("Logo uploaded - Original URL:", logoUrl);
            console.log("Logo uploaded - Transformed URL:", transformedUrl);

            updateLogo(transformedUrl);
            setLogoPreview(transformedUrl);
            toast.success("Logo uploaded successfully!");
            return;
          }
        } catch (uploadError) {
          console.warn("Backend upload failed, using fallback:", uploadError);
        }

        // Fallback to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          updateLogo(dataUrl);
          setLogoPreview(dataUrl);
          toast.success("Logo uploaded successfully!", {
            description: "Using local storage as fallback",
          });
        };
        reader.onerror = () => {
          toast.error("Failed to process logo file");
          setLogoFile(null);
          setLogoPreview(companyData?.logo || logo || "");
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error("Failed to upload logo:", error);
        toast.error("Failed to upload logo", {
          description: "Please try again or contact support",
        });
        setLogoFile(null);
        setLogoPreview(companyData?.logo || logo || "");
      } finally {
        setIsUploadingLogo(false);
      }
    },
    [companyData, logo, updateLogo]
  );

  // Handle logo file selection
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", {
          description: "Please select an image file (JPG, PNG, GIF, etc.)",
        });
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Logo size must be less than 2MB",
        });
        return;
      }

      setLogoFile(file);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // Upload immediately
      await uploadLogo(file);

      // Clean up preview URL
      return () => URL.revokeObjectURL(previewUrl);
    },
    [uploadLogo]
  );

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: isUploadingLogo,
  });

  // Remove logo
  const removeLogo = useCallback(async () => {
    try {
      setLogoFile(null);
      setLogoPreview("");
      updateLogo("");
      toast.success("Logo removed successfully!");
    } catch (error) {
      console.error("Failed to remove logo:", error);
      toast.error("Failed to remove logo");
    }
  }, [updateLogo]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Company name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Company name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number (minimum 10 digits)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateEmail, validatePhone]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (!validateForm()) {
        toast.error("Please fix the errors before submitting");
        return;
      }

      setIsSaving(true);

      try {
        const updateData = {
          ...formData,
          logo: logo || logoPreview || undefined,
        };

        await updateCompanyData(updateData);
        setHasUnsavedChanges(false);
        toast.success("Company settings updated successfully!", {
          description: "Your changes have been saved.",
        });
      } catch (error: any) {
        console.error("Failed to update company settings:", error);

        // Handle database errors
        if (
          handleDatabaseError(
            error,
            "Failed to update company settings due to database connection issues. Please try again."
          )
        ) {
          return;
        }

        toast.error("Failed to update company settings", {
          description:
            error.response?.data?.message ||
            "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [formData, logo, logoPreview, updateCompanyData, validateForm]
  );

  // Handle form reset
  const handleReset = useCallback(() => {
    setFormData({
      name: companyData?.name || "",
      email: companyData?.email || "",
      phone: companyData?.phone || "",
      address: companyData?.address || "",
    });
    setLogoPreview(companyData?.logo || logo || "");
    setLogoFile(null);
    setValidationErrors({});
    setHasUnsavedChanges(false);
  }, [companyData, logo]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      validateEmail(formData.email) &&
      (!formData.phone || validatePhone(formData.phone)) &&
      !isSaving &&
      !isUploadingLogo
    );
  }, [formData, isSaving, isUploadingLogo, validateEmail, validatePhone]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600 font-medium">
                  Loading company settings...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Company Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your company information and branding
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-green-600" />
            Company Information
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Update your organization's details and logo
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Logo Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-green-600" />
                Company Logo
              </h3>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Logo Preview */}
                <div className="flex-shrink-0 mx-auto lg:mx-0">
                  <div className="w-48 h-48 bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                    <CompanyLogo
                      logoUrl={logoPreview || logo}
                      isUploading={isUploadingLogo}
                      onRemove={removeLogo}
                    />
                  </div>
                </div>

                {/* Upload Area */}
                <div className="flex-1 space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                      isDragActive
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                    } ${
                      isUploadingLogo ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {isDragActive
                        ? "Drop logo here..."
                        : "Drag & drop logo here, or click to browse"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Recommended: 200x200px, Max 2MB
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: JPG, PNG, GIF, WebP
                    </p>
                  </div>

                  {logoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeLogo}
                      disabled={isUploadingLogo}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 w-full lg:w-auto cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Company Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className={
                        validationErrors.name
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                      disabled={isSaving}
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="company@example.com"
                      className={`pl-10 ${
                        validationErrors.email
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      disabled={isSaving}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 800 000 0000"
                      className={`pl-10 ${
                        validationErrors.phone
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      disabled={isSaving}
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Company Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter company address"
                      rows={3}
                      className={`pl-10 resize-none ${
                        validationErrors.address
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      disabled={isSaving}
                    />
                  </div>
                  {validationErrors.address && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSaving || isUploadingLogo || !hasUnsavedChanges}
                className="w-full sm:w-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Changes
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Company Branding Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Use a high-resolution logo for better display across all devices
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Square logos (1:1 aspect ratio) work best for consistency
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Keep your company information up-to-date for better
                communication
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Your company logo appears in reports, invoices, and system
                notifications
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
