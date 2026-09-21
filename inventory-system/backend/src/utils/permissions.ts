import { Role } from "@prisma/client";

export type PermissionAction =
  | "canCreateParts"
  | "canEditParts"
  | "canArchiveParts"
  | "canStockIn"
  | "canStockOut"
  | "canManageUsers"
  | "canManageProducts"
  | "canStockInProducts"
  | "canStockOutProducts"
  | "canDeleteProductMoves";

const ADMIN_DEFAULTS: Record<PermissionAction, boolean> = {
  canCreateParts: true,
  canEditParts: true,
  canArchiveParts: true,
  canStockIn: true,
  canStockOut: true,
  canManageUsers: true,
  canManageProducts: true,
  canStockInProducts: true,
  canStockOutProducts: true,
  canDeleteProductMoves: true,
};

const USER_DEFAULTS: Record<PermissionAction, boolean> = {
  canCreateParts: false,
  canEditParts: false,
  canArchiveParts: false,
  canStockIn: false,
  canStockOut: false,
  canManageUsers: false,
  canManageProducts: false,
  canStockInProducts: false,
  canStockOutProducts: false,
  canDeleteProductMoves: false,
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
