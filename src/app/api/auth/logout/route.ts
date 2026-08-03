import { ADMIN_COOKIE, getAdminFromCookies } from "@/lib/auth";
import { jsonOk } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security/csrf";
import { writeAudit } from "@/lib/security/audit";

function cookieSecure() {
  return (
    process.env.NODE_ENV === "production" &&
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(
      process.env.APP_URL || "",
    )
  );
}

export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const admin = await getAdminFromCookies();
  if (admin) {
    await writeAudit({
      adminId: admin.id,
      action: "auth.logout",
      entity: "Admin",
      entityId: admin.id,
      req,
    });
  }

  const res = jsonOk({});
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookieSecure(),
    maxAge: 0,
  });
  return res;
}
