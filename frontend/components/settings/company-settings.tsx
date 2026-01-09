"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { settingsApi, handleDatabaseError } from "@/lib/api";
import { useCompany } from "@/contexts/CompanyContext";

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
}

export function CompanySettings() {
  const {
    companyData,
    logo,
    updateCompanyData,
    updateLogo,
    refreshCompanyData,
  } = useCompany();

  const [formData, setFormData] = useState<CompanySettings>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load company settings on mount
  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        address: companyData.address || "",
      });

      if (companyData.logo) {
        setLogoPreview(companyData.logo);
      }
    }
  }, [companyData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo size must be less than 2MB");
        return;
      }

      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // Upload logo immediately
      await uploadLogo(file);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      setIsUploadingLogo(true);

      // Try backend upload first
      try {
        const response = await settingsApi.uploadFile(file, "logo");
        const logoUrl = response.data.data?.url || response.data.url;

        if (logoUrl) {
          updateLogo(logoUrl);
          toast.success("Logo uploaded successfully!");
          return;
        }
      } catch (uploadError) {
        console.warn("Backend upload failed, using fallback:", uploadError);
      }

      // Fallback to data URL if backend upload fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateLogo(dataUrl);
        toast.success(
          "Logo uploaded successfully! (Using local storage - backend upload endpoint needs to be implemented)"
        );
      };
      reader.onerror = () => {
        toast.error("Failed to process logo file.");
        setLogoFile(null);
        setLogoPreview(companyData?.logo || "");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo. Please try again.");
      // Reset preview on error
      setLogoFile(null);
      setLogoPreview(companyData?.logo || "");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    try {
      setLogoFile(null);
      setLogoPreview("");
      updateLogo("");
      toast.success("Logo removed successfully!");
    } catch (error) {
      console.error("Failed to remove logo:", error);
      toast.error("Failed to remove logo. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email address is required");
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const updateData = {
        ...formData,
        logo: logo || undefined,
      };

      await updateCompanyData(updateData);
      toast.success("Company settings updated successfully");
    } catch (error: any) {
      console.error("Failed to update company settings:", error);

      if (
        handleDatabaseError(
          error,
          "Failed to update company settings due to database connection issues. Please try again."
        )
      ) {
        return;
      }

      toast.error(
        error.response?.data?.message || "Failed to update company settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!companyData) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading company settings...</p>
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
          <Building2 className="w-5 h-5" />
          Company Settings
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage your company information and preferences
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter company address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Logo Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Company Logo
              </h3>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
                    {isUploadingLogo ? (
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Uploading...</p>
                      </div>
                    ) : logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 text-center">
                          No logo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <Label
                      htmlFor="logo"
                      className="text-sm font-medium text-gray-700"
                    >
                      Upload Logo
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={isUploadingLogo}
                        className="w-full"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended size: 200x200px, Max size: 2MB. Supported
                      formats: JPG, PNG, GIF
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        disabled={isUploadingLogo}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Logo
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* <Separator /> */}

            {/* Currency & Formatting */}
            {/* <div> */}
            {/* <h3 className="text-lg font-medium text-gray-900 mb-4">
                Currency & Formatting
              </h3> */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      handleSelectChange("currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    name="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={handleInputChange}
                    placeholder="₦"
                    maxLength={3}
                  />
                </div> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={formData.dateFormat}
                    onValueChange={(value) =>
                      handleSelectChange("dateFormat", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={formData.timeFormat}
                    onValueChange={(value) =>
                      handleSelectChange("timeFormat", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hour (14:30)</SelectItem>
                      <SelectItem value="12h">12 Hour (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      handleSelectChange("timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Lagos">
                        Africa/Lagos (GMT+1)
                      </SelectItem>
                      <SelectItem value="Africa/Abuja">
                        Africa/Abuja (GMT+1)
                      </SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York (GMT-5)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
            {/* </div> */}
            {/* </div> */}

            {/* <Separator /> */}

            {/* Document Prefixes */}
            {/* <div> */}
            {/* <h3 className="text-lg font-medium text-gray-900 mb-4">
                Document Prefixes
              </h3> */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    name="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={handleInputChange}
                    placeholder="INV-"
                  />
                </div> */}
            {/* <div className="space-y-2">
                  <Label htmlFor="expensePrefix">Expense Prefix</Label>
                  <Input
                    id="expensePrefix"
                    name="expensePrefix"
                    value={formData.expensePrefix}
                    onChange={handleInputChange}
                    placeholder="EXP-"
                  />
                </div> */}
            {/* </div> */}
            {/* </div> */}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: companyData?.name || "",
                  email: companyData?.email || "",
                  phone: companyData?.phone || "",
                  address: companyData?.address || "",
                });
                setLogoPreview(companyData?.logo || "");
                setLogoFile(null);
              }}
              disabled={isLoading || isUploadingLogo}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploadingLogo}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
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
