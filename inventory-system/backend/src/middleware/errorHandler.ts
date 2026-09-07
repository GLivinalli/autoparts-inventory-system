import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { isProduction } from "@/config/env";

// Ultimo middleware da cadeia. Garante que:
// - erros de negocio (AppError) voltam com mensagem clara e status correto
// - erros do Prisma (ex.: violacao de UNIQUE do SKU) viram mensagens amigaveis
// - qualquer outro erro inesperado NUNCA vaza stack trace/detalhe interno
//   para o cliente, especialmente em producao.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[] | undefined)?.join(", ") ?? "campo";
      return res.status(409).json({
        error: { code: "CONFLICT", message: `Ja existe um registro com este ${field}.` },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Registro nao encontrado." },
      });
    }
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocorreu um erro inesperado. Tente novamente.",
      ...(isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
}
