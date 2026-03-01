import { normalizeMarkdownSource } from "./markdown";
export type ExtractMode = "ollama" | "fallback";

type JobExtractedData = {
  title: string;
  date: string;
  company: string;
  location: string;
  workMode: string;
  employmentType: string;
  salary: string;
  experience: string;
  eligibilityCriteria: string;
  education: string[];
  skills: string[];
  responsibilities: string[];
  workingDays: string;
  jobTiming: string;
  applyLink: string;
  applicationStartDate: string;
  applicationEndDate: string;
};

type BlogExtractedData = {
  title: string;
  slug: string;
  summary: string;
  topic: string;
  tags: string[];
  isTrending: boolean;
  author: string;
  coverImage: string;
  date: string;
  body: string;
};

export type JobExtractionResult = {
  mode: ExtractMode;
  data: JobExtractedData;
  reason?: string;
};

export type BlogExtractionResult = {
  mode: ExtractMode;
  data: BlogExtractedData;
  reason?: string;
};

const todayDateString = () => new Date().toISOString().split("T")[0];
const defaultOllamaBaseUrl = "http://127.0.0.1:11434";
const defaultOllamaTimeoutMs = 60_000;
const defaultMaxSourceChars = 10_000;
const defaultOllamaSoftTimeoutMs = 12_000;
const extractionSignalPattern =
  /(job title|title|company name|company|location|salary|ctc|experience|skills?|education|qualification|eligibility|candidate profile|apply|employment type|work mode|working days|job timing|application start date|application end date|date|author|topic|tags?)/i;
const genericSkillItemPattern =
  /^(skills?|technical skills?|soft skills?|skill set|required skills?|requirements?|must-have skills?)$/i;
const genericEducationItemPattern =
  /^(education|educational requirements?|qualification|qualifications|academic qualifications?|academic)$/i;
const fieldLabelPattern = /^[A-Za-z][A-Za-z0-9 /&()'"-]{1,50}\s*:/;
const bulletLinePattern = /^[-*•]|\d+[.)]/;
const emptyBlogPlaceholderPattern = /^(title|topic|summary|slug|author|category)$/i;

const toJsonFromModelResponse = (value: string) => {
  const cleanedValue = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  try {
    return JSON.parse(cleanedValue) as Record<string, unknown>;
  } catch {
    const firstBrace = cleanedValue.indexOf("{");
    const lastBrace = cleanedValue.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("No JSON object found in model response");
    }

    return JSON.parse(cleanedValue.slice(firstBrace, lastBrace + 1)) as Record<
      string,
      unknown
    >;
  }
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeHttpUrl = (value: unknown) => {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
};

const dedupeItems = (items: string[]) => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const normalizedKey = item.toLowerCase();
    if (!normalizedKey || seen.has(normalizedKey)) {
      continue;
    }

    seen.add(normalizedKey);
    deduped.push(item);
  }

  return deduped;
};

const normalizeStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return dedupeItems(
      value
        .flatMap((item) => splitInlineList(normalizeString(item)))
        .filter(Boolean),
    );
  }

  if (typeof value === "string") {
    return dedupeItems(splitInlineList(value));
  }

  return [] as string[];
};

const toEnvNumber = (value: string | undefined, fallbackValue: number) => {
  const parsedValue = Number.parseInt(value || "", 10);
  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return fallbackValue;
};

const getOllamaTimeoutMs = () =>
  toEnvNumber(process.env.OLLAMA_TIMEOUT_MS, defaultOllamaTimeoutMs);

const getMaxSourceChars = () =>
  Math.max(
    8_000,
    toEnvNumber(process.env.OLLAMA_MAX_SOURCE_CHARS, defaultMaxSourceChars),
  );

const getOllamaContextSize = () =>
  toEnvNumber(process.env.OLLAMA_NUM_CTX, 1024);

const getOllamaNumPredict = () =>
  Math.max(360, toEnvNumber(process.env.OLLAMA_NUM_PREDICT, 420));

const getOllamaSoftTimeoutMs = () =>
  toEnvNumber(process.env.OLLAMA_SOFT_TIMEOUT_MS, defaultOllamaSoftTimeoutMs);

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const extractUrl = (text: string) => {
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  return urlMatch ? urlMatch[0] : "";
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractLineValue = (text: string, labels: string[]) => {
  for (const label of labels) {
    const escapedLabel = escapeRegExp(label);
    const pattern = new RegExp(
      `${escapedLabel}(?:\\s*\\([^\\n)]*\\))?\\s*[:\\-]\\s*([^\\n]+)`,
      "i",
    );
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
};

const templateHintPattern =
  /(short and clear role name|city,\s*state,\s*country|dropdown:?|example:?|single rich text field containing|role overview|responsibilities|requirements|benefits|multiple select|no separate summary field needed|external link|default\s*=|if empty\s*[-–>])/i;

const extractValueAfterLabel = (text: string, labels: string[]) => {
  for (const label of labels) {
    const escapedLabel = escapeRegExp(label);
    const pattern = new RegExp(
      `${escapedLabel}(?:\\s*\\([^\\n)]*\\))?\\s*\\n+([^\\n]+)`,
      "i",
    );
    const match = text.match(pattern);
    const candidate = normalizeString(match?.[1]);
    if (!candidate || templateHintPattern.test(candidate)) {
      continue;
    }
    return candidate.replace(/^[-*]\s*/, "").trim();
  }
  return "";
};

const extractFieldValue = (text: string, labels: string[]) => {
  const inlineValue = normalizeString(extractLineValue(text, labels));
  if (inlineValue && !templateHintPattern.test(inlineValue)) {
    return inlineValue;
  }

  return extractValueAfterLabel(text, labels);
};

const normalizeListItem = (value: string) =>
  value.replace(/^[-*•\d.)\s]+/, "").replace(/\s+/g, " ").trim();

const splitInlineList = (value: string) => {
  const normalizedValue = value.replace(/\r/g, "").trim();
  if (!normalizedValue) {
    return [] as string[];
  }

  const hasExplicitSeparators = /[,;\n•|]/.test(normalizedValue);
  const hasSpacedSlashSeparators = /\s+\/\s+/.test(normalizedValue);
  const delimiterPattern = hasExplicitSeparators || hasSpacedSlashSeparators
    ? /,|;|\n|•|\||\s+\/\s+/
    : /,/;

  return normalizedValue
    .split(delimiterPattern)
    .map((item) => normalizeListItem(item))
    .filter((item) => item.length > 1);
};

const responsibilitySentenceBreakPattern =
  /;|\s{2,}(?=[A-Z])|(?<=[a-z0-9])\s+(?=(?:Design|Execute|Perform|Develop|Build|Maintain|Identify|Track|Verify|Collaborate|Participate|Ensure|Create|Lead|Manage|Monitor|Analyze|Support|Drive|Own|Implement|Review|Troubleshoot|Automate|Document)\b)/;

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

const splitResponsibilitiesList = (value: string) => {
  const normalizedValue = value.replace(/\r/g, "").trim();
  if (!normalizedValue) {
    return [] as string[];
  }

  return normalizedValue
    .split(/\n|•|\|/)
    .flatMap((item) => item.split(responsibilitySentenceBreakPattern))
    .map((item) => normalizeListItem(item))
    .filter((item) => item.length > 1);
};

const normalizeResponsibilitiesArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return dedupeItems(
      mergeContinuationListItems(
        value
          .flatMap((item) => splitResponsibilitiesList(normalizeString(item)))
          .filter(Boolean),
      ),
    );
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return [] as string[];
    }

    const inlineArrayValue =
      normalizedValue.startsWith("[") && normalizedValue.endsWith("]")
        ? normalizedValue.slice(1, -1)
        : normalizedValue;

    return dedupeItems(
      mergeContinuationListItems(splitResponsibilitiesList(inlineArrayValue)),
    );
  }

  return [] as string[];
};

const filterGenericListItems = (
  items: string[],
  kind: "skills" | "education",
) => {
  const pattern =
    kind === "skills" ? genericSkillItemPattern : genericEducationItemPattern;

  return items.filter((item) => !pattern.test(item));
};

const takeLimitedItems = (items: string[], limit: number) =>
  dedupeItems(items).slice(0, limit);

const toIsoDate = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const parsedDate = new Date(trimmedValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split("T")[0];
  }

  const slashDateMatch = trimmedValue.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/,
  );
  if (!slashDateMatch) {
    return "";
  }

  const day = Number.parseInt(slashDateMatch[1], 10);
  const month = Number.parseInt(slashDateMatch[2], 10);
  let year = Number.parseInt(slashDateMatch[3], 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return "";
  }

  if (year < 100) {
    year += 2000;
  }

  const normalizedDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(normalizedDate.getTime())) {
    return "";
  }

  return normalizedDate.toISOString().split("T")[0];
};

const findHeadingTitle = (text: string) => {
  const headingMatch = normalizeMarkdownSource(text).match(/^#{1,6}\s+(.+)$/m);
  return headingMatch?.[1]?.trim() || "";
};

const createBlogBodyFromStructuredSource = (text: string) => {
  const normalizedText = normalizeMarkdownSource(text);
  const lines = normalizedText.split("\n");
  const metadataLabelPattern =
    /^(title|blog title|headline|slug|summary|excerpt|description|topic|category|tags?|author|written by|publish date|date|cover image|image|thumbnail)\s*[:\-]?$/i;
  const bodyFieldPattern =
    /^(content|body|article|article content|post content)\s*[:\-]?$/i;
  const filteredLines: string[] = [];
  let skipNextMetadataValue = false;
  let isCapturingBody = false;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      if (isCapturingBody || filteredLines.length > 0) {
        filteredLines.push("");
      }
      continue;
    }

    if (isCapturingBody) {
      filteredLines.push(rawLine);
      continue;
    }

    if (skipNextMetadataValue) {
      skipNextMetadataValue = false;
      continue;
    }

    if (bodyFieldPattern.test(trimmedLine)) {
      isCapturingBody = true;
      continue;
    }

    if (/^(content|body|article|article content|post content)\s*[:\-]\s*/i.test(trimmedLine)) {
      filteredLines.push(
        trimmedLine.replace(/^(content|body|article|article content|post content)\s*[:\-]\s*/i, ""),
      );
      isCapturingBody = true;
      continue;
    }

    if (metadataLabelPattern.test(trimmedLine)) {
      skipNextMetadataValue = true;
      continue;
    }

    if (
      /^(title|blog title|headline|slug|summary|excerpt|description|topic|category|tags?|author|written by|publish date|date|cover image|image|thumbnail)\s*[:\-]\s*/i.test(
        trimmedLine,
      )
    ) {
      continue;
    }

    filteredLines.push(rawLine);
  }

  return normalizeMarkdownSource(filteredLines.join("\n"));
};

const normalizeExperienceBand = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("fresher") || lowerText.includes("entry level")) {
    return "Fresher";
  }

  if (
    lowerText.match(/\b0\s*[-to]+\s*1\b/) ||
    lowerText.includes("0-1") ||
    lowerText.includes("0 to 1")
  ) {
    return "0-1 years";
  }

  if (
    lowerText.match(/\b1\s*[-to]+\s*3\b/) ||
    lowerText.includes("1-3") ||
    lowerText.includes("1 to 3") ||
    lowerText.includes("2 years")
  ) {
    return "1-3 years";
  }

  if (
    lowerText.match(/\b3\s*[-to]+\s*5\b/) ||
    lowerText.includes("3-5") ||
    lowerText.includes("3 to 5") ||
    lowerText.includes("4 years")
  ) {
    return "3-5 years";
  }

  if (
    lowerText.match(/\b5\+?\s*(years?|yrs?)\b/) ||
    lowerText.includes("5+")
  ) {
    return "5+ years";
  }

  if (lowerText.match(/\b1\s*(years?|yrs?)\b/)) {
    return "0-1 years";
  }
  if (
    lowerText.match(/\b(2|3)\s*(years?|yrs?)\b/) ||
    lowerText.includes("mid-level")
  ) {
    return "1-3 years";
  }
  if (lowerText.match(/\b(4|5)\s*(years?|yrs?)\b/)) {
    return "3-5 years";
  }
  if (lowerText.match(/\b([6-9]|1\d)\s*(years?|yrs?)\b/) || lowerText.includes("senior")) {
    return "5+ years";
  }

  return "";
};

const normalizeExperienceValue = (value: string) => {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return "";
  }

  const normalizedBand = normalizeExperienceBand(normalizedValue);
  if (normalizedBand) {
    return normalizedBand;
  }

  return normalizedValue.replace(/\s+/g, " ").slice(0, 80);
};

const normalizeEmploymentType = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("intern")) return "Internship";
  if (lowerText.includes("part time") || lowerText.includes("part-time")) return "Part-time";
  if (
    lowerText.includes("contract") ||
    lowerText.includes("freelance") ||
    lowerText.includes("consultant") ||
    lowerText.includes("temporary")
  ) {
    return "Contract";
  }
  if (lowerText.includes("permanent") || lowerText.includes("regular")) return "Full-time";
  if (lowerText.includes("full time") || lowerText.includes("full-time")) return "Full-time";
  return "";
};

const normalizeWorkMode = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("hybrid")) return "Hybrid";
  if (
    lowerText.includes("remote") ||
    lowerText.includes("work from home") ||
    lowerText.includes("wfh")
  ) {
    return "Remote";
  }
  if (
    lowerText.includes("on-site") ||
    lowerText.includes("onsite") ||
    lowerText.includes("on site") ||
    lowerText.includes("work from office") ||
    lowerText.includes("office based")
  ) {
    return "On-site";
  }
  return "";
};

const extractSectionLines = (text: string, sectionTitles: string[]) => {
  const lines = text.replace(/\r/g, "").split("\n");
  const normalizeSectionTitle = (value: string) =>
    value
      .toLowerCase()
      .replace(/^#{1,6}\s+/, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const normalizedTitles = sectionTitles.map((title) => normalizeSectionTitle(title));
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
    const normalizedValue = normalizeSectionTitle(value);
    return structuredFieldHeadings.some(
      (heading) =>
        normalizedValue === heading || normalizedValue.startsWith(`${heading} `),
    );
  };
  const collectedLines: string[] = [];

  const matchSectionTitle = (value: string) => {
    const normalizedValue = normalizeSectionTitle(value);
    return normalizedTitles.find(
      (title) =>
        normalizedValue === title ||
        normalizedValue.startsWith(`${title} `),
    );
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    const lowerLine = line.toLowerCase();
    const matchedTitle = matchSectionTitle(lowerLine);
    if (!matchedTitle) {
      continue;
    }

    const lineWithoutHeadingPrefix = line.replace(/^#{1,6}\s+/, "").trim();
    const inlineRemainder = lineWithoutHeadingPrefix
      .slice(matchedTitle.length)
      .trim();
    const inlineSegment =
      inlineRemainder && !/^\(.*\)$/.test(inlineRemainder)
        ? normalizeListItem(inlineRemainder.replace(/^[:\-–]\s*/, ""))
        : "";
    if (inlineSegment) {
      collectedLines.push(inlineSegment);
    }

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const candidateLine = lines[nextIndex].trim();
      if (!candidateLine) {
        continue;
      }

      const lowerCandidate = candidateLine.toLowerCase();
      if (matchSectionTitle(lowerCandidate) && !bulletLinePattern.test(candidateLine)) {
        break;
      }

      if (!bulletLinePattern.test(candidateLine) && isStructuredFieldHeading(candidateLine)) {
        break;
      }

      if (
        fieldLabelPattern.test(candidateLine) &&
        !bulletLinePattern.test(candidateLine) &&
        !/(skills?|technologies|education|qualification|responsibilit|requirements?)/i.test(
          candidateLine,
        )
      ) {
        break;
      }

      collectedLines.push(candidateLine);
    }
  }

  return collectedLines;
};

const extractListSection = (text: string, sectionTitles: string[]) =>
  takeLimitedItems(splitInlineList(extractSectionLines(text, sectionTitles).join("\n")), 20);

const extractResponsibilitiesSection = (text: string, sectionTitles: string[]) =>
  takeLimitedItems(
    mergeContinuationListItems(
      extractSectionLines(text, sectionTitles)
        .flatMap((line) => splitResponsibilitiesList(line))
        .filter(Boolean),
    ),
    20,
  );

const extractInlineOrSectionList = (
  text: string,
  inlineLabels: string[],
  sectionTitles: string[],
  kind: "skills" | "education",
  limit = 20,
) => {
  const inlineValue = extractFieldValue(text, inlineLabels);
  const inlineItems = splitInlineList(inlineValue);
  const sectionItems = extractListSection(text, sectionTitles);

  const specificItems = filterGenericListItems(
    [...inlineItems, ...sectionItems],
    kind,
  );

  if (specificItems.length > 0) {
    return takeLimitedItems(specificItems, limit);
  }

  return takeLimitedItems([...inlineItems, ...sectionItems], limit);
};

const extractJobFallback = (text: string): JobExtractedData => {
  const titleFromLine =
    extractFieldValue(text, ["job title", "title", "role", "position"]) ||
    text
      .split(/\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 8 && line.length < 120) ||
    "";
  const title = titleFromLine.slice(0, 140);

  const salary =
    extractFieldValue(text, ["salary", "ctc", "compensation", "pay"]) ||
    (text.match(
      /(?:₹|rs\.?|inr|\$)\s?[0-9][0-9,.\s]*(?:lpa|lakhs?|k|per annum|\/year|\/month)?/i,
    )?.[0] || "");

  const rawExperience =
    extractFieldValue(text, ["experience required", "experience"]) ||
    (text.match(
      /(?:\d+\+?\s*(?:to|-)?\s*\d*\s*(?:years?|yrs?)|\d+\+\s*(?:years?|yrs?))/i,
    )?.[0] || "");

  const company =
    extractFieldValue(text, ["company name", "company", "organization", "employer"]) ||
    (text.match(/(?:at|with)\s+([A-Z][A-Za-z0-9& .-]{2,60})/)?.[1] || "");

  const employmentType = normalizeEmploymentType(
    extractFieldValue(text, ["employment type", "job type", "type"]) || text,
  );
  const workMode = normalizeWorkMode(
    extractFieldValue(text, ["work mode", "mode", "job mode"]) || text,
  );
  const location =
    extractFieldValue(text, ["location", "job location", "work location"]) ||
    (workMode === "Remote" ? "Remote" : "");
  const experience =
    normalizeExperienceValue(rawExperience) || normalizeExperienceValue(text);
  const eligibilityInline = extractFieldValue(text, [
    "eligibility criteria",
    "eligibility",
    "candidate profile",
    "who can apply",
    "requirements",
  ]);
  const eligibilitySection = extractSectionLines(text, [
    "eligibility criteria",
    "eligibility",
    "candidate profile",
    "who can apply",
  ])
    .map((line) => normalizeListItem(line))
    .filter(Boolean)
    .join("\n")
    .trim();
  const eligibilityCriteria =
    (eligibilitySection.length > eligibilityInline.length
      ? eligibilitySection
      : eligibilityInline ||
        extractFieldValue(text, [
      "eligibility criteria",
      "eligibility",
      "candidate profile",
      "who can apply",
      "requirements",
    ]))
      .slice(0, 600);
  const applyLink =
    extractFieldValue(text, ["apply link", "application link", "apply url"]) ||
    extractUrl(text);
  const applicationStartDate =
    toIsoDate(
      extractFieldValue(text, ["application start date", "start date"]),
    ) || todayDateString();
  const applicationEndDate = toIsoDate(
    extractFieldValue(text, [
      "application end date",
      "end date",
      "last date",
      "expiry date",
    ]),
  );

  return {
    title,
    date: todayDateString(),
    company,
    location,
    workMode,
    employmentType,
    salary,
    experience,
    eligibilityCriteria,
    education: extractInlineOrSectionList(
      text,
      [
        "education",
        "qualification",
        "qualifications",
        "education required",
        "educational qualification",
        "educational qualifications",
        "academic qualification",
        "academic qualifications",
        "degree",
        "degrees",
      ],
      [
        "education",
        "qualification",
        "qualifications",
        "educational qualification",
        "educational qualifications",
        "academic",
        "academic qualifications",
      ],
      "education",
      20,
    ),
    skills: extractInlineOrSectionList(
      text,
      [
        "skills required",
        "skill required",
        "skills",
        "key skills",
        "technical skills",
        "technical skill",
        "required skills",
        "must-have skills",
        "skill set",
      ],
      [
        "skills required",
        "skill required",
        "skills",
        "key skills",
        "technical skills",
        "technical skill",
        "required skills",
        "must-have skills",
        "skill set",
        "requirements",
        "technologies",
        "core skills",
        "competencies",
      ],
      "skills",
      30,
    ),
    responsibilities: takeLimitedItems(
      extractResponsibilitiesSection(text, [
        "roles and responsibilities",
        "role and responsibilities",
        "roles responsibilities",
        "role responsibilities",
        "responsibilities",
        "key responsibilities",
        "what you'll do",
      ]),
      16,
    ),
    workingDays: extractFieldValue(text, ["working days", "work days"]),
    jobTiming: extractFieldValue(text, ["job timing", "timing", "shift timing"]),
    applyLink,
    applicationStartDate,
    applicationEndDate,
  };
};

const extractBlogFallback = (text: string): BlogExtractedData => {
  const normalizedText = normalizeMarkdownSource(text);
  const titleFromField = extractFieldValue(text, ["blog title", "title", "headline"]);
  const explicitSlug = toSlug(extractFieldValue(text, ["slug"]));
  const body = createBlogBodyFromStructuredSource(text) || normalizedText;
  const lines = body
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title =
    titleFromField ||
    findHeadingTitle(body) ||
    (lines[0] || "Untitled Blog Post").replace(/^#+\s*/, "").slice(0, 140);
  const summary = extractFieldValue(text, ["summary", "excerpt", "description"]);
  const topic = extractFieldValue(text, ["topic", "category"]);

  const tags = Array.from(
    new Set(
      splitInlineList(extractFieldValue(text, ["tags", "keywords"])).concat(
        [
          body.toLowerCase().includes("interview") ? "interview" : "",
          body.toLowerCase().includes("resume") ? "resume" : "",
          body.toLowerCase().includes("ai") ? "ai" : "",
          body.toLowerCase().includes("hiring") ? "hiring" : "",
          body.toLowerCase().includes("career") ? "career" : "",
        ].filter(Boolean),
      ),
    ),
  );

  return {
    title,
    slug: explicitSlug,
    summary,
    topic,
    tags,
    isTrending: false,
    author: extractFieldValue(text, ["author", "written by"]),
    coverImage: normalizeHttpUrl(
      extractFieldValue(text, ["cover image", "image", "thumbnail"]),
    ),
    date:
      toIsoDate(extractFieldValue(text, ["publish date", "date", "published on"])) ||
      todayDateString(),
    body: body.slice(0, 12000),
  };
};

const toBaseOrigin = (value: string) => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.origin;
  } catch {
    return value.replace(/\/$/, "");
  }
};

const swapBaseHost = (baseUrl: string, hostname: string) => {
  try {
    const parsedUrl = new URL(baseUrl);
    parsedUrl.hostname = hostname;
    return parsedUrl.origin;
  } catch {
    return baseUrl;
  }
};

const getOllamaBaseUrls = () => {
  const preferredBaseUrl = toBaseOrigin(
    process.env.OLLAMA_BASE_URL || defaultOllamaBaseUrl,
  );
  const candidates = [preferredBaseUrl];
  const localhostCandidate = swapBaseHost(preferredBaseUrl, "localhost");
  const loopbackCandidate = swapBaseHost(preferredBaseUrl, "127.0.0.1");

  if (!candidates.includes(localhostCandidate)) {
    candidates.push(localhostCandidate);
  }

  if (!candidates.includes(loopbackCandidate)) {
    candidates.push(loopbackCandidate);
  }

  return candidates;
};

const compactSourceForPrompt = (text: string) => {
  const normalizedText = text.replace(/\r/g, "").trim();
  const maxSourceChars = getMaxSourceChars();
  if (normalizedText.length <= maxSourceChars) {
    return normalizedText;
  }

  const headerSlice = normalizedText.slice(0, Math.floor(maxSourceChars * 0.45));
  const footerSlice = normalizedText.slice(-Math.floor(maxSourceChars * 0.25));
  const signalLines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && line.length < 220 && extractionSignalPattern.test(line))
    .slice(0, 140);

  const signalTextBudget = Math.max(
    0,
    maxSourceChars - headerSlice.length - footerSlice.length,
  );
  const signalText = signalLines.join("\n").slice(0, signalTextBudget);

  return [headerSlice, signalText, footerSlice]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, maxSourceChars);
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown extraction error";
};

const withSoftTimeout = async <T>(task: Promise<T>, timeoutMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Soft timeout exceeded (${timeoutMs}ms)`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const ollamaGenerate = async (prompt: string) => {
  const baseUrls = getOllamaBaseUrls();
  const model = process.env.OLLAMA_MODEL || "phi3:mini";
  const timeoutMs = getOllamaTimeoutMs();
  const numCtx = getOllamaContextSize();
  const numPredict = getOllamaNumPredict();
  let lastError: unknown = null;

  for (const baseUrl of baseUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: "json",
          options: {
            temperature: 0,
            num_ctx: numCtx,
            num_predict: numPredict,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Ollama API error (${response.status}) at ${baseUrl}: ${responseText.slice(0, 180)}`,
        );
      }

      const result = (await response.json()) as {
        response?: unknown;
        error?: unknown;
      };

      if (typeof result.error === "string" && result.error.trim()) {
        throw new Error(`Ollama error: ${result.error}`);
      }

      let rawResponseText = "";
      if (typeof result.response === "string") {
        rawResponseText = result.response;
      } else if (result.response && typeof result.response === "object") {
        rawResponseText = JSON.stringify(result.response);
      }

      if (!rawResponseText) {
        throw new Error("Invalid Ollama response payload");
      }

      return toJsonFromModelResponse(rawResponseText);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(toErrorMessage(lastError));
};

const normalizeJobData = (value: Record<string, unknown>): JobExtractedData => {
  const title = normalizeString(value.title || value.jobTitle);
  const company = normalizeString(value.company || value.companyName);
  const location = normalizeString(value.location || value.jobLocation);
  const workMode = normalizeWorkMode(
    normalizeString(value.workMode) ||
      normalizeString(value.mode) ||
      normalizeString(value.location),
  );
  const employmentType = normalizeEmploymentType(
    normalizeString(value.employmentType) ||
      normalizeString(value.jobType) ||
      normalizeString(value.type),
  );
  const rawExperience = normalizeString(
    normalizeString(value.experience) ||
      normalizeString(value.experienceRequired) ||
      normalizeString(value.experienceLevel),
  );
  const experience = normalizeExperienceValue(rawExperience);
  const eligibilityCriteria = normalizeString(
    value.eligibilityCriteria ||
      value.eligibility ||
      value.candidateProfile ||
      value.whoCanApply,
  );
  const skills = takeLimitedItems(
    filterGenericListItems(
      normalizeStringArray(
        value.skills || value.skillsRequired || value.technicalSkills,
      ),
      "skills",
    ),
    30,
  );
  const education = takeLimitedItems(
    filterGenericListItems(
      normalizeStringArray(
        value.education || value.educationRequired || value.qualification,
      ),
      "education",
    ),
    20,
  );
  const responsibilities = takeLimitedItems(
    normalizeResponsibilitiesArray(
      value.responsibilities ||
        value.rolesAndResponsibilities ||
        value.roleResponsibilities ||
        value.keyResponsibilities,
    ),
    16,
  );
  const applyLink = normalizeString(value.applyLink || value.applicationLink);
  const applicationStartDate =
    toIsoDate(
      normalizeString(value.applicationStartDate || value.startDate),
    ) || todayDateString();
  const applicationEndDate = toIsoDate(
    normalizeString(value.applicationEndDate || value.endDate || value.expiryDate),
  );
  const date =
    toIsoDate(normalizeString(value.date || value.postedDate)) || todayDateString();

  return {
    title,
    date,
    company,
    location,
    workMode,
    employmentType,
    salary: normalizeString(value.salary),
    experience,
    eligibilityCriteria,
    education,
    skills,
    responsibilities,
    workingDays: normalizeString(value.workingDays),
    jobTiming: normalizeString(value.jobTiming),
    applyLink,
    applicationStartDate,
    applicationEndDate,
  };
};

const mergeField = (primaryValue: string, fallbackValue: string) =>
  primaryValue || fallbackValue;

const mergeListField = (
  primaryItems: string[],
  fallbackItems: string[],
  limit: number,
) => {
  return dedupeItems([...fallbackItems, ...primaryItems]).slice(0, limit);
};

const mergeLongerField = (primaryValue: string, fallbackValue: string) => {
  const normalizedPrimary = primaryValue.trim();
  const normalizedFallback = fallbackValue.trim();

  if (!normalizedPrimary) {
    return normalizedFallback;
  }

  if (!normalizedFallback) {
    return normalizedPrimary;
  }

  return normalizedPrimary.length >= normalizedFallback.length
    ? normalizedPrimary
    : normalizedFallback;
};

const mergeJobData = (
  primaryData: JobExtractedData,
  fallbackData: JobExtractedData,
): JobExtractedData => ({
  title: mergeField(primaryData.title, fallbackData.title),
  date: mergeField(primaryData.date, fallbackData.date) || todayDateString(),
  company: mergeField(primaryData.company, fallbackData.company),
  location: mergeField(primaryData.location, fallbackData.location),
  workMode: mergeField(primaryData.workMode, fallbackData.workMode),
  employmentType: mergeField(primaryData.employmentType, fallbackData.employmentType),
  salary: mergeField(primaryData.salary, fallbackData.salary),
  experience: mergeField(primaryData.experience, fallbackData.experience),
  eligibilityCriteria: mergeLongerField(
    primaryData.eligibilityCriteria,
    fallbackData.eligibilityCriteria,
  ),
  education: mergeListField(primaryData.education, fallbackData.education, 20),
  skills: mergeListField(primaryData.skills, fallbackData.skills, 30),
  responsibilities: mergeListField(
    primaryData.responsibilities,
    fallbackData.responsibilities,
    16,
  ),
  workingDays: mergeField(primaryData.workingDays, fallbackData.workingDays),
  jobTiming: mergeField(primaryData.jobTiming, fallbackData.jobTiming),
  applyLink: mergeField(primaryData.applyLink, fallbackData.applyLink),
  applicationStartDate: mergeField(
    primaryData.applicationStartDate,
    fallbackData.applicationStartDate,
  ),
  applicationEndDate: mergeField(
    primaryData.applicationEndDate,
    fallbackData.applicationEndDate,
  ),
});

const normalizeBlogData = (value: Record<string, unknown>): BlogExtractedData => {
  const title = normalizeString(value.title || value.headline);
  const body = normalizeMarkdownSource(normalizeString(value.body)).slice(0, 12000);
  const date =
    toIsoDate(normalizeString(value.date || value.publishedAt)) || todayDateString();

  return {
    title,
    slug: normalizeString(value.slug) || toSlug(title),
    summary: normalizeString(value.summary).replace(/\s+/g, " ").trim(),
    topic: normalizeString(value.topic || value.category),
    tags: normalizeStringArray(value.tags).slice(0, 8),
    isTrending: Boolean(value.isTrending),
    author: normalizeString(value.author),
    coverImage: normalizeHttpUrl(value.coverImage || value.image || value.thumbnail),
    date,
    body,
  };
};

const weakBlogTitlePattern = /^(title|untitled|untitled blog post|blog post)$/i;
const promptLeakPattern =
  /\b(slug|summary|alternate options?|topic|tags?)\b/i;

const cleanBlogTitle = (value: string, fallbackValue: string) => {
  const normalizedValue = normalizeString(value).replace(/^title[:\s-]*/i, "").trim();
  if (!normalizedValue || weakBlogTitlePattern.test(normalizedValue)) {
    return fallbackValue;
  }

  return normalizedValue.slice(0, 140);
};

const cleanBlogSummary = (value: string, fallbackValue: string) => {
  const normalizedValue = normalizeString(value).replace(/\s+/g, " ").trim();
  if (
    !normalizedValue ||
    normalizedValue.length < 24 ||
    (promptLeakPattern.test(normalizedValue) && normalizedValue.length > 90)
  ) {
    return fallbackValue;
  }

  return normalizedValue.slice(0, 320);
};

const cleanBlogTopic = (value: string) => {
  const normalizedValue = normalizeString(value)
    .replace(/^topic[:\s-]*/i, "")
    .replace(/^category[:\s-]*/i, "")
    .trim();

  if (!normalizedValue || emptyBlogPlaceholderPattern.test(normalizedValue)) {
    return "";
  }

  return normalizedValue.slice(0, 80);
};

const cleanBlogAuthor = (value: string) => {
  const normalizedValue = normalizeString(value)
    .replace(/^author[:\s-]*/i, "")
    .replace(/^written by[:\s-]*/i, "")
    .trim();

  if (!normalizedValue || emptyBlogPlaceholderPattern.test(normalizedValue)) {
    return "";
  }

  return normalizedValue.slice(0, 80);
};

const cleanBlogSlug = (value: string, fallbackValue: string, title: string) => {
  const normalizedValue = toSlug(normalizeString(value));
  if (normalizedValue) {
    return normalizedValue;
  }

  const normalizedFallbackValue = toSlug(normalizeString(fallbackValue));
  if (normalizedFallbackValue) {
    return normalizedFallbackValue;
  }

  return toSlug(title);
};

const cleanBlogBody = (value: string) => {
  const normalizedValue = normalizeMarkdownSource(normalizeString(value)).trim();

  if (!normalizedValue || emptyBlogPlaceholderPattern.test(normalizedValue)) {
    return "";
  }

  return normalizedValue.slice(0, 12000);
};

const mergeBlogData = (
  primaryData: BlogExtractedData,
  fallbackData: BlogExtractedData,
): BlogExtractedData => {
  const title = cleanBlogTitle(
    fallbackData.title,
    cleanBlogTitle(primaryData.title, "Untitled Blog Post"),
  );

  return {
    title,
    slug: cleanBlogSlug(fallbackData.slug, primaryData.slug, title),
    summary: fallbackData.summary
      ? cleanBlogSummary(fallbackData.summary, "")
      : "",
    topic: cleanBlogTopic(fallbackData.topic) || cleanBlogTopic(primaryData.topic),
    tags: dedupeItems([...fallbackData.tags, ...primaryData.tags]).slice(0, 8),
    isTrending: primaryData.isTrending || fallbackData.isTrending,
    author: cleanBlogAuthor(fallbackData.author) || cleanBlogAuthor(primaryData.author),
    coverImage: normalizeHttpUrl(fallbackData.coverImage || primaryData.coverImage),
    date:
      toIsoDate(normalizeString(fallbackData.date || primaryData.date)) ||
      todayDateString(),
    body: cleanBlogBody(fallbackData.body) || cleanBlogBody(primaryData.body),
  };
};

export const extractJobFromText = async (
  text: string,
): Promise<JobExtractionResult> => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("Source text is required for job extraction");
  }
  const fallbackData = extractJobFallback(trimmedText);
  const sourceForModel = compactSourceForPrompt(trimmedText);
  const softTimeoutMs = getOllamaSoftTimeoutMs();

  const prompt = `
You are an extraction engine for a job posting dashboard.
Extract structured fields from the text below.
Return only valid JSON with this exact schema:
{
  "title": "",
  "company": "",
  "location": "",
  "workMode": "",
  "employmentType": "",
  "salary": "",
  "experience": "",
  "eligibilityCriteria": "",
  "education": [],
  "skills": [],
  "responsibilities": [],
  "workingDays": "",
  "jobTiming": "",
  "applyLink": "",
  "applicationStartDate": "",
  "applicationEndDate": ""
}
Rules:
- Keep unknown values as empty string or empty array.
- workMode must be one of: "On-site", "Remote", "Hybrid".
- employmentType must be one of: "Full-time", "Part-time", "Internship", "Contract".
- experience should preserve source wording (examples: "Fresher", "1-3 years", "2-4 years", "6+ months").
- "eligibilityCriteria" should summarize who can apply / candidate profile in 1-2 lines.
- Keep fields concise and human-readable.
- Use YYYY-MM-DD for dates when possible.
- "skills" and "education" must include specific items. Do not return only section headers like "Technical Skills" or "Education".
- "responsibilities" should include concrete responsibility points when available.
- Include all available items for "skills", "education", and "responsibilities" (not just first 1-2 items).
- When eligibility has multiple points, include all points in "eligibilityCriteria".
Template mapping priority:
- If input uses labels like "Job Title", "Company Name", "Work Mode", "Employment Type",
  "Experience Required", "Eligibility Criteria", "Education", "Skills Required", "Roles & Responsibilities",
  "Working Days", "Job Timing",
  "Apply Link", "Application Start Date", "Application End Date", map them directly.
- "Skills Required" may be comma-separated; return as array.
- "Education" may be plain text; return as single-item array when needed.
NOTE:
- Source text may be condensed for token limits. Infer conservatively.
SOURCE:
${sourceForModel}
`;

  try {
    const aiData = await withSoftTimeout(ollamaGenerate(prompt), softTimeoutMs);
    const normalizedAiData = normalizeJobData(aiData);
    return {
      mode: "ollama",
      data: mergeJobData(normalizedAiData, fallbackData),
    };
  } catch (error) {
    const reason = toErrorMessage(error);
    console.warn(`[autoExtract][jobs] Falling back: ${reason}`);
    return {
      mode: "fallback",
      data: fallbackData,
      reason,
    };
  }
};

export const extractBlogFromText = async (
  text: string,
): Promise<BlogExtractionResult> => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("Source text is required for blog extraction");
  }
  const fallbackData = extractBlogFallback(trimmedText);
  const sourceForModel = compactSourceForPrompt(trimmedText);
  const softTimeoutMs = getOllamaSoftTimeoutMs();

  const prompt = `
You are an extraction engine for a blog publishing dashboard.
Extract structured fields from the text below.
Return only valid JSON with this exact schema:
{
  "title": "",
  "slug": "",
  "summary": "",
  "topic": "",
  "tags": [],
  "isTrending": false,
  "author": "",
  "coverImage": "",
  "date": "",
  "body": ""
}
Rules:
- Keep unknown values as empty string, false, or empty array.
- If the source uses labels like "Title", "Slug", "Summary", "Topic", "Category",
  "Tags", "Author", "Written By", "Cover Image", "Image", "Thumbnail",
  "Publish Date", "Date", "Content", or "Body", map those fields directly.
- Preserve the exact topic wording from the source. Do not shorten "Career Growth" to "Career".
- Do not invent summary, author, topic, or coverImage when they are not present in the source.
- slug should be URL-safe lowercase with hyphens.
- Use YYYY-MM-DD for date when possible.
- body should contain only the article content in clean markdown.
- Exclude metadata labels from body.
NOTE:
- Source text may be condensed for token limits. Infer conservatively.
SOURCE:
${sourceForModel}
`;

  try {
    const aiData = await withSoftTimeout(ollamaGenerate(prompt), softTimeoutMs);
    return {
      mode: "ollama",
      data: mergeBlogData(normalizeBlogData(aiData), fallbackData),
    };
  } catch (error) {
    const reason = toErrorMessage(error);
    console.warn(`[autoExtract][blogs] Falling back: ${reason}`);
    return {
      mode: "fallback",
      data: fallbackData,
      reason,
    };
  }
};
