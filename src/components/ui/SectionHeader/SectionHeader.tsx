import styles from "./SectionHeader.module.scss";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
}: SectionHeaderProps) {
  return (
    <header
      className={[styles.header, styles[align], styles[tone]].join(" ")}
    >
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={styles.title}>{title}</h2>
      <hr className={styles.rule} aria-hidden />
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}
