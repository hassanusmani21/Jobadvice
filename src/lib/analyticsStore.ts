import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore, type Store } from "@netlify/blobs";
import {
  get as getVercelBlob,
  put as putVercelBlob,
} from "@vercel/blob";
import { siteUrl } from "@/lib/site";

type AnalyticsStorageProvider = "local" | "vercel-blob" | "netlify-blobs" | "unconfigured";
type AnalyticsPrimitive = string | number | boolean;

export type AnalyticsTrackInput = {
  eventName: string;
  path?: string;
  title?: string;
  referrer?: string;
  sessionId?: string;
  durationSeconds?: number;
  properties?: Record<string, AnalyticsPrimitive | null | undefined>;
};

type AnalyticsPageStats = {
  title: string;
  views: number;
  exits: number;
  durationSeconds: number;
};

type AnalyticsRankRecord = {
  count: number;
  label: string;
  path?: string;
  meta?: string;
};

type AnalyticsDailyBucket = {
  date: string;
  updatedAt: string;
  totalEvents: number;
  pageViews: number;
  exitEvents: number;
  totalDurationSeconds: number;
  sessionHashes: string[];
  sources: Record<string, number>;
  pages: Record<string, AnalyticsPageStats>;
  events: Record<string, number>;
  jobClicks: Record<string, AnalyticsRankRecord>;
  blogClicks: Record<string, AnalyticsRankRecord>;
  universityClicks: Record<string, AnalyticsRankRecord>;
  searchKeywords: Record<string, number>;
  jobAlertSignups: number;
  emailOpens: number;
  emailClicks: number;
};

type LocalAnalyticsState = {
  buckets: Record<string, AnalyticsDailyBucket>;
};

export type AnalyticsDashboardSummary = {
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  storageConfigured: boolean;
  storageProvider: AnalyticsStorageProvider;
  totals: {
    events: number;
    pageViews: number;
    visitors: number;
    jobClicks: number;
    blogClicks: number;
    universityClicks: number;
    jobAlertSignups: number;
    emailOpens: number;
    emailClicks: number;
    averageSessionDurationSeconds: number;
    jobClickThroughRate: number;
  };
  series: Array<{
    date: string;
    events: number;
    pageViews: number;
    visitors: number;
  }>;
  topPages: Array<AnalyticsRankRecord & { key: string; views: number }>;
  topJobs: Array<AnalyticsRankRecord & { key: string }>;
  topBlogs: Array<AnalyticsRankRecord & { key: string }>;
  topUniversities: Array<AnalyticsRankRecord & { key: string }>;
  topSources: Array<{ key: string; count: number }>;
  topSearchKeywords: Array<{ key: string; count: number }>;
};

const analyticsStoreName = "site-analytics";
const dailyPrefix = "daily/";
const localAnalyticsFilePath = path.join(
  process.cwd(),
  ".local",
  "analytics",
  "daily.json",
);
const isProduction = process.env.NODE_ENV === "production";
const configuredAnalyticsStorage = (process.env.ANALYTICS_STORAGE || "").trim().toLowerCase();
const configuredNetlifySiteID = (
  process.env.NETLIFY_BLOBS_SITE_ID ||
  process.env.NETLIFY_SITE_ID ||
  process.env.SITE_ID ||
  ""
).trim();
const configuredNetlifyToken = (
  process.env.NETLIFY_BLOBS_TOKEN ||
  process.env.NETLIFY_BLOBS_READ_WRITE_TOKEN ||
  ""
).trim();
const hasNetlifyBlobConfig = Boolean(configuredNetlifySiteID && configuredNetlifyToken);
const hasVercelBlobConfig = Boolean((process.env.BLOB_READ_WRITE_TOKEN || "").trim());
const isVercelRuntime = ["1", "true"].includes((process.env.VERCEL || "").trim().toLowerCase());
const isNetlifyRuntime = ["1", "true"].includes((process.env.NETLIFY || "").trim().toLowerCase());
const sessionHashSalt = (process.env.ANALYTICS_HASH_SALT || process.env.NEXTAUTH_SECRET || "").trim();

const configuredStorageProvider = (() => {
  if (configuredAnalyticsStorage === "local") {
    return "local" satisfies AnalyticsStorageProvider;
  }

  if (["vercel", "vercel-blob"].includes(configuredAnalyticsStorage)) {
    return "vercel-blob" satisfies AnalyticsStorageProvider;
  }

  if (["netlify", "netlify-blobs"].includes(configuredAnalyticsStorage)) {
    return "netlify-blobs" satisfies AnalyticsStorageProvider;
  }

  if (!isProduction) {
    return "local" satisfies AnalyticsStorageProvider;
  }

  if (hasVercelBlobConfig || isVercelRuntime) {
    return "vercel-blob" satisfies AnalyticsStorageProvider;
  }

  if (hasNetlifyBlobConfig || isNetlifyRuntime) {
    return "netlify-blobs" satisfies AnalyticsStorageProvider;
  }

  return "unconfigured" satisfies AnalyticsStorageProvider;
})();

let analyticsStoreInstance: Store | null = null;

const getAnalyticsStore = () => {
  if (analyticsStoreInstance) {
    return analyticsStoreInstance;
  }

  if (!hasNetlifyBlobConfig) {
    throw new Error("Netlify Blobs is not configured for analytics.");
  }

  analyticsStoreInstance = getStore({
    name: analyticsStoreName,
    siteID: configuredNetlifySiteID,
    token: configuredNetlifyToken,
  });

  return analyticsStoreInstance;
};

export const getAnalyticsRuntimeStatus = (): {
  storageConfigured: boolean;
  storageProvider: AnalyticsStorageProvider;
} => ({
  storageConfigured:
    configuredStorageProvider === "local" ||
    (configuredStorageProvider === "vercel-blob" && hasVercelBlobConfig) ||
    (configuredStorageProvider === "netlify-blobs" && hasNetlifyBlobConfig),
  storageProvider: configuredStorageProvider,
});

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const clampDateRange = (from: string | undefined, to: string | undefined) => {
  const today = new Date();
  const fallbackTo = formatDateKey(today);
  const fallbackFrom = formatDateKey(addDays(today, -29));
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const dateFrom = from && datePattern.test(from) ? from : fallbackFrom;
  const dateTo = to && datePattern.test(to) ? to : fallbackTo;
  const fromTime = Date.parse(`${dateFrom}T00:00:00Z`);
  const toTime = Date.parse(`${dateTo}T00:00:00Z`);

  if (Number.isNaN(fromTime) || Number.isNaN(toTime) || fromTime > toTime) {
    return {
      dateFrom: fallbackFrom,
      dateTo: fallbackTo,
    };
  }

  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
  if (toTime - fromTime > maxRangeMs) {
    return {
      dateFrom: formatDateKey(addDays(new Date(`${dateTo}T00:00:00Z`), -90)),
      dateTo,
    };
  }

  return {
    dateFrom,
    dateTo,
  };
};

const enumerateDates = (dateFrom: string, dateTo: string) => {
  const dates: string[] = [];
  let currentDate = new Date(`${dateFrom}T00:00:00Z`);
  const endTime = Date.parse(`${dateTo}T00:00:00Z`);

  while (currentDate.getTime() <= endTime) {
    dates.push(formatDateKey(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

const sanitizeText = (value: unknown, maxLength = 160) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const sanitizeEventName = (value: string) => {
  const cleaned = sanitizeText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned || "custom_event";
};

const sanitizeProperties = (properties: AnalyticsTrackInput["properties"] = {}) =>
  Object.fromEntries(
    Object.entries(properties)
      .slice(0, 24)
      .filter((entry): entry is [string, AnalyticsPrimitive] => {
        const value = entry[1];
        return (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        );
      })
      .map(([key, value]) => [
        sanitizeEventName(key),
        typeof value === "string" ? sanitizeText(value, 220) : value,
      ]),
  );

const normalizePath = (pathValue: string | undefined) => {
  const candidate = sanitizeText(pathValue || "/", 500) || "/";

  try {
    const parsedUrl = new URL(candidate, siteUrl);
    return `${parsedUrl.pathname}${parsedUrl.search}` || "/";
  } catch {
    return candidate.startsWith("/") ? candidate : "/";
  }
};

const getHostFromSiteUrl = () => {
  try {
    return new URL(siteUrl).host;
  } catch {
    return "";
  }
};

const classifyTrafficSource = (referrer: string | undefined) => {
  const value = sanitizeText(referrer, 500);

  if (!value || value === "(direct)") {
    return "Direct";
  }

  try {
    const referrerUrl = new URL(value);
    const host = referrerUrl.host.replace(/^www\./, "");
    const siteHost = getHostFromSiteUrl().replace(/^www\./, "");

    if (host === siteHost) {
      return "Internal";
    }

    if (/google|bing|duckduckgo|yahoo|yandex/i.test(host)) {
      return "Search";
    }

    if (/instagram|facebook|linkedin|twitter|x\.com|youtube|t\.me|telegram/i.test(host)) {
      return "Social";
    }

    return host;
  } catch {
    return "Direct";
  }
};

const getSearchKeyword = (pathValue: string) => {
  try {
    const parsedUrl = new URL(pathValue, siteUrl);
    return sanitizeText(parsedUrl.searchParams.get("q") || "", 120);
  } catch {
    return "";
  }
};

const getSessionHash = (date: string, sessionId: string | undefined) => {
  const cleanSessionId = sanitizeText(sessionId, 120);

  if (!cleanSessionId) {
    return "";
  }

  return createHash("sha256")
    .update(`${date}:${cleanSessionId}:${sessionHashSalt}`)
    .digest("hex")
    .slice(0, 20);
};

const createEmptyBucket = (date: string): AnalyticsDailyBucket => ({
  date,
  updatedAt: new Date().toISOString(),
  totalEvents: 0,
  pageViews: 0,
  exitEvents: 0,
  totalDurationSeconds: 0,
  sessionHashes: [],
  sources: {},
  pages: {},
  events: {},
  jobClicks: {},
  blogClicks: {},
  universityClicks: {},
  searchKeywords: {},
  jobAlertSignups: 0,
  emailOpens: 0,
  emailClicks: 0,
});

const readLocalAnalyticsState = async (): Promise<LocalAnalyticsState> => {
  try {
    const rawValue = await fs.readFile(localAnalyticsFilePath, "utf8");
    const parsedValue = JSON.parse(rawValue);

    return {
      buckets:
        parsedValue && typeof parsedValue.buckets === "object" && parsedValue.buckets
          ? parsedValue.buckets
          : {},
    };
  } catch {
    return {
      buckets: {},
    };
  }
};

const writeLocalAnalyticsState = async (state: LocalAnalyticsState) => {
  await fs.mkdir(path.dirname(localAnalyticsFilePath), { recursive: true });
  await fs.writeFile(localAnalyticsFilePath, JSON.stringify(state, null, 2), "utf8");
};

const toDailyKey = (date: string) => `${dailyPrefix}${date}.json`;

const readVercelBucket = async (date: string) => {
  if (!hasVercelBlobConfig) {
    throw new Error("Vercel Blob is not configured for analytics.");
  }

  const blob = await getVercelBlob(toDailyKey(date), {
    access: "private",
  });

  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null;
  }

  const rawValue = await new Response(blob.stream).text();
  return rawValue ? (JSON.parse(rawValue) as AnalyticsDailyBucket) : null;
};

const writeVercelBucket = async (bucket: AnalyticsDailyBucket) => {
  if (!hasVercelBlobConfig) {
    throw new Error("Vercel Blob is not configured for analytics.");
  }

  await putVercelBlob(toDailyKey(bucket.date), JSON.stringify(bucket), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
};

const readBucket = async (date: string) => {
  if (configuredStorageProvider === "unconfigured") {
    return createEmptyBucket(date);
  }

  if (configuredStorageProvider === "local") {
    const state = await readLocalAnalyticsState();
    return state.buckets[date] || createEmptyBucket(date);
  }

  if (configuredStorageProvider === "vercel-blob") {
    return (await readVercelBucket(date)) || createEmptyBucket(date);
  }

  const store = getAnalyticsStore();
  const value = (await store.get(toDailyKey(date), {
    type: "json",
  })) as AnalyticsDailyBucket | null;

  return value || createEmptyBucket(date);
};

const writeBucket = async (bucket: AnalyticsDailyBucket) => {
  if (configuredStorageProvider === "unconfigured") {
    return;
  }

  if (configuredStorageProvider === "local") {
    const state = await readLocalAnalyticsState();
    state.buckets[bucket.date] = bucket;
    await writeLocalAnalyticsState(state);
    return;
  }

  if (configuredStorageProvider === "vercel-blob") {
    await writeVercelBucket(bucket);
    return;
  }

  const store = getAnalyticsStore();
  await store.setJSON(toDailyKey(bucket.date), bucket);
};

const incrementCounter = (record: Record<string, number>, key: string, increment = 1) => {
  if (!key) {
    return;
  }

  record[key] = (record[key] || 0) + increment;
};

const incrementRankRecord = (
  record: Record<string, AnalyticsRankRecord>,
  key: string,
  label: string,
  pathValue?: string,
  meta?: string,
) => {
  if (!key) {
    return;
  }

  const current = record[key] || {
    count: 0,
    label,
    path: pathValue,
    meta,
  };

  current.count += 1;
  current.label = label || current.label;
  current.path = pathValue || current.path;
  current.meta = meta || current.meta;
  record[key] = current;
};

const getStringProperty = (
  properties: Record<string, AnalyticsPrimitive>,
  key: string,
  fallback = "",
) => {
  const value = properties[key];
  return typeof value === "string" ? sanitizeText(value, 160) : fallback;
};

const getNumberProperty = (
  properties: Record<string, AnalyticsPrimitive>,
  key: string,
  fallback = 0,
) => {
  const value = properties[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const getSlugFromPath = (pathValue: string, prefix: string) => {
  const match = pathValue.match(new RegExp(`^/${prefix}/([^/?#]+)`));
  return sanitizeText(match?.[1] || "", 120);
};

const mutateBucketWithEvent = (
  bucket: AnalyticsDailyBucket,
  input: AnalyticsTrackInput,
) => {
  const eventName = sanitizeEventName(input.eventName);
  const properties = sanitizeProperties(input.properties);
  const pagePath = normalizePath(
    getStringProperty(properties, "page_path") || getStringProperty(properties, "path") || input.path,
  );
  const pageTitle =
    getStringProperty(properties, "page_title") ||
    sanitizeText(input.title, 160) ||
    pagePath;
  const sessionHash = getSessionHash(bucket.date, input.sessionId);

  bucket.updatedAt = new Date().toISOString();
  bucket.totalEvents += 1;
  incrementCounter(bucket.events, eventName);

  if (sessionHash && !bucket.sessionHashes.includes(sessionHash)) {
    bucket.sessionHashes.push(sessionHash);
  }

  if (eventName === "page_view") {
    bucket.pageViews += 1;
    const pageStats = bucket.pages[pagePath] || {
      title: pageTitle,
      views: 0,
      exits: 0,
      durationSeconds: 0,
    };

    pageStats.views += 1;
    pageStats.title = pageTitle || pageStats.title;
    bucket.pages[pagePath] = pageStats;
    incrementCounter(bucket.sources, classifyTrafficSource(input.referrer));
    incrementCounter(bucket.searchKeywords, getSearchKeyword(pagePath));
  }

  if (eventName === "landing_page_view") {
    incrementCounter(
      bucket.sources,
      classifyTrafficSource(getStringProperty(properties, "referrer") || input.referrer),
    );
  }

  if (eventName === "page_exit") {
    const durationSeconds = Math.max(
      0,
      Math.min(
        60 * 60,
        Math.round(
          getNumberProperty(properties, "time_on_page_seconds") ||
            input.durationSeconds ||
            0,
        ),
      ),
    );
    const pageStats = bucket.pages[pagePath] || {
      title: pageTitle,
      views: 0,
      exits: 0,
      durationSeconds: 0,
    };

    pageStats.exits += 1;
    pageStats.durationSeconds += durationSeconds;
    bucket.pages[pagePath] = pageStats;
    bucket.exitEvents += 1;
    bucket.totalDurationSeconds += durationSeconds;
  }

  if (eventName === "job_apply_click" || eventName === "job_link_click") {
    const jobSlug = getStringProperty(properties, "job_slug") || getSlugFromPath(pagePath, "jobs");
    const company = getStringProperty(properties, "company");
    incrementRankRecord(
      bucket.jobClicks,
      jobSlug,
      getStringProperty(properties, "job_title") || jobSlug,
      jobSlug ? `/jobs/${jobSlug}/` : pagePath,
      company,
    );
  }

  if (eventName === "blog_link_click") {
    const blogSlug = getStringProperty(properties, "blog_slug") || getSlugFromPath(pagePath, "blog");
    incrementRankRecord(
      bucket.blogClicks,
      blogSlug,
      getStringProperty(properties, "blog_title") || blogSlug,
      blogSlug ? `/blog/${blogSlug}/` : pagePath,
    );
  }

  if (eventName === "university_link_click") {
    const universitySlug =
      getStringProperty(properties, "university_slug") ||
      getSlugFromPath(pagePath, "universities") ||
      getSlugFromPath(pagePath, "university");
    incrementRankRecord(
      bucket.universityClicks,
      universitySlug,
      getStringProperty(properties, "university_name") || universitySlug,
      universitySlug ? `/universities/${universitySlug}/` : pagePath,
    );
  }

  if (eventName === "job_alert_signup") {
    bucket.jobAlertSignups += 1;
  }

  if (eventName === "job_alert_email_open") {
    bucket.emailOpens += 1;
  }

  if (eventName === "job_alert_email_click") {
    bucket.emailClicks += 1;
  }
};

export const recordAnalyticsEvent = async (input: AnalyticsTrackInput) => {
  const date = formatDateKey(new Date());
  const bucket = await readBucket(date);
  mutateBucketWithEvent(bucket, input);
  await writeBucket(bucket);
};

const mergeRankRecords = (
  target: Record<string, AnalyticsRankRecord>,
  source: Record<string, AnalyticsRankRecord>,
) => {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key] || {
      count: 0,
      label: value.label,
      path: value.path,
      meta: value.meta,
    };

    current.count += value.count;
    current.label = value.label || current.label;
    current.path = value.path || current.path;
    current.meta = value.meta || current.meta;
    target[key] = current;
  }
};

const rankCounters = (record: Record<string, number>, limit = 8) =>
  Object.entries(record)
    .map(([key, count]) => ({ key, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, limit);

const rankRecords = (record: Record<string, AnalyticsRankRecord>, limit = 8) =>
  Object.entries(record)
    .map(([key, value]) => ({
      key,
      ...value,
    }))
    .sort((first, second) => second.count - first.count)
    .slice(0, limit);

export const getAnalyticsDashboard = async (
  range: { from?: string; to?: string } = {},
): Promise<AnalyticsDashboardSummary> => {
  const { dateFrom, dateTo } = clampDateRange(range.from, range.to);
  const dates = enumerateDates(dateFrom, dateTo);
  const buckets = await Promise.all(dates.map((date) => readBucket(date)));
  const sessionHashes = new Set<string>();
  const sources: Record<string, number> = {};
  const searchKeywords: Record<string, number> = {};
  const pages: Record<string, AnalyticsPageStats> = {};
  const jobClicks: Record<string, AnalyticsRankRecord> = {};
  const blogClicks: Record<string, AnalyticsRankRecord> = {};
  const universityClicks: Record<string, AnalyticsRankRecord> = {};
  let events = 0;
  let pageViews = 0;
  let exitEvents = 0;
  let totalDurationSeconds = 0;
  let jobAlertSignups = 0;
  let emailOpens = 0;
  let emailClicks = 0;

  for (const bucket of buckets) {
    events += bucket.totalEvents;
    pageViews += bucket.pageViews;
    exitEvents += bucket.exitEvents;
    totalDurationSeconds += bucket.totalDurationSeconds;
    jobAlertSignups += bucket.jobAlertSignups;
    emailOpens += bucket.emailOpens;
    emailClicks += bucket.emailClicks;
    bucket.sessionHashes.forEach((hash) => sessionHashes.add(hash));

    for (const [key, count] of Object.entries(bucket.sources)) {
      incrementCounter(sources, key, count);
    }

    for (const [key, count] of Object.entries(bucket.searchKeywords)) {
      incrementCounter(searchKeywords, key, count);
    }

    for (const [pathKey, value] of Object.entries(bucket.pages)) {
      const current = pages[pathKey] || {
        title: value.title,
        views: 0,
        exits: 0,
        durationSeconds: 0,
      };

      current.views += value.views;
      current.exits += value.exits;
      current.durationSeconds += value.durationSeconds;
      current.title = value.title || current.title;
      pages[pathKey] = current;
    }

    mergeRankRecords(jobClicks, bucket.jobClicks);
    mergeRankRecords(blogClicks, bucket.blogClicks);
    mergeRankRecords(universityClicks, bucket.universityClicks);
  }

  const totalJobClicks = Object.values(jobClicks).reduce((total, item) => total + item.count, 0);
  const totalBlogClicks = Object.values(blogClicks).reduce((total, item) => total + item.count, 0);
  const totalUniversityClicks = Object.values(universityClicks).reduce(
    (total, item) => total + item.count,
    0,
  );
  const runtimeStatus = getAnalyticsRuntimeStatus();

  return {
    dateFrom,
    dateTo,
    generatedAt: new Date().toISOString(),
    storageConfigured: runtimeStatus.storageConfigured,
    storageProvider: runtimeStatus.storageProvider,
    totals: {
      events,
      pageViews,
      visitors: sessionHashes.size,
      jobClicks: totalJobClicks,
      blogClicks: totalBlogClicks,
      universityClicks: totalUniversityClicks,
      jobAlertSignups,
      emailOpens,
      emailClicks,
      averageSessionDurationSeconds:
        exitEvents > 0 ? Math.round(totalDurationSeconds / exitEvents) : 0,
      jobClickThroughRate: pageViews > 0 ? Number((totalJobClicks / pageViews).toFixed(3)) : 0,
    },
    series: buckets.map((bucket) => ({
      date: bucket.date,
      events: bucket.totalEvents,
      pageViews: bucket.pageViews,
      visitors: bucket.sessionHashes.length,
    })),
    topPages: Object.entries(pages)
      .map(([key, value]) => ({
        key,
        label: value.title || key,
        count: value.views,
        views: value.views,
        path: key,
        meta:
          value.exits > 0
            ? `${Math.round(value.durationSeconds / value.exits)}s avg`
            : undefined,
      }))
      .sort((first, second) => second.views - first.views)
      .slice(0, 10),
    topJobs: rankRecords(jobClicks, 10),
    topBlogs: rankRecords(blogClicks, 10),
    topUniversities: rankRecords(universityClicks, 10),
    topSources: rankCounters(sources, 10),
    topSearchKeywords: rankCounters(searchKeywords, 10),
  };
};
