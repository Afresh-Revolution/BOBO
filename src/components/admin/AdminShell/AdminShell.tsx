"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { AdminUser } from "@/lib/admin-types";
import { AdminButton } from "../AdminButton";
import { AdminBootSkeleton } from "@/components/ui/Skeleton";
import styles from "./AdminShell.module.scss";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/contestants", label: "Contestants" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/cms", label: "CMS" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/admins", label: "Admins" },
] as const;

type AdminShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminShell({
  children,
  title,
  description,
  actions,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [topbarRevealed, setTopbarRevealed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const me = await adminFetch<{ ok?: boolean; admin?: AdminUser }>(
            "/api/auth/me",
          );
          if (cancelled) return;
          if (!me.admin) {
            router.replace("/admin/login");
            return;
          }
          setAdmin(me.admin);
        } catch {
          if (!cancelled) router.replace("/admin/login");
        } finally {
          if (!cancelled) setChecking(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const prev = lastScrollY.current;
      const scrollingDown = y > prev;

      // Solid sticky bar once past the top; keep it revealed while scrolling down
      // or while already past the threshold. Hide the elevated state near the top.
      if (y < 24) {
        setTopbarRevealed(false);
      } else if (scrollingDown || y > 80) {
        setTopbarRevealed(true);
      }

      setShowScrollTop(y > 480);
      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reset scroll UI when navigating between admin pages
  useEffect(() => {
    setTopbarRevealed(false);
    setShowScrollTop(false);
    lastScrollY.current = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Still leave the shell if logout endpoint is unavailable.
    } finally {
      router.replace("/admin/login");
      setLoggingOut(false);
    }
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (checking) {
    return <AdminBootSkeleton />;
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${navOpen ? styles.open : ""}`}>
        <div className={styles.brand}>
          <Image
            src="/logo.png"
            alt="BOBO"
            width={40}
            height={40}
            className={styles.logo}
          />
          <div>
            <p className={styles.brandName}>BOBO</p>
            <p className={styles.brandSub}>Admin</p>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${
                isActive(item.href, "exact" in item && item.exact)
                  ? styles.active
                  : ""
              }`}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <p className={styles.userEmail}>{admin?.email || "Admin"}</p>
          <AdminButton
            variant="ghost"
            size="sm"
            loading={loggingOut}
            onClick={handleLogout}
          >
            Sign out
          </AdminButton>
        </div>
      </aside>

      {navOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <div className={styles.main}>
        <header
          className={[
            styles.topbar,
            topbarRevealed ? styles.topbarRevealed : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className={styles.heading}>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
        <div className={styles.content}>{children}</div>
      </div>

      <button
        type="button"
        className={[styles.scrollTop, showScrollTop ? styles.scrollTopVisible : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
          <path
            d="M12 5v14M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
