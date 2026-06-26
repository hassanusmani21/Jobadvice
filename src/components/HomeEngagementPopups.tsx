"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import JobAlertWelcomePopup from "@/components/JobAlertWelcomePopup";
import ResumeBuilderPromoPopup from "@/components/ResumeBuilderPromoPopup";
import {
  JOB_ALERT_POPUP_COMPLETED_AT_KEY,
  JOB_ALERT_POPUP_DISMISSED_AT_KEY,
  hasActiveJobAlertPopupDismissal,
  hasCompletedJobAlertPopup,
} from "@/lib/jobAlertPopup";
import { RESUME_POPUP_DISMISSED_AT_KEY } from "@/lib/resumeBuilderPromo";

type HomeEngagementPopupsProps = {
  skillOptions: string[];
  titleOptions: string[];
};

const JOB_ALERT_DELAY_MS = 3000;
const RESUME_POPUP_DELAY_MS = 50000;
const resumePromoStorageKey = RESUME_POPUP_DISMISSED_AT_KEY;

export default function HomeEngagementPopups({
  skillOptions,
  titleOptions,
}: HomeEngagementPopupsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showJobAlertPopup, setShowJobAlertPopup] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);
  const isHomepage = pathname === "/";
  const popupOverride = searchParams.get("popup");
  const shouldResetPopups = searchParams.get("reset-popups") === "1";
  const supportsJobAlertPopup =
    isHomepage ||
    pathname === "/jobs" ||
    pathname.startsWith("/jobs/");
  const supportsResumePromo = isHomepage;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setShowJobAlertPopup(false);
    setResumeReady(false);

    if (shouldResetPopups && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(JOB_ALERT_POPUP_DISMISSED_AT_KEY);
        window.localStorage.removeItem(JOB_ALERT_POPUP_COMPLETED_AT_KEY);
        window.localStorage.removeItem(resumePromoStorageKey);
      } catch {}
    }

    const timerIds: number[] = [];

    if (popupOverride === "job-alert" && supportsJobAlertPopup) {
      setShowJobAlertPopup(true);
    } else if (supportsJobAlertPopup) {
      const skipJobAlertPopup =
        hasCompletedJobAlertPopup() || hasActiveJobAlertPopupDismissal();

      if (!skipJobAlertPopup) {
        timerIds.push(window.setTimeout(() => {
          setShowJobAlertPopup(true);
        }, JOB_ALERT_DELAY_MS));
      }
    }

    if (popupOverride === "resume" && supportsResumePromo) {
      timerIds.push(window.setTimeout(() => {
        setResumeReady(true);
      }, 0));
    } else if (supportsResumePromo) {
      timerIds.push(window.setTimeout(() => {
        setResumeReady(true);
      }, RESUME_POPUP_DELAY_MS));
    }

    return () => {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [
    isHydrated,
    pathname,
    popupOverride,
    shouldResetPopups,
    supportsJobAlertPopup,
    supportsResumePromo,
  ]);

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {showJobAlertPopup ? (
        <JobAlertWelcomePopup
          delayMs={0}
          skillOptions={skillOptions}
          titleOptions={titleOptions}
          onSettled={() => {
            setShowJobAlertPopup(false);
          }}
        />
      ) : null}

      {supportsResumePromo && resumeReady && !showJobAlertPopup ? (
        <ResumeBuilderPromoPopup
          delayMs={0}
          storageKey={resumePromoStorageKey}
        />
      ) : null}
    </>
  );
}
