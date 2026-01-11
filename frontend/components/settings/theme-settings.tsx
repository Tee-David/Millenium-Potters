"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Save, RotateCcw, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ThemeColors {
  light: {
    primary: string;
    secondary: string;
  };
  dark: {
    primary: string;
    secondary: string;
  };
}

export function ThemeSettings() {
  const [colors, setColors] = useState<ThemeColors>({
    light: {
      primary: "#10b981", // emerald-500
      secondary: "#3b82f6", // blue-500
    },
    dark: {
      primary: "#34d399", // emerald-400
      secondary: "#60a5fa", // blue-400
    },
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved theme settings from localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem("themeColors");
    const savedLogo = localStorage.getItem("customLogo");
    const savedFavicon = localStorage.getItem("customFavicon");

    if (savedColors) {
      try {
        setColors(JSON.parse(savedColors));
      } catch (error) {
        console.error("Failed to parse saved colors:", error);
      }
    }

    if (savedLogo) {
      setLogo(savedLogo);
    }

    if (savedFavicon) {
      setFavicon(savedFavicon);
    }
  }, []);

  // Apply theme colors to CSS variables
  const applyThemeColors = (themeColors: ThemeColors) => {
    const root = document.documentElement;

    // Convert hex to oklch (simplified - you may want to use a proper conversion library)
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 16, g: 185, b: 129 }; // fallback to emerald
    };

    // For now, we'll use hsl format which is easier
    // You can implement proper oklch conversion later
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      return { h: h * 360, s: s * 100, l: l * 100 };
    };

    // Apply light mode colors
    const lightPrimary = hexToRgb(themeColors.light.primary);
    const lightPrimaryHsl = rgbToHsl(
      lightPrimary.r,
      lightPrimary.g,
      lightPrimary.b
    );
    const lightSecondary = hexToRgb(themeColors.light.secondary);
    const lightSecondaryHsl = rgbToHsl(
      lightSecondary.r,
      lightSecondary.g,
      lightSecondary.b
    );

    // Apply dark mode colors
    const darkPrimary = hexToRgb(themeColors.dark.primary);
    const darkPrimaryHsl = rgbToHsl(darkPrimary.r, darkPrimary.g, darkPrimary.b);
    const darkSecondary = hexToRgb(themeColors.dark.secondary);
    const darkSecondaryHsl = rgbToHsl(
      darkSecondary.r,
      darkSecondary.g,
      darkSecondary.b
    );

    // Set CSS custom properties for light mode
    root.style.setProperty(
      "--theme-primary-h",
      lightPrimaryHsl.h.toFixed(0)
    );
    root.style.setProperty(
      "--theme-primary-s",
      lightPrimaryHsl.s.toFixed(0) + "%"
    );
    root.style.setProperty(
      "--theme-primary-l",
      lightPrimaryHsl.l.toFixed(0) + "%"
    );

    root.style.setProperty(
      "--theme-secondary-h",
      lightSecondaryHsl.h.toFixed(0)
    );
    root.style.setProperty(
      "--theme-secondary-s",
      lightSecondaryHsl.s.toFixed(0) + "%"
    );
    root.style.setProperty(
      "--theme-secondary-l",
      lightSecondaryHsl.l.toFixed(0) + "%"
    );

    // Set CSS custom properties for dark mode
    root.style.setProperty(
      "--theme-dark-primary-h",
      darkPrimaryHsl.h.toFixed(0)
    );
    root.style.setProperty(
      "--theme-dark-primary-s",
      darkPrimaryHsl.s.toFixed(0) + "%"
    );
    root.style.setProperty(
      "--theme-dark-primary-l",
      darkPrimaryHsl.l.toFixed(0) + "%"
    );

    root.style.setProperty(
      "--theme-dark-secondary-h",
      darkSecondaryHsl.h.toFixed(0)
    );
    root.style.setProperty(
      "--theme-dark-secondary-s",
      darkSecondaryHsl.s.toFixed(0) + "%"
    );
    root.style.setProperty(
      "--theme-dark-secondary-l",
      darkSecondaryHsl.l.toFixed(0) + "%"
    );

    // Trigger a re-render event
    window.dispatchEvent(new CustomEvent("themeChanged"));
  };

  const handleColorChange = (
    mode: "light" | "dark",
    type: "primary" | "secondary",
    value: string
  ) => {
    setColors((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [type]: value,
      },
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        return;
      }

      // Create form data to upload to frontend/public folder
      const formData = new FormData();
      formData.append("logo", file);
      formData.append("type", "logo");

      try {
        // Upload to frontend folder via API endpoint
        const response = await fetch("/api/upload-branding", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setLogo(data.logoPath); // Use the public path
          setLogoFile(file);
        } else {
          // Fallback to base64 if API fails
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setLogo(dataUrl);
            setLogoFile(file);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        // Fallback to base64 if API fails
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setLogo(dataUrl);
          setLogoFile(file);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error("Favicon file size must be less than 500KB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFavicon(dataUrl);
        setFaviconFile(file);

        // Update favicon in the browser
        updateFavicon(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFavicon = (dataUrl: string) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((link) => link.remove());

    // Add new favicon
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = dataUrl;
    document.head.appendChild(link);

    // Also add apple-touch-icon
    const appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    appleLink.href = dataUrl;
    document.head.appendChild(appleLink);
  };

  const handleSave = () => {
    setLoading(true);

    try {
      // Save colors to localStorage
      localStorage.setItem("themeColors", JSON.stringify(colors));

      // Save logo to localStorage
      if (logo) {
        localStorage.setItem("customLogo", logo);
      }

      // Save favicon to localStorage
      if (favicon) {
        localStorage.setItem("customFavicon", favicon);
        updateFavicon(favicon);
      }

      // Apply theme colors
      applyThemeColors(colors);

      toast.success("Theme settings saved successfully");
    } catch (error) {
      console.error("Failed to save theme settings:", error);
      toast.error("Failed to save theme settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultColors: ThemeColors = {
      light: {
        primary: "#10b981",
        secondary: "#3b82f6",
      },
      dark: {
        primary: "#34d399",
        secondary: "#60a5fa",
      },
    };

    setColors(defaultColors);
    setLogo(null);
    setLogoFile(null);
    setFavicon(null);
    setFaviconFile(null);

    // Clear localStorage
    localStorage.removeItem("themeColors");
    localStorage.removeItem("customLogo");
    localStorage.removeItem("customFavicon");

    // Reset CSS variables
    applyThemeColors(defaultColors);

    // Reset favicon to default
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((link) => link.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = "/logo-favicon.png";
    document.head.appendChild(link);

    toast.success("Theme settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Theme Customization
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Customize your application's colors, logo, and branding
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Color Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Color Theme
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Set primary and secondary colors for both light and dark modes
              </p>

              {/* Light Mode Colors */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700">
                  Light Mode
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="light-primary" className="text-sm">
                      Primary Color
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="light-primary"
                        type="color"
                        value={colors.light.primary}
                        onChange={(e) =>
                          handleColorChange("light", "primary", e.target.value)
                        }
                        className="w-20 h-11 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.light.primary}
                        onChange={(e) =>
                          handleColorChange("light", "primary", e.target.value)
                        }
                        className="flex-1 h-11"
                        placeholder="#10b981"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="light-secondary" className="text-sm">
                      Secondary Color
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="light-secondary"
                        type="color"
                        value={colors.light.secondary}
                        onChange={(e) =>
                          handleColorChange("light", "secondary", e.target.value)
                        }
                        className="w-20 h-11 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.light.secondary}
                        onChange={(e) =>
                          handleColorChange("light", "secondary", e.target.value)
                        }
                        className="flex-1 h-11"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Mode Colors */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Dark Mode</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dark-primary" className="text-sm">
                      Primary Color
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="dark-primary"
                        type="color"
                        value={colors.dark.primary}
                        onChange={(e) =>
                          handleColorChange("dark", "primary", e.target.value)
                        }
                        className="w-20 h-11 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.dark.primary}
                        onChange={(e) =>
                          handleColorChange("dark", "primary", e.target.value)
                        }
                        className="flex-1 h-11"
                        placeholder="#34d399"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dark-secondary" className="text-sm">
                      Secondary Color
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="dark-secondary"
                        type="color"
                        value={colors.dark.secondary}
                        onChange={(e) =>
                          handleColorChange("dark", "secondary", e.target.value)
                        }
                        className="w-20 h-11 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors.dark.secondary}
                        onChange={(e) =>
                          handleColorChange("dark", "secondary", e.target.value)
                        }
                        className="flex-1 h-11"
                        placeholder="#60a5fa"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Application Logo
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload your company logo (max 2MB, PNG or SVG recommended)
              </p>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1">
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    {logo ? (
                      <div className="relative w-full h-full p-4">
                        <Image
                          src={logo}
                          alt="Custom logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload logo
                        </p>
                      </div>
                    )}
                  </Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>

                {logo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLogo(null);
                      setLogoFile(null);
                    }}
                    className="mt-4 md:mt-0"
                  >
                    Remove Logo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Favicon
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload your favicon (max 500KB, square image recommended)
              </p>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1">
                  <Label
                    htmlFor="favicon-upload"
                    className="cursor-pointer flex items-center justify-center h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    {favicon ? (
                      <div className="relative w-full h-full p-2">
                        <Image
                          src={favicon}
                          alt="Custom favicon"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600">Upload</p>
                      </div>
                    )}
                  </Label>
                  <Input
                    id="favicon-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                </div>

                {favicon && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFavicon(null);
                      setFaviconFile(null);
                      // Reset to default favicon
                      const existingLinks = document.querySelectorAll("link[rel*='icon']");
                      existingLinks.forEach((link) => link.remove());
                      const link = document.createElement("link");
                      link.rel = "icon";
                      link.href = "/logo-favicon.png";
                      document.head.appendChild(link);
                    }}
                    className="mt-2"
                  >
                    Remove Favicon
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              disabled={loading}
              className="border-gray-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
