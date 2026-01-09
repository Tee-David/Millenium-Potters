"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { User, Upload, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { usersApi } from "@/lib/api";
import { getSafeImageUrl } from "@/lib/image-utils";

// Safe Image Component that handles errors gracefully
function SafeImage({
  src,
  alt,
  className,
  fallbackContent,
}: {
  src: string;
  alt: string;
  className: string;
  fallbackContent: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use the safe image URL utility
  const safeImageUrl = getSafeImageUrl(src);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    console.log(`Image failed to load: ${safeImageUrl} (original: ${src})`);
  }, [src, safeImageUrl]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    console.log(`Image loaded successfully: ${safeImageUrl}`);
  }, [safeImageUrl]);

  // If no safe URL is available, show fallback immediately
  if (!safeImageUrl || hasError) {
    return <>{fallbackContent}</>;
  }

  return (
    <>
      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
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

export default function UserProfileSettings() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profileImage: null as File | null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user data
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");

        // Validate user data
        if (!userData.id) {
          console.log("User ID not found in localStorage, waiting for auth...");
          // Don't show error toast - let the auth system handle it
          return;
        }

        setCurrentUser(userData);
        console.log("Current user profile image URL:", userData.profileImage);
        console.log("Full user data:", JSON.stringify(userData, null, 2));
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          profileImage: null,
        });
      } catch (error) {
        console.error("Error loading user data:", error);
        // Don't show error toast on initial load
      }
    };

    loadCurrentUser();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      console.log("File selected:", acceptedFiles[0].name);
      setFormData((prev) => ({
        ...prev,
        profileImage: acceptedFiles[0],
      }));
    }
  }, []);

  // Create and clean up object URLs to prevent memory leaks
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (formData.profileImage) {
      const objectUrl = URL.createObjectURL(formData.profileImage);
      console.log("Created preview URL:", objectUrl);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [formData.profileImage]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [] },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate current user
    if (!currentUser?.id) {
      console.log("No current user found, cannot submit");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare form data
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };

      // Update user profile
      await usersApi.update(currentUser.id, updateData);

      // Update localStorage with new data
      const updatedUser = { ...currentUser, ...updateData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        profileImage: null,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
        <p className="text-gray-600 mt-1">
          Update your personal information and profile settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Image Upload */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </Label>
              <div
                {...getRootProps()}
                className={`w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                {formData.profileImage && previewUrl ? (
                  <div className="text-center w-full h-full">
                    <img
                      src={previewUrl}
                      alt="Selected profile image"
                      className="w-full h-full object-cover rounded-lg"
                      onLoad={() =>
                        console.log("Preview image loaded successfully")
                      }
                      onError={() =>
                        console.log("Preview image failed to load")
                      }
                    />
                  </div>
                ) : currentUser?.profileImage ? (
                  <div className="text-center">
                    <SafeImage
                      src={currentUser.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-lg"
                      fallbackContent={
                        <div className="text-center">
                          <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            Image unavailable
                          </p>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">
                      {isDragActive ? "Drop image here" : "Click or drag image"}
                    </p>
                  </div>
                )}
              </div>
              {formData.profileImage && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {formData.profileImage.name}
                </p>
              )}
            </div>

            {/* Form Inputs */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </Label>
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name
                </Label>
                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <Label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
