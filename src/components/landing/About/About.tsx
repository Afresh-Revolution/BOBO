import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig } from "@/lib/content";
import styles from "./About.module.scss";

type AboutProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  pillars?: string[];
  statement?: string | null;
};

export function About({
  eyebrow = "The Standard",
  title = "A Baddie is built on substance.",
  description = "BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first.",
  pillars = [...siteConfig.pillars],
  statement = siteConfig.statement,
}: AboutProps) {
  return (
    <section id="about" className={styles.about}>
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "The Standard"}
            title={title || "A Baddie is built on substance."}
            description={
              description ||
              "BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first."
            }
          />
        </Reveal>

        <ul className={styles.pillars}>
          {pillars.map((pillar, i) => (
            <Reveal key={pillar} delay={0.06 * i} as="li" className={styles.pillar}>
              <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.label}>{pillar}</span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.15} className={styles.statement}>
          <p>{statement}</p>
        </Reveal>
      </div>
    </section>
  );
}
