"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";
import { uploadApplicationMedia, UploadError } from "@/lib/upload-client";
import {
  applicationFormSchema,
  type ApplicationFormInput,
  BLOOD_GROUPS,
  ELIGIBILITY_ITEMS,
  ENTRY_VIDEO_PROMPTS,
  GENOTYPES,
  VIDEO_MAX_BYTES,
} from "@/lib/validations/application";
import styles from "./apply.module.scss";

type Step = "eligibility" | "form" | "success";

const ease = [0.16, 1, 0.3, 1] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ApplyFlow() {
  const [step, setStep] = useState<Step>("eligibility");
  const [checks, setChecks] = useState<Record<string, boolean>>({
    cbrilliance: false,
    followers: false,
    nigerian: false,
    ageRange: false,
  });
  const [acknowledged, setAcknowledged] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    birthCertificate: number;
    entryVideo: number;
  }>({ birthCertificate: 0, entryVideo: 0 });
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const allChecked = useMemo(
    () => ELIGIBILITY_ITEMS.every((item) => checks[item.key]),
    [checks],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      motherMaidenName: "",
      nin: "",
      tiktokUrl: "",
      instagramUrl: "",
      xUrl: "",
      facebookUrl: "",
      historyOfAilments: "",
      currentHealthChallenge: "",
    },
  });

  const birthFile = useWatch({ control, name: "birthCertificate" });
  const videoFile = useWatch({ control, name: "entryVideo" });
  const promptChoice = useWatch({ control, name: "promptChoice" });

  function continueFromEligibility() {
    if (!allChecked) {
      setEligibilityError("Check every eligibility requirement to continue.");
      return;
    }
    if (!acknowledged) {
      setEligibilityError(
        "Acknowledge that you meet all criteria before continuing.",
      );
      return;
    }
    setEligibilityError(null);
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: ApplicationFormInput) {
    setSubmitError(null);
    setUploading(true);
    setUploadProgress({ birthCertificate: 0, entryVideo: 0 });

    try {
      const media = await uploadApplicationMedia({
        birthCertificate: values.birthCertificate,
        entryVideo: values.entryVideo,
        onProgress: (kind, progress) => {
          setUploadProgress((prev) => ({ ...prev, [kind]: progress.percent }));
        },
      });

      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        age: values.age,
        motherMaidenName: values.motherMaidenName,
        nin: values.nin,
        tiktokUrl: values.tiktokUrl,
        instagramUrl: values.instagramUrl,
        xUrl: values.xUrl,
        facebookUrl: values.facebookUrl,
        bloodGroup: values.bloodGroup,
        genotype: values.genotype,
        historyOfAilments: values.historyOfAilments,
        currentHealthChallenge: values.currentHealthChallenge,
        promptChoice: values.promptChoice,
        birthCertificate: media.birthCertificate,
        entryVideo: media.entryVideo,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        id?: string;
        reference?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Application could not be submitted.",
        );
      }

      setReferenceId(data.reference || data.id || null);
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message =
        err instanceof UploadError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
      setSubmitError(message);
    } finally {
      setUploading(false);
    }
  }

  const busy = isSubmitting || uploading;

  return (
    <div className={styles.shell}>
      <div className={styles.glow} aria-hidden />
      <div className={`container ${styles.inner}`}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Apply · BOBO</p>
          <h1>Claim your place among the Baddies.</h1>
          <p className={styles.lede}>
            Portal open {siteConfig.show.portalOpens} to{" "}
            {siteConfig.show.portalCloses}. Confirm eligibility, then submit your
            details and entry video.
          </p>
        </header>

        {step !== "success" ? (
          <ol className={styles.steps} aria-label="Application steps">
            <li
              className={[
                styles.stepPill,
                step === "eligibility" ? styles.stepActive : "",
                step === "form" ? styles.stepDone : "",
              ].join(" ")}
            >
              <span>01</span> Eligibility
            </li>
            <li
              className={[
                styles.stepPill,
                step === "form" ? styles.stepActive : "",
              ].join(" ")}
            >
              <span>02</span> Submission
            </li>
          </ol>
        ) : null}

        <AnimatePresence mode="wait">
          {step === "eligibility" ? (
            <motion.section
              key="eligibility"
              className={styles.panel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease }}
            >
              <div className={styles.panelHead}>
                <h2>Eligibility checklist</h2>
                <p>You must satisfy every requirement before the form unlocks.</p>
              </div>

              <ul className={styles.checkList}>
                {ELIGIBILITY_ITEMS.map((item) => {
                  const id = `elig-${item.key}`;
                  const checked = checks[item.key];
                  return (
                    <li key={item.key}>
                      <label
                        htmlFor={id}
                        className={[
                          styles.checkItem,
                          checked ? styles.checkOn : "",
                        ].join(" ")}
                      >
                        <input
                          id={id}
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setChecks((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }));
                            setEligibilityError(null);
                          }}
                        />
                        <span className={styles.box} aria-hidden>
                          {checked ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                              <path
                                d="M5 12.5l4.2 4.2L19 7"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                        <span>{item.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <label
                htmlFor="ack"
                className={[
                  styles.ack,
                  acknowledged ? styles.ackOn : "",
                ].join(" ")}
              >
                <input
                  id="ack"
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => {
                    setAcknowledged(e.target.checked);
                    setEligibilityError(null);
                  }}
                />
                <span>
                  I acknowledge that I meet all eligibility criteria and that
                  incomplete or false information may disqualify my application.
                </span>
              </label>

              {eligibilityError ? (
                <p className={styles.error} role="alert">
                  {eligibilityError}
                </p>
              ) : null}

              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  onClick={continueFromEligibility}
                  disabled={!allChecked || !acknowledged}
                >
                  Continue to Form
                </Button>
                <Link href="/" className={styles.back}>
                  ← Back to home
                </Link>
              </div>
            </motion.section>
          ) : null}

          {step === "form" ? (
            <motion.section
              key="form"
              className={styles.panel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease }}
            >
              <div className={styles.panelHead}>
                <h2>Contestant submission</h2>
                <p>
                  Complete every field. Your entry video must be uploaded
                  directly. Links are not accepted.
                </p>
              </div>

              <form
                className={styles.form}
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <fieldset className={styles.fieldset} disabled={busy}>
                  <legend>Profile</legend>
                  <div className={styles.grid}>
                    <Field
                      label="Full name"
                      error={errors.fullName?.message}
                      htmlFor="fullName"
                    >
                      <input
                        id="fullName"
                        autoComplete="name"
                        {...register("fullName")}
                      />
                    </Field>
                    <Field
                      label="Email"
                      error={errors.email?.message}
                      htmlFor="email"
                    >
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                      />
                    </Field>
                    <Field
                      label="Phone number"
                      error={errors.phone?.message}
                      htmlFor="phone"
                      hint="Nigerian number, e.g. 0803… or +234…"
                    >
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        {...register("phone")}
                      />
                    </Field>
                    <Field label="Age" error={errors.age?.message} htmlFor="age">
                      <input
                        id="age"
                        type="number"
                        min={18}
                        max={38}
                        inputMode="numeric"
                        {...register("age", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field
                      label="Mother's maiden name"
                      error={errors.motherMaidenName?.message}
                      htmlFor="motherMaidenName"
                    >
                      <input
                        id="motherMaidenName"
                        {...register("motherMaidenName")}
                      />
                    </Field>
                    <Field
                      label="NIN"
                      error={errors.nin?.message}
                      htmlFor="nin"
                      hint="11 digits"
                    >
                      <input
                        id="nin"
                        inputMode="numeric"
                        maxLength={11}
                        {...register("nin")}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className={styles.fieldset} disabled={busy}>
                  <legend>Social media</legend>
                  <p className={styles.hint}>
                    Paste profile links. At least two are required.
                  </p>
                  <div className={styles.grid}>
                    <Field
                      label="TikTok"
                      error={errors.tiktokUrl?.message}
                      htmlFor="tiktokUrl"
                      hint="Optional if you fill two others"
                    >
                      <input
                        id="tiktokUrl"
                        type="url"
                        inputMode="url"
                        placeholder="https://www.tiktok.com/@username"
                        {...register("tiktokUrl")}
                      />
                    </Field>
                    <Field
                      label="Instagram"
                      error={errors.instagramUrl?.message}
                      htmlFor="instagramUrl"
                    >
                      <input
                        id="instagramUrl"
                        type="url"
                        inputMode="url"
                        placeholder="https://www.instagram.com/username"
                        {...register("instagramUrl")}
                      />
                    </Field>
                    <Field
                      label="X"
                      error={errors.xUrl?.message}
                      htmlFor="xUrl"
                    >
                      <input
                        id="xUrl"
                        type="url"
                        inputMode="url"
                        placeholder="https://x.com/username"
                        {...register("xUrl")}
                      />
                    </Field>
                    <Field
                      label="Facebook"
                      error={errors.facebookUrl?.message}
                      htmlFor="facebookUrl"
                    >
                      <input
                        id="facebookUrl"
                        type="url"
                        inputMode="url"
                        placeholder="https://www.facebook.com/username"
                        {...register("facebookUrl")}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className={styles.fieldset} disabled={busy}>
                  <legend>Health</legend>
                  <div className={styles.grid}>
                    <Field
                      label="Blood group"
                      error={errors.bloodGroup?.message}
                      htmlFor="bloodGroup"
                    >
                      <select id="bloodGroup" defaultValue="" {...register("bloodGroup")}>
                        <option value="" disabled>
                          Select blood group
                        </option>
                        {BLOOD_GROUPS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Genotype"
                      error={errors.genotype?.message}
                      htmlFor="genotype"
                    >
                      <select id="genotype" defaultValue="" {...register("genotype")}>
                        <option value="" disabled>
                          Select genotype
                        </option>
                        {GENOTYPES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="History of ailments"
                      error={errors.historyOfAilments?.message}
                      htmlFor="historyOfAilments"
                      className={styles.full}
                      hint='Write “None” if not applicable.'
                    >
                      <textarea
                        id="historyOfAilments"
                        rows={3}
                        {...register("historyOfAilments")}
                      />
                    </Field>
                    <Field
                      label="Current health challenge / allergies"
                      error={errors.currentHealthChallenge?.message}
                      htmlFor="currentHealthChallenge"
                      className={styles.full}
                      hint='Write “None” if not applicable.'
                    >
                      <textarea
                        id="currentHealthChallenge"
                        rows={3}
                        {...register("currentHealthChallenge")}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className={styles.fieldset} disabled={busy}>
                  <legend>Documents</legend>
                  <Field
                    label="Birth certificate"
                    error={errors.birthCertificate?.message}
                    htmlFor="birthCertificate"
                    hint="JPG, PNG, WEBP, or PDF · max 10MB"
                  >
                    <label className={styles.fileDrop} htmlFor="birthCertificate">
                      <input
                        id="birthCertificate"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        className={styles.fileInput}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("birthCertificate", file, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                      <span className={styles.fileCta}>
                        {birthFile instanceof File
                          ? birthFile.name
                          : "Choose file"}
                      </span>
                      {birthFile instanceof File ? (
                        <span className={styles.fileMeta}>
                          {formatBytes(birthFile.size)}
                        </span>
                      ) : (
                        <span className={styles.fileMeta}>
                          Tap to upload your certificate
                        </span>
                      )}
                    </label>
                  </Field>
                </fieldset>

                <fieldset className={styles.fieldset} disabled={busy}>
                  <legend>Entry video</legend>

                  <div className={styles.videoBrief}>
                    <p className={styles.videoBriefTitle}>
                      Your entry video MUST include:
                    </p>
                    <ol>
                      <li>
                        Introduce yourself (<strong>name and state</strong>)
                      </li>
                      <li>Show a <strong>full body</strong> recording</li>
                      <li>Answer <strong>ONE</strong> of the questions below</li>
                    </ol>
                    <ul className={styles.videoRules}>
                      <li>Direct upload only, not a URL</li>
                      <li>Maximum 2 minutes</li>
                      <li>Maximum {formatBytes(VIDEO_MAX_BYTES)}</li>
                      <li>MP4, MOV, or AVI</li>
                    </ul>
                  </div>

                  <div className={styles.prompts} role="radiogroup" aria-label="Prompt choice">
                    {ENTRY_VIDEO_PROMPTS.map((prompt) => {
                      const selected = promptChoice === prompt.id;
                      return (
                        <label
                          key={prompt.id}
                          className={[
                            styles.prompt,
                            selected ? styles.promptOn : "",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            value={prompt.id}
                            {...register("promptChoice")}
                          />
                          <span className={styles.promptId}>{prompt.id}</span>
                          <span className={styles.promptLabel}>{prompt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.promptChoice?.message ? (
                    <p className={styles.fieldError} role="alert">
                      {errors.promptChoice.message}
                    </p>
                  ) : null}

                  <Field
                    label="Upload entry video"
                    error={errors.entryVideo?.message}
                    htmlFor="entryVideo"
                    hint="MP4 / MOV / AVI · max 2 min · 100MB"
                  >
                    <label className={styles.fileDrop} htmlFor="entryVideo">
                      <input
                        id="entryVideo"
                        type="file"
                        accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo,video/avi"
                        className={styles.fileInput}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("entryVideo", file, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                      <span className={styles.fileCta}>
                        {videoFile instanceof File ? videoFile.name : "Choose video"}
                      </span>
                      {videoFile instanceof File ? (
                        <span className={styles.fileMeta}>
                          {formatBytes(videoFile.size)}
                        </span>
                      ) : (
                        <span className={styles.fileMeta}>
                          Upload your 2-minute entry
                        </span>
                      )}
                    </label>
                  </Field>
                </fieldset>

                {uploading ? (
                  <div className={styles.progressBlock} aria-live="polite">
                    <p>Uploading media securely…</p>
                    <ProgressRow
                      label="Birth certificate"
                      value={uploadProgress.birthCertificate}
                    />
                    <ProgressRow
                      label="Entry video"
                      value={uploadProgress.entryVideo}
                    />
                  </div>
                ) : null}

                {submitError ? (
                  <p className={styles.error} role="alert">
                    {submitError}
                  </p>
                ) : null}

                <div className={styles.actions}>
                  <Button type="submit" variant="gold" size="lg" disabled={busy}>
                    {busy ? "Submitting…" : "Submit Application"}
                  </Button>
                  <button
                    type="button"
                    className={styles.back}
                    onClick={() => setStep("eligibility")}
                    disabled={busy}
                  >
                    ← Back to eligibility
                  </button>
                </div>
              </form>
            </motion.section>
          ) : null}

          {step === "success" ? (
            <motion.section
              key="success"
              className={styles.success}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
            >
              <p className={styles.eyebrow}>Received</p>
              <h2>Your application is in.</h2>
              <p>
                Our team will review your entry with care. If approved, you will
                receive a private registration link by email (valid for 48 hours).
              </p>
              {referenceId ? (
                <p className={styles.ref}>
                  Reference · <strong>{referenceId}</strong>
                </p>
              ) : null}
              <div className={styles.actions}>
                <Button href="/" variant="gold" size="lg">
                  Return Home
                </Button>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error ? <span className={styles.hint}>{hint}</span> : null}
      {error ? (
        <span className={styles.fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.progressRow}>
      <div className={styles.progressMeta}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
