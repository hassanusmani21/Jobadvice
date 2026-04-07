import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminRole } from "./lib/auth/roles";
import { siteUrl } from "./lib/site";
import { toContentSlug } from "./lib/slug";

const toSafeCallbackUrl = (
  request: NextRequest,
  defaultValue: string,
  options?: { allowAdmin?: boolean },
) => {
  const rawValue = request.nextUrl.searchParams.get("callbackUrl") || defaultValue;
  const allowAdmin = Boolean(options?.allowAdmin);

  if (!rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return defaultValue;
  }

  if (rawValue.startsWith("/admin/login") || rawValue.startsWith("/login")) {
    return defaultValue;
  }

  if (!allowAdmin && rawValue.startsWith("/admin")) {
    return defaultValue;
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

const canonicalTrailingSlashPaths = new Set([
  "/about",
  "/blog",
  "/contact",
  "/jobs",
  "/privacy-policy",
]);

const shouldForceTrailingSlash = (pathname: string) =>
  canonicalTrailingSlashPaths.has(pathname) ||
  pathname.startsWith("/blog/") ||
  pathname.startsWith("/jobs/");

const resolvedCanonicalSite = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("https://jobadvice.in");
  }
})();

const canonicalHost = resolvedCanonicalSite.host.toLowerCase();
const canonicalProtocol = resolvedCanonicalSite.protocol;

const redirectNonCanonicalHost = (request: NextRequest) => {
  const requestHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host
  ).toLowerCase();

  if (
    !requestHost ||
    requestHost === canonicalHost ||
    requestHost.startsWith("localhost") ||
    requestHost.startsWith("127.0.0.1")
  ) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.host = canonicalHost;
  redirectUrl.protocol = canonicalProtocol;
  return NextResponse.redirect(redirectUrl, 308);
};

const redirectMissingTrailingSlash = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  if (!shouldForceTrailingSlash(pathname)) {
    return null;
  }

  if (pathname === "/" || pathname.endsWith("/") || /\.[^/]+$/i.test(pathname)) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `${pathname}/`;
  return NextResponse.redirect(redirectUrl);
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

const getTokenUserId = async (request: NextRequest) => {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  const userId =
    typeof token?.userId === "string"
      ? token.userId
      : typeof token?.sub === "string"
        ? token.sub
        : "";

  const role = typeof token?.role === "string" ? token.role : "";

  return {
    userId,
    role,
  };
};

export async function middleware(request: NextRequest) {
  const canonicalHostRedirect = redirectNonCanonicalHost(request);
  if (canonicalHostRedirect) {
    return canonicalHostRedirect;
  }

  const jobSlugRedirect = redirectMalformedJobSlug(request);
  if (jobSlugRedirect) {
    return jobSlugRedirect;
  }

  const trailingSlashRedirect = redirectMissingTrailingSlash(request);
  if (trailingSlashRedirect) {
    return trailingSlashRedirect;
  }

  if (request.nextUrl.pathname === "/admin/index.html") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.searchParams.delete("desktop_admin");
    return NextResponse.redirect(redirectUrl);
  }

  if (request.nextUrl.pathname === "/admin-mobile" || request.nextUrl.pathname === "/admin-mobile/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return NextResponse.redirect(redirectUrl);
  }

  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname === "/admin/") {
    if (request.nextUrl.searchParams.get("desktop_admin") === "1") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.searchParams.delete("desktop_admin");
      return NextResponse.redirect(redirectUrl);
    }

    const { userId, role } = await getTokenUserId(request);

    if (isAdminRole(role)) {
      return NextResponse.next();
    }

    if (userId) {
      return NextResponse.redirect(new URL("/jobs", request.nextUrl.origin));
    }

    const loginUrl = new URL("/admin/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", "/admin");
    return NextResponse.redirect(loginUrl);
  }

  if (
    request.nextUrl.pathname === "/me" ||
    request.nextUrl.pathname === "/me/" ||
    request.nextUrl.pathname.startsWith("/me/")
  ) {
    return NextResponse.redirect(new URL("/jobs", request.nextUrl.origin));
  }

  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/login/") {
    const { userId } = await getTokenUserId(request);

    if (!userId) {
      return NextResponse.next();
    }

    const destinationUrl = new URL(
      toSafeCallbackUrl(request, "/jobs"),
      request.nextUrl.origin,
    );
    return NextResponse.redirect(destinationUrl);
  }

  if (!request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const { userId, role } = await getTokenUserId(request);

  if (!userId) {
    return NextResponse.next();
  }

  if (isAdminRole(role)) {
    const destinationUrl = new URL(
      toSafeCallbackUrl(request, "/admin", { allowAdmin: true }),
      request.nextUrl.origin,
    );
    return NextResponse.redirect(destinationUrl);
  }

  return NextResponse.redirect(new URL("/jobs", request.nextUrl.origin));
}

export const config = {
  matcher: [
    "/",
    "/admin",
    "/admin/:path*",
    "/admin-mobile",
    "/admin-mobile/:path*",
    "/login",
    "/login/:path*",
    "/me",
    "/me/:path*",
    "/admin/login",
    "/admin/login/:path*",
    "/about",
    "/blog/:path*",
    "/contact",
    "/jobs/:path*",
    "/privacy-policy",
  ],
};
