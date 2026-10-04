import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import * as controller from "./productlists.controller";
import { listItemSchema } from "./productlists.validation";

const router = Router();

router.use(requireAuth);

// Qualquer usuario logado pode VER as listas (precisa delas na retirada).
router.get("/sectors", controller.listSectors);
router.get("/employees", controller.listEmployees);

// Somente o ADMINISTRADOR adiciona ou remove.
router.post("/sectors", requireRole(Role.ADMIN), validate(listItemSchema), controller.createSector);
router.delete("/sectors/:id", requireRole(Role.ADMIN), controller.deleteSector);
router.post("/employees", requireRole(Role.ADMIN), validate(listItemSchema), controller.createEmployee);
router.delete("/employees/:id", requireRole(Role.ADMIN), controller.deleteEmployee);

export default router;
