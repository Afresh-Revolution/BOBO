import styles from "./StatusBadge.module.scss";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  registered: "Registered",
  submitted: "Submitted",
  success: "Success",
  failed: "Failed",
  refunded: "Refunded",
  sent: "Sent",
  queued: "Queued",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status?.toLowerCase() || "pending";
  const tone = ["approved", "registered", "success", "sent"].includes(key)
    ? "good"
    : ["rejected", "failed"].includes(key)
      ? "bad"
      : ["pending", "queued", "submitted"].includes(key)
        ? "warn"
        : "neutral";

  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(" ");

  return <span className={classes}>{STATUS_LABELS[key] || status}</span>;
}
