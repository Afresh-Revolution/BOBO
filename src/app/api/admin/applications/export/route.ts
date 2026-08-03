import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";
import { serializeApplication, mapAppStatus } from "@/lib/serializers";
import { buildApplicationsWorkbook } from "@/lib/applications-excel";
import {
  applicationInclude,
  mapStatusQuery,
} from "@/lib/admin-applications";

async function loadApps(opts: {
  ids?: string[] | null;
  status?: string | null;
  q?: string | null;
}) {
  const where: Record<string, unknown> = {};

  if (opts.ids?.length) {
    where.id = { in: opts.ids };
  } else {
    const statuses = mapStatusQuery(opts.status);
    if (statuses) where.status = { in: statuses };
    if (opts.q) {
      where.OR = [
        { fullName: { contains: opts.q, mode: "insensitive" } },
        { email: { contains: opts.q, mode: "insensitive" } },
        { phone: { contains: opts.q, mode: "insensitive" } },
      ];
    }
  }

  return prisma.application.findMany({
    where,
    include: applicationInclude,
    orderBy: { createdAt: "desc" },
    take: opts.ids?.length ? opts.ids.length : 5000,
  });
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function excelResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();
    const idsParam = searchParams.get("ids")?.trim();
    const ids = idsParam
      ? idsParam.split(",").map((id) => id.trim()).filter(Boolean)
      : null;

    const apps = await loadApps({ ids, status, q });

    if (format === "xlsx") {
      if (!apps.length) return jsonError("No submissions to export.", 404);
      const buffer = await buildApplicationsWorkbook(apps);
      return excelResponse(buffer, "bobo-applications.xlsx");
    }

    if (format === "csv") {
      const header = [
        "id",
        "fullName",
        "email",
        "phone",
        "age",
        "status",
        "bloodGroup",
        "genotype",
        "nin",
        "tiktokUrl",
        "instagramUrl",
        "xUrl",
        "facebookUrl",
        "videoUrl",
        "createdAt",
      ];
      const rows = apps.map((a) =>
        [
          a.id,
          csv(a.fullName),
          csv(a.email),
          csv(a.phone),
          a.age,
          mapAppStatus(a.status),
          a.bloodGroup,
          a.genotype,
          a.nin,
          csv(a.tiktokUrl ?? ""),
          csv(a.instagramUrl ?? ""),
          csv(a.xUrl ?? ""),
          csv(a.facebookUrl ?? ""),
          csv(a.video?.media?.secureUrl || a.video?.media?.url || ""),
          a.createdAt.toISOString(),
        ].join(","),
      );
      const body = [header.join(","), ...rows].join("\n");
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bobo-applications.csv"',
        },
      });
    }

    return jsonOk({ data: apps.map(serializeApplication) });
  } catch (err) {
    console.error("[admin/applications/export GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) {
      return jsonError("Select at least one submission to export.", 400);
    }

    const format =
      body && typeof body === "object" && !Array.isArray(body)
        ? String((body as { format?: unknown }).format || "xlsx")
        : "xlsx";

    const apps = await loadApps({ ids });
    if (!apps.length) return jsonError("No matching submissions found.", 404);

    // Preserve selection order where possible
    const byId = new Map(apps.map((a) => [a.id, a]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof apps;

    if (format === "csv") {
      const header = [
        "id",
        "fullName",
        "email",
        "phone",
        "age",
        "status",
        "tiktokUrl",
        "instagramUrl",
        "xUrl",
        "facebookUrl",
        "videoUrl",
        "createdAt",
      ];
      const rows = ordered.map((a) =>
        [
          a.id,
          csv(a.fullName),
          csv(a.email),
          csv(a.phone),
          a.age,
          mapAppStatus(a.status),
          csv(a.tiktokUrl ?? ""),
          csv(a.instagramUrl ?? ""),
          csv(a.xUrl ?? ""),
          csv(a.facebookUrl ?? ""),
          csv(a.video?.media?.secureUrl || a.video?.media?.url || ""),
          a.createdAt.toISOString(),
        ].join(","),
      );
      const csvBody = [header.join(","), ...rows].join("\n");
      return new Response(csvBody, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bobo-applications.csv"',
        },
      });
    }

    const buffer = await buildApplicationsWorkbook(ordered);
    return excelResponse(buffer, "bobo-applications.xlsx");
  } catch (err) {
    console.error("[admin/applications/export POST]", err);
    return jsonError("Internal server error", 500);
  }
}
