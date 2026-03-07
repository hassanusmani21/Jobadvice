import type { Metadata, Viewport } from "next";
import Link from "@/components/AppLink";
import RouteProgressReset from "@/components/RouteProgressReset";
import SiteHeader from "@/components/SiteHeader";
import WhatsAppCta from "@/components/WhatsAppCta";
import {
  organizationId,
  siteDescription,
  siteEmail,
  siteKeywords,
  siteLogoUrl,
  siteName,
  siteSocialProfiles,
  siteUrl,
  websiteId,
} from "@/lib/site";
import "./globals.css";

const themePreferenceScript = `
  (function () {
    if (typeof window === "undefined") return;

    var storageKey = "jobadvice-theme";
    var storedTheme = "";

    try {
      storedTheme = window.localStorage.getItem(storageKey) || "";
    } catch {}

    var resolvedTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  })();
`;

const identityHashRedirectScript = `
  (function () {
    if (typeof window === "undefined") return;
    var hash = window.location.hash || "";
    var pathname = window.location.pathname || "/";
    var recoveryHashPattern = /(recovery_token|type=recovery)/i;
    var identityHashPattern = /(recovery_token|confirmation_token|invite_token|email_change_token|type=recovery|type=invite|type=signup)/i;

    if (pathname !== "/" || !hash || !identityHashPattern.test(hash)) {
      return;
    }

    if (recoveryHashPattern.test(hash)) {
      window.location.replace("/admin/recover" + hash);
      return;
    }

    window.location.replace("/admin/" + hash);
  })();
`;

const assetLoadRecoveryScript = `
  (function () {
    if (typeof window === "undefined") return;

    var reloadParam = "__chunk_reload";
    var reloadTimestampParam = "__reload_ts";
    var storagePrefix = "jobadvice:asset-recovery";
    var retryWindowMs = 60000;
    var maxAttempts = 1;
    var successfulLoadResetDelayMs = 8000;
    var recoveryResetTimer = 0;

    var getStorageKey = function () {
      return storagePrefix + ":" + window.location.pathname;
    };

    var readRecoveryState = function () {
      try {
        var rawValue = window.sessionStorage.getItem(getStorageKey());
        if (!rawValue) {
          return { attempts: 0, lastAttempt: 0 };
        }

        var parsed = JSON.parse(rawValue);
        var attempts =
          typeof parsed.attempts === "number" && isFinite(parsed.attempts)
            ? parsed.attempts
            : 0;
        var lastAttempt =
          typeof parsed.lastAttempt === "number" && isFinite(parsed.lastAttempt)
            ? parsed.lastAttempt
            : 0;

        return { attempts: attempts, lastAttempt: lastAttempt };
      } catch {
        return { attempts: 0, lastAttempt: 0 };
      }
    };

    var clearRecoveryState = function () {
      try {
        window.sessionStorage.removeItem(getStorageKey());
      } catch {}
    };

    var hasReloadParam = function () {
      try {
        return new URL(window.location.href).searchParams.has(reloadParam);
      } catch {
        return false;
      }
    };

    var cleanupReloadParam = function () {
      try {
        var url = new URL(window.location.href);

        if (!url.searchParams.has(reloadParam)) {
          return;
        }

        url.searchParams.delete(reloadParam);
        url.searchParams.delete(reloadTimestampParam);
        window.history.replaceState(window.history.state, "", url.toString());
      } catch {}
    };

    var scheduleRecoveryReset = function () {
      if (recoveryResetTimer) {
        window.clearTimeout(recoveryResetTimer);
      }

      recoveryResetTimer = window.setTimeout(function () {
        cleanupReloadParam();
        clearRecoveryState();
      }, successfulLoadResetDelayMs);
    };

    var getRecentAttemptCount = function () {
      var state = readRecoveryState();
      if (!isFinite(state.lastAttempt) || Date.now() - state.lastAttempt >= retryWindowMs) {
        return 0;
      }

      return state.attempts;
    };

    var rememberRetry = function (attemptCount) {
      try {
        window.sessionStorage.setItem(
          getStorageKey(),
          JSON.stringify({
            attempts: attemptCount,
            lastAttempt: Date.now(),
          })
        );
      } catch {}
    };

    var reloadPage = function () {
      var attempts = getRecentAttemptCount();
      if (attempts >= maxAttempts) {
        return;
      }

      var nextAttempt = attempts + 1;
      rememberRetry(nextAttempt);

      try {
        var nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set(reloadParam, String(nextAttempt));
        nextUrl.searchParams.set(reloadTimestampParam, String(Date.now()));
        window.location.replace(nextUrl.toString());
        return;
      } catch {}

      window.location.reload();
    };

    window.addEventListener("load", function () {
      if (hasReloadParam()) {
        scheduleRecoveryReset();
        return;
      }

      cleanupReloadParam();
    });

    window.addEventListener("unhandledrejection", function (event) {
      var reason = event.reason;
      var message = "";

      if (typeof reason === "string") {
        message = reason;
      } else if (reason && typeof reason.message === "string") {
        message = reason.message;
      }

      if (
        /ChunkLoadError/i.test(message) ||
        /Loading chunk [\\w-]+ failed/i.test(message) ||
        /Failed to fetch dynamically imported module/i.test(message) ||
        /Importing a module script failed/i.test(message)
      ) {
        reloadPage();
      }
    });
  })();
`;

const resolvedMetadataBase = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("https://jobadvice.in");
  }
})();

export const metadata: Metadata = {
  metadataBase: resolvedMetadataBase,
  title: {
    default: `${siteName} | Verified Tech and Fresher Jobs`,
    template: `%s | ${siteName}`,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "jobs",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: "/",
    siteName,
    type: "website",
    images: [
      {
        url: siteLogoUrl,
        alt: `${siteName} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [siteLogoUrl],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/jobsadvice.in?utm_source=qr&igsh=MTM0eGhud3VtNGNvcw==",
    label: "Instagram",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <rect
          x="3.75"
          y="3.75"
          width="16.5"
          height="16.5"
          rx="4.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/in/hassan-usmani21",
    label: "LinkedIn",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M7.25 8.25v8.5M7.25 6.1a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7ZM11.5 16.75v-4.6a2.15 2.15 0 0 1 4.3 0v4.6M11.5 10.6v6.15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
        <rect
          x="3.75"
          y="3.75"
          width="16.5"
          height="16.5"
          rx="3.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    href: "https://www.youtube.com/@JobAdvice4u",
    label: "YouTube",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M20 8.9c-.16-1.2-.96-2.08-2.03-2.24C16.7 6.45 14.9 6.3 12 6.3s-4.7.15-5.97.36C4.96 6.82 4.16 7.7 4 8.9c-.17 1.26-.17 2.94 0 4.2.16 1.2.96 2.08 2.03 2.24 1.27.21 3.07.36 5.97.36s4.7-.15 5.97-.36c1.07-.16 1.87-1.04 2.03-2.24.17-1.26.17-2.94 0-4.2Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
        <path d="m10.25 9.55 4.5 2.45-4.5 2.45v-4.9Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "https://t.me/jobadvice4u",
    label: "Telegram",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="m20.2 5.1-2.5 13.2c-.16.82-.62 1.02-1.26.64l-4.26-3.15-2.06 1.99c-.23.23-.43.43-.87.43l.3-4.35 7.92-7.15c.34-.3-.08-.47-.53-.17l-9.8 6.17-4.22-1.32c-.92-.28-.94-.92.2-1.36l16.5-6.36c.76-.28 1.42.18 1.18 1.26Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.45"
        />
      </svg>
    ),
  },
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: siteName,
  url: siteUrl,
  logo: siteLogoUrl,
  email: siteEmail,
  sameAs: siteSocialProfiles,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId,
  url: siteUrl,
  name: siteName,
  description: siteDescription,
  publisher: {
    "@id": organizationId,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themePreferenceScript }} />
        <script dangerouslySetInnerHTML={{ __html: identityHashRedirectScript }} />
        <script dangerouslySetInnerHTML={{ __html: assetLoadRecoveryScript }} />
      </head>
      <body className="antialiased">
        <RouteProgressReset />
        <div aria-hidden className="route-progress-indicator" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]),
          }}
        />
        <div className="site-grid">
          <div aria-hidden className="site-glow site-glow-left" />
          <div aria-hidden className="site-glow site-glow-right" />

          <SiteHeader />

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-24 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">{children}</main>

          <footer className="mt-8 border-t border-slate-200 bg-slate-50">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-6 pb-24 sm:px-6 sm:pb-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p className="text-center text-[13px] font-medium leading-6 text-slate-500 lg:text-left">
                © 2026 JobAdvice. All rights reserved.
              </p>

              <nav
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
                aria-label="Footer"
              >
                {footerLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[14px] font-medium text-slate-700 underline-offset-4 transition hover:text-slate-900 hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center justify-center gap-2 lg:justify-end">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </footer>

          <WhatsAppCta />
        </div>
      </body>
    </html>
  );
}
