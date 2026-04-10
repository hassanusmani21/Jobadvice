export const RESUME_POPUP_DISMISSED_AT_KEY = "resume_popup_dismissed_at";
export const RESUME_POPUP_DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

const readDismissedAtValue = (storageKey: string): number | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

export const hasActiveResumePopupDismissal = ({
  dismissForMs = RESUME_POPUP_DISMISS_DURATION_MS,
  storageKey = RESUME_POPUP_DISMISSED_AT_KEY,
}: {
  dismissForMs?: number;
  storageKey?: string;
} = {}) => {
  const dismissedAt = readDismissedAtValue(storageKey);

  if (dismissedAt === null) {
    return false;
  }

  return Date.now() - dismissedAt < dismissForMs;
};

export const markResumePopupDismissed = ({
  dismissedAt = Date.now(),
  storageKey = RESUME_POPUP_DISMISSED_AT_KEY,
}: {
  dismissedAt?: number;
  storageKey?: string;
} = {}) => {
  if (typeof window === "undefined") {
    return dismissedAt;
  }

  try {
    window.localStorage.setItem(storageKey, String(dismissedAt));
  } catch {}

  return dismissedAt;
};
