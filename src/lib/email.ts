import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/auth";
import type { EmailTemplate, Prisma } from "@prisma/client";
import {
  bulletList,
  escapeHtml,
  highlightCard,
  paragraph,
  renderEmailLayout,
  strong,
  toPlainText,
} from "@/lib/email-templates";

type SendArgs = {
  to: string;
  template: EmailTemplate;
  subject: string;
  html: string;
  text: string;
  applicationId?: string;
  meta?: Prisma.InputJsonValue;
};

function fromAddress() {
  const name = process.env.RESEND_FROM_NAME || "BOBO";
  const email =
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    "noreply@bobo.show";
  // SMTP_FROM may already be "Name <email>"
  if (email.includes("<")) return email;
  return `${name} <${email}>`;
}

function smtpTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

async function deliver(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const from = fromAddress();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (result.error) {
      throw new Error(result.error.message || "Resend delivery failed");
    }
    return { providerId: result.data?.id, provider: "resend" as const };
  }

  const tx = smtpTransporter();
  if (tx) {
    const info = await tx.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return { providerId: info.messageId, provider: "smtp" as const };
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[email:dev]", args.subject, "→", args.to);
  }

  return { providerId: undefined, provider: "log" as const };
}

export async function sendEmail(args: SendArgs) {
  try {
    const delivery = await deliver({
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });

    await prisma.emailLog.create({
      data: {
        applicationId: args.applicationId,
        toEmail: args.to,
        template: args.template,
        subject: args.subject,
        status: delivery.provider === "log" ? "LOGGED" : "SENT",
        providerId: delivery.providerId,
        meta: {
          provider: delivery.provider,
          ...(args.meta &&
          typeof args.meta === "object" &&
          !Array.isArray(args.meta)
            ? (args.meta as Record<string, unknown>)
            : {}),
        } as Prisma.InputJsonValue,
      },
    });

    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    await prisma.emailLog.create({
      data: {
        applicationId: args.applicationId,
        toEmail: args.to,
        template: args.template,
        subject: args.subject,
        status: "FAILED",
        error: message,
        meta: args.meta ?? {},
      },
    });
    return { ok: false as const, error: message };
  }
}

export async function emailApplicationReceived(
  to: string,
  name: string,
  applicationId: string,
) {
  const safeName = escapeHtml(name);
  const subject = "BOBO application received";
  const title = "Application received";
  const paragraphs = [
    "We've received your BOBO application. Our team will review it carefully.",
    "You'll hear from us by email once a decision is made. No further action is needed right now.",
  ];

  const html = renderEmailLayout({
    preheader: "Your BOBO application is in review.",
    title,
    bodyHtml: [
      paragraph(`Hi ${safeName},`),
      paragraph(paragraphs[0]),
      highlightCard(
        `${strong("What happens next")}<br/>Our team reviews every entry video and profile with intention. Approved applicants receive a private registration link.`,
      ),
      paragraph(paragraphs[1]),
    ].join(""),
    secondaryNote:
      "Tip: Keep this email for your records. Voting later happens on Popin with a CBrilliance account.",
  });

  return sendEmail({
    to,
    applicationId,
    template: "APPLICATION_RECEIVED",
    subject,
    html,
    text: toPlainText({
      title,
      greeting: `Hi ${name},`,
      paragraphs,
    }),
  });
}

export async function emailApplicationApproved(
  to: string,
  name: string,
  applicationId: string,
  acceptUrl: string,
) {
  const safeName = escapeHtml(name);
  const subject = "You're approved: complete BOBO registration";
  const title = "You're approved";
  const paragraphs = [
    "Congratulations. You've been approved for BOBO.",
    "Open your private registration form to submit your full name and a screenshot of your CBC purchase receipt.",
    "This secure link expires in 48 hours, is single-use, and must not be shared.",
  ];

  const html = renderEmailLayout({
    preheader: "Approved for BOBO. Complete registration within 48 hours.",
    title,
    bodyHtml: [
      paragraph(`Hi ${safeName},`),
      paragraph(paragraphs[0]),
      paragraph(paragraphs[1]),
      highlightCard(
        bulletList([
          `${strong("Fee:")} 3 CBC (approx. ₦82,000)`,
          `${strong("Expires:")} 48 hours from this email`,
          `${strong("Access:")} Single-use private link`,
        ]),
      ),
      paragraph(paragraphs[2]),
    ].join(""),
    cta: { label: "Complete registration", href: acceptUrl },
    secondaryNote:
      "Purchase CBC via cbcnets.com if needed, then return to your private registration form to upload the receipt screenshot.",
  });

  return sendEmail({
    to,
    applicationId,
    template: "APPLICATION_APPROVED",
    subject,
    html,
    text: toPlainText({
      title,
      greeting: `Hi ${name},`,
      paragraphs,
      cta: { label: "Complete registration", href: acceptUrl },
    }),
    meta: { acceptUrl },
  });
}

export async function emailApplicationRejected(
  to: string,
  name: string,
  applicationId: string,
  reason?: string,
) {
  const safeName = escapeHtml(name);
  const safeReason = reason ? escapeHtml(reason) : undefined;
  const subject = "BOBO application update";
  const title = "Application update";
  const paragraphs = [
    "Thank you for applying to BOBO. After careful review, we will not be moving forward with your application this season.",
    "We appreciate your interest and wish you excellence ahead.",
  ];

  const html = renderEmailLayout({
    preheader: "An update on your BOBO application.",
    title,
    bodyHtml: [
      paragraph(`Hi ${safeName},`),
      paragraph(paragraphs[0]),
      safeReason
        ? highlightCard(`${strong("Note")}<br/>${safeReason}`)
        : "",
      paragraph(paragraphs[1]),
    ].join(""),
  });

  return sendEmail({
    to,
    applicationId,
    template: "APPLICATION_REJECTED",
    subject,
    html,
    text: toPlainText({
      title,
      greeting: `Hi ${name},`,
      paragraphs: safeReason
        ? [paragraphs[0], `Note: ${reason}`, paragraphs[1]]
        : paragraphs,
    }),
  });
}

export async function emailPaymentConfirmation(
  to: string,
  name: string,
  applicationId: string,
) {
  const safeName = escapeHtml(name);
  const subject = "BOBO registration confirmed";
  const title = "You're registered";
  const home = appUrl("/");
  const paragraphs = [
    "Your registration payment has been recorded. Welcome to BOBO.",
    "Keep an eye on your email for contestant guidelines and next steps.",
  ];

  const html = renderEmailLayout({
    preheader: "Welcome to BOBO. Your registration is confirmed.",
    title,
    bodyHtml: [
      paragraph(`Hi ${safeName},`),
      paragraph(paragraphs[0]),
      highlightCard(
        `${strong("Status: Registered")}<br/>You're among the contestants moving forward this season.`,
      ),
      paragraph(paragraphs[1]),
    ].join(""),
    cta: { label: "Visit BOBO", href: home },
  });

  return sendEmail({
    to,
    applicationId,
    template: "PAYMENT_CONFIRMATION",
    subject,
    html,
    text: toPlainText({
      title,
      greeting: `Hi ${name},`,
      paragraphs,
      cta: { label: "Visit BOBO", href: home },
    }),
  });
}

export async function emailLinkExpired(
  to: string,
  name: string,
  applicationId?: string,
) {
  const safeName = escapeHtml(name);
  const subject = "Your BOBO registration link expired";
  const title = "Link expired";
  const paragraphs = [
    "Your secure registration link has expired or was already used.",
    "Please contact the BOBO team if you still need access.",
  ];

  const html = renderEmailLayout({
    preheader: "Your BOBO registration link is no longer valid.",
    title,
    bodyHtml: [
      paragraph(`Hi ${safeName},`),
      paragraph(paragraphs[0]),
      highlightCard(
        `${strong("Why this happened")}<br/>Approval links are single-use and expire after 48 hours for security.`,
      ),
      paragraph(paragraphs[1]),
    ].join(""),
  });

  return sendEmail({
    to,
    applicationId,
    template: "LINK_EXPIRED",
    subject,
    html,
    text: toPlainText({
      title,
      greeting: `Hi ${name},`,
      paragraphs,
    }),
  });
}

export async function emailRegistrationReminder(
  to: string,
  name: string,
  applicationId: string,
  acceptUrl: string,
) {
  const safeName = escapeHtml(name);
  const subject = "Reminder: complete your BOBO registration";
  const title = "Registration reminder";
  const paragraphs = [
    "Your approval link is still waiting. Complete registration before it expires.",
    "You'll need your CBC purchase receipt screenshot ready to upload.",
  ];

  const html = renderEmailLayout({
    preheader: "Reminder: finish your BOBO registration before the link expires.",
    title,
    bodyHtml: [
      paragraph(`Hi ${safeName},`),
      paragraph(paragraphs[0]),
      paragraph(paragraphs[1]),
      highlightCard(
        `${strong("Still open")}<br/>This private link remains single-use. Do not forward it.`,
      ),
    ].join(""),
    cta: { label: "Complete registration", href: acceptUrl },
  });

  return sendEmail({
    to,
    applicationId,
    template: "REGISTRATION_REMINDER",
    subject,
    html,
    text: toPlainText({
      title,
      greeting: `Hi ${name},`,
      paragraphs,
      cta: { label: "Complete registration", href: acceptUrl },
    }),
    meta: { acceptUrl },
  });
}
