"use client";

import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";

type ApplyCtaProps = {
  label: string;
  href: string | null;
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "md" | "lg";
  className?: string;
  children?: ReactNode;
};

/** Landing/apply CTA that becomes a disabled label when the portal is closed. */
export function ApplyCta({
  label,
  href,
  variant = "gold",
  size = "md",
  className,
  children,
}: ApplyCtaProps) {
  const text = children ?? label;
  if (href) {
    return (
      <Button href={href} variant={variant} size={size} className={className}>
        {text}
      </Button>
    );
  }
  return (
    <Button variant={variant} size={size} className={className} disabled>
      {text}
    </Button>
  );
}
