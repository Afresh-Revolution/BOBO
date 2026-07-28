import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return jsonError("Unauthorized", 401);
    }

    return jsonOk({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.fullName,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("[auth/me]", err);
    return jsonError("Internal server error", 500);
  }
}
