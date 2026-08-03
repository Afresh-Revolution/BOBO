"use client";

import { useId, useRef, useState } from "react";
import { UploadError, uploadToCloudinary } from "@/lib/upload-client";
import styles from "../AdminImageUpload/AdminImageUpload.module.scss";

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg";
const MAX_BYTES = 5 * 1024 * 1024;
const CONCURRENCY = 3;

type AdminMultiImageUploadProps = {
  label?: string;
  disabled?: boolean;
  /** Called after all valid files finish uploading (Cloudinary URLs). */
  onUploaded: (urls: string[]) => void | Promise<void>;
};

function isAllowedImage(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.name.toLowerCase().endsWith(".svg")
  );
}

export function AdminMultiImageUpload({
  label = "Images",
  disabled,
  onUploaded,
}: AdminMultiImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);

    const files = Array.from(fileList);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of files) {
      if (!isAllowedImage(file)) {
        rejected.push(`${file.name}: not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name}: over 5MB`);
        continue;
      }
      accepted.push(file);
    }

    if (!accepted.length) {
      setError(rejected[0] || "No valid images selected.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    setProgress({ done: 0, total: accepted.length });

    const urls: string[] = [];
    let cursor = 0;
    let completed = 0;

    async function worker() {
      while (cursor < accepted.length) {
        const index = cursor;
        cursor += 1;
        const file = accepted[index];
        try {
          const asset = await uploadToCloudinary(file, "adminMedia");
          urls.push(asset.url);
        } catch (err) {
          const message =
            err instanceof UploadError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Upload failed";
          rejected.push(`${file.name}: ${message}`);
        } finally {
          completed += 1;
          setProgress({ done: completed, total: accepted.length });
        }
      }
    }

    try {
      const workers = Array.from(
        { length: Math.min(CONCURRENCY, accepted.length) },
        () => worker(),
      );
      await Promise.all(workers);

      if (urls.length) {
        await onUploaded(urls);
      }

      if (rejected.length && !urls.length) {
        setError(rejected.slice(0, 3).join(" · "));
      } else if (rejected.length) {
        setError(
          `Uploaded ${urls.length}. Skipped ${rejected.length}: ${rejected.slice(0, 2).join(" · ")}`,
        );
      }
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>

      <label
        className={[
          styles.drop,
          disabled || uploading ? styles.disabled : "",
        ]
          .filter(Boolean)
          .join(" ")}
        htmlFor={inputId}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple={true}
          className={styles.input}
          disabled={disabled || uploading}
          onChange={(e) => void handleFiles(e.target.files)}
        />

        <span className={styles.cta}>
          {uploading && progress
            ? `Uploading… ${progress.done}/${progress.total}`
            : "Click to choose images"}
        </span>
        <span className={styles.meta}>
          Multi-select enabled · Ctrl/Cmd+click or Shift+click · JPG/PNG/WEBP/SVG ·
          max 5MB each
        </span>
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
