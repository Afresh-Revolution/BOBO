import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

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
