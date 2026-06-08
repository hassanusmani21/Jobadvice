"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  RESUME_POPUP_DISMISSED_AT_KEY,
  RESUME_POPUP_DISMISS_DURATION_MS,
} from "@/lib/resumeBuilderPromo";
import { useResumeBuilderPromo } from "@/lib/useResumeBuilderPromo";
import { trackEvent } from "@/lib/analytics";

type ResumeBuilderPromoPopupProps = {
  delayMs?: number;
  dismissForMs?: number;
  enabled?: boolean;
  requireScroll?: boolean;
  scrollThresholdPx?: number;
  storageKey?: string;
};

const featureBullets = [
  "Free to use",
  "ATS-friendly templates",
  "AI writing help",
  "Easy for freshers",
];

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-cyan-300">
      <path
        d="M5.5 10.5 8.4 13.4 14.8 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ResumeBuilderPromoPopup({
  delayMs = 3000,
  dismissForMs = RESUME_POPUP_DISMISS_DURATION_MS,
  enabled = true,
  requireScroll = false,
  scrollThresholdPx = 120,
  storageKey = RESUME_POPUP_DISMISSED_AT_KEY,
}: ResumeBuilderPromoPopupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { dismiss, isHydrated, isVisible } = useResumeBuilderPromo({
    delayMs,
    dismissForMs,
    enabled,
    requireScroll,
    scrollThresholdPx,
    storageKey,
  });
  const closeTimeoutRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  const [isMounted, setIsMounted] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsEntered(false);
      setIsMounted(false);
      return;
    }

    setIsMounted(true);

    const frameId = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isVisible]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const dismissFromKeyboard = () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      setIsEntered(false);
      closeTimeoutRef.current = window.setTimeout(() => {
        dismiss();
        setIsMounted(false);
      }, 180);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissFromKeyboard();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [dismiss, isMounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pathnameRef.current === pathname) {
      return;
    }

    pathnameRef.current = pathname;

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setIsEntered(false);
    dismiss();
    setIsMounted(false);
  }, [dismiss, pathname]);

  const handleDismiss = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setIsEntered(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      dismiss();
      setIsMounted(false);
    }, 180);
  };

  const handlePrimaryClick = () => {
    trackEvent("resume_builder_promo_click", {
      source: storageKey,
    });
    dismiss();
    setIsEntered(false);
    setIsMounted(false);
    router.push("/resume-builder");
  };

  if (!isHydrated || !isMounted) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close resume builder popup"
        onClick={handleDismiss}
        className={`pointer-events-auto absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] transition-opacity duration-200 ${
          isEntered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-builder-promo-title"
        aria-describedby="resume-builder-promo-copy"
        className={`pointer-events-auto relative w-full max-w-[28rem] overflow-hidden rounded-[1.75rem] border border-sky-400/24 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_transparent_34%),radial-gradient(circle_at_82%_0%,_rgba(6,182,212,0.16),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] p-5 text-slate-100 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.95)] transition-all duration-200 ease-out sm:p-6 ${
          isEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),transparent_45%,rgba(6,182,212,0.06))]" />

        <div className="relative">
          <button
            type="button"
            aria-label="Close popup"
            onClick={handleDismiss}
            className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-sky-300/35 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-2 focus:ring-offset-slate-950"
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

          <div className="pr-12">
            <span className="inline-flex rounded-full border border-sky-400/28 bg-sky-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sky-200">
              Resume Builder
            </span>

            <h2
              id="resume-builder-promo-title"
              className="mt-4 max-w-[18rem] text-[1.55rem] font-semibold leading-tight text-white sm:max-w-[22rem] sm:text-[1.8rem]"
            >
              Explore the free resume builder
            </h2>

            <p
              id="resume-builder-promo-copy"
              className="mt-3 text-sm leading-6 text-slate-300 sm:text-[0.95rem]"
            >
              ATS-friendly templates, AI writing help, and a fresher-friendly flow
              to build a cleaner resume in minutes.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Perfect for freshers, internships, BPO, support roles, and entry-level
              job seekers.
            </p>
          </div>

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {featureBullets.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm font-medium text-slate-200"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/12">
                  <CheckIcon />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#1d4ed8_48%,#06b6d4)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-20px_rgba(37,99,235,0.9)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Explore Resume Builder
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-950 sm:min-w-[9.75rem]"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
