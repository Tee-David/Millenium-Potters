"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Save,
  Loader2,
  Key,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { settingsApi, handleDatabaseError } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRole } from "@/lib/enum";

export function PasswordSettings() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid:
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!formData.newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("New password does not meet requirements");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsLoading(true);

    try {
      await settingsApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Password changed successfully");

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Failed to change password:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to change password due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      const message = error.response?.data?.message || "";
      if (message.includes("Current password is incorrect")) {
        toast.error(
          "The current password you entered is incorrect. Please try again."
        );
      } else if (message.includes("User not found")) {
        toast.error("User account not found. Please refresh and try again.");
      } else {
        toast.error(message || "Failed to change password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get user role from localStorage (or useAuth if available)
  let userRole = null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    userRole = user?.role || null;
  } catch {}

  // Branch managers cannot change passwords
  if (userRole === UserRole.BRANCH_MANAGER) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Change your account password for enhanced security
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              As a Branch Manager, you do not have permission to change
              passwords. Please contact an administrator for password
              assistance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Password Settings
        </CardTitle>
        <p className="text-sm text-gray-600">
          Change your account password for enhanced security
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Only show current password for admin */}
          {userRole === "ADMIN" && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          {userRole === "ADMIN" && <Separator />}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {formData.newPassword && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Password Requirements
              </h4>
              <div className="space-y-2 text-sm">
                <div
                  className={`flex items-center gap-2 ${
                    passwordValidation.minLength
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      passwordValidation.minLength
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    passwordValidation.hasUpperCase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      passwordValidation.hasUpperCase
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    passwordValidation.hasLowerCase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      passwordValidation.hasLowerCase
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  One lowercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    passwordValidation.hasNumbers
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      passwordValidation.hasNumbers
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  One number
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    passwordValidation.hasSpecialChar
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      passwordValidation.hasSpecialChar
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  One special character
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {formData.confirmPassword &&
              formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !passwordValidation.isValid ||
                formData.newPassword !== formData.confirmPassword
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
