import { prisma } from "@/lib/db";
import { jsonError, jsonOk, rateLimit, clientIp } from "@/lib/api";
import { emailApplicationReceived } from "@/lib/email";
import {
  applicationSubmitSchema,
  emptySocialLinkToNull,
} from "@/lib/validations/application";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = applicationSubmitSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid application payload.";
      return jsonError(message, 400, {
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const data = parsed.data;
    const email = data.email.trim().toLowerCase();
    const ip = clientIp(req);
    const limited = rateLimit(`applications:${ip}:${email}`, 5, 60 * 60 * 1000);
    if (!limited.ok) {
      return jsonError("Too many submissions. Please try again later.", 429);
    }

    const application = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        create: {
          email,
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
        },
        update: {
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
        },
      });

      const app = await tx.application.create({
        data: {
          userId: user.id,
          fullName: data.fullName.trim(),
          email,
          phone: data.phone.trim(),
          age: data.age,
          stateOfResidence: data.stateOfResidence.trim(),
          motherMaidenName: data.motherMaidenName.trim(),
          nin: data.nin.trim(),
          tiktokUrl: emptySocialLinkToNull(data.tiktokUrl),
          instagramUrl: emptySocialLinkToNull(data.instagramUrl),
          xUrl: emptySocialLinkToNull(data.xUrl),
          facebookUrl: emptySocialLinkToNull(data.facebookUrl),
          bloodGroup: data.bloodGroup,
          genotype: data.genotype,
          historyOfAilments: data.historyOfAilments.trim(),
          currentHealthChallenge: data.currentHealthChallenge.trim(),
          eligibilityAck: true,
          status: "PENDING",
        },
      });

      await tx.media.create({
        data: {
          kind: "BIRTH_CERTIFICATE",
          cloudinaryId: data.birthCertificate.publicId,
          url: data.birthCertificate.url,
          secureUrl: data.birthCertificate.url,
          format: data.birthCertificate.format,
          bytes: data.birthCertificate.bytes,
          originalName: data.birthCertificate.originalFilename,
          mimeType:
            data.birthCertificate.resourceType === "raw"
              ? "application/pdf"
              : undefined,
          applicationId: app.id,
        },
      });

      const videoMedia = await tx.media.create({
        data: {
          kind: "ENTRY_VIDEO",
          cloudinaryId: data.entryVideo.publicId,
          url: data.entryVideo.url,
          secureUrl: data.entryVideo.url,
          format: data.entryVideo.format,
          bytes: data.entryVideo.bytes,
          originalName: data.entryVideo.originalFilename,
          mimeType: "video/mp4",
          applicationId: app.id,
        },
      });

      await tx.video.create({
        data: {
          applicationId: app.id,
          mediaId: videoMedia.id,
          promptChoice: data.promptChoice,
        },
      });

      return app;
    });

    await emailApplicationReceived(email, data.fullName.trim(), application.id);

    return jsonOk({
      id: application.id,
      referenceId: application.id,
      reference: application.id,
    });
  } catch (err) {
    console.error("[applications]", err);
    return jsonError("Internal server error", 500);
  }
}
