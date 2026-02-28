import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAllowedAdminEmail } from "./lib/adminAccess";
import { toContentSlug } from "./lib/slug";

const toSafeCallbackUrl = (request: NextRequest) => {
  const rawValue = request.nextUrl.searchParams.get("callbackUrl") || "/admin";

  if (!rawValue.startsWith("/") || rawValue.startsWith("/admin/login")) {
    return "/admin";
  }

  return rawValue;
};

const toDecodedPathSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const redirectMalformedJobSlug = (request: NextRequest) => {
  const jobSlugMatch = request.nextUrl.pathname.match(/^\/jobs\/([^/]+)\/?$/);

  if (!jobSlugMatch) {
    return null;
  }

  const currentSlug = toDecodedPathSegment(jobSlugMatch[1]);
  const normalizedSlug = toContentSlug(currentSlug);

  if (!normalizedSlug || normalizedSlug === currentSlug) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/jobs/${normalizedSlug}/`;
  return NextResponse.redirect(redirectUrl);
};

export async function middleware(request: NextRequest) {
  const jobSlugRedirect = redirectMalformedJobSlug(request);
  if (jobSlugRedirect) {
    return jobSlugRedirect;
  }

  if (!request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const email = typeof token?.email === "string" ? token.email : "";

  if (isAllowedAdminEmail(email)) {
    const destinationUrl = new URL(toSafeCallbackUrl(request), request.nextUrl.origin);
    return NextResponse.redirect(destinationUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/login", "/admin/login/:path*", "/jobs/:path*"],
};
