import { z } from "zod";
import { PartCondition, PartSide } from "@prisma/client";

const conditionEnum = z.nativeEnum(PartCondition);
const sideEnum = z.nativeEnum(PartSide);

// Regra: se condition = COM_DANO, damageNotes vira obrigatorio.
const damageRefinement = <T extends { condition: PartCondition; damageNotes?: string | null }>(
  data: T,
  ctx: z.RefinementCtx
) => {
  if (data.condition === PartCondition.COM_DANO && !data.damageNotes?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Descreva o dano quando o estado for 'Com dano'",
      path: ["damageNotes"],
    });
  }
};

export const createPartSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto").max(150),
    // SKU opcional: se omitido, o backend gera o proximo AUT-000001, AUT-000002...
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2,6}-\d{4,10}$/, "SKU deve seguir o formato AUT-000001")
      .optional(),
    manufacturerId: z.string().uuid("Selecione uma montadora"),
    side: sideEnum,
    condition: conditionEnum.default(PartCondition.SEM_DANO),
    damageNotes: z.string().trim().max(500).optional(),
    // Estoque inicial informado no cadastro. Nao grava direto em quantity:
    // o service cria um InventoryMovement ENTRADA para chegar nesse valor,
    // preservando a regra "toda mudanca de estoque gera historico".
    initialQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
    inventoryDate: z.coerce.date({ errorMap: () => ({ message: "Data do inventario invalida" }) }),
    photoUrl: z.string().url().optional().nullable(),
  })
  .superRefine(damageRefinement);

export const updatePartSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    manufacturerId: z.string().uuid().optional(),
    side: sideEnum.optional(),
    condition: conditionEnum.optional(),
    damageNotes: z.string().trim().max(500).optional().nullable(),
    inventoryDate: z.coerce.date().optional(),
    photoUrl: z.string().url().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.condition === PartCondition.COM_DANO && data.damageNotes === undefined) {
      // so exige se condition esta sendo trocada para COM_DANO nesta chamada
      return;
    }
    if (data.condition === PartCondition.COM_DANO && !data.damageNotes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Descreva o dano quando o estado for 'Com dano'",
        path: ["damageNotes"],
      });
    }
  });

export const listPartsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  manufacturerId: z.string().uuid().optional(),
  side: sideEnum.optional(),
  condition: conditionEnum.optional(),
  stock: z.enum(["available", "out"]).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type ListPartsQuery = z.infer<typeof listPartsQuerySchema>;
