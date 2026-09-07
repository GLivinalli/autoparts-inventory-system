import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/db/prisma";

const withUser = {
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.InventoryMovementDefaultArgs["include"];

export function create(
  data: Prisma.InventoryMovementCreateInput,
  client: PrismaClient | Prisma.TransactionClient = prisma
) {
  return client.inventoryMovement.create({ data, include: withUser });
}

export function listByPart(partId: string, skip: number, take: number) {
  return prisma.$transaction([
    prisma.inventoryMovement.findMany({
      where: { partId },
      include: withUser,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.inventoryMovement.count({ where: { partId } }),
  ]);
}

export function listAll(where: Prisma.InventoryMovementWhereInput, skip: number, take: number) {
  return prisma.$transaction([
    prisma.inventoryMovement.findMany({
      where,
      include: { ...withUser, part: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);
}

export function recent(type: "ENTRADA" | "RETIRADA" | undefined, take: number) {
  return prisma.inventoryMovement.findMany({
    where: type ? { type } : {},
    include: { ...withUser, part: { select: { id: true, name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
