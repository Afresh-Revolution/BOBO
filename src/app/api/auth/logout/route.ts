import { ADMIN_COOKIE } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function POST() {
  const res = jsonOk({});
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res;
}
