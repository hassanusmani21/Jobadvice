import type { Metadata } from "next";
import {
  ALLOWED_ADMIN_EMAILS,
  isAllowedAdminEmail,
} from "@/lib/adminAccess";
import { getAdminSession } from "@/lib/adminSession";
import { redirect } from "next/navigation";
import GoogleAdminSignInButton from "./GoogleAdminSignInButton";

type AdminLoginPageProps = {
  searchParams?: {
    callbackUrl?: string | string[];
    error?: string | string[];
  };
};

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

const hasAuthSecret = Boolean(
  (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").trim(),
);

const hasGoogleOAuthCredentials = Boolean(
  (process.env.GOOGLE_CLIENT_ID || "").trim() &&
    (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
);

const toSafeCallbackUrl = (value: string | string[] | undefined) => {
  const callbackValue = Array.isArray(value) ? value[0] : value;

  if (!callbackValue || !callbackValue.startsWith("/")) {
    return "/admin-mobile";
  }

  // Prevent redirect loops back to the sign-in page.
  if (callbackValue.startsWith("/admin/login")) {
    return "/admin-mobile";
  }

  return callbackValue;
};

const toErrorMessage = (error: string | undefined) => {
  if (!error) {
    return null;
  }

  if (error === "AccessDenied") {
    return "This Google account is not authorized for admin access.";
  }

  if (error === "OAuthSignin" || error === "OAuthCallback") {
    return "Google sign-in failed. Check OAuth client settings and callback URL.";
  }

  if (error === "SessionRequired") {
    return "Your admin session expired. Please sign in again.";
  }

  return `Login failed (code: ${error}). Please try again.`;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const callbackUrl = toSafeCallbackUrl(searchParams?.callbackUrl);
  const error = Array.isArray(searchParams?.error)
    ? searchParams?.error[0]
    : searchParams?.error;
  const errorMessage = toErrorMessage(error);
  const hasConfiguredAdmins = ALLOWED_ADMIN_EMAILS.length > 0;
  const missingAuthConfig: string[] = [];

  if (!hasAuthSecret) {
    missingAuthConfig.push("AUTH_SECRET");
  }

  if (!hasGoogleOAuthCredentials) {
    missingAuthConfig.push("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }

  const canStartGoogleSignIn =
    hasConfiguredAdmins && missingAuthConfig.length === 0;

  const session = await getAdminSession();
  if (isAllowedAdminEmail(session?.user?.email)) {
    redirect(callbackUrl);
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl backdrop-blur-sm md:grid-cols-[1.2fr_1fr]">
        <section className="bg-teal-900 px-7 py-10 text-white sm:px-10">
          <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Admin Access
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight">
            JobAdvice Admin Dashboard
          </h1>
          <p className="mt-4 max-w-md text-sm text-teal-50 sm:text-base">
            Manage job posts, publish updates, and keep listings accurate from one
            secure dashboard.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-teal-50/95">
            <li>Only approved email account can access this section.</li>
            <li>Session auto-expires after one hour.</li>
            <li>Use logout from admin panel when finished.</li>
          </ul>
        </section>

        <section className="flex flex-col justify-center px-7 py-10 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Secure Sign-In
          </p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">Welcome back</h2>
          <p className="mt-3 text-sm text-slate-600">
            Continue with your Google account to enter the admin dashboard.
          </p>

          {canStartGoogleSignIn ? (
            <div className="mt-8">
              <GoogleAdminSignInButton callbackUrl={callbackUrl} />
            </div>
          ) : missingAuthConfig.length > 0 ? (
            <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Admin auth is not configured on this deployment. Missing:{" "}
              <code>{missingAuthConfig.join(", ")}</code>
            </p>
          ) : (
            <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Admin access is not configured correctly. Set <code>ALLOWED_ADMIN_EMAILS</code>{" "}
              before using this page.
            </p>
          )}

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {errorMessage}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
