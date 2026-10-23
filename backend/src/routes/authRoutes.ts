import { Router } from "express";
import * as authController from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../utils/validators";

const router = Router();

router.post("/register", authLimiter, registerValidation, authController.register);
router.post("/login", authLimiter, loginValidation, authController.login);
router.post("/forgot-password", authLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidation, authController.resetPassword);

router.get("/profile", requireAuth, authController.getProfile);
router.put("/profile", requireAuth, authController.updateProfile);
router.post("/device-token", requireAuth, authController.registerDeviceToken);

export default router;
