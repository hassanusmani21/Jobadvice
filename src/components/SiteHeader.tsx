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
  const [hasScrolled, setHasScrolled] = useState(false);

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

  useEffect(() => {
    const updateScrollState = () => {
      const isScrolled = window.scrollY > 10;
      setHasScrolled((previous) => (previous === isScrolled ? previous : isScrolled));
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const shouldElevateHeader = hasScrolled || isMenuOpen;

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-3 pt-2.5 min-[360px]:px-4 min-[360px]:pt-3 sm:px-6 sm:pt-4 lg:px-8">
      <div
        className={`fade-up header-shell relative rounded-2xl px-3 py-2.5 min-[360px]:px-4 min-[360px]:py-3 sm:px-6 ${
          shouldElevateHeader ? "header-shell-scrolled" : "header-shell-top"
        }`}
      >
        <div className="hidden items-center gap-4 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Link href="/" aria-label="JobAdvice Home" className="inline-flex items-center">
            <Image
              src="/jobadvice-logo.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-light h-auto w-[132px] sm:w-[190px]"
            />
            <Image
              src="/jobadvice-logo-dark.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-dark h-auto w-[132px] sm:w-[190px]"
            />
          </Link>

          <nav
            className="mx-auto flex flex-wrap items-center justify-center gap-1 text-sm font-semibold text-slate-600"
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
                      ? "bg-teal-50 text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                      : "hover:bg-teal-50/80 hover:text-teal-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <Link
              href="/admin"
              className="utility-button px-3 py-1.5 text-sm font-semibold"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Link href="/" aria-label="JobAdvice Home" className="inline-flex min-w-0 items-center">
            <Image
              src="/jobadvice-logo.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-light h-auto max-w-full w-[108px] min-[360px]:w-[120px]"
            />
            <Image
              src="/jobadvice-logo-dark.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-dark h-auto max-w-full w-[108px] min-[360px]:w-[120px]"
            />
          </Link>

          <div className="flex items-center gap-1.5 min-[360px]:gap-2">
            <Link
              href="/jobs"
              aria-label="Search jobs"
              className="utility-button h-10 w-10 px-0 min-[360px]:h-11 min-[360px]:w-11"
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
              className={`utility-button header-menu-toggle h-10 w-10 px-0 min-[360px]:h-11 min-[360px]:w-11 ${
                isMenuOpen ? "header-menu-toggle-active" : ""
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={`h-[18px] w-[18px] transition-transform min-[360px]:h-5 min-[360px]:w-5 ${isMenuOpen ? "rotate-90" : ""}`}
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
              className="mobile-menu-backdrop fixed inset-0 z-40 sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <div
              id="mobile-site-menu"
              className="absolute inset-x-0 top-full z-50 mt-3 sm:hidden"
            >
              <div className="mobile-menu-surface overflow-hidden p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700">
                    Navigation
                  </p>
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setIsMenuOpen(false)}
                    className="utility-button h-10 w-10 rounded-full px-0"
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
                        className={`interactive-tile mobile-menu-tile rounded-xl border px-4 py-4 transition ${
                          isActive
                            ? "border-teal-200 bg-teal-50 text-teal-950"
                            : "text-slate-800"
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
                    className="utility-button w-full px-4 py-3 text-sm font-semibold"
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
