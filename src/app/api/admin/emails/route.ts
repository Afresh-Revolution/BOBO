import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

function mapEmailStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "failed") return "failed";
  if (s === "queued" || s === "pending") return "queued";
  return "sent";
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return jsonOk({
      data: logs.map((log) => ({
        id: log.id,
        to: log.toEmail,
        subject: log.subject,
        template: log.template,
        status: mapEmailStatus(log.status),
        createdAt: log.createdAt.toISOString(),
        error: log.error ?? undefined,
      })),
    });
  } catch (err) {
    console.error("[admin/emails]", err);
    return jsonError("Internal server error", 500);
  }
}
