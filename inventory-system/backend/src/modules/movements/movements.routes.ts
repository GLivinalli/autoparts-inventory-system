import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import * as controller from "./movements.controller";
import { listMovementsQuerySchema } from "./movements.validation";

const router = Router();

// Historico geral de movimentacoes. Qualquer usuario autenticado pode
// visualizar (spec item 6: "Visualizar historico" esta liberado para
// usuario comum); nao ha rota de edicao/remocao aqui (append-only).
router.get("/", requireAuth, validate(listMovementsQuerySchema, "query"), controller.list);

export default router;
