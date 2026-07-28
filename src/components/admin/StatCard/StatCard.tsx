import type { ReactNode } from "react";
import styles from "./StatCard.module.scss";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "purple" | "gold" | "neutral";
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  accent = "neutral",
  icon,
}: StatCardProps) {
  return (
    <article className={`${styles.card} ${styles[accent]}`}>
      <div className={styles.top}>
        <p className={styles.label}>{label}</p>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <p className={styles.value}>{value}</p>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </article>
  );
}
