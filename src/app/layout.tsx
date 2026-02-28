import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const identityHashRedirectScript = `
  (function () {
    if (typeof window === "undefined") return;
    var hash = window.location.hash || "";
    var pathname = window.location.pathname || "/";
    var identityHashPattern = /(recovery_token|confirmation_token|invite_token|email_change_token|type=recovery|type=invite|type=signup)/i;

    if (pathname !== "/" || !hash || !identityHashPattern.test(hash)) {
      return;
    }

    window.location.replace("/admin/" + hash);
  })();
`;

const resolvedMetadataBase = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("https://jobadvice.netlify.app");
  }
})();

export const metadata: Metadata = {
  metadataBase: resolvedMetadataBase,
  title: {
    default: "JobAdvice | Latest Job Updates and Career Opportunities",
    template: "%s | JobAdvice",
  },
  description:
    "JobAdvice publishes verified job updates with full details, skills, and direct application links.",
  keywords: [
    "job updates",
    "latest jobs",
    "job listings",
    "career opportunities",
    "apply jobs",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "JobAdvice",
    description:
      "Explore daily job updates with company, salary, skills, and direct apply links.",
    url: "/",
    siteName: "JobAdvice",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobAdvice",
    description:
      "Explore daily job updates with company, salary, skills, and direct apply links.",
  },
};

const navigation = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: identityHashRedirectScript }} />
      </head>
      <body className="antialiased">
        <div className="site-grid">
          <div aria-hidden className="site-glow site-glow-left" />
          <div aria-hidden className="site-glow site-glow-right" />

          <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="fade-up flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/75 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
              <Link href="/" aria-label="JobAdvice Home" className="inline-flex items-center">
                <Image
                  src="/jobadvice-logo.svg"
                  alt="JobAdvice"
                  width={220}
                  height={76}
                  priority
                  className="h-auto w-[150px] sm:w-[190px]"
                />
              </Link>
              <nav className="flex flex-wrap gap-1 text-sm font-semibold text-slate-600" aria-label="Primary">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-1.5 transition-colors hover:bg-teal-50 hover:text-teal-900"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/admin"
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-white transition-colors hover:bg-slate-700"
                >
                  Admin Login
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</main>

          <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/75 px-5 py-5 text-sm text-slate-600 shadow-md backdrop-blur-sm sm:px-7">
              <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-teal-200/40 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl" />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-800">© 2026 JobAdvice. All rights reserved.</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Trusted job updates, direct apply links, and practical career insights.
                  </p>
                </div>

                <nav className="flex flex-wrap items-center gap-2" aria-label="Footer">
                  <Link
                    href="/about"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
                  >
                    Privacy Policy
                  </Link>
                </nav>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
