// Este arquivo existe separado de parts.repository.ts apenas para deixar
// explicito, na leitura do codigo, que "updateQuantity" e uma operacao
// sensivel: ela SO deve ser chamada de dentro de movements.service, sempre
// dentro de uma transacao que tambem grava o InventoryMovement.
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/db/prisma";

export function lockAndFindById(id: string, client: PrismaClient | Prisma.TransactionClient = prisma) {
  return client.part.findUnique({ where: { id } });
}

export function updateQuantity(
  id: string,
  quantity: number,
  client: PrismaClient | Prisma.TransactionClient = prisma
) {
  return client.part.update({ where: { id }, data: { quantity } });
}
