import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";
import styles from "./Footer.module.scss";

const footerNav = [
  { href: "#about", label: "About" },
  { href: "#timeline", label: "Timeline" },
  { href: "#apply", label: "How to Apply" },
  { href: "#eligibility", label: "Eligibility" },
  { href: "#faq", label: "FAQ" },
];

export function Footer() {
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
          <Button href={siteConfig.links.apply} variant="gold" size="md">
            Apply Now
          </Button>
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
                <a href={siteConfig.links.cbrilliance} target="_blank" rel="noopener noreferrer">
                  CBrilliance
                </a>
              </li>
              <li>
                <a href={siteConfig.links.popin} target="_blank" rel="noopener noreferrer">
                  Popin Voting
                </a>
              </li>
              <li>
                <a href={siteConfig.links.cbc} target="_blank" rel="noopener noreferrer">
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
