"use client";

import Image from "next/image";
import Link from "@/components/AppLink";
import ThemeToggle from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavigationItem = {
  href: string;
  label: string;
};

const navigation: NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-4 pt-3 sm:static sm:px-6 sm:pt-6 lg:px-8">
      <div className="fade-up relative rounded-2xl border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="JobAdvice Home" className="inline-flex items-center">
            <Image
              src="/jobadvice-logo.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="h-auto w-[132px] sm:w-[190px]"
            />
          </Link>

          <nav
            className="hidden flex-wrap items-center gap-1 text-sm font-semibold text-slate-600 sm:flex"
            aria-label="Primary"
          >
            {navigation.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-xl px-3 py-1.5 transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-900"
                      : "hover:bg-teal-50 hover:text-teal-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <ThemeToggle />
            <Link
              href="/admin"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition-colors hover:border-teal-200 hover:text-teal-900"
            >
              Admin
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/jobs"
              aria-label="Search jobs"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.22)] transition hover:border-teal-200 hover:text-teal-900"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
              >
                <path
                  d="m14.5 14.5 3 3m-1.5-8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </Link>
            <ThemeToggle compact />

            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-site-menu"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-[0_18px_34px_-26px_rgba(15,23,42,0.4)] transition hover:bg-slate-700"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={`h-5 w-5 transition-transform ${isMenuOpen ? "rotate-90" : ""}`}
              >
                <path
                  d={isMenuOpen ? "M5 5 15 15M15 5 5 15" : "M3 5h14M3 10h14M3 15h14"}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-[1px] sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <div
              id="mobile-site-menu"
              className="absolute inset-x-0 top-full z-50 mt-3 sm:hidden"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/85 bg-white/96 p-4 shadow-[0_26px_50px_-36px_rgba(15,23,42,0.26)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700">
                    Navigation
                  </p>
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-900"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                      <path
                        d="M5 5 15 15M15 5 5 15"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-5 grid gap-3">
                  {navigation.map((item) => {
                    const isActive = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`rounded-xl border px-4 py-4 transition ${
                          isActive
                            ? "border-teal-200 bg-teal-50 text-teal-950"
                            : "border-slate-200/80 bg-white/80 text-slate-800 hover:border-teal-200 hover:bg-teal-50/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-semibold">{item.label}</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                              isActive
                                ? "bg-teal-900 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isActive ? "Current" : "Open"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <Link
                    href="/admin"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-teal-200 hover:text-teal-900"
                  >
                    Admin
                  </Link>
                </div>

              </div>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
