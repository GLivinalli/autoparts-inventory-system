import argon2 from "argon2";
import { prisma } from "@/db/prisma";
import { AppError } from "@/utils/AppError";
import { logAudit } from "@/modules/audit/audit.service";
import {
  generateOpaqueRefreshToken,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  verifyAccessToken,
} from "./tokens";
import { LoginInput, ChangePasswordInput } from "./auth.validation";

async function issueTokenPair(userId: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, role });

  const refreshToken = generateOpaqueRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput, ip?: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { permission: true },
  });

  // Mensagem generica de proposito: nao revela se o problema foi o e-mail
  // ou a senha, para nao ajudar enumeracao de contas.
  const invalidCredentials = () => AppError.unauthorized("E-mail ou senha invalidos");

  if (!user) throw invalidCredentials();
  if (!user.active) throw AppError.forbidden("Usuario desativado. Contate um administrador.");

  const passwordOk = await argon2.verify(user.passwordHash, input.password).catch(() => false);
  if (!passwordOk) throw invalidCredentials();

  const tokens = await issueTokenPair(user.id, user.role);

  await logAudit({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id, meta: { ip } });

  const { passwordHash: _omit, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function refreshSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw AppError.unauthorized("Sessao expirada, faca login novamente");
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    include: { permission: true },
  });
  if (!user || !user.active) throw AppError.unauthorized();

  // Rotaciona o refresh token: revoga o antigo e emite um novo, reduzindo o
  // risco de reuso caso um token tenha vazado.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(user.id, user.role);
  const { passwordHash: _omit, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { permission: true },
  });
  if (!user) throw AppError.notFound("Usuario nao encontrado");
  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}

export async function changeOwnPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Usuario nao encontrado");

  const ok = await argon2.verify(user.passwordHash, input.currentPassword).catch(() => false);
  if (!ok) throw AppError.validation("Senha atual incorreta");

  const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Derruba todas as sessoes ativas ao trocar a senha.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await logAudit({ userId, action: "CHANGE_PASSWORD", entity: "User", entityId: userId });
}

export { verifyAccessToken };
