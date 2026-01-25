import { Request, Response } from "express";
import { BackupService } from "../service/backup.service";
import { ApiResponseUtil } from "../utils/apiResponse.util";

export class BackupController {
  /**
   * Create a new backup
   */
  static async createBackup(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { includeAuditLogs, includeSessions, location } = req.body;

      const result = await BackupService.createBackup({
        userId,
        type: "manual",
        includeAuditLogs: includeAuditLogs || false,
        includeSessions: includeSessions || false,
        location: location || "local",
      });

      if (!result.success) {
        return ApiResponseUtil.error(res, result.error || "Backup creation failed", 500);
      }

      return ApiResponseUtil.success(res, {
        backupId: result.backupId,
        filename: result.filename,
        downloadUrl: result.downloadUrl,
      }, "Backup created successfully");
    } catch (error: any) {
      console.error("Create backup error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to create backup", 500);
    }
  }

  /**
   * List all backups
   */
  static async listBackups(req: Request, res: Response) {
    try {
      const backups = await BackupService.listBackups();
      return ApiResponseUtil.success(res, backups);
    } catch (error: any) {
      console.error("List backups error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to list backups", 500);
    }
  }

  /**
   * Download a specific backup
   */
  static async downloadBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await BackupService.getBackupFile(id);

      if (!result.success) {
        return ApiResponseUtil.error(res, result.error || "Backup not found", 404);
      }

      // If it's a Cloudinary URL, redirect
      if (result.data?.startsWith("http")) {
        return res.redirect(result.data);
      }

      // Send file content
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`
      );
      return res.send(result.data);
    } catch (error: any) {
      console.error("Download backup error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to download backup", 500);
    }
  }

  /**
   * Delete a backup
   */
  static async deleteBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ApiResponseUtil.error(res, "User not authenticated", 401);
      }

      const result = await BackupService.deleteBackup(id, userId);

      if (!result.success) {
        return ApiResponseUtil.error(res, result.error || "Failed to delete backup", 500);
      }

      return ApiResponseUtil.success(res, null, "Backup deleted successfully");
    } catch (error: any) {
      console.error("Delete backup error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to delete backup", 500);
    }
  }

  /**
   * Restore from backup file
   */
  static async restoreBackup(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { backupData } = req.body;

      if (!userId) {
        return ApiResponseUtil.error(res, "User not authenticated", 401);
      }

      if (!backupData || !backupData.metadata || !backupData.data) {
        return ApiResponseUtil.error(res, "Invalid backup data format", 400);
      }

      const result = await BackupService.restoreFromBackup(backupData, userId);

      if (!result.success) {
        return ApiResponseUtil.error(res, result.error || "Restore failed", 500);
      }

      return ApiResponseUtil.success(res, null, "System restored successfully. Please log in again.");
    } catch (error: any) {
      console.error("Restore backup error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to restore backup", 500);
    }
  }

  /**
   * Reset the entire system
   */
  static async resetSystem(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { confirmationToken } = req.body;

      if (!userId) {
        return ApiResponseUtil.error(res, "User not authenticated", 401);
      }

      // Verify the confirmation token matches "DELETE"
      if (confirmationToken !== "DELETE") {
        return ApiResponseUtil.error(res, "Invalid confirmation token", 400);
      }

      const result = await BackupService.resetSystem(userId);

      if (!result.success) {
        return ApiResponseUtil.error(res, result.error || "System reset failed", 500);
      }

      return ApiResponseUtil.success(
        res,
        {
          message: "System has been reset successfully",
          loginCredentials: {
            email: "SuperAdmin",
            password: "SecurePassword123",
          },
        },
        "System reset complete. Please log in with SuperAdmin credentials."
      );
    } catch (error: any) {
      console.error("System reset error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to reset system", 500);
    }
  }

  /**
   * Get backup schedule settings
   */
  static async getScheduleSettings(req: Request, res: Response) {
    try {
      const settings = await BackupService.getScheduleSettings();
      return ApiResponseUtil.success(res, settings);
    } catch (error: any) {
      console.error("Get schedule settings error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to get schedule settings", 500);
    }
  }

  /**
   * Update backup schedule settings
   */
  static async updateScheduleSettings(req: Request, res: Response) {
    try {
      const { frequency, location, retentionDays, includeAuditLogs, includeSessions } = req.body;

      const settings = await BackupService.updateScheduleSettings({
        frequency,
        location,
        retentionDays,
        includeAuditLogs,
        includeSessions,
      });

      return ApiResponseUtil.success(res, settings, "Schedule settings updated successfully");
    } catch (error: any) {
      console.error("Update schedule settings error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to update schedule settings", 500);
    }
  }

  /**
   * Check dependencies before deletion
   */
  static async checkDependencies(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;

      if (!["user", "union", "unionMember", "loanType"].includes(entityType)) {
        return ApiResponseUtil.error(res, "Invalid entity type", 400);
      }

      const result = await BackupService.checkDeletionDependencies(
        entityType as "user" | "union" | "unionMember" | "loanType",
        entityId
      );

      return ApiResponseUtil.success(res, result);
    } catch (error: any) {
      console.error("Check dependencies error:", error);
      return ApiResponseUtil.error(res, error.message || "Failed to check dependencies", 500);
    }
  }
}
