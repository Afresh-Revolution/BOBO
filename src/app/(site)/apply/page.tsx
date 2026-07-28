import type { Metadata } from "next";
import { ApplyFlow } from "./ApplyFlow";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Confirm eligibility and submit your BOBO contestant application: profile, birth certificate, and entry video.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ApplyPage() {
  return <ApplyFlow />;
}
