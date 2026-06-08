export const analyticsMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

type AnalyticsPrimitive = string | number | boolean;
export type AnalyticsEventParams = Record<
  string,
  AnalyticsPrimitive | null | undefined
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "event" | "js",
      target: string | Date,
      params?: AnalyticsEventParams,
    ) => void;
  }
}

const isAnalyticsEnabled = () =>
  typeof window !== "undefined" &&
  Boolean(analyticsMeasurementId) &&
  typeof window.gtag === "function";

const firstPartyAnalyticsEndpoint = "/api/analytics/track";
const firstPartySessionKey = "jobadvice:analytics-session-v1";

const sanitizeParams = (params: AnalyticsEventParams = {}) =>
  Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, AnalyticsPrimitive] => {
      const value = entry[1];
      return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      );
    }),
  );

const getSessionId = () => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existingSessionId = window.sessionStorage.getItem(firstPartySessionKey);

    if (existingSessionId) {
      return existingSessionId;
    }

    const nextSessionId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.sessionStorage.setItem(firstPartySessionKey, nextSessionId);
    return nextSessionId;
  } catch {
    return "";
  }
};

const sendFirstPartyAnalyticsEvent = (
  eventName: string,
  params: AnalyticsEventParams,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const sanitizedParams = sanitizeParams(params);
  const path =
    typeof sanitizedParams.page_path === "string" && sanitizedParams.page_path
      ? sanitizedParams.page_path
      : `${window.location.pathname}${window.location.search}`;
  const title =
    typeof sanitizedParams.page_title === "string" && sanitizedParams.page_title
      ? sanitizedParams.page_title
      : document.title || "JobAdvice";
  const payload = JSON.stringify({
    eventName,
    path,
    title,
    referrer: document.referrer || "",
    sessionId: getSessionId(),
    properties: sanitizedParams,
  });

  try {
    if (typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(
        firstPartyAnalyticsEndpoint,
        new Blob([payload], {
          type: "application/json",
        }),
      );

      if (queued) {
        return;
      }
    }
  } catch {}

  try {
    window
      .fetch(firstPartyAnalyticsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      })
      .catch(() => {});
  } catch {}
};

export const trackEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  const sanitizedParams = sanitizeParams(params);

  if (isAnalyticsEnabled()) {
    window.gtag?.("event", eventName, sanitizedParams);
  }

  sendFirstPartyAnalyticsEvent(eventName, sanitizedParams);
};

export const trackPageView = (path: string, title?: string) => {
  trackEvent("page_view", {
    page_path: path,
    page_title: title || "",
    page_location: typeof window !== "undefined" ? window.location.href : "",
  });
};
