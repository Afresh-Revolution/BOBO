import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/content";

function allowedOrigins() {
  const origins = new Set<string>();
  for (const raw of [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    siteConfig.url,
  ]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore invalid
    }
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

/**
 * Reject cross-site state-changing requests (CSRF mitigation for cookie auth).
 * Safe for SameSite=Lax + Origin/Referer checks.
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const allowed = allowedOrigins();

  let requestOrigin: string | null = null;
  if (origin) {
    try {
      requestOrigin = new URL(origin).origin;
    } catch {
      requestOrigin = null;
    }
  } else if (referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }

  // Non-browser clients (curl/scripts) may omit Origin/Referer.
  // In production, require one of them for cookie-authenticated mutations.
  if (!requestOrigin) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid request origin." },
        { status: 403 },
      );
    }
    return null;
  }

  if (!allowed.has(requestOrigin)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin request blocked." },
      { status: 403 },
    );
  }

  return null;
}
