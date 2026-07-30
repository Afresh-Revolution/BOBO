import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { emailLinkExpired } from "@/lib/email";
import { mapAppStatus } from "@/lib/serializers";

const DEFAULT_GUIDELINES = [
  "Keep your registration link private. It is single-use and expires in 48 hours.",
  "Do not share this page. Anyone with the link could submit in your place before you do.",
  "Buy 5 CBC (approx. ₦150,000) on CBC Nets, then upload a screenshot of your purchase receipt.",
  "Stay reachable on the email used for your application.",
  "Follow all show conduct rules shared by the BOBO production team.",
];

type RouteContext = { params: Promise<{ token: string }> };

async function loadGuidelines(): Promise<string[]> {
  try {
    const section = await prisma.websiteContent.findUnique({
      where: { sectionKey: "guidelines" },
    });
    if (!section) return DEFAULT_GUIDELINES;

    const meta = section.meta as { items?: string[]; guidelines?: string[] } | null;
    const fromMeta = meta?.items || meta?.guidelines;
    if (Array.isArray(fromMeta) && fromMeta.length) {
      return fromMeta.filter((g): g is string => typeof g === "string");
    }
    if (section.body?.trim()) {
      return section.body
        .split(/\n+/)
        .map((line: string) => line.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean);
    }
  } catch {
    // fall through
  }
  return DEFAULT_GUIDELINES;
}

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { token } = await ctx.params;
    if (!token) {
      return jsonError("Invalid link.", 404, { status: "invalid" });
    }

    const tokenHash = hashToken(token);
    const link = await prisma.magicLink.findFirst({
      where: { tokenHash, type: "ACCEPTANCE" },
      include: {
        application: {
          include: {
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!link || link.revokedAt) {
      return jsonError("This acceptance link is invalid.", 404, {
        status: "invalid",
      });
    }

    if (link.usedAt) {
      const app = link.application;
      const payment = app.payments[0];
      const registered = app.status === "REGISTERED";
      const paymentPending = payment?.status === "PENDING";

      if (registered || payment?.status === "COMPLETED") {
        return jsonOk({
          status: "registered",
          registered: true,
          paymentStatus: "paid",
          applicantName: app.fullName,
          fullName: app.fullName,
          email: app.email,
          expiresAt: link.expiresAt.toISOString(),
          message: "Registration already completed.",
        });
      }

      if (paymentPending) {
        return jsonOk({
          status: "payment_pending",
          registered: false,
          paymentStatus: "pending",
          applicantName: app.fullName,
          fullName: app.fullName,
          email: app.email,
          expiresAt: link.expiresAt.toISOString(),
          message:
            "This link was already used. Your CBC receipt is still under review.",
        });
      }

      return jsonError("This link has already been used and cannot be shared.", 409, {
        status: "used",
        applicantName: app.fullName,
        fullName: app.fullName,
        email: app.email,
      });
    }

    if (link.expiresAt.getTime() < Date.now()) {
      const already = await prisma.emailLog.findFirst({
        where: {
          applicationId: link.applicationId,
          template: "LINK_EXPIRED",
        },
      });
      if (!already) {
        await emailLinkExpired(
          link.application.email,
          link.application.fullName,
          link.applicationId,
        );
      }

      return jsonError("This link has expired.", 410, {
        status: "expired",
        applicantName: link.application.fullName,
        fullName: link.application.fullName,
        email: link.application.email,
        expiresAt: link.expiresAt.toISOString(),
      });
    }

    const app = link.application;
    const payment = app.payments[0];
    const registered = app.status === "REGISTERED";
    const paymentStatus = registered
      ? "paid"
      : payment?.status === "COMPLETED"
        ? "paid"
        : payment?.status === "PENDING"
          ? "pending"
          : "unpaid";

    const status =
      registered || paymentStatus === "paid"
        ? "registered"
        : mapAppStatus(app.status) === "approved"
          ? "approved"
          : mapAppStatus(app.status);

    const guidelines = await loadGuidelines();

    return jsonOk({
      status,
      applicantName: app.fullName,
      fullName: app.fullName,
      email: app.email,
      expiresAt: link.expiresAt.toISOString(),
      paymentStatus,
      registered,
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            amountCbc: Number(payment.amountCbc),
            amountNgnApprox: payment.amountNgnApprox,
            reference: payment.reference,
          }
        : null,
      guidelines,
      application: {
        id: app.id,
        status: mapAppStatus(app.status),
        fullName: app.fullName,
        email: app.email,
      },
    });
  } catch (err) {
    console.error("[accept]", err);
    return jsonError("Internal server error", 500);
  }
}
