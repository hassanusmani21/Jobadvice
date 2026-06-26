"use client";

import { useSavedJobs } from "@/lib/useSavedJobs";
import { showToast } from "@/components/Toast";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type SaveJobButtonVariant = "icon" | "detail" | "inline";

type SaveJobButtonProps = {
  slug: string;
  title: string;
  company: string;
  variant?: SaveJobButtonVariant;
  className?: string;
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0">
      <path
        d="M6 4.5h8a1.5 1.5 0 0 1 1.5 1.5V17l-5.5-3-5.5 3V6A1.5 1.5 0 0 1 6 4.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function SaveJobButton({
  slug,
  title,
  company,
  variant = "inline",
  className,
}: SaveJobButtonProps) {
  const { hasLoaded, isSavedJob, toggleSavedJob } = useSavedJobs();
  const isSaved = hasLoaded ? isSavedJob(slug) : false;
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem("jobadvice:save-pulse-seen-v1");
      if (!seen && !isSaved) {
        setPulse(true);
      }
    } catch {
      if (!isSaved) setPulse(true);
    }
  }, [isSaved]);
  const buttonLabel = isSaved ? "Saved" : "Save Job";
  const ariaLabel = `${isSaved ? "Remove" : "Save"} ${title} at ${company}`;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isSaved}
      title={ariaLabel}
      onClick={() => {
        const result = toggleSavedJob(slug);
        // result === true means job is now saved
        try {
          window.localStorage.setItem("jobadvice:save-pulse-seen-v1", "1");
        } catch {}
        setPulse(false);

        if (result) {
          trackEvent("saved_job_toggle", {
            action: "saved",
            button_variant: variant,
            company,
            job_slug: slug,
          });
          showToast(`Saved “${title}” to this device`, "success");
        } else {
          trackEvent("saved_job_toggle", {
            action: "removed",
            button_variant: variant,
            company,
            job_slug: slug,
          });
          showToast(`Removed “${title}” from saved jobs`, "muted");
        }
      }}
      className={joinClasses(
        "save-job-button",
        variant === "icon" && "save-job-button-icon",
        variant === "detail" && "save-job-button-detail",
        variant === "inline" && "save-job-button-inline",
        isSaved && "save-job-button-active",
        pulse && !isSaved && "save-pulse",
        className,
      )}
    >
      <BookmarkIcon filled={isSaved} />
      {variant === "icon" ? <span className="sr-only">{buttonLabel}</span> : <span>{buttonLabel}</span>}
    </button>
  );
}
