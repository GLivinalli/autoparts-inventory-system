import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import * as controller from "./parts.controller";
import { createPartSchema, listPartsQuerySchema, updatePartSchema } from "./parts.validation";
import * as movementsController from "@/modules/movements/movements.controller";
import { createMovementSchema, listMovementsQuerySchema } from "@/modules/movements/movements.validation";
import { requireStockPermission } from "@/modules/movements/movements.middleware";

const router = Router();

router.use(requireAuth);

// Consulta e livre para qualquer usuario autenticado (spec item 6: usuario
// comum sempre pode "Consultar pecas" e "Visualizar historico").
router.get("/", validate(listPartsQuerySchema, "query"), controller.list);
router.get("/:id", controller.getOne);

router.post("/", requirePermission("canCreateParts"), validate(createPartSchema), controller.create);
router.patch("/:id", requirePermission("canEditParts"), validate(updatePartSchema), controller.update);
router.post("/:id/archive", requirePermission("canArchiveParts"), controller.archive);
router.post("/:id/unarchive", requirePermission("canArchiveParts"), controller.unarchive);

// Movimentacoes de uma peca especifica: /parts/:partId/movements
router.get(
  "/:partId/movements",
  validate(listMovementsQuerySchema, "query"),
  movementsController.listForPart
);
router.post(
  "/:partId/movements",
  validate(createMovementSchema),
  requireStockPermission,
  movementsController.createForPart
);

export default router;
