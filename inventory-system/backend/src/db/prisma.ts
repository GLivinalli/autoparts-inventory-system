import { PrismaClient } from "@prisma/client";
import { isProduction } from "@/config/env";

// Evita criar multiplas instancias do PrismaClient durante hot-reload em dev.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    // O padrao do Prisma e 5s por transacao. Com o banco no Neon (que
    // "acorda" depois de ficar parado) isso estourava ao salvar produtos.
    transactionOptions: {
      maxWait: 10000,
      timeout: 20000,
    },
  });

if (!isProduction) {
  global.__prisma = prisma;
}
