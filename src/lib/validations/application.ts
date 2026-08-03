import { z } from "zod";

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const GENOTYPES = ["AA", "AS", "SS", "AC", "SC"] as const;

export const PROMPT_CHOICES = ["A", "B", "C", "D"] as const;

export const ENTRY_VIDEO_PROMPTS = [
  {
    id: "A" as const,
    label: "What does success look like to you?",
  },
  {
    id: "B" as const,
    label: "How would you handle failure?",
  },
  {
    id: "C" as const,
    label: "What is something society accepts that should be questioned?",
  },
  {
    id: "D" as const,
    label:
      "Which is a greater sign of strength: changing your mind, or standing by your beliefs?",
  },
] as const;

export const VIDEO_MAX_BYTES = 100 * 1024 * 1024; // 100MB
export const VIDEO_MAX_SECONDS = 120;
export const VIDEO_ACCEPT = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"] as const;
export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"] as const;

export const CERT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const CERT_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const eligibilityKeys = [
  "cbrilliance",
  "followers",
  "nigerian",
  "ageRange",
] as const;

export type EligibilityKey = (typeof eligibilityKeys)[number];

export const eligibilitySchema = z.object({
  cbrilliance: z.literal(true, {
    error: "You must have a CBrilliance account.",
  }),
  followers: z.literal(true, {
    error: "You must have 2,000+ followers on at least one platform (except Facebook).",
  }),
  nigerian: z.literal(true, {
    error: "You must be Nigerian by nationality.",
  }),
  ageRange: z.literal(true, {
    error: "You must be between 18 and 38 years old.",
  }),
  acknowledged: z.literal(true, {
    error: "Please acknowledge that you meet all eligibility criteria.",
  }),
});

export type EligibilityInput = z.infer<typeof eligibilitySchema>;

const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
const ninRegex = /^\d{11}$/;

/** Empty string or a valid http(s) URL. */
const socialLinkField = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v),
    "Enter a full URL starting with http:// or https://.",
  )
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        // eslint-disable-next-line no-new
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    "Enter a valid social media URL.",
  );

function countFilledSocialLinks(data: {
  tiktokUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  facebookUrl?: string;
}) {
  return [data.tiktokUrl, data.instagramUrl, data.xUrl, data.facebookUrl].filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  ).length;
}

function isAllowedVideo(file: File) {
  const name = file.name.toLowerCase();
  const byExt = VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
  const byMime =
    VIDEO_ACCEPT.includes(file.type as (typeof VIDEO_ACCEPT)[number]) ||
    file.type === "" ||
    file.type === "application/octet-stream";
  return byExt && byMime;
}

function isAllowedCertificate(file: File) {
  const name = file.name.toLowerCase();
  const byExt =
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".pdf");
  const byMime =
    CERT_ACCEPT.includes(file.type as (typeof CERT_ACCEPT)[number]) ||
    file.type === "" ||
    file.type === "application/octet-stream";
  return byExt && byMime;
}

/** Shared applicant fields (before media upload / after upload). */
const applicationFieldsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid Nigerian phone number."),
  age: z
    .number({ error: "Enter your age." })
    .int("Age must be a whole number.")
    .min(18, "You must be at least 18.")
    .max(38, "You must be 38 or under."),
  stateOfResidence: z
    .string()
    .trim()
    .min(2, "Enter your state of residence.")
    .max(80, "State name is too long."),
  motherMaidenName: z
    .string()
    .trim()
    .min(2, "Enter your mother's maiden name.")
    .max(80, "Name is too long."),
  nin: z.string().trim().regex(ninRegex, "NIN must be exactly 11 digits."),
  tiktokUrl: socialLinkField,
  instagramUrl: socialLinkField,
  xUrl: socialLinkField,
  facebookUrl: socialLinkField,
  bloodGroup: z.enum(BLOOD_GROUPS, {
    error: "Select your blood group.",
  }),
  genotype: z.enum(GENOTYPES, {
    error: "Select your genotype.",
  }),
  historyOfAilments: z
    .string()
    .trim()
    .min(2, "Share any history of ailments, or write “None”.")
    .max(2000, "Keep this under 2,000 characters."),
  currentHealthChallenge: z
    .string()
    .trim()
    .min(2, "Share any current health challenges or allergies, or write “None”.")
    .max(2000, "Keep this under 2,000 characters."),
  promptChoice: z.enum(PROMPT_CHOICES, {
    error: "Select one prompt question to answer in your video.",
  }),
});

function requireTwoSocialLinks(
  data: {
    tiktokUrl?: string;
    instagramUrl?: string;
    xUrl?: string;
    facebookUrl?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (countFilledSocialLinks(data) < 2) {
    ctx.addIssue({
      code: "custom",
      path: ["tiktokUrl"],
      message: "Provide at least two social media links.",
    });
  }
}

/** Client-side form schema (includes File objects before upload). */
export const applicationFormSchema = applicationFieldsSchema
  .extend({
    birthCertificate: z
      .custom<File>((v) => v instanceof File, {
        message: "Upload your birth certificate.",
      })
      .refine((f) => f.size > 0, "Upload your birth certificate.")
      .refine((f) => f.size <= CERT_MAX_BYTES, "Birth certificate must be 10MB or less.")
      .refine(isAllowedCertificate, "Use JPG, PNG, WEBP, or PDF."),
    entryVideo: z
      .custom<File>((v) => v instanceof File, {
        message: "Upload your entry video.",
      })
      .refine((f) => f.size > 0, "Upload your entry video.")
      .refine((f) => f.size <= VIDEO_MAX_BYTES, "Video must be 100MB or less.")
      .refine(isAllowedVideo, "Video must be MP4, MOV, or AVI."),
    /** Honeypot — leave empty. */
    website: z.string().max(0),
  })
  .superRefine(requireTwoSocialLinks);

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;

export const mediaAssetSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  resourceType: z.enum(["image", "video", "raw"]).optional(),
  bytes: z.number().int().positive().optional(),
  format: z.string().optional(),
  originalFilename: z.string().optional(),
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;

/** Payload sent to POST /api/applications after Cloudinary upload. */
export const applicationSubmitSchema = applicationFieldsSchema
  .extend({
    birthCertificate: mediaAssetSchema,
    entryVideo: mediaAssetSchema,
    /** Honeypot — must be empty (bots often fill hidden fields). */
    website: z.string().max(0).optional(),
  })
  .superRefine(requireTwoSocialLinks);

export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;

export function emptySocialLinkToNull(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
export const ELIGIBILITY_ITEMS: {
  key: EligibilityKey;
  label: string;
}[] = [
  {
    key: "cbrilliance",
    label: "I have a CBrilliance account",
  },
  {
    key: "followers",
    label:
      "I have 2,000+ followers on at least one social platform (except Facebook)",
  },
  {
    key: "nigerian",
    label: "I am Nigerian by nationality",
  },
  {
    key: "ageRange",
    label: "I am between 18 and 38 years old",
  },
];
