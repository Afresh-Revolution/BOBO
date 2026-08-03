import type { Admin } from "@prisma/client";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, rateLimit, clientIp } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  assertPermission,
  permissionForAdminPath,
  type AdminPermission,
} from "@/lib/security/rbac";

type GuardOptions = {
  permission?: AdminPermission;
  /** Skip CSRF for rare server-to-server cases (default false). */
  skipCsrf?: boolean;
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
};

/**
 * Shared admin API gate: session, CSRF (mutations), RBAC, rate limit.
 */
export async function requireAdminApi(
  req: Request,
  opts: GuardOptions = {},
): Promise<{ admin: Admin } | Response> {
  if (!opts.skipCsrf) {
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;
  }

  const admin = await getAdminFromCookies();
  if (!admin) {
    return jsonError("Unauthorized", 401);
  }

  const url = new URL(req.url);
  const permission =
    opts.permission ?? permissionForAdminPath(req.method, url.pathname);

  if (!assertPermission(admin, permission)) {
    return jsonError("Forbidden: insufficient permissions.", 403);
  }

  const ip = clientIp(req);
  const limited = rateLimit(
    opts.rateLimitKey ?? `admin:${permission}:${admin.id}:${ip}`,
    opts.rateLimitMax ?? (permission === "read" ? 120 : 60),
    opts.rateLimitWindowMs ?? 60_000,
  );
  if (!limited.ok) {
    return jsonError("Too many admin requests. Try again shortly.", 429);
  }

  return { admin };
}

export function isAdminResult(
  value: { admin: Admin } | Response,
): value is { admin: Admin } {
  return !(value instanceof Response) && "admin" in value;
}
