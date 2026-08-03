import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const media = await prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return jsonOk({
      data: media.map((m) => ({
        id: m.id,
        name: m.originalName || m.cloudinaryId,
        url: m.secureUrl || m.url,
        type:
          m.mimeType ||
          (m.kind === "ENTRY_VIDEO"
            ? "video"
            : m.kind === "BIRTH_CERTIFICATE"
              ? "application/pdf"
              : "image"),
        size: m.bytes ?? undefined,
        createdAt: m.createdAt.toISOString(),
        kind: m.kind,
      })),
    });
  } catch (err) {
    console.error("[admin/media]", err);
    return jsonError("Internal server error", 500);
  }
}
