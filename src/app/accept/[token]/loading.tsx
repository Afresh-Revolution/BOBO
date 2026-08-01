import { PanelFormSkeleton } from "@/components/ui/Skeleton";
import styles from "./accept.module.scss";

export default function AcceptLoading() {
  return (
    <div className={styles.shell}>
      <div className={`container ${styles.inner}`}>
        <PanelFormSkeleton fields={4} />
      </div>
    </div>
  );
}
