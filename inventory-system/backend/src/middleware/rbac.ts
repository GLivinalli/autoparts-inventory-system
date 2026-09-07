import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { hasPermission, PermissionAction } from "@/utils/permissions";

// Toda regra critica e validada aqui no backend, independente do que o
// frontend esconde ou desabilita na interface (spec item 14).
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden());
    }
    next();
  };
}

export function requirePermission(action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!hasPermission(req.user, action)) {
      return next(AppError.forbidden(`Voce nao tem permissao para: ${action}`));
    }
    next();
  };
}
