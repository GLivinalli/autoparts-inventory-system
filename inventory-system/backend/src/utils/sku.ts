import { prisma } from "@/db/prisma";

const SKU_PREFIX = "AUT";
const SKU_DIGITS = 6;

// Gera o proximo SKU sequencial (AUT-000001, AUT-000002, ...).
// A restricao UNIQUE no banco (schema.prisma) e a garantia final contra
// colisao; esta funcao apenas calcula um bom "proximo" numero.
export async function generateNextSku(): Promise<string> {
  const lastPart = await prisma.part.findFirst({
    where: { sku: { startsWith: `${SKU_PREFIX}-` } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });

  let nextNumber = 1;
  if (lastPart) {
    const match = lastPart.sku.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${SKU_PREFIX}-${String(nextNumber).padStart(SKU_DIGITS, "0")}`;
}

export function isValidSkuFormat(sku: string): boolean {
  return /^[A-Z]{2,6}-\d{4,10}$/.test(sku);
}
