import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";
import { buildPaymentsWorkbook } from "@/lib/payments-excel";

const paymentInclude = {
  application: {
    select: {
      fullName: true,
      email: true,
      phone: true,
      age: true,
      stateOfResidence: true,
    },
  },
} as const;

async function loadPayments(ids: string[]) {
  const payments = await prisma.payment.findMany({
    where: { id: { in: ids } },
    include: paymentInclude,
  });
  const byId = new Map(payments.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as typeof payments;
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

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) {
      return jsonError("Select at least one payment to export.", 400);
    }

    const payments = await loadPayments(ids);
    if (!payments.length) return jsonError("No matching payments found.", 404);

    const buffer = await buildPaymentsWorkbook(payments);
    return excelResponse(buffer, "bobo-payments.xlsx");
  } catch (err) {
    console.error("[admin/payments/export POST]", err);
    return jsonError("Internal server error", 500);
  }
}
