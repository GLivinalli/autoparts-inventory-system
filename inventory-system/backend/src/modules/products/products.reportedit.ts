import { Request, Response } from "express";
import { z } from "zod";
import { MovementType } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { asyncHandler } from "@/utils/asyncHandler";
import { logAudit } from "@/modules/audit/audit.service";
import * as movementsRepo from "./products.movements.repository";

// Edicao feita pela tabela do relatorio. Somente ADMIN (a rota exige).
// Todos os campos sao opcionais, mas pelo menos um precisa vir.
export const editMovementSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida")
      .refine((v) => !Number.isNaN(new Date(`${v}T12:00:00.000Z`).getTime()), "Data invalida")
      .refine((v) => v <= new Date().toISOString().slice(0, 10), "A data nao pode ser no futuro")
      .optional(),
    quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero").optional(),
    funcionario: z
      .string()
      .trim()
      .min(1, "Informe o funcionario")
      .max(120)
      .transform((v) => v.toUpperCase())
      .optional(),
  })
  .refine(
    (d) => d.date !== undefined || d.quantity !== undefined || d.funcionario !== undefined,
    { message: "Nada para alterar" }
  );

export type EditMovementInput = z.infer<typeof editMovementSchema>;

type Snapshot = {
  createdAt: string;
  quantity: number;
  totalCents: number;
  funcionario: string | null;
};

export async function editMovement(movementId: string, input: EditMovementInput, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const movement = await movementsRepo.findById(movementId, tx);
    if (!movement) throw AppError.notFound("Movimentacao nao encontrada");

    const isEntry = movement.type === MovementType.ENTRADA;
    const snapshotBefore: Snapshot = {
      createdAt: movement.createdAt.toISOString(),
      quantity: movement.quantity,
      totalCents: movement.totalCents,
      funcionario: movement.funcionario,
    };
    const snapshotAfter: Snapshot = { ...snapshotBefore };

    // ---- Funcionario (so existe em retirada, e precisa estar na lista) ----
    if (input.funcionario !== undefined) {
      if (isEntry) throw AppError.validation("Entradas nao tem funcionario");
      const employee = await tx.productEmployee.findFirst({
        where: { name: { equals: input.funcionario, mode: "insensitive" } },
      });
      if (!employee) {
        throw AppError.validation("Esse funcionario nao esta na lista. Peca a um administrador para adiciona-lo.");
      }
      await tx.productMovement.update({ where: { id: movementId }, data: { funcionario: employee.name } });
      snapshotAfter.funcionario = employee.name;
    }

    // ---- Quantidade ----
    if (input.quantity !== undefined && input.quantity !== movement.quantity) {
      if (isEntry) {
        // Entrada: mantem o custo por unidade; o valor total acompanha.
        const batch = movement.originBatch;
        if (!batch) throw AppError.validation("Lote da entrada nao encontrado");
        const consumed = batch.quantityOriginal - batch.quantityRemaining;
        if (input.quantity < consumed) {
          throw AppError.validation(
            `Ja foram retiradas ${consumed} unidade(s) deste lote. A quantidade nao pode ser menor que isso.`
          );
        }
        const totalCents = batch.unitCostCents * input.quantity;
        await tx.productMovement.update({
          where: { id: movementId },
          data: { quantity: input.quantity, unitCostCents: batch.unitCostCents, totalCents },
        });
        await tx.productBatch.update({
          where: { id: batch.id },
          data: { quantityOriginal: input.quantity, quantityRemaining: input.quantity - consumed },
        });
        await tx.product.update({
          where: { id: movement.productId },
          data: { quantity: { increment: input.quantity - batch.quantityOriginal } },
        });
        snapshotAfter.quantity = input.quantity;
        snapshotAfter.totalCents = totalCents;
      } else {
        // Retirada: devolve aos lotes o que tinha consumido e consome de novo (FIFO).
        for (const c of movement.consumptions) {
          await tx.productBatch.update({
            where: { id: c.batchId },
            data: { quantityRemaining: { increment: c.quantityConsumed } },
          });
        }
        await tx.productBatchConsumption.deleteMany({ where: { movementId } });

        const batches = await tx.productBatch.findMany({
          where: { productId: movement.productId, quantityRemaining: { gt: 0 } },
          orderBy: { createdAt: "asc" },
        });
        const available = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
        if (available < input.quantity) {
          throw AppError.validation(
            `Estoque insuficiente: ha ${available} unidade(s) disponiveis para essa retirada.`
          );
        }

        let remaining = input.quantity;
        let totalCents = 0;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const consumeQty = Math.min(batch.quantityRemaining, remaining);
          totalCents += consumeQty * batch.unitCostCents;
          remaining -= consumeQty;
          await tx.productBatch.update({
            where: { id: batch.id },
            data: { quantityRemaining: { decrement: consumeQty } },
          });
          await tx.productBatchConsumption.create({
            data: {
              movementId,
              batchId: batch.id,
              quantityConsumed: consumeQty,
              unitCostCents: batch.unitCostCents,
            },
          });
        }

        await tx.productMovement.update({
          where: { id: movementId },
          data: { quantity: input.quantity, totalCents },
        });
        await tx.product.update({
          where: { id: movement.productId },
          data: { quantity: { increment: movement.quantity - input.quantity } },
        });
        snapshotAfter.quantity = input.quantity;
        snapshotAfter.totalCents = totalCents;
      }
    }

    // ---- Data (12:00 UTC para nunca "virar" de dia por causa do fuso) ----
    if (input.date) {
      const newDate = new Date(`${input.date}T12:00:00.000Z`);
      await tx.productMovement.update({ where: { id: movementId }, data: { createdAt: newDate } });
      if (isEntry) {
        // E a data do lote que define a ordem do FIFO e os "dias em estoque".
        await tx.productBatch.updateMany({ where: { movementId }, data: { createdAt: newDate } });
      }
      snapshotAfter.createdAt = newDate.toISOString();
    }

    return { snapshotBefore, snapshotAfter };
  });

  await logAudit({
    userId,
    action: "EDIT_PRODUCT_MOVEMENT",
    entity: "ProductMovement",
    entityId: movementId,
    before: result.snapshotBefore,
    after: result.snapshotAfter,
  });
}

export const editMovementHandler = asyncHandler(async (req: Request, res: Response) => {
  await editMovement(req.params.movementId, req.body, req.user!.id);
  res.status(204).send();
});
