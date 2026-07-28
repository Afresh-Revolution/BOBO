import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { serializeApplication, mapAppStatus } from "@/lib/serializers";
import {
  applicationInclude,
  mapStatusQuery,
} from "@/lib/admin-applications";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const statuses = mapStatusQuery(status);
    const where: Record<string, unknown> = {};
    if (statuses) where.status = { in: statuses };
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const apps = await prisma.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

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
    console.error("[admin/applications/export]", err);
    return jsonError("Internal server error", 500);
  }
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
