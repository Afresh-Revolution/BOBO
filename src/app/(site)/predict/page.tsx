import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  laskadWhatsAppDisplay,
  laskadWhatsAppHref,
  predictHeadline,
  predictTerms,
  predictVideoSrc,
} from "@/lib/predict";
import styles from "./predict.module.scss";

export const metadata: Metadata = {
  title: "Predict the BOBO of Edition 2",
  description:
    "Predict who will be announced as the BOBO of Edition 2 and win ₦1,000,000. Each prediction costs ₦100 through Laskad AI on WhatsApp.",
};

export default function PredictPage() {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.back}>
          Back to site
        </Link>

        <video
          className={styles.video}
          controls
          playsInline
          preload="metadata"
          src={predictVideoSrc}
          aria-label="BOBO Edition 2 prediction"
        />

        <h1 className={styles.title}>{predictHeadline}</h1>

        <div className={styles.copy}>
          <p>
            The BOBO of Edition 1 was Ice Prince. Now you have a chance to
            predict who will be announced as the BOBO of Edition 2 and win
            ₦1,000,000.
          </p>
          <p>
            Each prediction costs ₦100. You can make multiple predictions on
            the same celebrity or predict on different celebrities. The person
            who makes the highest number of paid predictions on the celebrity
            that is later officially announced as the BOBO of Edition 2, will
            win the prize money.
          </p>
          <p>Make your prediction through Laskad AI on WhatsApp only.</p>
          <p>
            Send this message &ldquo;Bobo&rdquo;, to the Laskad number below on
            WhatsApp, and it will begin the process of the prediction for you;
          </p>
        </div>

        <a className={styles.phone} href={laskadWhatsAppHref}>
          {laskadWhatsAppDisplay}
        </a>

        <p className={styles.copy}>
          Start by creating a Laskad account first, no need to verify your BVN,
          just complete the account creation, Fund the account, then type
          &ldquo;Bobo&rdquo; again and complete the process of your prediction.
        </p>

        <Button href={laskadWhatsAppHref} variant="gold" size="lg" external>
          Send &ldquo;Bobo&rdquo; on WhatsApp
        </Button>

        <section className={styles.terms} aria-labelledby="predict-terms">
          <h2 id="predict-terms">Terms &amp; Conditions</h2>
          <p className={styles.learn}>
            (Learn more at{" "}
            <a href="https://boboreality.com">boboreality.com</a>)
          </p>
          <ol>
            {predictTerms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </section>

        <p className={styles.luck}>Good Luck..</p>
      </div>
    </article>
  );
}
