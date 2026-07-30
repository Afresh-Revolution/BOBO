import Image from "next/image";
import Link from "next/link";
import { ApplyCta } from "@/components/ui/ApplyCta";
import { siteConfig } from "@/lib/content";
import styles from "./Footer.module.scss";

const footerNav = [
  { href: "#about", label: "About" },
  { href: "#timeline", label: "Timeline" },
  { href: "#apply", label: "How to Apply" },
  { href: "#eligibility", label: "Eligibility" },
  { href: "#faq", label: "FAQ" },
];

const socialLinks = [
  {
    href: siteConfig.links.tiktok,
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.68a8.2 8.2 0 0 0 4.76 1.52V6.74a4.85 4.85 0 0 1-1-.05z"
        />
      </svg>
    ),
  },
  {
    href: siteConfig.links.instagram,
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"
        />
      </svg>
    ),
  },
] as const;

type FooterProps = {
  applyLabel?: string;
  applyHref?: string | null;
};

export function Footer({
  applyLabel = "Apply Now",
  applyHref = siteConfig.links.apply,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className={styles.mark}
            />
            <span>{siteConfig.name}</span>
          </Link>
          <p className={styles.tagline}>{siteConfig.tagline}</p>
          <div className={styles.socials}>
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.social}
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
          <ApplyCta label={applyLabel} href={applyHref} variant="gold" size="md" />
        </div>

        <div className={styles.cols}>
          <div>
            <p className={styles.heading}>Explore</p>
            <ul>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.heading}>Ecosystem</p>
            <ul>
              <li>
                <a
                  href={siteConfig.links.cbrilliance}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CBrilliance
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.popin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Popin Voting
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.cbc}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CBC Nets
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          © {year}{" "}
          <Link href="/admin" className={styles.adminLink}>
            {siteConfig.fullName}
          </Link>
          . All rights reserved.
        </p>
        <p className={styles.credit}>
          Built by{" "}
          <a
            href="https://william-lac.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.creditLink}
          >
            William
          </a>
          , Afresh
        </p>
        <p className={styles.note}>Voting lives on PopIn. Registration via CBC.</p>
      </div>
    </footer>
  );
}
