import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/content";

function addOrigin(origins: Set<string>, raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return;
  try {
    const url = new URL(value);
    origins.add(url.origin);
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return;
    if (host.startsWith("www.")) {
      origins.add(`${url.protocol}//${host.slice(4)}`);
    } else {
      origins.add(`${url.protocol}//www.${host}`);
    }
  } catch {
    // ignore invalid
  }
}

function allowedOrigins() {
  const origins = new Set<string>();
  for (const raw of [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    siteConfig.url,
    // Live host. Canonical siteConfig.url is still https://bobo.show.
    "https://boboreality.com",
  ]) {
    addOrigin(origins, raw);
  }
  // Always allow local Next on :3000 (dev and `next start` locally).
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");
  return origins;
}

/** Origin implied by the Host the browser actually called. */
function originFromHost(req: Request): string | null {
  const host = req.headers.get("host")?.trim();
  if (!host) return null;
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const local =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  try {
    return new URL(`${local ? "http" : "https"}://${host}`).origin;
  } catch {
    return null;
  }
}

function comparableHost(origin: string) {
  try {
    return new URL(origin).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
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
  const servedOrigin = originFromHost(req);

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

  const sameHost =
    servedOrigin !== null &&
    comparableHost(requestOrigin) === comparableHost(servedOrigin);

  if (!sameHost && !allowed.has(requestOrigin)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin request blocked." },
      { status: 403 },
    );
  }

  return null;
}
