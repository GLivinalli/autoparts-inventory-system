import { NextFunction, Request, Response } from "express";
import { MovementType } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { hasPermission } from "@/utils/permissions";

// Roda DEPOIS do middleware validate(createMovementSchema), entao req.body.type
// ja esta validado como MovementType. Entrada e retirada tem permissoes
// separadas (spec item 6: "Fazer entradas" / "Fazer retiradas").
export function requireStockPermission(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(AppError.unauthorized());

  const action = req.body?.type === MovementType.ENTRADA ? "canStockIn" : "canStockOut";
  if (!hasPermission(req.user, action)) {
    return next(AppError.forbidden("Voce nao tem permissao para realizar esta movimentacao"));
  }
  next();
}
