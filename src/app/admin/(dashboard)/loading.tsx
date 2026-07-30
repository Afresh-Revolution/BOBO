import { FormSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import styles from "./admin.module.scss";

export default function AdminLoading() {
  return (
    <div className={styles.loadingShell} role="status" aria-label="Loading admin">
      <div className={styles.loadingHeader}>
        <div className={styles.loadingTitle}>
          <span className={styles.loadingBone} style={{ width: "28%", height: "1.6rem" }} />
          <span className={styles.loadingBone} style={{ width: "48%", height: "0.85rem" }} />
        </div>
      </div>
      <div className={styles.toolbar}>
        <span className={styles.loadingBone} style={{ flex: 1, height: "2.5rem" }} />
        <span className={styles.loadingBone} style={{ width: "7rem", height: "2.5rem" }} />
      </div>
      <TableSkeleton rows={7} />
      <div style={{ marginTop: "1.25rem" }}>
        <FormSkeleton fields={3} />
      </div>
    </div>
  );
}
