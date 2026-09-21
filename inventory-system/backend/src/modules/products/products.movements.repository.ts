import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/db/prisma";

const withUser = {
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ProductMovementDefaultArgs["include"];

export function create(
  data: Prisma.ProductMovementCreateInput,
  client: PrismaClient | Prisma.TransactionClient = prisma
) {
  return client.productMovement.create({ data, include: withUser });
}

export function findById(id: string, client: PrismaClient | Prisma.TransactionClient = prisma) {
  return client.productMovement.findUnique({
    where: { id },
    include: { ...withUser, originBatch: true, consumptions: true },
  });
}

export function remove(id: string, client: PrismaClient | Prisma.TransactionClient = prisma) {
  return client.productMovement.delete({ where: { id } });
}

export function listByProduct(productId: string, skip: number, take: number) {
  return prisma.$transaction([
    prisma.productMovement.findMany({
      where: { productId },
      include: withUser,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.productMovement.count({ where: { productId } }),
  ]);
}

export function listAll(where: Prisma.ProductMovementWhereInput, skip: number, take: number) {
  return prisma.$transaction([
    prisma.productMovement.findMany({
      where,
      include: { ...withUser, product: { select: { id: true, name: true, manufacturer: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.productMovement.count({ where }),
  ]);
}

export function allForReports(where: Prisma.ProductMovementWhereInput) {
  return prisma.productMovement.findMany({
    where,
    include: { product: { select: { id: true, name: true, manufacturer: true } } },
    orderBy: { createdAt: "asc" },
  });
}
