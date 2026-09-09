import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "@/config/env";
import { apiLimiter } from "@/middleware/rateLimit";
import { errorHandler } from "@/middleware/errorHandler";

import authRoutes from "@/modules/auth/auth.routes";
import usersRoutes from "@/modules/users/users.routes";
import manufacturersRoutes from "@/modules/manufacturers/manufacturers.routes";
import partsRoutes from "@/modules/parts/parts.routes";
import movementsRoutes from "@/modules/movements/movements.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.routes";
import uploadRoutes from "@/modules/upload/upload.routes";
import auditRoutes from "@/modules/audit/audit.routes";

export const app = express();

// Headers de seguranca padrao (X-Content-Type-Options, HSTS, etc).
app.use(helmet());

// So aceita requisicoes do frontend configurado, com cookies inclusos.
const allowedOrigins = [
  env.FRONTEND_URL,
  env.FRONTEND_URL.replace("https://www.", "https://"),
  env.FRONTEND_URL.replace("https://", "https://www."),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Sem "origin" (ex.: chamadas server-to-server, healthcheck) sempre libera.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Bloqueado por CORS"));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(apiLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/manufacturers", manufacturersRoutes);
app.use("/parts", partsRoutes);
app.use("/movements", movementsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/uploads", uploadRoutes);
app.use("/audit", auditRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Rota nao encontrada" } });
});

// Sempre por ultimo: captura qualquer erro encaminhado por asyncHandler/next(err).
app.use(errorHandler);
