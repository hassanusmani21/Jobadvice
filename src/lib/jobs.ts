import { promises as fs } from "node:fs";
import path from "node:path";
import { toIsoDateString } from "./dateParsing";
import { toContentSlug } from "./slug";

const jobsDirectory = path.join(process.cwd(), "content", "jobs");
const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
const placeholderSlugPattern = /^\{\{.+\}\}$/;
const millisecondsInDay = 24 * 60 * 60 * 1000;
const defaultNoExpiryRetentionDays = 30;
const relatedJobsStopWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "job",
  "role",
  "opening",
  "opportunity",
  "full",
  "time",
]);

const relatedJobDomainKeywords = {
  tech: [
    "software",
    "developer",
    "development",
    "engineering",
    "engineer",
    "frontend",
    "backend",
    "fullstack",
    "java",
    "python",
    "javascript",
    "typescript",
    "react",
    "nodejs",
    "nextjs",
    "cloud",
    "aws",
    "azure",
    "devops",
    "database",
    "sql",
    "api",
    "application",
    "it",
    "automation",
    "testing",
    "ai",
    "ml",
    "machine",
    "data",
  ],
  finance: [
    "accounts",
    "accounting",
    "finance",
    "financial",
    "treasury",
    "invoice",
    "billing",
    "receivable",
    "payable",
    "audit",
    "tax",
    "collection",
  ],
  operations: [
    "operations",
    "support",
    "service",
    "process",
    "compliance",
    "logistics",
    "procurement",
    "supply",
    "admin",
  ],
  sales: [
    "sales",
    "marketing",
    "growth",
    "business",
    "recruiter",
    "recruitment",
    "talent",
    "hr",
    "human",
    "customer",
  ],
  coreEngineering: [
    "mechanical",
    "electrical",
    "civil",
    "manufacturing",
    "production",
    "industrial",
    "tool",
    "cad",
    "cam",
    "automotive",
    "plant",
    "quality",
  ],
} as const;

type RelatedJobDomain = keyof typeof relatedJobDomainKeywords | "general";
type RelatedJobGroup = "tech" | "non_tech" | "general";

type RelatedJobProfile = {
  domain: RelatedJobDomain;
  group: RelatedJobGroup;
};

type RelatedJobSignals = {
  titleTokens: Set<string>;
  skillTokens: Set<string>;
  contextTokens: Set<string>;
  locationTokens: Set<string>;
  employmentType: string;
  workMode: string;
  profile: RelatedJobProfile;
};

const resolveNoExpiryRetentionDays = () => {
  const rawValue = Number.parseInt(
    process.env.NO_EXPIRY_JOB_RETENTION_DAYS || "",
    10,
  );

  if (Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue;
  }

  return defaultNoExpiryRetentionDays;
};

const noExpiryRetentionDays = resolveNoExpiryRetentionDays();

const normalizeTextForTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/c\+\+/g, "cplusplus")
    .replace(/c#/g, "csharp")
    .replace(/node\.js/g, "nodejs")
    .replace(/next\.js/g, "nextjs")
    .replace(/[^\da-z\s]+/g, " ");

const toTokenSet = (value: string) =>
  new Set(
    normalizeTextForTokens(value)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !relatedJobsStopWords.has(token)),
  );

const countSharedTokens = (
  firstTokens: Set<string>,
  secondTokens: Set<string>,
  maxMatches = Number.POSITIVE_INFINITY,
) => {
  let matches = 0;
  for (const token of firstTokens) {
    if (!secondTokens.has(token)) {
      continue;
    }

    matches += 1;
    if (matches >= maxMatches) {
      break;
    }
  }

  return matches;
};

const resolveRelatedJobProfile = (job: JobPost): RelatedJobProfile => {
  const profileTokens = toTokenSet(
    [
      job.title,
      job.summary || "",
      job.excerpt,
      job.experience || "",
      job.experienceLevel || "",
      job.experienceYears || "",
      job.employmentType || job.jobType || "",
      job.workMode || "",
      job.skills.join(" "),
      job.responsibilities.join(" "),
      job.education.join(" "),
    ].join(" "),
  );

  let bestDomain: RelatedJobDomain = "general";
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(relatedJobDomainKeywords)) {
    const score = keywords.reduce(
      (total, keyword) => total + (profileTokens.has(keyword) ? 1 : 0),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain as Exclude<RelatedJobDomain, "general">;
    }
  }

  if (bestScore < 2) {
    return {
      domain: "general",
      group: "general",
    };
  }

  return {
    domain: bestDomain,
    group: bestDomain === "tech" ? "tech" : "non_tech",
  };
};

const toRelatedJobSignals = (job: JobPost): RelatedJobSignals => ({
  titleTokens: toTokenSet(job.title),
  skillTokens: toTokenSet(job.skills.join(" ")),
  contextTokens: toTokenSet(
    [
      job.title,
      job.summary || "",
      job.excerpt,
      job.experience || "",
      job.experienceLevel || "",
      job.experienceYears || "",
      job.eligibilityCriteria || "",
      job.employmentType || job.jobType || "",
      job.workMode || "",
      job.skills.join(" "),
      job.responsibilities.slice(0, 8).join(" "),
      job.education.join(" "),
    ].join(" "),
  ),
  locationTokens: toTokenSet(job.location),
  employmentType: normalizeTextForTokens(job.employmentType || job.jobType || "").trim(),
  workMode: normalizeTextForTokens(job.workMode || "").trim(),
  profile: resolveRelatedJobProfile(job),
});

const scoreRelatedJob = (
  sourceSignals: RelatedJobSignals,
  candidateSignals: RelatedJobSignals,
) => {
  const sharedSkillTokens = countSharedTokens(
    sourceSignals.skillTokens,
    candidateSignals.skillTokens,
    6,
  );
  const sharedTitleTokens = countSharedTokens(
    sourceSignals.titleTokens,
    candidateSignals.titleTokens,
    4,
  );
  const sharedContextTokens = countSharedTokens(
    sourceSignals.contextTokens,
    candidateSignals.contextTokens,
    12,
  );
  const sharedLocationTokens = countSharedTokens(
    sourceSignals.locationTokens,
    candidateSignals.locationTokens,
    2,
  );

  let score =
    sharedSkillTokens * 8 +
    sharedTitleTokens * 5 +
    sharedContextTokens * 2 +
    sharedLocationTokens;

  if (
    sourceSignals.profile.domain !== "general" &&
    sourceSignals.profile.domain === candidateSignals.profile.domain
  ) {
    score += 14;
  } else if (
    sourceSignals.profile.group !== "general" &&
    sourceSignals.profile.group === candidateSignals.profile.group
  ) {
    score += 6;
  }

  if (
    sourceSignals.employmentType &&
    sourceSignals.employmentType === candidateSignals.employmentType
  ) {
    score += 4;
  }

  if (sourceSignals.workMode && sourceSignals.workMode === candidateSignals.workMode) {
    score += 2;
  }

  if (
    sharedSkillTokens === 0 &&
    sharedTitleTokens === 0 &&
    sharedContextTokens <= 1
  ) {
    score -= 4;
  }

  return score;
};

const toSortableDateTimestamp = (value: string) => {
  const parsedTimestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
};

export type JobApplicationStatus = {
  state:
    | "upcoming"
    | "open"
    | "expiring_soon"
    | "expires_today"
    | "expired"
    | "no_expiry";
  label: string;
  daysRemaining: number | null;
  daysUntilOpen: number | null;
};

export type JobPost = {
  slug: string;
  title: string;
  company: string;
  location: string;
  draft: boolean;
  workMode?: string;
  salary?: string;
  skills: string[];
  responsibilities: string[];
  education: string[];
  summary?: string;
  eligibilityCriteria?: string;
  experience?: string;
  experienceLevel?: string;
  experienceYears?: string;
  workingDays?: string;
  jobTiming?: string;
  employmentType?: string;
  jobType?: string;
  applyLink?: string;
  date: string;
  updatedAt: string;
  applicationStartDate: string;
  applicationEndDate: string | null;
  applicationStatus: JobApplicationStatus;
  excerpt: string;
};

const stripWrappingQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "").trim();

const hasClosingQuote = (value: string, quote: '"' | "'") => {
  const trimmedValue = value.trimEnd();
  if (!trimmedValue.endsWith(quote)) {
    return false;
  }

  let trailingBackslashCount = 0;
  for (
    let index = trimmedValue.length - 2;
    index >= 0 && trimmedValue[index] === "\\";
    index -= 1
  ) {
    trailingBackslashCount += 1;
  }

  return trailingBackslashCount % 2 === 0;
};

const parseQuotedValue = (value: string, quote: '"' | "'") => {
  const trimmedValue = value.trim();
  if (!(trimmedValue.startsWith(quote) && hasClosingQuote(trimmedValue, quote))) {
    return stripWrappingQuotes(value);
  }

  const innerValue = trimmedValue.slice(1, -1);
  if (quote === "'") {
    return innerValue.replace(/''/g, "'").replace(/\r?\n\s*/g, " ").trim();
  }

  return innerValue
    .replace(/\\\r?\n\s*/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\r?\n\s*/g, " ")
    .trim();
};

const toDateString = (value: unknown) => toIsoDateString(value);

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "yes", "1"].includes(value.trim().toLowerCase());
};

const normalizeTextValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const extractLabeledTextValue = (markdown: string, labels: string[]) => {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const normalizeHeadingLabel = (value: string) =>
    value
      .toLowerCase()
      .replace(/^#{1,6}\s+/, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const structuredFieldHeadings = [
    "job title",
    "company name",
    "company",
    "location",
    "work mode",
    "employment type",
    "salary",
    "experience required",
    "experience",
    "eligibility criteria",
    "eligibility",
    "candidate profile",
    "education required",
    "education",
    "qualification",
    "qualifications",
    "skills required",
    "skills",
    "technical skills",
    "roles and responsibilities",
    "role and responsibilities",
    "roles responsibilities",
    "role responsibilities",
    "responsibilities",
    "working days",
    "work days",
    "job timing",
    "timing",
    "apply link",
    "application start date",
    "application end date",
  ];
  const isStructuredFieldHeading = (value: string) => {
    const normalizedValue = normalizeHeadingLabel(value);
    return structuredFieldHeadings.some(
      (heading) =>
        normalizedValue === heading || normalizedValue.startsWith(`${heading} `),
    );
  };
  const labelPatterns = labels.map((label) => ({
    inline: new RegExp(
      `^${label.trim().replace(/\s+/g, "\\s+")}\\s*[:\\-–]\\s*(.+)$`,
      "i",
    ),
    bare: new RegExp(
      `^${label.trim().replace(/\s+/g, "\\s+")}\\s*[:\\-–]?\\s*$`,
      "i",
    ),
  }));

  const cleanValue = (value: string) =>
    value
      .replace(/^[-*+\d.)\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    for (const pattern of labelPatterns) {
      const inlineMatch = line.match(pattern.inline);
      if (inlineMatch?.[1]) {
        return cleanValue(inlineMatch[1]).slice(0, 600);
      }

      if (!pattern.bare.test(line)) {
        continue;
      }

      const collectedLines: string[] = [];
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const nextLine = lines[nextIndex].trim();
        if (!nextLine) {
          if (collectedLines.length > 0) {
            break;
          }
          continue;
        }

        if (/^#{1,6}\s+/.test(nextLine)) {
          break;
        }

        if (isStructuredFieldHeading(nextLine) && !/^[-*+\d.)\s]/.test(nextLine)) {
          break;
        }

        if (/^[A-Za-z][A-Za-z0-9 /&()'"-]{1,50}\s*:\s*/.test(nextLine)) {
          break;
        }

        collectedLines.push(cleanValue(nextLine));
      }

      const value = collectedLines.join(" ").replace(/\s+/g, " ").trim();
      if (value) {
        return value.slice(0, 600);
      }
    }
  }

  return "";
};

const normalizeWorkMode = (value: unknown) => {
  const normalizedValue = normalizeTextValue(value).toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.includes("hybrid")) {
    return "Hybrid";
  }

  if (
    normalizedValue.includes("remote") ||
    normalizedValue.includes("work from home") ||
    normalizedValue.includes("wfh")
  ) {
    return "Remote";
  }

  if (
    normalizedValue.includes("on-site") ||
    normalizedValue.includes("onsite") ||
    normalizedValue.includes("office")
  ) {
    return "On-site";
  }

  return "";
};

const normalizeApplyLink = (value: unknown) => {
  const rawValue = normalizeTextValue(value);

  if (!rawValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawValue);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
};

const toUtcDayTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const formatDayLabel = (days: number) => `${days} day${days === 1 ? "" : "s"}`;

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const isJobStillActive = (job: JobPost) => {
  const todayTimestamp = toUtcDayTimestamp(getTodayDateString());

  if (job.applicationEndDate) {
    // Jobs with an expiry date are hidden the day after expiry.
    return toUtcDayTimestamp(job.applicationEndDate) >= todayTimestamp;
  }

  // Jobs without an expiry date are kept for a rolling retention window.
  const postedAtTimestamp = toUtcDayTimestamp(job.date);
  const expiresAtTimestamp =
    postedAtTimestamp + noExpiryRetentionDays * millisecondsInDay;
  return expiresAtTimestamp >= todayTimestamp;
};

const resolveApplicationStatus = (
  applicationStartDate: string,
  applicationEndDate: string | null,
): JobApplicationStatus => {
  const todayDateString = getTodayDateString();
  const todayTimestamp = toUtcDayTimestamp(todayDateString);
  const startTimestamp = toUtcDayTimestamp(applicationStartDate);

  if (todayTimestamp < startTimestamp) {
    const daysUntilOpen = Math.max(
      1,
      Math.floor((startTimestamp - todayTimestamp) / millisecondsInDay),
    );

    return {
      state: "upcoming",
      label: `Opens in ${formatDayLabel(daysUntilOpen)}`,
      daysRemaining: null,
      daysUntilOpen,
    };
  }

  if (!applicationEndDate) {
    return {
      state: "no_expiry",
      label: "No expiry date",
      daysRemaining: null,
      daysUntilOpen: null,
    };
  }

  const endTimestamp = toUtcDayTimestamp(applicationEndDate);
  const daysRemaining = Math.floor((endTimestamp - todayTimestamp) / millisecondsInDay);

  if (daysRemaining < 0) {
    return {
      state: "expired",
      label: "Expired",
      daysRemaining: 0,
      daysUntilOpen: null,
    };
  }

  if (daysRemaining === 0) {
    return {
      state: "expires_today",
      label: "Expires today",
      daysRemaining: 0,
      daysUntilOpen: null,
    };
  }

  if (daysRemaining <= 5) {
    return {
      state: "expiring_soon",
      label: `${formatDayLabel(daysRemaining)} left`,
      daysRemaining,
      daysUntilOpen: null,
    };
  }

  return {
    state: "open",
    label: `${formatDayLabel(daysRemaining)} left`,
    daysRemaining,
    daysUntilOpen: null,
  };
};

const resolveJobSlug = (frontMatterSlug: unknown, fileName: string) => {
  const candidate = normalizeTextValue(frontMatterSlug);
  const fallbackSlug = fileName.replace(/\.md$/i, "");
  const slugSource =
    !candidate || placeholderSlugPattern.test(candidate) ? fallbackSlug : candidate;

  return toContentSlug(slugSource) || fallbackSlug;
};

const mergeContinuationListItems = (items: string[]) => {
  const mergedItems: string[] = [];

  for (const rawItem of items) {
    const trimmedItem = rawItem.trim();
    if (!trimmedItem) {
      continue;
    }

    const normalizedContinuation = trimmedItem.replace(/^(and|or)\s+/i, "").trim();
    const shouldMergeWithPrevious =
      mergedItems.length > 0 &&
      (/^(and|or)\b/i.test(trimmedItem) || /^[a-z]/.test(trimmedItem));

    if (shouldMergeWithPrevious && normalizedContinuation) {
      const lastIndex = mergedItems.length - 1;
      const previousItem = mergedItems[lastIndex];
      const separator = /[,:;]$/.test(previousItem) ? " " : ", ";
      mergedItems[lastIndex] = `${previousItem}${separator}${normalizedContinuation}`
        .replace(/\s+/g, " ")
        .trim();
      continue;
    }

    mergedItems.push(trimmedItem);
  }

  return mergedItems;
};

const responsibilitySentenceBreakPattern =
  /;|\s{2,}(?=[A-Z])|(?<=[a-z0-9])\s+(?=(?:Design|Execute|Perform|Develop|Build|Maintain|Identify|Track|Verify|Collaborate|Participate|Ensure|Create|Lead|Manage|Monitor|Analyze|Support|Drive|Own|Implement|Review|Troubleshoot|Automate|Document)\b)/;

const normalizeSkills = (value: unknown) => {
  const splitCompoundValue = (rawValue: string) => {
    const normalizedRawValue = rawValue.trim();
    if (!normalizedRawValue) {
      return [] as string[];
    }

    const hasExplicitSeparators = /[,;\n•|]/.test(normalizedRawValue);
    const hasSpacedSlashSeparators = /\s+\/\s+/.test(normalizedRawValue);
    const delimiterPattern = hasExplicitSeparators || hasSpacedSlashSeparators
      ? /,|;|\n|•|\||\s+\/\s+/
      : /,/;

    return normalizedRawValue
      .split(delimiterPattern)
      .map((item) => item.replace(/^['"\s]+|['"\s]+$/g, "").trim())
      .filter((item) => item.length > 0);
  };

  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .flatMap((item) => splitCompoundValue(normalizeTextValue(item)))
          .filter((item) => item.length > 0),
      ),
    );
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return [] as string[];
    }

    const inlineArrayValue =
      normalized.startsWith("[") && normalized.endsWith("]")
        ? normalized.slice(1, -1)
        : normalized;

    return splitCompoundValue(inlineArrayValue);
  }

  return [] as string[];
};

const normalizeResponsibilities = (value: unknown) => {
  const splitResponsibilityValue = (rawValue: string) => {
    const normalizedRawValue = rawValue.replace(/\r/g, "").trim();
    if (!normalizedRawValue) {
      return [] as string[];
    }

    return normalizedRawValue
      .split(/\n|•|\|/)
      .flatMap((item) => item.split(responsibilitySentenceBreakPattern))
      .map((item) =>
        item
          .replace(/^['"\s]+|['"\s]+$/g, "")
          .replace(/^[-*+\d.)\s]+/, "")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter((item) => item.length > 0);
  };

  const rawItems = Array.isArray(value)
    ? value.flatMap((item) => splitResponsibilityValue(normalizeTextValue(item)))
    : typeof value === "string"
      ? splitResponsibilityValue(
          value.trim().startsWith("[") && value.trim().endsWith("]")
            ? value.trim().slice(1, -1)
            : value,
        )
      : [];

  return Array.from(
    new Set(
      mergeContinuationListItems(rawItems)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

type SectionListExtractionOptions = {
  splitOnCommas?: boolean;
  maxItems?: number;
  mergeContinuationItems?: boolean;
};

const extractSectionListFromDescription = (
  markdown: string,
  sectionTitles: string[],
  options: SectionListExtractionOptions = {},
) => {
  const splitOnCommas = options.splitOnCommas !== false;
  const maxItems = options.maxItems ?? 12;

  const normalizedTitles = sectionTitles.map((title) =>
    title
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  const lines = markdown.replace(/\r/g, "").split("\n");
  const extractedItems: string[] = [];
  let isInsideTargetSection = false;

  const cleanItem = (value: string) =>
    value
      .replace(/^[-*+\d.)\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      if (isInsideTargetSection && extractedItems.length > 0) {
        break;
      }

      const normalizedHeading = headingMatch[1]
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9 ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      isInsideTargetSection = normalizedTitles.some(
        (title) =>
          normalizedHeading === title || normalizedHeading.includes(title),
      );
      continue;
    }

    if (!isInsideTargetSection || !line) {
      continue;
    }

    if (/^[-*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      const cleanedItem = cleanItem(line);
      if (cleanedItem) {
        extractedItems.push(cleanedItem);
      }
      continue;
    }

    if (extractedItems.length === 0) {
      const inlineDelimiterPattern = splitOnCommas ? /,|;|•|\|/ : /;|•|\|/;
      const inlineItems = line
        .split(inlineDelimiterPattern)
        .map((item) => cleanItem(item))
        .filter(Boolean);
      extractedItems.push(...inlineItems);
      continue;
    }

    const lastItemIndex = extractedItems.length - 1;
    extractedItems[lastItemIndex] = `${extractedItems[lastItemIndex]} ${line}`
      .replace(/\s+/g, " ")
      .trim();
  }

  const normalizedItems = Array.from(
    new Set(
      extractedItems
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  const finalItems = options.mergeContinuationItems
    ? mergeContinuationListItems(normalizedItems)
    : normalizedItems;

  return Array.from(
    new Set(
      finalItems
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, maxItems);
};

const createExcerpt = (description: string) => {
  const plainText = description
    .replace(/`/g, "")
    .replace(/[#>*_[\]-]/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= 165) {
    return plainText;
  }

  return `${plainText.slice(0, 162).trimEnd()}...`;
};

const parseFrontMatter = (rawFile: string) => {
  const match = rawFile.match(frontMatterPattern);
  if (!match) {
    return {
      data: {} as Record<string, unknown>,
      content: rawFile.trim(),
    };
  }

  const [, frontMatterBlock, markdownContent] = match;
  const lines = frontMatterBlock.split(/\r?\n/);
  const data: Record<string, unknown> = {};
  let activeListKey: string | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, rawValue] = keyValueMatch;
      const value = rawValue.trim();
      if (value.length === 0) {
        data[key] = [];
        activeListKey = key;
      } else {
        const quotedMarker = value[0];

        if (quotedMarker === '"' || quotedMarker === "'") {
          const quote = quotedMarker as '"' | "'";
          let quotedValue = value;

          while (!hasClosingQuote(quotedValue, quote) && lineIndex + 1 < lines.length) {
            const nextLine = lines[lineIndex + 1];
            if (!/^\s+/.test(nextLine)) {
              break;
            }

            lineIndex += 1;
            quotedValue += `\n${nextLine.trimStart()}`;
          }

          data[key] = parseQuotedValue(quotedValue, quote);
          activeListKey = null;
          continue;
        }

        if (/^[>|][+-]?$/.test(value)) {
          const blockLines: string[] = [];

          while (lineIndex + 1 < lines.length && /^\s+/.test(lines[lineIndex + 1])) {
            lineIndex += 1;
            blockLines.push(lines[lineIndex].trimStart());
          }

          data[key] = value.startsWith(">") ? blockLines.join(" ").trim() : blockLines.join("\n");
          activeListKey = null;
          continue;
        }

        const continuationLines: string[] = [];
        while (lineIndex + 1 < lines.length && /^\s+/.test(lines[lineIndex + 1])) {
          lineIndex += 1;
          continuationLines.push(lines[lineIndex].trimStart());
        }

        const combinedValue =
          continuationLines.length > 0
            ? `${value} ${continuationLines.join(" ")}`
            : value;

        data[key] = stripWrappingQuotes(combinedValue);
        activeListKey = null;
      }
      continue;
    }

    const listItemMatch = line.match(/^\s*-\s*(.+)$/);
    if (listItemMatch && activeListKey) {
      const currentItems = Array.isArray(data[activeListKey])
        ? (data[activeListKey] as string[])
        : [];
      data[activeListKey] = [...currentItems, stripWrappingQuotes(listItemMatch[1])];
      continue;
    }

    if (activeListKey && /^\s+/.test(line)) {
      const continuationValue = line.trim();
      const currentItems = Array.isArray(data[activeListKey])
        ? [...(data[activeListKey] as string[])]
        : [];

      if (continuationValue && currentItems.length > 0) {
        const lastIndex = currentItems.length - 1;
        currentItems[lastIndex] = `${currentItems[lastIndex]} ${continuationValue}`
          .replace(/\s+/g, " ")
          .trim();
        data[activeListKey] = currentItems;
      }
    }
  }

  return {
    data,
    content: markdownContent.trim(),
  };
};

const loadJobFromFile = async (fileName: string): Promise<JobPost | null> => {
  const filePath = path.join(jobsDirectory, fileName);

  const [rawFile, fileStats] = await Promise.all([
    fs.readFile(filePath, "utf8"),
    fs.stat(filePath),
  ]);
  const { data, content } = parseFrontMatter(rawFile);

  const slug = resolveJobSlug(data.slug, fileName);
  const title = normalizeTextValue(data.title);
  const company = normalizeTextValue(data.company);
  if (!title || !company) {
    return null;
  }

  const location = normalizeTextValue(data.location);
  const workMode = normalizeWorkMode(data.workMode || data.mode || data.location);
  const salary = normalizeTextValue(data.salary);
  const applyLink = normalizeApplyLink(data.applyLink || data.applyUrl);
  const eligibilityCriteriaFromFrontMatter = normalizeTextValue(
    data.eligibilityCriteria || data.eligibility || data.candidateProfile,
  );
  const summary = normalizeTextValue(data.summary);
  const experienceLevel = normalizeTextValue(
    data.experienceLevel || data.candidateType || data.experienceType,
  );
  const experience = normalizeTextValue(
    data.experience || data.experienceYears || data.experienceRequired || data.minExperience,
  );
  const experienceYears = experience;
  const workingDays = normalizeTextValue(data.workingDays || data.workDays);
  const jobTiming = normalizeTextValue(data.jobTiming || data.shiftTiming || data.timing);
  const employmentType = normalizeTextValue(data.employmentType || data.jobType);
  const jobType = employmentType;
  const fileModifiedDate =
    toDateString(fileStats.mtime.toISOString()) || getTodayDateString();
  const date =
    toDateString(
      data.date || data.postedDate,
    ) || fileModifiedDate;
  const explicitUpdatedAt = toDateString(data.updatedAt || data.updated || data.lastUpdated);
  const applicationStartDate =
    toDateString(data.applicationStartDate || data.startDate) || date;
  const applicationEndDateRaw = toDateString(
    data.applicationEndDate || data.expiryDate || data.expirationDate,
  );
  const applicationEndDate = applicationEndDateRaw || null;
  const applicationStatus = resolveApplicationStatus(
    applicationStartDate,
    applicationEndDate,
  );
  const detailsText = content || summary;
  const eligibilityCriteriaFromDescription = extractLabeledTextValue(detailsText, [
    "eligibility criteria",
    "eligibility",
    "candidate profile",
    "who can apply",
  ]);
  const eligibilityCriteria =
    eligibilityCriteriaFromFrontMatter || eligibilityCriteriaFromDescription;
  const skillsFromFrontMatter = normalizeSkills(data.skills);
  const skillsFromDescription = extractSectionListFromDescription(detailsText, [
    "skills required",
    "technical skills",
    "skills",
    "requirements",
    "technologies",
  ]);
  const skills =
    skillsFromDescription.length > skillsFromFrontMatter.length
      ? skillsFromDescription
      : skillsFromFrontMatter;
  const responsibilitiesFromFrontMatter = normalizeResponsibilities(data.responsibilities);
  const responsibilitiesFromDescription = extractSectionListFromDescription(detailsText, [
    "roles and responsibilities",
    "role and responsibilities",
    "roles responsibilities",
    "role responsibilities",
    "responsibilities",
    "key responsibilities",
    "what you ll do",
  ], {
    splitOnCommas: false,
    maxItems: 16,
    mergeContinuationItems: true,
  });
  const responsibilities =
    responsibilitiesFromDescription.length > responsibilitiesFromFrontMatter.length
      ? responsibilitiesFromDescription
      : responsibilitiesFromFrontMatter;
  const education = normalizeSkills(
    data.education || data.educationalRequirements || data.qualification,
  );
  const excerptSource =
    summary ||
    eligibilityCriteria ||
    responsibilities.join(" ") ||
    skills.join(", ") ||
    education.join(", ");
  const updatedAt = explicitUpdatedAt || fileModifiedDate;

  return {
    slug,
    title,
    company,
    location,
    draft: toBoolean(data.draft || data.isDraft),
    ...(workMode ? { workMode } : {}),
    ...(salary ? { salary } : {}),
    skills,
    responsibilities,
    education,
    ...(summary ? { summary } : {}),
    ...(eligibilityCriteria ? { eligibilityCriteria } : {}),
    ...(experience ? { experience } : {}),
    ...(experienceLevel ? { experienceLevel } : {}),
    ...(experienceYears ? { experienceYears } : {}),
    ...(workingDays ? { workingDays } : {}),
    ...(jobTiming ? { jobTiming } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(jobType ? { jobType } : {}),
    ...(applyLink ? { applyLink } : {}),
    date,
    updatedAt,
    applicationStartDate,
    applicationEndDate,
    applicationStatus,
    excerpt: createExcerpt(excerptSource),
  };
};

const loadJobs = async (options: { includeDrafts?: boolean; includeExpired?: boolean } = {}) => {
  let files: string[] = [];

  try {
    files = await fs.readdir(jobsDirectory);
  } catch {
    return [] as JobPost[];
  }

  const jobs = await Promise.all(
    files
      .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
      .map((fileName) => loadJobFromFile(fileName)),
  );

  return jobs
    .filter((job): job is JobPost => Boolean(job))
    .filter((job) => (options.includeDrafts ? true : !job.draft))
    .filter((job) => (options.includeExpired ? true : isJobStillActive(job)))
    .sort(
      (firstJob, secondJob) =>
        new Date(secondJob.date).getTime() - new Date(firstJob.date).getTime(),
    );
};

const readJobs = (options: { includeDrafts?: boolean; includeExpired?: boolean } = {}) =>
  loadJobs(options);

export const getAllJobs = async () => readJobs();

export const getAllJobsForAdmin = async () =>
  readJobs({ includeDrafts: true, includeExpired: true });

export const getLatestJobs = async (limit = 6) => {
  const jobs = await readJobs();
  return jobs.slice(0, limit);
};

export const getJobBySlug = async (slug: string) => {
  const jobs = await readJobs();
  return jobs.find((job) => job.slug === slug) ?? null;
};

export const getRelatedJobs = (sourceJob: JobPost, jobs: JobPost[], limit = 5) => {
  if (limit <= 0) {
    return [] as JobPost[];
  }

  const sourceSignals = toRelatedJobSignals(sourceJob);
  const scoredJobs = jobs
    .filter((job) => job.slug !== sourceJob.slug)
    .map((job) => {
      const candidateSignals = toRelatedJobSignals(job);
      return {
        job,
        score: scoreRelatedJob(sourceSignals, candidateSignals),
      };
    })
    .filter((item) => item.score > 0)
    .sort(
      (firstItem, secondItem) =>
        secondItem.score - firstItem.score ||
        toSortableDateTimestamp(secondItem.job.date) -
          toSortableDateTimestamp(firstItem.job.date),
    );

  const primaryJobs = scoredJobs.map((item) => item.job).slice(0, limit);
  if (primaryJobs.length >= limit) {
    return primaryJobs;
  }

  const selectedSlugs = new Set(primaryJobs.map((job) => job.slug));
  const fallbackJobs = jobs
    .filter((job) => job.slug !== sourceJob.slug && !selectedSlugs.has(job.slug))
    .sort(
      (firstJob, secondJob) =>
        toSortableDateTimestamp(secondJob.date) -
        toSortableDateTimestamp(firstJob.date),
    )
    .slice(0, limit - primaryJobs.length);

  return [...primaryJobs, ...fallbackJobs];
};

export const formatPostedDate = (dateString: string) => {
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};

export const formatApplicationWindow = (
  applicationStartDate: string,
  applicationEndDate: string | null,
) => {
  if (!applicationEndDate) {
    return `Starts ${formatPostedDate(applicationStartDate)}`;
  }

  if (applicationStartDate === applicationEndDate) {
    return `Apply by ${formatPostedDate(applicationEndDate)}`;
  }

  return `${formatPostedDate(applicationStartDate)} - ${formatPostedDate(
    applicationEndDate,
  )}`;
};

export const resolveStructuredValidThrough = (
  postedDate: string,
  applicationEndDate: string | null,
) => {
  if (applicationEndDate) {
    return applicationEndDate;
  }

  const postedAtTimestamp = toUtcDayTimestamp(postedDate);
  if (!Number.isFinite(postedAtTimestamp)) {
    return postedDate;
  }

  const expiresAtDate = new Date(
    postedAtTimestamp + noExpiryRetentionDays * millisecondsInDay,
  );
  return expiresAtDate.toISOString().split("T")[0];
};
