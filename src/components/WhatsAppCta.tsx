"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/L6Qh1hBedLZ3vfL3kQMB4r";
const DISMISS_STORAGE_KEY = "jobadvice-whatsapp-bubble-dismissed-until";
const SESSION_COUNT_STORAGE_KEY = "jobadvice-whatsapp-bubble-session-count";
const INITIAL_DELAY_MS = 6000;
const AUTO_HIDE_DELAY_MS = 7000;
const REAPPEAR_DELAY_MS = 60000;
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSION_DISPLAYS = 3;

export default function WhatsAppCta() {
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const autoHideTimerRef = useRef<number | null>(null);
  const triggerTimerRef = useRef<number | null>(null);
  const sessionDisplayCountRef = useRef(0);
  const hasTriggeredScrollRef = useRef(false);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const clearTriggerTimer = useCallback(() => {
    if (triggerTimerRef.current !== null) {
      window.clearTimeout(triggerTimerRef.current);
      triggerTimerRef.current = null;
    }
  }, []);

  const scheduleAutoHide = useCallback(() => {
    clearAutoHideTimer();
    autoHideTimerRef.current = window.setTimeout(() => {
      setIsBubbleVisible(false);
    }, AUTO_HIDE_DELAY_MS);
  }, [clearAutoHideTimer]);

  const scheduleRecurringPrompt = useCallback(() => {
    clearTriggerTimer();
    triggerTimerRef.current = window.setTimeout(() => {
      if (sessionDisplayCountRef.current < MAX_SESSION_DISPLAYS && !isDismissed) {
        setIsBubbleVisible(true);
        sessionDisplayCountRef.current += 1;
        try {
          window.sessionStorage.setItem(
            SESSION_COUNT_STORAGE_KEY,
            String(sessionDisplayCountRef.current),
          );
        } catch {
          // Ignore storage failures; in-memory count still protects this session.
        }
        scheduleAutoHide();
        scheduleRecurringPrompt();
      }
    }, REAPPEAR_DELAY_MS);
  }, [clearTriggerTimer, isDismissed, scheduleAutoHide]);

  const showBubble = useCallback(() => {
    if (isDismissed || sessionDisplayCountRef.current >= MAX_SESSION_DISPLAYS) {
      return;
    }

    setIsBubbleVisible(true);
    sessionDisplayCountRef.current += 1;

    try {
      window.sessionStorage.setItem(
        SESSION_COUNT_STORAGE_KEY,
        String(sessionDisplayCountRef.current),
      );
    } catch {
      // Ignore storage failures; in-memory count still protects this session.
    }

    scheduleAutoHide();
  }, [isDismissed, scheduleAutoHide]);

  useEffect(() => {
    try {
      const storedDismissedUntil = Number.parseInt(
        window.localStorage.getItem(DISMISS_STORAGE_KEY) || "",
        10,
      );
      const hasDismissed =
        Number.isFinite(storedDismissedUntil) && storedDismissedUntil > Date.now();

      setIsDismissed(hasDismissed);

      const sessionCount = Number.parseInt(
        window.sessionStorage.getItem(SESSION_COUNT_STORAGE_KEY) || "0",
        10,
      );
      sessionDisplayCountRef.current = Number.isFinite(sessionCount) ? sessionCount : 0;
    } catch {
      setIsDismissed(false);
      sessionDisplayCountRef.current = 0;
      return;
    }
  }, []);

  useEffect(() => {
    if (isDismissed || sessionDisplayCountRef.current >= MAX_SESSION_DISPLAYS) {
      return;
    }

    triggerTimerRef.current = window.setTimeout(() => {
      showBubble();
      scheduleRecurringPrompt();
    }, INITIAL_DELAY_MS);

    const handleScroll = () => {
      if (
        hasTriggeredScrollRef.current ||
        isDismissed ||
        sessionDisplayCountRef.current >= MAX_SESSION_DISPLAYS
      ) {
        return;
      }

      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const scrollProgress = window.scrollY / scrollableHeight;
      if (scrollProgress >= 0.4) {
        hasTriggeredScrollRef.current = true;
        showBubble();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearAutoHideTimer();
      clearTriggerTimer();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [clearAutoHideTimer, clearTriggerTimer, isDismissed, scheduleRecurringPrompt, showBubble]);

  const dismissBubble = useCallback(() => {
    clearAutoHideTimer();
    clearTriggerTimer();
    setIsDismissed(true);
    setIsBubbleVisible(false);

    try {
      window.localStorage.setItem(
        DISMISS_STORAGE_KEY,
        String(Date.now() + DISMISS_DURATION_MS),
      );
    } catch {
      // Ignore storage failures and still hide the bubble for the current session.
    }
  }, [clearAutoHideTimer, clearTriggerTimer]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto relative flex flex-col items-end gap-3">
        {isBubbleVisible ? (
          <div
            className="fade-up w-[min(15rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] sm:absolute sm:bottom-1/2 sm:right-[calc(100%+0.75rem)] sm:mb-0 sm:w-64 sm:translate-y-1/2"
            style={{ animationDuration: "360ms" }}
          >
            <button
              type="button"
              aria-label="Dismiss WhatsApp group invitation"
              onClick={dismissBubble}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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

            <p className="pr-8 text-[13px] font-semibold leading-5 text-slate-900">
              Join WhatsApp • Daily Jobs
            </p>
          </div>
        ) : null}

        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the JobAdvice WhatsApp group"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_34px_-24px_rgba(37,211,102,0.45)] transition-transform duration-200 hover:scale-[1.03] hover:bg-[#22c55e] active:scale-95"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.53 0 .2 5.32.2 11.88c0 2.1.55 4.16 1.6 5.98L0 24l6.33-1.66a11.8 11.8 0 0 0 5.75 1.47h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.23-6.14-3.45-8.45Zm-8.44 18.33h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.22-3.76.98 1-3.67-.24-.38a9.84 9.84 0 0 1-1.5-5.26c0-5.45 4.44-9.89 9.9-9.89a9.8 9.8 0 0 1 7.01 2.9 9.82 9.82 0 0 1 2.89 7c0 5.47-4.44 9.92-9.9 9.92Zm5.43-7.41c-.3-.15-1.77-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.65-2.04c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.23-.24-.57-.48-.49-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.27.48 1.71.62.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35Z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
