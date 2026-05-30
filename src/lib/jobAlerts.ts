import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore, type Store } from "@netlify/blobs";
import {
  del as deleteVercelBlob,
  get as getVercelBlob,
  list as listVercelBlobs,
  put as putVercelBlob,
} from "@vercel/blob";
import {
  buildJobAlertSearchParams,
  buildJobAlertSummary,
  filterJobsByAlertFilters,
  hasActiveJobAlertFilters,
  normalizeJobAlertFilters,
  sortJobsByFilters,
  type JobAlertFilters,
} from "@/lib/jobFilters";
import { formatPostedDate, getAllJobsForAlerts, type JobPost } from "@/lib/jobs";
import { siteName, siteUrl } from "@/lib/site";

const alertsStoreName = "job-alerts";
const subscriptionPrefix = "subscriptions/";
const tokenPrefix = "tokens/";
const localAlertsFilePath = path.join(
  process.cwd(),
  ".local",
  "job-alerts",
  "subscriptions.json",
);
const maxTrackedSentJobSlugs = 500;
const isProduction = process.env.NODE_ENV === "production";
const configuredJobAlertsStorage = (process.env.JOB_ALERTS_STORAGE || "").trim().toLowerCase();
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

type JobAlertDeliveryChannel = "email";
type JobAlertDeliveryFrequency = "daily";
type JobAlertUpsertStatus = "created" | "reactivated" | "already_subscribed";
type JobAlertsStorageProvider = "local" | "vercel-blob" | "netlify-blobs" | "unconfigured";

type JobAlertTokenRecord = {
  signature: string;
};

type JobAlertLocalState = {
  subscriptions: Record<string, JobAlertSubscription>;
  tokenToSignature: Record<string, string>;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult = {
  id: string | null;
};

export type JobAlertSubscription = {
  signature: string;
  email: string;
  name?: string;
  timeZone?: string;
  filters: JobAlertFilters;
  channel: JobAlertDeliveryChannel;
  frequency: JobAlertDeliveryFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSentAt: string | null;
  welcomeEmailSentAt: string | null;
  unsubscribeToken: string;
  sentJobSlugs: string[];
};

export type JobAlertUpsertResult = {
  status: JobAlertUpsertStatus;
  subscription: JobAlertSubscription;
};

export type JobAlertRunSummary = {
  activeAlerts: number;
  checkedAt: string;
  emailsSent: number;
  errors: string[];
  matchedJobs: number;
  skippedAlreadySentToday: number;
  skippedAlerts: number;
  skippedNoNewMatches: number;
  storageProvider: JobAlertsStorageProvider;
  uniqueRecipients: number;
};

export type JobAlertRunOptions = {
  force?: boolean;
  includeAlreadySent?: boolean;
};

export class JobAlertValidationError extends Error {}
export class JobAlertConfigurationError extends Error {}

const configuredStorageProvider = (() => {
  if (configuredJobAlertsStorage === "local") {
    return "local" satisfies JobAlertsStorageProvider;
  }

  if (["vercel", "vercel-blob"].includes(configuredJobAlertsStorage)) {
    return "vercel-blob" satisfies JobAlertsStorageProvider;
  }

  if (["netlify", "netlify-blobs"].includes(configuredJobAlertsStorage)) {
    return "netlify-blobs" satisfies JobAlertsStorageProvider;
  }

  if (!isProduction) {
    return "local" satisfies JobAlertsStorageProvider;
  }

  if (hasVercelBlobConfig || isVercelRuntime) {
    return "vercel-blob" satisfies JobAlertsStorageProvider;
  }

  if (hasNetlifyBlobConfig || isNetlifyRuntime) {
    return "netlify-blobs" satisfies JobAlertsStorageProvider;
  }

  return "unconfigured" satisfies JobAlertsStorageProvider;
})();

const shouldUseLocalAlertsFileStore = configuredStorageProvider === "local";

let alertsStoreInstance: Store | null = null;

const getAlertsStore = () => {
  if (alertsStoreInstance) {
    return alertsStoreInstance;
  }

  if (!hasNetlifyBlobConfig) {
    throw new JobAlertConfigurationError(
      "Netlify Blobs is not configured for this production deployment.",
    );
  }

  try {
    alertsStoreInstance = getStore({
      name: alertsStoreName,
      siteID: configuredNetlifySiteID,
      token: configuredNetlifyToken,
    });
  } catch (error) {
    throw new JobAlertConfigurationError(
      "Job alerts storage is not configured for this production deployment.",
      {
        cause: error,
      },
    );
  }

  return alertsStoreInstance;
};

const assertConfiguredProductionStorage = () => {
  if (configuredStorageProvider === "unconfigured") {
    throw new JobAlertConfigurationError(
      "Job alerts storage is not configured for this production deployment.",
    );
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeSubscriberName = (name: string) => name.trim().replace(/\s+/g, " ").slice(0, 80);
const defaultJobAlertTimeZone = "Asia/Kolkata";
const normalizeTimeZone = (timeZone: string | null | undefined) => {
  const candidate = typeof timeZone === "string" ? timeZone.trim() : "";

  if (!candidate) {
    return defaultJobAlertTimeZone;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return defaultJobAlertTimeZone;
  }
};
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const getSubscriberGreetingName = (subscription: Pick<JobAlertSubscription, "name" | "email">) =>
  normalizeSubscriberName(subscription.name || "") || normalizeEmail(subscription.email).split("@")[0];
const getSubscriberGreetingLine = (subscription: Pick<JobAlertSubscription, "name" | "email">) =>
  `Hi ${getSubscriberGreetingName(subscription)},`;
const getSubscriberThanksLine = (subscription: Pick<JobAlertSubscription, "name" | "email">) =>
  normalizeSubscriberName(subscription.name || "")
    ? `Thanks, ${normalizeSubscriberName(subscription.name || "")}.`
    : "Thanks.";

const toSubscriptionKey = (signature: string) => `${subscriptionPrefix}${signature}.json`;
const toTokenKey = (token: string) => `${tokenPrefix}${token}.json`;

const createAlertSignature = (email: string, filters: JobAlertFilters) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        email: normalizeEmail(email),
        filters,
      }),
    )
    .digest("hex");

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));

const hydrateJobAlertSubscription = (
  subscription: JobAlertSubscription | null | undefined,
): JobAlertSubscription | null => {
  if (!subscription) {
    return null;
  }

  return {
    ...subscription,
    timeZone: normalizeTimeZone(subscription.timeZone),
    filters: normalizeJobAlertFilters(subscription.filters),
    // Older stored records did not track the welcome-email timestamp.
    welcomeEmailSentAt:
      typeof subscription.welcomeEmailSentAt === "string"
        ? subscription.welcomeEmailSentAt
        : subscription.welcomeEmailSentAt === null
          ? null
          : subscription.createdAt || null,
  } satisfies JobAlertSubscription;
};

const readLocalAlertsState = async (): Promise<JobAlertLocalState> => {
  try {
    const rawValue = await fs.readFile(localAlertsFilePath, "utf8");
    const parsedValue = JSON.parse(rawValue);

    return {
      subscriptions:
        parsedValue && typeof parsedValue.subscriptions === "object" && parsedValue.subscriptions
          ? parsedValue.subscriptions
          : {},
      tokenToSignature:
        parsedValue && typeof parsedValue.tokenToSignature === "object" && parsedValue.tokenToSignature
          ? parsedValue.tokenToSignature
          : {},
    };
  } catch {
    return {
      subscriptions: {},
      tokenToSignature: {},
    };
  }
};

const writeLocalAlertsState = async (state: JobAlertLocalState) => {
  await fs.mkdir(path.dirname(localAlertsFilePath), { recursive: true });
  await fs.writeFile(localAlertsFilePath, JSON.stringify(state, null, 2), "utf8");
};

const assertVercelBlobConfigured = () => {
  if (!hasVercelBlobConfig) {
    throw new JobAlertConfigurationError(
      "Vercel Blob is not configured for this production deployment.",
    );
  }
};

const readVercelBlobJson = async <Value>(pathname: string): Promise<Value | null> => {
  assertVercelBlobConfigured();

  const blob = await getVercelBlob(pathname, {
    access: "private",
  });

  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null;
  }

  const rawValue = await new Response(blob.stream).text();
  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as Value;
};

const writeVercelBlobJson = async (pathname: string, value: unknown) => {
  assertVercelBlobConfigured();

  await putVercelBlob(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
};

const listVercelBlobJson = async <Value>(prefix: string) => {
  assertVercelBlobConfigured();

  const values: Value[] = [];
  let cursor: string | undefined;

  do {
    const page = await listVercelBlobs({
      cursor,
      limit: 1000,
      prefix,
    });

    const pageValues = await Promise.all(
      page.blobs.map((entry) => readVercelBlobJson<Value>(entry.pathname)),
    );

    for (const value of pageValues) {
      if (value !== null) {
        values.push(value);
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return values;
};

const listStoredSubscriptions = async () => {
  if (shouldUseLocalAlertsFileStore) {
    const state = await readLocalAlertsState();
    return Object.values(state.subscriptions);
  }

  assertConfiguredProductionStorage();

  if (configuredStorageProvider === "vercel-blob") {
    return listVercelBlobJson<JobAlertSubscription>(subscriptionPrefix);
  }

  const store = getAlertsStore();
  const subscriptions: JobAlertSubscription[] = [];

  for await (const page of store.list({ prefix: subscriptionPrefix, paginate: true })) {
    const pageSubscriptions = await Promise.all(
      page.blobs.map(async (entry) => {
        const value = await store.get(entry.key, { type: "json" });
        return value as JobAlertSubscription | null;
      }),
    );

    subscriptions.push(
      ...pageSubscriptions.filter((subscription): subscription is JobAlertSubscription =>
        Boolean(subscription),
      ),
    );
  }

  return subscriptions;
};

export const listJobAlertSubscriptions = async () =>
  (await listStoredSubscriptions())
    .map((subscription) => hydrateJobAlertSubscription(subscription))
    .filter((subscription): subscription is JobAlertSubscription => Boolean(subscription))
    .sort(
      (firstSubscription, secondSubscription) =>
        new Date(secondSubscription.updatedAt).getTime() -
        new Date(firstSubscription.updatedAt).getTime(),
    );

const getStoredSubscriptionBySignature = async (signature: string) => {
  if (shouldUseLocalAlertsFileStore) {
    const state = await readLocalAlertsState();
    return hydrateJobAlertSubscription(state.subscriptions[signature] || null);
  }

  assertConfiguredProductionStorage();

  if (configuredStorageProvider === "vercel-blob") {
    return hydrateJobAlertSubscription(
      await readVercelBlobJson<JobAlertSubscription>(toSubscriptionKey(signature)),
    );
  }

  const store = getAlertsStore();
  const value = await store.get(toSubscriptionKey(signature), { type: "json" });
  return hydrateJobAlertSubscription((value as JobAlertSubscription | null) || null);
};

const persistSubscription = async (subscription: JobAlertSubscription) => {
  if (shouldUseLocalAlertsFileStore) {
    const state = await readLocalAlertsState();
    state.subscriptions[subscription.signature] = subscription;
    state.tokenToSignature[subscription.unsubscribeToken] = subscription.signature;
    await writeLocalAlertsState(state);
    return;
  }

  assertConfiguredProductionStorage();

  if (configuredStorageProvider === "vercel-blob") {
    await Promise.all([
      writeVercelBlobJson(toSubscriptionKey(subscription.signature), subscription),
      writeVercelBlobJson(toTokenKey(subscription.unsubscribeToken), {
        signature: subscription.signature,
      } satisfies JobAlertTokenRecord),
    ]);
    return;
  }

  const store = getAlertsStore();
  await Promise.all([
    store.setJSON(toSubscriptionKey(subscription.signature), subscription),
    store.setJSON(toTokenKey(subscription.unsubscribeToken), {
      signature: subscription.signature,
    } satisfies JobAlertTokenRecord),
  ]);
};

export const deleteJobAlertSubscription = async (signature: string) => {
  const normalizedSignature = signature.trim();

  if (!normalizedSignature) {
    return null;
  }

  const subscription = await getStoredSubscriptionBySignature(normalizedSignature);

  if (!subscription) {
    return null;
  }

  if (shouldUseLocalAlertsFileStore) {
    const state = await readLocalAlertsState();
    delete state.subscriptions[normalizedSignature];
    delete state.tokenToSignature[subscription.unsubscribeToken];
    await writeLocalAlertsState(state);
    return subscription;
  }

  assertConfiguredProductionStorage();

  if (configuredStorageProvider === "vercel-blob") {
    await deleteVercelBlob([
      toSubscriptionKey(normalizedSignature),
      toTokenKey(subscription.unsubscribeToken),
    ]);
    return subscription;
  }

  const store = getAlertsStore();
  await Promise.all([
    store.delete(toSubscriptionKey(normalizedSignature)),
    store.delete(toTokenKey(subscription.unsubscribeToken)),
  ]);

  return subscription;
};

const getStoredSubscriptionByUnsubscribeToken = async (token: string) => {
  if (!token.trim()) {
    return null;
  }

  if (shouldUseLocalAlertsFileStore) {
    const state = await readLocalAlertsState();
    const signature = state.tokenToSignature[token];
    if (!signature) {
      return null;
    }

    return hydrateJobAlertSubscription(state.subscriptions[signature] || null);
  }

  assertConfiguredProductionStorage();

  if (configuredStorageProvider === "vercel-blob") {
    const tokenRecord = await readVercelBlobJson<JobAlertTokenRecord>(toTokenKey(token));

    if (!tokenRecord?.signature) {
      return null;
    }

    return getStoredSubscriptionBySignature(tokenRecord.signature);
  }

  const store = getAlertsStore();
  const tokenRecord = (await store.get(toTokenKey(token), {
    type: "json",
  })) as JobAlertTokenRecord | null;

  if (!tokenRecord?.signature) {
    return null;
  }

  return getStoredSubscriptionBySignature(tokenRecord.signature);
};

const appendSentJobSlugs = (subscription: JobAlertSubscription, jobSlugs: string[]) => {
  const nextSentJobSlugs = Array.from(
    new Set([...jobSlugs, ...subscription.sentJobSlugs].filter(Boolean)),
  ).slice(0, maxTrackedSentJobSlugs);

  return nextSentJobSlugs;
};

const getLocalDateKey = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const wasAlertSentToday = (
  subscription: JobAlertSubscription,
  checkedAt: string,
) => {
  if (!subscription.lastSentAt) {
    return false;
  }

  const timeZone = normalizeTimeZone(subscription.timeZone);
  const lastSentDate = new Date(subscription.lastSentAt);
  const checkedDate = new Date(checkedAt);

  if (
    Number.isNaN(lastSentDate.getTime()) ||
    Number.isNaN(checkedDate.getTime())
  ) {
    return false;
  }

  return getLocalDateKey(lastSentDate, timeZone) === getLocalDateKey(checkedDate, timeZone);
};

const toDateOnlyEndTimestamp = (value: string) => Date.parse(`${value}T23:59:59.999Z`);

const getJobPostedTimestamp = (job: JobPost) => {
  const exactPublishedAt =
    "publishedAt" in job && typeof job.publishedAt === "string" ? job.publishedAt : "";

  for (const value of [exactPublishedAt, job.updatedAt, job.date]) {
    if (!value) {
      continue;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const endOfDayTimestamp = toDateOnlyEndTimestamp(value);
      if (!Number.isNaN(endOfDayTimestamp)) {
        return endOfDayTimestamp;
      }
    }

    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return 0;
};

const wasJobPostedAfterLastAlert = (job: JobPost, subscription: JobAlertSubscription) => {
  if (!subscription.lastSentAt) {
    return true;
  }

  const lastSentTimestamp = Date.parse(subscription.lastSentAt);
  if (Number.isNaN(lastSentTimestamp)) {
    return true;
  }

  return getJobPostedTimestamp(job) > lastSentTimestamp;
};

const buildJobsDigestSubject = (
  subscription: JobAlertSubscription,
  matchedJobs: JobPost[],
  summary = buildJobAlertSummary(subscription.filters),
) => {
  const prefix = matchedJobs.length === 1 ? "1 new job" : `${matchedJobs.length} new jobs`;

  return `${siteName} alert: ${prefix} for ${summary}`;
};

const buildUnsubscribeUrl = (token: string) =>
  `${siteUrl}/api/job-alerts/unsubscribe?token=${encodeURIComponent(token)}`;

const buildJobDigestHtml = (
  subscription: JobAlertSubscription,
  matchedJobs: JobPost[],
  summary = buildJobAlertSummary(subscription.filters),
) => {
  const filtersQuery = buildJobAlertSearchParams(subscription.filters);
  const browseUrl = filtersQuery ? `${siteUrl}/jobs/?${filtersQuery}` : `${siteUrl}/jobs/`;
  const unsubscribeUrl = buildUnsubscribeUrl(subscription.unsubscribeToken);
  const greetingLine = escapeHtml(getSubscriberGreetingLine(subscription));
  const safeSummary = escapeHtml(summary);

  const jobItems = matchedJobs
    .map((job) => {
      const jobUrl = `${siteUrl}/jobs/${job.slug}/`;
      const locationParts = [job.company, job.location].filter(Boolean).join(" • ");
      const metaParts = [
        job.workMode || "",
        job.employmentType || job.jobType || "",
        job.experience || job.experienceYears || job.experienceLevel || "",
      ]
        .filter(Boolean)
        .join(" • ");

      return `
        <tr>
          <td style="padding:0 0 18px;">
            <div style="border:1px solid #dbe7e6;border-radius:16px;background:#ffffff;padding:18px 18px 16px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0f766e;font-weight:700;">${escapeHtml(job.company)}</p>
              <p style="margin:0 0 8px;font-size:22px;line-height:1.2;color:#0f172a;font-family:Georgia,serif;font-weight:700;">
                <a href="${escapeHtml(jobUrl)}" style="color:#0f172a;text-decoration:none;">${escapeHtml(job.title)}</a>
              </p>
              ${
                locationParts
                  ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#475569;">${escapeHtml(locationParts)}</p>`
                  : ""
              }
              ${
                metaParts
                  ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#64748b;">${escapeHtml(metaParts)}</p>`
                  : ""
              }
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#526171;">${escapeHtml(
                job.summary || job.excerpt || "Open the listing to view the full role details.",
              )}</p>
              <a href="${escapeHtml(jobUrl)}" style="display:inline-block;padding:10px 16px;border-radius:12px;background:#0d9488;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">View job</a>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;">
        <tr>
          <td style="padding:0 0 20px;">
            <div style="border:1px solid #dbe7e6;border-radius:22px;background:linear-gradient(180deg,#ffffff 0%,#f0fdfa 100%);padding:24px;">
              <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#0f766e;font-weight:700;">Job Alert</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:#0f172a;font-weight:600;">${greetingLine}</p>
              <h1 style="margin:0 0 12px;font-size:34px;line-height:1.08;font-family:Georgia,serif;color:#0f172a;">${matchedJobs.length} new ${
                matchedJobs.length === 1 ? "job matches" : "job matches"
              }</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#526171;">
                Today we found <strong>${matchedJobs.length} new ${
                  matchedJobs.length === 1 ? "job" : "jobs"
                }</strong> matching ${safeSummary}.
              </p>
              <a href="${escapeHtml(browseUrl)}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#0d9488;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Browse matching jobs</a>
            </div>
          </td>
        </tr>
        ${jobItems}
        <tr>
          <td style="padding-top:8px;">
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">
              You are receiving this because you asked for a daily JobAdvice alert for ${safeSummary}.
            </p>
            <p style="margin:0;font-size:13px;line-height:1.6;">
              <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0f766e;text-decoration:underline;">Unsubscribe from this alert</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const buildJobDigestText = (
  subscription: JobAlertSubscription,
  matchedJobs: JobPost[],
  summary = buildJobAlertSummary(subscription.filters),
) => {
  const browseQuery = buildJobAlertSearchParams(subscription.filters);
  const browseUrl = browseQuery ? `${siteUrl}/jobs/?${browseQuery}` : `${siteUrl}/jobs/`;
  const unsubscribeUrl = buildUnsubscribeUrl(subscription.unsubscribeToken);

  const jobLines = matchedJobs
    .map((job) => {
      const meta = [
        job.company,
        job.location,
        job.workMode || "",
        job.employmentType || job.jobType || "",
      ]
        .filter(Boolean)
        .join(" • ");

      return `- ${job.title}\n  ${meta}\n  ${siteUrl}/jobs/${job.slug}/`;
    })
    .join("\n\n");

  return [
    getSubscriberGreetingLine(subscription),
    "",
    `Today we found ${matchedJobs.length} new ${matchedJobs.length === 1 ? "job" : "jobs"} matching ${summary}.`,
    "",
    jobLines,
    "",
    `Browse all matching jobs: ${browseUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
};

const buildWelcomeAlertSubject = (subscription: JobAlertSubscription) => {
  const summary = buildJobAlertSummary(subscription.filters);
  return `${siteName}: welcome to daily alerts for ${summary}`;
};

const buildWelcomeAlertHtml = (subscription: JobAlertSubscription) => {
  const summary = buildJobAlertSummary(subscription.filters);
  const browseUrl = buildJobAlertBrowseUrl(subscription.filters);
  const unsubscribeUrl = buildUnsubscribeUrl(subscription.unsubscribeToken);

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;">
        <tr>
          <td style="padding:0 0 20px;">
            <div style="border:1px solid #dbe7e6;border-radius:22px;background:linear-gradient(180deg,#ffffff 0%,#f0fdfa 100%);padding:24px;">
              <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#0f766e;font-weight:700;">Welcome</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:#0f172a;font-weight:600;">${escapeHtml(
                getSubscriberGreetingLine(subscription),
              )}</p>
              <h1 style="margin:0 0 12px;font-size:34px;line-height:1.08;font-family:Georgia,serif;color:#0f172a;">Your daily alert is live</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#526171;">
                ${escapeHtml(getSubscriberThanksLine(subscription))} We will send fresh verified jobs for <strong>${escapeHtml(
                  summary,
                )}</strong> whenever new matches are published.
              </p>
              <a href="${escapeHtml(
                browseUrl,
              )}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#0d9488;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Browse matching jobs</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 18px;">
            <div style="border:1px solid #dbe7e6;border-radius:18px;background:#ffffff;padding:18px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0f766e;font-weight:700;">What happens next</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#526171;">You will receive one email per day for this saved filter when new matching jobs are available.</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#526171;">You can unsubscribe anytime from the footer of any alert email.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding-top:8px;">
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">
              Saved alert: ${escapeHtml(summary)}
            </p>
            <p style="margin:0;font-size:13px;line-height:1.6;">
              <a href="${escapeHtml(unsubscribeUrl)}" style="color:#0f766e;text-decoration:underline;">Unsubscribe from this alert</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const buildWelcomeAlertText = (subscription: JobAlertSubscription) => {
  const summary = buildJobAlertSummary(subscription.filters);
  const browseUrl = buildJobAlertBrowseUrl(subscription.filters);
  const unsubscribeUrl = buildUnsubscribeUrl(subscription.unsubscribeToken);

  return [
    getSubscriberGreetingLine(subscription),
    "",
    `${getSubscriberThanksLine(subscription)} Your daily alert is live for ${summary}.`,
    "",
    `Browse matching jobs: ${browseUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
};

const sendEmail = async ({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> => {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const fromEmail =
    (process.env.JOB_ALERTS_FROM_EMAIL || process.env.EMAIL_FROM || "").trim();

  if (!resendApiKey || !fromEmail) {
    throw new JobAlertConfigurationError(
      "Missing RESEND_API_KEY or JOB_ALERTS_FROM_EMAIL. Configure both to send job alert emails.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  // Always consume the body so Undici can safely reuse the connection on
  // long-lived serverless instances.
  const responseBody = await response.text();

  if (!response.ok) {
    const rateLimitRemaining = response.headers.get("ratelimit-remaining");
    const retryAfter = response.headers.get("retry-after");
    const quotaHint =
      rateLimitRemaining || retryAfter
        ? ` (ratelimit-remaining=${rateLimitRemaining || "unknown"}, retry-after=${retryAfter || "unknown"})`
        : "";

    throw new Error(`Resend send failed: ${response.status} ${responseBody}${quotaHint}`);
  }

  if (!responseBody) {
    return {
      id: null,
    };
  }

  try {
    const payload = JSON.parse(responseBody) as { id?: string };
    return {
      id: typeof payload.id === "string" ? payload.id : null,
    };
  } catch {
    return {
      id: null,
    };
  }
};

export const createJobAlertSubscription = async (
  email: string,
  rawFilters: Partial<JobAlertFilters>,
  name: string,
  timeZone?: string,
): Promise<JobAlertUpsertResult> => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeSubscriberName(name);
  const filters = normalizeJobAlertFilters(rawFilters);

  if (!isValidEmail(normalizedEmail)) {
    throw new JobAlertValidationError("Please enter a valid email address.");
  }

  if (!normalizedName) {
    throw new JobAlertValidationError("Please enter your name.");
  }

  if (!hasActiveJobAlertFilters(filters)) {
    throw new JobAlertValidationError("Choose at least one filter before creating an alert.");
  }

  const signature = createAlertSignature(normalizedEmail, filters);
  const existingSubscription = await getStoredSubscriptionBySignature(signature);

  if (existingSubscription?.isActive) {
    if (normalizeSubscriberName(existingSubscription.name || "") !== normalizedName) {
      const nextSubscription: JobAlertSubscription = {
        ...existingSubscription,
        name: normalizedName,
        timeZone: normalizeTimeZone(timeZone || existingSubscription.timeZone),
        updatedAt: new Date().toISOString(),
      };

      await persistSubscription(nextSubscription);

      return {
        status: "already_subscribed",
        subscription: nextSubscription,
      };
    }

    return {
      status: "already_subscribed",
      subscription: existingSubscription,
    };
  }

  const now = new Date().toISOString();
  const subscription: JobAlertSubscription = {
    signature,
    email: normalizedEmail,
    name: normalizedName,
    filters,
    channel: "email",
    frequency: "daily",
    isActive: true,
    timeZone: normalizeTimeZone(timeZone || existingSubscription?.timeZone),
    createdAt: existingSubscription?.createdAt || now,
    updatedAt: now,
    lastSentAt: existingSubscription?.lastSentAt || null,
    welcomeEmailSentAt: null,
    unsubscribeToken: existingSubscription?.unsubscribeToken || randomUUID(),
    sentJobSlugs: existingSubscription?.sentJobSlugs || [],
  };

  await persistSubscription(subscription);

  return {
    status: existingSubscription ? "reactivated" : "created",
    subscription,
  };
};

export const unsubscribeJobAlertSubscription = async (token: string) => {
  const subscription = await getStoredSubscriptionByUnsubscribeToken(token.trim());

  if (!subscription) {
    return null;
  }

  const nextSubscription: JobAlertSubscription = {
    ...subscription,
    isActive: false,
    updatedAt: new Date().toISOString(),
  };

  await persistSubscription(nextSubscription);

  return nextSubscription;
};

export const runDailyJobAlerts = async (
  options: JobAlertRunOptions = {},
): Promise<JobAlertRunSummary> => {
  const checkedAt = new Date().toISOString();
  const forceRun = Boolean(options.force);
  const includeAlreadySent = Boolean(options.includeAlreadySent);
  const activeSubscriptions = (await listStoredSubscriptions())
    .map((subscription) => hydrateJobAlertSubscription(subscription))
    .filter(
      (subscription): subscription is JobAlertSubscription =>
        Boolean(subscription?.isActive),
    );

  if (activeSubscriptions.length === 0) {
    return {
      activeAlerts: 0,
      checkedAt,
      emailsSent: 0,
      errors: [],
      matchedJobs: 0,
      skippedAlreadySentToday: 0,
      skippedAlerts: 0,
      skippedNoNewMatches: 0,
      storageProvider: configuredStorageProvider,
      uniqueRecipients: 0,
    };
  }

  const jobs = await getAllJobsForAlerts();
  let emailsSent = 0;
  let matchedJobs = 0;
  let skippedAlerts = 0;
  let skippedAlreadySentToday = 0;
  let skippedNoNewMatches = 0;
  const errors: string[] = [];
  const subscriptionsByEmail = new Map<string, JobAlertSubscription[]>();

  for (const subscription of activeSubscriptions) {
    const subscriptionsForEmail = subscriptionsByEmail.get(subscription.email) || [];
    subscriptionsForEmail.push(subscription);
    subscriptionsByEmail.set(subscription.email, subscriptionsForEmail);
  }

  for (const subscriptionsForEmail of subscriptionsByEmail.values()) {
    const [primarySubscription] = subscriptionsForEmail;

    if (
      !forceRun &&
      subscriptionsForEmail.some((subscription) => wasAlertSentToday(subscription, checkedAt))
    ) {
      skippedAlerts += subscriptionsForEmail.length;
      skippedAlreadySentToday += subscriptionsForEmail.length;
      continue;
    }

    const jobsBySlug = new Map<string, JobPost>();
    const sentSlugsBySubscription = new Map<string, string[]>();

    for (const subscription of subscriptionsForEmail) {
      const unsentJobsForSubscription = sortJobsByFilters(
        filterJobsByAlertFilters(jobs, subscription.filters),
        "newest",
      )
        .filter((job) => includeAlreadySent || wasJobPostedAfterLastAlert(job, subscription))
        .filter((job) => includeAlreadySent || !subscription.sentJobSlugs.includes(job.slug))
        .slice(0, 10);

      if (unsentJobsForSubscription.length === 0) {
        continue;
      }

      sentSlugsBySubscription.set(
        subscription.signature,
        unsentJobsForSubscription.map((job) => job.slug),
      );

      for (const job of unsentJobsForSubscription) {
        jobsBySlug.set(job.slug, job);
      }
    }

    const unsentJobs = sortJobsByFilters([...jobsBySlug.values()], "newest").slice(0, 10);

    if (unsentJobs.length === 0) {
      skippedAlerts += subscriptionsForEmail.length;
      skippedNoNewMatches += subscriptionsForEmail.length;
      continue;
    }

    const digestSummary =
      subscriptionsForEmail.length === 1
        ? buildJobAlertSummary(primarySubscription.filters)
        : "your saved job alert profile";

    try {
      const sentJobSlugsInDigest = new Set(unsentJobs.map((job) => job.slug));

      await sendEmail({
        to: primarySubscription.email,
        subject: buildJobsDigestSubject(primarySubscription, unsentJobs, digestSummary),
        html: buildJobDigestHtml(primarySubscription, unsentJobs, digestSummary),
        text: buildJobDigestText(primarySubscription, unsentJobs, digestSummary),
      });

      await Promise.all(
        subscriptionsForEmail.map((subscription) => {
          const sentSlugs = (sentSlugsBySubscription.get(subscription.signature) || []).filter(
            (slug) => sentJobSlugsInDigest.has(slug),
          );
          const nextSubscription: JobAlertSubscription = {
            ...subscription,
            lastSentAt: sentSlugs.length > 0 ? checkedAt : subscription.lastSentAt,
            updatedAt: checkedAt,
            sentJobSlugs:
              sentSlugs.length > 0
                ? appendSentJobSlugs(subscription, sentSlugs)
                : subscription.sentJobSlugs,
          };

          return persistSubscription(nextSubscription);
        }),
      );
      emailsSent += 1;
      matchedJobs += unsentJobs.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email send failure.";
      errors.push(`${primarySubscription.email}: ${message}`);
    }
  }

  return {
    activeAlerts: activeSubscriptions.length,
    checkedAt,
    emailsSent,
    errors,
    matchedJobs,
    skippedAlreadySentToday,
    skippedAlerts,
    skippedNoNewMatches,
    storageProvider: configuredStorageProvider,
    uniqueRecipients: subscriptionsByEmail.size,
  };
};

export const buildJobAlertSuccessMessage = (result: JobAlertUpsertResult) => {
  const summary = buildJobAlertSummary(result.subscription.filters);
  const prefix = `${getSubscriberThanksLine(result.subscription)} `;

  if (result.status === "already_subscribed") {
    return `${prefix}This daily alert already exists for ${summary}.`;
  }

  if (result.status === "reactivated") {
    return `${prefix}Daily alert reactivated for ${summary}.`;
  }

  return `${prefix}Daily alert created for ${summary}.`;
};

export const sendJobAlertWelcomeEmail = async (subscription: JobAlertSubscription) => {
  return sendEmail({
    to: subscription.email,
    subject: buildWelcomeAlertSubject(subscription),
    html: buildWelcomeAlertHtml(subscription),
    text: buildWelcomeAlertText(subscription),
  });
};

export const markJobAlertWelcomeEmailSent = async (subscription: JobAlertSubscription) => {
  const sentAt = new Date().toISOString();
  const nextSubscription: JobAlertSubscription = {
    ...subscription,
    updatedAt: sentAt,
    welcomeEmailSentAt: sentAt,
  };

  await persistSubscription(nextSubscription);
  return nextSubscription;
};

export const buildJobAlertEmailPreview = (subscription: JobAlertSubscription, jobs: JobPost[]) => ({
  html: buildJobDigestHtml(subscription, jobs),
  text: buildJobDigestText(subscription, jobs),
});

export const buildJobAlertSummaryLine = (filters: JobAlertFilters) => buildJobAlertSummary(filters);

export const buildJobAlertBrowseUrl = (filters: JobAlertFilters) => {
  const query = buildJobAlertSearchParams(filters);
  return query ? `${siteUrl}/jobs/?${query}` : `${siteUrl}/jobs/`;
};

export const formatAlertJobMeta = (job: JobPost) =>
  [
    job.company,
    job.location,
    job.workMode || "",
    job.employmentType || job.jobType || "",
    formatPostedDate(job.date),
  ]
    .filter(Boolean)
    .join(" • ");
