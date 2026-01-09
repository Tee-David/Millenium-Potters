"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  User,
  Upload,
  Loader2,
  Save,
  RotateCcw,
  Camera,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  UserCircle,
  X,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth, usersApi } from "@/lib/api";
import { getSafeImageUrl } from "@/lib/image-utils";

// Types
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profileImage: File | null;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
}

// Safe Image Component with enhanced error handling
function ProfileImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const safeImageUrl = getSafeImageUrl(src);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (!safeImageUrl || hasError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center`}
      >
        <UserCircle className="w-16 h-16 text-white" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className={`${className} bg-gray-100 flex items-center justify-center`}
        >
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      )}
      <img
        src={safeImageUrl}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: isLoading ? "none" : "block" }}
      />
    </>
  );
}

export default function UserProfileSettingsEnhanced() {
  // State management
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profileImage: null,
  });

  const [originalData, setOriginalData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profileImage: null,
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load current user data
  useEffect(() => {
    const loadCurrentUser = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Try to fetch from backend first
        const response = await auth.profile();
        const userData = response.data.data;

        if (!userData || !userData.id) {
          throw new Error("Invalid user data received");
        }

        setCurrentUser(userData);

        const initialData = {
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          profileImage: null,
        };

        setFormData(initialData);
        setOriginalData(initialData);

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error: any) {
        console.error("Error loading user data from backend:", error);

        // Fallback to localStorage - don't show error if localStorage works
        try {
          const localData = localStorage.getItem("user");
          if (localData) {
            const userData = JSON.parse(localData);
            if (userData.id) {
              setCurrentUser(userData);
              const initialData = {
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: userData.email || "",
                phone: userData.phone || "",
                address: userData.address || "",
                profileImage: null,
              };
              setFormData(initialData);
              setOriginalData(initialData);
              // Successfully loaded from localStorage, no error to show
            } else {
              setLoadError("User session not found. Please log in again.");
            }
          } else {
            setLoadError("Unable to load user profile. Please log in again.");
          }
        } catch (localError) {
          console.error("Error loading from localStorage:", localError);
          setLoadError("Failed to load user data. Please refresh the page.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      // Email is read-only, so don't check it for changes
      formData.phone !== originalData.phone ||
      formData.address !== originalData.address ||
      formData.profileImage !== null;

    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  // Manage preview URL
  useEffect(() => {
    if (formData.profileImage) {
      const objectUrl = URL.createObjectURL(formData.profileImage);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [formData.profileImage]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation removed - email is read-only

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.profileImage) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(formData.profileImage.type)) {
        newErrors.profileImage =
          "Please upload a valid image file (JPEG, PNG, GIF, or WebP)";
      } else if (formData.profileImage.size > 5 * 1024 * 1024) {
        newErrors.profileImage = "Image size must be less than 5MB";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === "file-too-large") {
        toast.error("Image size must be less than 5MB");
      } else if (error.code === "file-invalid-type") {
        toast.error("Please upload a valid image file");
      } else {
        toast.error("Invalid file");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        profileImage: acceptedFiles[0],
      }));
      setErrors((prev) => ({ ...prev, profileImage: undefined }));
      toast.success("Image selected successfully");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Remove selected image
  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      profileImage: null,
    }));
    toast.info("Image removed");
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!currentUser?.id) {
      toast.error("User session not found. Please log in again.");
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);

    try {
      // Prepare update data - exclude email (read-only)
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      };

      // Update profile with or without image
      let response;
      if (formData.profileImage) {
        setIsUploadingImage(true);
        response = await auth.updateProfile(
          currentUser.id,
          updateData,
          formData.profileImage
        );
      } else {
        response = await usersApi.update(currentUser.id, updateData);
      }

      // Fetch fresh profile data from server to ensure we have the latest
      const freshProfileResponse = await auth.profile();
      const freshUserData = freshProfileResponse.data.data;

      if (!freshUserData || !freshUserData.id) {
        throw new Error("Failed to refresh profile data");
      }

      // Update state and localStorage with fresh data
      setCurrentUser(freshUserData);
      localStorage.setItem("user", JSON.stringify(freshUserData));

      // Reset form state with fresh data
      const newOriginalData = {
        firstName: freshUserData.firstName || "",
        lastName: freshUserData.lastName || "",
        email: freshUserData.email || "",
        phone: freshUserData.phone || "",
        address: freshUserData.address || "",
        profileImage: null,
      };
      setOriginalData(newOriginalData);
      setFormData(newOriginalData);
      setHasUnsavedChanges(false);

      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData(originalData);
    setErrors({});
    setHasUnsavedChanges(false);
    toast.info("Changes discarded");
  };

  // Display name computation
  const displayName = useMemo(() => {
    if (currentUser) {
      const firstName = currentUser.firstName || formData.firstName;
      const lastName = currentUser.lastName || formData.lastName;
      return `${firstName} ${lastName}`.trim() || "User";
    }
    return "User";
  }, [currentUser, formData.firstName, formData.lastName]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Profile Settings
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage your personal information and preferences
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
              {currentUser?.role || "User"}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Section */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-600" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a professional photo (Max 5MB, JPG/PNG/GIF/WebP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Current/Preview Image */}
              <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-green-100 shadow-lg">
                  {formData.profileImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : currentUser?.profileImage ? (
                    <ProfileImage
                      src={currentUser.profileImage}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <UserCircle className="w-20 h-20 text-white" />
                    </div>
                  )}
                </div>
                {formData.profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1 w-full">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? "border-green-500 bg-green-50 scale-[1.02]"
                      : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-700">
                        {isDragActive
                          ? "Drop your image here"
                          : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        JPG, PNG, GIF or WebP (Max 5MB)
                      </p>
                    </div>
                    {formData.profileImage && (
                      <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {formData.profileImage.name}
                      </div>
                    )}
                  </div>
                </div>
                {errors.profileImage && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.profileImage}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Section */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-green-600" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700"
                >
                  First Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className={`pl-10 ${
                      errors.firstName ? "border-red-500" : ""
                    }`}
                    required
                    disabled={isSaving}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.firstName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className={`pl-10 ${
                      errors.lastName ? "border-red-500" : ""
                    }`}
                    required
                    disabled={isSaving}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.lastName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500">
                    (read-only)
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    placeholder="your.email@example.com"
                    className="pl-10 bg-gray-50 cursor-not-allowed"
                    disabled
                    title="Email cannot be changed"
                    aria-label="Email address (read-only)"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">
                  Email addresses cannot be changed. Contact an administrator if
                  you need to update your email.
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone Number
                </Label>
                <div className="relative">
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                    disabled={isSaving}
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-medium text-gray-700"
                >
                  Address
                </Label>
                <div className="relative">
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full address"
                    className={`pl-10 min-h-[100px] resize-none ${
                      errors.address ? "border-red-500" : ""
                    }`}
                    disabled={isSaving}
                  />
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
                {errors.address && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.address}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm p-4 border-t border-gray-200 -mx-4 sm:-mx-0 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:border-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || !hasUnsavedChanges}
            className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Discard Changes
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !hasUnsavedChanges}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isUploadingImage ? "Uploading Image..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Additional Info Card */}
      <Card className="bg-blue-50 border-blue-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">Profile Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Use a clear, professional photo for better recognition</li>
                <li>Keep your contact information up to date</li>
                <li>
                  Changes are saved immediately after clicking "Save Changes"
                </li>
                <li>Your email is used for important account notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
