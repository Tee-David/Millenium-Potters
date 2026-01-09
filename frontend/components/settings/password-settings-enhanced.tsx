"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  CheckCircle2,
  Info,
  Lock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { settingsApi, handleDatabaseError } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRole } from "@/lib/enum";

// Password validation interface
interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
  strength: "weak" | "medium" | "strong" | "very-strong";
  score: number;
}

// Form data interface
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Validation error interface
interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function PasswordSettingsEnhanced() {
  // Form state
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Get user role from localStorage (or useAuth if available)
  let userRole = null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    userRole = user?.role || null;
  } catch {}

  // Branch managers cannot change passwords
  if (userRole === UserRole.BRANCH_MANAGER) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As a Branch Manager, you do not have permission to change
              passwords. Please contact your administrator if you need
              assistance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // UI state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(
    null
  );

  // Load last password change date from localStorage
  useEffect(() => {
    const lastChange = localStorage.getItem("lastPasswordChange");
    if (lastChange) {
      setLastPasswordChange(lastChange);
    }
  }, []);

  // Enhanced password validation with scoring
  const validatePassword = useCallback(
    (password: string): PasswordValidation => {
      const minLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      // Calculate strength score (0-5)
      let score = 0;
      if (minLength) score++;
      if (hasUpperCase) score++;
      if (hasLowerCase) score++;
      if (hasNumbers) score++;
      if (hasSpecialChar) score++;

      // Bonus for longer passwords
      if (password.length >= 12) score += 0.5;
      if (password.length >= 16) score += 0.5;

      // Determine strength level
      let strength: PasswordValidation["strength"] = "weak";
      if (score >= 6) strength = "very-strong";
      else if (score >= 5) strength = "strong";
      else if (score >= 3) strength = "medium";

      return {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
        isValid:
          minLength &&
          hasUpperCase &&
          hasLowerCase &&
          hasNumbers &&
          hasSpecialChar,
        strength,
        score: Math.min(score, 6),
      };
    },
    []
  );

  // Memoized password validation
  const passwordValidation = useMemo(
    () => validatePassword(formData.newPassword),
    [formData.newPassword, validatePassword]
  );

  // Calculate password strength percentage for progress bar
  const strengthPercentage = useMemo(() => {
    return (passwordValidation.score / 6) * 100;
  }, [passwordValidation.score]);

  // Get strength color based on validation
  const getStrengthColor = useCallback((strength: string) => {
    switch (strength) {
      case "very-strong":
        return "bg-green-500";
      case "strong":
        return "bg-blue-500";
      case "medium":
        return "bg-yellow-500";
      case "weak":
      default:
        return "bg-red-500";
    }
  }, []);

  // Get strength text color
  const getStrengthTextColor = useCallback((strength: string) => {
    switch (strength) {
      case "very-strong":
        return "text-green-600";
      case "strong":
        return "text-blue-600";
      case "medium":
        return "text-yellow-600";
      case "weak":
      default:
        return "text-red-600";
    }
  }, []);

  // Handle input change with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(
    (field: keyof typeof showPasswords) => {
      setShowPasswords((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    },
    []
  );

  // Validate form before submission
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (!passwordValidation.isValid) {
      errors.newPassword = "Password does not meet all requirements";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, passwordValidation.isValid]);

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
        await settingsApi.changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        });

        // Save last password change date
        const now = new Date().toISOString();
        localStorage.setItem("lastPasswordChange", now);
        setLastPasswordChange(now);

        toast.success("Password changed successfully!", {
          description: "Your password has been updated securely.",
        });

        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setHasUnsavedChanges(false);
        setValidationErrors({});
      } catch (error: any) {
        console.error("Failed to change password:", error);

        // Handle database errors
        if (
          handleDatabaseError(
            error,
            "Failed to change password due to database connection issues. Please try again."
          )
        ) {
          return;
        }

        // Handle specific error messages
        const message = error.response?.data?.message || "";
        if (
          message.includes("Current password is incorrect") ||
          message.includes("incorrect password")
        ) {
          setValidationErrors({
            currentPassword: "The current password you entered is incorrect",
          });
          toast.error("Current password is incorrect", {
            description: "Please check your current password and try again.",
          });
        } else if (message.includes("User not found")) {
          toast.error("User account not found", {
            description: "Please refresh the page and try again.",
          });
        } else {
          toast.error("Failed to change password", {
            description:
              message || "An unexpected error occurred. Please try again.",
          });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [formData, validateForm]
  );

  // Handle form reset
  const handleReset = useCallback(() => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setValidationErrors({});
    setHasUnsavedChanges(false);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  }, []);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return (
      formData.currentPassword &&
      formData.newPassword &&
      formData.confirmPassword &&
      passwordValidation.isValid &&
      formData.newPassword === formData.confirmPassword &&
      !isSaving
    );
  }, [formData, passwordValidation.isValid, isSaving]);

  // Format last password change date
  const formatLastChangeDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Password Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Change your password to keep your account secure
            </p>
          </div>
        </div>
        {lastPasswordChange && (
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Last password change: {formatLastChangeDate(lastPasswordChange)}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Card */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-blue-600" />
            Change Password
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Enter your current password and choose a new secure password
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Notice */}
            <Alert className="bg-yellow-50 border-yellow-200">
              <Shield className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                For your security, you will be logged out after changing your
                password and will need to log in again with your new password.
              </AlertDescription>
            </Alert>

            {/* Only show current password for admin */}
            {userRole === "ADMIN" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your current password"
                      className={`pr-10 ${
                        validationErrors.currentPassword
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {validationErrors.currentPassword && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.currentPassword}
                    </p>
                  )}
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-sm font-medium text-gray-700"
              >
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  className={`pr-10 ${
                    validationErrors.newPassword
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.newPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.newPassword}
                </p>
              )}

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password Strength:</span>
                    <span
                      className={`font-medium ${getStrengthTextColor(
                        passwordValidation.strength
                      )}`}
                    >
                      {passwordValidation.strength
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor(
                        passwordValidation.strength
                      )}`}
                      style={{ width: `${strengthPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Password Requirements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <RequirementItem
                    met={passwordValidation.minLength}
                    text="At least 8 characters"
                  />
                  <RequirementItem
                    met={passwordValidation.hasUpperCase}
                    text="One uppercase letter"
                  />
                  <RequirementItem
                    met={passwordValidation.hasLowerCase}
                    text="One lowercase letter"
                  />
                  <RequirementItem
                    met={passwordValidation.hasNumbers}
                    text="One number"
                  />
                  <RequirementItem
                    met={passwordValidation.hasSpecialChar}
                    text="One special character"
                  />
                  <RequirementItem
                    met={formData.newPassword.length >= 12}
                    text="12+ characters (recommended)"
                    optional
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  className={`pr-10 ${
                    validationErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : formData.confirmPassword &&
                        formData.newPassword === formData.confirmPassword
                      ? "border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword &&
                formData.newPassword === formData.confirmPassword &&
                !validationErrors.confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Passwords match
                  </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSaving || !hasUnsavedChanges}
                className="w-full sm:w-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing Password...
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

      {/* Security Tips */}
      <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Password Security Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                Use a unique password that you don't use for other accounts
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Avoid using personal information in your password</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                Consider using a password manager to generate and store strong
                passwords
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Change your password regularly (every 3-6 months)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Requirement Item Component
interface RequirementItemProps {
  met: boolean;
  text: string;
  optional?: boolean;
}

function RequirementItem({ met, text, optional }: RequirementItemProps) {
  return (
    <div
      className={`flex items-center gap-2 ${
        met ? "text-green-600" : optional ? "text-gray-400" : "text-gray-500"
      }`}
    >
      {met ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
      )}
      <span className="text-sm">
        {text}
        {optional && <span className="ml-1 text-xs">(optional)</span>}
      </span>
    </div>
  );
}
