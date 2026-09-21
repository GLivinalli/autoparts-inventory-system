import { z } from "zod";
import { MovementType } from "@prisma/client";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(150),
  manufacturer: z.string().trim().min(1, "Informe o fabricante").max(150),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  manufacturer: z.string().trim().min(1).max(150).optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
});

export const createEntradaSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  unitCostReais: z.coerce.number().nonnegative("Valor nao pode ser negativo"),
  description: z.string().trim().max(300).optional(),
});

export const createSaidaSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  setor: z.string().trim().min(1, "Informe o setor").max(120),
  funcionario: z.string().trim().min(1, "Informe o funcionario").max(120),
  description: z.string().trim().max(300).optional(),
});

export const listProductMovementsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  productId: z.string().uuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
  setor: z.string().trim().optional(),
  funcionario: z.string().trim().optional(),
});

export const consumptionReportQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato esperado: AAAA-MM")
    .optional(),
  setor: z.string().trim().optional(),
  funcionario: z.string().trim().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateEntradaInput = z.infer<typeof createEntradaSchema>;
export type CreateSaidaInput = z.infer<typeof createSaidaSchema>;
