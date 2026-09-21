import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/db/prisma";

const withCreatedBy = {
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ProductDefaultArgs["include"];

export function list(where: Prisma.ProductWhereInput, skip: number, take: number) {
  return prisma.product.findMany({
    where,
    include: withCreatedBy,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function count(where: Prisma.ProductWhereInput) {
  return prisma.product.count({ where });
}

export function findById(id: string, client: PrismaClient | Prisma.TransactionClient = prisma) {
  return client.product.findUnique({ where: { id }, include: withCreatedBy });
}

export function create(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data, include: withCreatedBy });
}

export function update(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data, include: withCreatedBy });
}

export function archive(id: string) {
  return prisma.product.update({ where: { id }, data: { archivedAt: new Date() }, include: withCreatedBy });
}

export function unarchive(id: string) {
  return prisma.product.update({ where: { id }, data: { archivedAt: null }, include: withCreatedBy });
}

export function openBatchesFor(productIds: string[]) {
  if (productIds.length === 0) return Promise.resolve([]);
  return prisma.productBatch.findMany({
    where: { productId: { in: productIds }, quantityRemaining: { gt: 0 } },
    orderBy: { createdAt: "asc" },
  });
}
