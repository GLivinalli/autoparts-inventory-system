import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "@/middleware/auth";
import { requirePermission, requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import * as controller from "./products.controller";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  createEntradaSchema,
  createSaidaSchema,
  listProductMovementsQuerySchema,
  consumptionReportQuerySchema,
  updateMovementDateSchema,
  updateEntradaSchema,
} from "./products.validation";

const router = Router();

router.use(requireAuth);

// Rotas fixas (/movements, /reports/...) tem que vir ANTES de "/:id", senao
// o Express tentaria tratar "movements" como um ID.
router.get("/movements", validate(listProductMovementsQuerySchema, "query"), controller.listMovements);
router.get("/reports/consumption", validate(consumptionReportQuerySchema, "query"), controller.consumptionReport);
router.get("/reports/monthly-balance", controller.monthlyBalance);
router.get("/reports/output-by-month", controller.outputByMonth);
router.patch(
  "/movements/:movementId/date",
  requireRole(Role.ADMIN),
  validate(updateMovementDateSchema),
  controller.updateMovementDate
);
router.patch(
  "/movements/:movementId",
  requireRole(Role.ADMIN),
  validate(updateEntradaSchema),
  controller.updateEntrada
);
router.delete("/movements/:movementId", requirePermission("canDeleteProductMoves"), controller.deleteMovement);

router.get("/", validate(listProductsQuerySchema, "query"), controller.list);
router.get("/:id", controller.getOne);

router.post("/", requirePermission("canManageProducts"), validate(createProductSchema), controller.create);
router.patch("/:id", requirePermission("canManageProducts"), validate(updateProductSchema), controller.update);
router.post("/:id/archive", requirePermission("canManageProducts"), controller.archive);
router.post("/:id/unarchive", requirePermission("canManageProducts"), controller.unarchive);

router.post(
  "/:id/entrada",
  requirePermission("canStockInProducts"),
  validate(createEntradaSchema),
  controller.createEntrada
);
router.post(
  "/:id/saida",
  requirePermission("canStockOutProducts"),
  validate(createSaidaSchema),
  controller.createSaida
);

export default router;
