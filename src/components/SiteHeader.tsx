"use client";

import Image from "next/image";
import Link from "@/components/AppLink";
import SavedJobsHeaderLink from "@/components/SavedJobsHeaderLink";
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

function ResumeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0">
      <path
        d="M6.25 3.75h5.9l2.6 2.6v9.4a.5.5 0 0 1-.5.5h-8.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12.15 3.75v2.6h2.6M7.7 9h4.6M7.7 11.6h4.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MenuIcon({
  open,
  className = "h-4 w-4 shrink-0",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
      {open ? (
        <path
          d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.9"
        />
      ) : (
        <path
          d="M4.75 6h10.5M4.75 10h10.5M4.75 14h10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.9"
        />
      )}
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
      <path
        d="M8 5.75 12.75 10 8 14.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const isResumeActive = isActivePath(pathname, "/resume-builder");

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
    <header className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-3 pt-1.5 min-[360px]:px-4 min-[360px]:pt-2 sm:px-6 sm:pt-2.5 lg:px-8 lg:pt-2">
      <div
        className={`fade-up header-shell relative rounded-[1.15rem] px-3 py-2.5 min-[360px]:px-3.5 sm:rounded-2xl sm:px-4 sm:py-2.5 lg:px-[1.05rem] ${
          shouldElevateHeader ? "header-shell-scrolled" : "header-shell-top"
        }`}
      >
        <div className="hidden items-center gap-3.5 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto]">
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
            className="header-primary-nav mx-auto flex flex-wrap items-center justify-center gap-1 px-1.5 py-1 text-[0.83rem] font-semibold text-slate-600 lg:gap-1"
            aria-label="Primary"
          >
            {navigation.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`header-primary-link rounded-[0.8rem] px-3 py-1.5 transition-[background-color,color,box-shadow] lg:px-3 lg:py-1.5 ${
                    isActive
                      ? "header-primary-link-active"
                      : "hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2.5">
            <Link
              href="/resume-builder"
              aria-current={isResumeActive ? "page" : undefined}
              className={`header-resume-link inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[0.84rem] font-semibold transition ${
                isResumeActive
                  ? "bg-[linear-gradient(135deg,#0f8f77_0%,#16a085_55%,#1abc9c_100%)] text-white shadow-[0_10px_22px_-18px_rgba(26,188,156,0.48)]"
                  : "bg-[linear-gradient(135deg,#16a085_0%,#1abc9c_100%)] text-white shadow-[0_10px_22px_-18px_rgba(26,188,156,0.42)] hover:-translate-y-px hover:shadow-[0_14px_26px_-18px_rgba(26,188,156,0.46)]"
              }`}
            >
              <ResumeIcon />
              Build Resume
            </Link>
            <SavedJobsHeaderLink />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 sm:hidden">
          <Link href="/" aria-label="JobAdvice Home" className="inline-flex min-w-0 items-center">
            <Image
              src="/jobadvice-logo.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-light h-auto w-[104px] max-w-full min-[360px]:w-[116px]"
            />
            <Image
              src="/jobadvice-logo-dark.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-dark h-auto w-[104px] max-w-full min-[360px]:w-[116px]"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <SavedJobsHeaderLink mobile />
            <ThemeToggle compact />

            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-site-menu"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setIsMenuOpen((open) => !open)}
              className={`utility-button header-menu-toggle h-9 w-9 px-0 min-[360px]:h-10 min-[360px]:w-10 ${
                isMenuOpen ? "header-menu-toggle-active" : ""
              }`}
            >
              <MenuIcon
                open={isMenuOpen}
                className={`h-[17px] w-[17px] shrink-0 transition-transform min-[360px]:h-[18px] min-[360px]:w-[18px] ${isMenuOpen ? "rotate-90" : ""}`}
              />
            </button>
          </div>
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
            className="fixed inset-x-4 bottom-4 top-[4.6rem] z-50 mx-auto w-auto max-w-[22rem] sm:hidden"
          >
            <div className="mobile-menu-surface flex h-full flex-col overflow-hidden p-[1.05rem]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
                <div className="space-y-1">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-700">
                    Menu
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Quick navigation
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMenuOpen(false)}
                  className="mobile-menu-close inline-flex h-10 w-10 items-center justify-center rounded-xl border transition"
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

                <Link
                  href="/resume-builder"
                  aria-current={isResumeActive ? "page" : undefined}
                  className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] px-4 text-sm font-semibold transition ${
                    isResumeActive
                      ? "bg-[linear-gradient(135deg,#0f8f77_0%,#16a085_55%,#1abc9c_100%)] text-white shadow-[0_4px_14px_rgba(26,188,156,0.35)]"
                      : "bg-[linear-gradient(135deg,#16a085_0%,#1abc9c_100%)] text-white shadow-[0_4px_14px_rgba(26,188,156,0.35)] hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(26,188,156,0.4)]"
                }`}
              >
                <ResumeIcon />
                Build Resume
                </Link>

              <div className="mt-4 grid flex-1 content-start gap-2.5 overflow-y-auto pr-1">
                {navigation.map((item) => {
                  const isActive = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`interactive-tile mobile-menu-tile rounded-[1rem] border px-4 py-3.5 transition ${
                        isActive
                          ? "border-teal-200 bg-teal-50 text-teal-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_28px_-24px_rgba(13,148,136,0.24)]"
                          : "text-slate-800 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold">{item.label}</p>
                        <span
                          className={`inline-flex items-center justify-center rounded-full ${
                            isActive ? "bg-teal-900 text-white" : "bg-slate-100 text-slate-400"
                          } h-8 w-8`}
                        >
                          <ChevronRightIcon className="h-4 w-4 shrink-0" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
