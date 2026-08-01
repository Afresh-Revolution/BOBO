import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { eligibility as defaultEligibility, siteConfig } from "@/lib/content";
import styles from "./Eligibility.module.scss";

type EligibilityProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  items?: string[];
  note?: string | null;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export function Eligibility({
  eyebrow = "Eligibility",
  title = "You must satisfy every requirement.",
  description = "Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed.",
  items = [...defaultEligibility],
  note = "Need a CBrilliance account? Create one first. It is required for applications and for voting on Popin.",
  primaryCtaLabel = "Get CBrilliance",
  primaryCtaHref = siteConfig.links.cbrilliance,
  secondaryCtaLabel = "Visit Popin",
  secondaryCtaHref = siteConfig.links.popin,
}: EligibilityProps) {
  return (
    <section id="eligibility" className={styles.section}>
      <div className={`container ${styles.layout}`}>
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "Eligibility"}
            title={title || "You must satisfy every requirement."}
            description={
              description ||
              "Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed."
            }
            tone="dark"
          />
        </Reveal>

        <ul className={styles.list}>
          {items.map((item, i) => (
            <Reveal key={item} delay={0.08 * i} as="li" className={styles.item}>
              <span className={styles.check} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M5 12.5l4.2 4.2L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>{item}</span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.25} className={styles.note}>
          <p>{note}</p>
          <div className={styles.links}>
            <Button href={primaryCtaHref} external variant="gold" size="md">
              {primaryCtaLabel}
            </Button>
            <Button href={secondaryCtaHref} external variant="secondary" size="md">
              {secondaryCtaLabel}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
