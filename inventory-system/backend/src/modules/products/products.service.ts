import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { parsePagination, toPaginatedResult } from "@/utils/pagination";
import { logAudit } from "@/modules/audit/audit.service";
import * as repo from "./products.repository";
import * as movementsRepo from "./products.movements.repository";
import {
  CreateEntradaInput,
  CreateProductInput,
  CreateSaidaInput,
  ListProductsQuery,
  UpdateProductInput,
} from "./products.validation";

function reaisToCents(reais: number) {
  return Math.round(reais * 100);
}

export async function listProducts(query: ListProductsQuery) {
  const pagination = parsePagination(query);
  const where: Prisma.ProductWhereInput = { archivedAt: query.archived ? { not: null } : null };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { manufacturer: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    repo.list(where, (pagination.page - 1) * pagination.pageSize, pagination.pageSize),
    repo.count(where),
  ]);

  const batches = await repo.openBatchesFor(items.map((p) => p.id));
  const oldestByProduct = new Map<string, Date>();
  const valueByProduct = new Map<string, number>();
  for (const b of batches) {
    if (!oldestByProduct.has(b.productId)) oldestByProduct.set(b.productId, b.createdAt);
    valueByProduct.set(b.productId, (valueByProduct.get(b.productId) ?? 0) + b.quantityRemaining * b.unitCostCents);
  }

  const withExtras = items.map((p) => {
    const oldest = oldestByProduct.get(p.id);
    return {
      ...p,
      daysInStock: oldest ? Math.floor((Date.now() - oldest.getTime()) / 86_400_000) : null,
      stockValueCents: valueByProduct.get(p.id) ?? 0,
    };
  });

  return toPaginatedResult(withExtras, total, pagination);
}

export async function getProductDetail(id: string, historyPage: Record<string, unknown> = {}) {
  const product = await repo.findById(id);
  if (!product) throw AppError.notFound("Produto nao encontrado");

  const pagination = parsePagination(historyPage);
  const [movements, totalMovements] = await movementsRepo.listByProduct(
    id,
    (pagination.page - 1) * pagination.pageSize,
    pagination.pageSize
  );

  const openBatches = await prisma.productBatch.findMany({
    where: { productId: id, quantityRemaining: { gt: 0 } },
    orderBy: { createdAt: "asc" },
  });

  const daysInStock =
    openBatches.length > 0 ? Math.floor((Date.now() - openBatches[0].createdAt.getTime()) / 86_400_000) : null;
  const stockValueCents = openBatches.reduce((sum, b) => sum + b.quantityRemaining * b.unitCostCents, 0);

  return {
    product,
    daysInStock,
    stockValueCents,
    batches: openBatches,
    history: toPaginatedResult(movements, totalMovements, pagination),
  };
}

export async function createProduct(input: CreateProductInput, userId: string) {
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: input.name,
        manufacturer: input.manufacturer,
        createdBy: { connect: { id: userId } },
      },
    });

    if (input.initialQuantity > 0) {
      const totalCents = reaisToCents(input.totalValueReais ?? 0);
      const unitCostCents = Math.round(totalCents / input.initialQuantity);

      const movement = await movementsRepo.create(
        {
          product: { connect: { id: created.id } },
          type: MovementType.ENTRADA,
          quantity: input.initialQuantity,
          unitCostCents,
          totalCents,
          description: "Estoque inicial (cadastro do produto)",
          user: { connect: { id: userId } },
        },
        tx
      );

      await tx.productBatch.create({
        data: {
          productId: created.id,
          movementId: movement.id,
          quantityOriginal: input.initialQuantity,
          quantityRemaining: input.initialQuantity,
          unitCostCents,
        },
      });

      await tx.product.update({ where: { id: created.id }, data: { quantity: input.initialQuantity } });
    }

    return (await repo.findById(created.id, tx))!;
  });

  await logAudit({
    userId,
    action: "CREATE_PRODUCT",
    entity: "Product",
    entityId: product.id,
    after: { name: product.name, manufacturer: product.manufacturer, initialQuantity: input.initialQuantity },
  });

  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput, userId: string) {
  const before = await repo.findById(id);
  if (!before) throw AppError.notFound("Produto nao encontrado");
  const product = await repo.update(id, { name: input.name, manufacturer: input.manufacturer });
  await logAudit({
    userId,
    action: "UPDATE_PRODUCT",
    entity: "Product",
    entityId: id,
    before: { name: before.name, manufacturer: before.manufacturer },
    after: { name: product.name, manufacturer: product.manufacturer },
  });
  return product;
}

export async function archiveProduct(id: string, userId: string) {
  const before = await repo.findById(id);
  if (!before) throw AppError.notFound("Produto nao encontrado");
  if (before.archivedAt) throw AppError.validation("Produto ja esta arquivado");
  const product = await repo.archive(id);
  await logAudit({ userId, action: "ARCHIVE_PRODUCT", entity: "Product", entityId: id });
  return product;
}

export async function unarchiveProduct(id: string, userId: string) {
  const product = await repo.unarchive(id);
  await logAudit({ userId, action: "UNARCHIVE_PRODUCT", entity: "Product", entityId: id });
  return product;
}

export async function createEntrada(productId: string, input: CreateEntradaInput, userId: string) {
  const totalCents = reaisToCents(input.totalValueReais);
  const unitCostCents = Math.round(totalCents / input.quantity);

  const movement = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound("Produto nao encontrado");

    const created = await movementsRepo.create(
      {
        product: { connect: { id: productId } },
        type: MovementType.ENTRADA,
        quantity: input.quantity,
        unitCostCents,
        totalCents,
        description: input.description,
        user: { connect: { id: userId } },
      },
      tx
    );

    await tx.productBatch.create({
      data: {
        productId,
        movementId: created.id,
        quantityOriginal: input.quantity,
        quantityRemaining: input.quantity,
        unitCostCents,
      },
    });

    await tx.product.update({ where: { id: productId }, data: { quantity: { increment: input.quantity } } });

    return created;
  });

  await logAudit({
    userId,
    action: "PRODUCT_STOCK_IN",
    entity: "Product",
    entityId: productId,
    after: { quantity: input.quantity, unitCostCents, totalCents },
  });

  return movement;
}

export async function createSaida(productId: string, input: CreateSaidaInput, userId: string) {
  const movement = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound("Produto nao encontrado");

    const batches = await tx.productBatch.findMany({
      where: { productId, quantityRemaining: { gt: 0 } },
      orderBy: { createdAt: "asc" },
    });

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    if (totalAvailable < input.quantity) {
      throw AppError.validation("Quantidade insuficiente em estoque.");
    }

    let remaining = input.quantity;
    let totalCents = 0;
    const consumptions: { batchId: string; quantityConsumed: number; unitCostCents: number }[] = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const consumeQty = Math.min(batch.quantityRemaining, remaining);
      consumptions.push({ batchId: batch.id, quantityConsumed: consumeQty, unitCostCents: batch.unitCostCents });
      totalCents += consumeQty * batch.unitCostCents;
      remaining -= consumeQty;

      await tx.productBatch.update({
        where: { id: batch.id },
        data: { quantityRemaining: { decrement: consumeQty } },
      });
    }

    const created = await movementsRepo.create(
      {
        product: { connect: { id: productId } },
        type: MovementType.RETIRADA,
        quantity: input.quantity,
        totalCents,
        setor: input.setor,
        funcionario: input.funcionario,
        description: input.description,
        user: { connect: { id: userId } },
      },
      tx
    );

    for (const c of consumptions) {
      await tx.productBatchConsumption.create({
        data: {
          movementId: created.id,
          batchId: c.batchId,
          quantityConsumed: c.quantityConsumed,
          unitCostCents: c.unitCostCents,
        },
      });
    }

    await tx.product.update({ where: { id: productId }, data: { quantity: { decrement: input.quantity } } });

    return created;
  });

  await logAudit({
    userId,
    action: "PRODUCT_STOCK_OUT",
    entity: "Product",
    entityId: productId,
    after: { quantity: input.quantity, setor: input.setor, funcionario: input.funcionario },
  });

  return movement;
}

export async function deleteMovement(movementId: string, userId: string) {
  const movement = await movementsRepo.findById(movementId);
  if (!movement) throw AppError.notFound("Movimentacao nao encontrada");

  await prisma.$transaction(async (tx) => {
    if (movement.type === MovementType.ENTRADA) {
      const batch = movement.originBatch;
      if (batch && batch.quantityRemaining !== batch.quantityOriginal) {
        throw AppError.validation(
          "Nao e possivel excluir: este lote ja foi parcialmente consumido por uma saida. Exclua as saidas relacionadas primeiro."
        );
      }
      await tx.product.update({
        where: { id: movement.productId },
        data: { quantity: { decrement: movement.quantity } },
      });
      await movementsRepo.remove(movementId, tx);
    } else {
      for (const c of movement.consumptions) {
        await tx.productBatch.update({
          where: { id: c.batchId },
          data: { quantityRemaining: { increment: c.quantityConsumed } },
        });
      }
      await tx.product.update({
        where: { id: movement.productId },
        data: { quantity: { increment: movement.quantity } },
      });
      await movementsRepo.remove(movementId, tx);
    }
  });

  await logAudit({
    userId,
    action: "DELETE_PRODUCT_MOVEMENT",
    entity: "ProductMovement",
    entityId: movementId,
    before: { type: movement.type, quantity: movement.quantity, productId: movement.productId },
  });
}

export async function listMovements(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const where: Prisma.ProductMovementWhereInput = {};
  if (query.productId) where.productId = String(query.productId);
  if (query.type) where.type = query.type as MovementType;
  if (query.setor) where.setor = { contains: String(query.setor), mode: "insensitive" };
  if (query.funcionario) where.funcionario = { contains: String(query.funcionario), mode: "insensitive" };

  const [items, total] = await movementsRepo.listAll(
    where,
    (pagination.page - 1) * pagination.pageSize,
    pagination.pageSize
  );
  return toPaginatedResult(items, total, pagination);
}

export async function getConsumptionReport(filters: { month?: string; setor?: string; funcionario?: string }) {
  const where: Prisma.ProductMovementWhereInput = { type: MovementType.RETIRADA };
  if (filters.setor) where.setor = { contains: filters.setor, mode: "insensitive" };
  if (filters.funcionario) where.funcionario = { contains: filters.funcionario, mode: "insensitive" };

  const movements = await movementsRepo.allForReports(where);
  const rows = filters.month
    ? movements.filter((m) => m.createdAt.toISOString().slice(0, 7) === filters.month)
    : movements;

  const groups = new Map<
    string,
    {
      month: string;
      setor: string;
      funcionario: string;
      productId: string;
      productName: string;
      quantity: number;
      totalCents: number;
    }
  >();

  for (const m of rows) {
    const month = m.createdAt.toISOString().slice(0, 7);
    const key = `${month}|${m.setor ?? ""}|${m.funcionario ?? ""}|${m.productId}`;
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += m.quantity;
      existing.totalCents += m.totalCents;
    } else {
      groups.set(key, {
        month,
        setor: m.setor ?? "",
        funcionario: m.funcionario ?? "",
        productId: m.productId,
        productName: m.product.name,
        quantity: m.quantity,
        totalCents: m.totalCents,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.month.localeCompare(a.month));
}

export async function getMonthlyBalance() {
  const movements = await movementsRepo.allForReports({});
  const byMonth = new Map<string, { entradasCents: number; saidasCents: number }>();

  for (const m of movements) {
    const month = m.createdAt.toISOString().slice(0, 7);
    const entry = byMonth.get(month) ?? { entradasCents: 0, saidasCents: 0 };
    if (m.type === MovementType.ENTRADA) entry.entradasCents += m.totalCents;
    else entry.saidasCents += m.totalCents;
    byMonth.set(month, entry);
  }

  const months = Array.from(byMonth.keys()).sort();
  let cumulative = 0;
  const result = months.map((month) => {
    const { entradasCents, saidasCents } = byMonth.get(month)!;
    cumulative += entradasCents - saidasCents;
    return { month, entradasCents, saidasCents, saldoCents: cumulative };
  });

  return result.reverse();
}

export async function getProductOutputByMonth() {
  const movements = await movementsRepo.allForReports({ type: MovementType.RETIRADA });

  const byProduct = new Map<
    string,
    { productId: string; productName: string; months: Map<string, { quantity: number; totalCents: number }> }
  >();

  for (const m of movements) {
    const month = m.createdAt.toISOString().slice(0, 7);
    let entry = byProduct.get(m.productId);
    if (!entry) {
      entry = { productId: m.productId, productName: m.product.name, months: new Map() };
      byProduct.set(m.productId, entry);
    }
    const monthEntry = entry.months.get(month) ?? { quantity: 0, totalCents: 0 };
    monthEntry.quantity += m.quantity;
    monthEntry.totalCents += m.totalCents;
    entry.months.set(month, monthEntry);
  }

  return Array.from(byProduct.values()).map((entry) => ({
    productId: entry.productId,
    productName: entry.productName,
    months: Array.from(entry.months.entries())
      .map(([month, v]) => ({ month, quantity: v.quantity, totalCents: v.totalCents }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  }));
}
