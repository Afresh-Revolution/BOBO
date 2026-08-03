import type { MediaAsset } from "@/lib/validations/application";

export type UploadKind =
  | "birthCertificate"
  | "entryVideo"
  | "cbcReceipt"
  | "adminMedia";

export type UploadSignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  uploadPreset?: string;
  allowedFormats?: string;
  maxBytes?: number;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export class UploadError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

async function requestSignature(
  kind: UploadKind,
  filename: string,
  token?: string,
) {
  const res = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, filename, token }),
  });

  const data = (await res.json().catch(() => ({}))) as UploadSignResponse & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new UploadError(
      data.error || data.message || "Could not prepare upload.",
      res.status,
    );
  }

  if (!data.cloudName || !data.signature || !data.timestamp || !data.apiKey) {
    throw new UploadError("Invalid upload signature response.");
  }

  return data;
}

function cloudinaryEndpoint(
  cloudName: string,
  resourceType: string = "auto",
) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
}

function parseCloudinaryResult(
  raw: Record<string, unknown>,
  fallbackName?: string,
): MediaAsset {
  const publicId = String(raw.public_id ?? "");
  const url = String(raw.secure_url ?? raw.url ?? "");

  if (!publicId || !url) {
    throw new UploadError("Upload completed without a usable media reference.");
  }

  const resourceType = String(raw.resource_type ?? "image");
  const normalized =
    resourceType === "video" || resourceType === "raw" ? resourceType : "image";

  return {
    publicId,
    url,
    resourceType: normalized,
    bytes: typeof raw.bytes === "number" ? raw.bytes : undefined,
    format: typeof raw.format === "string" ? raw.format : undefined,
    originalFilename:
      typeof raw.original_filename === "string"
        ? raw.original_filename
        : fallbackName,
  };
}

/**
 * Signed (preferred) or unsigned Cloudinary upload from the browser.
 * 1) POST /api/upload/sign → signature payload
 * 2) POST file to Cloudinary
 * 3) Return public_id + secure_url for application submit
 */
export async function uploadToCloudinary(
  file: File,
  kind: UploadKind,
  onProgress?: (progress: UploadProgress) => void,
  options?: { token?: string },
): Promise<MediaAsset> {
  const sign = await requestSignature(kind, file.name, options?.token);
  const resourceType = sign.resourceType ?? (kind === "entryVideo" ? "video" : "auto");

  if (sign.maxBytes && file.size > sign.maxBytes) {
    throw new UploadError(
      `File is too large. Maximum size is ${Math.round(sign.maxBytes / (1024 * 1024))}MB.`,
      413,
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  if (sign.publicId) {
    form.append("public_id", sign.publicId);
  }
  if (sign.allowedFormats) {
    form.append("allowed_formats", sign.allowedFormats);
  }

  if (sign.uploadPreset) {
    form.append("upload_preset", sign.uploadPreset);
  }

  const endpoint = cloudinaryEndpoint(sign.cloudName, resourceType);

  const raw = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress({ loaded: event.loaded, total: event.total, percent });
    };

    xhr.onload = () => {
      const body =
        (xhr.response as Record<string, unknown> | null) ??
        (typeof xhr.responseText === "string"
          ? (JSON.parse(xhr.responseText) as Record<string, unknown>)
          : {});

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
        return;
      }

      const message =
        (body?.error as { message?: string } | undefined)?.message ||
        (typeof body?.message === "string" ? body.message : null) ||
        `Upload failed (${xhr.status}).`;
      reject(new UploadError(message, xhr.status));
    };

    xhr.onerror = () => reject(new UploadError("Network error during upload."));
    xhr.onabort = () => reject(new UploadError("Upload was cancelled."));
    xhr.send(form);
  });

  onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
  return parseCloudinaryResult(raw, file.name);
}

export async function uploadApplicationMedia(files: {
  birthCertificate: File;
  entryVideo: File;
  onProgress?: (kind: UploadKind, progress: UploadProgress) => void;
}) {
  const birthCertificate = await uploadToCloudinary(
    files.birthCertificate,
    "birthCertificate",
    (p) => files.onProgress?.("birthCertificate", p),
  );

  const entryVideo = await uploadToCloudinary(
    files.entryVideo,
    "entryVideo",
    (p) => files.onProgress?.("entryVideo", p),
  );

  return { birthCertificate, entryVideo };
}
