import type { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse.util";
import { AuthService } from "../service/auth.service";
import { JwtUtil } from "../utils/jwt.util";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.register(email, password);

      return ApiResponseUtil.success(res, result, result.message);
    } catch (error: any) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");

      console.log("AuthController.login: Login attempt for email:", email);

      const result = await AuthService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      console.log(
        "AuthController.login: Login successful for user:",
        result.user.email
      );

      return ApiResponseUtil.success(res, result, "Login successful");
    } catch (error: any) {
      console.error("AuthController.login: Login error:", error.message);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);

      if (token && req.user) {
        const decoded = JwtUtil.verifyAccessToken(token);
        await AuthService.logout(req.user.id, decoded.jwtId);
      }

      return ApiResponseUtil.success(res, null, "Logout successful");
    } catch (error: any) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponseUtil.error(res, "Refresh token is required", 400);
      }

      const result = await AuthService.refreshToken(refreshToken);

      return ApiResponseUtil.success(res, result, "Token refreshed");
    } catch (error: any) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.id);

      return ApiResponseUtil.success(res, user);
    } catch (error: any) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword
      );

      return ApiResponseUtil.success(
        res,
        null,
        "Password changed successfully"
      );
    } catch (error: any) {
      next(error);
    }
  }

  static async getActiveSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);
      let currentJwtId: string | undefined;

      if (token) {
        try {
          const decoded = JwtUtil.verifyAccessToken(token);
          currentJwtId = decoded.jwtId;
        } catch {
          // Token invalid, continue without current session marking
        }
      }

      const sessions = await AuthService.getActiveSessions(req.user!.id, currentJwtId);
      return ApiResponseUtil.success(res, sessions, "Active sessions retrieved");
    } catch (error: any) {
      next(error);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const result = await AuthService.revokeSession(req.user!.id, sessionId);
      return ApiResponseUtil.success(res, result, result.message);
    } catch (error: any) {
      next(error);
    }
  }

  static async revokeOtherSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);

      if (!token) {
        return ApiResponseUtil.error(res, "Token required", 401);
      }

      const decoded = JwtUtil.verifyAccessToken(token);
      const result = await AuthService.revokeOtherSessions(req.user!.id, decoded.jwtId);
      return ApiResponseUtil.success(res, result, result.message);
    } catch (error: any) {
      next(error);
    }
  }
}
