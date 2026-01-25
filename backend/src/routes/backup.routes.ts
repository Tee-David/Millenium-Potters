import { Router } from "express";
import { BackupController } from "../controllers/backup.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const router = Router();

// All backup routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Backup operations
router.post("/create", BackupController.createBackup);
router.get("/list", BackupController.listBackups);
router.get("/download/:id", BackupController.downloadBackup);
router.delete("/:id", BackupController.deleteBackup);

// Restore operations
router.post("/restore", BackupController.restoreBackup);
router.post("/reset", BackupController.resetSystem);

// Schedule settings
router.get("/schedule", BackupController.getScheduleSettings);
router.put("/schedule", BackupController.updateScheduleSettings);

// Dependency checking (for graceful deletion)
router.get("/dependencies/:entityType/:entityId", BackupController.checkDependencies);

export default router;
