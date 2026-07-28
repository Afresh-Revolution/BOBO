import { adminFetch } from "@/lib/admin-api";
import type { ConfirmAsk } from "@/components/admin";

export async function confirmAndBulkDelete(opts: {
  endpoint: string;
  ids: string[];
  label: string;
  ask: ConfirmAsk;
}): Promise<number> {
  const { endpoint, ids, label, ask } = opts;
  if (!ids.length) return 0;

  const ok = await ask({
    title: `Delete ${ids.length} ${label}?`,
    message: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    tone: "danger",
  });
  if (!ok) return 0;

  const res = await adminFetch<{ data?: { deleted?: number } }>(endpoint, {
    method: "POST",
    body: { ids },
  });

  return res.data?.deleted ?? ids.length;
}
