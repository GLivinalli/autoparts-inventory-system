import crypto from "node:crypto";
import ImageKit from "imagekit";
import { fromBuffer as fileTypeFromBuffer } from "file-type";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";

// Fotos NUNCA vao para o PostgreSQL (spec item 17): so a URL fica no banco,
// o binario vive no ImageKit.
const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export async function uploadPartPhoto(file: Express.Multer.File, _userId: string): Promise<string> {
  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw AppError.validation(`Arquivo maior que o limite de ${env.MAX_UPLOAD_SIZE_MB}MB`);
  }

  // Nao confia na extensao/nome do arquivo nem no Content-Type declarado pelo
  // navegador: inspeciona os bytes reais do arquivo para confirmar que e de
  // fato uma imagem suportada.
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime) || !ALLOWED_EXTENSIONS.has(detected.ext)) {
    throw AppError.validation("Arquivo invalido. Envie uma imagem JPG, PNG ou WEBP.");
  }

  const fileName = `${crypto.randomUUID()}.${detected.ext}`;

  const result = await imagekit.upload({
    file: file.buffer,
    fileName,
    folder: `/parts/${new Date().getFullYear()}/`,
    useUniqueFileName: false,
  });

  return result.url;
}
