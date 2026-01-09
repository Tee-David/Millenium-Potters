"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomizationModalProps {
  showCustomization: boolean;
  setShowCustomization: (show: boolean) => void;
  customizationSettings: any;
  updateCustomizationSetting: (key: string, value: any) => void;
  resetCustomizationSettings: () => void;
}

export default function CustomizationModal({
  showCustomization,
  setShowCustomization,
  customizationSettings,
  updateCustomizationSetting,
  resetCustomizationSettings,
}: CustomizationModalProps) {
  if (!showCustomization) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Customize Dashboard
            </h2>
            <button
              onClick={() => setShowCustomization(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Widget Visibility */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Widget Visibility
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "showMetrics",
                  label: "Key Metrics",
                  description: "Show performance indicators",
                },
                {
                  key: "showCharts",
                  label: "Analytics Charts",
                  description: "Show loan approval trends and distributions",
                },
                {
                  key: "showRecentActivities",
                  label: "Recent Activities",
                  description: "Show latest system activities",
                },
                {
                  key: "showTopBranches",
                  label: "Top Branches",
                  description: "Show branch performance rankings",
                },
                {
                  key: "showLoanTypes",
                  label: "Loan Types",
                  description: "Show loan type distribution",
                },
              ].map((widget) => (
                <div
                  key={widget.key}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {widget.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {widget.description}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        customizationSettings[
                          widget.key as keyof typeof customizationSettings
                        ] as boolean
                      }
                      onChange={(e) =>
                        updateCustomizationSetting(widget.key, e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Layout Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Layout Options
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Compact Mode</div>
                  <div className="text-sm text-gray-500">
                    Reduce spacing and padding for more content
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizationSettings.compactMode}
                    onChange={(e) =>
                      updateCustomizationSetting(
                        "compactMode",
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Auto-refresh Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Auto-refresh Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Auto-refresh</div>
                  <div className="text-sm text-gray-500">
                    Automatically update dashboard data
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizationSettings.autoRefresh}
                    onChange={(e) =>
                      updateCustomizationSetting(
                        "autoRefresh",
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {customizationSettings.autoRefresh && (
                <div className="p-3 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Refresh Interval (seconds)
                  </label>
                  <select
                    value={customizationSettings.refreshInterval / 1000}
                    onChange={(e) =>
                      updateCustomizationSetting(
                        "refreshInterval",
                        parseInt(e.target.value) * 1000
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <Button
            variant="outline"
            onClick={resetCustomizationSettings}
            className="text-gray-600 border-gray-300"
          >
            Reset to Default
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCustomization(false)}
              className="text-gray-600 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowCustomization(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
