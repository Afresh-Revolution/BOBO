"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "article" | "li" | "span";
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
  once = true,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    switch (as) {
      case "section":
        return <section className={className}>{children}</section>;
      case "article":
        return <article className={className}>{children}</article>;
      case "li":
        return <li className={className}>{children}</li>;
      case "span":
        return <span className={className}>{children}</span>;
      default:
        return <div className={className}>{children}</div>;
    }
  }

  const MotionTag =
    as === "section"
      ? motion.section
      : as === "article"
        ? motion.article
        : as === "li"
          ? motion.li
          : as === "span"
            ? motion.span
            : motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-8% 0px -8% 0px", amount: 0.2 }}
      transition={{
        duration: 0.85,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
