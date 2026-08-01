import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { JudgingCard } from "@/lib/cms-landing";
import { judging as defaultJudging } from "@/lib/content";
import styles from "./Judging.module.scss";

type JudgingProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  cards?: JudgingCard[];
};

export function Judging({
  eyebrow = "Judging Process",
  title = "Presence. Substance. Character. Style.",
  description = "Every applicant is reviewed with the same lens: no shortcuts, no noise.",
  cards = [...defaultJudging],
}: JudgingProps) {
  return (
    <section id="judging" className={styles.section}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "Judging Process"}
            title={title || "Presence. Substance. Character. Style."}
            description={
              description ||
              "Every applicant is reviewed with the same lens: no shortcuts, no noise."
            }
            align="center"
          />
        </Reveal>

        <div className={styles.grid}>
          {cards.map((item, i) => (
            <Reveal key={item.title} delay={0.08 * i} className={styles.card}>
              <span className={styles.mark} aria-hidden />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
