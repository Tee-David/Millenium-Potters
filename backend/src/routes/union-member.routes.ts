import { Router } from "express";
import { UnionMemberController } from "../controllers/union-member.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole, requireAdmin } from "../middlewares/role.middleware";
import { auditLog } from "../middlewares/audit.middleware";
import { Role } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create union member (admin, supervisor, credit officer)
router.post(
  "/",
  requireRole(Role.ADMIN, Role.SUPERVISOR, Role.CREDIT_OFFICER),
  auditLog("UNION_MEMBER_CREATED", "UnionMember"),
  UnionMemberController.createUnionMember
);

// Get all union members (all roles)
router.get("/", UnionMemberController.getUnionMembers);

// Get union member by ID (all roles)
router.get("/:id", UnionMemberController.getUnionMemberById);

// Update union member (admin, supervisor, credit officer)
router.put(
  "/:id",
  requireRole(Role.ADMIN, Role.SUPERVISOR, Role.CREDIT_OFFICER),
  auditLog("UNION_MEMBER_UPDATED", "UnionMember"),
  UnionMemberController.updateUnionMember
);

// Delete union member (admin, supervisor, credit officer)
router.delete(
  "/:id",
  requireRole(Role.ADMIN, Role.SUPERVISOR, Role.CREDIT_OFFICER),
  auditLog("UNION_MEMBER_DELETED", "UnionMember"),
  UnionMemberController.deleteUnionMember
);

// Toggle member verification/approval status (admin, supervisor)
router.patch(
  "/:id/toggle-verification",
  requireRole(Role.ADMIN, Role.SUPERVISOR),
  auditLog("UNION_MEMBER_VERIFICATION_TOGGLED", "UnionMember"),
  UnionMemberController.toggleVerification
);

// Reassign union member to another union (admin only)
router.post(
  "/:id/reassign",
  requireAdmin,
  auditLog("UNION_MEMBER_REASSIGNED", "UnionMember"),
  UnionMemberController.reassignUnionMember
);

// Export union members (all roles)
router.get("/export/csv", UnionMemberController.exportUnionMembers);

// Check email uniqueness for union members
router.get("/check-email", UnionMemberController.checkEmailUnique);

export default router;
