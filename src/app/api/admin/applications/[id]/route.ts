import { prisma } from "@/lib/db";
import { appUrl, getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import {
  emailApplicationApproved,
  emailApplicationRejected,
} from "@/lib/email";
import { createAcceptanceLink } from "@/lib/magic-link";
import { serializeApplication } from "@/lib/serializers";
import { applicationInclude } from "@/lib/admin-applications";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const { id } = await ctx.params;
    const app = await prisma.application.findUnique({
      where: { id },
      include: applicationInclude,
    });
    if (!app) return jsonError("Application not found.", 404);

    return jsonOk({ data: serializeApplication(app) });
  } catch (err) {
    console.error("[admin/applications/id]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      reason?: string;
    } | null;

    const action = body?.action;
    if (action !== "approve" && action !== "reject") {
      return jsonError("action must be approve or reject.", 400);
    }

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return jsonError("Application not found.", 404);

    if (app.status !== "PENDING" && app.status !== "UNDER_REVIEW") {
      return jsonError("Only pending applications can be reviewed.", 400);
    }

    const now = new Date();
    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    if (action === "approve") {
      const updated = await prisma.application.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: admin.id,
          reviewedAt: now,
          rejectionReason: null,
        },
        include: applicationInclude,
      });

      const { rawToken } = await createAcceptanceLink(id);
      const acceptUrl = appUrl(`/accept/${rawToken}`);

      await emailApplicationApproved(
        updated.email,
        updated.fullName,
        updated.id,
        acceptUrl,
      );

      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "application.approve",
          entity: "Application",
          entityId: id,
          ip,
          userAgent,
          meta: { acceptUrl } as Prisma.InputJsonValue,
        },
      });

      return jsonOk({ data: serializeApplication(updated) });
    }

    const reason = body?.reason?.trim() || undefined;
    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: admin.id,
        reviewedAt: now,
        rejectionReason: reason ?? null,
      },
      include: applicationInclude,
    });

    await emailApplicationRejected(
      updated.email,
      updated.fullName,
      updated.id,
      reason,
    );

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "application.reject",
        entity: "Application",
        entityId: id,
        ip,
        userAgent,
        meta: { reason: reason ?? null } as Prisma.InputJsonValue,
      },
    });

    return jsonOk({ data: serializeApplication(updated) });
  } catch (err) {
    console.error("[admin/applications/id PATCH]", err);
    return jsonError("Internal server error", 500);
  }
}
