"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const GROUP_URL = "https://chat.whatsapp.com/L6Qh1hBedLZ3vfL3kQMB4r";
const DISMISSED_UNTIL_KEY = "jobadvice-whatsapp-bubble-dismissed-until";
const SESSION_COUNT_KEY = "jobadvice-whatsapp-bubble-session-count";
const MAX_DISPLAYS_PER_SESSION = 3;
const INITIAL_DELAY_MS = 6000;
const REPEAT_DELAY_MS = 60000;
const AUTO_HIDE_DELAY_MS = 7000;
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-current"
    >
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.02 2a9.94 9.94 0 0 0-8.7 14.78L2 22l5.37-1.4a9.93 9.93 0 0 0 4.64 1.18h.01c5.5 0 9.98-4.48 9.98-9.98a9.9 9.9 0 0 0-2.95-7.05Zm-7.03 15.19h-.01a8.3 8.3 0 0 1-4.22-1.15l-.3-.18-3.19.83.85-3.11-.2-.32a8.29 8.29 0 0 1-1.28-4.38c0-4.57 3.73-8.3 8.32-8.3 2.22 0 4.31.86 5.87 2.43a8.25 8.25 0 0 1 2.43 5.88c0 4.58-3.73 8.3-8.27 8.3Zm4.55-6.18c-.25-.13-1.49-.73-1.72-.82-.23-.08-.4-.12-.56.13-.17.25-.64.82-.79.99-.14.17-.29.19-.54.06-.25-.12-1.03-.38-1.96-1.22-.73-.65-1.22-1.45-1.36-1.7-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.87-.2-.48-.4-.41-.56-.42l-.48-.01c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.76 2.68 4.26 3.76.6.26 1.07.42 1.44.54.61.19 1.17.16 1.61.1.49-.07 1.49-.61 1.7-1.2.21-.58.21-1.09.14-1.2-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}

function readDismissedUntil() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DISMISSED_UNTIL_KEY);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function readSessionCount() {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(SESSION_COUNT_KEY);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export default function WhatsAppCta() {
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isSuppressed, setIsSuppressed] = useState(true);
  const autoHideTimerRef = useRef<number | null>(null);
  const initialTimerRef = useRef<number | null>(null);
  const repeatTimerRef = useRef<number | null>(null);
  const sessionCountRef = useRef(0);
  const hasTriggeredScrollRef = useRef(false);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const canShowBubble = useCallback(() => {
    if (typeof window === "undefined") return false;
    const dismissedUntil = readDismissedUntil();
    const sessionCount = sessionCountRef.current;
    return dismissedUntil <= Date.now() && sessionCount < MAX_DISPLAYS_PER_SESSION;
  }, []);

  const showBubble = useCallback(() => {
    if (!canShowBubble()) return;

    sessionCountRef.current += 1;
    window.sessionStorage.setItem(
      SESSION_COUNT_KEY,
      String(sessionCountRef.current),
    );

    setIsBubbleVisible(true);
    clearAutoHideTimer();
    autoHideTimerRef.current = window.setTimeout(() => {
      setIsBubbleVisible(false);
      autoHideTimerRef.current = null;
    }, AUTO_HIDE_DELAY_MS);
  }, [canShowBubble, clearAutoHideTimer]);

  const handleDismiss = useCallback(() => {
    if (typeof window === "undefined") return;
    const suppressedUntil = Date.now() + DISMISS_DURATION_MS;
    window.localStorage.setItem(
      DISMISSED_UNTIL_KEY,
      String(suppressedUntil),
    );
    setIsBubbleVisible(false);
    setIsSuppressed(true);
    clearAutoHideTimer();
    if (repeatTimerRef.current) {
      window.clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (initialTimerRef.current) {
      window.clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
  }, [clearAutoHideTimer]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedUntil = readDismissedUntil();
    const isDismissed = dismissedUntil > Date.now();
    sessionCountRef.current = readSessionCount();
    setIsSuppressed(isDismissed);

    if (isDismissed || sessionCountRef.current >= MAX_DISPLAYS_PER_SESSION) {
      return;
    }

    initialTimerRef.current = window.setTimeout(() => {
      showBubble();
    }, INITIAL_DELAY_MS);

    repeatTimerRef.current = window.setInterval(() => {
      showBubble();
    }, REPEAT_DELAY_MS);

    const handleScroll = () => {
      if (hasTriggeredScrollRef.current || !canShowBubble()) return;

      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) return;

      const scrolledRatio = window.scrollY / scrollableHeight;
      if (scrolledRatio >= 0.4) {
        hasTriggeredScrollRef.current = true;
        showBubble();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearAutoHideTimer();
      if (initialTimerRef.current) {
        window.clearTimeout(initialTimerRef.current);
      }
      if (repeatTimerRef.current) {
        window.clearInterval(repeatTimerRef.current);
      }
    };
  }, [canShowBubble, clearAutoHideTimer, showBubble]);

  const bubbleClasses = useMemo(
    () =>
      [
        "absolute bottom-[calc(100%+0.9rem)] right-0 w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 sm:bottom-1/2 sm:right-[calc(100%+1rem)] sm:w-[240px] sm:translate-y-1/2",
        isBubbleVisible
          ? "pointer-events-auto translate-y-0 opacity-100 sm:translate-y-1/2"
          : "pointer-events-none translate-y-2 opacity-0 sm:translate-y-[calc(50%+6px)]",
      ].join(" "),
    [isBubbleVisible],
  );

  if (isSuppressed && !isBubbleVisible) {
    return (
      <div className="pointer-events-none fixed bottom-5 right-5 z-[70] sm:bottom-6 sm:right-6">
        <a
          href={GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the JobAdvice WhatsApp group"
          className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.24)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        >
          <WhatsAppIcon />
        </a>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] sm:bottom-6 sm:right-6">
      <div className={bubbleClasses} aria-hidden={!isBubbleVisible}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-medium leading-5 text-slate-700">
            Join WhatsApp • Daily Jobs
          </p>
          <button
            type="button"
            aria-label="Dismiss WhatsApp message"
            onClick={handleDismiss}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>

      <a
        href={GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join the JobAdvice WhatsApp group"
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.24)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}
