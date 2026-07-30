"use client";

import { useState } from "react";
import { AdminButton, AdminShell } from "@/components/admin";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { adminFetch, unwrapList } from "@/lib/admin-api";
import type { SiteSetting } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import styles from "../admin.module.scss";

const FALLBACK: SiteSetting[] = [
  {
    key: "applications_open",
    label: "Applications open",
    value: false,
    type: "boolean",
  },
  {
    key: "applications_open_date",
    label: "Applications open date",
    value: "2026-08-01",
    type: "date",
  },
  {
    key: "applications_close_date",
    label: "Applications close date",
    value: "2026-10-31",
    type: "date",
  },
  {
    key: "registration_fee",
    label: "Registration fee (NGN)",
    value: 150000,
    type: "number",
  },
  {
    key: "registration_fee_cbc",
    label: "Registration fee (CBC)",
    value: 5,
    type: "number",
  },
  {
    key: "support_email",
    label: "Support email",
    value: "",
    type: "text",
  },
  {
    key: "announcement",
    label: "Site announcement",
    value: "",
    type: "textarea",
  },
];

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const { data, loading, error, setData, reload } = useAdminResource({
    initial: FALLBACK,
    load: async () => {
      const res = await adminFetch("/api/admin/settings");
      const list = unwrapList<SiteSetting>(res as never);
      return list.length ? list : FALLBACK;
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load settings",
  });

  const settings = data ?? FALLBACK;

  function updateValue(key: string, value: string | boolean | number) {
    setData((prev) =>
      (prev ?? FALLBACK).map((s) => (s.key === key ? { ...s, value } : s)),
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setLocalError(null);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: { settings },
      });
      setMessage("Settings saved — live site updated.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Settings"
      description="Season switches, fees, and operational config."
      actions={
        <div className={styles.rowActions}>
          <AdminButton variant="secondary" size="sm" onClick={reload}>
            Reload
          </AdminButton>
          <AdminButton
            variant="gold"
            size="sm"
            loading={saving}
            onClick={() => void save()}
          >
            Save changes
          </AdminButton>
        </div>
      }
    >
      {error || localError ? (
        <p className={styles.error}>{localError || error}</p>
      ) : null}
      {message ? <p className={styles.muted}>{message}</p> : null}

      {loading ? (
        <div className={styles.panel}>
          <FormSkeleton fields={7} />
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.fieldGrid}>
            {settings.map((setting) => {
              const type = setting.type || "text";
              return (
                <label key={setting.key} className={styles.field}>
                  <span>{setting.label || setting.key}</span>
                  {type === "boolean" ? (
                    <select
                      className={styles.select}
                      value={String(Boolean(setting.value))}
                      onChange={(e) =>
                        updateValue(setting.key, e.target.value === "true")
                      }
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : type === "textarea" ? (
                    <textarea
                      className={styles.textarea}
                      value={String(setting.value ?? "")}
                      onChange={(e) => updateValue(setting.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className={styles.input}
                      type={
                        type === "number"
                          ? "number"
                          : type === "date"
                            ? "date"
                            : "text"
                      }
                      value={String(setting.value ?? "")}
                      onChange={(e) =>
                        updateValue(
                          setting.key,
                          type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
