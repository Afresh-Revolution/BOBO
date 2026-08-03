import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { serializePayment } from "@/lib/serializers";

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { reference: { contains: q, mode: "insensitive" } },
        { application: { fullName: { contains: q, mode: "insensitive" } } },
        { application: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        application: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            age: true,
            stateOfResidence: true,
            nin: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return jsonOk({ data: payments.map(serializePayment) });
  } catch (err) {
    console.error("[admin/payments]", err);
    return jsonError("Internal server error", 500);
  }
}
