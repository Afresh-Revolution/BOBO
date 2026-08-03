import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { resendEmailLog } from "@/lib/resend-email-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { id } = await ctx.params;
    const result = await resendEmailLog(id);

    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return jsonOk({ data: { resent: true } });
  } catch (err) {
    console.error("[admin/emails/resend]", err);
    return jsonError("Internal server error", 500);
  }
}
