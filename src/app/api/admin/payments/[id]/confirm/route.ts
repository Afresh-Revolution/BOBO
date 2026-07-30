import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { emailPaymentConfirmation } from "@/lib/email";
import { serializePayment } from "@/lib/serializers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteContext) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const { id } = await ctx.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            age: true,
            stateOfResidence: true,
            nin: true,
            status: true,
          },
        },
      },
    });

    if (!payment) return jsonError("Payment not found.", 404);
    if (payment.status === "COMPLETED") {
      return jsonError("Payment is already confirmed.", 400);
    }
    if (payment.status === "REFUNDED") {
      return jsonError("Refunded payments cannot be confirmed.", 400);
    }

    const now = new Date();
    const ip = clientIp(_req);

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          paidAt: now,
        },
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
      });

      const updatedApp = await tx.application.update({
        where: { id: payment.applicationId },
        data: {
          status: "REGISTERED",
          registeredAt: now,
        },
      });

      // If the acceptance link is still within its window, stamp confirmation
      // so revisiting the link shows registered / paid.
      const link = await tx.magicLink.findFirst({
        where: {
          applicationId: payment.applicationId,
          type: "ACCEPTANCE",
          revokedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      });

      let linkUpdated = false;
      if (link) {
        await tx.magicLink.update({
          where: { id: link.id },
          data: {
            usedAt: link.usedAt ?? now,
          },
        });
        linkUpdated = true;
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: "payment.confirm",
          entity: "Payment",
          entityId: payment.id,
          ip,
          userAgent: _req.headers.get("user-agent") || undefined,
          meta: {
            applicationId: payment.applicationId,
            reference: payment.reference,
            linkUpdated,
          },
        },
      });

      return { updatedPayment, updatedApp, linkUpdated };
    });

    await emailPaymentConfirmation(
      result.updatedApp.email,
      result.updatedApp.fullName,
      result.updatedApp.id,
    );

    return jsonOk({
      data: serializePayment(result.updatedPayment),
      linkUpdated: result.linkUpdated,
      message: "Payment confirmed. Contestant marked as registered.",
    });
  } catch (err) {
    console.error("[admin/payments/confirm]", err);
    return jsonError("Internal server error", 500);
  }
}
