import { Router } from "express";
import { validate } from "@/middleware/validate";
import { requireAuth } from "@/middleware/auth";
import { loginLimiter } from "@/middleware/rateLimit";
import * as controller from "./auth.controller";
import { changePasswordSchema, loginSchema } from "./auth.validation";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, controller.me);
router.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  controller.changePassword
);

export default router;
