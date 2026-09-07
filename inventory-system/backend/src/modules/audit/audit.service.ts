import { prisma } from "@/db/prisma";
import { parsePagination, toPaginatedResult } from "@/utils/pagination";

interface LogAuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  meta?: unknown;
}

// Registro de auditoria "append-only": nenhum service/controller no sistema
// expoe update ou delete para audit_logs (ver audit.routes.ts, so tem GET).
export async function logAudit(input: LogAuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: (input.before ?? undefined) as never,
      after: (input.after ?? (input.meta ? input.meta : undefined)) as never,
    },
  });
}

export async function listAuditLogs(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const where = query.entity ? { entity: String(query.entity) } : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return toPaginatedResult(items, total, pagination);
}
