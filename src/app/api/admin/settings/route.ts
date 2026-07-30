import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { registrationFee } from "@/lib/content";

const SETTING_DEFS: {
  key: string;
  label: string;
  type: "text" | "boolean" | "number" | "textarea";
  defaultValue: string | boolean | number;
}[] = [
  {
    key: "applications_open",
    label: "Applications open",
    type: "boolean",
    defaultValue: false,
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
  type: "text" | "boolean" | "number" | "textarea",
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
  return raw == null ? (fallback as string) : String(raw);
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const rows = await prisma.setting.findMany();
    const byKey = new Map(
      rows.map((r: { key: string; value: unknown }) => [r.key, r]),
    );

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

    for (const row of rows as { key: string; value: unknown }[]) {
      if (SETTING_DEFS.some((d) => d.key === row.key)) continue;
      data.push({
        key: row.key,
        label: row.key,
        type: "text" as const,
        value: unwrapValue(row.value, "text", ""),
      });
    }

    return jsonOk({ data });
  } catch (err) {
    console.error("[admin/settings GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

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

    for (const setting of settings) {
      if (!setting.key) continue;
      const valuePayload = { value: setting.value } as import("@prisma/client").Prisma.InputJsonValue;
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

    return jsonOk({ message: "Settings saved" });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return jsonError("Internal server error", 500);
  }
}
