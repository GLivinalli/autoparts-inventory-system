import argon2 from "argon2";
import { Role } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { parsePagination, toPaginatedResult } from "@/utils/pagination";
import { defaultPermissionsFor } from "@/utils/permissions";
import { logAudit } from "@/modules/audit/audit.service";
import * as repo from "./users.repository";
import { CreateUserInput, UpdateUserInput } from "./users.validation";

function omitPassword<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

export async function listUsers(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const search = typeof query.search === "string" ? query.search.trim() : "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    repo.list(where, (pagination.page - 1) * pagination.pageSize, pagination.pageSize),
    repo.count(where),
  ]);

  return toPaginatedResult(items.map(omitPassword), total, pagination);
}

export async function createUser(input: CreateUserInput, actingUserId: string) {
  const existing = await repo.findByEmail(input.email);
  if (existing) throw AppError.conflict("Ja existe um usuario com este e-mail");

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  const permissions = { ...defaultPermissionsFor(input.role), ...(input.permissions ?? {}) };

  const user = await repo.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    permission: { create: permissions },
  });

  await logAudit({
    userId: actingUserId,
    action: "CREATE_USER",
    entity: "User",
    entityId: user.id,
    after: { name: user.name, email: user.email, role: user.role },
  });

  return omitPassword(user);
}

export async function updateUser(id: string, input: UpdateUserInput, actingUserId: string) {
  const before = await repo.findById(id);
  if (!before) throw AppError.notFound("Usuario nao encontrado");

  if (id === actingUserId && input.active === false) {
    throw AppError.validation("Voce nao pode desativar sua propria conta");
  }
  if (id === actingUserId && input.role && input.role !== Role.ADMIN && before.role === Role.ADMIN) {
    throw AppError.validation("Voce nao pode remover seu proprio acesso de administrador");
  }

  const user = await repo.update(id, {
    name: input.name,
    role: input.role,
    active: input.active,
  });

  if (input.permissions) {
    await repo.upsertPermission(id, {
      userId: id,
      ...defaultPermissionsFor(user.role),
      ...input.permissions,
    });
  }

  await logAudit({
    userId: actingUserId,
    action: "UPDATE_USER",
    entity: "User",
    entityId: id,
    before: { name: before.name, role: before.role, active: before.active },
    after: { name: user.name, role: user.role, active: user.active },
  });

  const refreshed = await repo.findById(id);
  return omitPassword(refreshed!);
}

export async function getUser(id: string) {
  const user = await repo.findById(id);
  if (!user) throw AppError.notFound("Usuario nao encontrado");
  return omitPassword(user);
}
