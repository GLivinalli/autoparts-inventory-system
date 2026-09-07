import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/db/prisma";

const detailInclude = {
  manufacturer: true,
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PartDefaultArgs["include"];

export function list(where: Prisma.PartWhereInput, skip: number, take: number) {
  return prisma.part.findMany({
    where,
    include: detailInclude,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function count(where: Prisma.PartWhereInput) {
  return prisma.part.count({ where });
}

export function findById(id: string, client: PrismaClient | Prisma.TransactionClient = prisma) {
  return client.part.findUnique({ where: { id }, include: detailInclude });
}

export function findBySku(sku: string) {
  return prisma.part.findUnique({ where: { sku } });
}

// Recebe o client (prisma padrao ou uma tx) para permitir que o service de
// movimentacoes crie a peca e o primeiro movimento na mesma transacao.
export function create(
  data: Prisma.PartCreateInput,
  client: PrismaClient | Prisma.TransactionClient = prisma
) {
  return client.part.create({ data, include: detailInclude });
}

export function update(id: string, data: Prisma.PartUpdateInput) {
  return prisma.part.update({ where: { id }, data, include: detailInclude });
}

export function archive(id: string) {
  return prisma.part.update({ where: { id }, data: { archivedAt: new Date() }, include: detailInclude });
}

export function unarchive(id: string) {
  return prisma.part.update({ where: { id }, data: { archivedAt: null }, include: detailInclude });
}

export function dashboardCounts() {
  return prisma.$transaction([
    prisma.part.count({ where: { archivedAt: null } }),
    prisma.part.aggregate({ where: { archivedAt: null }, _sum: { quantity: true } }),
    prisma.part.count({ where: { archivedAt: null, quantity: 0 } }),
    prisma.part.count({ where: { archivedAt: null, condition: "COM_DANO" } }),
    prisma.part.count({ where: { archivedAt: null, condition: "SEM_DANO" } }),
  ]);
}

export function recentlyAdded(take: number) {
  return prisma.part.findMany({
    where: { archivedAt: null },
    include: detailInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}
