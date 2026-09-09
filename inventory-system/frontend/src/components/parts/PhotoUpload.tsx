import { useRef, useState } from "react";
import { uploadPartPhoto } from "@/api/parts";
import { getApiErrorMessage } from "@/api/client";
import { Spinner } from "@/components/common/Spinner";

interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

// Aceita tanto upload de arquivo quanto captura direta pela camera do
// celular (o atributo `capture` abre a camera em navegadores mobile),
// conforme spec item 1.
// Reduz a foto para no maximo 1600px no lado maior e comprime como JPEG
// antes de subir. Uma foto de celular que chega com 6-8MB normalmente sai
// daqui com poucas centenas de KB, sem perda visivel de qualidade na lista.
async function resizeImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  if (scale >= 1) return file; // ja e pequena, nao mexe

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const resized = await resizeImage(file);
      const url = await uploadPartPhoto(resized);
      onChange(url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel enviar a foto"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-line bg-white">
          {uploading ? (
            <Spinner />
          ) : value ? (
            <img src={value} alt="Foto da peca" className="h-full w-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <circle cx="12" cy="13" r="3.5" />
              <path d="M8 6l1.5-2h5L16 6" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Escolher arquivo
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Tirar foto
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
              >
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-muted">JPG, PNG ou WEBP, ate 5MB.</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
