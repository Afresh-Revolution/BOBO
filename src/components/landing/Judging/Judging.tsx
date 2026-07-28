import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { judging } from "@/lib/content";
import styles from "./Judging.module.scss";

export function Judging() {
  return (
    <section id="judging" className={styles.section}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow="Judging Process"
            title="Presence. Substance. Character. Style."
            description="Every applicant is reviewed with the same lens: no shortcuts, no noise."
            align="center"
          />
        </Reveal>

        <div className={styles.grid}>
          {judging.map((item, i) => (
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
