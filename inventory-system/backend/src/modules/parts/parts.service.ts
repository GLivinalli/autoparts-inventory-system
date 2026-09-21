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
  // Por padrao mostra so as ativas. Com "archived: true", mostra so as
  // arquivadas - sao duas listas separadas, nunca misturadas.
  const where: Prisma.PartWhereInput = { archivedAt: query.archived ? { not: null } : null };

  // Busca por palavras, nao por frase exata: cada palavra digitada precisa
  // aparecer em algum lugar (nome, SKU ou montadora), mas a ORDEM nao
  // importa. Ex.: procurar "farol esquerdo dianteiro" encontra uma peca
  // cadastrada como "Farol dianteiro esquerdo", porque as tres palavras
  // aparecem no nome, so que em ordem diferente.
  if (query.search) {
    const words = query.search.trim().split(/\s+/).filter(Boolean);
    where.AND = words.map((word) => ({
      OR: [
        { name: { contains: word, mode: "insensitive" as const } },
        { sku: { contains: word, mode: "insensitive" as const } },
        { manufacturer: { name: { contains: word, mode: "insensitive" as const } } },
      ],
    }));
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
  // SKU agora e opcional e de texto livre. Se nao for informado, fica NULL
  // no banco (permitido varias vezes, ja que a restricao UNIQUE do Postgres
  // nao considera NULL == NULL). So checamos duplicidade quando um SKU foi
  // de fato digitado.
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
        // Foto do dano so faz sentido quando a peca esta marcada "Com dano".
        damagePhotoUrl: input.condition === "COM_DANO" ? input.damagePhotoUrl ?? null : null,
        quantity: 0,
        inventoryDate: input.inventoryDate,
        photoUrl: input.photoUrl ?? null,
        createdBy: { connect: { id: userId } },
      },
      tx
    );

    // Estoque inicial (se houver) tambem nasce como um movimento registrado,
    // nunca como uma escrita direta em quantity (principio fundamental da spec).
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

  // Se um SKU novo foi informado e e diferente do atual, confere duplicidade
  // antes de gravar (a constraint UNIQUE do banco tambem protege isso, mas
  // aqui devolvemos uma mensagem amigavel em vez do erro generico).
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

  // Nunca excluida de fato: arquivar preserva o historico de movimentacoes
  // e a rastreabilidade (spec item 7).
  const part = await repo.archive(id);

  await logAudit({ userId, action: "ARCHIVE_PART", entity: "Part", entityId: id });
  return part;
}

export async function unarchivePart(id: string, userId: string) {
  const part = await repo.unarchive(id);
  await logAudit({ userId, action: "UNARCHIVE_PART", entity: "Part", entityId: id });
  return part;
}

// Exclusao definitiva - so permitida para pecas ja arquivadas. Apaga junto
// todo o historico de movimentacoes dela (o relacionamento no banco agora
// usa Cascade so para este caso). Feita para limpar cadastros de teste; o
// registro de auditoria da propria exclusao continua guardado, mesmo apos
// a peca sumir do banco.
export async function deletePart(id: string, userId: string) {
  const before = await repo.findById(id);
  if (!before) throw AppError.notFound("Peca nao encontrada");
  if (!before.archivedAt) {
    throw AppError.validation("So e possivel excluir pecas que ja estao arquivadas");
  }

  await logAudit({
    userId,
    action: "DELETE_PART",
    entity: "Part",
    entityId: id,
    before: { name: before.name, sku: before.sku },
  });

  await repo.remove(id);
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
