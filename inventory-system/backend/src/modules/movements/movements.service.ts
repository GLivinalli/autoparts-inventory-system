import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { parsePagination, toPaginatedResult } from "@/utils/pagination";
import { logAudit } from "@/modules/audit/audit.service";
import * as partsRepoExtra from "@/modules/parts/parts.repository.extra";
import * as repo from "./movements.repository";
import { CreateMovementInput } from "./movements.validation";

/**
 * Nucleo do controle de estoque (spec item 13).
 *
 * Fluxo, sempre dentro de uma unica transacao de banco:
 *   1. Bloqueia/le a peca (via client da transacao, nao o prisma global)
 *   2. Confere quantidade disponivel (nunca permite estoque negativo)
 *   3. Grava o InventoryMovement (quantidade antes/depois, usuario, tipo)
 *   4. Atualiza Part.quantity para o novo valor
 * Qualquer erro no meio do caminho faz o Prisma dar ROLLBACK automatico,
 * entao o historico e a quantidade nunca ficam inconsistentes entre si.
 *
 * Esta e a UNICA funcao do sistema autorizada a alterar Part.quantity.
 */
async function applyMovement(
  tx: Prisma.TransactionClient,
  params: { partId: string; type: MovementType; quantity: number; userId: string; description?: string }
) {
  const part = await partsRepoExtra.lockAndFindById(params.partId, tx);
  if (!part) throw AppError.notFound("Peca nao encontrada");
  if (part.archivedAt) throw AppError.validation("Nao e possivel movimentar uma peca arquivada");

  const quantityBefore = part.quantity;
  let quantityAfter: number;

  if (params.type === MovementType.ENTRADA) {
    quantityAfter = quantityBefore + params.quantity;
  } else {
    quantityAfter = quantityBefore - params.quantity;
    if (quantityAfter < 0) {
      throw AppError.validation("Quantidade insuficiente em estoque.");
    }
  }

  const movement = await repo.create(
    {
      part: { connect: { id: params.partId } },
      type: params.type,
      quantity: params.quantity,
      quantityBefore,
      quantityAfter,
      user: { connect: { id: params.userId } },
      description: params.description,
    },
    tx
  );

  await partsRepoExtra.updateQuantity(params.partId, quantityAfter, tx);

  return { movement, quantityBefore, quantityAfter };
}

export async function createMovement(partId: string, input: CreateMovementInput, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    return applyMovement(tx, { partId, ...input, userId });
  });

  await logAudit({
    userId,
    action: input.type === MovementType.ENTRADA ? "STOCK_IN" : "STOCK_OUT",
    entity: "Part",
    entityId: partId,
    before: { quantity: result.quantityBefore },
    after: { quantity: result.quantityAfter },
  });

  return result.movement;
}

// Usado por parts.service ao cadastrar uma peca com estoque inicial > 0,
// dentro da MESMA transacao que cria a peca (ver parts.service.createPart).
export { applyMovement };

export async function listMovementsForPart(partId: string, query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const [items, total] = await repo.listByPart(
    partId,
    (pagination.page - 1) * pagination.pageSize,
    pagination.pageSize
  );
  return toPaginatedResult(items, total, pagination);
}

export async function listMovements(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const where: Prisma.InventoryMovementWhereInput = {};
  if (query.partId) where.partId = String(query.partId);
  if (query.type) where.type = query.type as MovementType;

  const [items, total] = await repo.listAll(
    where,
    (pagination.page - 1) * pagination.pageSize,
    pagination.pageSize
  );
  return toPaginatedResult(items, total, pagination);
}

export function recentEntradas(take = 5) {
  return repo.recent(MovementType.ENTRADA, take);
}

export function recentRetiradas(take = 5) {
  return repo.recent(MovementType.RETIRADA, take);
}

export function recentMovements(take = 10) {
  return repo.recent(undefined, take);
}
