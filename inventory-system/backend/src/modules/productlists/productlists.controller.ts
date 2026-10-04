import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as service from "./productlists.service";

export const listSectors = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ items: await service.listSectors() });
});

export const createSector = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.createSector(req.body.name, req.user!.id);
  res.status(201).json({ item });
});

export const deleteSector = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteSector(req.params.id, req.user!.id);
  res.status(204).send();
});

export const listEmployees = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ items: await service.listEmployees() });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.createEmployee(req.body.name, req.user!.id);
  res.status(201).json({ item });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteEmployee(req.params.id, req.user!.id);
  res.status(204).send();
});
