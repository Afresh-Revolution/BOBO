"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./AdminButton.module.scss";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  className,
  type = "button",
  ...rest
}: AdminButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      <span>{loading ? "Working…" : children}</span>
    </button>
  );
}
