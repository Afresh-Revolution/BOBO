export const applicationInclude = {
  video: { include: { media: true } },
  media: true,
} as const;

const STATUS_MAP = {
  pending: ["PENDING", "UNDER_REVIEW"],
  submitted: ["PENDING", "UNDER_REVIEW"],
  approved: ["APPROVED"],
  rejected: ["REJECTED", "EXPIRED"],
  registered: ["REGISTERED"],
  under_review: ["UNDER_REVIEW"],
} as const;

export function mapStatusQuery(status?: string | null) {
  if (!status) return undefined;
  const key = status.toLowerCase() as keyof typeof STATUS_MAP;
  const mapped = STATUS_MAP[key];
  return mapped ? [...mapped] : undefined;
}
