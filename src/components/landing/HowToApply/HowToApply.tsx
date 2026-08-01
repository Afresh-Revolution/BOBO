import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ApplyCta } from "@/components/ui/ApplyCta";
import type { ApplyStep } from "@/lib/cms-landing";
import { applySteps as defaultSteps, siteConfig } from "@/lib/content";
import styles from "./HowToApply.module.scss";

type HowToApplyProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  steps?: ApplyStep[];
  applyLabel?: string;
  applyHref?: string | null;
};

export function HowToApply({
  eyebrow = "How To Apply",
  title = "Four steps to the stage.",
  description = "From eligibility to a secure registration link. The path is clear, intentional, and fair.",
  steps = [...defaultSteps],
  applyLabel = "Begin Your Application",
  applyHref = siteConfig.links.apply,
}: HowToApplyProps) {
  return (
    <section id="apply" className={styles.section}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "How To Apply"}
            title={title || "Four steps to the stage."}
            description={
              description ||
              "From eligibility to a secure registration link. The path is clear, intentional, and fair."
            }
          />
        </Reveal>

        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <Reveal key={`${step.step}-${step.title}`} delay={0.08 * i} as="li" className={styles.step}>
              <span className={styles.num}>{step.step}</span>
              <div className={styles.body}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={0.2} className={styles.cta}>
          <ApplyCta
            label={applyLabel}
            href={applyHref}
            variant="primary"
            size="lg"
          />
        </Reveal>
      </div>
    </section>
  );
}
