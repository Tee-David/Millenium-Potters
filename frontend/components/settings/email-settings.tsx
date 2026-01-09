"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TestTube, Eye, EyeOff, Save, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { settingsApi, handleDatabaseError } from "@/lib/api";

export function EmailSettings() {
  const [formData, setFormData] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    smtpEncryption: "tls",
    fromEmail: "",
    fromName: "",
    enabled: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  // Load email settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingData(true);
        const response = await settingsApi.getEmailSettings();
        const settings = response.data.data || response.data;
        setFormData(settings);
      } catch (error: any) {
        console.error("Failed to load email settings:", error);

        if (
          handleDatabaseError(
            error,
            "Failed to load email settings due to database connection issues. Please try again."
          )
        ) {
          return;
        }

        toast.error("Failed to load email settings");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      await settingsApi.testEmailSettings(formData);
      toast.success("Test email sent successfully!");
    } catch (error: any) {
      console.error("Failed to send test email:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to send test email due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Failed to send test email. Please check your settings."
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await settingsApi.updateEmailSettings(formData);
      toast.success("Email settings updated successfully");
    } catch (error: any) {
      console.error("Failed to update email settings:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to update email settings due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      toast.error(
        error.response?.data?.message || "Failed to update email settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading email settings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email SMTP Settings
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure your email server settings for sending notifications
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600">
                Enable or disable email notifications
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          <Separator />

          {/* SMTP Configuration */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                SMTP Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host *</Label>
                  <Input
                    id="smtpHost"
                    name="smtpHost"
                    value={formData.smtpHost}
                    onChange={handleInputChange}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port *</Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    value={formData.smtpPort}
                    onChange={handleInputChange}
                    placeholder="587"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpEncryption">Encryption</Label>
                  <Select
                    value={formData.smtpEncryption}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        smtpEncryption: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Username *</Label>
                  <Input
                    id="smtpUsername"
                    name="smtpUsername"
                    value={formData.smtpUsername}
                    onChange={handleInputChange}
                    placeholder="your-email@gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Password *</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      name="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.smtpPassword}
                      onChange={handleInputChange}
                      placeholder="Your email password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* From Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                From Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email *</Label>
                  <Input
                    id="fromEmail"
                    name="fromEmail"
                    type="email"
                    value={formData.fromEmail}
                    onChange={handleInputChange}
                    placeholder="noreply@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name *</Label>
                  <Input
                    id="fromName"
                    name="fromName"
                    value={formData.fromName}
                    onChange={handleInputChange}
                    placeholder="Company Name"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Email */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-medium text-blue-900">
                  Test Email Configuration
                </h4>
                <p className="text-sm text-blue-700">
                  Send a test email to verify your settings
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestEmail}
                disabled={isTesting || !formData.enabled}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
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
  );
}
