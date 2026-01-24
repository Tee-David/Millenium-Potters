import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  loginSchema,
  changePasswordSchema,
  registerSchema,
} from "../validators/auth.validator";

const router = Router();

// Debug line to verify auth routes are loaded
console.log("Auth routes module loaded");

// Test route to verify auth routes are working
router.route("/test").get((req, res) => {
  res.json({
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
  });
});

router
  .route("/register")
  .post(validate(registerSchema), AuthController.register);
router.route("/login").post(validate(loginSchema), AuthController.login);
router.route("/logout").post(authenticate, AuthController.logout);
router.route("/refresh").post(AuthController.refreshToken);
router.route("/me").get(authenticate, AuthController.getProfile);
router
  .route("/change-password")
  .put(
    authenticate,
    validate(changePasswordSchema),
    AuthController.changePassword
  );

// Session management routes
router.route("/sessions").get(authenticate, AuthController.getActiveSessions);
router.route("/sessions/:sessionId").delete(authenticate, AuthController.revokeSession);
router.route("/sessions/revoke-others").post(authenticate, AuthController.revokeOtherSessions);

// Admin impersonation route
router.route("/impersonate/:userId").post(authenticate, AuthController.impersonateUser);

export default router;
