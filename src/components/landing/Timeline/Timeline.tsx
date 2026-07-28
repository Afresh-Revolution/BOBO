"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { timeline } from "@/lib/content";
import styles from "./Timeline.module.scss";

gsap.registerPlugin(ScrollTrigger);

type TimelineProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
};

export function Timeline({
  eyebrow = "The Season",
  title = "Mark the dates.",
  description = "Portal opens August 1. Closes October 31. The show begins December 26.",
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!trackRef.current) return;
      const line = trackRef.current.querySelector(`.${styles.progress}`);
      if (!line) return;

      gsap.fromTo(
        line,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top 70%",
            end: "bottom 55%",
            scrub: 0.6,
          },
        },
      );
    },
    { scope: trackRef },
  );

  return (
    <section id="timeline" className={styles.timeline}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "The Season"}
            title={title || "Mark the dates."}
            description={
              description ||
              "Portal opens August 1. Closes October 31. The show begins December 26."
            }
            tone="dark"
          />
        </Reveal>

        <div ref={trackRef} className={styles.track}>
          <div className={styles.rail} aria-hidden>
            <div className={styles.progress} />
          </div>

          <ol className={styles.list}>
            {timeline.map((item, i) => (
              <Reveal key={item.id} delay={0.1 * i} as="li" className={styles.item}>
                <span className={styles.dot} aria-hidden />
                <p className={styles.date}>{item.date}</p>
                <h3 className={styles.label}>{item.label}</h3>
                <p className={styles.detail}>{item.detail}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
