import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { serializeApplication } from "@/lib/serializers";
import { applicationInclude } from "@/lib/admin-applications";

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {
      status: { in: ["APPROVED", "REGISTERED"] },
    };
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
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    return jsonOk({ data: apps.map(serializeApplication) });
  } catch (err) {
    console.error("[admin/contestants]", err);
    return jsonError("Internal server error", 500);
  }
}
