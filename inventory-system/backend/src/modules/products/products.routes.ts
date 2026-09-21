import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
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
} from "./products.validation";

const router = Router();

router.use(requireAuth);

router.get("/movements", validate(listProductMovementsQuerySchema, "query"), controller.listMovements);
router.get("/reports/consumption", validate(consumptionReportQuerySchema, "query"), controller.consumptionReport);
router.get("/reports/monthly-balance", controller.monthlyBalance);
router.delete("/movements/:movementId", requirePermission("canDeleteProductMoves"), controller.deleteMovement);

router.get("/", validate(listProductsQuerySchema, "query"), controller.list);
router.get("/:id", controller.getOne);

router.post("/", requirePermission("canManageProducts"), validate(createProductSchema), controller.create);
router.patch("/:id", requirePermission("canManageProducts"), validate(updateProductSchema), controller.update);

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
