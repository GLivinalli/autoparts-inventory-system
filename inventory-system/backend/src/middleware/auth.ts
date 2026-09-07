import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/db/prisma";
import { verifyAccessToken } from "@/modules/auth/tokens";

// O usuario NUNCA vem do body/query da requisicao (spec item 5: "Nunca
// permitir que o usuario escolha manualmente 'Adicionado por: Joao'").
// Ele sempre e derivado do access token assinado pelo servidor, lido de um
// cookie HttpOnly.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.access_token as string | undefined;
    if (!token) throw AppError.unauthorized();

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { permission: true },
    });

    if (!user || !user.active) {
      throw AppError.unauthorized("Usuario inativo ou nao encontrado");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      permission: user.permission,
    };

    next();
  } catch {
    next(AppError.unauthorized("Sessao invalida ou expirada"));
  }
}

// Middleware "opcional": preenche req.user quando ha um token valido, mas
// nao bloqueia a requisicao quando nao ha (usado em rotas publicas que
// variam levemente o comportamento se o usuario estiver logado).
export async function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { permission: true },
    });
    if (user?.active) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        permission: user.permission,
      };
    }
  } catch {
    // token invalido/expirado: segue sem usuario autenticado
  }
  next();
}
