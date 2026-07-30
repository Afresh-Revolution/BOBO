import "server-only";

import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/content";

export type PortalSettings = {
  applicationsOpen: boolean;
  openDateIso: string;
  closeDateIso: string;
  openDateLabel: string;
  closeDateLabel: string;
  /** True when applicants can submit right now. */
  isAccepting: boolean;
  /**
   * Landing CTA copy when not accepting:
   * - upcoming open date → "Opens {date}"
   * - otherwise → "Closed"
   */
  ctaLabel: string;
  ctaHref: string | null;
  statusMessage: string;
};

const DEFAULT_OPEN = "2026-08-01";
const DEFAULT_CLOSE = "2026-10-31";

function unwrapSetting(raw: unknown): unknown {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw) {
    return unwrapSetting((raw as { value: unknown }).value);
  }
  return raw;
}

function asBoolean(raw: unknown, fallback: boolean) {
  const v = unwrapSetting(raw);
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1 || v === "1") return true;
  if (v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

function asDateIso(raw: unknown, fallback: string) {
  const v = unwrapSetting(raw);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v.trim())) {
    return v.trim().slice(0, 10);
  }
  return fallback;
}

export function formatPortalDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function startOfDay(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function endOfDay(iso: string) {
  return new Date(`${iso}T23:59:59.999`);
}

export async function getPortalSettings(): Promise<PortalSettings> {
  let applicationsOpen = false;
  let openDateIso = DEFAULT_OPEN;
  let closeDateIso = DEFAULT_CLOSE;

  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "applications_open",
            "applications_open_date",
            "applications_close_date",
          ],
        },
      },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));

    applicationsOpen = asBoolean(byKey.get("applications_open"), false);
    openDateIso = asDateIso(byKey.get("applications_open_date"), DEFAULT_OPEN);
    closeDateIso = asDateIso(
      byKey.get("applications_close_date"),
      DEFAULT_CLOSE,
    );
  } catch {
    // Fall back to defaults if DB is unavailable.
  }

  const openDateLabel = formatPortalDate(openDateIso);
  const closeDateLabel = formatPortalDate(closeDateIso);
  const now = new Date();
  const beforeOpen = now < startOfDay(openDateIso);
  const afterClose = now > endOfDay(closeDateIso);

  const isAccepting = applicationsOpen && !beforeOpen && !afterClose;

  let ctaLabel = "Apply Now";
  let ctaHref: string | null = siteConfig.links.apply;
  let statusMessage = `Portal open ${openDateLabel} to ${closeDateLabel}.`;

  if (!isAccepting) {
    ctaHref = null;
    if (!applicationsOpen && beforeOpen) {
      ctaLabel = `Opens ${openDateLabel}`;
      statusMessage = `Applications open ${openDateLabel}.`;
    } else if (beforeOpen) {
      ctaLabel = `Opens ${openDateLabel}`;
      statusMessage = `Applications open ${openDateLabel}.`;
    } else {
      ctaLabel = "Closed";
      statusMessage = afterClose
        ? `Applications closed on ${closeDateLabel}.`
        : "Applications are currently closed.";
    }
  }

  return {
    applicationsOpen,
    openDateIso,
    closeDateIso,
    openDateLabel,
    closeDateLabel,
    isAccepting,
    ctaLabel,
    ctaHref,
    statusMessage,
  };
}
