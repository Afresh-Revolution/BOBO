import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { NetworkPartnerCard } from "@/lib/partners";
import styles from "./Sponsors.module.scss";

type SponsorsProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  partners?: NetworkPartnerCard[];
};

export function Sponsors({
  eyebrow = "Partners",
  title = "Powered by the ecosystem.",
  description = "Applications, voting, and registration live across the CBrilliance network.",
  partners = [],
}: SponsorsProps) {
  return (
    <section id="sponsors" className={styles.section}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "Partners"}
            title={title || "Powered by the ecosystem."}
            description={
              description ||
              "Applications, voting, and registration live across the CBrilliance network."
            }
            align="center"
          />
        </Reveal>

        {partners.length ? (
          <ul className={styles.row}>
            {partners.map((partner, i) => {
              const inner = (
                <>
                  {partner.logoUrl ? (
                    <span className={styles.logoMedia} aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.logoImg}
                        src={partner.logoUrl}
                        alt=""
                      />
                    </span>
                  ) : null}
                  <span className={styles.logoText}>{partner.name}</span>
                </>
              );

              return (
                <Reveal
                  key={partner.id}
                  delay={0.08 * i}
                  as="li"
                  className={styles.item}
                >
                  {partner.href ? (
                    <a
                      href={partner.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.logo}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className={styles.logo}>{inner}</div>
                  )}
                </Reveal>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
