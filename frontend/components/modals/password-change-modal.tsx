"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import { User } from "@/types/user"; // Changed from @/interface/interfaces

interface PasswordChangeModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (passwordData: {
    newPassword: string;
    confirmPassword: string;
  }) => void;
  loading?: boolean;
}

export function PasswordChangeModal({
  isOpen,
  user,
  onClose,
  onSubmit,
  loading = false,
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      // Reset form on successful submission
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Password change failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
    onClose();
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z\d]/.test(password)) strength++;

    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return {
          text: "Very Weak",
          color: "text-red-600",
          bgColor: "bg-red-100",
        };
      case 2:
        return {
          text: "Weak",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        };
      case 3:
        return {
          text: "Fair",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
      case 4:
        return { text: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
      case 5:
        return {
          text: "Strong",
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      default:
        return { text: "", color: "", bgColor: "" };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  // Password requirements checklist
  const requirements = [
    {
      test: (pwd: string) => pwd.length >= 8,
      text: "At least 8 characters",
    },
    {
      test: (pwd: string) => /[a-z]/.test(pwd),
      text: "Contains lowercase letter",
    },
    {
      test: (pwd: string) => /[A-Z]/.test(pwd),
      text: "Contains uppercase letter",
    },
    {
      test: (pwd: string) => /\d/.test(pwd),
      text: "Contains number",
    },
    {
      test: (pwd: string) => /[^A-Za-z\d]/.test(pwd),
      text: "Contains special character (recommended)",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {user ? `Change password for ${user.name}` : "Change user password"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-gray-700"
            >
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.trim())}
                placeholder="Enter new password"
                className={`pr-10 ${
                  errors.newPassword ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.newPassword}
              </div>
            )}

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Password Strength:
                  </span>
                  <span className={`text-xs font-medium ${strengthInfo.color}`}>
                    {strengthInfo.text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength === 1
                        ? "bg-red-500 w-1/5"
                        : passwordStrength === 2
                        ? "bg-orange-500 w-2/5"
                        : passwordStrength === 3
                        ? "bg-yellow-500 w-3/5"
                        : passwordStrength === 4
                        ? "bg-blue-500 w-4/5"
                        : passwordStrength === 5
                        ? "bg-green-500 w-full"
                        : "w-0"
                    }`}
                  />
                </div>

                {/* Password Requirements */}
                <div className="space-y-1">
                  {requirements.map((req, index) => {
                    const isValid = req.test(newPassword);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs"
                      >
                        {isValid ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                        )}
                        <span
                          className={
                            isValid ? "text-green-700" : "text-gray-500"
                          }
                        >
                          {req.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.trim())}
                placeholder="Confirm new password"
                className={`pr-10 ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.confirmPassword}
              </div>
            )}

            {/* Password Match Indicator */}
            {confirmPassword && newPassword && (
              <div className="flex items-center gap-1 text-sm">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isSubmitting || passwordStrength < 3}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              {loading || isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
