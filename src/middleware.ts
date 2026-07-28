import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAMES = ["bobo_admin_token", "admin_token", "token"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const hasSession = COOKIE_NAMES.some((name) => {
    const value = request.cookies.get(name)?.value;
    return Boolean(value);
  });

  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
