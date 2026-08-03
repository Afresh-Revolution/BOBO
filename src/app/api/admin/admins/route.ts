import { prisma } from "@/lib/db";
import {
  hashPassword,
  requireRole,
} from "@/lib/auth";
import { requireAdminApi } from "@/lib/security/admin-api";
import { validatePasswordStrength } from "@/lib/security/password";
import { jsonError, jsonOk, clientIp } from "@/lib/api";

type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

const ROLES = new Set<AdminRole>([
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "VIEWER",
]);

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const admins = await prisma.admin.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return jsonOk({
      data: admins.map(
        (a: {
          id: string;
          email: string;
          fullName: string;
          role: string;
          isActive: boolean;
          lastLoginAt: Date | null;
          createdAt: Date;
        }) => ({
          id: a.id,
          email: a.email,
          name: a.fullName,
          role: a.role,
          isActive: a.isActive,
          lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
        }),
      ),
    });
  } catch (err) {
    console.error("[admin/admins GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    if (!requireRole(admin, ["SUPER_ADMIN"])) {
      return jsonError("Only SUPER_ADMIN can create admins.", 403);
    }

    const body = (await req.json().catch(() => null)) as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: string;
    } | null;

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    const fullName = body?.fullName?.trim();
    const role = (body?.role || "ADMIN") as AdminRole;

    if (!email || !password || !fullName) {
      return jsonError("email, password, and fullName are required.", 400);
    }
    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      return jsonError(strength.message || "Password is too weak.", 400);
    }
    if (!ROLES.has(role)) {
      return jsonError("Invalid role.", 400);
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An admin with that email already exists.", 409);
    }

    const passwordHash = await hashPassword(password);
    const created = await prisma.admin.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "admin.create",
        entity: "Admin",
        entityId: created.id,
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
        meta: { email: created.email, role: created.role } as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return jsonOk({
      data: {
        id: created.id,
        email: created.email,
        name: created.fullName,
        role: created.role,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[admin/admins POST]", err);
    return jsonError("Internal server error", 500);
  }
}
