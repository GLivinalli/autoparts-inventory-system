import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as service from "./users.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listUsers(req.query as Record<string, unknown>);
  res.json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.getUser(req.params.id);
  res.json({ user });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.createUser(req.body, req.user!.id);
  res.status(201).json({ user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.updateUser(req.params.id, req.body, req.user!.id);
  res.json({ user });
});
