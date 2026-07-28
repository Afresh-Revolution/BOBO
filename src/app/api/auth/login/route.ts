import { prisma } from "@/lib/db";
import {
  ADMIN_COOKIE,
  signAdminToken,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk, rateLimit, clientIp } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`auth:login:${ip}`, 10, 60_000);
    if (!limited.ok) {
      return jsonError("Too many login attempts. Try again shortly.", 429);
    }

    const body = (await req.json().catch(() => null)) as {
      email?: string;
      password?: string;
    } | null;

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    if (!email || !password) {
      return jsonError("Email and password are required.", 400);
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return jsonError("Invalid credentials.", 401);
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return jsonError("Invalid credentials.", 401);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
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
      secure:
        process.env.NODE_ENV === "production" &&
        !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(
          process.env.APP_URL || "",
        ),
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return jsonError("Internal server error", 500);
  }
}
