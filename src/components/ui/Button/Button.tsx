"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "md" | "lg";
  external?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
  disabled?: boolean;
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  external,
  className,
  onClick,
  type = "button",
  ariaLabel,
  disabled,
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <span className={styles.label}>{children}</span>
      <span className={styles.shine} aria-hidden />
    </>
  );

  if (href && !disabled) {
    if (external) {
      return (
        <motion.a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {inner}
        </motion.a>
      );
    }

    return (
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "inline-flex" }}
      >
        <Link href={href} className={classes} aria-label={ariaLabel}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {inner}
    </motion.button>
  );
}
