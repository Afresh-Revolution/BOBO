import { v2 as cloudinary } from "cloudinary";
import { createHash, randomBytes } from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export type SignKind =
  | "birthCertificate"
  | "entryVideo"
  | "adminMedia"
  | "cbcReceipt";

const KIND_RULES: Record<
  SignKind,
  {
    folder: string;
    resourceType: "image" | "video" | "auto" | "raw";
    allowedFormats: string;
    maxBytes: number;
  }
> = {
  birthCertificate: {
    folder: "bobo/certificates",
    resourceType: "image",
    allowedFormats: "jpg,jpeg,png,webp,pdf",
    maxBytes: 10 * 1024 * 1024,
  },
  entryVideo: {
    folder: "bobo/videos",
    resourceType: "video",
    allowedFormats: "mp4,mov,avi",
    maxBytes: 100 * 1024 * 1024,
  },
  adminMedia: {
    folder: "bobo/media",
    resourceType: "auto",
    allowedFormats: "jpg,jpeg,png,webp,gif,mp4,mov,pdf",
    maxBytes: 25 * 1024 * 1024,
  },
  cbcReceipt: {
    folder: "bobo/receipts",
    resourceType: "image",
    allowedFormats: "jpg,jpeg,png,webp,pdf",
    maxBytes: 10 * 1024 * 1024,
  },
};

/** Opaque public_id — never expose original filenames. */
function securePublicId(kind: SignKind) {
  const stamp = Date.now().toString(36);
  const rand = randomBytes(8).toString("hex");
  const hash = createHash("sha256")
    .update(`${kind}:${stamp}:${rand}`)
    .digest("hex")
    .slice(0, 16);
  return `${kind}_${stamp}_${hash}`;
}

export function signUpload(kind: SignKind, _filename?: string) {
  const rules = KIND_RULES[kind];
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = securePublicId(kind);

  const params: Record<string, string | number> = {
    timestamp,
    folder: rules.folder,
    public_id: publicId,
    allowed_formats: rules.allowedFormats,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET || "",
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    timestamp,
    signature,
    folder: rules.folder,
    publicId,
    resourceType: rules.resourceType,
    allowedFormats: rules.allowedFormats,
    maxBytes: rules.maxBytes,
  };
}
