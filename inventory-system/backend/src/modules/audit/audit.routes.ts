import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { asyncHandler } from "@/utils/asyncHandler";
import { listAuditLogs } from "./audit.service";

const router = Router();

// Somente leitura, somente ADMIN. Nao ha rota de DELETE/PATCH aqui de
// proposito: usuarios comuns (e ate administradores via API) nao podem
// apagar ou alterar registros de auditoria (spec item 16).
router.get(
  "/",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const result = await listAuditLogs(req.query as Record<string, unknown>);
    res.json(result);
  })
);

export default router;
