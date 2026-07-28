import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { serializeApplication } from "@/lib/serializers";
import { applicationInclude } from "@/lib/admin-applications";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

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
