import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/utils/asyncHandler";
import * as service from "./manufacturers.service";

export const createManufacturerSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const manufacturers = await service.listManufacturers();
  res.json({ manufacturers });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const manufacturer = await service.createManufacturer(req.body.name, req.user!.id);
  res.status(201).json({ manufacturer });
});
