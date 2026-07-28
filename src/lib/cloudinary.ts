import { v2 as cloudinary } from "cloudinary";

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

export function signUpload(kind: SignKind, filename?: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder =
    kind === "entryVideo"
      ? "bobo/videos"
      : kind === "birthCertificate"
        ? "bobo/certificates"
        : kind === "cbcReceipt"
          ? "bobo/receipts"
          : "bobo/media";

  const params: Record<string, string | number> = {
    timestamp,
    folder,
  };

  if (filename) {
    const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    params.public_id = `${base}_${timestamp}`;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET || "",
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    timestamp,
    signature,
    folder: String(params.folder),
    publicId: params.public_id ? String(params.public_id) : undefined,
    resourceType: kind === "entryVideo" ? ("video" as const) : ("auto" as const),
  };
}
