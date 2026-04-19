export const JOB_ALERT_POPUP_DISMISSED_AT_KEY = "job_alert_popup_dismissed_at";
export const JOB_ALERT_POPUP_COMPLETED_AT_KEY = "job_alert_popup_completed_at";
export const JOB_ALERT_POPUP_DISMISS_DURATION_MS = 30 * 60 * 1000;

const readStoredTimestamp = (storageKey: string): number | null => {
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

const writeStoredTimestamp = (storageKey: string, timestamp: number) => {
  if (typeof window === "undefined") {
    return timestamp;
  }

  try {
    window.localStorage.setItem(storageKey, String(timestamp));
  } catch {}

  return timestamp;
};

export const hasActiveJobAlertPopupDismissal = ({
  dismissForMs = JOB_ALERT_POPUP_DISMISS_DURATION_MS,
  storageKey = JOB_ALERT_POPUP_DISMISSED_AT_KEY,
}: {
  dismissForMs?: number;
  storageKey?: string;
} = {}) => {
  const dismissedAt = readStoredTimestamp(storageKey);

  if (dismissedAt === null) {
    return false;
  }

  return Date.now() - dismissedAt < dismissForMs;
};

export const hasCompletedJobAlertPopup = ({
  storageKey = JOB_ALERT_POPUP_COMPLETED_AT_KEY,
}: {
  storageKey?: string;
} = {}) => readStoredTimestamp(storageKey) !== null;

export const markJobAlertPopupDismissed = ({
  dismissedAt = Date.now(),
  storageKey = JOB_ALERT_POPUP_DISMISSED_AT_KEY,
}: {
  dismissedAt?: number;
  storageKey?: string;
} = {}) => writeStoredTimestamp(storageKey, dismissedAt);

export const markJobAlertPopupCompleted = ({
  completedAt = Date.now(),
  storageKey = JOB_ALERT_POPUP_COMPLETED_AT_KEY,
}: {
  completedAt?: number;
  storageKey?: string;
} = {}) => writeStoredTimestamp(storageKey, completedAt);
