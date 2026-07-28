"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { AdminButton } from "../AdminButton";
import styles from "./ConfirmDialog.module.scss";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

export type ConfirmAsk = (
  options: ConfirmOptions | string,
) => Promise<boolean>;

type Pending = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<ConfirmAsk | null>(null);

function normalizeOptions(input: ConfirmOptions | string): ConfirmOptions {
  if (typeof input === "string") {
    return {
      title: "Confirm",
      message: input,
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      tone: "danger",
    };
  }
  return {
    title: input.title ?? "Confirm",
    message: input.message,
    confirmLabel: input.confirmLabel ?? "Confirm",
    cancelLabel: input.cancelLabel ?? "Cancel",
    tone: input.tone ?? "danger",
  };
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const titleId = useId();
  const descId = useId();

  const ask = useCallback<ConfirmAsk>((input) => {
    const options = normalizeOptions(input);
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [pending, close]);

  const options = pending?.options;

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {options ? (
        <div className={styles.root} role="presentation">
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Dismiss"
            onClick={() => close(false)}
          />
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <h2 id={titleId} className={styles.title}>
              {options.title}
            </h2>
            <p id={descId} className={styles.message}>
              {options.message}
            </p>
            <div className={styles.actions}>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => close(false)}
              >
                {options.cancelLabel}
              </AdminButton>
              <AdminButton
                variant={options.tone === "default" ? "primary" : "danger"}
                size="sm"
                autoFocus
                onClick={() => close(true)}
              >
                {options.confirmLabel}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmAsk {
  const ask = useContext(ConfirmContext);
  if (!ask) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ask;
}
