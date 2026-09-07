import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";

// Fotos NUNCA vao para o PostgreSQL (spec item 17): so a URL fica no banco,
// o binario vive no object storage (Cloudflare R2, compativel com S3).
const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export async function uploadPartPhoto(file: Express.Multer.File, userId: string): Promise<string> {
  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw AppError.validation(`Arquivo maior que o limite de ${env.MAX_UPLOAD_SIZE_MB}MB`);
  }

  // Nao confia na extensao/nome do arquivo nem no Content-Type declarado pelo
  // navegador (ambos podem ser forjados): inspeciona os bytes reais do
  // arquivo para confirmar que e de fato uma imagem suportada.
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime) || !ALLOWED_EXTENSIONS.has(detected.ext)) {
    throw AppError.validation("Arquivo invalido. Envie uma imagem JPG, PNG ou WEBP.");
  }

  const key = `parts/${new Date().getFullYear()}/${crypto.randomUUID()}.${detected.ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: detected.mime,
      Metadata: { uploadedBy: userId },
    })
  );

  return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}
