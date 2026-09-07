import { z } from "zod";

const permissionsSchema = z
  .object({
    canCreateParts: z.boolean(),
    canEditParts: z.boolean(),
    canArchiveParts: z.boolean(),
    canStockIn: z.boolean(),
    canStockOut: z.boolean(),
    canManageUsers: z.boolean(),
  })
  .partial();

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  permissions: permissionsSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  active: z.boolean().optional(),
  permissions: permissionsSchema.optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
