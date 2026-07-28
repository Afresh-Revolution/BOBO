import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { eligibility, siteConfig } from "@/lib/content";
import styles from "./Eligibility.module.scss";

export function Eligibility() {
  return (
    <section id="eligibility" className={styles.section}>
      <div className={`container ${styles.layout}`}>
        <Reveal>
          <SectionHeader
            eyebrow="Eligibility"
            title="You must satisfy every requirement."
            description="Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed."
            tone="dark"
          />
        </Reveal>

        <ul className={styles.list}>
          {eligibility.map((item, i) => (
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
          <p>
            Need a CBrilliance account? Create one first. It is required for applications
            and for voting on Popin.
          </p>
          <div className={styles.links}>
            <Button
              href={siteConfig.links.cbrilliance}
              external
              variant="gold"
              size="md"
            >
              Get CBrilliance
            </Button>
            <Button href={siteConfig.links.popin} external variant="secondary" size="md">
              Visit Popin
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
