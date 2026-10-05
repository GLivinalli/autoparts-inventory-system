import { MovementType } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { logAudit } from "@/modules/audit/audit.service";
import * as movementsRepo from "./products.movements.repository";

// Somente ADMIN (a rota exige). Corrige a quantidade e o valor total de uma
// ENTRADA, mantendo lote, estoque do produto e saidas coerentes entre si.
export async function updateEntrada(
  movementId: string,
  input: { quantity: number; totalValueReais: number },
  userId: string
) {
  const movement = await movementsRepo.findById(movementId);
  if (!movement) throw AppError.notFound("Movimentacao nao encontrada");
  if (movement.type !== MovementType.ENTRADA || !movement.originBatch) {
    throw AppError.validation("So e possivel editar entradas");
  }

  const batch = movement.originBatch;
  const consumed = batch.quantityOriginal - batch.quantityRemaining;

  if (input.quantity < consumed) {
    throw AppError.validation(
      `Ja foram retiradas ${consumed} unidade(s) deste lote. A quantidade nao pode ser menor que isso.`
    );
  }

  const newTotalCents = Math.round(input.totalValueReais * 100);
  const newUnitCostCents = Math.round(newTotalCents / input.quantity);
  const quantityDiff = input.quantity - batch.quantityOriginal;

  await prisma.$transaction(async (tx) => {
    await tx.productMovement.update({
      where: { id: movementId },
      data: { quantity: input.quantity, unitCostCents: newUnitCostCents, totalCents: newTotalCents },
    });

    await tx.productBatch.update({
      where: { id: batch.id },
      data: {
        quantityOriginal: input.quantity,
        quantityRemaining: input.quantity - consumed,
        unitCostCents: newUnitCostCents,
      },
    });

    await tx.product.update({
      where: { id: movement.productId },
      data: { quantity: { increment: quantityDiff } },
    });

    // As saidas que ja consumiram este lote passam a usar o custo corrigido,
    // e o total de cada uma delas e recalculado.
    if (consumed > 0) {
      await tx.productBatchConsumption.updateMany({
        where: { batchId: batch.id },
        data: { unitCostCents: newUnitCostCents },
      });

      const affected = await tx.productBatchConsumption.findMany({
        where: { batchId: batch.id },
        select: { movementId: true },
      });
      const movementIds = Array.from(new Set(affected.map((a) => a.movementId)));

      for (const id of movementIds) {
        const all = await tx.productBatchConsumption.findMany({ where: { movementId: id } });
        const total = all.reduce((sum, c) => sum + c.quantityConsumed * c.unitCostCents, 0);
        await tx.productMovement.update({ where: { id }, data: { totalCents: total } });
      }
    }
  });

  await logAudit({
    userId,
    action: "UPDATE_PRODUCT_ENTRY",
    entity: "ProductMovement",
    entityId: movementId,
    before: { quantity: movement.quantity, totalCents: movement.totalCents },
    after: { quantity: input.quantity, totalCents: newTotalCents },
  });
}
