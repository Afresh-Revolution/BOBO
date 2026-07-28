import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { resendEmailLog } from "@/lib/resend-email-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteContext) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

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
