import prisma from "../lib/db.js";

import type { Prisma, Role } from "@prisma/client";

export type AuditInput = {
  action: string;
  actorId?: string | null;
  actorRole?: Role | null;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function write(audit: AuditInput) {
  return prisma.audit.create({
    data: {
      action: audit.action,
      actorId: audit.actorId ?? null,
      actorRole: audit.actorRole ?? null,
      targetType: audit.targetType ?? "UNKNOWN",
      targetId: audit.targetId ?? null,
      meta: (audit.meta ?? {}) as Prisma.InputJsonValue,
      ipAddress: audit.ipAddress ?? null,
      userAgent: audit.userAgent ?? null,
    },
  });
}

function serializeAuditItem(item: {
  id: string;
  action: string;
  actorId: string | null;
  actorRole: Role | null;
  targetType: string;
  targetId: string | null;
  meta: Prisma.JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
}) {
  return {
    id: item.id,
    action: item.action,
    actorId: item.actorId,
    actorRole: item.actorRole,
    actorName: item.actor?.name ?? item.actor?.email ?? item.actorId ?? "SYSTEM",
    targetType: item.targetType,
    targetId: item.targetId,
    meta: item.meta,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function list(opts: { page?: number; pageSize?: number; action?: string }) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditWhereInput = {};
  if (opts.action) where.action = opts.action;

  const [total, items] = await Promise.all([
    prisma.audit.count({ where }),
    prisma.audit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        action: true,
        actorId: true,
        actorRole: true,
        targetType: true,
        targetId: true,
        meta: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    page,
    pageSize,
    total,
    items: items.map(serializeAuditItem),
  };
}

export async function findById(id: string) {
  const item = await prisma.audit.findUnique({
    where: { id },
    select: {
      id: true,
      action: true,
      actorId: true,
      actorRole: true,
      targetType: true,
      targetId: true,
      meta: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return item ? serializeAuditItem(item) : null;
}

export async function remove(id: string) {
  const item = await prisma.audit.findUnique({
    where: { id },
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
    },
  });

  if (!item) {
    return null;
  }

  await prisma.audit.delete({ where: { id } });
  return item;
}
