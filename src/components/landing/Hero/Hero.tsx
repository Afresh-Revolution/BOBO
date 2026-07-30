"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";
import type { SeasonWinner } from "@/lib/winners-shared";
import { WinnersSlideshow } from "./WinnersSlideshow";
import styles from "./Hero.module.scss";

type HeroProps = {
  winners?: SeasonWinner[] | null;
  brand?: string;
  fullName?: string;
  tagline?: string;
  ctaLabel?: string;
  ctaHref?: string | null;
};

export function Hero({
  winners,
  brand = siteConfig.name,
  fullName = siteConfig.fullName,
  tagline = siteConfig.tagline,
  ctaLabel = "Start Application",
  ctaHref = siteConfig.links.apply,
}: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.orb}`,
        { scale: 0.85, opacity: 0.5 },
        {
          scale: 1.08,
          opacity: 0.85,
          duration: 8,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        },
      );

      gsap.to(`.${styles.ring}`, {
        rotate: 360,
        duration: 48,
        repeat: -1,
        ease: "none",
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={rootRef} className={styles.hero} aria-labelledby="hero-brand">
      <div className={styles.atmosphere} aria-hidden>
        <div className={styles.orb} />
        <div className={styles.veil} />
        <div className={styles.vignette} />
        <div className={styles.ring} />
        <div className={styles.grid} />
      </div>

      <div className={`container ${styles.stage}`}>
        <div className={styles.content}>
          <motion.div
            className={styles.brandBlock}
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/logo.png"
              alt=""
              width={88}
              height={88}
              className={styles.logo}
              priority
            />
            <h1 id="hero-brand" className={styles.brand}>
              {brand}
            </h1>
            <p className={styles.fullName}>{fullName}</p>
          </motion.div>

          <motion.p
            className={styles.headline}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {tagline}
          </motion.p>

          <motion.p
            className={styles.support}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            A Nigerian reality show for the intelligent, elegant, and purpose-driven,
            not merely the attractive.
          </motion.p>

          <motion.div
            className={styles.ctas}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              href={ctaHref || undefined}
              variant="gold"
              size="lg"
              disabled={!ctaHref}
            >
              {ctaLabel}
            </Button>
            <Button href="#about" variant="secondary" size="lg">
              Discover BOBO
            </Button>
          </motion.div>
        </div>

        <motion.div
          className={styles.showcase}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.1, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <WinnersSlideshow winners={winners} />
        </motion.div>
      </div>

      <a href="#about" className={styles.scroll} aria-label="Scroll to about">
        <span>Scroll</span>
        <span className={styles.scrollLine} aria-hidden />
      </a>
    </section>
  );
}
