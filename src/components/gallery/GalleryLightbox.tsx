"use client";

import { useEffect, useId, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./GalleryLightbox.module.scss";

export type LightboxImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
  alt: string | null;
};

type GalleryLightboxProps = {
  images: LightboxImage[];
  index: number | null;
  albumTitle?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

function downloadFilename(url: string, fallback: string) {
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").pop() || fallback;
    return base.includes(".") ? base : `${fallback}.jpg`;
  } catch {
    return `${fallback}.jpg`;
  }
}

function attachmentUrl(url: string, filename: string) {
  if (!url.includes("/upload/")) return url;
  const safe = filename.replace(/[^\w.\-]+/g, "_");
  return url.replace("/upload/", `/upload/fl_attachment:${safe}/`);
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v12m0 0l-4-4m4 4l4-4M5 19h14"
      />
    </svg>
  );
}

function IconChevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
      />
    </svg>
  );
}

export function GalleryLightbox({
  images,
  index,
  albumTitle = "gallery",
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const titleId = useId();
  const open = index != null && index >= 0 && index < images.length;
  const current = open ? images[index] : null;
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goPrev = useCallback(() => {
    if (index == null || !images.length) return;
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (index == null || !images.length) return;
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, goPrev, goNext]);

  async function handleDownload() {
    if (!current) return;
    setDownloading(true);
    const name = downloadFilename(
      current.imageUrl,
      current.caption || albumTitle || "bobo-gallery",
    );
    try {
      const res = await fetch(current.imageUrl);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const a = document.createElement("a");
      a.href = attachmentUrl(current.imageUrl, name);
      a.download = name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && current ? (
        <motion.div
          className={styles.root}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close image"
            onClick={onClose}
          />

          <div className={styles.shell}>
            {images.length > 1 ? (
              <button
                type="button"
                className={styles.nav}
                aria-label="Previous image"
                onClick={goPrev}
              >
                <IconChevron dir="prev" />
              </button>
            ) : null}

            <div className={styles.frame}>
              <span className={styles.count} aria-live="polite">
                {index! + 1} / {images.length}
              </span>

              <div className={styles.cornerActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={downloading ? "Downloading" : "Download image"}
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                >
                  <IconDownload />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Close"
                  onClick={onClose}
                >
                  <IconClose />
                </button>
              </div>

              <motion.img
                key={current.id}
                id={titleId}
                src={current.imageUrl}
                alt={current.alt || current.caption || albumTitle}
                className={styles.full}
                initial={{ opacity: 0.45, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              />

              {current.caption ? (
                <p className={styles.caption}>{current.caption}</p>
              ) : null}
            </div>

            {images.length > 1 ? (
              <button
                type="button"
                className={[styles.nav, styles.navNext].join(" ")}
                aria-label="Next image"
                onClick={goNext}
              >
                <IconChevron dir="next" />
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
