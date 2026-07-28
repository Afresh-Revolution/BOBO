import "server-only";

import { appUrl } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  emailApplicationApproved,
  emailApplicationReceived,
  emailApplicationRejected,
  emailLinkExpired,
  emailPaymentConfirmation,
  emailRegistrationReminder,
} from "@/lib/email";
import { createAcceptanceLink } from "@/lib/magic-link";
import type { EmailTemplate } from "@prisma/client";

function metaString(meta: unknown, key: string): string | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function resolveAcceptUrl(
  applicationId: string,
  meta: unknown,
): Promise<string> {
  const fromMeta = metaString(meta, "acceptUrl");
  if (fromMeta) return fromMeta;

  const { rawToken } = await createAcceptanceLink(applicationId);
  return appUrl(`/accept/${rawToken}`);
}

export async function resendEmailLog(logId: string) {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log) {
    return { ok: false as const, error: "Email log not found.", status: 404 };
  }

  const application = log.applicationId
    ? await prisma.application.findUnique({ where: { id: log.applicationId } })
    : await prisma.application.findFirst({
        where: { email: { equals: log.toEmail, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
      });

  const to = log.toEmail;
  const name = application?.fullName || to.split("@")[0] || "there";
  const applicationId = application?.id ?? log.applicationId ?? undefined;
  const template = log.template as EmailTemplate;

  let result: { ok: boolean; error?: string };

  switch (template) {
    case "APPLICATION_RECEIVED": {
      if (!applicationId) {
        return {
          ok: false as const,
          error: "Missing application for this email.",
          status: 400,
        };
      }
      result = await emailApplicationReceived(to, name, applicationId);
      break;
    }
    case "APPLICATION_APPROVED": {
      if (!applicationId) {
        return {
          ok: false as const,
          error: "Missing application for this email.",
          status: 400,
        };
      }
      const acceptUrl = await resolveAcceptUrl(applicationId, log.meta);
      result = await emailApplicationApproved(to, name, applicationId, acceptUrl);
      break;
    }
    case "APPLICATION_REJECTED": {
      if (!applicationId) {
        return {
          ok: false as const,
          error: "Missing application for this email.",
          status: 400,
        };
      }
      result = await emailApplicationRejected(
        to,
        name,
        applicationId,
        application?.rejectionReason ?? undefined,
      );
      break;
    }
    case "REGISTRATION_REMINDER": {
      if (!applicationId) {
        return {
          ok: false as const,
          error: "Missing application for this email.",
          status: 400,
        };
      }
      const acceptUrl = await resolveAcceptUrl(applicationId, log.meta);
      result = await emailRegistrationReminder(
        to,
        name,
        applicationId,
        acceptUrl,
      );
      break;
    }
    case "PAYMENT_CONFIRMATION": {
      if (!applicationId) {
        return {
          ok: false as const,
          error: "Missing application for this email.",
          status: 400,
        };
      }
      result = await emailPaymentConfirmation(to, name, applicationId);
      break;
    }
    case "LINK_EXPIRED": {
      result = await emailLinkExpired(to, name, applicationId);
      break;
    }
    default:
      return {
        ok: false as const,
        error: `Unsupported template: ${template}`,
        status: 400,
      };
  }

  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error || "Resend failed.",
      status: 502,
    };
  }

  return { ok: true as const };
}
