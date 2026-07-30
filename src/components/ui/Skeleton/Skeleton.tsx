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

export function PageSkeleton({
  tone = "site",
}: {
  tone?: "site" | "admin";
}) {
  return (
    <div
      className={[styles.page, tone === "admin" ? styles.admin : styles.site].join(
        " ",
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className={styles.heroBlock}>
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="70%" height="2.4rem" />
        <Skeleton width="55%" height="1rem" />
        <div className={styles.row}>
          <Skeleton width="8rem" height="2.75rem" radius="999px" />
          <Skeleton width="8rem" height="2.75rem" radius="999px" />
        </div>
      </div>
      <div className={styles.grid}>
        <Skeleton height="8rem" />
        <Skeleton height="8rem" />
        <Skeleton height="8rem" />
      </div>
      <div className={styles.stack}>
        <Skeleton width="30%" height="0.85rem" />
        <Skeleton height="1.1rem" />
        <Skeleton height="1.1rem" />
        <Skeleton width="80%" height="1.1rem" />
      </div>
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
