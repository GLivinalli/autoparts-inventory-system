import { z } from "zod";
import { MovementType } from "@prisma/client";

export const createMovementSchema = z.object({
  type: z.nativeEnum(MovementType),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  description: z.string().trim().max(300).optional(),
});

export const listMovementsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  partId: z.string().uuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
