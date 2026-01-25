import prisma from "../prismaClient";
import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Prisma } from "@prisma/client";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const SUPERADMIN_EMAIL = "SuperAdmin";
const SUPERADMIN_PASSWORD = "SecurePassword123";

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface BackupData {
  metadata: {
    version: string;
    createdAt: string;
    systemVersion: string;
    checksum?: string;
    recordCounts: Record<string, number>;
  };
  data: {
    companySettings: any[];
    loanTypes: any[];
    documentTypes: any[];
    users: any[];
    unions: any[];
    unionMembers: any[];
    loans: any[];
    repaymentScheduleItems: any[];
    repayments: any[];
    repaymentAllocations: any[];
    unionMemberDocuments: any[];
    loanDocuments: any[];
    auditLogs?: any[];
    staffSessions?: any[];
    unionAssignmentHistory: any[];
    unionMemberReassignments: any[];
    userLoginHistory: any[];
    userNotes: any[];
    reportSessions: any[];
  };
}

export class BackupService {
  /**
   * Create a full backup of all system data
   */
  static async createBackup(
    options: {
      userId?: string;
      type?: "manual" | "scheduled";
      includeAuditLogs?: boolean;
      includeSessions?: boolean;
      location?: "local" | "cloud" | "both";
    } = {}
  ): Promise<{
    success: boolean;
    backupId?: string;
    filename?: string;
    downloadUrl?: string;
    error?: string;
  }> {
    const {
      userId,
      type = "manual",
      includeAuditLogs = false,
      includeSessions = false,
      location = "local",
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.json`;

    try {
      // Create backup record in progress
      const backupRecord = await prisma.backupRecord.create({
        data: {
          filename,
          fileSize: 0,
          location,
          type,
          status: "in_progress",
          createdBy: userId,
        },
      });

      // Gather all data
      const [
        companySettings,
        loanTypes,
        documentTypes,
        users,
        unions,
        unionMembers,
        loans,
        repaymentScheduleItems,
        repayments,
        repaymentAllocations,
        unionMemberDocuments,
        loanDocuments,
        unionAssignmentHistory,
        unionMemberReassignments,
        userLoginHistory,
        userNotes,
        reportSessions,
      ] = await Promise.all([
        prisma.companySetting.findMany(),
        prisma.loanType.findMany(),
        prisma.documentType.findMany(),
        prisma.user.findMany(),
        prisma.union.findMany(),
        prisma.unionMember.findMany(),
        prisma.loan.findMany(),
        prisma.repaymentScheduleItem.findMany(),
        prisma.repayment.findMany(),
        prisma.repaymentAllocation.findMany(),
        prisma.unionMemberDocument.findMany(),
        prisma.loanDocument.findMany(),
        prisma.unionAssignmentHistory.findMany(),
        prisma.unionMemberReassignment.findMany(),
        prisma.userLoginHistory.findMany(),
        prisma.userNote.findMany(),
        prisma.reportSession.findMany(),
      ]);

      // Optional data
      let auditLogs: any[] = [];
      let staffSessions: any[] = [];

      if (includeAuditLogs) {
        auditLogs = await prisma.auditLog.findMany();
      }
      if (includeSessions) {
        staffSessions = await prisma.staffSession.findMany();
      }

      const backupData: BackupData = {
        metadata: {
          version: "1.0",
          createdAt: new Date().toISOString(),
          systemVersion: "1.0.0",
          recordCounts: {
            companySettings: companySettings.length,
            loanTypes: loanTypes.length,
            documentTypes: documentTypes.length,
            users: users.length,
            unions: unions.length,
            unionMembers: unionMembers.length,
            loans: loans.length,
            repaymentScheduleItems: repaymentScheduleItems.length,
            repayments: repayments.length,
            repaymentAllocations: repaymentAllocations.length,
            unionMemberDocuments: unionMemberDocuments.length,
            loanDocuments: loanDocuments.length,
            auditLogs: auditLogs.length,
            staffSessions: staffSessions.length,
            unionAssignmentHistory: unionAssignmentHistory.length,
            unionMemberReassignments: unionMemberReassignments.length,
            userLoginHistory: userLoginHistory.length,
            userNotes: userNotes.length,
            reportSessions: reportSessions.length,
          },
        },
        data: {
          companySettings,
          loanTypes,
          documentTypes,
          users,
          unions,
          unionMembers,
          loans,
          repaymentScheduleItems,
          repayments,
          repaymentAllocations,
          unionMemberDocuments,
          loanDocuments,
          auditLogs,
          staffSessions,
          unionAssignmentHistory,
          unionMemberReassignments,
          userLoginHistory,
          userNotes,
          reportSessions,
        },
      };

      // Calculate checksum
      const jsonString = JSON.stringify(backupData);
      const checksum = crypto
        .createHash("sha256")
        .update(jsonString)
        .digest("hex");
      backupData.metadata.checksum = checksum;

      const finalJsonString = JSON.stringify(backupData, null, 2);
      const fileSize = Buffer.byteLength(finalJsonString, "utf8");

      let localPath: string | undefined;
      let cloudinaryUrl: string | undefined;

      // Save locally
      if (location === "local" || location === "both") {
        localPath = path.join(BACKUP_DIR, filename);
        fs.writeFileSync(localPath, finalJsonString);
      }

      // Save to Cloudinary
      if (location === "cloud" || location === "both") {
        try {
          const result = await cloudinary.uploader.upload(
            `data:application/json;base64,${Buffer.from(finalJsonString).toString("base64")}`,
            {
              resource_type: "raw",
              public_id: `millenium-backups/${filename.replace(".json", "")}`,
              format: "json",
            }
          );
          cloudinaryUrl = result.secure_url;
        } catch (cloudError) {
          console.error("Cloudinary upload failed:", cloudError);
          // If cloud upload fails but local is also selected, continue
          if (location === "cloud") {
            throw new Error("Failed to upload backup to cloud storage");
          }
        }
      }

      // Update backup record
      await prisma.backupRecord.update({
        where: { id: backupRecord.id },
        data: {
          fileSize,
          localPath,
          cloudinaryUrl,
          status: "completed",
          recordCounts: backupData.metadata.recordCounts,
        },
      });

      // Log the backup
      if (userId) {
        await prisma.auditLog.create({
          data: {
            actorUserId: userId,
            action: "BACKUP_CREATED",
            entityName: "System",
            entityId: backupRecord.id,
            metadata: {
              filename,
              fileSize,
              recordCounts: backupData.metadata.recordCounts,
            },
          },
        });
      }

      return {
        success: true,
        backupId: backupRecord.id,
        filename,
        downloadUrl: cloudinaryUrl || localPath,
      };
    } catch (error: any) {
      console.error("Backup creation failed:", error);
      return {
        success: false,
        error: error.message || "Backup creation failed",
      };
    }
  }

  /**
   * Get list of all backups
   */
  static async listBackups() {
    const backups = await prisma.backupRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return backups;
  }

  /**
   * Get backup file for download
   */
  static async getBackupFile(backupId: string): Promise<{
    success: boolean;
    data?: string;
    filename?: string;
    error?: string;
  }> {
    const backup = await prisma.backupRecord.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return { success: false, error: "Backup not found" };
    }

    if (backup.status !== "completed") {
      return { success: false, error: "Backup is not completed" };
    }

    // Try local file first
    if (backup.localPath && fs.existsSync(backup.localPath)) {
      const data = fs.readFileSync(backup.localPath, "utf8");
      return { success: true, data, filename: backup.filename };
    }

    // Try Cloudinary URL
    if (backup.cloudinaryUrl) {
      return {
        success: true,
        data: backup.cloudinaryUrl,
        filename: backup.filename,
      };
    }

    return { success: false, error: "Backup file not found" };
  }

  /**
   * Delete a backup
   */
  static async deleteBackup(
    backupId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const backup = await prisma.backupRecord.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return { success: false, error: "Backup not found" };
    }

    try {
      // Delete local file if exists
      if (backup.localPath && fs.existsSync(backup.localPath)) {
        fs.unlinkSync(backup.localPath);
      }

      // Delete from Cloudinary if exists
      if (backup.cloudinaryUrl) {
        const publicId = `millenium-backups/${backup.filename.replace(".json", "")}`;
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        } catch (cloudError) {
          console.error("Failed to delete from Cloudinary:", cloudError);
        }
      }

      // Delete record
      await prisma.backupRecord.delete({ where: { id: backupId } });

      // Log deletion
      await prisma.auditLog.create({
        data: {
          actorUserId: userId,
          action: "BACKUP_DELETED",
          entityName: "System",
          entityId: backupId,
          metadata: { filename: backup.filename },
        },
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore system from backup
   */
  static async restoreFromBackup(
    backupData: BackupData,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Validate backup format
    if (!backupData.metadata || !backupData.data) {
      return { success: false, error: "Invalid backup format" };
    }

    // Verify checksum
    const dataWithoutChecksum = { ...backupData };
    delete dataWithoutChecksum.metadata.checksum;
    const calculatedChecksum = crypto
      .createHash("sha256")
      .update(JSON.stringify(dataWithoutChecksum))
      .digest("hex");

    // Create pre-restore backup
    await this.createBackup({
      userId,
      type: "manual",
      includeAuditLogs: true,
      includeSessions: false,
      location: "local",
    });

    try {
      // Begin restoration in transaction
      await prisma.$transaction(
        async (tx) => {
          // Clear existing data in correct order (respecting foreign keys)
          await tx.repaymentAllocation.deleteMany();
          await tx.repayment.deleteMany();
          await tx.repaymentScheduleItem.deleteMany();
          await tx.loanDocument.deleteMany();
          await tx.unionMemberDocument.deleteMany();
          await tx.loan.deleteMany();
          await tx.unionMemberReassignment.deleteMany();
          await tx.unionMember.deleteMany();
          await tx.unionAssignmentHistory.deleteMany();
          await tx.union.deleteMany();
          await tx.staffSession.deleteMany();
          await tx.userLoginHistory.deleteMany();
          await tx.userNote.deleteMany();
          await tx.reportSession.deleteMany();
          await tx.auditLog.deleteMany();
          await tx.user.deleteMany();
          await tx.loanType.deleteMany();
          await tx.documentType.deleteMany();
          await tx.companySetting.deleteMany();

          // Restore data in correct order
          if (backupData.data.companySettings?.length) {
            await tx.companySetting.createMany({
              data: backupData.data.companySettings,
            });
          }

          if (backupData.data.loanTypes?.length) {
            await tx.loanType.createMany({
              data: backupData.data.loanTypes,
            });
          }

          if (backupData.data.documentTypes?.length) {
            await tx.documentType.createMany({
              data: backupData.data.documentTypes,
            });
          }

          if (backupData.data.users?.length) {
            await tx.user.createMany({
              data: backupData.data.users,
            });
          }

          if (backupData.data.unions?.length) {
            await tx.union.createMany({
              data: backupData.data.unions,
            });
          }

          if (backupData.data.unionMembers?.length) {
            await tx.unionMember.createMany({
              data: backupData.data.unionMembers,
            });
          }

          if (backupData.data.loans?.length) {
            await tx.loan.createMany({
              data: backupData.data.loans,
            });
          }

          if (backupData.data.repaymentScheduleItems?.length) {
            await tx.repaymentScheduleItem.createMany({
              data: backupData.data.repaymentScheduleItems,
            });
          }

          if (backupData.data.repayments?.length) {
            await tx.repayment.createMany({
              data: backupData.data.repayments,
            });
          }

          if (backupData.data.repaymentAllocations?.length) {
            await tx.repaymentAllocation.createMany({
              data: backupData.data.repaymentAllocations,
            });
          }

          if (backupData.data.unionMemberDocuments?.length) {
            await tx.unionMemberDocument.createMany({
              data: backupData.data.unionMemberDocuments,
            });
          }

          if (backupData.data.loanDocuments?.length) {
            await tx.loanDocument.createMany({
              data: backupData.data.loanDocuments,
            });
          }

          if (backupData.data.unionAssignmentHistory?.length) {
            await tx.unionAssignmentHistory.createMany({
              data: backupData.data.unionAssignmentHistory,
            });
          }

          if (backupData.data.unionMemberReassignments?.length) {
            await tx.unionMemberReassignment.createMany({
              data: backupData.data.unionMemberReassignments,
            });
          }

          if (backupData.data.userLoginHistory?.length) {
            await tx.userLoginHistory.createMany({
              data: backupData.data.userLoginHistory,
            });
          }

          if (backupData.data.userNotes?.length) {
            await tx.userNote.createMany({
              data: backupData.data.userNotes,
            });
          }

          if (backupData.data.reportSessions?.length) {
            await tx.reportSession.createMany({
              data: backupData.data.reportSessions,
            });
          }

          // Optionally restore audit logs and sessions
          if (backupData.data.auditLogs?.length) {
            await tx.auditLog.createMany({
              data: backupData.data.auditLogs,
            });
          }

          if (backupData.data.staffSessions?.length) {
            await tx.staffSession.createMany({
              data: backupData.data.staffSessions,
            });
          }
        },
        { timeout: 120000 } // 2 minute timeout for large restores
      );

      // Log the restore
      await prisma.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SYSTEM_RESTORED",
          entityName: "System",
          entityId: "system",
          metadata: {
            backupDate: backupData.metadata.createdAt,
            recordCounts: backupData.metadata.recordCounts,
          },
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Restore failed:", error);
      return {
        success: false,
        error: error.message || "Restore failed. Pre-restore backup is available.",
      };
    }
  }

  /**
   * Reset the entire system to a fresh state
   */
  static async resetSystem(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Import bcryptjs
      const bcrypt = await import("bcryptjs");

      // Create a backup before reset
      await this.createBackup({
        userId,
        type: "manual",
        includeAuditLogs: true,
        includeSessions: true,
        location: "local",
      });

      await prisma.$transaction(
        async (tx) => {
          // Delete all data in correct order (respecting foreign keys)
          await tx.repaymentAllocation.deleteMany();
          await tx.repayment.deleteMany();
          await tx.repaymentScheduleItem.deleteMany();
          await tx.loanDocument.deleteMany();
          await tx.unionMemberDocument.deleteMany();
          await tx.loan.deleteMany();
          await tx.unionMemberReassignment.deleteMany();
          await tx.unionMember.deleteMany();
          await tx.unionAssignmentHistory.deleteMany();
          await tx.union.deleteMany();
          await tx.staffSession.deleteMany();
          await tx.userLoginHistory.deleteMany();
          await tx.userNote.deleteMany();
          await tx.reportSession.deleteMany();
          await tx.auditLog.deleteMany();
          await tx.user.deleteMany();
          await tx.loanType.deleteMany();
          await tx.documentType.deleteMany();
          await tx.companySetting.deleteMany();
          await tx.backupRecord.deleteMany(); // Clear backup records too

          // Create SuperAdmin user
          const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
          await tx.user.create({
            data: {
              email: SUPERADMIN_EMAIL,
              passwordHash: hashedPassword,
              role: "ADMIN",
              isActive: true,
              firstName: "Super",
              lastName: "Admin",
            },
          });

          // Create default company settings
          await tx.companySetting.create({
            data: {
              id: "default",
              name: "Millenium Potters LMS",
              email: "admin@millenniumpotters.com.ng",
              currency: "NGN",
              currencySymbol: "₦",
              dateFormat: "DD/MM/YYYY",
              timeFormat: "24h",
              timezone: "Africa/Lagos",
            },
          });
        },
        { timeout: 60000 }
      );

      // Log the reset (this creates a new audit log after the reset)
      await prisma.auditLog.create({
        data: {
          action: "SYSTEM_RESET",
          entityName: "System",
          entityId: "system",
          metadata: {
            resetAt: new Date().toISOString(),
            message: "System was reset to fresh state",
          },
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("System reset failed:", error);
      return {
        success: false,
        error: error.message || "System reset failed",
      };
    }
  }

  /**
   * Get schedule settings
   */
  static async getScheduleSettings() {
    let settings = await prisma.backupScheduleSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.backupScheduleSettings.create({
        data: { id: "default" },
      });
    }

    return settings;
  }

  /**
   * Update schedule settings
   */
  static async updateScheduleSettings(data: {
    frequency?: string;
    location?: string;
    retentionDays?: number;
    includeAuditLogs?: boolean;
    includeSessions?: boolean;
  }) {
    const settings = await prisma.backupScheduleSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    return settings;
  }

  /**
   * Check for dependency issues before deletion
   */
  static async checkDeletionDependencies(
    entityType: "user" | "union" | "unionMember" | "loanType",
    entityId: string
  ): Promise<{
    canDelete: boolean;
    dependencies: {
      type: string;
      count: number;
      message: string;
    }[];
    suggestions: string[];
  }> {
    const dependencies: { type: string; count: number; message: string }[] = [];
    const suggestions: string[] = [];

    switch (entityType) {
      case "user": {
        const user = await prisma.user.findUnique({
          where: { id: entityId },
          include: {
            unions: { where: { deletedAt: null } },
            currentUnionMembers: { where: { deletedAt: null } },
            createdLoans: { where: { deletedAt: null, status: { notIn: ["COMPLETED", "CANCELED", "WRITTEN_OFF"] } } },
            assignedLoans: { where: { deletedAt: null, status: { notIn: ["COMPLETED", "CANCELED", "WRITTEN_OFF"] } } },
            creditOfficers: true,
          },
        });

        if (!user) {
          return { canDelete: false, dependencies: [{ type: "error", count: 0, message: "User not found" }], suggestions: [] };
        }

        // Check if this is SuperAdmin
        if (user.email === SUPERADMIN_EMAIL) {
          return {
            canDelete: false,
            dependencies: [{ type: "protected", count: 1, message: "SuperAdmin user cannot be deleted" }],
            suggestions: [],
          };
        }

        if (user.unions.length > 0) {
          dependencies.push({
            type: "unions",
            count: user.unions.length,
            message: `This user manages ${user.unions.length} union(s)`,
          });
          suggestions.push("Reassign unions to another credit officer before deleting");
        }

        if (user.currentUnionMembers.length > 0) {
          dependencies.push({
            type: "members",
            count: user.currentUnionMembers.length,
            message: `This user is assigned to ${user.currentUnionMembers.length} member(s)`,
          });
        }

        if (user.createdLoans.length > 0 || user.assignedLoans.length > 0) {
          const totalLoans = user.createdLoans.length + user.assignedLoans.length;
          dependencies.push({
            type: "loans",
            count: totalLoans,
            message: `This user has ${totalLoans} active loan(s)`,
          });
          suggestions.push("Complete or reassign active loans before deleting");
        }

        if (user.creditOfficers.length > 0) {
          dependencies.push({
            type: "supervised",
            count: user.creditOfficers.length,
            message: `This supervisor manages ${user.creditOfficers.length} credit officer(s)`,
          });
          suggestions.push("Reassign credit officers to another supervisor");
        }
        break;
      }

      case "union": {
        const union = await prisma.union.findUnique({
          where: { id: entityId },
          include: {
            unionMembers: { where: { deletedAt: null } },
            loans: { where: { deletedAt: null, status: { notIn: ["COMPLETED", "CANCELED", "WRITTEN_OFF"] } } },
          },
        });

        if (!union) {
          return { canDelete: false, dependencies: [{ type: "error", count: 0, message: "Union not found" }], suggestions: [] };
        }

        if (union.unionMembers.length > 0) {
          dependencies.push({
            type: "members",
            count: union.unionMembers.length,
            message: `This union has ${union.unionMembers.length} member(s)`,
          });
          suggestions.push("Reassign members to another union or delete them first");
        }

        if (union.loans.length > 0) {
          dependencies.push({
            type: "loans",
            count: union.loans.length,
            message: `This union has ${union.loans.length} active loan(s)`,
          });
          suggestions.push("Complete active loans before deleting the union");
        }
        break;
      }

      case "unionMember": {
        const member = await prisma.unionMember.findUnique({
          where: { id: entityId },
          include: {
            loans: { where: { deletedAt: null, status: { notIn: ["COMPLETED", "CANCELED", "WRITTEN_OFF"] } } },
          },
        });

        if (!member) {
          return { canDelete: false, dependencies: [{ type: "error", count: 0, message: "Member not found" }], suggestions: [] };
        }

        if (member.loans.length > 0) {
          dependencies.push({
            type: "loans",
            count: member.loans.length,
            message: `This member has ${member.loans.length} active loan(s)`,
          });
          suggestions.push("Complete or write off active loans before deleting the member");
        }
        break;
      }

      case "loanType": {
        const loanType = await prisma.loanType.findUnique({
          where: { id: entityId },
          include: {
            loans: { where: { deletedAt: null } },
          },
        });

        if (!loanType) {
          return { canDelete: false, dependencies: [{ type: "error", count: 0, message: "Loan type not found" }], suggestions: [] };
        }

        if (loanType.loans.length > 0) {
          dependencies.push({
            type: "loans",
            count: loanType.loans.length,
            message: `This loan type is used by ${loanType.loans.length} loan(s)`,
          });
          suggestions.push("Existing loans will retain their current settings if you force delete");
        }
        break;
      }
    }

    return {
      canDelete: dependencies.length === 0,
      dependencies,
      suggestions,
    };
  }
}
