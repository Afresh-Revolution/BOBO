"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FaqItem } from "@/lib/cms-landing";
import { faqs } from "@/lib/content";
import styles from "./FAQ.module.scss";

type FAQProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  items?: FaqItem[];
};

export function FAQ({
  eyebrow = "FAQ",
  title = "Answers, without the fluff.",
  description = "Everything applicants ask before hitting submit.",
  items = faqs as unknown as FaqItem[],
}: FAQProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className={styles.section}>
      <div className={`container ${styles.layout}`}>
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "FAQ"}
            title={title || "Answers, without the fluff."}
            description={
              description || "Everything applicants ask before hitting submit."
            }
          />
        </Reveal>

        <div className={styles.list} role="list">
          {items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;

            return (
              <Reveal key={`${item.q}-${i}`} delay={0.04 * i} className={styles.item} as="div">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.trigger}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span
                      className={[styles.icon, isOpen ? styles.iconOpen : ""].join(
                        " ",
                      )}
                      aria-hidden
                    >
                      <span />
                      <span />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className={styles.panel}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
