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

export const trackEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  window.gtag?.("event", eventName, sanitizeParams(params));
};

export const trackPageView = (path: string, title?: string) => {
  trackEvent("page_view", {
    page_path: path,
    page_title: title || "",
    page_location: typeof window !== "undefined" ? window.location.href : "",
  });
};
