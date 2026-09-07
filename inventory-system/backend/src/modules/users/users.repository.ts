import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

const userWithPermission = { include: { permission: true } } satisfies Prisma.UserDefaultArgs;

export function findById(id: string) {
  return prisma.user.findUnique({ where: { id }, ...userWithPermission });
}

export function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function list(where: Prisma.UserWhereInput, skip: number, take: number) {
  return prisma.user.findMany({
    where,
    ...userWithPermission,
    orderBy: { name: "asc" },
    skip,
    take,
  });
}

export function count(where: Prisma.UserWhereInput) {
  return prisma.user.count({ where });
}

export function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data, ...userWithPermission });
}

export function update(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data, ...userWithPermission });
}

export function upsertPermission(userId: string, data: Prisma.UserPermissionUncheckedCreateInput) {
  return prisma.userPermission.upsert({
    where: { userId },
    create: data,
    update: data,
  });
}
