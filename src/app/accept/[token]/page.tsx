import type { Metadata } from "next";
import { AcceptClient } from "./AcceptClient";

export const metadata: Metadata = {
  title: "Acceptance",
  description:
    "Private BOBO contestant acceptance and registration payment page.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function AcceptPage({ params }: PageProps) {
  await params;
  return <AcceptClient />;
}
