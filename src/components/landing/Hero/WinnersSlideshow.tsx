"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FALLBACK_WINNERS,
  type SeasonWinner,
} from "@/lib/winners-shared";
import styles from "./WinnersSlideshow.module.scss";

type WinnersSlideshowProps = {
  winners?: SeasonWinner[] | null;
  intervalMs?: number;
};

export function WinnersSlideshow({
  winners,
  intervalMs = 5200,
}: WinnersSlideshowProps) {
  const reduce = useReducedMotion();
  const slides = useMemo(() => {
    if (Array.isArray(winners) && winners.length > 0) return winners;
    return FALLBACK_WINNERS;
  }, [winners]);

  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    if (reduce || count <= 1) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [count, intervalMs, reduce]);

  const winner = slides[index] ?? slides[0];
  if (!winner) return null;

  return (
    <aside className={styles.rail} aria-label="Previous season winners">
      <div className={styles.frame}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={winner.id}
            className={styles.slide}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className={styles.season}>
              <span className={styles.seasonGhost} aria-hidden>
                {winner.seasonLabel}
              </span>
              <span className={styles.seasonText}>{winner.seasonLabel}</span>
            </p>

            <div className={styles.portrait}>
              <Image
                src={winner.imageUrl || "/winner.png"}
                alt={`${winner.winnerName}, ${winner.seasonLabel} winner`}
                fill
                sizes="(max-width: 899px) 72vw, 28vw"
                className={styles.image}
                priority
              />
            </div>

            <div className={styles.meta}>
              <p className={styles.name}>{winner.winnerName}</p>
              <p className={styles.state}>{winner.stateOfOrigin}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {count > 1 ? (
          <div className={styles.dots} role="tablist" aria-label="Winner slides">
            {slides.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${item.seasonLabel}: ${item.winnerName}`}
                className={i === index ? styles.dotActive : styles.dot}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
