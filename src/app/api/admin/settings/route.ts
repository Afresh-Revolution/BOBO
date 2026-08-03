import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { registrationFee } from "@/lib/content";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { writeAudit } from "@/lib/security/audit";

const SETTING_DEFS: {
  key: string;
  label: string;
  type: "text" | "boolean" | "number" | "textarea" | "date";
  defaultValue: string | boolean | number;
}[] = [
  {
    key: "applications_open",
    label: "Applications open",
    type: "boolean",
    defaultValue: false,
  },
  {
    key: "applications_open_date",
    label: "Applications open date",
    type: "date",
    defaultValue: "2026-08-01",
  },
  {
    key: "applications_close_date",
    label: "Applications close date",
    type: "date",
    defaultValue: "2026-10-31",
  },
  {
    key: "registration_fee",
    label: "Registration fee (NGN approx)",
    type: "number",
    defaultValue: registrationFee.amountNgnApprox,
  },
  {
    key: "registration_fee_cbc",
    label: "Registration fee (CBC)",
    type: "number",
    defaultValue: registrationFee.amountCbc,
  },
  {
    key: "support_email",
    label: "Support email",
    type: "text",
    defaultValue: "",
  },
  {
    key: "announcement",
    label: "Site announcement",
    type: "textarea",
    defaultValue: "",
  },
];

function unwrapValue(
  raw: unknown,
  type: "text" | "boolean" | "number" | "textarea" | "date",
  fallback: string | boolean | number,
): string | boolean | number {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw) {
    return unwrapValue(
      (raw as { value: unknown }).value,
      type,
      fallback,
    );
  }
  if (type === "boolean") return Boolean(raw);
  if (type === "number") {
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : (fallback as number);
  }
  if (raw == null) return fallback as string;
  if (typeof raw === "object") {
    try {
      return JSON.stringify(raw);
    } catch {
      return fallback as string;
    }
  }
  const str = String(raw);
  if (type === "date" && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return str;
}

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const rows = await prisma.setting.findMany();
    const byKey = new Map(
      rows.map((r: { key: string; value: unknown }) => [r.key, r]),
    );

    // Only expose known settings — avoids leftover keys like "site" rendering as [object Object]
    const data = SETTING_DEFS.map((def) => {
      const row = byKey.get(def.key) as { value: unknown } | undefined;
      return {
        key: def.key,
        label: def.label,
        type: def.type,
        value: row
          ? unwrapValue(row.value, def.type, def.defaultValue)
          : def.defaultValue,
      };
    });

    return jsonOk({ data });
  } catch (err) {
    console.error("[admin/settings GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const body = (await req.json().catch(() => null)) as {
      settings?: {
        key: string;
        value: string | boolean | number;
        type?: string;
      }[];
    } | null;

    const settings = body?.settings;
    if (!Array.isArray(settings)) {
      return jsonError("settings array is required.", 400);
    }

    const allowed = new Set(SETTING_DEFS.map((d) => d.key));

    for (const setting of settings) {
      if (!setting.key || !allowed.has(setting.key)) continue;
      const valuePayload = {
        value: setting.value,
      } as import("@prisma/client").Prisma.InputJsonValue;
      await prisma.setting.upsert({
        where: { key: setting.key },
        create: {
          key: setting.key,
          value: valuePayload,
          updatedById: admin.id,
        },
        update: {
          value: valuePayload,
          updatedById: admin.id,
        },
      });
    }

    revalidatePublicSite();
    await writeAudit({
      adminId: admin.id,
      action: "settings.update",
      entity: "Setting",
      req,
      meta: {
        keys: settings.map((s) => s.key).filter((k) => allowed.has(k)),
      },
    });
    return jsonOk({ message: "Settings saved" });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return jsonError("Internal server error", 500);
  }
}
