import { jsonError } from "@/lib/api";

type BotFields = {
  /** Honeypot — must be empty. */
  website?: string | null;
  turnstileToken?: string | null;
};

/**
 * Reject obvious bots (filled honeypot) and optionally verify Cloudflare Turnstile
 * when TURNSTILE_SECRET_KEY is configured.
 */
export async function assertHumanSubmission(
  fields: BotFields,
): Promise<Response | null> {
  if (typeof fields.website === "string" && fields.website.trim().length > 0) {
    return jsonError("Unable to submit.", 400);
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return null;

  const token = fields.turnstileToken?.trim();
  if (!token) {
    return jsonError("Bot verification required.", 400);
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
    } | null;
    if (!data?.success) {
      return jsonError("Bot verification failed.", 403);
    }
  } catch (err) {
    console.error("[bot-guard/turnstile]", err);
    return jsonError("Bot verification unavailable.", 503);
  }

  return null;
}
