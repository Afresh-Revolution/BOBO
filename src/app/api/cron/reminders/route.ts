import { prisma } from "@/lib/db";
import { appUrl, safeEqual } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { emailRegistrationReminder } from "@/lib/email";
import { createAcceptanceLink } from "@/lib/magic-link";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return safeEqual(match[1], secret);
}

async function runReminders() {
  const horizon = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const now = new Date();

  const links = await prisma.magicLink.findMany({
    where: {
      type: "ACCEPTANCE",
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: now, lte: horizon },
      application: { status: "APPROVED" },
    },
    include: { application: true },
  });

  let sent = 0;
  const results: { applicationId: string; ok: boolean }[] = [];

  for (const link of links) {
    const already = await prisma.emailLog.findFirst({
      where: {
        applicationId: link.applicationId,
        template: "REGISTRATION_REMINDER",
      },
    });
    if (already) continue;

    // Rotate token so the reminder can include a working URL (raw token is not stored).
    const { rawToken } = await createAcceptanceLink(
      link.applicationId,
      link.expiresAt,
    );
    const acceptUrl = appUrl(`/accept/${rawToken}`);
    const result = await emailRegistrationReminder(
      link.application.email,
      link.application.fullName,
      link.applicationId,
      acceptUrl,
    );
    if (result.ok) sent += 1;
    results.push({ applicationId: link.applicationId, ok: result.ok });
  }

  return { scanned: links.length, sent, results };
}

export async function GET(req: Request) {
  try {
    if (!authorize(req)) return jsonError("Unauthorized", 401);
    const summary = await runReminders();
    return jsonOk(summary);
  } catch (err) {
    console.error("[cron/reminders GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    if (!authorize(req)) return jsonError("Unauthorized", 401);
    const summary = await runReminders();
    return jsonOk(summary);
  } catch (err) {
    console.error("[cron/reminders POST]", err);
    return jsonError("Internal server error", 500);
  }
}
