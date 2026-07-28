import type { ApiListResponse, ApiResponse } from "./admin-types";

type FetchOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export async function adminFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const res = await fetch(path, {
    method,
    credentials: "include",
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new AdminApiError(
      json?.error || `Request failed (${res.status})`,
      res.status,
    );
  }

  return (json ?? {}) as T;
}

export function unwrapList<T>(payload: ApiListResponse<T> | T[] | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export function formatDate(value?: string) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMoney(amount: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
