import styles from "./Skeleton.module.scss";

type SkeletonProps = {
  className?: string;
  height?: string | number;
  width?: string | number;
  radius?: string;
};

export function Skeleton({
  className,
  height = "1rem",
  width = "100%",
  radius,
}: SkeletonProps) {
  return (
    <span
      className={[styles.bone, className].filter(Boolean).join(" ")}
      style={{
        height,
        width,
        borderRadius: radius,
      }}
      aria-hidden
    />
  );
}

function SectionBlock({
  cards = 3,
  dark,
}: {
  cards?: number;
  dark?: boolean;
}) {
  return (
    <section className={[styles.section, dark ? styles.sectionDark : ""].join(" ")}>
      <div className={styles.sectionHead}>
        <Skeleton width="6rem" height="0.65rem" />
        <Skeleton width="42%" height="2rem" />
        <Skeleton width="58%" height="0.95rem" />
      </div>
      <div
        className={styles.cardGrid}
        style={{
          gridTemplateColumns: `repeat(${Math.min(cards, 4)}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} height="7.5rem" />
        ))}
      </div>
    </section>
  );
}

/** Full landing-page shaped skeleton (hero + sections). */
export function LandingSkeleton() {
  return (
    <div
      className={[styles.page, styles.site, styles.landing].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className={styles.nav}>
        <Skeleton width="5.5rem" height="1.5rem" />
        <div className={styles.navLinks}>
          <Skeleton width="3.5rem" height="0.7rem" />
          <Skeleton width="4rem" height="0.7rem" />
          <Skeleton width="3rem" height="0.7rem" />
          <Skeleton width="4.5rem" height="0.7rem" />
          <Skeleton width="2.5rem" height="0.7rem" />
        </div>
        <Skeleton width="8rem" height="2.4rem" radius="999px" />
      </div>

      <div className={styles.heroStage}>
        <div className={styles.heroCopy}>
          <Skeleton width="4.5rem" height="4.5rem" radius="1rem" />
          <Skeleton width="40%" height="3rem" />
          <Skeleton width="70%" height="1.1rem" />
          <Skeleton width="85%" height="2.2rem" />
          <Skeleton width="75%" height="1rem" />
          <div className={styles.row}>
            <Skeleton width="9rem" height="2.85rem" radius="999px" />
            <Skeleton width="8.5rem" height="2.85rem" radius="999px" />
          </div>
        </div>
        <Skeleton className={styles.heroMedia} height="22rem" radius="1.25rem" />
      </div>

      <SectionBlock cards={6} />
      <SectionBlock cards={3} dark />
      <SectionBlock cards={4} />
      <SectionBlock cards={4} dark />
    </div>
  );
}

/** Apply / long public form skeleton. */
export function ApplyFormSkeleton() {
  return (
    <div
      className={[styles.page, styles.site, styles.apply].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Loading application form"
    >
      <div className={styles.applyHead}>
        <Skeleton width="5rem" height="0.7rem" />
        <Skeleton width="55%" height="2.2rem" />
        <Skeleton width="70%" height="1rem" />
      </div>
      <div className={styles.applyCard}>
        <div className={styles.progress}>
          <Skeleton width="100%" height="0.45rem" radius="999px" />
          <div className={styles.row}>
            <Skeleton width="4rem" height="0.7rem" />
            <Skeleton width="3rem" height="0.7rem" />
          </div>
        </div>
        <FormSkeleton fields={7} />
        <div className={styles.row}>
          <Skeleton width="7rem" height="2.75rem" radius="999px" />
          <Skeleton width="8rem" height="2.75rem" radius="999px" />
        </div>
      </div>
    </div>
  );
}

/** Compact panel form (accept / login style). */
export function PanelFormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div
      className={styles.panelForm}
      role="status"
      aria-live="polite"
      aria-label="Loading form"
    >
      <Skeleton width="5rem" height="0.7rem" />
      <Skeleton width="70%" height="2rem" />
      <Skeleton width="90%" height="1rem" />
      <FormSkeleton fields={fields} />
      <Skeleton width="100%" height="2.85rem" radius="999px" />
    </div>
  );
}

export function PageSkeleton({
  tone = "site",
}: {
  tone?: "site" | "admin";
}) {
  if (tone === "site") return <LandingSkeleton />;

  return (
    <div
      className={[styles.page, styles.admin].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className={styles.heroBlock}>
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="70%" height="2.4rem" />
        <Skeleton width="55%" height="1rem" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.table} role="status" aria-label="Loading table">
      <div className={styles.tableHead}>
        <Skeleton height="0.85rem" />
        <Skeleton height="0.85rem" />
        <Skeleton height="0.85rem" />
        <Skeleton height="0.85rem" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" width="60%" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className={styles.form} role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className={styles.field}>
          <Skeleton width="35%" height="0.7rem" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.stats} role="status" aria-label="Loading stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton width="45%" height="0.65rem" />
          <Skeleton width="40%" height="1.8rem" />
          <Skeleton width="55%" height="0.7rem" />
        </div>
      ))}
    </div>
  );
}

export function MediaGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.mediaGrid} role="status" aria-label="Loading media">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.mediaCard}>
          <Skeleton height="9rem" />
          <Skeleton width="70%" height="0.75rem" />
          <Skeleton width="40%" height="0.65rem" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className={styles.chartRow} role="status" aria-label="Loading charts">
      <div className={styles.chartPanel}>
        <Skeleton width="40%" height="0.9rem" />
        <div className={styles.bars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.barRow}>
              <Skeleton width="4rem" height="0.7rem" />
              <Skeleton height="0.65rem" radius="999px" />
              <Skeleton width="2rem" height="0.7rem" />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.chartPanel}>
        <Skeleton width="45%" height="0.9rem" />
        <div className={styles.bars}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.barRow}>
              <Skeleton width="3rem" height="0.7rem" />
              <Skeleton height="0.65rem" radius="999px" />
              <Skeleton width="2rem" height="0.7rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CmsSkeleton({ sections = 4 }: { sections?: number }) {
  return (
    <div className={styles.cms} role="status" aria-label="Loading CMS">
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className={styles.cmsCard}>
          <Skeleton width="30%" height="1.1rem" />
          <Skeleton width="45%" height="0.7rem" />
          <FormSkeleton fields={3} />
          <Skeleton width="7rem" height="2.2rem" radius="0.5rem" />
        </div>
      ))}
    </div>
  );
}

/** Full admin chrome while session is verified. */
export function AdminBootSkeleton() {
  return (
    <div
      className={styles.adminBoot}
      role="status"
      aria-live="polite"
      aria-label="Loading admin"
    >
      <aside className={styles.adminSide}>
        <div className={styles.adminBrand}>
          <Skeleton width="2.5rem" height="2.5rem" radius="0.65rem" />
          <div className={styles.stack}>
            <Skeleton width="4rem" height="0.85rem" />
            <Skeleton width="3rem" height="0.6rem" />
          </div>
        </div>
        <div className={styles.adminNav}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} height="2.2rem" radius="0.55rem" />
          ))}
        </div>
      </aside>
      <main className={styles.adminMain}>
        <div className={styles.adminHeader}>
          <div className={styles.stack}>
            <Skeleton width="10rem" height="1.6rem" />
            <Skeleton width="18rem" height="0.85rem" />
          </div>
          <Skeleton width="6rem" height="2.2rem" radius="0.5rem" />
        </div>
        <StatsSkeleton count={5} />
        <TableSkeleton rows={6} />
      </main>
    </div>
  );
}

export function LoginSkeleton() {
  return (
    <div
      className={styles.loginPage}
      role="status"
      aria-live="polite"
      aria-label="Loading sign in"
    >
      <div className={styles.loginCard}>
        <div className={styles.row}>
          <Skeleton width="3.5rem" height="3.5rem" radius="0.75rem" />
          <div className={styles.stack} style={{ flex: 1 }}>
            <Skeleton width="55%" height="0.65rem" />
            <Skeleton width="35%" height="1.5rem" />
          </div>
        </div>
        <Skeleton width="90%" height="0.95rem" />
        <FormSkeleton fields={2} />
        <Skeleton width="100%" height="2.85rem" radius="999px" />
      </div>
    </div>
  );
}
