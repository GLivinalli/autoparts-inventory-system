import type { PartCondition, PartSide, Role } from "@/types";

export const SIDE_LABELS: Record<PartSide, string> = {
  DIANTEIRO: "Dianteiro",
  TRASEIRO: "Traseiro",
  LATERAL: "Lateral",
  ESQUERDO: "Esquerdo",
  DIREITO: "Direito",
  INTERNO: "Interno",
  EXTERNO: "Externo",
  SUPERIOR: "Superior",
  INFERIOR: "Inferior",
  CENTRAL: "Central",
  NAO_SE_APLICA: "Nao se aplica",
};

export const CONDITION_LABELS: Record<PartCondition, string> = {
  SEM_DANO: "Sem dano",
  COM_DANO: "Com dano",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  USER: "Usuario comum",
};

export function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatDateTime(value: string): string {
  const d = new Date(value);
  return d.toLocaleString("pt-BR");
}
