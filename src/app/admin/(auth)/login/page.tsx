"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AdminButton } from "@/components/admin";
import { adminFetch } from "@/lib/admin-api";
import styles from "./login.module.scss";

function safeAdminNextPath() {
  if (typeof window === "undefined") return "/admin";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("/admin/login")) {
    return "/admin";
  }
  return raw;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await adminFetch<{ ok?: boolean; admin?: unknown }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // Hard navigate so the Set-Cookie from login is included on the first
      // /admin request. Soft router.replace can race and bounce back to login.
      window.location.assign(safeAdminNextPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to site
      </Link>

      <div className={styles.panel}>
        <div className={styles.brand}>
          <Image src="/logo.png" alt="BOBO" width={56} height={56} />
          <div>
            <p className={styles.eyebrow}>Battle Of Baddies On</p>
            <h1>Admin</h1>
          </div>
        </div>

        <p className={styles.copy}>
          Sign in to review applications, manage contestants, and run the season.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@boboreality.com"
              disabled={loading}
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7a11.6 11.6 0 0 1-4 4.9M6.1 6.1A11.5 11.5 0 0 0 1 12c1.7 3.9 6 7 11 7 1.4 0 2.7-.2 3.9-.7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                    <path
                      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          <AdminButton type="submit" variant="gold" loading={loading}>
            Sign in
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
