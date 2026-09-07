import rateLimit from "express-rate-limit";

// Limite generoso para uso normal do app (listagens, dashboard, etc).
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Muitas requisicoes. Aguarde um instante." } },
});

// Limite bem mais restrito para login, para dificultar forca bruta de senha.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: { code: "RATE_LIMITED", message: "Muitas tentativas de login. Tente novamente mais tarde." },
  },
});
