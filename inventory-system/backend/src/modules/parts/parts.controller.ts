import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as service from "./parts.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listParts(req.query as never);
  res.json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getPartDetail(req.params.id, req.query as Record<string, unknown>);
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const part = await service.createPart(req.body, req.user!.id);
  res.status(201).json({ part });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const part = await service.updatePart(req.params.id, req.body, req.user!.id);
  res.json({ part });
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const part = await service.archivePart(req.params.id, req.user!.id);
  res.json({ part });
});

export const unarchive = asyncHandler(async (req: Request, res: Response) => {
  const part = await service.unarchivePart(req.params.id, req.user!.id);
  res.json({ part });
});
