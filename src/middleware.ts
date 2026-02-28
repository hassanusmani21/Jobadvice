import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAllowedAdminEmail } from "./lib/adminAccess";

const isCmsAdminAsset = (pathname: string) => {
  if (pathname === "/admin" || pathname === "/admin/") {
    return true;
  }

  if (pathname.startsWith("/admin/index.html")) {
    return true;
  }

  return /^\/admin\/[^/]+\.[a-z0-9]+$/i.test(pathname);
};

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin/login") ||
    isCmsAdminAsset(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const email = typeof token?.email === "string" ? token.email : "";

  if (!isAllowedAdminEmail(email)) {
    const signInUrl = new URL("/admin/login", request.nextUrl.origin);
    signInUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
