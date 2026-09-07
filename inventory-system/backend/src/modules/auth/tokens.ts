import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export interface AccessTokenPayload {
  sub: string; // user id
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// O refresh token em si e um valor aleatorio opaco (nao um JWT com dados).
// Guardamos apenas o hash SHA-256 dele no banco (tabela refresh_tokens),
// entao mesmo um vazamento do banco nao expoe tokens validos utilizaveis.
export function generateOpaqueRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(): Date {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  const amount = match ? parseInt(match[1], 10) : 7;
  const unit = match ? match[2] : "d";
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + amount * (unitMs[unit] ?? unitMs.d));
}
