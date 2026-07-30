import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { registrationFee } from "@/lib/content";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

type RouteContext = { params: Promise<{ token: string }> };

const receiptSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  resourceType: z.enum(["image", "video", "raw"]).optional(),
  bytes: z.number().int().positive().optional(),
  format: z.string().optional(),
  originalFilename: z.string().optional(),
});

const bodySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  receipt: receiptSchema,
  reference: z.string().trim().max(120).optional(),
});

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const { token } = await ctx.params;
    if (!token) {
      return jsonError("Invalid link.", 404, { status: "invalid" });
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message || "Full name and CBC receipt are required.",
        400,
      );
    }

    const { fullName, receipt, reference: clientRef } = parsed.data;

    const tokenHash = hashToken(token);
    const link = await prisma.magicLink.findFirst({
      where: { tokenHash, type: "ACCEPTANCE" },
      include: { application: true },
    });

    if (!link || link.revokedAt) {
      return jsonError("This acceptance link is invalid.", 404, {
        status: "invalid",
      });
    }
    if (link.usedAt) {
      return jsonError("This link has already been used and cannot be shared.", 409, {
        status: "used",
      });
    }
    if (link.expiresAt.getTime() < Date.now()) {
      return jsonError("This link has expired.", 410, { status: "expired" });
    }

    const app = link.application;
    if (app.status === "REGISTERED") {
      return jsonOk({
        status: "registered",
        registered: true,
        paymentStatus: "paid",
        message: "Already registered.",
      });
    }
    if (app.status !== "APPROVED") {
      return jsonError("Application is not approved for registration.", 400);
    }

    const now = new Date();
    const reference =
      clientRef?.trim() ||
      `CBC-${app.id.slice(-8).toUpperCase()}-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: app.id },
        data: { fullName },
      });

      const media = await tx.media.create({
        data: {
          kind: "CBC_RECEIPT",
          cloudinaryId: receipt.publicId,
          url: receipt.url,
          secureUrl: receipt.url,
          format: receipt.format,
          bytes: receipt.bytes,
          originalName: receipt.originalFilename,
          mimeType:
            receipt.format === "pdf"
              ? "application/pdf"
              : receipt.format
                ? `image/${receipt.format}`
                : null,
          applicationId: app.id,
          meta: {
            purpose: "cbc_receipt",
            uploadedVia: "acceptance_link",
          } as Prisma.InputJsonValue,
        },
      });

      const existing = await tx.payment.findFirst({
        where: { applicationId: app.id },
        orderBy: { createdAt: "desc" },
      });

      const paymentMeta = {
        receiptMediaId: media.id,
        receiptUrl: receipt.url,
        submittedFullName: fullName,
        submittedAt: now.toISOString(),
      } as Prisma.InputJsonValue;

      const payment = existing
        ? await tx.payment.update({
            where: { id: existing.id },
            data: {
              amountCbc: registrationFee.amountCbc,
              amountNgnApprox: registrationFee.amountNgnApprox,
              status: "PENDING",
              reference: existing.reference || reference,
              provider: "CBC",
              paidAt: null,
              meta: paymentMeta,
            },
          })
        : await tx.payment.create({
            data: {
              applicationId: app.id,
              amountCbc: registrationFee.amountCbc,
              amountNgnApprox: registrationFee.amountNgnApprox,
              status: "PENDING",
              reference,
              provider: "CBC",
              meta: paymentMeta,
            },
          });

      // Consume link: single-use, cannot be shared / reused
      await tx.magicLink.update({
        where: { id: link.id },
        data: { usedAt: now },
      });

      return { payment, media };
    });

    return jsonOk({
      status: "payment_pending",
      registered: false,
      paymentStatus: "pending",
      message:
        "Registration submitted. Your CBC receipt is with the BOBO team for verification.",
      applicantName: fullName,
      fullName,
      email: app.email,
      payment: {
        id: result.payment.id,
        status: result.payment.status,
        reference: result.payment.reference,
        amountCbc: Number(result.payment.amountCbc),
        amountNgnApprox: result.payment.amountNgnApprox,
        receiptUrl: receipt.url,
      },
    });
  } catch (err) {
    console.error("[accept/confirm-payment]", err);
    return jsonError("Internal server error", 500);
  }
}
