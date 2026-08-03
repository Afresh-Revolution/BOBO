import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/api";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  req?: Request;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
};

export async function writeAudit(input: AuditInput) {
  try {
    const ip =
      input.ip ??
      (input.req ? clientIp(input.req) : null) ??
      undefined;
    const userAgent =
      input.userAgent ??
      input.req?.headers.get("user-agent") ??
      undefined;

    await prisma.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        ip: ip || null,
        userAgent: userAgent || null,
        meta: (input.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
