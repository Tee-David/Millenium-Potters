"use client";

import { useState, useEffect } from "react";
import { backupApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Database,
  Download,
  Upload,
  Clock,
  Trash2,
  Shield,
  HardDrive,
  Cloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  FileArchive,
} from "lucide-react";
import { toast } from "sonner";

interface BackupRecord {
  id: string;
  filename: string;
  fileSize: number;
  type: "manual" | "scheduled";
  status: "completed" | "failed" | "in_progress";
  location: "local" | "cloud" | "both";
  cloudinaryUrl?: string;
  localPath?: string;
  createdAt: string;
  recordCounts?: Record<string, number>;
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function DataManagement() {
  // System Reset State
  const [resetStep, setResetStep] = useState(0);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Backup State
  const [backupSchedule, setBackupSchedule] = useState("weekly");
  const [backupLocation, setBackupLocation] = useState("cloud");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);
  const [scheduleSettings, setScheduleSettings] = useState<any>(null);

  // Fetch backup history and schedule settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingBackups(true);
        const [backupsRes, scheduleRes] = await Promise.all([
          backupApi.list(),
          backupApi.getScheduleSettings(),
        ]);

        if (backupsRes.data?.success) {
          setBackupHistory(backupsRes.data.data || []);
        }

        if (scheduleRes.data?.success) {
          const settings = scheduleRes.data.data;
          setScheduleSettings(settings);
          setBackupSchedule(settings.frequency || "disabled");
          setBackupLocation(settings.location || "cloud");
        }
      } catch (error) {
        console.error("Failed to fetch backup data:", error);
      } finally {
        setIsLoadingBackups(false);
      }
    };

    fetchData();
  }, []);

  // Restore State
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");

  // Reset Step 1 - Initial Warning
  const handleResetStep1 = () => {
    setResetStep(1);
  };

  // Reset Step 2 - Second Confirmation
  const handleResetStep2 = () => {
    setResetStep(2);
  };

  // Reset Step 3 - Final Confirmation with typing
  const handleResetStep3 = () => {
    setResetStep(3);
  };

  // Execute Reset
  const handleExecuteReset = async () => {
    if (resetConfirmText !== "DELETE") {
      toast.error("Please type 'DELETE' exactly to confirm");
      return;
    }

    setIsResetting(true);

    try {
      const response = await backupApi.resetSystem("DELETE");

      if (response.data?.success) {
        toast.success("System has been reset successfully", {
          description: "You will be redirected to login. Use SuperAdmin credentials.",
          duration: 5000,
        });

        // Clear local storage and redirect to login
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(response.data?.message || "System reset failed");
      }
    } catch (error: any) {
      console.error("System reset error:", error);
      toast.error(error.response?.data?.message || "System reset failed");
    } finally {
      setIsResetting(false);
      setResetStep(0);
      setResetConfirmText("");
    }
  };

  const closeResetDialog = () => {
    setResetStep(0);
    setResetConfirmText("");
  };

  // Backup Functions
  const handleManualBackup = async () => {
    setIsBackingUp(true);

    try {
      const response = await backupApi.create({
        includeAuditLogs: false,
        includeSessions: false,
        location: backupLocation as "local" | "cloud" | "both",
      });

      if (response.data?.success) {
        toast.success("Backup created successfully!", {
          description: "Your backup file is ready for download.",
        });

        // Refresh backup list
        const backupsRes = await backupApi.list();
        if (backupsRes.data?.success) {
          setBackupHistory(backupsRes.data.data || []);
        }

        // If there's a download URL, trigger download
        if (response.data.data?.downloadUrl) {
          window.open(response.data.data.downloadUrl, "_blank");
        }
      } else {
        toast.error(response.data?.message || "Backup creation failed");
      }
    } catch (error: any) {
      console.error("Backup creation error:", error);
      toast.error(error.response?.data?.message || "Backup creation failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const response = await backupApi.updateScheduleSettings({
        frequency: backupSchedule,
        location: backupLocation,
      });

      if (response.data?.success) {
        toast.success("Backup schedule saved!", {
          description: `Backups will run ${backupSchedule} and stored in ${backupLocation}.`,
        });
      } else {
        toast.error(response.data?.message || "Failed to save schedule");
      }
    } catch (error: any) {
      console.error("Save schedule error:", error);
      toast.error(error.response?.data?.message || "Failed to save schedule");
    }
  };

  // Download backup
  const handleDownloadBackup = async (backup: BackupRecord) => {
    try {
      if (backup.cloudinaryUrl) {
        window.open(backup.cloudinaryUrl, "_blank");
      } else {
        const response = await backupApi.download(backup.id);
        const blob = new Blob([response.data], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = backup.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download backup");
    }
  };

  // Restore Functions
  const handleRestoreClick = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };

  const handleRestore = async () => {
    if (restoreConfirmText !== "RESTORE") {
      toast.error("Please type 'RESTORE' exactly to confirm");
      return;
    }

    if (!selectedBackup) return;

    try {
      // First download the backup data
      const response = await backupApi.download(selectedBackup.id);
      let backupData;

      if (typeof response.data === "string") {
        backupData = JSON.parse(response.data);
      } else {
        backupData = response.data;
      }

      // Then restore from it
      const restoreResponse = await backupApi.restore(backupData);

      if (restoreResponse.data?.success) {
        toast.success("System restored successfully!", {
          description: "You will be redirected to login.",
          duration: 5000,
        });

        // Clear local storage and redirect to login
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(restoreResponse.data?.message || "Restore failed");
      }
    } catch (error: any) {
      console.error("Restore error:", error);
      toast.error(error.response?.data?.message || "Restore failed");
    }

    setIsRestoreDialogOpen(false);
    setSelectedBackup(null);
    setRestoreConfirmText("");
  };

  // Handle file upload for restore
  const handleFileUploadRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validate backup format
      if (!backupData.metadata || !backupData.data) {
        toast.error("Invalid backup file format");
        return;
      }

      // Show confirmation dialog
      setSelectedBackup({
        id: "upload",
        filename: file.name,
        fileSize: file.size,
        type: "manual",
        status: "completed",
        location: "local",
        createdAt: backupData.metadata.createdAt || new Date().toISOString(),
        recordCounts: backupData.metadata.recordCounts,
      });
      setIsRestoreDialogOpen(true);

      // Store the backup data for later restore
      (window as any).__pendingRestoreData = backupData;
    } catch (error) {
      console.error("File parse error:", error);
      toast.error("Failed to parse backup file. Please ensure it's a valid JSON file.");
    }
  };

  // Modified restore handler for file uploads
  const handleRestoreFromFile = async () => {
    if (restoreConfirmText !== "RESTORE") {
      toast.error("Please type 'RESTORE' exactly to confirm");
      return;
    }

    const backupData = (window as any).__pendingRestoreData;
    if (!backupData) {
      toast.error("No backup data found");
      return;
    }

    try {
      const restoreResponse = await backupApi.restore(backupData);

      if (restoreResponse.data?.success) {
        toast.success("System restored successfully!", {
          description: "You will be redirected to login.",
          duration: 5000,
        });

        // Clear local storage and redirect to login
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(restoreResponse.data?.message || "Restore failed");
      }
    } catch (error: any) {
      console.error("Restore error:", error);
      toast.error(error.response?.data?.message || "Restore failed");
    }

    delete (window as any).__pendingRestoreData;
    setIsRestoreDialogOpen(false);
    setSelectedBackup(null);
    setRestoreConfirmText("");
  };

  return (
    <div className="space-y-6">
      {/* System Reset Section */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-900">System Reset</CardTitle>
              <CardDescription className="text-red-700">
                Permanently delete all data and reset the system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-2">Warning: This action is irreversible!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All unions, union members, and loans will be deleted</li>
                  <li>All users except SuperAdmin will be removed</li>
                  <li>All repayment records and schedules will be erased</li>
                  <li>All audit logs and documents will be permanently deleted</li>
                  <li>All settings will be reset to defaults</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">After Reset:</p>
                <p>
                  Login with SuperAdmin credentials:<br />
                  <span className="font-mono bg-amber-100 px-1 rounded">Email: SuperAdmin</span><br />
                  <span className="font-mono bg-amber-100 px-1 rounded">Password: SecurePassword123</span>
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={handleResetStep1}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset Entire System
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog - Step 1 */}
      <Dialog open={resetStep === 1} onOpenChange={(open) => !open && closeResetDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              First Confirmation
            </DialogTitle>
            <DialogDescription>
              You are about to reset the entire system. This will:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Delete ALL unions and union members</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Delete ALL loans and repayment records</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Delete ALL users except SuperAdmin</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Delete ALL documents and audit logs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Reset ALL system settings</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeResetDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetStep2}>
              I Understand, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog - Step 2 */}
      <Dialog open={resetStep === 2} onOpenChange={(open) => !open && closeResetDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Second Confirmation
            </DialogTitle>
            <DialogDescription>
              This is your second warning. Are you absolutely sure?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center">
              <p className="text-red-800 font-bold text-lg mb-2">
                ⚠️ THERE IS NO GOING BACK ⚠️
              </p>
              <p className="text-red-700 text-sm">
                Once you proceed to the final step and confirm, all your data will be
                <span className="font-bold"> PERMANENTLY DELETED</span>.
                No backup will be automatically created.
              </p>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Recommendation:</strong> Create a backup before proceeding.
              You can do this in the Backup section below.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeResetDialog}>
              Cancel - I Changed My Mind
            </Button>
            <Button variant="destructive" onClick={() => setResetStep(3)}>
              Yes, I Want to Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog - Step 3 (Final) */}
      <Dialog open={resetStep === 3} onOpenChange={(open) => !open && closeResetDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation
            </DialogTitle>
            <DialogDescription>
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
              <p className="text-red-800 text-sm text-center font-semibold">
                THIS IS YOUR FINAL WARNING
              </p>
              <p className="text-red-700 text-xs text-center mt-2">
                After clicking "Reset System Now", you will be signed out and all data will be deleted.
                When signing back in, use the SuperAdmin credentials.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-reset" className="text-sm font-medium">
                Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> below:
              </Label>
              <Input
                id="confirm-reset"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE here..."
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeResetDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteReset}
              disabled={resetConfirmText !== "DELETE" || isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset System Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>
                Create backups and restore your system data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Backup */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-gray-600" />
              Manual Backup
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Create an immediate backup of all your data including users, unions, members,
              loans, repayments, and system settings.
            </p>
            <Button onClick={handleManualBackup} disabled={isBackingUp}>
              {isBackingUp ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup Now
                </>
              )}
            </Button>
          </div>

          {/* Scheduled Backup */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              Scheduled Backup
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Configure automatic backups to run on a schedule.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="backup-schedule">Backup Frequency</Label>
                <Select value={backupSchedule} onValueChange={setBackupSchedule}>
                  <SelectTrigger id="backup-schedule">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (12:00 AM)</SelectItem>
                    <SelectItem value="weekly">Weekly (Sunday 12:00 AM)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-location">Storage Location</Label>
                <Select value={backupLocation} onValueChange={setBackupLocation}>
                  <SelectTrigger id="backup-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Local Server
                      </div>
                    </SelectItem>
                    <SelectItem value="cloud">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Cloud Storage (Recommended)
                      </div>
                    </SelectItem>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Both Local & Cloud
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="mt-4" onClick={handleSaveSchedule}>
              <Calendar className="h-4 w-4 mr-2" />
              Save Schedule
            </Button>
          </div>

          {/* Backup History */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-gray-600" />
              Backup History
            </h4>

            <div className="border rounded-lg overflow-hidden">
              {isLoadingBackups ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading backups...
                </div>
              ) : backupHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No backups found. Create your first backup above.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Size</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {backupHistory.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(backup.createdAt)}</td>
                        <td className="px-4 py-3">{formatFileSize(backup.fileSize)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            backup.type === "manual"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {backup.type === "manual" ? "Manual" : "Scheduled"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">
                            {backup.location === "cloud" || backup.location === "both" ? (
                              <Cloud className="h-3 w-3 text-gray-500" />
                            ) : (
                              <HardDrive className="h-3 w-3 text-gray-500" />
                            )}
                            {backup.location === "both" ? "Both" : backup.location === "cloud" ? "Cloud" : "Local"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            backup.status === "completed"
                              ? "text-green-600"
                              : backup.status === "in_progress"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}>
                            {backup.status === "completed" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : backup.status === "in_progress" ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {backup.status === "completed" ? "Completed" : backup.status === "in_progress" ? "In Progress" : "Failed"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => handleDownloadBackup(backup)}
                              disabled={backup.status !== "completed"}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleRestoreClick(backup)}
                              disabled={backup.status !== "completed"}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Upload Backup */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-800">
              <Upload className="h-4 w-4" />
              Restore from File
            </h4>
            <p className="text-sm text-amber-700 mb-4">
              Upload a previously downloaded backup file to restore your system to that state.
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".json"
                className="flex-1"
                onChange={handleFileUploadRestore}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsRestoreDialogOpen(false);
          setRestoreConfirmText("");
          setSelectedBackup(null);
          delete (window as any).__pendingRestoreData;
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Upload className="h-5 w-5" />
              Confirm Restore
            </DialogTitle>
            <DialogDescription>
              You are about to restore the system to a previous backup.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedBackup && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Backup Date:</div>
                  <div className="font-medium">{formatDate(selectedBackup.createdAt)}</div>
                  <div className="text-gray-500">Size:</div>
                  <div className="font-medium">{formatFileSize(selectedBackup.fileSize)}</div>
                  <div className="text-gray-500">Source:</div>
                  <div className="font-medium capitalize">
                    {selectedBackup.id === "upload" ? "File Upload" : selectedBackup.location}
                  </div>
                  {selectedBackup.recordCounts && (
                    <>
                      <div className="text-gray-500">Records:</div>
                      <div className="font-medium">
                        {selectedBackup.recordCounts.users || 0} users,{" "}
                        {selectedBackup.recordCounts.unions || 0} unions,{" "}
                        {selectedBackup.recordCounts.loans || 0} loans
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 text-sm text-amber-800">
              <strong>Warning:</strong> Restoring from a backup will replace all current data
              with the data from the selected backup. A pre-restore backup will be created automatically.
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-restore" className="text-sm font-medium">
                Type <span className="font-mono bg-gray-100 px-1 rounded">RESTORE</span> to confirm:
              </Label>
              <Input
                id="confirm-restore"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value.toUpperCase())}
                placeholder="Type RESTORE here..."
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsRestoreDialogOpen(false);
                setRestoreConfirmText("");
                setSelectedBackup(null);
                delete (window as any).__pendingRestoreData;
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={selectedBackup?.id === "upload" ? handleRestoreFromFile : handleRestore}
              disabled={restoreConfirmText !== "RESTORE"}
            >
              <Upload className="h-4 w-4 mr-2" />
              Restore Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
