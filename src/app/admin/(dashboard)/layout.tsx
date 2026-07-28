"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/admin";

export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
