"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  registrationFee,
  registrationFeeBuyInstruction,
  siteConfig,
} from "@/lib/content";
import { uploadToCloudinary } from "@/lib/upload-client";
import { PanelFormSkeleton } from "@/components/ui/Skeleton";
import styles from "./accept.module.scss";

type AcceptStatus =
  | "loading"
  | "valid"
  | "expired"
  | "used"
  | "invalid"
  | "registered"
  | "payment_pending";

type AcceptPayload = {
  status?: AcceptStatus | string;
  message?: string;
  error?: string;
  applicantName?: string;
  fullName?: string;
  email?: string;
  expiresAt?: string;
  paymentStatus?: "unpaid" | "pending" | "paid" | string;
  registered?: boolean;
  guidelines?: string[];
};

const DEFAULT_GUIDELINES = [
  "Keep your registration link private. It is single-use and expires in 48 hours.",
  "Do not share this page. Anyone with the link could submit in your place before you do.",
  registrationFeeBuyInstruction(),
  "Stay reachable on the email used for your application.",
  "Follow all show conduct rules shared by the BOBO production team.",
];

const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
const ease = [0.16, 1, 0.3, 1] as const;

function normalizeStatus(raw: AcceptPayload): AcceptStatus {
  if (raw.registered || raw.paymentStatus === "paid") return "registered";
  if (raw.paymentStatus === "pending") return "payment_pending";

  const s = (raw.status || "").toLowerCase();
  if (s === "expired" || s === "link_expired") return "expired";
  if (s === "used" || s === "consumed" || s === "already_used") return "used";
  if (s === "invalid" || s === "not_found" || s === "forbidden") return "invalid";
  if (s === "registered" || s === "paid") return "registered";
  if (s === "payment_pending" || s === "pending") return "payment_pending";
  if (s === "valid" || s === "ok" || s === "approved" || s === "accepted") {
    return "valid";
  }
  if (raw.expiresAt) return "valid";
  return "invalid";
}

function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return useMemo(() => {
    if (!expiresAt) return null;
    const end = new Date(expiresAt).getTime();
    if (Number.isNaN(end)) return null;
    const diff = Math.max(0, end - now);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      expired: diff <= 0,
      hours,
      minutes,
      seconds,
      label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    };
  }, [expiresAt, now]);
}

export function AcceptClient() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [state, setState] = useState<AcceptStatus>("loading");
  const [data, setData] = useState<AcceptPayload | null>(null);
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAccept() {
      if (!token) {
        if (!cancelled) setState("invalid");
        return;
      }

      try {
        const res = await fetch(`/api/accept/${encodeURIComponent(token)}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await res.json().catch(() => ({}))) as AcceptPayload;

        if (cancelled) return;

        if (res.status === 410) {
          setData(payload);
          setState("expired");
          return;
        }
        if (res.status === 409) {
          setData(payload);
          setState("used");
          return;
        }
        if (!res.ok) {
          setData(payload);
          setState("invalid");
          return;
        }

        setData(payload);
        setFullName(payload.fullName || payload.applicantName || "");
        setState(normalizeStatus(payload));
      } catch {
        if (!cancelled) setState("invalid");
      }
    }

    void fetchAccept();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const countdown = useCountdown(data?.expiresAt);
  const name = data?.applicantName || data?.fullName || "Contestant";
  const guidelines = data?.guidelines?.length
    ? data.guidelines
    : DEFAULT_GUIDELINES;

  const formLocked =
    submitting ||
    state === "registered" ||
    state === "payment_pending" ||
    Boolean(countdown?.expired);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || formLocked) return;

    setConfirmError(null);
    setConfirmNote(null);

    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setConfirmError("Enter your full name.");
      return;
    }
    if (!receiptFile) {
      setConfirmError("Upload a screenshot of your CBC purchase receipt.");
      return;
    }
    if (receiptFile.size > RECEIPT_MAX_BYTES) {
      setConfirmError("Receipt must be 10MB or smaller.");
      return;
    }

    setSubmitting(true);
    setUploadPercent(0);

    try {
      const receipt = await uploadToCloudinary(
        receiptFile,
        "cbcReceipt",
        (p) => setUploadPercent(p.percent),
        { token },
      );

      const res = await fetch(
        `/api/accept/${encodeURIComponent(token)}/confirm-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: trimmed,
            receipt,
            website,
          }),
        },
      );
      const payload = (await res.json().catch(() => ({}))) as AcceptPayload & {
        message?: string;
      };

      if (!res.ok) {
        throw new Error(
          payload.error ||
            payload.message ||
            "Could not submit registration. Try again or contact support.",
        );
      }

      setConfirmNote(
        payload.message ||
          "Submitted. The BOBO team will verify your CBC receipt shortly.",
      );
      setData((prev) => ({ ...prev, ...payload }));
      setState(
        normalizeStatus({
          ...data,
          ...payload,
          paymentStatus: payload.paymentStatus || "pending",
          status: payload.status || "payment_pending",
        }),
      );
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : "Registration submission failed.",
      );
    } finally {
      setSubmitting(false);
      setUploadPercent(null);
    }
  }

  if (state === "loading") {
    return (
      <div className={styles.shell}>
        <div className={`container ${styles.inner}`}>
          <PanelFormSkeleton fields={4} />
        </div>
      </div>
    );
  }

  if (state === "expired" || state === "used" || state === "invalid") {
    const copy =
      state === "expired"
        ? {
            title: "This link has expired.",
            body: "Acceptance links are valid for 48 hours and cannot be reused after expiry. Contact the BOBO team if you still need access.",
          }
        : state === "used"
          ? {
              title: "This link has already been used.",
              body: "This private registration link is single-use and cannot be shared. If you already submitted, wait for verification email.",
            }
          : {
              title: "Access denied.",
              body: "This acceptance link is invalid or no longer available. Only approved applicants can open this private registration form from their email.",
            };

    return (
      <div className={styles.shell}>
        <div className={styles.deniedGlow} aria-hidden />
        <div className={`container ${styles.inner}`}>
          <motion.div
            className={styles.denied}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <p className={styles.eyebrow}>Secure link</p>
            <h1>{copy.title}</h1>
            <p className={styles.copy}>{copy.body}</p>
            {data?.message || data?.error ? (
              <p className={styles.note}>{data.message || data.error}</p>
            ) : null}
            <div className={styles.actions}>
              <Button href="/" variant="gold" size="lg">
                Return Home
              </Button>
              <Link href="/apply" className={styles.back}>
                Apply portal →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const statusLabel =
    state === "registered"
      ? "Registered"
      : state === "payment_pending"
        ? "Receipt under review"
        : "Accepted: complete form";

  return (
    <div className={styles.shell}>
      <div className={styles.glow} aria-hidden />
      <div className={`container ${styles.inner}`}>
        <motion.header
          className={styles.hero}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <p className={styles.eyebrow}>You&apos;re in</p>
          <h1>
            Welcome, <span>{name}</span>.
          </h1>
          <p className={styles.copy}>
            Your application has been accepted. Complete this private
            registration form within 48 hours. The link is single-use and cannot
            be shared.
          </p>
          <div className={styles.statusRow}>
            <span className={styles.statusChip}>{statusLabel}</span>
            {countdown && !countdown.expired ? (
              <span className={styles.countdown} aria-live="polite">
                Link expires in <strong>{countdown.label}</strong>
              </span>
            ) : countdown?.expired ? (
              <span className={styles.countdownWarn}>Link window closed</span>
            ) : null}
          </div>
        </motion.header>

        <motion.section
          className={styles.panel}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
        >
          <h2>Contestant guidelines</h2>
          <ul className={styles.guidelines}>
            {guidelines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          className={styles.pay}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease }}
        >
          <div className={styles.payHead}>
            <h2>Registration form</h2>
            <p>
              Fee · <strong>{registrationFee.label}</strong>{" "}
              <span>(approx. {registrationFee.approxLabel})</span>
            </p>
          </div>
          <p className={styles.payCopy}>
            Purchase CBC on CBC Nets, then submit your full name and a screenshot
            of the purchase receipt. Our team verifies before confirming your
            place.
          </p>

          <div className={styles.actions}>
            <Button
              href={siteConfig.links.cbc}
              external
              variant="secondary"
              size="lg"
            >
              Buy CBC on cbcnets.com
            </Button>
          </div>

          {state === "valid" ? (
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <div className={styles.hp} aria-hidden="true">
                <label htmlFor="company-website">Website</label>
                <input
                  id="company-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <label className={styles.field}>
                <span>Full name</span>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  required
                  value={fullName}
                  disabled={formLocked}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As it should appear on registration"
                />
              </label>

              <label className={styles.field}>
                <span>CBC purchase receipt (screenshot)</span>
                <input
                  type="file"
                  name="receipt"
                  accept={RECEIPT_ACCEPT}
                  required
                  disabled={formLocked}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setReceiptFile(file);
                  }}
                />
                <span className={styles.hint}>
                  JPG, PNG, WEBP, or PDF · max 10MB
                  {receiptFile ? ` · selected: ${receiptFile.name}` : ""}
                </span>
              </label>

              {uploadPercent != null ? (
                <p className={styles.note} aria-live="polite">
                  Uploading receipt… {uploadPercent}%
                </p>
              ) : null}

              <div className={styles.actions}>
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  disabled={formLocked}
                >
                  {submitting ? "Submitting…" : "Submit registration"}
                </Button>
              </div>
            </form>
          ) : null}

          {state === "payment_pending" || state === "registered" ? (
            <p className={styles.successNote} role="status">
              {state === "registered"
                ? "You are registered. Watch your email for next steps."
                : confirmNote ||
                  "Your receipt is under review. This link is now closed."}
            </p>
          ) : null}

          {confirmNote && state === "valid" ? (
            <p className={styles.successNote} role="status">
              {confirmNote}
            </p>
          ) : null}
          {confirmError ? (
            <p className={styles.error} role="alert">
              {confirmError}
            </p>
          ) : null}
        </motion.section>
      </div>
    </div>
  );
}
