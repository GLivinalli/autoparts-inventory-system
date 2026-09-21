import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { parsePagination, toPaginatedResult } from "@/utils/pagination";
import { logAudit } from "@/modules/audit/audit.service";
import { applyMovement } from "@/modules/movements/movements.service";
import * as movementsRepo from "@/modules/movements/movements.repository";
import * as repo from "./parts.repository";
import { CreatePartInput, ListPartsQuery, UpdatePartInput } from "./parts.validation";

export async function listParts(query: ListPartsQuery) {
  const pagination = parsePagination(query);
  const where: Prisma.PartWhereInput = { archivedAt: query.includeArchived ? undefined : null };

  // A busca por texto cobre nome, SKU e montadora. Como a posicao da peca
  // (dianteiro, direito, etc.) agora e digitada dentro do proprio nome,
  // procurar por ela funciona naturalmente atraves desse mesmo campo, sem
  // precisar de um filtro separado.
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
      { manufacturer: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.manufacturerId) where.manufacturerId = query.manufacturerId;
  if (query.condition) where.condition = query.condition;
  if (query.stock === "available") where.quantity = { gt: 0 };
  if (query.stock === "out") where.quantity = 0;

  const [items, total] = await Promise.all([
    repo.list(where, (pagination.page - 1) * pagination.pageSize, pagination.pageSize),
    repo.count(where),
  ]);

  return toPaginatedResult(items, total, pagination);
}

export async function getPartDetail(id: string, historyPage: Record<string, unknown> = {}) {
  const part = await repo.findById(id);
  if (!part) throw AppError.notFound("Peca nao encontrada");

  const pagination = parsePagination(historyPage);
  const [movements, totalMovements] = await movementsRepo.listByPart(
    id,
    (pagination.page - 1) * pagination.pageSize,
    pagination.pageSize
  );

  return {
    part,
    history: toPaginatedResult(movements, totalMovements, pagination),
  };
}

export async function createPart(input: CreatePartInput, userId: string) {
  const sku = input.sku ?? null;

  if (sku) {
    const existing = await repo.findBySku(sku);
    if (existing) throw AppError.conflict(`Ja existe uma peca com o SKU ${sku}`);
  }

  const part = await prisma.$transaction(async (tx) => {
    const created = await repo.create(
      {
        name: input.name,
        sku,
        manufacturer: { connect: { id: input.manufacturerId } },
        condition: input.condition,
        damageNotes: input.condition === "COM_DANO" ? input.damageNotes : null,
        damagePhotoUrl: input.condition === "COM_DANO" ? input.damagePhotoUrl ?? null : null,
        quantity: 0,
        inventoryDate: input.inventoryDate,
        photoUrl: input.photoUrl ?? null,
        createdBy: { connect: { id: userId } },
      },
      tx
    );

    if (input.initialQuantity > 0) {
      await applyMovement(tx, {
        partId: created.id,
        type: MovementType.ENTRADA,
        quantity: input.initialQuantity,
        userId,
        description: "Estoque inicial (cadastro da peca)",
      });
    }

    return (await repo.findById(created.id, tx)) ?? created;
  });

  await logAudit({
    userId,
    action: "CREATE_PART",
    entity: "Part",
    entityId: part!.id,
    after: { name: part!.name, sku: part!.sku, initialQuantity: input.initialQuantity },
  });

  return part;
}

export async function updatePart(id: string, input: UpdatePartInput, userId: string) {
  const before = await repo.findById(id);
  if (!before) throw AppError.notFound("Peca nao encontrada");
  if (before.archivedAt) throw AppError.validation("Nao e possivel editar uma peca arquivada");

  if (input.sku && input.sku !== before.sku) {
    const existing = await repo.findBySku(input.sku);
    if (existing && existing.id !== id) {
      throw AppError.conflict(`Ja existe uma peca com o SKU ${input.sku}`);
    }
  }

  const nextCondition = input.condition ?? before.condition;
  const part = await repo.update(id, {
    name: input.name,
    sku: input.sku,
    manufacturer: input.manufacturerId ? { connect: { id: input.manufacturerId } } : undefined,
    condition: input.condition,
    damageNotes: nextCondition === "COM_DANO" ? input.damageNotes ?? before.damageNotes : null,
    damagePhotoUrl:
      nextCondition === "COM_DANO" ? input.damagePhotoUrl ?? before.damagePhotoUrl : null,
    inventoryDate: input.inventoryDate,
    photoUrl: input.photoUrl,
  });

  await logAudit({
    userId,
    action: "UPDATE_PART",
    entity: "Part",
    entityId: id,
    before: { name: before.name, condition: before.condition },
    after: { name: part.name, condition: part.condition },
  });

  return part;
}

export async function archivePart(id: string, userId: string) {
  const before = await repo.findById(id);
  if (!before) throw AppError.notFound("Peca nao encontrada");
  if (before.archivedAt) throw AppError.validation("Peca ja esta arquivada");

  const part = await repo.archive(id);

  await logAudit({ userId, action: "ARCHIVE_PART", entity: "Part", entityId: id });
  return part;
}

export async function unarchivePart(id: string, userId: string) {
  const part = await repo.unarchive(id);
  await logAudit({ userId, action: "UNARCHIVE_PART", entity: "Part", entityId: id });
  return part;
}

export async function getDashboardSummary() {
  const [totalParts, quantityAgg, outOfStock, damaged, undamaged] = await repo.dashboardCounts();

  const [recentlyAdded, recentEntradas, recentRetiradas, recentMovements] = await Promise.all([
    repo.recentlyAdded(5),
    movementsRepo.recent("ENTRADA", 5),
    movementsRepo.recent("RETIRADA", 5),
    movementsRepo.recent(undefined, 8),
  ]);

  return {
    totals: {
      totalParts,
      totalQuantity: quantityAgg._sum.quantity ?? 0,
      outOfStock,
      damaged,
      undamaged,
    },
    recentlyAdded,
    recentEntradas,
    recentRetiradas,
    recentMovements,
  };
}
