import { z } from "zod";
import { MovementType } from "@prisma/client";

// Cadastro de produto ja inclui o estoque inicial (quantidade + valor
// TOTAL da compra, nao valor unitario - o usuario informa quanto pagou no
// total e o sistema calcula o custo por unidade sozinho). Se
// initialQuantity for 0, totalValueReais e ignorado.
export const createProductSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto").max(150).transform((v) => v.toUpperCase()),
    manufacturer: z.string().trim().min(1, "Informe o fabricante").max(150).transform((v) => v.toUpperCase()),
    initialQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
    totalValueReais: z.coerce.number().nonnegative("Valor não pode ser negativo").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.initialQuantity > 0 && data.totalValueReais === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o valor total pago",
        path: ["totalValueReais"],
      });
    }
  });

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(150).transform((v) => v.toUpperCase()).optional(),
  manufacturer: z.string().trim().min(1).max(150).transform((v) => v.toUpperCase()).optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  archived: z.coerce.boolean().optional(),
});

// Entrada tambem usa valor TOTAL, nao unitario - mesmo raciocinio do
// cadastro inicial.
export const createEntradaSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  totalValueReais: z.coerce.number().nonnegative("Valor nao pode ser negativo"),
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
export const updateMovementDateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida")
    .refine((v) => !Number.isNaN(new Date(`${v}T12:00:00.000Z`).getTime()), "Data invalida")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "A data nao pode ser no futuro"),
});
// Somente ADMIN (a rota exige). Altera a data de uma ENTRADA e do lote que
// ela criou - e a data do lote que define a ordem do FIFO e os "dias em
// estoque". A saidas ja registradas nao sao recalculadas.
export async function updateMovementDate(movementId: string, date: string, userId: string) {
  const movement = await movementsRepo.findById(movementId);
  if (!movement) throw AppError.notFound("Movimentacao nao encontrada");
  if (movement.type !== MovementType.ENTRADA) {
    throw AppError.validation("So e possivel alterar a data de entradas");
  }

  // 12:00 UTC para a data nunca "virar" de dia por causa de fuso horario.
  const newDate = new Date(`${date}T12:00:00.000Z`);

  await prisma.$transaction(async (tx) => {
    await tx.productMovement.update({ where: { id: movementId }, data: { createdAt: newDate } });
    await tx.productBatch.updateMany({ where: { movementId }, data: { createdAt: newDate } });
  });

  await logAudit({
    userId,
    action: "UPDATE_PRODUCT_MOVEMENT_DATE",
    entity: "ProductMovement",
    entityId: movementId,
    before: { createdAt: movement.createdAt },
    after: { createdAt: newDate },
  });
}
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateEntradaInput = z.infer<typeof createEntradaSchema>;
export type CreateSaidaInput = z.infer<typeof createSaidaSchema>;
