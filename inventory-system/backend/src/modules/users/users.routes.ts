import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import * as controller from "./users.controller";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./users.validation";

const router = Router();

// Gestao de usuarios e permissoes: exclusiva de ADMIN (spec item 6).
router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", validate(listUsersQuerySchema, "query"), controller.list);
router.get("/:id", controller.getOne);
router.post("/", validate(createUserSchema), controller.create);
router.patch("/:id", validate(updateUserSchema), controller.update);

export default router;
