import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import * as controller from "./manufacturers.controller";

const router = Router();

router.use(requireAuth);

// Qualquer usuario autenticado pode ver a lista (necessario para filtros).
router.get("/", controller.list);

// Cadastrar nova montadora usa a mesma permissao de cadastrar peca (spec:
// "Permitir cadastrar novas montadoras posteriormente" dentro do cadastro).
router.post(
  "/",
  requirePermission("canCreateParts"),
  validate(controller.createManufacturerSchema),
  controller.create
);

export default router;
