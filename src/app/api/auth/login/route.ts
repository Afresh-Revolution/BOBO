import { prisma } from "@/lib/db";
import {
  ADMIN_COOKIE,
  signAdminToken,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk, rateLimit, clientIp } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security/csrf";
import { writeAudit } from "@/lib/security/audit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

function cookieSecure() {
  return (
    process.env.NODE_ENV === "production" &&
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(
      process.env.APP_URL || "",
    )
  );
}

export async function POST(req: Request) {
  try {
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;

    const ip = clientIp(req);
    const limited = rateLimit(`auth:login:${ip}`, 10, 60_000);
    if (!limited.ok) {
      return jsonError("Too many login attempts. Try again shortly.", 429);
    }

    const raw = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError("Email and password are required.", 400);
    }

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const ua = req.headers.get("user-agent") || undefined;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      await writeAudit({
        action: "auth.login_failed",
        entity: "Admin",
        req,
        meta: { email, reason: "unknown_or_inactive" },
      });
      return jsonError("Invalid credentials.", 401);
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      await writeAudit({
        adminId: admin.id,
        action: "auth.login_failed",
        entity: "Admin",
        entityId: admin.id,
        req,
        meta: { email, reason: "bad_password" },
      });
      return jsonError("Invalid credentials.", 401);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await writeAudit({
      adminId: admin.id,
      action: "auth.login",
      entity: "Admin",
      entityId: admin.id,
      req,
      meta: { email, role: admin.role, userAgent: ua },
    });

    const token = await signAdminToken(admin);
    const res = jsonOk({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.fullName,
        role: admin.role,
      },
    });

    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: cookieSecure(),
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return jsonError("Internal server error", 500);
  }
}
