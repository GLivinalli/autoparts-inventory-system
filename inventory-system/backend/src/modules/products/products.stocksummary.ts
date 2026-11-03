import { Request, Response } from "express";
import { prisma } from "@/db/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

// Valor total parado em estoque: soma, de todos os lotes em aberto, da
// quantidade que ainda resta vezes o custo por unidade daquele lote. E a
// mesma conta da coluna "Valor em estoque", mas de todos os produtos.
export const stockSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const archived = req.query.archived === "true";

  const batches = await prisma.productBatch.findMany({
    where: {
      quantityRemaining: { gt: 0 },
      product: { archivedAt: archived ? { not: null } : null },
    },
    select: { productId: true, quantityRemaining: true, unitCostCents: true },
  });

  let totalValueCents = 0;
  let totalUnits = 0;
  const productIds = new Set<string>();
  for (const b of batches) {
    totalValueCents += b.quantityRemaining * b.unitCostCents;
    totalUnits += b.quantityRemaining;
    productIds.add(b.productId);
  }

  res.json({ totalValueCents, totalUnits, productCount: productIds.size });
});
