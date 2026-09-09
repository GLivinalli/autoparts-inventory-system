import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { env, isProduction } from "@/config/env";
import * as authService from "./auth.service";

// Cookies HttpOnly + SameSite=strict: o token de sessao nunca fica acessivel
// via JavaScript no navegador (mitiga XSS) e nao e enviado em requisicoes
// cross-site (mitiga CSRF na pratica, ja que o navegador nao anexa o cookie).
const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: true, // sempre HTTPS agora, tanto no Vercel quanto no Render
    // "lax" funciona bem aqui porque app (www.) e api. sao subdominios do
    // MESMO dominio registrado (inventarioautogama.com.br) - navegadores
    // tratam isso como "same-site", diferente de quando front e back
    // estavam em dominios totalmente separados (onrender.com/vercel.app).
    sameSite: "lax" as const,
    domain: env.COOKIE_DOMAIN, // ".inventarioautogama.com.br"
    maxAge: maxAgeMs,
    path: "/",
  };
}

function setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60_000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(7 * 24 * 60 * 60_000));
}

function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, req.ip);
  setSessionCookies(res, accessToken, refreshToken);
  res.json({ user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw AppError.unauthorized();
  const { user, accessToken, refreshToken } = await authService.refreshSession(token);
  setSessionCookies(res, accessToken, refreshToken);
  res.json({ user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token);
  clearSessionCookies(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changeOwnPassword(req.user!.id, req.body);
  clearSessionCookies(res);
  res.status(204).send();
});
