"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { AdminUser } from "@/lib/admin-types";
import { AdminButton } from "../AdminButton";
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
    return (
      <div className={styles.boot}>
        <p>Verifying session…</p>
      </div>
    );
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
        <header className={styles.topbar}>
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
    </div>
  );
}
