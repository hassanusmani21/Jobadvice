"use client";

import { useEffect, useState } from "react";
import {
  hasActiveResumePopupDismissal,
  markResumePopupDismissed,
  RESUME_POPUP_DISMISSED_AT_KEY,
  RESUME_POPUP_DISMISS_DURATION_MS,
} from "@/lib/resumeBuilderPromo";

type UseResumeBuilderPromoOptions = {
  delayMs?: number;
  dismissForMs?: number;
  enabled?: boolean;
  requireScroll?: boolean;
  scrollThresholdPx?: number;
  storageKey?: string;
};

export function useResumeBuilderPromo({
  delayMs = 3000,
  dismissForMs = RESUME_POPUP_DISMISS_DURATION_MS,
  enabled = true,
  requireScroll = false,
  scrollThresholdPx = 120,
  storageKey = RESUME_POPUP_DISMISSED_AT_KEY,
}: UseResumeBuilderPromoOptions = {}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [hasScrolledEnough, setHasScrolledEnough] = useState(!requireScroll);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !enabled) {
      return;
    }

    if (hasActiveResumePopupDismissal({ dismissForMs, storageKey })) {
      return;
    }

    setHasScrolledEnough(!requireScroll || window.scrollY >= scrollThresholdPx);

    const handleScroll = () => {
      if (window.scrollY >= scrollThresholdPx) {
        setHasScrolledEnough(true);
      }
    };

    const timerId = window.setTimeout(() => {
      setDelayElapsed(true);
    }, delayMs);

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [delayMs, dismissForMs, enabled, isHydrated, requireScroll, scrollThresholdPx, storageKey]);

  useEffect(() => {
    if (!isHydrated || !enabled || !delayElapsed) {
      return;
    }

    if (requireScroll && !hasScrolledEnough) {
      return;
    }

    if (hasActiveResumePopupDismissal({ dismissForMs, storageKey })) {
      return;
    }

    setIsVisible(true);
  }, [
    delayElapsed,
    dismissForMs,
    enabled,
    hasScrolledEnough,
    isHydrated,
    requireScroll,
    storageKey,
  ]);

  const dismiss = () => {
    markResumePopupDismissed({ storageKey });
    setIsVisible(false);
  };

  return {
    dismiss,
    isHydrated,
    isVisible,
  };
}
