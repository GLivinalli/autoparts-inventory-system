import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { logAudit } from "@/modules/audit/audit.service";

export function listSectors() {
  return prisma.productSector.findMany({ orderBy: { name: "asc" } });
}

export function listEmployees() {
  return prisma.productEmployee.findMany({ orderBy: { name: "asc" } });
}

export async function createSector(name: string, userId: string) {
  const existing = await prisma.productSector.findUnique({ where: { name } });
  if (existing) throw AppError.conflict("Este setor ja esta na lista");
  const item = await prisma.productSector.create({ data: { name } });
  await logAudit({ userId, action: "CREATE_PRODUCT_SECTOR", entity: "ProductSector", entityId: item.id, after: { name } });
  return item;
}

export async function deleteSector(id: string, userId: string) {
  const item = await prisma.productSector.findUnique({ where: { id } });
  if (!item) throw AppError.notFound("Setor nao encontrado");
  await prisma.productSector.delete({ where: { id } });
  await logAudit({ userId, action: "DELETE_PRODUCT_SECTOR", entity: "ProductSector", entityId: id, before: { name: item.name } });
}

export async function createEmployee(name: string, userId: string) {
  const existing = await prisma.productEmployee.findUnique({ where: { name } });
  if (existing) throw AppError.conflict("Este funcionario ja esta na lista");
  const item = await prisma.productEmployee.create({ data: { name } });
  await logAudit({ userId, action: "CREATE_PRODUCT_EMPLOYEE", entity: "ProductEmployee", entityId: item.id, after: { name } });
  return item;
}

export async function deleteEmployee(id: string, userId: string) {
  const item = await prisma.productEmployee.findUnique({ where: { id } });
  if (!item) throw AppError.notFound("Funcionario nao encontrado");
  await prisma.productEmployee.delete({ where: { id } });
  await logAudit({ userId, action: "DELETE_PRODUCT_EMPLOYEE", entity: "ProductEmployee", entityId: id, before: { name: item.name } });
}

// Usada na retirada: o setor e o funcionario precisam estar nas listas.
export async function assertSectorAndEmployee(setor: string, funcionario: string) {
  const [sector, employee] = await Promise.all([
    prisma.productSector.findFirst({ where: { name: { equals: setor, mode: "insensitive" } } }),
    prisma.productEmployee.findFirst({ where: { name: { equals: funcionario, mode: "insensitive" } } }),
  ]);
  if (!sector) {
    throw AppError.validation("Esse setor nao esta na lista. Peca a um administrador para adiciona-lo.");
  }
  if (!employee) {
    throw AppError.validation("Esse funcionario nao esta na lista. Peca a um administrador para adiciona-lo.");
  }
}
