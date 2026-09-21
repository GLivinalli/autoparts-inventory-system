import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as service from "./products.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as never);
  res.json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getProductDetail(req.params.id, req.query as Record<string, unknown>);
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.createProduct(req.body, req.user!.id);
  res.status(201).json({ product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.updateProduct(req.params.id, req.body, req.user!.id);
  res.json({ product });
});

export const createEntrada = asyncHandler(async (req: Request, res: Response) => {
  const movement = await service.createEntrada(req.params.id, req.body, req.user!.id);
  res.status(201).json({ movement });
});

export const createSaida = asyncHandler(async (req: Request, res: Response) => {
  const movement = await service.createSaida(req.params.id, req.body, req.user!.id);
  res.status(201).json({ movement });
});

export const deleteMovement = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteMovement(req.params.movementId, req.user!.id);
  res.status(204).send();
});

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMovements(req.query as Record<string, unknown>);
  res.json(result);
});

export const consumptionReport = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getConsumptionReport(
    req.query as { month?: string; setor?: string; funcionario?: string }
  );
  res.json({ items });
});

export const monthlyBalance = asyncHandler(async (_req: Request, res: Response) => {
  const items = await service.getMonthlyBalance();
  res.json({ items });
});
