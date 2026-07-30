import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { siteConfig } from "@/lib/content";
import { prisma } from "@/lib/db";
import type { Admin, AdminRole } from "@prisma/client";

export const ADMIN_COOKIE = "bobo_admin_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars).");
  }
  return new TextEncoder().encode(secret);
}

export type AdminJwtPayload = {
  sub: string;
  email: string;
  role: AdminRole;
  name: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signAdminToken(admin: Admin) {
  return new SignJWT({
    email: admin.email,
    role: admin.role,
    name: admin.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as AdminRole,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getAdminFromCookies() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;

  const admin = await prisma.admin.findFirst({
    where: { id: payload.sub, isActive: true },
  });
  return admin;
}

export function requireRole(admin: Admin, roles: AdminRole[]) {
  return roles.includes(admin.role) || admin.role === "SUPER_ADMIN";
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateMagicToken() {
  return randomBytes(32).toString("base64url");
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function publicAppOrigin() {
  const configured = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  // Emails / public links must never point at localhost — use the live site.
  if (
    configured &&
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)
  ) {
    return configured;
  }

  return siteConfig.url.replace(/\/$/, "");
}

/** Absolute public URL (accept links, emails). Never returns localhost. */
export function appUrl(path = "") {
  const base = publicAppOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
