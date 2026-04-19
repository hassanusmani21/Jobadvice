"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  markJobAlertPopupCompleted,
  markJobAlertPopupDismissed,
} from "@/lib/jobAlertPopup";
import { trackEvent } from "@/lib/analytics";
import { getAllJobSegmentConfigs, type JobSegmentSlug } from "@/lib/jobSegments";

type JobAlertWelcomePopupProps = {
  delayMs?: number;
  locationOptions: string[];
  onSettled?: () => void;
  skillOptions: string[];
  titleOptions: string[];
};

type SubmitState =
  | { tone: "idle"; message: string }
  | { tone: "success"; message: string }
  | { tone: "error"; message: string };

const initialSubmitState: SubmitState = {
  tone: "idle",
  message: "",
};

export default function JobAlertWelcomePopup({
  delayMs = 2500,
  locationOptions,
  onSettled,
  skillOptions,
  titleOptions,
}: JobAlertWelcomePopupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<JobSegmentSlug | "">("");
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const categoryOptions = useMemo(() => getAllJobSegmentConfigs(), []);
  const closeTimeoutRef = useRef<number | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  const closePopup = useCallback(
    (afterClose?: () => void) => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }

      setIsEntered(false);
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsMounted(false);
        afterClose?.();
        onSettled?.();
      }, 180);
    },
    [onSettled],
  );

  const handleDismiss = useCallback(() => {
    markJobAlertPopupDismissed();
    closePopup();
  }, [closePopup]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDelayElapsed(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [delayMs]);

  useEffect(() => {
    if (!delayElapsed) {
      return;
    }

    setIsMounted(true);

    const frameId = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [delayElapsed]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [handleDismiss, isMounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState(initialSubmitState);

    const filters = {
      query: selectedTitle.trim(),
      skill: selectedSkill.trim(),
      locations: selectedLocation ? [selectedLocation] : [],
      segments: selectedSegment ? [selectedSegment] : [],
    };

    if (
      !filters.query &&
      !filters.skill &&
      filters.locations.length === 0 &&
      filters.segments.length === 0
    ) {
      setSubmitState({
        tone: "error",
        message: "Choose a category, city, role, or skill before subscribing.",
      });
      return;
    }

    if (!name.trim()) {
      setSubmitState({
        tone: "error",
        message: "Enter your name so we can personalize your alerts.",
      });
      return;
    }

    if (!email.trim()) {
      setSubmitState({
        tone: "error",
        message: "Enter your email to start the daily alert.",
      });
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/job-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          filters,
          name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setSubmitState({
          tone: "error",
          message: payload?.message || "We couldn't create your alert right now. Please try again.",
        });
        return;
      }

      markJobAlertPopupCompleted();
      setSubmitState({
        tone: "success",
        message:
          payload?.message ||
          "Alert active. We'll send fresh matching jobs to your inbox daily.",
      });
      trackEvent("job_alert_signup", {
        alert_source: "homepage_popup",
        locations: filters.locations.join(","),
        query: filters.query || "",
        segments: filters.segments.join(","),
        skill: filters.skill || "",
      });

      successTimeoutRef.current = window.setTimeout(() => {
        closePopup();
      }, 1400);
    } catch {
      setSubmitState({
        tone: "error",
        message: "We couldn't create your alert right now. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[95]">
      <button
        type="button"
        aria-label="Close job alert popup"
        onClick={handleDismiss}
        className={`pointer-events-auto absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] transition-opacity duration-200 ${
          isEntered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-alert-popup-heading"
          aria-describedby="job-alert-popup-copy"
          className={`pointer-events-auto relative w-full max-w-[42rem] overflow-hidden rounded-[1.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(180deg,_rgba(15,23,42,0.99),_rgba(2,6,23,0.98))] text-slate-100 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.95)] transition-all duration-200 ease-out ${
            isEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_45%,rgba(16,185,129,0.05))]" />

          <div className="relative px-4 py-4 sm:px-5 sm:py-4">
            <button
              type="button"
              aria-label="Close popup"
              onClick={handleDismiss}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 sm:right-5 sm:top-4"
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
              <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Daily Job Alerts
              </span>

              <h2
                id="job-alert-popup-heading"
                className="mt-3 text-[1.1rem] font-semibold leading-tight text-white sm:text-[1.3rem]"
              >
                Create your alert
              </h2>

              <p
                id="job-alert-popup-copy"
                className="mt-1.5 text-[0.82rem] leading-5 text-slate-300 sm:text-[0.88rem]"
              >
                Stay ahead.{" "}
                <span className="font-semibold text-emerald-200">
                  Get a daily email when new jobs match your preferences.
                </span>
              </p>
            </div>

            <form
              className="mt-3 rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur"
              onSubmit={handleSubmit}
            >
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label
                    htmlFor="job-alert-popup-name"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Name
                  </label>
                  <input
                    id="job-alert-popup-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 text-[0.92rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-email"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Email
                  </label>
                  <input
                    id="job-alert-popup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email"
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 text-[0.92rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-title"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Job Title
                  </label>
                  <select
                    id="job-alert-popup-title"
                    value={selectedTitle}
                    onChange={(event) => setSelectedTitle(event.target.value)}
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 pr-8 text-[0.92rem] text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Any title</option>
                    {titleOptions.map((titleOption) => (
                      <option key={titleOption} value={titleOption}>
                        {titleOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-skill"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Skill
                  </label>
                  <select
                    id="job-alert-popup-skill"
                    value={selectedSkill}
                    onChange={(event) => setSelectedSkill(event.target.value)}
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 pr-8 text-[0.92rem] text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Any skill</option>
                    {skillOptions.map((skillOption) => (
                      <option key={skillOption} value={skillOption}>
                        {skillOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-category"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Category
                  </label>
                  <select
                    id="job-alert-popup-category"
                    value={selectedSegment}
                    onChange={(event) =>
                      setSelectedSegment(event.target.value as JobSegmentSlug | "")
                    }
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 pr-8 text-[0.92rem] text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Any category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-city"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Preferred City
                  </label>
                  <select
                    id="job-alert-popup-city"
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocation(event.target.value)}
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 pr-8 text-[0.92rem] text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Any city</option>
                    {locationOptions.map((locationOption) => (
                      <option key={locationOption} value={locationOption}>
                        {locationOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-10 w-full items-center justify-center rounded-[0.95rem] bg-emerald-400 px-4 text-sm font-semibold text-slate-950 shadow-[0_16px_30px_-20px_rgba(16,185,129,0.9)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  {isPending ? "Creating Alert..." : "Get Alerts"}
                </button>
              </div>
            </form>

            {submitState.tone !== "idle" ? (
              <div
                className={`job-alert-feedback mt-3 ${
                  submitState.tone === "success" ? "job-alert-feedback-success" : "job-alert-feedback-error"
                }`}
                aria-live="polite"
              >
                <span className="job-alert-feedback-icon" aria-hidden="true">
                  {submitState.tone === "success" ? "✓" : "!"}
                </span>
                <span>{submitState.message}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
