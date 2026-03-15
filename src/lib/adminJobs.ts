import { getAllJobsForAdmin, type JobPost } from "./jobs";
import { getRemoteJobRecords, shouldUseRemoteAdminRecords } from "./adminRepoRecords";
import { toContentSlug } from "./slug";

export type AdminJobRecord = {
  slug: string;
  title: string;
  company: string;
  location: string;
  applyLink: string;
  date: string;
  updatedAt: string;
  draft: boolean;
};

export type DuplicateCheckInput = {
  title: string;
  company: string;
  applyLink?: string;
  slug?: string;
};

export type DuplicateMatch = AdminJobRecord & {
  score: number;
  matchType: "exact" | "similar";
  reasons: string[];
};

type NormalizedJobRecord = AdminJobRecord & {
  normalizedTitle: string;
  normalizedCompany: string;
  normalizedApplyLink: string;
  titleTokens: Set<string>;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/c\+\+/g, "cplusplus")
    .replace(/c#/g, "csharp")
    .replace(/node\.js/g, "nodejs")
    .replace(/next\.js/g, "nextjs")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeApplyLink = (value: string) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  try {
    const parsed = new URL(rawValue);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin.toLowerCase()}${normalizedPath}`;
  } catch {
    return "";
  }
};

const toTokenSet = (value: string) =>
  new Set(
    normalizeText(value)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1),
  );

const overlapScore = (firstSet: Set<string>, secondSet: Set<string>) => {
  if (firstSet.size === 0 || secondSet.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const token of firstSet) {
    if (secondSet.has(token)) {
      shared += 1;
    }
  }

  const baseSize = Math.max(firstSet.size, secondSet.size);
  if (baseSize === 0) {
    return 0;
  }

  return shared / baseSize;
};

const toAdminRecord = (job: JobPost): AdminJobRecord => ({
  slug: job.slug,
  title: job.title,
  company: job.company,
  location: job.location,
  applyLink: job.applyLink || "",
  date: job.date,
  updatedAt: job.updatedAt,
  draft: job.draft,
});

const toNormalizedRecord = (record: AdminJobRecord): NormalizedJobRecord => ({
  ...record,
  normalizedTitle: normalizeText(record.title),
  normalizedCompany: normalizeText(record.company),
  normalizedApplyLink: normalizeApplyLink(record.applyLink),
  titleTokens: toTokenSet(record.title),
});

const toUtcDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toDateTimestampOrNull = (value: string) => {
  if (!isValidIsoDate(value)) {
    return null;
  }

  const timestamp = toUtcDayTimestamp(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
};

const sortByRecentDate = (firstRecord: AdminJobRecord, secondRecord: AdminJobRecord) => {
  const firstDate = toDateTimestampOrNull(firstRecord.date) || 0;
  const secondDate = toDateTimestampOrNull(secondRecord.date) || 0;
  if (secondDate !== firstDate) {
    return secondDate - firstDate;
  }

  const firstUpdatedAt = toDateTimestampOrNull(firstRecord.updatedAt) || 0;
  const secondUpdatedAt = toDateTimestampOrNull(secondRecord.updatedAt) || 0;
  if (secondUpdatedAt !== firstUpdatedAt) {
    return secondUpdatedAt - firstUpdatedAt;
  }

  return firstRecord.slug.localeCompare(secondRecord.slug);
};

export const getAdminJobRecords = async () => {
  if (shouldUseRemoteAdminRecords()) {
    try {
      const remoteRecords = await getRemoteJobRecords();
      if (remoteRecords.length > 0) {
        return remoteRecords.sort(sortByRecentDate);
      }
    } catch (error) {
      console.error("[adminJobs] Falling back to bundled job records:", error);
    }
  }

  const jobs = await getAllJobsForAdmin();
  return jobs.map(toAdminRecord).sort(sortByRecentDate);
};

export const filterAdminJobRecordsByDate = (
  records: AdminJobRecord[],
  fromDate: string,
  toDate: string,
) => {
  const fromTimestamp = toDateTimestampOrNull(fromDate);
  const toTimestamp = toDateTimestampOrNull(toDate);

  if (fromTimestamp === null || toTimestamp === null) {
    return [] as AdminJobRecord[];
  }

  const normalizedFromTimestamp = Math.min(fromTimestamp, toTimestamp);
  const normalizedToTimestamp = Math.max(fromTimestamp, toTimestamp);

  return records.filter((record) => {
    const recordTimestamp = toDateTimestampOrNull(record.date);
    if (recordTimestamp === null) {
      return false;
    }

    return (
      recordTimestamp >= normalizedFromTimestamp &&
      recordTimestamp <= normalizedToTimestamp
    );
  });
};

export const findDuplicateJobs = async (input: DuplicateCheckInput) => {
  const records = await getAdminJobRecords();
  const normalizedInputTitle = normalizeText(input.title);
  const normalizedInputCompany = normalizeText(input.company);
  const normalizedInputApplyLink = normalizeApplyLink(String(input.applyLink || ""));
  const inputTitleTokens = toTokenSet(input.title);
  const inputSlug = toContentSlug(String(input.slug || ""));

  const candidates = records
    .filter((record) => (inputSlug ? record.slug !== inputSlug : true))
    .map(toNormalizedRecord);

  const exactMatches: DuplicateMatch[] = [];
  const similarMatches: DuplicateMatch[] = [];

  for (const candidate of candidates) {
    const reasons: string[] = [];
    const sameApplyLink =
      Boolean(normalizedInputApplyLink) &&
      Boolean(candidate.normalizedApplyLink) &&
      normalizedInputApplyLink === candidate.normalizedApplyLink;
    const sameTitle =
      Boolean(normalizedInputTitle) &&
      normalizedInputTitle === candidate.normalizedTitle;
    const sameCompany =
      Boolean(normalizedInputCompany) &&
      normalizedInputCompany === candidate.normalizedCompany;
    const titleSimilarity = overlapScore(inputTitleTokens, candidate.titleTokens);
    const companyMatches = sameCompany;

    if (sameApplyLink) {
      reasons.push("Same apply link");
    }
    if (sameTitle) {
      reasons.push("Same job title");
    }
    if (sameCompany) {
      reasons.push("Same company");
    }

    // Company career portals often reuse one apply URL for multiple roles.
    // Treating the apply link alone as an exact duplicate blocks legitimate jobs.
    if (sameTitle && sameCompany) {
      exactMatches.push({
        slug: candidate.slug,
        title: candidate.title,
        company: candidate.company,
        location: candidate.location,
        applyLink: candidate.applyLink,
        date: candidate.date,
        updatedAt: candidate.updatedAt,
        draft: candidate.draft,
        score: 100,
        matchType: "exact",
        reasons,
      });
      continue;
    }

    const titleCompanySimilarityScore = titleSimilarity * 80 + (companyMatches ? 20 : 0);
    const applyLinkSimilarityScore = sameApplyLink
      ? titleSimilarity * 60 + (companyMatches ? 15 : 0) + 30
      : 0;
    const similarityScore = Math.min(
      100,
      Math.round(Math.max(titleCompanySimilarityScore, applyLinkSimilarityScore)),
    );

    if (
      titleSimilarity >= 0.72 ||
      (companyMatches && titleSimilarity >= 0.62) ||
      (sameApplyLink && (titleSimilarity >= 0.2 || companyMatches))
    ) {
      const similarReasons = [];
      if (sameApplyLink) {
        similarReasons.push("Apply link matched");
      }
      if (companyMatches) {
        similarReasons.push("Company matched");
      }
      similarReasons.push(`Title similarity ${Math.round(titleSimilarity * 100)}%`);

      similarMatches.push({
        slug: candidate.slug,
        title: candidate.title,
        company: candidate.company,
        location: candidate.location,
        applyLink: candidate.applyLink,
        date: candidate.date,
        updatedAt: candidate.updatedAt,
        draft: candidate.draft,
        score: similarityScore,
        matchType: "similar",
        reasons: similarReasons,
      });
    }
  }

  exactMatches.sort((first, second) => sortByRecentDate(first, second));
  similarMatches.sort((first, second) => second.score - first.score);

  return {
    exactMatches,
    similarMatches: similarMatches.slice(0, 8),
  };
};
