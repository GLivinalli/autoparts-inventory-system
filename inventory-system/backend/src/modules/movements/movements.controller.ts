import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as service from "./movements.service";

export const createForPart = asyncHandler(async (req: Request, res: Response) => {
  const movement = await service.createMovement(req.params.partId, req.body, req.user!.id);
  res.status(201).json({ movement });
});

export const listForPart = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMovementsForPart(
    req.params.partId,
    req.query as Record<string, unknown>
  );
  res.json(result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMovements(req.query as Record<string, unknown>);
  res.json(result);
});
