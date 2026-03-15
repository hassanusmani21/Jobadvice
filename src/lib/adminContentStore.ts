import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type AdminCollection,
  type AdminMobileBlogEntry,
  type AdminMobileBlogRecord,
  type AdminMobileEntry,
  type AdminMobileJobEntry,
  type AdminMobileJobRecord,
  getTodayDateString,
} from "@/lib/adminMobile";
import { toIsoDateString } from "@/lib/dateParsing";
import { toContentSlug } from "@/lib/slug";

const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
const githubOwner = process.env.ADMIN_CONTENT_REPO_OWNER || "hassanusmani21";
const githubRepo = process.env.ADMIN_CONTENT_REPO_NAME || "Jobadvice";
const githubBranch = process.env.ADMIN_CONTENT_REPO_BRANCH || "main";
const githubContentsToken = (process.env.ADMIN_CONTENTS_TOKEN || "").trim();
const contentDirectories: Record<AdminCollection, string> = {
  jobs: path.join(process.cwd(), "content", "jobs"),
  blogs: path.join(process.cwd(), "content", "blogs"),
};
const repoDirectories: Record<AdminCollection, string> = {
  jobs: "content/jobs",
  blogs: "content/blogs",
};
const uploadDirectory = path.join(process.cwd(), "public", "uploads");
const uploadRepoDirectory = "public/uploads";
const draftFieldFallbackPrefix = "draft";

type ParsedFrontMatterDocument = {
  body: string;
  data: Record<string, unknown>;
};

type GithubContentsResponse = {
  content?: string;
  download_url?: string | null;
  encoding?: string;
  message?: string;
  sha?: string;
  type?: string;
};

type GithubWriteOptions = {
  base64Content: string;
  message: string;
  sha?: string;
};

const jobManagedKeys = new Set([
  "applicationEndDate",
  "applicationStartDate",
  "applyLink",
  "company",
  "date",
  "draft",
  "education",
  "eligibilityCriteria",
  "employmentType",
  "experience",
  "jobTiming",
  "location",
  "responsibilities",
  "salary",
  "skills",
  "slug",
  "title",
  "updatedAt",
  "workMode",
  "workingDays",
]);

const blogManagedKeys = new Set([
  "author",
  "coverImage",
  "ctaLabel",
  "ctaLink",
  "date",
  "draft",
  "isTrending",
  "slug",
  "summary",
  "tags",
  "title",
  "topic",
  "updatedAt",
]);

export class AdminContentValidationError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(issues[0] || "Invalid content");
    this.name = "AdminContentValidationError";
    this.issues = issues;
  }
}

const shouldUseRemoteAdminStore = () =>
  process.env.NODE_ENV === "production" || githubContentsToken.length > 0;

const stripWrappingQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "").trim();

const normalizeTextValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeBooleanValue = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "yes", "1"].includes(value.trim().toLowerCase());
};

const normalizePreservedValue = (value: unknown): unknown => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter((item) => item.length > 0);
  }

  return "";
};

const normalizePreservedFields = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, rawValue]) => [key, normalizePreservedValue(rawValue)] as const)
    .filter(([, rawValue]) => {
      if (typeof rawValue === "boolean") {
        return true;
      }

      if (typeof rawValue === "string") {
        return rawValue.length > 0;
      }

      return Array.isArray(rawValue) && rawValue.length > 0;
    });

  return Object.fromEntries(entries);
};

const normalizeStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.replace(/^[-*•\s]+/, "").trim())
      .filter((item) => item.length > 0);
  }

  return [] as string[];
};

const normalizeMultilineText = (value: unknown) =>
  typeof value === "string"
    ? value
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim()
    : "";

const normalizeBody = (value: unknown) =>
  typeof value === "string"
    ? value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

const normalizeExternalUrl = (value: unknown) => {
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

const normalizeInternalOrExternalUrl = (value: unknown) => {
  const rawValue = normalizeTextValue(value);
  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("/")) {
    return rawValue;
  }

  return normalizeExternalUrl(rawValue);
};

const normalizeCoverImage = (value: unknown) => {
  const rawValue = normalizeTextValue(value);
  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("/uploads/")) {
    return rawValue;
  }

  return normalizeExternalUrl(rawValue);
};

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

const parseFrontMatterDocument = (rawFile: string): ParsedFrontMatterDocument => {
  const match = rawFile.match(frontMatterPattern);
  if (!match) {
    return {
      body: rawFile.trim(),
      data: {},
    };
  }

  const [, frontMatterBlock, markdownBody] = match;
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
        continue;
      }

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
    body: markdownBody.trim(),
    data,
  };
};

const toDateString = (value: unknown) => toIsoDateString(value);

const toRepoRelativePath = (collection: AdminCollection, slug: string) =>
  `${repoDirectories[collection]}/${slug}.md`;

const toLocalAbsolutePath = (collection: AdminCollection, slug: string) =>
  path.join(contentDirectories[collection], `${slug}.md`);

const encodeGithubPath = (filePath: string) =>
  filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const toGithubContentsUrl = (filePath: string, options: { includeRef?: boolean } = {}) => {
  const endpoint = new URL(
    `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${encodeGithubPath(
      filePath,
    )}`,
  );

  if (options.includeRef !== false) {
    endpoint.searchParams.set("ref", githubBranch);
  }

  return endpoint.toString();
};

const getGithubHeaders = () => ({
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "JobAdviceAdminMobile/1.0",
  ...(githubContentsToken
    ? {
        Authorization: `Bearer ${githubContentsToken}`,
      }
    : {}),
});

const fetchGithubFile = async (filePath: string) => {
  const response = await fetch(toGithubContentsUrl(filePath), {
    cache: "no-store",
    headers: getGithubHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub file request failed for ${filePath}: ${response.status}`);
  }

  return (await response.json()) as GithubContentsResponse;
};

const decodeGithubContent = (payload: GithubContentsResponse) => {
  if (payload.encoding !== "base64" || typeof payload.content !== "string") {
    throw new Error("Unsupported GitHub contents payload.");
  }

  return Buffer.from(payload.content.replace(/\n/g, ""), "base64");
};

const putGithubContent = async (
  filePath: string,
  options: GithubWriteOptions,
) => {
  const response = await fetch(toGithubContentsUrl(filePath, { includeRef: false }), {
    method: "PUT",
    headers: getGithubHeaders(),
    body: JSON.stringify({
      branch: githubBranch,
      content: options.base64Content,
      message: options.message,
      ...(options.sha ? { sha: options.sha } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub write failed for ${filePath}: ${response.status}`);
  }
};

const deleteGithubContent = async (filePath: string, message: string) => {
  const payload = await fetchGithubFile(filePath);
  if (!payload?.sha) {
    return;
  }

  const response = await fetch(toGithubContentsUrl(filePath, { includeRef: false }), {
    method: "DELETE",
    headers: getGithubHeaders(),
    body: JSON.stringify({
      branch: githubBranch,
      message,
      sha: payload.sha,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub delete failed for ${filePath}: ${response.status}`);
  }
};

const readStoredText = async (collection: AdminCollection, slug: string) => {
  const relativePath = toRepoRelativePath(collection, slug);

  if (shouldUseRemoteAdminStore()) {
    const payload = await fetchGithubFile(relativePath);
    if (!payload) {
      return null;
    }

    return decodeGithubContent(payload).toString("utf8");
  }

  try {
    return await fs.readFile(toLocalAbsolutePath(collection, slug), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

const assertLocalFileMissing = async (filePath: string) => {
  try {
    await fs.access(filePath);
    throw new Error("An entry with that slug already exists.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }
};

const writeStoredText = async (
  collection: AdminCollection,
  slug: string,
  content: string,
  originalSlug?: string,
) => {
  const targetRelativePath = toRepoRelativePath(collection, slug);
  const previousRelativePath =
    originalSlug && originalSlug !== slug ? toRepoRelativePath(collection, originalSlug) : "";

  if (shouldUseRemoteAdminStore()) {
    if (!githubContentsToken) {
      throw new Error("ADMIN_CONTENTS_TOKEN is required for production admin saves.");
    }

    const currentTarget = await fetchGithubFile(targetRelativePath);
    if (previousRelativePath && targetRelativePath !== previousRelativePath && currentTarget?.sha) {
      throw new Error("An entry with that slug already exists.");
    }

    await putGithubContent(targetRelativePath, {
      base64Content: Buffer.from(content, "utf8").toString("base64"),
      message: `admin: save ${collection}/${slug}`,
      sha: currentTarget?.sha,
    });

    if (previousRelativePath) {
      await deleteGithubContent(previousRelativePath, `admin: rename ${collection}/${originalSlug}`);
    }

    return;
  }

  const targetAbsolutePath = toLocalAbsolutePath(collection, slug);
  const previousAbsolutePath =
    previousRelativePath && originalSlug
      ? toLocalAbsolutePath(collection, originalSlug)
      : "";

  await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true });

  if (previousAbsolutePath && previousAbsolutePath !== targetAbsolutePath) {
    await assertLocalFileMissing(targetAbsolutePath);
  }

  await fs.writeFile(targetAbsolutePath, content, "utf8");

  if (previousAbsolutePath && previousAbsolutePath !== targetAbsolutePath) {
    try {
      await fs.unlink(previousAbsolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
};

const formatScalar = (value: string | boolean) =>
  typeof value === "boolean" ? (value ? "true" : "false") : JSON.stringify(value);

const formatArrayField = (key: string, items: string[]) =>
  items.length === 0
    ? `${key}: []`
    : `${key}:\n${items.map((item) => `  - ${JSON.stringify(item)}`).join("\n")}`;

const formatTextField = (key: string, value: string) => {
  if (!value) {
    return `${key}: ""`;
  }

  if (!value.includes("\n")) {
    return `${key}: ${JSON.stringify(value)}`;
  }

  return `${key}: |-\n${value.split("\n").map((line) => `  ${line}`).join("\n")}`;
};

const formatUnknownField = (key: string, value: unknown) => {
  if (typeof value === "boolean") {
    return `${key}: ${formatScalar(value)}`;
  }

  if (Array.isArray(value)) {
    return formatArrayField(
      key,
      value.map((item) => normalizeTextValue(item)).filter((item) => item.length > 0),
    );
  }

  return formatTextField(key, normalizeTextValue(value));
};

const serializeEntryDocument = (
  fieldLines: string[],
  preservedFields: Record<string, unknown>,
  body: string,
) => {
  const extraFieldLines = Object.keys(preservedFields)
    .sort((firstKey, secondKey) => firstKey.localeCompare(secondKey))
    .map((key) => formatUnknownField(key, preservedFields[key]));
  const markdownBody = normalizeBody(body);

  return [
    "---",
    ...fieldLines,
    ...extraFieldLines,
    "---",
    ...(markdownBody ? ["", markdownBody] : []),
    "",
  ].join("\n");
};

const toPreservedFields = (data: Record<string, unknown>, managedKeys: Set<string>) =>
  normalizePreservedFields(
    Object.fromEntries(
      Object.entries(data).filter(([key]) => !managedKeys.has(key)),
    ),
  );

const resolveFallbackSlug = (collection: AdminCollection) =>
  `${draftFieldFallbackPrefix}-${collection}-${Date.now()}`;

const resolveSlug = (
  collection: AdminCollection,
  explicitValue: string,
  fallbackValue: string,
  originalSlug?: string,
) => {
  const fromExplicitValue = toContentSlug(explicitValue);
  if (fromExplicitValue) {
    return fromExplicitValue;
  }

  const fromFallbackValue = toContentSlug(fallbackValue);
  if (fromFallbackValue) {
    return fromFallbackValue;
  }

  if (originalSlug) {
    return originalSlug;
  }

  return resolveFallbackSlug(collection);
};

const normalizeJobEntry = (
  input: Record<string, unknown>,
  originalSlug?: string,
): AdminMobileJobEntry => {
  const today = getTodayDateString();
  const title = normalizeTextValue(input.title);
  const company = normalizeTextValue(input.company);
  const date = toDateString(input.date) || today;
  const slug = resolveSlug(
    "jobs",
    normalizeTextValue(input.slug),
    `${title} ${company}`,
    originalSlug,
  );

  return {
    collection: "jobs",
    slug,
    title,
    date,
    updatedAt: today,
    draft: normalizeBooleanValue(input.draft),
    company,
    location: normalizeTextValue(input.location),
    workMode: normalizeTextValue(input.workMode),
    employmentType: normalizeTextValue(input.employmentType),
    salary: normalizeTextValue(input.salary),
    experience: normalizeTextValue(input.experience),
    eligibilityCriteria: normalizeMultilineText(input.eligibilityCriteria),
    education: normalizeStringArray(input.education),
    skills: normalizeStringArray(input.skills),
    responsibilities: normalizeStringArray(input.responsibilities),
    workingDays: normalizeTextValue(input.workingDays),
    jobTiming: normalizeTextValue(input.jobTiming),
    applyLink: normalizeInternalOrExternalUrl(input.applyLink),
    applicationStartDate: toDateString(input.applicationStartDate) || date,
    applicationEndDate: toDateString(input.applicationEndDate),
    body: normalizeBody(input.body),
    preservedFields: normalizePreservedFields(input.preservedFields),
  };
};

const normalizeBlogEntry = (
  input: Record<string, unknown>,
  originalSlug?: string,
): AdminMobileBlogEntry => {
  const today = getTodayDateString();
  const title = normalizeTextValue(input.title);
  const date = toDateString(input.date) || today;
  const slug = resolveSlug(
    "blogs",
    normalizeTextValue(input.slug),
    title,
    originalSlug,
  );

  return {
    collection: "blogs",
    slug,
    title,
    date,
    updatedAt: today,
    draft: normalizeBooleanValue(input.draft),
    summary: normalizeMultilineText(input.summary),
    topic: normalizeTextValue(input.topic),
    tags: normalizeStringArray(input.tags),
    isTrending: normalizeBooleanValue(input.isTrending),
    author: normalizeTextValue(input.author),
    coverImage: normalizeCoverImage(input.coverImage),
    ctaLabel: normalizeTextValue(input.ctaLabel),
    ctaLink: normalizeExternalUrl(input.ctaLink),
    body: normalizeBody(input.body),
    preservedFields: normalizePreservedFields(input.preservedFields),
  };
};

const validateJobEntry = (entry: AdminMobileJobEntry) => {
  if (entry.draft) {
    return [] as string[];
  }

  const issues: string[] = [];
  if (!entry.title) {
    issues.push("Job title is required.");
  }
  if (!entry.company) {
    issues.push("Company name is required.");
  }
  if (!entry.location) {
    issues.push("Location is required.");
  }
  if (!entry.date) {
    issues.push("Publish date is required.");
  }
  if (!entry.applyLink) {
    issues.push("Apply link is required.");
  }
  if (entry.applyLink && !/^(https?:\/\/|\/).+/.test(entry.applyLink)) {
    issues.push("Apply link must be a full URL or an internal path.");
  }
  if (!entry.applicationStartDate) {
    issues.push("Application start date is required.");
  }
  if (entry.skills.length === 0) {
    issues.push("Add at least one skill before publishing.");
  }

  return issues;
};

const validateBlogEntry = (entry: AdminMobileBlogEntry) => {
  if (entry.draft) {
    return [] as string[];
  }

  const issues: string[] = [];
  if (!entry.title) {
    issues.push("Blog title is required.");
  }
  if (!entry.topic) {
    issues.push("Topic is required.");
  }
  if (!entry.date) {
    issues.push("Publish date is required.");
  }
  if (!entry.body) {
    issues.push("Blog content is required.");
  }
  if (entry.ctaLink && !normalizeExternalUrl(entry.ctaLink)) {
    issues.push("CTA link must be a full http/https URL.");
  }

  return issues;
};

const serializeJobEntry = (entry: AdminMobileJobEntry) =>
  serializeEntryDocument(
    [
      `title: ${formatScalar(entry.title)}`,
      `slug: ${formatScalar(entry.slug)}`,
      `date: ${formatScalar(entry.date)}`,
      `updatedAt: ${formatScalar(entry.updatedAt)}`,
      `draft: ${formatScalar(entry.draft)}`,
      `company: ${formatScalar(entry.company)}`,
      `location: ${formatScalar(entry.location)}`,
      `workMode: ${formatScalar(entry.workMode)}`,
      `employmentType: ${formatScalar(entry.employmentType)}`,
      `salary: ${formatScalar(entry.salary)}`,
      `experience: ${formatScalar(entry.experience)}`,
      formatTextField("eligibilityCriteria", entry.eligibilityCriteria),
      formatArrayField("education", entry.education),
      formatArrayField("skills", entry.skills),
      formatArrayField("responsibilities", entry.responsibilities),
      `workingDays: ${formatScalar(entry.workingDays)}`,
      `jobTiming: ${formatScalar(entry.jobTiming)}`,
      `applyLink: ${formatScalar(entry.applyLink)}`,
      `applicationStartDate: ${formatScalar(entry.applicationStartDate)}`,
      `applicationEndDate: ${formatScalar(entry.applicationEndDate)}`,
    ],
    entry.preservedFields,
    entry.body,
  );

const serializeBlogEntry = (entry: AdminMobileBlogEntry) =>
  serializeEntryDocument(
    [
      `title: ${formatScalar(entry.title)}`,
      `slug: ${formatScalar(entry.slug)}`,
      formatTextField("summary", entry.summary),
      `topic: ${formatScalar(entry.topic)}`,
      formatArrayField("tags", entry.tags),
      `isTrending: ${formatScalar(entry.isTrending)}`,
      `author: ${formatScalar(entry.author)}`,
      `coverImage: ${formatScalar(entry.coverImage)}`,
      `ctaLabel: ${formatScalar(entry.ctaLabel)}`,
      `ctaLink: ${formatScalar(entry.ctaLink)}`,
      `date: ${formatScalar(entry.date)}`,
      `updatedAt: ${formatScalar(entry.updatedAt)}`,
      `draft: ${formatScalar(entry.draft)}`,
    ],
    entry.preservedFields,
    entry.body,
  );

const toJobRecord = (entry: AdminMobileJobEntry): AdminMobileJobRecord => ({
  slug: entry.slug,
  title: entry.title,
  company: entry.company,
  location: entry.location,
  applyLink: entry.applyLink,
  date: entry.date,
  updatedAt: entry.updatedAt,
  draft: entry.draft,
});

const toBlogRecord = (entry: AdminMobileBlogEntry): AdminMobileBlogRecord => ({
  slug: entry.slug,
  title: entry.title,
  topic: entry.topic,
  date: entry.date,
  updatedAt: entry.updatedAt,
  draft: entry.draft,
});

export const getAdminEntry = async (
  collection: AdminCollection,
  slug: string,
): Promise<AdminMobileEntry | null> => {
  const normalizedSlug = toContentSlug(slug) || slug;
  const rawFile = await readStoredText(collection, normalizedSlug);
  if (!rawFile) {
    return null;
  }

  const { body, data } = parseFrontMatterDocument(rawFile);
  const today = getTodayDateString();

  if (collection === "jobs") {
    return {
      collection: "jobs",
      slug: resolveSlug("jobs", normalizeTextValue(data.slug), normalizedSlug, normalizedSlug),
      title: normalizeTextValue(data.title),
      date: toDateString(data.date || data.postedDate) || today,
      updatedAt:
        toDateString(data.updatedAt || data.updated || data.lastUpdated) ||
        toDateString(data.date || data.postedDate) ||
        today,
      draft: normalizeBooleanValue(data.draft || data.isDraft),
      company: normalizeTextValue(data.company),
      location: normalizeTextValue(data.location),
      workMode: normalizeTextValue(data.workMode || data.mode),
      employmentType: normalizeTextValue(data.employmentType || data.jobType),
      salary: normalizeTextValue(data.salary),
      experience: normalizeTextValue(
        data.experience || data.experienceYears || data.experienceRequired,
      ),
      eligibilityCriteria: normalizeMultilineText(
        data.eligibilityCriteria || data.eligibility || data.candidateProfile,
      ),
      education: normalizeStringArray(
        data.education || data.educationalRequirements || data.qualification,
      ),
      skills: normalizeStringArray(data.skills),
      responsibilities: normalizeStringArray(data.responsibilities),
      workingDays: normalizeTextValue(data.workingDays || data.workDays),
      jobTiming: normalizeTextValue(data.jobTiming || data.shiftTiming || data.timing),
      applyLink: normalizeInternalOrExternalUrl(data.applyLink || data.applyUrl),
      applicationStartDate:
        toDateString(data.applicationStartDate || data.startDate) ||
        toDateString(data.date || data.postedDate) ||
        today,
      applicationEndDate: toDateString(
        data.applicationEndDate || data.expiryDate || data.expirationDate,
      ),
      body: normalizeBody(body),
      preservedFields: toPreservedFields(data, jobManagedKeys),
    };
  }

  return {
    collection: "blogs",
    slug: resolveSlug("blogs", normalizeTextValue(data.slug), normalizedSlug, normalizedSlug),
    title: normalizeTextValue(data.title),
    date: toDateString(data.date || data.publishedAt) || today,
    updatedAt:
      toDateString(data.updatedAt || data.updated || data.lastUpdated) ||
      toDateString(data.date || data.publishedAt) ||
      today,
    draft: normalizeBooleanValue(data.draft || data.isDraft),
    summary: normalizeMultilineText(data.summary || data.excerpt),
    topic: normalizeTextValue(data.topic),
    tags: normalizeStringArray(data.tags),
    isTrending: normalizeBooleanValue(data.isTrending || data.trending),
    author: normalizeTextValue(data.author),
    coverImage: normalizeCoverImage(data.coverImage || data.image || data.thumbnail),
    ctaLabel: normalizeTextValue(
      data.ctaLabel || data.registrationLabel || data.applyLabel || data.joinLabel,
    ),
    ctaLink: normalizeExternalUrl(
      data.ctaLink || data.registrationLink || data.applyLink || data.joinLink,
    ),
    body: normalizeBody(body),
    preservedFields: toPreservedFields(data, blogManagedKeys),
  };
};

export const saveAdminEntry = async ({
  collection,
  entry,
  originalSlug,
}: {
  collection: AdminCollection;
  entry: Record<string, unknown>;
  originalSlug?: string;
}) => {
  const normalizedOriginalSlug = toContentSlug(String(originalSlug || "").trim()) || "";
  const normalizedEntry =
    collection === "jobs"
      ? normalizeJobEntry(entry, normalizedOriginalSlug)
      : normalizeBlogEntry(entry, normalizedOriginalSlug);
  const issues =
    normalizedEntry.collection === "jobs"
      ? validateJobEntry(normalizedEntry)
      : validateBlogEntry(normalizedEntry);

  if (issues.length > 0) {
    throw new AdminContentValidationError(issues);
  }

  const serializedContent =
    normalizedEntry.collection === "jobs"
      ? serializeJobEntry(normalizedEntry)
      : serializeBlogEntry(normalizedEntry);

  await writeStoredText(
    collection,
    normalizedEntry.slug,
    serializedContent,
    normalizedOriginalSlug || undefined,
  );

  return {
    entry: normalizedEntry,
    record:
      normalizedEntry.collection === "jobs"
        ? toJobRecord(normalizedEntry)
        : toBlogRecord(normalizedEntry),
  };
};

const resolveImageExtension = (file: File) => {
  const fileName = file.name || "image";
  const nameExtension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";

  if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(nameExtension)) {
    return nameExtension === "jpeg" ? "jpg" : nameExtension;
  }

  const mimeType = (file.type || "").toLowerCase();
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/gif") {
    return "gif";
  }
  if (mimeType === "image/avif") {
    return "avif";
  }

  return "";
};

export const saveAdminUpload = async (file: File, collection: AdminCollection) => {
  const extension = resolveImageExtension(file);
  if (!extension) {
    throw new Error("Upload a JPG, PNG, WEBP, GIF, or AVIF image.");
  }

  const baseName = toContentSlug(file.name.replace(/\.[^.]+$/, "")) || `${collection}-image`;
  const fileName = `${baseName}-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const relativePath = `${uploadRepoDirectory}/${fileName}`;

  if (shouldUseRemoteAdminStore()) {
    if (!githubContentsToken) {
      throw new Error("ADMIN_CONTENTS_TOKEN is required for production uploads.");
    }

    await putGithubContent(relativePath, {
      base64Content: fileBuffer.toString("base64"),
      message: `admin: upload ${fileName}`,
    });
  } else {
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadDirectory, fileName), fileBuffer);
  }

  return {
    fileName,
    url: `/uploads/${fileName}`,
  };
};
