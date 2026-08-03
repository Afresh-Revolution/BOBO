import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import styles from "./GalleryTeaser.module.scss";

type GalleryTeaserProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  previewUrls?: string[];
};

export function GalleryTeaser({
  eyebrow = "Gallery",
  title = "Moments from the stage.",
  description = "Browse albums from seasons, casting, and behind the scenes.",
  ctaLabel = "Open gallery",
  ctaHref = "/gallery",
  previewUrls = [],
}: GalleryTeaserProps) {
  return (
    <section id="gallery" className={styles.section}>
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow || "Gallery"}
            title={title || "Moments from the stage."}
            description={
              description ||
              "Browse albums from seasons, casting, and behind the scenes."
            }
            align="center"
            tone="dark"
          />
        </Reveal>

        {previewUrls.length ? (
          <ul className={styles.preview} aria-hidden>
            {previewUrls.map((url, i) => (
              <Reveal key={`${url}-${i}`} delay={0.06 * i} as="li">
                <div className={styles.tile}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className={styles.img} />
                </div>
              </Reveal>
            ))}
          </ul>
        ) : null}

        <Reveal delay={0.12} className={styles.cta}>
          <Button href={ctaHref || "/gallery"} variant="gold" size="lg">
            {ctaLabel || "Open gallery"}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
