"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApplyCta } from "@/components/ui/ApplyCta";
import { siteConfig } from "@/lib/content";
import styles from "./Header.module.scss";

const nav = [
  { href: "/#about", label: "About" },
  { href: "/#timeline", label: "Timeline" },
  { href: "/#apply", label: "Apply" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#faq", label: "FAQ" },
];

type HeaderProps = {
  applyLabel?: string;
  applyHref?: string | null;
};

export function Header({
  applyLabel = "Apply Now",
  applyHref = siteConfig.links.apply,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        styles.header,
        open ? styles.menuOpen : scrolled ? styles.solid : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="BOBO home">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className={styles.mark}
            priority
          />
          <span className={styles.word}>{siteConfig.name}</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <ApplyCta
            label={applyLabel}
            href={applyHref}
            size="md"
            variant="gold"
          />
        </div>

        <button
          type="button"
          className={styles.menuBtn}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={[styles.bar, open ? styles.barOpen : ""].join(" ")} />
          <span className={[styles.bar, open ? styles.barOpen : ""].join(" ")} />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={styles.mobile}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className={styles.mobileNav} aria-label="Mobile">
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={styles.mobileLink}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <ApplyCta
              label={applyLabel}
              href={applyHref}
              size="lg"
              variant="gold"
              className={styles.mobileCta}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
