import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import { uploadPartPhoto } from "./upload.service";

// Memoria (nao disco): o buffer vai direto para o R2, o servidor nunca
// mantem o arquivo do usuario persistido em disco local.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

const router = Router();

router.post(
  "/part-photo",
  requireAuth,
  requirePermission("canCreateParts"),
  upload.single("photo"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw AppError.validation("Nenhum arquivo enviado");
    const url = await uploadPartPhoto(req.file, req.user!.id);
    res.status(201).json({ url });
  })
);

export default router;
