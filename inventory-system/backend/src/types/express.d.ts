import { Role } from "@prisma/client";
import { PermissionAction } from "@/utils/permissions";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  permission: Partial<Record<PermissionAction, boolean>> | null;
}

declare global {
  namespace Express {
    interface Request {
      // Preenchido pelo middleware requireAuth a partir do access token.
      // Nunca e definido a partir de dados enviados pelo cliente (body/query).
      user?: AuthenticatedUser;
    }
  }
}

export {};
