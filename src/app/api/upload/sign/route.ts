import { signUpload, type SignKind } from "@/lib/cloudinary";
import { getAdminFromCookies, hashToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, rateLimit, clientIp } from "@/lib/api";

const ALL_KINDS = new Set<SignKind>([
  "birthCertificate",
  "entryVideo",
  "adminMedia",
  "cbcReceipt",
]);

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`upload:sign:${ip}`, 30, 60_000);
    if (!limited.ok) {
      return jsonError("Too many upload requests. Try again shortly.", 429);
    }

    const body = (await req.json().catch(() => null)) as {
      kind?: string;
      filename?: string;
      token?: string;
    } | null;

    const kind = body?.kind as SignKind | undefined;
    if (!kind || !ALL_KINDS.has(kind)) {
      return jsonError("Invalid upload kind.", 400);
    }

    if (kind === "adminMedia") {
      const admin = await getAdminFromCookies();
      if (!admin) {
        return jsonError("Admin sign-in required to upload media.", 401);
      }
    }

    // Receipt uploads only through a live acceptance magic link
    if (kind === "cbcReceipt") {
      const token = body?.token?.trim();
      if (!token) {
        return jsonError(
          "A valid acceptance link is required to upload a receipt.",
          401,
        );
      }

      const link = await prisma.magicLink.findFirst({
        where: {
          tokenHash: hashToken(token),
          type: "ACCEPTANCE",
          usedAt: null,
          revokedAt: null,
        },
      });

      if (!link) {
        return jsonError(
          "This acceptance link is invalid or already used.",
          401,
        );
      }
      if (link.expiresAt.getTime() < Date.now()) {
        return jsonError("This acceptance link has expired.", 410);
      }
    }

    const signed = signUpload(kind, body?.filename);
    return jsonOk({ ...signed });
  } catch (err) {
    console.error("[upload/sign]", err);
    return jsonError("Internal server error", 500);
  }
}
