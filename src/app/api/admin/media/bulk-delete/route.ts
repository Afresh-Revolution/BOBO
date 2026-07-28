import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";
import { cloudinary } from "@/lib/cloudinary";

function resourceTypeForKind(kind: string) {
  if (kind === "ENTRY_VIDEO") return "video" as const;
  return "image" as const;
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) return jsonError("ids must be a non-empty string array.", 400);

    const media = await prisma.media.findMany({
      where: { id: { in: ids } },
      select: { id: true, cloudinaryId: true, kind: true },
    });
    if (!media.length) return jsonError("No matching media.", 404);

    for (const item of media) {
      try {
        await cloudinary.uploader.destroy(item.cloudinaryId, {
          resource_type: resourceTypeForKind(item.kind),
          invalidate: true,
        });
      } catch (err) {
        console.warn("[admin/media/bulk-delete] cloudinary", item.cloudinaryId, err);
      }
    }

    const mediaIds = media.map((m) => m.id);
    const result = await prisma.media.deleteMany({
      where: { id: { in: mediaIds } },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "media.bulk_delete",
        entity: "Media",
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
        meta: { ids: mediaIds, deleted: result.count } as object,
      },
    });

    return jsonOk({ data: { deleted: result.count, ids: mediaIds } });
  } catch (err) {
    console.error("[admin/media/bulk-delete]", err);
    return jsonError("Internal server error", 500);
  }
}
