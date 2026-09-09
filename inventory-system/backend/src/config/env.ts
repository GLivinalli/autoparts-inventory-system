import "dotenv/config";
import { z } from "zod";

// Falha rapido e com uma mensagem clara se alguma variavel de ambiente
// obrigatoria estiver faltando, em vez de deixar o erro aparecer depois
// em algum lugar aleatorio do codigo.
const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  COOKIE_DOMAIN: z.string().default("localhost"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  R2_ACCOUNT_ID: z.string().optional().default(""),
  // Endpoint completo, usado quando o provedor NAO e a Cloudflare (ex.: Supabase
  // Storage). Se preenchido, tem prioridade sobre R2_ACCOUNT_ID.
  STORAGE_ENDPOINT: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET_NAME: z.string().optional().default(""),
  R2_PUBLIC_URL: z.string().optional().default(""),

  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variaveis de ambiente invalidas ou faltando:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";

// Trava de seguranca: nunca deixa o servidor subir em producao usando os
// segredos de exemplo do .env.example. Isso teria permitido forjar um
// login de administrador para quem visse o codigo no GitHub.
const PLACEHOLDER_SECRETS = [
  "troque-este-valor-em-producao-access",
  "troque-este-valor-em-producao-refresh",
];
if (isProduction && PLACEHOLDER_SECRETS.some((p) => env.JWT_ACCESS_SECRET === p || env.JWT_REFRESH_SECRET === p)) {
  console.error("JWT_ACCESS_SECRET/JWT_REFRESH_SECRET ainda estao com o valor de exemplo. Troque antes de subir em producao.");
  process.exit(1);
}
