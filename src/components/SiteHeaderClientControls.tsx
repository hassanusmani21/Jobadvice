"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "@/components/AppLink";
import SavedJobsHeaderLink from "@/components/SavedJobsHeaderLink";
import {
  ChevronRightIcon,
  MenuIcon,
  ResumeIcon,
} from "@/components/SiteHeaderIcons";
import ThemeToggle from "@/components/ThemeToggle";
import { isActivePath, primaryNavigation } from "@/lib/navigation";

type SiteHeaderClientControlsProps = {
  mode: "desktop" | "mobile";
};

export default function SiteHeaderClientControls({
  mode,
}: SiteHeaderClientControlsProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isResumeActive = isActivePath(pathname, "/resume-builder");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mode !== "mobile" || !isMenuOpen) {
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
  }, [isMenuOpen, mode]);

  if (mode === "desktop") {
    return (
      <div className="flex items-center justify-end gap-2.5">
        <Link
          href="/resume-builder"
          aria-current={isResumeActive ? "page" : undefined}
          className={`header-resume-link inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[0.84rem] font-semibold transition ${
            isResumeActive
              ? "bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_48%,#06b6d4_100%)] text-white shadow-[0_10px_22px_-18px_rgba(37,99,235,0.42)]"
              : "bg-[linear-gradient(135deg,#2563eb_0%,#1d4ed8_48%,#06b6d4_100%)] text-white shadow-[0_10px_22px_-18px_rgba(37,99,235,0.36)] hover:-translate-y-px hover:shadow-[0_14px_26px_-18px_rgba(37,99,235,0.44)]"
          }`}
        >
          <ResumeIcon />
          Build Resume
        </Link>
        <SavedJobsHeaderLink />
        <ThemeToggle />
      </div>
    );
  }

  const mobileMenu = isMenuOpen ? (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        className="mobile-menu-backdrop fixed inset-0 z-[70] sm:hidden"
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        id="mobile-site-menu"
        className="fixed inset-x-4 bottom-4 top-[4.6rem] z-[80] mx-auto w-auto max-w-[22rem] sm:hidden"
      >
        <div className="mobile-menu-surface flex h-full flex-col overflow-hidden p-[1.05rem]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 pb-3">
            <div className="space-y-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-blue-700">
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
              className="mobile-menu-close inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
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
                ? "bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_48%,#06b6d4_100%)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.3)]"
                : "bg-[linear-gradient(135deg,#2563eb_0%,#1d4ed8_48%,#06b6d4_100%)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.28)] hover:-translate-y-px hover:shadow-[0_10px_20px_rgba(37,99,235,0.34)]"
            }`}
          >
            <ResumeIcon />
            Build Resume
          </Link>

          <div className="mt-4 grid flex-1 content-start gap-2.5 overflow-y-auto pr-1">
            {primaryNavigation.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`interactive-tile mobile-menu-tile rounded-[1rem] border px-4 py-3.5 transition ${
                    isActive
                      ? "border-blue-200 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(6,182,212,0.1))] text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_28px_-24px_rgba(37,99,235,0.2)]"
                      : "text-slate-800 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold">{item.label}</p>
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
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
  ) : null;

  return (
    <>
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

      {isMounted && mobileMenu ? createPortal(mobileMenu, document.body) : null}
    </>
  );
}
