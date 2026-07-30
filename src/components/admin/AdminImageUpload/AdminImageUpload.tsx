"use client";

import { useId, useRef, useState } from "react";
import { AdminButton } from "@/components/admin";
import { UploadError, uploadToCloudinary } from "@/lib/upload-client";
import styles from "./AdminImageUpload.module.scss";

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg";
const MAX_BYTES = 5 * 1024 * 1024;

type AdminImageUploadProps = {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  disabled?: boolean;
};

export function AdminImageUpload({
  value,
  onChange,
  label = "Image (optional)",
  disabled,
}: AdminImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
      setError("Please choose an image file (JPG, PNG, WEBP, or SVG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    setPercent(0);
    try {
      const asset = await uploadToCloudinary(file, "adminMedia", (p) => {
        setPercent(p.percent);
      });
      onChange(asset.url);
      setPercent(null);
    } catch (err) {
      const message =
        err instanceof UploadError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>

      <label
        className={[
          styles.drop,
          value ? styles.hasPreview : "",
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
          className={styles.input}
          disabled={disabled || uploading}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={styles.preview} />
        ) : null}

        <span className={styles.cta}>
          {uploading
            ? `Uploading… ${percent ?? 0}%`
            : value
              ? "Click to replace"
              : "Click to upload"}
        </span>
        <span className={styles.meta}>JPG, PNG, WEBP, or SVG · max 5MB</span>
      </label>

      {value ? (
        <div className={styles.actions}>
          <AdminButton
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || uploading}
            onClick={() => {
              setError(null);
              onChange(null);
            }}
          >
            Remove
          </AdminButton>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
