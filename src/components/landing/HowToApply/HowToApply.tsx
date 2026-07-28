import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { applySteps, siteConfig } from "@/lib/content";
import styles from "./HowToApply.module.scss";

export function HowToApply() {
  return (
    <section id="apply" className={styles.section}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow="How To Apply"
            title="Four steps to the stage."
            description="From eligibility to a secure registration link. The path is clear, intentional, and fair."
          />
        </Reveal>

        <ol className={styles.steps}>
          {applySteps.map((step, i) => (
            <Reveal key={step.step} delay={0.08 * i} as="li" className={styles.step}>
              <span className={styles.num}>{step.step}</span>
              <div className={styles.body}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={0.2} className={styles.cta}>
          <Button href={siteConfig.links.apply} variant="primary" size="lg">
            Begin Your Application
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
