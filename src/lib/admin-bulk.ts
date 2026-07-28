export function parseIdList(body: unknown): string[] | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids)) return null;
  const cleaned = [
    ...new Set(
      ids
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
  return cleaned.length ? cleaned : null;
}
