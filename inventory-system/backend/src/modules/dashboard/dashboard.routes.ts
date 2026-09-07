import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";
import { getDashboardSummary } from "@/modules/parts/parts.service";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const summary = await getDashboardSummary();
    res.json(summary);
  })
);

export default router;
