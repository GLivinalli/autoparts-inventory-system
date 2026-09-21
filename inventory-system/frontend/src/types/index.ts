export type Role = "ADMIN" | "USER";

export type PartSide =
  | "DIANTEIRO"
  | "TRASEIRO"
  | "LATERAL"
  | "ESQUERDO"
  | "DIREITO"
  | "INTERNO"
  | "EXTERNO"
  | "SUPERIOR"
  | "INFERIOR"
  | "CENTRAL"
  | "NAO_SE_APLICA";

export type PartCondition = "SEM_DANO" | "COM_DANO";
export type MovementType = "ENTRADA" | "RETIRADA";

export interface UserPermissions {
  canCreateParts: boolean;
  canEditParts: boolean;
  canArchiveParts: boolean;
  canStockIn: boolean;
  canStockOut: boolean;
  canManageUsers: boolean;
  canManageProducts: boolean;
  canStockInProducts: boolean;
  canStockOutProducts: boolean;
  canDeleteProductMoves: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  permission: UserPermissions | null;
}

export interface Manufacturer {
  id: string;
  name: string;
  createdAt: string;
}

export interface Part {
  id: string;
  photoUrl: string | null;
  damagePhotoUrl: string | null;
  name: string;
  sku: string | null;
  manufacturerId: string;
  manufacturer: Manufacturer;
  side: PartSide | null;
  condition: PartCondition;
  damageNotes: string | null;
  quantity: number;
  inventoryDate: string;
  createdById: string;
  createdBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Movement {
  id: string;
  partId: string;
  part?: { id: string; name: string; sku: string };
  type: MovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  userId: string;
  user: { id: string; name: string; email: string };
  description: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardSummary {
  totals: {
    totalParts: number;
    totalQuantity: number;
    outOfStock: number;
    damaged: number;
    undamaged: number;
  };
  recentlyAdded: Part[];
  recentEntradas: Movement[];
  recentRetiradas: Movement[];
  recentMovements: Movement[];
}

export interface ApiErrorPayload {
  error: { code: string; message: string; details?: unknown };
}

// ---- Modulo de Produtos (almoxarifado com custeio FIFO) ----

export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  quantity: number;
  daysInStock: number | null;
  createdById: string;
  createdBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  movementId: string;
  quantityOriginal: number;
  quantityRemaining: number;
  unitCostCents: number;
  createdAt: string;
}

export interface ProductMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; manufacturer: string };
  type: MovementType;
  quantity: number;
  unitCostCents: number | null;
  totalCents: number;
  setor: string | null;
  funcionario: string | null;
  description: string | null;
  userId: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

export interface ConsumptionReportRow {
  month: string;
  setor: string;
  funcionario: string;
  productId: string;
  productName: string;
  quantity: number;
  totalCents: number;
}

export interface MonthlyBalanceRow {
  month: string;
  entradasCents: number;
  saidasCents: number;
  saldoCents: number;
}
