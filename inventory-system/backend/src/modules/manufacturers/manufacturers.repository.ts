import { prisma } from "@/db/prisma";

export function listAll() {
  return prisma.manufacturer.findMany({ orderBy: { name: "asc" } });
}

export function findByName(name: string) {
  return prisma.manufacturer.findUnique({ where: { name } });
}

export function create(name: string) {
  return prisma.manufacturer.create({ data: { name } });
}
