import type { Metadata } from "next";
import { ApplyFlow } from "./ApplyFlow";
import { getPortalSettings } from "@/lib/portal";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Confirm eligibility and submit your BOBO contestant application: profile, birth certificate, and entry video.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const portal = await getPortalSettings();

  return (
    <ApplyFlow
      portal={{
        isAccepting: portal.isAccepting,
        openDateLabel: portal.openDateLabel,
        closeDateLabel: portal.closeDateLabel,
        statusMessage: portal.statusMessage,
        ctaLabel: portal.ctaLabel,
      }}
    />
  );
}
