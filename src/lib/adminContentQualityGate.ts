import type {
  AdminCollection,
  AdminMobileBlogEntry,
  AdminMobileEntry,
  AdminMobileJobEntry,
} from "@/lib/adminMobile";

type QualityGateRule = {
  label: string;
  pattern: RegExp;
};

type ContentMetrics = {
  externalLinkCount: number;
  headings: string[];
  longParagraphCount: number;
  normalizedBody: string;
  paragraphCount: number;
  repeatedParagraphs: string[];
  sentenceCount: number;
  uniqueWordRatio: number;
  wordCount: number;
};

export type AdminContentQualityCheckStatus = "pass" | "warning" | "fail";

export type AdminContentQualityCheck = {
  detail: string;
  label: string;
  status: AdminContentQualityCheckStatus;
};

export type AdminContentQualityMetrics = {
  educationCount?: number;
  externalLinkCount: number;
  headingCount: number;
  longParagraphCount: number;
  missingJobDetailCount?: number;
  paragraphCount: number;
  responsibilitiesCount?: number;
  sentenceCount: number;
  skillsCount?: number;
  summaryLength?: number;
  tagCount?: number;
  titleLength: number;
  uniqueWordRatio: number;
  wordCount: number;
};

export type AdminContentQualityReview = {
  blockers: string[];
  checks: AdminContentQualityCheck[];
  collection: AdminCollection;
  draft: boolean;
  metrics: AdminContentQualityMetrics;
  readyToPublish: boolean;
  score: number;
  status: "ready" | "warning" | "blocked";
  warnings: string[];
};

const weakPlaceholderRules: QualityGateRule[] = [
  { label: "lorem ipsum or placeholder copy", pattern: /\blorem ipsum\b/i },
  { label: "draft marker", pattern: /\b(?:todo|tbd|coming soon|under construction)\b/i },
  { label: "demo/sample content", pattern: /\b(?:demo|sample|dummy|placeholder)\b/i },
  { label: "AI assistant disclaimer", pattern: /\bas an ai\b|\bi cannot browse\b|\bi can't browse\b/i },
];

const adSenseTrustRiskRules: QualityGateRule[] = [
  { label: "asking users to click ads", pattern: /\b(?:click|tap)\s+(?:on\s+)?(?:the\s+)?ads?\b/i },
  { label: "asking users to support the site through ads", pattern: /\bsupport\s+(?:us|this site).{0,40}\bads?\b/i },
  { label: "guaranteed job or placement claim", pattern: /\b(?:100%|guaranteed)\s+(?:job|placement|selection|hiring)\b/i },
  { label: "pay-to-apply or deposit claim", pattern: /\b(?:pay|deposit|registration fee|processing fee).{0,60}\b(?:apply|interview|job|joining)\b/i },
  { label: "request for sensitive credentials", pattern: /\b(?:password|otp|one time password|bank pin|cvv)\b/i },
  { label: "piracy or cracking content", pattern: /\b(?:torrent|cracked software|software crack|license key generator|keygen)\b/i },
  { label: "fake document or certificate claim", pattern: /\b(?:fake|forged)\s+(?:certificate|degree|passport|marksheet|resume)\b/i },
  { label: "adult or explicit content", pattern: /\b(?:porn|sexually explicit|escort service|adult dating)\b/i },
  { label: "gambling or betting content", pattern: /\b(?:betting|casino|sportsbook|real money gambling)\b/i },
];

const sensationalTitlePattern =
  /\b(?:shocking|you won't believe|secret trick|instant job|earn money fast|guaranteed)\b/i;
const excessivePunctuationPattern = /[!?]{2,}/;
const markdownLinkPattern = /\[[^\]]+\]\((https?:\/\/[^)\s]+)[^)]*\)/gi;
const bareExternalLinkPattern = /https?:\/\/[^\s)]+/gi;
const blockedApplyHosts = new Set([
  "bit.ly",
  "cutt.ly",
  "goo.gl",
  "lnkd.in",
  "rebrand.ly",
  "shorturl.at",
  "tinyurl.com",
]);

const dedupeIssues = (issues: string[]) =>
  Array.from(
    new Set(
      issues
        .map((issue) => issue.trim())
        .filter((issue) => issue.length > 0),
    ),
  );

const toPlainText = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\(([^)]+)\)/g, " $1 ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/^>\s+/gm, " ")
    .replace(/[*_~>#|[\]()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countWords = (value: string) => {
  const matches = toPlainText(value).match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu);
  return matches ? matches.length : 0;
};

const countSentences = (value: string) => {
  const matches = toPlainText(value).match(/[^.!?\n]+[.!?]+/g);
  return matches ? matches.length : 0;
};

const countExternalLinks = (value: string) => {
  const links = new Set<string>();

  for (const match of value.matchAll(markdownLinkPattern)) {
    links.add(match[1]);
  }

  for (const match of value.matchAll(bareExternalLinkPattern)) {
    links.add(match[0]);
  }

  return links.size;
};

const getHeadings = (value: string) =>
  Array.from(value.matchAll(/^#{2,3}\s+(.+)$/gm))
    .map((match) => match[1].trim())
    .filter((heading) => heading.length > 0);

const getParagraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => toPlainText(paragraph))
    .filter((paragraph) => paragraph.length > 0);

const getRepeatedParagraphs = (paragraphs: string[]) => {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const paragraph of paragraphs) {
    const normalized = paragraph.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.length < 90) {
      continue;
    }

    if (seen.has(normalized)) {
      repeated.add(paragraph.slice(0, 120));
      continue;
    }

    seen.add(normalized);
  }

  return Array.from(repeated);
};

const getUniqueWordRatio = (value: string) => {
  const words = toPlainText(value)
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu);

  if (!words || words.length === 0) {
    return 0;
  }

  const meaningfulWords = words.filter((word) => word.length > 3);
  if (meaningfulWords.length === 0) {
    return 0;
  }

  return new Set(meaningfulWords).size / meaningfulWords.length;
};

const getContentMetrics = (body: string): ContentMetrics => {
  const paragraphs = getParagraphs(body);

  return {
    externalLinkCount: countExternalLinks(body),
    headings: getHeadings(body),
    longParagraphCount: paragraphs.filter((paragraph) => countWords(paragraph) >= 45).length,
    normalizedBody: toPlainText(body),
    paragraphCount: paragraphs.length,
    repeatedParagraphs: getRepeatedParagraphs(paragraphs),
    sentenceCount: countSentences(body),
    uniqueWordRatio: getUniqueWordRatio(body),
    wordCount: countWords(body),
  };
};

const pushRuleMatches = (
  issues: string[],
  text: string,
  rules: QualityGateRule[],
  prefix: string,
) => {
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      issues.push(`${prefix}: remove or rewrite ${rule.label}.`);
    }
  }
};

const validateTitleQuality = (issues: string[], title: string, label: string) => {
  if (title.length > 0 && title.length < 18) {
    issues.push(`${label} title is too short to look useful in search and social previews.`);
  }

  if (title.length > 100) {
    issues.push(`${label} title is too long; keep it clear and under 100 characters.`);
  }

  if (sensationalTitlePattern.test(title) || excessivePunctuationPattern.test(title)) {
    issues.push(`${label} title looks clickbait or spammy. Rewrite it in a neutral, factual style.`);
  }

  const letters = title.replace(/[^a-z]/gi, "");
  const uppercaseLetters = title.replace(/[^A-Z]/g, "");
  if (letters.length >= 12 && uppercaseLetters.length / letters.length > 0.7) {
    issues.push(`${label} title should not be mostly uppercase.`);
  }
};

const validateCommonPublishQuality = (
  collection: AdminCollection,
  entry: AdminMobileEntry,
  contentText: string,
  metrics: ContentMetrics,
) => {
  const issues: string[] = [];
  const label = collection === "jobs" ? "Job" : "Blog";

  validateTitleQuality(issues, entry.title, label);
  pushRuleMatches(issues, contentText, weakPlaceholderRules, label);
  pushRuleMatches(issues, contentText, adSenseTrustRiskRules, label);

  if (metrics.repeatedParagraphs.length > 0) {
    issues.push(
      `${label} content repeats the same paragraph. Remove repeated blocks before publishing.`,
    );
  }

  if (metrics.wordCount >= 120 && metrics.uniqueWordRatio < 0.28) {
    issues.push(
      `${label} content looks repetitive. Add original explanation, context, or practical details.`,
    );
  }

  if (metrics.externalLinkCount > 8) {
    issues.push(`${label} content has too many external links. Keep only useful source or apply links.`);
  }

  return issues;
};

const safeParseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isPastIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const today = new Date().toISOString().split("T")[0];
  return value < today;
};

const getMissingJobDetailCount = (entry: AdminMobileJobEntry) =>
  [
    entry.workMode,
    entry.employmentType,
    entry.salary,
    entry.experience,
    entry.eligibilityCriteria,
    entry.workingDays,
    entry.jobTiming,
    entry.applicationEndDate,
  ].filter((value) => !value.trim()).length;

const buildJobContentText = (entry: AdminMobileJobEntry) =>
  [
    entry.title,
    entry.company,
    entry.location,
    entry.workMode,
    entry.employmentType,
    entry.salary,
    entry.experience,
    entry.eligibilityCriteria,
    entry.education.join(" "),
    entry.skills.join(" "),
    entry.responsibilities.join(" "),
    entry.workingDays,
    entry.jobTiming,
    entry.body,
  ].join("\n");

const validatePublishedJobQuality = (entry: AdminMobileJobEntry) => {
  const contentText = buildJobContentText(entry);
  const metrics = getContentMetrics(contentText);
  const issues = validateCommonPublishQuality("jobs", entry, contentText, metrics);
  const applyUrl = safeParseUrl(entry.applyLink);
  const missingDetailCount = getMissingJobDetailCount(entry);

  if (metrics.wordCount < 220) {
    issues.push(
      "Job post is thin. Add at least 220 words across overview, eligibility, responsibilities, skills, and how to apply.",
    );
  }

  if (metrics.sentenceCount < 8) {
    issues.push("Job post needs more editorial context, not only fields or bullet points.");
  }

  if (missingDetailCount >= 3) {
    issues.push(
      "Job post is missing too many trust details. Add work mode, employment type, salary or note, experience, timing, and deadline where available.",
    );
  }

  if (entry.education.length === 0) {
    issues.push("Add education/qualification before publishing this job.");
  }

  if (entry.skills.length < 3) {
    issues.push("Add at least 3 concrete skills for a useful job post.");
  }

  if (entry.responsibilities.length < 3) {
    issues.push("Add at least 3 responsibilities so the job page has real publisher value.");
  }

  if (countWords(entry.eligibilityCriteria) < 18) {
    issues.push("Eligibility criteria is too thin. Add who can apply and any important limits.");
  }

  if (!applyUrl || !["http:", "https:"].includes(applyUrl.protocol)) {
    issues.push("Published jobs must use a direct http/https apply link, not a placeholder or internal-only link.");
  } else if (blockedApplyHosts.has(applyUrl.hostname.replace(/^www\./, ""))) {
    issues.push("Apply link uses a shortener. Use the final company/careers URL for trust.");
  }

  if (entry.applicationEndDate && isPastIsoDate(entry.applicationEndDate)) {
    issues.push("Application end date is already in the past. Update the deadline or keep this as draft.");
  }

  const notMentionedCount = (contentText.match(/\bnot mentioned\b/gi) || []).length;
  if (notMentionedCount > 2) {
    issues.push("Too many fields say \"Not mentioned\". Add real details or explain what is unknown.");
  }

  return issues;
};

const buildBlogContentText = (entry: AdminMobileBlogEntry) =>
  [
    entry.title,
    entry.summary,
    entry.topic,
    entry.tags.join(" "),
    entry.author,
    entry.body,
  ].join("\n");

const validatePublishedBlogQuality = (entry: AdminMobileBlogEntry) => {
  const contentText = buildBlogContentText(entry);
  const metrics = getContentMetrics(entry.body);
  const issues = validateCommonPublishQuality("blogs", entry, contentText, metrics);

  if (entry.summary.length < 90 || entry.summary.length > 220) {
    issues.push("Blog summary should be 90-220 characters and clearly explain the reader benefit.");
  }

  if (entry.tags.length < 3) {
    issues.push("Add at least 3 relevant tags before publishing the blog.");
  }

  if (!entry.author) {
    issues.push("Author is required for trust and editorial transparency.");
  }

  if (!entry.coverImage) {
    issues.push("Add a relevant cover image before publishing the blog.");
  }

  if (metrics.wordCount < 700) {
    issues.push(
      "Blog is thin for AdSense-quality publishing. Add at least 700 words of original explanation, examples, and practical takeaways.",
    );
  }

  if (metrics.headings.length < 3) {
    issues.push("Add at least 3 useful H2/H3 sections so the article is structured and scannable.");
  }

  if (metrics.longParagraphCount < 4) {
    issues.push("Add more substantial paragraphs. The blog currently reads like notes or a short list.");
  }

  if (metrics.sentenceCount < 18) {
    issues.push("Blog needs more complete explanations and examples before publishing.");
  }

  if (metrics.externalLinkCount === 0 && /\b(?:study|report|data|survey|research|according to|announced|launched|2026)\b/i.test(contentText)) {
    issues.push("Add at least one credible source link for news, data, reports, or current-year claims.");
  }

  const bodyWordCount = Math.max(metrics.wordCount, 1);
  const linkDensity = metrics.externalLinkCount / bodyWordCount;
  if (linkDensity > 0.025) {
    issues.push("Blog has a high link density. Reduce promotional/source links and add more original explanation.");
  }

  return issues;
};

const toCheckStatus = (
  passCondition: boolean,
  warningCondition = false,
): AdminContentQualityCheckStatus =>
  passCondition ? "pass" : warningCondition ? "warning" : "fail";

const createCheck = (
  label: string,
  passCondition: boolean,
  detail: string,
  warningCondition = false,
): AdminContentQualityCheck => ({
  detail,
  label,
  status: toCheckStatus(passCondition, warningCondition),
});

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const buildReviewStatus = (
  blockers: string[],
  warnings: string[],
): AdminContentQualityReview["status"] => {
  if (blockers.length > 0) {
    return "blocked";
  }

  if (warnings.length > 0) {
    return "warning";
  }

  return "ready";
};

const buildJobWarnings = (
  entry: AdminMobileJobEntry,
  metrics: ContentMetrics,
  missingJobDetailCount: number,
) => {
  const warnings: string[] = [];

  if (!entry.salary.trim()) {
    warnings.push("Salary is missing. Add it if the employer provides a range or note.");
  }

  if (!entry.applicationEndDate.trim()) {
    warnings.push("Application deadline is missing. Add it when the employer provides one.");
  }

  if (!entry.workMode.trim()) {
    warnings.push("Work mode is missing. Mention remote, hybrid, or on-site when known.");
  }

  if (missingJobDetailCount > 0 && missingJobDetailCount < 3) {
    warnings.push("A few job trust details are still missing. Fill them in where possible.");
  }

  if (!entry.body.trim() && metrics.wordCount >= 220) {
    warnings.push("This job relies mostly on structured fields. A short overview paragraph would make it stronger.");
  }

  return warnings;
};

const buildBlogWarnings = (
  entry: AdminMobileBlogEntry,
  metrics: ContentMetrics,
) => {
  const warnings: string[] = [];

  if (!entry.ctaLabel.trim() && !entry.ctaLink.trim()) {
    warnings.push("CTA is optional, but adding a relevant next step can improve article usefulness.");
  }

  if (metrics.externalLinkCount === 0) {
    warnings.push("No external source links detected. Add sources when the article cites news, data, or reports.");
  }

  if (entry.tags.length < 5) {
    warnings.push("The article can be easier to discover with a few more specific tags.");
  }

  return warnings;
};

const buildJobChecks = (
  entry: AdminMobileJobEntry,
  metrics: ContentMetrics,
  missingJobDetailCount: number,
): AdminContentQualityCheck[] => {
  const applyUrl = safeParseUrl(entry.applyLink);
  const usesBlockedApplyHost = Boolean(
    applyUrl && blockedApplyHosts.has(applyUrl.hostname.replace(/^www\./, "")),
  );

  return [
    createCheck(
      "Title quality",
      entry.title.trim().length >= 18 && entry.title.trim().length <= 100,
      `${entry.title.trim().length} characters`,
    ),
    createCheck(
      "Company and location",
      Boolean(entry.company.trim() && entry.location.trim()),
      `${entry.company.trim() ? "Company set" : "Company missing"} • ${
        entry.location.trim() ? "Location set" : "Location missing"
      }`,
    ),
    createCheck(
      "Apply link",
      Boolean(applyUrl && ["http:", "https:"].includes(applyUrl.protocol) && !usesBlockedApplyHost),
      usesBlockedApplyHost
        ? "Use the final employer URL instead of a shortener."
        : applyUrl
          ? "Valid direct link"
          : "Add a direct employer or careers URL",
    ),
    createCheck(
      "Body depth",
      metrics.wordCount >= 220 && metrics.sentenceCount >= 8,
      `${metrics.wordCount} words • ${metrics.sentenceCount} sentences`,
    ),
    createCheck(
      "Eligibility details",
      countWords(entry.eligibilityCriteria) >= 18,
      `${countWords(entry.eligibilityCriteria)} words in eligibility section`,
    ),
    createCheck(
      "Skills",
      entry.skills.length >= 3,
      `${entry.skills.length} skills listed`,
      entry.skills.length > 0,
    ),
    createCheck(
      "Responsibilities",
      entry.responsibilities.length >= 3,
      `${entry.responsibilities.length} responsibilities listed`,
      entry.responsibilities.length > 0,
    ),
    createCheck(
      "Education",
      entry.education.length > 0,
      `${entry.education.length} education requirements listed`,
    ),
    createCheck(
      "Trust details",
      missingJobDetailCount < 3,
      `${missingJobDetailCount} optional trust fields still missing`,
      missingJobDetailCount > 0 && missingJobDetailCount < 3,
    ),
  ];
};

const buildBlogChecks = (
  entry: AdminMobileBlogEntry,
  metrics: ContentMetrics,
): AdminContentQualityCheck[] => [
  createCheck(
    "Title quality",
    entry.title.trim().length >= 18 && entry.title.trim().length <= 100,
    `${entry.title.trim().length} characters`,
  ),
  createCheck(
    "Summary",
    entry.summary.trim().length >= 90 && entry.summary.trim().length <= 220,
    `${entry.summary.trim().length} characters`,
  ),
  createCheck(
    "Topic, author, and cover",
    Boolean(entry.topic.trim() && entry.author.trim() && entry.coverImage.trim()),
    `${entry.topic.trim() ? "Topic set" : "Topic missing"} • ${
      entry.author.trim() ? "Author set" : "Author missing"
    } • ${entry.coverImage.trim() ? "Cover set" : "Cover missing"}`,
  ),
  createCheck(
    "Article depth",
    metrics.wordCount >= 700 && metrics.sentenceCount >= 18,
    `${metrics.wordCount} words • ${metrics.sentenceCount} sentences`,
  ),
  createCheck(
    "Structure",
    metrics.headings.length >= 3 && metrics.longParagraphCount >= 4,
    `${metrics.headings.length} sections • ${metrics.longParagraphCount} substantial paragraphs`,
  ),
  createCheck(
    "Tags",
    entry.tags.length >= 3,
    `${entry.tags.length} tags listed`,
    entry.tags.length > 0,
  ),
  createCheck(
    "Source links",
    metrics.externalLinkCount > 0,
    `${metrics.externalLinkCount} external links detected`,
    true,
  ),
];

export const buildAdminContentQualityReview = (
  entry: AdminMobileEntry,
): AdminContentQualityReview => {
  if (entry.collection === "jobs") {
    const metrics = getContentMetrics(buildJobContentText(entry));
    const missingJobDetailCount = getMissingJobDetailCount(entry);
    const qualitySuggestions = dedupeIssues(validatePublishedJobQuality(entry));
    const blockers: string[] = [];
    const warnings = dedupeIssues([
      ...qualitySuggestions,
      ...buildJobWarnings(entry, metrics, missingJobDetailCount),
    ]);
    const score = clampScore(
      100 -
        qualitySuggestions.length * 10 -
        warnings.length * 3 -
        Math.max(0, 220 - metrics.wordCount) / 8,
    );

    return {
      blockers,
      checks: buildJobChecks(entry, metrics, missingJobDetailCount),
      collection: entry.collection,
      draft: entry.draft,
      metrics: {
        educationCount: entry.education.length,
        externalLinkCount: metrics.externalLinkCount,
        headingCount: metrics.headings.length,
        longParagraphCount: metrics.longParagraphCount,
        missingJobDetailCount,
        paragraphCount: metrics.paragraphCount,
        responsibilitiesCount: entry.responsibilities.length,
        sentenceCount: metrics.sentenceCount,
        skillsCount: entry.skills.length,
        titleLength: entry.title.trim().length,
        uniqueWordRatio: metrics.uniqueWordRatio,
        wordCount: metrics.wordCount,
      },
      readyToPublish: blockers.length === 0,
      score,
      status: buildReviewStatus(blockers, warnings),
      warnings,
    };
  }

  const metrics = getContentMetrics(entry.body);
  const qualitySuggestions = dedupeIssues(validatePublishedBlogQuality(entry));
  const blockers: string[] = [];
  const warnings = dedupeIssues([
    ...qualitySuggestions,
    ...buildBlogWarnings(entry, metrics),
  ]);
  const score = clampScore(
    100 -
      qualitySuggestions.length * 8 -
      warnings.length * 3 -
      Math.max(0, 700 - metrics.wordCount) / 12,
  );

  return {
    blockers,
    checks: buildBlogChecks(entry, metrics),
    collection: entry.collection,
    draft: entry.draft,
    metrics: {
      externalLinkCount: metrics.externalLinkCount,
      headingCount: metrics.headings.length,
      longParagraphCount: metrics.longParagraphCount,
      paragraphCount: metrics.paragraphCount,
      sentenceCount: metrics.sentenceCount,
      summaryLength: entry.summary.trim().length,
      tagCount: entry.tags.length,
      titleLength: entry.title.trim().length,
      uniqueWordRatio: metrics.uniqueWordRatio,
      wordCount: metrics.wordCount,
    },
    readyToPublish: blockers.length === 0,
    score,
    status: buildReviewStatus(blockers, warnings),
    warnings,
  };
};

export const validatePublishedContentQuality = (entry: AdminMobileEntry) => {
  if (entry.draft) {
    return [] as string[];
  }

  return [];
};
