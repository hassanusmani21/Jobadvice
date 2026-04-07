import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { getCurrentSession } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string | string[];
    error?: string | string[];
  };
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login",
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

const nextAuthUrl = (process.env.NEXTAUTH_URL || "").trim().replace(/\/+$/, "");
const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
const hasNextAuthUrl = Boolean(nextAuthUrl);
const hasPublicSiteUrl = Boolean(publicSiteUrl);
const hasAuthOriginMismatch = hasNextAuthUrl && hasPublicSiteUrl && nextAuthUrl !== publicSiteUrl;

const toSafeCallbackUrl = (value: string | string[] | undefined, defaultValue: string) => {
  const callbackValue = Array.isArray(value) ? value[0] : value;

  if (!callbackValue || !callbackValue.startsWith("/") || callbackValue.startsWith("//")) {
    return defaultValue;
  }

  if (callbackValue.startsWith("/login") || callbackValue.startsWith("/admin")) {
    return defaultValue;
  }

  return callbackValue;
};

const toErrorMessage = (error: string | string[] | undefined) => {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (!errorCode) {
    return null;
  }

  if (
    errorCode === "OAuthSignin" ||
    errorCode === "OAuthCallback" ||
    errorCode === "Callback"
  ) {
    return "Google sign-in failed during the OAuth callback. Check NEXTAUTH_URL, the Google redirect URI, and server logs, then try again.";
  }

  if (errorCode === "AccessDenied") {
    return "Sign-in was denied. Please try again with a valid Google account.";
  }

  return `Sign-in failed (code: ${errorCode}). Please try again.`;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();
  const callbackUrl = toSafeCallbackUrl(searchParams?.callbackUrl, "/jobs");
  const errorMessage = toErrorMessage(searchParams?.error);
  const canStartGoogleSignIn = hasAuthSecret && hasGoogleOAuthCredentials;

  if (session?.user?.id) {
    redirect(toSafeCallbackUrl(searchParams?.callbackUrl, "/jobs"));
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl backdrop-blur-sm md:grid-cols-[1.15fr_1fr]">
        <section className="bg-slate-950 px-7 py-10 text-white sm:px-10">
          <p className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Account Access
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight">
            Sign in to continue
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-200 sm:text-base">
            Use your Google account for protected member access and admin tools across JobAdvice.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200/95">
            <li>Return to the page you were opening after login.</li>
            <li>Use admin tools if your email has access.</li>
            <li>Keep a secure session for protected site features.</li>
          </ul>
        </section>

        <section className="flex flex-col justify-center px-7 py-10 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Member Login
          </p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">Sign in</h2>
          <p className="mt-3 text-sm text-slate-600">
            Use your Google account to continue. If you were heading somewhere specific, you will
            continue there right after login.
          </p>

          {canStartGoogleSignIn ? (
            <div className="mt-8">
              <GoogleSignInButton callbackUrl={callbackUrl} />
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Sign-in is not fully configured on this deployment. Missing:{" "}
              <code>
                {[
                  !hasAuthSecret ? "AUTH_SECRET" : null,
                  !hasGoogleOAuthCredentials ? "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </code>
            </p>
          )}

          {!hasNextAuthUrl ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Set <code>NEXTAUTH_URL</code> to your exact public site origin to avoid Google
              callback failures.
            </p>
          ) : null}

          {!hasPublicSiteUrl ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Set <code>NEXT_PUBLIC_SITE_URL</code> to the same public origin used by{" "}
              <code>NEXTAUTH_URL</code> so canonical routing and auth stay aligned.
            </p>
          ) : null}

          {hasAuthOriginMismatch ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <code>NEXTAUTH_URL</code> and <code>NEXT_PUBLIC_SITE_URL</code> do not match.
              Keep both on the same exact origin, for example <code>https://jobadvice.in</code>.
            </p>
          ) : null}

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
