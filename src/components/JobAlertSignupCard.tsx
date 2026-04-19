"use client";

import { useMemo, useState, useTransition } from "react";
import {
  buildJobAlertSummary,
  hasActiveJobAlertFilters,
  type JobAlertFilters,
} from "@/lib/jobFilters";
import { trackEvent } from "@/lib/analytics";

type JobAlertSignupCardProps = {
  filters: JobAlertFilters;
};

type SubmitState =
  | { tone: "idle"; message: string }
  | { tone: "success"; message: string }
  | { tone: "error"; message: string };

const initialState: SubmitState = {
  tone: "idle",
  message: "",
};

const focusJobsFilters = () => {
  const filterField =
    document.getElementById("jobs-search") ||
    document.getElementById("jobs-mobile-search");

  if (!filterField) {
    return;
  }

  filterField.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  window.setTimeout(() => {
    if (
      filterField instanceof HTMLInputElement ||
      filterField instanceof HTMLSelectElement ||
      filterField instanceof HTMLTextAreaElement
    ) {
      filterField.focus({ preventScroll: true });
    }
  }, 180);
};

export default function JobAlertSignupCard({
  filters,
}: JobAlertSignupCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>(initialState);
  const [isPending, startTransition] = useTransition();
  const hasActiveFilters = useMemo(() => hasActiveJobAlertFilters(filters), [filters]);
  const filterSummary = useMemo(() => buildJobAlertSummary(filters), [filters]);

  return (
    <div className="fade-up job-alert-card card-surface">
      <div className="job-alert-card-copy">
        <p className="jobs-directory-kicker">Daily Job Alerts</p>
        <h2 className="job-alert-card-title">Turn this search into a daily email alert.</h2>
        <p className="job-alert-card-text">
          We will send the newest matching live jobs once a day for <strong>{filterSummary}</strong>.
        </p>
      </div>

      {hasActiveFilters ? (
        <form
          className="job-alert-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitState(initialState);

            startTransition(async () => {
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

                setSubmitState({
                  tone: "success",
                  message: payload?.message || "Alert active. We'll send matching jobs to your inbox daily.",
                });
                trackEvent("job_alert_signup", {
                  alert_source: "jobs_page_card",
                  locations: filters.locations.join(","),
                  query: filters.query || "",
                  segments: filters.segments.join(","),
                  skill: filters.skill || "",
                  type: filters.type || "",
                });
                setEmail("");
                setName("");
              } catch {
                setSubmitState({
                  tone: "error",
                  message: "We couldn't create your alert right now. Please try again.",
                });
              }
            });
          }}
        >
          <div className="job-alert-form-fields">
            <label className="job-alert-field">
              <span className="sr-only">Your name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
                className="form-control job-alert-input"
              />
            </label>

            <label className="job-alert-field">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email for daily alerts"
                autoComplete="email"
                required
                className="form-control job-alert-input"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="job-alert-submit-button"
          >
            {isPending ? "Creating Alert..." : "Create Alert"}
          </button>
        </form>
      ) : (
        <div className="job-alert-empty">
          <p className="job-alert-empty-text">
            Pick at least one filter, then create an alert for that exact search.
          </p>
          <button
            type="button"
            className="job-alert-link"
            onClick={focusJobsFilters}
          >
            Start with a filtered search
          </button>
        </div>
      )}

      {submitState.tone !== "idle" ? (
        <div
          className={`job-alert-feedback ${
            submitState.tone === "success" ? "job-alert-feedback-success" : "job-alert-feedback-error"
          }`}
          aria-live="polite"
        >
          <span className="job-alert-feedback-icon" aria-hidden="true">
            {submitState.tone === "success" ? "✓" : "!"}
          </span>
          <span>{submitState.message}</span>
        </div>
      ) : (
        <p className="job-alert-footnote">
          One digest per day for this filter. Unsubscribe from any email with a single click.
        </p>
      )}
    </div>
  );
}
