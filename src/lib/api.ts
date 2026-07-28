import { NextResponse } from "next/server";

export function jsonOk<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { ok: false as const, remaining: 0, retryAfterMs: entry.reset - now };
  }
  entry.count += 1;
  return { ok: true as const, remaining: limit - entry.count };
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
