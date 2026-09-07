import { Role } from "@prisma/client";

// Nomes das acoes controlaveis por permissao granular. Adicionar uma nova
// permissao no futuro = adicionar uma chave aqui + uma coluna no
// UserPermission do schema.prisma, sem tocar no restante do sistema.
export type PermissionAction =
  | "canCreateParts"
  | "canEditParts"
  | "canArchiveParts"
  | "canStockIn"
  | "canStockOut"
  | "canManageUsers";

// ADMIN sempre tem tudo. Para USER, o padrao e restritivo (spec: "usuario
// comum pode cadastrar/movimentar peças, se autorizado") - a liberacao vem
// da linha em UserPermission, criada/gerenciada por um administrador.
const ADMIN_DEFAULTS: Record<PermissionAction, boolean> = {
  canCreateParts: true,
  canEditParts: true,
  canArchiveParts: true,
  canStockIn: true,
  canStockOut: true,
  canManageUsers: true,
};

const USER_DEFAULTS: Record<PermissionAction, boolean> = {
  canCreateParts: false,
  canEditParts: false,
  canArchiveParts: false,
  canStockIn: false,
  canStockOut: false,
  canManageUsers: false,
};

export interface AuthenticatedUserPermissions {
  role: Role;
  permission?: Partial<Record<PermissionAction, boolean>> | null;
}

export function hasPermission(user: AuthenticatedUserPermissions, action: PermissionAction): boolean {
  if (user.role === Role.ADMIN) return true;

  const override = user.permission?.[action];
  if (typeof override === "boolean") return override;

  return USER_DEFAULTS[action];
}

export function defaultPermissionsFor(role: Role) {
  return role === Role.ADMIN ? { ...ADMIN_DEFAULTS } : { ...USER_DEFAULTS };
}
