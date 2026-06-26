import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { toIsoDateString } from "./dateParsing";
import { normalizeMarkdownSource } from "./markdown";

export type RemoteJobDraftData = {
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

export type RemoteSourceTextResult = {
  sourceText: string;
  sourceUrl: string;
  resolvedUrl: string;
  contentType: string;
  jobData?: RemoteJobDraftData;
  sourceKind?: string;
};

const defaultMaxSourceChars = 120_000;
const defaultFetchTimeoutMs = 15_000;
const maxRemoteResponseBytes = 1_500_000;
const maxRedirects = 5;
const htmlMimeTypes = new Set(["text/html", "application/xhtml+xml"]);
const textMimeTypes = new Set(["text/plain", "text/markdown"]);
const jsonMimeTypes = new Set(["application/json", "application/ld+json"]);
const blockedHostnames = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::",
  "::1",
]);
const namedHtmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  copy: "(c)",
  gt: ">",
  hellip: "...",
  laquo: '"',
  ldquo: '"',
  lsquo: "'",
  lt: "<",
  mdash: "-",
  nbsp: " ",
  ndash: "-",
  quot: '"',
  raquo: '"',
  rdquo: '"',
  rsquo: "'",
  trade: "(tm)",
};

const normalizeWhitespace = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/[ \t\f\v]+/g, " ").trim();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clipText = (value: string, maxChars: number) => {
  if (value.length <= maxChars) {
    return value;
  }

  const clippedValue = value.slice(0, maxChars);
  const lastBreak =
    Math.max(clippedValue.lastIndexOf("\n"), clippedValue.lastIndexOf(" "));

  return (lastBreak > maxChars * 0.7 ? clippedValue.slice(0, lastBreak) : clippedValue).trim();
};

const decodeHtmlEntities = (value: string) =>
  value.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (entity, token: string) => {
    const normalizedToken = String(token || "").toLowerCase();

    if (normalizedToken.startsWith("#x")) {
      const codePoint = Number.parseInt(normalizedToken.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    if (normalizedToken.startsWith("#")) {
      const codePoint = Number.parseInt(normalizedToken.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }

    return namedHtmlEntities[normalizedToken] || entity;
  });

const stripHtmlTags = (value: string) =>
  decodeHtmlEntities(value.replace(/<[^>]+>/g, " "));

const toTextValue = (value: unknown): string => {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return normalizeWhitespace(stripHtmlTags(value));
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;

  return (
    toTextValue(record.text) ||
    toTextValue(record.name) ||
    toTextValue(record.title) ||
    toTextValue(record.value) ||
    ""
  );
};

const splitInlineTextItems = (value: string) =>
  normalizeWhitespace(value)
    .split(/\s*(?:\n|[;,]|(?:\s+-\s+))\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);

const dedupeList = (items: string[]) => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const normalizedItem = normalizeWhitespace(item);
    if (!normalizedItem) {
      continue;
    }

    const key = normalizedItem.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(normalizedItem);
  }

  return deduped;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return dedupeList(value.flatMap((item) => toStringList(item)));
  }

  if (typeof value === "string") {
    return dedupeList(splitInlineTextItems(value));
  }

  const textValue = toTextValue(value);
  return textValue ? [textValue] : [];
};

const appendLabeledLine = (lines: string[], label: string, value: string) => {
  const normalizedValue = normalizeWhitespace(value);
  if (!normalizedValue) {
    return;
  }

  lines.push(`${label}: ${normalizedValue}`);
};

const appendLabeledList = (lines: string[], label: string, items: string[]) => {
  const normalizedItems = dedupeList(items);
  if (normalizedItems.length === 0) {
    return;
  }

  lines.push(`${label}:`);
  for (const item of normalizedItems) {
    lines.push(`- ${item}`);
  }
};

const readHtmlAttribute = (tagSource: string, attributeName: string) => {
  const attributePattern = new RegExp(
    `${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tagSource.match(attributePattern);
  const rawValue = match?.[1] || match?.[2] || match?.[3] || "";
  return rawValue ? decodeHtmlEntities(rawValue).trim() : "";
};

const splitSetCookieHeader = (value: string) =>
  String(value || "")
    .split(/,(?=[^;,=\s]+=[^;,]+)/g)
    .map((item) => item.trim())
    .filter(Boolean);

const readResponseSetCookieHeaders = (response: Response) => {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof responseHeaders.getSetCookie === "function") {
    return responseHeaders.getSetCookie().filter(Boolean);
  }

  const combinedHeader = response.headers.get("set-cookie");
  return combinedHeader ? splitSetCookieHeader(combinedHeader) : [];
};

const mergeCookieHeader = (existingCookieHeader: string, setCookieHeaders: string[]) => {
  const cookieMap = new Map<string, string>();

  const addCookiePair = (cookiePair: string) => {
    const normalizedPair = String(cookiePair || "").trim();
    const separatorIndex = normalizedPair.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const cookieName = normalizedPair.slice(0, separatorIndex).trim();
    const cookieValue = normalizedPair.slice(separatorIndex + 1).trim();
    if (!cookieName) {
      return;
    }

    cookieMap.set(cookieName, cookieValue);
  };

  for (const cookiePart of String(existingCookieHeader || "").split(/;\s*/g)) {
    if (cookiePart) {
      addCookiePair(cookiePart);
    }
  }

  for (const setCookieHeader of setCookieHeaders) {
    const cookiePair = String(setCookieHeader || "").split(";")[0] || "";
    if (cookiePair) {
      addCookiePair(cookiePair);
    }
  }

  return Array.from(cookieMap.entries())
    .map(([cookieName, cookieValue]) => `${cookieName}=${cookieValue}`)
    .join("; ");
};

const getMetaContent = (html: string, keys: string[]) => {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));

  for (const tag of metaTags) {
    const key =
      readHtmlAttribute(tag, "name") ||
      readHtmlAttribute(tag, "property") ||
      readHtmlAttribute(tag, "itemprop");
    const normalizedKey = key.toLowerCase();

    if (!normalizedKeys.has(normalizedKey)) {
      continue;
    }

    const content = readHtmlAttribute(tag, "content");
    if (content) {
      return normalizeWhitespace(content);
    }
  }

  return "";
};

const readApplyLinkFromHtml = (html: string) => {
  const metaApplyLink =
    getMetaContent(html, [
      "search-job-apply-url",
      "search-job-mobile-apply-url",
      "job-apply-url",
      "apply-url",
      "application-url",
    ]) || "";
  if (metaApplyLink) {
    return metaApplyLink;
  }

  const attributeMatch =
    html.match(/\bdata-(?:apply|application)-url\s*=\s*"([^"]+)"/i)?.[1] ||
    html.match(/\bdata-(?:apply|application)-url\s*=\s*'([^']+)'/i)?.[1] ||
    html.match(/\b(?:apply|application)Url\s*[:=]\s*"([^"]+)"/i)?.[1] ||
    html.match(/\b(?:apply|application)Url\s*[:=]\s*'([^']+)'/i)?.[1] ||
    "";

  return attributeMatch ? normalizeWhitespace(decodeHtmlEntities(attributeMatch)) : "";
};

const readLinkHrefByRel = (html: string, relName: string) => {
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const normalizedRelName = relName.trim().toLowerCase();

  for (const tag of linkTags) {
    const relValue = readHtmlAttribute(tag, "rel").toLowerCase();
    if (!relValue) {
      continue;
    }

    const relParts = relValue
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!relParts.includes(normalizedRelName)) {
      continue;
    }

    const href = readHtmlAttribute(tag, "href");
    if (href) {
      return href;
    }
  }

  return "";
};

const getTitleFromHtml = (html: string) => {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? normalizeWhitespace(stripHtmlTags(titleMatch[1])) : "";
};

const genericJobsLandingTitlePattern = /^(jobs?|job search|careers?)(?:\s*[-|:]\s*.+)?$/i;

const normalizeComparablePath = (value: string, baseUrl?: string) => {
  try {
    const parsedUrl = baseUrl ? new URL(value, baseUrl) : new URL(value);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/g, "");
    return normalizedPath || "/";
  } catch {
    return "";
  }
};

const isJobDetailPath = (value: string) =>
  /\/(?:job|jobs|requisitions)\/[^/?#]+(?:\/[^/?#]+)*$/i.test(value);

const getJobListingBasePath = (value: string) => {
  const match = value.match(/^(.*\/(?:job|jobs|requisitions))(?:\/[^/?#]+)+$/i);
  return match?.[1] ? match[1].replace(/\/+$/g, "") || "/" : "";
};

const looksLikeGenericJobLandingPage = (
  html: string,
  sourceUrl: string,
  resolvedUrl: string,
) => {
  const requestedPath = normalizeComparablePath(resolvedUrl || sourceUrl, sourceUrl);
  if (!requestedPath || !isJobDetailPath(requestedPath)) {
    return false;
  }

  const listingBasePath = getJobListingBasePath(requestedPath);
  if (!listingBasePath) {
    return false;
  }

  const canonicalUrl =
    readLinkHrefByRel(html, "canonical") || getMetaContent(html, ["og:url"]) || "";
  const canonicalPath = normalizeComparablePath(canonicalUrl, resolvedUrl || sourceUrl);
  if (!canonicalPath || canonicalPath === requestedPath || canonicalPath !== listingBasePath) {
    return false;
  }

  const pageTitles = [
    getMetaContent(html, ["og:title", "twitter:title"]),
    getTitleFromHtml(html),
  ]
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean);

  return pageTitles.some((title) => genericJobsLandingTitlePattern.test(title));
};

const remoteRequestHeaders = {
  Accept:
    "text/html,application/xhtml+xml,text/plain,text/markdown,application/json;q=0.9,*/*;q=0.1",
  "User-Agent": "JobAdviceAdminFetcher/1.0 (+https://jobadvice.in)",
};
const workdayPageRequestHeaders = {
  ...remoteRequestHeaders,
  Accept: "text/html,application/xhtml+xml,*/*;q=0.1",
};

const emptyRemoteJobDraftData = (applyLink: string): RemoteJobDraftData => ({
  title: "",
  date: "",
  company: "",
  location: "",
  workMode: "",
  employmentType: "",
  salary: "",
  experience: "",
  eligibilityCriteria: "",
  education: [],
  skills: [],
  responsibilities: [],
  workingDays: "",
  jobTiming: "",
  applyLink,
  applicationStartDate: "",
  applicationEndDate: "",
});

const toIsoDateOnly = (value: unknown) => toIsoDateString(value) || "";

const readOracleSiteName = (html: string) =>
  getMetaContent(html, ["og:site_name"]) ||
  normalizeWhitespace(
    decodeHtmlEntities(
      html.match(/siteName:\s*'([^']+)'/i)?.[1] ||
        html.match(/siteName:\s*"([^"]+)"/i)?.[1] ||
        "",
    ),
  );

const getTextLinesFromHtmlFragment = (value: string) =>
  normalizeMarkdownSource(
    decodeHtmlEntities(
      String(value || "")
        .replace(/<!--[\s\S]*?-->/g, "\n")
        .replace(/<(br|hr)\b[^>]*\/?>/gi, "\n")
        .replace(/<\/(p|div|section|article|main|aside|header|footer|nav|h1|h2|h3|h4|h5|h6)>/gi, "\n")
        .replace(/<li\b[^>]*>/gi, "\n- ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    ),
  )
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]+\s*/, "").trim())
    .filter(Boolean);

const htmlFragmentToParagraph = (value: string) =>
  dedupeList(getTextLinesFromHtmlFragment(value)).join(" ");

const htmlFragmentToList = (value: string) => dedupeList(getTextLinesFromHtmlFragment(value));

const extractHtmlSectionListItems = (html: string, heading: string) => {
  const headingPattern = escapeRegExp(heading).replace(/\s+/g, "\\s+");
  const sectionPattern = new RegExp(
    `<h[1-6]\\b[^>]*>\\s*(?:<strong>)?\\s*${headingPattern}\\s*(?:<\\/strong>)?\\s*<\\/h[1-6]>\\s*<ul\\b[^>]*>([\\s\\S]*?)<\\/ul>`,
    "i",
  );
  const sectionHtml = html.match(sectionPattern)?.[1] || "";
  return sectionHtml ? htmlFragmentToList(sectionHtml) : [];
};

const normalizeEmploymentType = (value: string) => {
  const normalizedValue = normalizeWhitespace(value).toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.includes("intern")) {
    return "Internship";
  }
  if (normalizedValue.includes("part")) {
    return "Part-time";
  }
  if (normalizedValue.includes("contract")) {
    return "Contract";
  }
  if (normalizedValue.includes("full")) {
    return "Full-time";
  }

  return value.trim();
};

const normalizeCountryCode = (value: string) => {
  const normalizedValue = normalizeWhitespace(value);
  if (!/^[a-z]{2}$/i.test(normalizedValue)) {
    return normalizedValue;
  }

  try {
    const displayName = new Intl.DisplayNames(["en"], { type: "region" }).of(
      normalizedValue.toUpperCase(),
    );
    return displayName || normalizedValue.toUpperCase();
  } catch {
    return normalizedValue.toUpperCase();
  }
};

const normalizeWorkMode = (value: string) => {
  const normalizedValue = normalizeWhitespace(value).toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.includes("remote") ||
    normalizedValue.includes("home office") ||
    normalizedValue.includes("work from home")
  ) {
    return "Remote";
  }
  if (normalizedValue.includes("hybrid")) {
    return "Hybrid";
  }
  if (normalizedValue.includes("site") || normalizedValue.includes("office")) {
    return "On-site";
  }

  return value.trim();
};

const inferWorkModeFromHtml = (html: string) => {
  if (
    /\bhybrid working\b/i.test(html) ||
    /\bstructured approach to hybrid working\b/i.test(html) ||
    /\bhybrid\b/i.test(getMetaContent(html, ["description", "og:description"]))
  ) {
    return "Hybrid";
  }

  if (/\b(remote|telecommut|work from home|home office)\b/i.test(html)) {
    return "Remote";
  }

  if (/\b(on-site|onsite|in office|office based)\b/i.test(html)) {
    return "On-site";
  }

  return "";
};

const findFirstMatchingItem = (items: string[], pattern: RegExp) =>
  items.find((item) => pattern.test(item)) || "";

const educationKeywordsPattern =
  /\b(bachelor|master|mca|b\.?tech|btech|engineering|degree|diploma|college|university|graduate|education)\b/i;
const experienceKeywordsPattern =
  /\b(fresher|entry level|\d+\s*(?:-\s*\d+)?\+?\s*(?:years?|months?))\b/i;
const microsoftEligibilityKeywordsPattern =
  /\b(bachelor|master|degree|enrolled|student|students|graduat|qualification|eligible|course|major|majoring|pursuing|must|should|require|completed|demonstrated)\b/i;
const microsoftResponsibilityKeywordsPattern =
  /\b(gain|work closely|collaborate|develop|design|build|create|implement|evaluate|estimate|support|experience core|participate|contribute)\b/i;
const microsoftBoilerplateKeywordsPattern =
  /\b(position will be open|applications accepted on an ongoing basis|position is filled)\b/i;
const microsoftSkillMatchers = [
  { skill: "Programming Languages", pattern: /\bprogramming languages?\b/i },
  { skill: "Software Development", pattern: /\bsoftware development\b/i },
  { skill: "Software Development Tools", pattern: /\bsoftware development tools?\b/i },
  { skill: "Computer Science Fundamentals", pattern: /\b(?:introduction to )?computer science\b/i },
  { skill: "Requirement Analysis", pattern: /\bevaluate requirements?\b/i },
  { skill: "Cost Estimation", pattern: /\bestimate costs?\b/i },
  { skill: "Feature Implementation", pattern: /\b(?:create and )?implement features?(?: and services)?\b/i },
  { skill: "Collaboration", pattern: /\b(?:work closely|collaborat(?:e|ion))\b/i },
  { skill: "Algorithms", pattern: /\balgorithms?\b/i },
  { skill: "Problem Solving", pattern: /\bproblem solving\b/i },
  { skill: "Python", pattern: /\bpython\b/i },
  { skill: "Java", pattern: /\bjava\b/i },
  { skill: "JavaScript", pattern: /\bjavascript\b/i },
  { skill: "TypeScript", pattern: /\btypescript\b/i },
  { skill: "C++", pattern: /\bc\+\+\b/i },
  { skill: "C#", pattern: /\bc#\b/i },
  { skill: "Go", pattern: /\bgo\b/i },
  { skill: "Rust", pattern: /\brust\b/i },
  { skill: "SQL", pattern: /\bsql\b/i },
  { skill: "React", pattern: /\breact\b/i },
  { skill: "Node.js", pattern: /\bnode(?:\.js|js)?\b/i },
  { skill: "Azure", pattern: /\bazure\b/i },
  { skill: "AWS", pattern: /\baws\b|amazon web services/i },
  { skill: "Machine Learning", pattern: /\bmachine learning\b|\bml\b/i },
  { skill: "Artificial Intelligence", pattern: /\bartificial intelligence\b|\bai\b/i },
] as const;
const workdaySectionHeadingPattern =
  /^(about us|job summary|role description|behaviors and competencies|skill level requirements|other requirements|preferred skills?)[:\s]*$/i;
const workdayResponsibilityKeywordsPattern =
  /\b(own|serve|establish|lead|plan|manage|partner|coordinate|drive|contribute|deliver|develop|execute|oversee|mentor|govern|enable)\b/i;
const workdayRequirementKeywordsPattern =
  /\b(?:years?|experience|ability|proficiency|travel|degree|required|must|knowledge|understanding|skilled|expert|office|excel|powerpoint|word|mastery|advanced|demonstrated|executive-caliber)\b/i;
const workdaySkillMatchers = [
  { skill: "Workday", pattern: /\bworkday\b/i },
  { skill: "Workday HCM", pattern: /\b(?:workday core hcm|core hcm)\b/i },
  { skill: "HRIS", pattern: /\bhris\b/i },
  { skill: "Recruiting", pattern: /\brecruiting\b/i },
  { skill: "Compensation", pattern: /\bcompensation\b/i },
  { skill: "Time Tracking", pattern: /\btime tracking\b/i },
  { skill: "Benefits", pattern: /\bbenefits\b/i },
  { skill: "Talent Management", pattern: /\btalent\b/i },
  { skill: "Learning Management", pattern: /\blearning\b/i },
  { skill: "System Integrations", pattern: /\bintegrations?\b/i },
  { skill: "Data Conversion", pattern: /\bdata conversion\b/i },
  { skill: "Reporting", pattern: /\breporting\b/i },
  { skill: "Security", pattern: /\bsecurity\b/i },
  { skill: "Change Management", pattern: /\bchange management\b/i },
  { skill: "Business Acumen", pattern: /\bbusiness acumen\b/i },
  { skill: "Strategic Planning", pattern: /\bstrategic planning\b/i },
  { skill: "Leadership", pattern: /\bleadership\b/i },
  { skill: "Communication", pattern: /\bcommunication\b/i },
  { skill: "Problem Solving", pattern: /\bproblem[- ]solving\b/i },
  { skill: "Innovation", pattern: /\binnovation\b/i },
  { skill: "Risk Management", pattern: /\brisk management\b/i },
  { skill: "Collaboration", pattern: /\bcollaboration\b/i },
  { skill: "Digital Acumen", pattern: /\bdigital acumen\b/i },
  { skill: "Agile", pattern: /\bagile\b/i },
  { skill: "Waterfall", pattern: /\bwaterfall\b/i },
  { skill: "MS Office", pattern: /\bms office\b|\boutlook\b|\bexcel\b|\bpowerpoint\b|\bword\b/i },
  { skill: "iCIMS", pattern: /\bicims\b/i },
  { skill: "Payroll", pattern: /\bpayroll\b/i },
  { skill: "Identity Management", pattern: /\bidentity\b/i },
  { skill: "Cloud Platforms", pattern: /\bcloud(?:-based)? platforms?\b|\bcloud connects?\b/i },
  { skill: "Cybersecurity", pattern: /\bcybersecurity\b|\bdigital attacks\b/i },
] as const;
const genericJobPostingSectionHeadingPattern =
  /^(about (?:the )?role|about us|overview|summary|job summary|role summary|role description|responsibilities|responsibility|requirements|required qualifications|preferred qualifications|qualifications|skills?|what you(?:'ll| will) do|what we're looking for|who you are|purpose of the role|accountabilities|assistant vice president expectations|additional relevant skills(?: given below are highly valued)?|to be a successful .+?, you should have experience with)[:\s-]*$/i;
const genericJobPostingResponsibilityKeywordsPattern =
  /\b(deliver|ensure|collaborat(?:e|ion)|participate|implement(?:ation)?|manage|oversee|own|define|lead|advise|influence|mitigate|review|coordinate|drive|contribute|test|optimi[sz]e|adherence|stay informed|communicat)\b/i;
const genericJobPostingEligibilityKeywordsPattern =
  /\b(required?|preferred|qualification|degree|experience|knowledge|understanding|proficiency|skill|ability|eligible|must|should|familiarity|familiar|exposure|fundamentals|hands?-on|strong)\b/i;
const genericJobPostingSkillMatchers = [
  { skill: "Software Development", pattern: /\bsoftware development\b/i },
  { skill: "Programming Languages", pattern: /\bprogramming languages?\b/i },
  { skill: "Problem Solving", pattern: /\bproblem[- ]solving\b/i },
  { skill: "Communication", pattern: /\bcommunication\b/i },
  { skill: "Collaboration", pattern: /\bcollaborat(?:e|ion)\b/i },
  { skill: "Risk Management", pattern: /\brisk management\b/i },
  { skill: "Business Acumen", pattern: /\bbusiness acumen\b/i },
  { skill: "Strategic Thinking", pattern: /\bstrategic thinking\b/i },
  { skill: "Angular", pattern: /\bangular(?:\s*js)?\b/i },
  { skill: "React", pattern: /\breact\b/i },
  { skill: "React Native", pattern: /\breact native\b/i },
  { skill: "Java", pattern: /\bjava\b/i },
  { skill: "JavaScript", pattern: /\bjavascript\b/i },
  { skill: "TypeScript", pattern: /\btypescript\b/i },
  { skill: "Python", pattern: /\bpython\b/i },
  { skill: "C++", pattern: /\bc\+\+\b/i },
  { skill: "C#", pattern: /\bc#\b/i },
  { skill: "J2EE", pattern: /\bj2ee\b/i },
  { skill: "REST APIs", pattern: /\b(?:rest|webservice)\b/i },
  { skill: "Spring", pattern: /\bspring\b/i },
  { skill: "JDBC", pattern: /\bjdbc\b/i },
  { skill: "SQL", pattern: /\bsql\b/i },
  { skill: "Oracle", pattern: /\boracle\b/i },
  { skill: "HTML5", pattern: /\bhtml5\b/i },
  { skill: "CSS3", pattern: /\bcss3\b/i },
  { skill: "AWS", pattern: /\baws\b|amazon web services/i },
  { skill: "Azure", pattern: /\bazure\b/i },
  { skill: "JBoss", pattern: /\bjboss\b/i },
  { skill: "Hibernate", pattern: /\bhibernate\b/i },
  { skill: "Linux", pattern: /\blinux\b/i },
  { skill: "UNIX", pattern: /\bunix\b/i },
  { skill: "Docker", pattern: /\bdocker\b/i },
  { skill: "Kubernetes", pattern: /\bkubernetes\b/i },
  { skill: "CI/CD", pattern: /\bci\/cd\b|\bcontinuous integration\b|\bcontinuous delivery\b/i },
  { skill: "Cryptography", pattern: /\bcryptograph\w*\b/i },
  { skill: "NoSQL", pattern: /\bnosql\b/i },
  { skill: "Data Modeling", pattern: /\bdata modelling\b|\bdata modeling\b/i },
  { skill: "Design Patterns", pattern: /\bdesign patterns?\b/i },
  { skill: "Object-Oriented Design", pattern: /\boo designing\b|\bobject oriented\b/i },
  { skill: "Frontend Development", pattern: /\bfrontend technologies?\b|\bui development\b/i },
  { skill: "Performance Tuning", pattern: /\bperformance tuning\b/i },
  { skill: "Unit Testing", pattern: /\bunit testing\b/i },
  { skill: "Secure Coding", pattern: /\bsecure coding\b/i },
  { skill: "Code Review", pattern: /\bcode reviews?\b/i },
  { skill: "Banking Applications", pattern: /\bbanking applications?\b/i },
] as const;

const splitIntoSentences = (value: string) => {
  const normalizedValue = normalizeWhitespace(value);
  if (!normalizedValue) {
    return [] as string[];
  }

  const coarseSentences = normalizedValue
    .replace(/([.!?])\s+(?=[A-Z0-9*])/g, "$1\n")
    .split("\n")
    .flatMap((sentence) =>
      sentence.split(
        /\s+(?=(?:Enrolled in|Completed|Demonstrated|Currently|Must have|Must be|Should have|Ability to|Eligible to|Pursuing|Majoring in)\b)/g,
      ),
    )
    .map((sentence) => sentence.replace(/\s*\*+\s*$/, "").trim())
    .filter(Boolean);

  return dedupeList(coarseSentences);
};

const extractMicrosoftDescriptionSkills = (title: string, description: string) => {
  const searchableText = `${title}\n${description}`;
  const matchedSkills = microsoftSkillMatchers
    .filter((matcher) => matcher.pattern.test(searchableText))
    .map((matcher) => matcher.skill);

  return dedupeList(matchedSkills).slice(0, 20);
};

const extractSalaryFromText = (value: string) => {
  const normalizedValue = normalizeWhitespace(value);
  if (!normalizedValue) {
    return "";
  }

  const contextualRangeMatch = normalizedValue.match(
    /(?:estimated\s+(?:annual|monthly|hourly)\s+pay\s+range|pay\s+range|salary|compensation)[^$]{0,80}(\$\s?\d[\d,]*(?:\s*-\s*\$?\s?\d[\d,]*)+)/i,
  );
  if (contextualRangeMatch?.[1]) {
    return normalizeWhitespace(contextualRangeMatch[1].replace(/\$\s+/g, "$"));
  }

  const nearbyRangeMatch = normalizedValue.match(
    /(\$\s?\d[\d,]*\s*-\s*\$?\s?\d[\d,]*)(?=[^$]{0,80}\b(?:salary|compensation|benefits|position|annual|year)\b)/i,
  );

  return nearbyRangeMatch?.[1] ? normalizeWhitespace(nearbyRangeMatch[1].replace(/\$\s+/g, "$")) : "";
};

const extractWorkdayDescriptionSkills = (
  title: string,
  description: string,
  descriptionItems: string[],
) => {
  const searchableText = `${title}\n${description}\n${descriptionItems.join("\n")}`;
  const labeledSkills = descriptionItems
    .map((item) => {
      const match = normalizeWhitespace(item).match(/^([A-Z][A-Za-z/& -]{1,60}):\s+/);
      const candidate = normalizeWhitespace(match?.[1] || "").replace(/[:\s]+$/g, "");
      return candidate && candidate.split(/\s+/g).length <= 5 ? candidate : "";
    })
    .filter(Boolean);
  const matchedSkills = workdaySkillMatchers
    .filter((matcher) => matcher.pattern.test(searchableText))
    .map((matcher) => matcher.skill);

  return dedupeList([...labeledSkills, ...matchedSkills]).slice(0, 25);
};

const extractGenericDescriptionSkills = (
  title: string,
  description: string,
  descriptionItems: string[],
) => {
  const searchableText = `${title}\n${description}\n${descriptionItems.join("\n")}`;
  const matchedSkills = genericJobPostingSkillMatchers
    .filter((matcher) => matcher.pattern.test(searchableText))
    .map((matcher) => matcher.skill);

  return dedupeList(matchedSkills).slice(0, 25);
};

const buildOracleJobSourceText = (
  sourceUrl: string,
  resolvedUrl: string,
  company: string,
  jobData: RemoteJobDraftData,
  details: Record<string, unknown>,
) => {
  const lines: string[] = [];

  appendLabeledLine(lines, "Source URL", sourceUrl);
  if (resolvedUrl && resolvedUrl !== sourceUrl) {
    appendLabeledLine(lines, "Resolved URL", resolvedUrl);
  }
  appendLabeledLine(lines, "Company", company);
  appendLabeledLine(lines, "Job Title", jobData.title);
  appendLabeledLine(lines, "Category", toTextValue(details.Category));
  appendLabeledLine(lines, "Job Function", toTextValue(details.JobFunction));
  appendLabeledLine(lines, "Location", jobData.location);
  appendLabeledLine(lines, "Work Mode", jobData.workMode);
  appendLabeledLine(lines, "Employment Type", jobData.employmentType);
  appendLabeledLine(lines, "Experience Required", jobData.experience);
  appendLabeledLine(
    lines,
    "Description",
    htmlFragmentToParagraph(String(details.ExternalDescriptionStr || "")),
  );
  appendLabeledLine(lines, "Summary", toTextValue(details.ShortDescriptionStr));
  appendLabeledLine(lines, "Eligibility Criteria", jobData.eligibilityCriteria);
  appendLabeledList(lines, "Education", jobData.education);
  appendLabeledList(lines, "Skills", jobData.skills);
  appendLabeledList(lines, "Roles & Responsibilities", jobData.responsibilities);
  appendLabeledLine(lines, "Working Days", jobData.workingDays);
  appendLabeledLine(lines, "Job Timing", jobData.jobTiming);
  appendLabeledLine(lines, "Apply Link", jobData.applyLink);
  appendLabeledLine(lines, "Date", jobData.date);
  appendLabeledLine(lines, "Application Start Date", jobData.applicationStartDate);
  appendLabeledLine(lines, "Application End Date", jobData.applicationEndDate);

  return normalizeMarkdownSource(lines.join("\n")).trim();
};

const buildMicrosoftJobSourceText = (
  sourceUrl: string,
  resolvedUrl: string,
  jobData: RemoteJobDraftData,
  description: string,
) => {
  const lines: string[] = [];

  appendLabeledLine(lines, "Source URL", sourceUrl);
  if (resolvedUrl && resolvedUrl !== sourceUrl) {
    appendLabeledLine(lines, "Resolved URL", resolvedUrl);
  }
  appendLabeledLine(lines, "Company", jobData.company);
  appendLabeledLine(lines, "Job Title", jobData.title);
  appendLabeledLine(lines, "Location", jobData.location);
  appendLabeledLine(lines, "Work Mode", jobData.workMode);
  appendLabeledLine(lines, "Employment Type", jobData.employmentType);
  appendLabeledLine(lines, "Experience Required", jobData.experience);
  appendLabeledLine(lines, "Description", description);
  appendLabeledLine(lines, "Eligibility Criteria", jobData.eligibilityCriteria);
  appendLabeledList(lines, "Education", jobData.education);
  appendLabeledList(lines, "Skills", jobData.skills);
  appendLabeledList(lines, "Roles & Responsibilities", jobData.responsibilities);
  appendLabeledLine(lines, "Apply Link", jobData.applyLink);
  appendLabeledLine(lines, "Date", jobData.date);
  appendLabeledLine(lines, "Application Start Date", jobData.applicationStartDate);
  appendLabeledLine(lines, "Application End Date", jobData.applicationEndDate);

  return normalizeMarkdownSource(lines.join("\n")).trim();
};

const buildWorkdayJobSourceText = (
  sourceUrl: string,
  resolvedUrl: string,
  jobData: RemoteJobDraftData,
  details: Record<string, unknown>,
) => {
  const lines: string[] = [];
  const jobPostingInfo = (details.jobPostingInfo as Record<string, unknown> | undefined) || {};
  const description = htmlFragmentToParagraph(String(jobPostingInfo.jobDescription || ""));

  appendLabeledLine(lines, "Source URL", sourceUrl);
  if (resolvedUrl && resolvedUrl !== sourceUrl) {
    appendLabeledLine(lines, "Resolved URL", resolvedUrl);
  }
  appendLabeledLine(lines, "Company", jobData.company);
  appendLabeledLine(lines, "Job Title", jobData.title);
  appendLabeledLine(lines, "Job Requisition ID", toTextValue(jobPostingInfo.jobReqId));
  appendLabeledLine(lines, "Location", jobData.location);
  appendLabeledLine(lines, "Work Mode", jobData.workMode);
  appendLabeledLine(lines, "Employment Type", jobData.employmentType);
  appendLabeledLine(lines, "Salary", jobData.salary);
  appendLabeledLine(lines, "Experience Required", jobData.experience);
  appendLabeledLine(lines, "Description", description);
  appendLabeledLine(lines, "Eligibility Criteria", jobData.eligibilityCriteria);
  appendLabeledList(lines, "Education", jobData.education);
  appendLabeledList(lines, "Skills", jobData.skills);
  appendLabeledList(lines, "Roles & Responsibilities", jobData.responsibilities);
  appendLabeledLine(lines, "Apply Link", jobData.applyLink);
  appendLabeledLine(lines, "Date", jobData.date);
  appendLabeledLine(lines, "Application Start Date", jobData.applicationStartDate);
  appendLabeledLine(lines, "Application End Date", jobData.applicationEndDate);

  return normalizeMarkdownSource(lines.join("\n")).trim();
};

const buildStructuredJobPostingSourceText = (
  sourceUrl: string,
  resolvedUrl: string,
  jobData: RemoteJobDraftData,
  description: string,
) => {
  const lines: string[] = [];

  appendLabeledLine(lines, "Source URL", sourceUrl);
  if (resolvedUrl && resolvedUrl !== sourceUrl) {
    appendLabeledLine(lines, "Resolved URL", resolvedUrl);
  }
  appendLabeledLine(lines, "Company", jobData.company);
  appendLabeledLine(lines, "Job Title", jobData.title);
  appendLabeledLine(lines, "Location", jobData.location);
  appendLabeledLine(lines, "Work Mode", jobData.workMode);
  appendLabeledLine(lines, "Employment Type", jobData.employmentType);
  appendLabeledLine(lines, "Salary", jobData.salary);
  appendLabeledLine(lines, "Experience Required", jobData.experience);
  appendLabeledLine(lines, "Description", description);
  appendLabeledLine(lines, "Eligibility Criteria", jobData.eligibilityCriteria);
  appendLabeledList(lines, "Education", jobData.education);
  appendLabeledList(lines, "Skills", jobData.skills);
  appendLabeledList(lines, "Roles & Responsibilities", jobData.responsibilities);
  appendLabeledLine(lines, "Apply Link", jobData.applyLink);
  appendLabeledLine(lines, "Date", jobData.date);
  appendLabeledLine(lines, "Application Start Date", jobData.applicationStartDate);
  appendLabeledLine(lines, "Application End Date", jobData.applicationEndDate);

  return normalizeMarkdownSource(lines.join("\n")).trim();
};

const readOracleJobIdFromUrl = (parsedUrl: URL) => {
  const routeValue = `${parsedUrl.pathname}${parsedUrl.hash}`;
  const match = routeValue.match(/\/(?:job|jobs|requisitions)\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]).trim() : "";
};

const isDevsUniteJobUrl = (parsedUrl: URL) =>
  /(?:^|\.)devsunite\.com$/i.test(parsedUrl.hostname) && /^\/jobs\/[^/?#]+/i.test(parsedUrl.pathname);

const extractNextFlightChunks = (html: string) => {
  const chunks: string[] = [];
  const scriptPattern =
    /<script\b[^>]*>\s*self\.__next_f\.push\(\[\d+,"([\s\S]*?)"\]\)\s*<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const encodedChunk = match[1] || "";
    if (!encodedChunk) {
      continue;
    }

    try {
      chunks.push(JSON.parse(`"${encodedChunk}"`) as string);
    } catch {
      continue;
    }
  }

  return chunks;
};

const extractBalancedJsonObject = (value: string, startIndex: number) => {
  if (startIndex < 0 || value[startIndex] !== "{") {
    return "";
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < value.length; index += 1) {
    const character = value[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return value.slice(startIndex, index + 1);
      }
    }
  }

  return "";
};

const extractEmbeddedJobRecordFromNextFlight = (html: string) => {
  const chunks = extractNextFlightChunks(html);

  for (const chunk of chunks) {
    const jobMarkerIndex = chunk.indexOf('"job":{');
    if (jobMarkerIndex < 0) {
      continue;
    }

    const objectStartIndex = chunk.indexOf("{", jobMarkerIndex + 5);
    const objectText = extractBalancedJsonObject(chunk, objectStartIndex);
    if (!objectText) {
      continue;
    }

    try {
      return {
        jobRecord: JSON.parse(objectText) as Record<string, unknown>,
        flightChunks: chunks,
      };
    } catch {
      continue;
    }
  }

  return {
    jobRecord: null,
    flightChunks: chunks,
  };
};

const resolveNextFlightTextReference = (chunks: string[], value: string) => {
  const normalizedValue = String(value || "").trim();
  const referenceId = normalizedValue.match(/^\$([0-9a-z]+)$/i)?.[1];
  if (!referenceId) {
    return normalizedValue;
  }

  const joinedChunks = chunks.join("\n");
  const referencePattern = new RegExp(
    `(?:^|\\n)${escapeRegExp(referenceId)}:T[0-9a-f]+,([\\s\\S]*?)(?=\\n[0-9a-z]+:|$)`,
    "i",
  );
  const resolvedValue = joinedChunks.match(referencePattern)?.[1] || "";

  return resolvedValue.trim();
};

const normalizeIpv4Octets = (value: string) =>
  value
    .split(".")
    .map((octet) => Number.parseInt(octet, 10))
    .filter((octet) => Number.isInteger(octet));

const isReservedIpv4Address = (value: string) => {
  const octets = normalizeIpv4Octets(value);
  if (octets.length !== 4) {
    return false;
  }

  const [first, second, third] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 88 && third === 99) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
};

const isReservedIpv6Address = (value: string) => {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue === "::" ||
    normalizedValue === "::1" ||
    normalizedValue.startsWith("fc") ||
    normalizedValue.startsWith("fd") ||
    normalizedValue.startsWith("fe8") ||
    normalizedValue.startsWith("fe9") ||
    normalizedValue.startsWith("fea") ||
    normalizedValue.startsWith("feb") ||
    normalizedValue.startsWith("ff") ||
    normalizedValue.startsWith("2001:db8:")
  ) {
    return true;
  }

  const mappedIpv4Match = normalizedValue.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedIpv4Match?.[1]) {
    return isReservedIpv4Address(mappedIpv4Match[1]);
  }

  return false;
};

const isReservedIpAddress = (value: string) => {
  const ipVersion = isIP(value);
  if (ipVersion === 4) {
    return isReservedIpv4Address(value);
  }

  if (ipVersion === 6) {
    return isReservedIpv6Address(value);
  }

  return false;
};

const assertSafeRemoteUrl = async (parsedUrl: URL) => {
  const hostname = parsedUrl.hostname.trim().toLowerCase();

  if (!hostname) {
    throw new Error("Remote source URL must include a hostname");
  }

  if (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Remote source URL must point to a public website");
  }

  if (isReservedIpAddress(hostname)) {
    throw new Error("Remote source URL must not use a private or reserved IP address");
  }

  const resolvedAddresses = await lookup(hostname, { all: true, verbatim: true });
  if (resolvedAddresses.length === 0) {
    throw new Error("Unable to resolve the remote source hostname");
  }

  for (const resolvedAddress of resolvedAddresses) {
    if (isReservedIpAddress(resolvedAddress.address)) {
      throw new Error("Remote source hostname resolves to a private or reserved IP address");
    }
  }
};

const readResponseTextWithinLimit = async (response: Response) => {
  if (!response.body) {
    const textValue = await response.text();
    if (Buffer.byteLength(textValue, "utf8") > maxRemoteResponseBytes) {
      throw new Error("Remote source is too large to process");
    }
    return textValue;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let textValue = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxRemoteResponseBytes) {
      await reader.cancel("Remote source too large");
      throw new Error("Remote source is too large to process");
    }

    textValue += decoder.decode(value, { stream: true });
  }

  textValue += decoder.decode();
  return textValue;
};

const extractJobLocationStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return dedupeList(value.flatMap((item) => extractJobLocationStrings(item)));
  }

  if (!value || typeof value !== "object") {
    return toStringList(value);
  }

  const record = value as Record<string, unknown>;
  const address = record.address as Record<string, unknown> | undefined;
  const locationParts = [
    toTextValue(record.name),
    address ? toTextValue(address.streetAddress) : "",
    address ? toTextValue(address.addressLocality) : "",
    address ? toTextValue(address.addressRegion) : "",
    address ? toTextValue(address.postalCode) : "",
    address ? normalizeCountryCode(toTextValue(address.addressCountry)) : "",
  ].filter(Boolean);

  if (locationParts.length > 0) {
    return [locationParts.join(", ")];
  }

  return dedupeList(
    [toTextValue(record.address), toTextValue(record.location), toTextValue(record.value)].filter(
      Boolean,
    ),
  );
};

const extractSalaryText = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    return normalizeWhitespace(String(value));
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;
  const currency = toTextValue(record.currency);
  const unitText = toTextValue(record.unitText);
  const rawValue = record.value;

  if (typeof rawValue === "number" || typeof rawValue === "string") {
    const salaryParts = [String(rawValue), currency, unitText].filter(Boolean);
    return normalizeWhitespace(salaryParts.join(" "));
  }

  if (rawValue && typeof rawValue === "object") {
    const rawValueRecord = rawValue as Record<string, unknown>;
    const minValue = toTextValue(rawValueRecord.minValue);
    const maxValue = toTextValue(rawValueRecord.maxValue);
    const exactValue = toTextValue(rawValueRecord.value);
    const rangeValue =
      minValue && maxValue ? `${minValue} - ${maxValue}` : exactValue || minValue || maxValue;
    const salaryParts = [
      rangeValue,
      currency || toTextValue(rawValueRecord.currency),
      unitText || toTextValue(rawValueRecord.unitText),
    ].filter(Boolean);

    return normalizeWhitespace(salaryParts.join(" "));
  }

  return "";
};

const toObjectRecords = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toObjectRecords(item));
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [];
};

const getTypeList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeWhitespace(String(item || "")).toLowerCase())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return [normalizeWhitespace(value).toLowerCase()];
  }

  return [] as string[];
};

const findJobPostingNodes = (value: unknown): Record<string, unknown>[] => {
  const records = toObjectRecords(value);
  const matches: Record<string, unknown>[] = [];

  for (const record of records) {
    const typeList = getTypeList(record["@type"]);
    if (typeList.some((typeValue) => typeValue === "jobposting")) {
      matches.push(record);
    }

    if (record["@graph"]) {
      matches.push(...findJobPostingNodes(record["@graph"]));
    }
  }

  return matches;
};

const cleanJsonLdSource = (value: string) =>
  value
    .trim()
    .replace(/^<!--/, "")
    .replace(/-->$/, "")
    .replace(/^\s*\/\/<!\[CDATA\[/, "")
    .replace(/\/\/\]\]>\s*$/, "")
    .trim();

const extractJsonLdBlocks = (html: string) => {
  const blocks: string[] = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const attributes = match[1] || "";
    const scriptBody = match[2] || "";
    const typeValue = readHtmlAttribute(attributes, "type").toLowerCase();

    if (typeValue !== "application/ld+json") {
      continue;
    }

    const cleanedBlock = cleanJsonLdSource(scriptBody);
    if (cleanedBlock) {
      blocks.push(cleanedBlock);
    }
  }

  return blocks;
};

const extractJobPostingNodesFromHtml = (html: string) => {
  const nodes: Record<string, unknown>[] = [];

  for (const block of extractJsonLdBlocks(html)) {
    try {
      const parsedBlock = JSON.parse(block) as unknown;
      nodes.push(...findJobPostingNodes(parsedBlock));
    } catch {
      continue;
    }
  }

  return nodes;
};

const buildJobPostingSummary = (jobPostingNode: Record<string, unknown>, fallbackUrl: string) => {
  const lines: string[] = [];

  appendLabeledLine(lines, "Job Title", toTextValue(jobPostingNode.title));

  const organizationName = toTextValue(
    (jobPostingNode.hiringOrganization as Record<string, unknown> | undefined)?.name ||
      (jobPostingNode.organization as Record<string, unknown> | undefined)?.name,
  );
  appendLabeledLine(lines, "Company", organizationName);

  const workMode = toTextValue(jobPostingNode.jobLocationType);
  if (workMode && /telecommute|remote/i.test(workMode)) {
    appendLabeledLine(lines, "Work Mode", "Remote");
  } else {
    appendLabeledLine(lines, "Work Mode", workMode);
  }

  appendLabeledLine(
    lines,
    "Location",
    dedupeList(
      extractJobLocationStrings(jobPostingNode.jobLocation).concat(
        extractJobLocationStrings(jobPostingNode.applicantLocationRequirements),
      ),
    ).join(" | "),
  );

  appendLabeledList(lines, "Employment Type", toStringList(jobPostingNode.employmentType));
  appendLabeledLine(lines, "Salary", extractSalaryText(jobPostingNode.baseSalary));
  appendLabeledLine(lines, "Experience", toTextValue(jobPostingNode.experienceRequirements));
  appendLabeledLine(lines, "Date", toTextValue(jobPostingNode.datePosted));
  appendLabeledLine(lines, "Application End Date", toTextValue(jobPostingNode.validThrough));
  appendLabeledLine(
    lines,
    "Apply Link",
    toTextValue(jobPostingNode.url) || fallbackUrl,
  );
  appendLabeledLine(lines, "Eligibility Criteria", toTextValue(jobPostingNode.qualifications));
  appendLabeledLine(lines, "Education", toTextValue(jobPostingNode.educationRequirements));
  appendLabeledList(lines, "Skills", toStringList(jobPostingNode.skills));
  appendLabeledList(lines, "Responsibilities", toStringList(jobPostingNode.responsibilities));
  appendLabeledLine(lines, "Description", toTextValue(jobPostingNode.description));

  return normalizeMarkdownSource(lines.join("\n")).trim();
};

const extractStructuredJobSections = (html: string, fallbackUrl: string) => {
  const sections = new Set<string>();

  for (const jobPostingNode of extractJobPostingNodesFromHtml(html)) {
    const summary = buildJobPostingSummary(jobPostingNode, fallbackUrl);
    if (summary) {
      sections.add(summary);
    }
  }

  return Array.from(sections);
};

const extractPreferredContentHtml = (html: string) => {
  const preferredMatch = html.match(/<(main|article)\b[^>]*>([\s\S]*?)<\/\1>/i);
  if (!preferredMatch?.[2]) {
    return html;
  }

  const preferredHtml = preferredMatch[2].trim();
  return preferredHtml.length >= 300 ? preferredHtml : html;
};

const htmlToText = (html: string) => {
  const contentHtml = extractPreferredContentHtml(html);

  return normalizeMarkdownSource(
    decodeHtmlEntities(
      contentHtml
        .replace(/<!--[\s\S]*?-->/g, "\n")
        .replace(/<script\b[\s\S]*?<\/script>/gi, "\n")
        .replace(/<style\b[\s\S]*?<\/style>/gi, "\n")
        .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "\n")
        .replace(/<svg\b[\s\S]*?<\/svg>/gi, "\n")
        .replace(/<(br|hr)\b[^>]*\/?>/gi, "\n")
        .replace(/<\/(p|div|section|article|main|aside|header|footer|nav|h1|h2|h3|h4|h5|h6)>/gi, "\n")
        .replace(/<li\b[^>]*>/gi, "\n- ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<(td|th)\b[^>]*>/gi, " | ")
        .replace(/<\/(td|th)>/gi, " ")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    )
      .split("\n")
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean)
      .filter((line, index, lines) => line !== lines[index - 1])
      .join("\n"),
  ).trim();
};

const jsonToText = (jsonSource: string) => {
  try {
    const parsedValue = JSON.parse(jsonSource) as unknown;
    return clipText(normalizeMarkdownSource(JSON.stringify(parsedValue, null, 2)), defaultMaxSourceChars);
  } catch {
    return normalizeMarkdownSource(jsonSource);
  }
};

const buildHtmlSourceText = (
  html: string,
  sourceUrl: string,
  resolvedUrl: string,
  maxChars: number,
) => {
  const title = getTitleFromHtml(html);
  const metaDescription =
    getMetaContent(html, ["description", "og:description", "twitter:description"]) || "";
  const structuredJobSections = extractStructuredJobSections(html, resolvedUrl || sourceUrl);
  const pageText = htmlToText(html);
  const sections: string[] = [];

  appendLabeledLine(sections, "Source URL", sourceUrl);
  if (resolvedUrl && resolvedUrl !== sourceUrl) {
    appendLabeledLine(sections, "Resolved URL", resolvedUrl);
  }
  appendLabeledLine(sections, "Page Title", title);
  appendLabeledLine(sections, "Meta Description", metaDescription);

  if (structuredJobSections.length > 0) {
    sections.push("Structured Data:");
    sections.push(structuredJobSections.join("\n\n"));
  }

  if (pageText) {
    sections.push("Page Content:");
    sections.push(pageText);
  }

  return clipText(normalizeMarkdownSource(sections.join("\n\n")), maxChars);
};

const toMimeType = (contentTypeHeader: string | null) =>
  String(contentTypeHeader || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

const normalizeRemoteUrl = (value: string) => {
  const parsedUrl = new URL(String(value || "").trim());
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Remote source URL must use http:// or https://");
  }

  return parsedUrl;
};

const isRedirectStatus = (status: number) =>
  status === 301 || status === 302 || status === 303 || status === 307 || status === 308;

const fetchFollowingSafeRedirects = async (initialUrl: URL, signal: AbortSignal) => {
  let currentUrl = initialUrl;
  let cookieHeader = "";

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertSafeRemoteUrl(currentUrl);
    const requestHeaders = isWorkdayCareersJobUrl(currentUrl)
      ? workdayPageRequestHeaders
      : remoteRequestHeaders;

    const response = await fetch(currentUrl.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal,
      headers: {
        ...requestHeaders,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    cookieHeader = mergeCookieHeader(cookieHeader, readResponseSetCookieHeaders(response));

    if (!isRedirectStatus(response.status)) {
      return {
        response,
        finalUrl: currentUrl.toString(),
        cookieHeader,
      };
    }

    const locationHeader = response.headers.get("location");
    if (!locationHeader) {
      throw new Error(`Remote source redirected without a location header (${response.status})`);
    }

    currentUrl = new URL(locationHeader, currentUrl);
  }

  throw new Error("Remote source redirected too many times");
};

const isOracleCandidateExperienceJobUrl = (parsedUrl: URL) =>
  /\.oraclecloud\.com$/i.test(parsedUrl.hostname) &&
  /\/hcmUI\/CandidateExperience\//i.test(parsedUrl.pathname) &&
  Boolean(readOracleJobIdFromUrl(parsedUrl));

const isMicrosoftCareersJobUrl = (parsedUrl: URL) =>
  /^apply\.careers\.microsoft\.com$/i.test(parsedUrl.hostname) &&
  /\/careers\/job\//i.test(parsedUrl.pathname);

const isWorkdayCareersJobUrl = (parsedUrl: URL) =>
  /(?:^|\.)myworkdayjobs\.com$/i.test(parsedUrl.hostname) && /\/job\//i.test(parsedUrl.pathname);

const isLinkedInActivityUrl = (parsedUrl: URL) =>
  /(?:^|\.)linkedin\.com$/i.test(parsedUrl.hostname) &&
  (/^\/feed\/update\//i.test(parsedUrl.pathname) ||
    /^\/posts\//i.test(parsedUrl.pathname) ||
    /\/activity[:/-]/i.test(parsedUrl.pathname));

const isFounditRegistrationWrapperUrl = (parsedUrl: URL) =>
  /(?:^|\.)foundit\.[a-z.]+$/i.test(parsedUrl.hostname) &&
  /^\/seeker-profile\/single-page-registration\/?$/i.test(parsedUrl.pathname);

const readWorkdayPostingSlugFromUrl = (parsedUrl: URL) => {
  const pathSegments = parsedUrl.pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment.trim()))
    .filter(Boolean);
  const jobSegmentIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === "job");
  if (jobSegmentIndex < 0) {
    return "";
  }

  const postingSegments = pathSegments.slice(jobSegmentIndex + 1);
  if (postingSegments.length === 0) {
    return "";
  }

  const applySegmentIndex = postingSegments.findIndex((segment) => /^apply$/i.test(segment));
  const routeSegments =
    applySegmentIndex >= 0 ? postingSegments.slice(0, applySegmentIndex) : postingSegments;

  return normalizeWhitespace(routeSegments[routeSegments.length - 1] || "");
};

const readWorkdayBootstrapBlock = (html: string) =>
  html.match(/window\.workday\s*=\s*window\.workday\s*\|\|\s*\{([\s\S]*?)\};/i)?.[1] || "";

const readWorkdayBootstrapString = (bootstrapBlock: string, key: string) =>
  normalizeWhitespace(
    decodeHtmlEntities(
      bootstrapBlock.match(new RegExp(`${key}\\s*:\\s*"([^"]*)"`, "i"))?.[1] ||
        bootstrapBlock.match(new RegExp(`${key}\\s*:\\s*'([^']*)'`, "i"))?.[1] ||
        "",
    ),
  );

const readWorkdayBootstrapBoolean = (bootstrapBlock: string, key: string) => {
  const rawValue = bootstrapBlock.match(new RegExp(`${key}\\s*:\\s*(true|false)\\b`, "i"))?.[1];
  if (!rawValue) {
    return null;
  }

  return rawValue.toLowerCase() === "true";
};

const fetchOracleJobDetails = async (apiUrl: URL, signal: AbortSignal) => {
  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    signal,
    headers: {
      ...remoteRequestHeaders,
      Accept: "application/json,*/*;q=0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`Oracle job details request failed (${response.status})`);
  }

  const responseText = await readResponseTextWithinLimit(response);
  return JSON.parse(responseText) as Record<string, unknown>;
};

const fetchWorkdayJobDetails = async (
  apiUrl: URL,
  options: {
    cookieHeader: string;
    locale: string;
    signal: AbortSignal;
    token: string;
  },
) => {
  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    signal: options.signal,
    headers: {
      ...remoteRequestHeaders,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Language": options.locale || "en-US",
      "X-CALYPSO-CSRF-TOKEN": options.token,
      ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Workday job details request failed (${response.status})`);
  }

  const responseText = await readResponseTextWithinLimit(response);
  return JSON.parse(responseText) as Record<string, unknown>;
};

const maybeFetchWorkdayCareersSource = async (
  pageHtml: string,
  sourceUrl: string,
  resolvedUrl: string,
  cookieHeader: string,
  signal: AbortSignal,
  maxChars: number,
): Promise<RemoteSourceTextResult | null> => {
  const resolvedParsedUrl = new URL(resolvedUrl);
  if (!isWorkdayCareersJobUrl(resolvedParsedUrl)) {
    return null;
  }

  const postingSlug = readWorkdayPostingSlugFromUrl(resolvedParsedUrl);
  const bootstrapBlock = readWorkdayBootstrapBlock(pageHtml);
  const tenant = readWorkdayBootstrapString(bootstrapBlock, "tenant");
  const siteId = readWorkdayBootstrapString(bootstrapBlock, "siteId");
  const locale =
    readWorkdayBootstrapString(bootstrapBlock, "locale") ||
    readHtmlAttribute(pageHtml.match(/<html\b[^>]*>/i)?.[0] || "", "lang") ||
    "en-US";
  const token = readWorkdayBootstrapString(bootstrapBlock, "token");
  const postingAvailable = readWorkdayBootstrapBoolean(bootstrapBlock, "postingAvailable");

  if (!postingSlug || !tenant || !siteId || !token) {
    return null;
  }

  if (postingAvailable === false) {
    throw new Error("Workday job posting is not publicly available or has expired");
  }

  const apiUrl = new URL(
    `/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(siteId)}/job/${encodeURIComponent(postingSlug)}`,
    `${resolvedParsedUrl.protocol}//${resolvedParsedUrl.host}`,
  );
  await assertSafeRemoteUrl(apiUrl);

  const details = await fetchWorkdayJobDetails(apiUrl, {
    cookieHeader,
    locale,
    signal,
    token,
  });
  const jobPostingInfo = (details.jobPostingInfo as Record<string, unknown> | undefined) || {};
  const title = toTextValue(jobPostingInfo.title);
  if (!title) {
    return null;
  }

  const descriptionHtml = String(jobPostingInfo.jobDescription || "");
  const descriptionText = htmlFragmentToParagraph(descriptionHtml);
  const descriptionItems = htmlFragmentToList(descriptionHtml).filter(
    (item) => !workdaySectionHeadingPattern.test(item),
  );
  const descriptionSentences = splitIntoSentences(descriptionText);
  const responsibilities = dedupeList(
    descriptionItems
      .filter((item) => workdayResponsibilityKeywordsPattern.test(item))
      .concat(
        descriptionSentences.filter((sentence) => workdayResponsibilityKeywordsPattern.test(sentence)),
      ),
  ).slice(0, 25);
  const eligibilityItems = dedupeList(
    descriptionItems
      .filter(
        (item) =>
          !workdayResponsibilityKeywordsPattern.test(item) &&
          (workdayRequirementKeywordsPattern.test(item) ||
            educationKeywordsPattern.test(item) ||
            experienceKeywordsPattern.test(item)),
      )
      .concat(
        descriptionSentences.filter(
          (sentence) =>
            !workdayResponsibilityKeywordsPattern.test(sentence) &&
            (workdayRequirementKeywordsPattern.test(sentence) ||
              educationKeywordsPattern.test(sentence) ||
              experienceKeywordsPattern.test(sentence)),
        ),
      ),
  );
  const education = eligibilityItems.filter((item) => educationKeywordsPattern.test(item));
  const company =
    toTextValue((details.hiringOrganization as Record<string, unknown> | undefined)?.name) ||
    getMetaContent(pageHtml, ["og:site_name"]) ||
    getTitleFromHtml(pageHtml);
  const location = dedupeList(
    [toTextValue(jobPostingInfo.location)].concat(toStringList(jobPostingInfo.additionalLocations)),
  ).join(" | ");
  const inferredWorkModeSource =
    toTextValue(jobPostingInfo.remoteType) ||
    findFirstMatchingItem(
      [location].concat(descriptionSentences),
      /\b(remote|hybrid|work from home|home office|on-site|onsite|office)\b/i,
    );
  const applicationStartDate = toIsoDateOnly(jobPostingInfo.startDate);
  const applicationEndDate = toIsoDateOnly(
    jobPostingInfo.endDate || jobPostingInfo.jobPostingEndDate || jobPostingInfo.validThrough,
  );
  const jobData: RemoteJobDraftData = {
    ...emptyRemoteJobDraftData(resolvedUrl || sourceUrl),
    title,
    date: applicationStartDate || applicationEndDate,
    company,
    location,
    workMode: normalizeWorkMode(inferredWorkModeSource),
    employmentType: normalizeEmploymentType(toTextValue(jobPostingInfo.timeType)),
    salary: extractSalaryFromText(descriptionText),
    experience: findFirstMatchingItem(eligibilityItems, experienceKeywordsPattern),
    eligibilityCriteria: eligibilityItems.join("\n"),
    education,
    skills: extractWorkdayDescriptionSkills(title, descriptionText, descriptionItems),
    responsibilities,
    applicationStartDate,
    applicationEndDate,
  };

  const applyLink =
    toTextValue(jobPostingInfo.externalUrl) ||
    toTextValue(jobPostingInfo.applyUrl) ||
    resolvedUrl ||
    sourceUrl;
  jobData.applyLink = applyLink;

  const sourceText = clipText(
    buildWorkdayJobSourceText(sourceUrl, resolvedUrl, jobData, details),
    maxChars,
  );

  return {
    sourceText,
    sourceUrl,
    resolvedUrl,
    contentType: "application/json",
    jobData,
    sourceKind: "workday-careers",
  };
};

const maybeBuildMicrosoftCareersSource = async (
  pageHtml: string,
  sourceUrl: string,
  resolvedUrl: string,
  maxChars: number,
): Promise<RemoteSourceTextResult | null> => {
  const resolvedParsedUrl = new URL(resolvedUrl);
  if (!isMicrosoftCareersJobUrl(resolvedParsedUrl)) {
    return null;
  }

  const jobPostingNode = extractJobPostingNodesFromHtml(pageHtml)[0];
  if (!jobPostingNode) {
    return null;
  }

  const title =
    toTextValue(jobPostingNode.title) ||
    getMetaContent(pageHtml, ["og:title"]) ||
    getTitleFromHtml(pageHtml).replace(/\s*\|\s*Microsoft Careers\s*$/i, "").trim();
  if (!title) {
    return null;
  }

  const description =
    toTextValue(jobPostingNode.description) ||
    getMetaContent(pageHtml, ["description", "og:description"]) ||
    "";
  const descriptionSentences = splitIntoSentences(description).filter(
    (sentence) => !microsoftBoilerplateKeywordsPattern.test(sentence),
  );
  const responsibilities = descriptionSentences.filter((sentence) =>
    microsoftResponsibilityKeywordsPattern.test(sentence),
  );
  const eligibilityItems = descriptionSentences.filter((sentence) =>
    microsoftEligibilityKeywordsPattern.test(sentence),
  );
  const education = eligibilityItems.filter((item) => educationKeywordsPattern.test(item));
  const skills = extractMicrosoftDescriptionSkills(title, description);
  const company =
    toTextValue(
      (jobPostingNode.hiringOrganization as Record<string, unknown> | undefined)?.name ||
        (jobPostingNode.organization as Record<string, unknown> | undefined)?.name,
    ) ||
    "Microsoft";
  const inferredWorkModeSentence = findFirstMatchingItem(
    descriptionSentences,
    /\b(remote|hybrid|work from home|on-site|onsite|office)\b/i,
  );
  const employmentTypeSource =
    /\bintern(ship)?\b/i.test(title) || /\binternship\b/i.test(description)
      ? "Internship"
      : toTextValue(jobPostingNode.employmentType);
  const jobData: RemoteJobDraftData = {
    ...emptyRemoteJobDraftData(resolvedUrl || sourceUrl),
    title,
    date: toIsoDateOnly(jobPostingNode.datePosted || jobPostingNode.validThrough),
    company,
    location: dedupeList(extractJobLocationStrings(jobPostingNode.jobLocation)).join(" | "),
    workMode: normalizeWorkMode(inferredWorkModeSentence),
    employmentType: normalizeEmploymentType(employmentTypeSource),
    experience: findFirstMatchingItem(eligibilityItems, experienceKeywordsPattern),
    eligibilityCriteria: eligibilityItems.join("\n"),
    education,
    skills,
    responsibilities,
    applicationStartDate: toIsoDateOnly(jobPostingNode.datePosted),
    applicationEndDate: toIsoDateOnly(jobPostingNode.validThrough),
  };

  if (!jobData.date) {
    jobData.date = jobData.applicationStartDate || jobData.applicationEndDate;
  }

  const applyLink = resolvedUrl || sourceUrl || toTextValue(jobPostingNode.url);
  jobData.applyLink = applyLink;

  const sourceText = clipText(
    buildMicrosoftJobSourceText(sourceUrl, resolvedUrl, jobData, description),
    maxChars,
  );

  return {
    sourceText,
    sourceUrl,
    resolvedUrl,
    contentType: "application/ld+json",
    jobData,
    sourceKind: "microsoft-careers",
  };
};

const maybeBuildDevsUniteJobSource = async (
  pageHtml: string,
  sourceUrl: string,
  resolvedUrl: string,
  maxChars: number,
): Promise<RemoteSourceTextResult | null> => {
  const resolvedParsedUrl = new URL(resolvedUrl);
  if (!isDevsUniteJobUrl(resolvedParsedUrl)) {
    return null;
  }

  const { jobRecord, flightChunks } = extractEmbeddedJobRecordFromNextFlight(pageHtml);
  if (!jobRecord) {
    return null;
  }

  const title =
    toTextValue(jobRecord.title || jobRecord.role) ||
    getMetaContent(pageHtml, ["og:title", "twitter:title"]).replace(/\s+at\s+.+$/i, "").trim() ||
    getTitleFromHtml(pageHtml).replace(/\s*\|\s*DevsUnite\s*$/i, "").trim();
  if (!title) {
    return null;
  }

  const rawDescriptionValue =
    typeof jobRecord.description === "string"
      ? jobRecord.description
      : toTextValue(jobRecord.description);
  const resolvedDescriptionHtml = resolveNextFlightTextReference(flightChunks, rawDescriptionValue);
  const descriptionHtml =
    resolvedDescriptionHtml ||
    (/^\$[0-9a-z]+$/i.test(rawDescriptionValue) ? "" : rawDescriptionValue) ||
    decodeHtmlEntities(getMetaContent(pageHtml, ["description", "og:description"]));
  const description =
    htmlFragmentToParagraph(descriptionHtml) ||
    decodeHtmlEntities(getMetaContent(pageHtml, ["description", "og:description"])) ||
    "";
  const descriptionItems = htmlFragmentToList(descriptionHtml).filter(
    (item) => !genericJobPostingSectionHeadingPattern.test(item),
  );
  const descriptionSentences = splitIntoSentences(description).filter(
    (sentence) => !genericJobPostingSectionHeadingPattern.test(sentence),
  );
  const responsibilitySectionItems = extractHtmlSectionListItems(
    descriptionHtml,
    "Key Responsibilities",
  );
  const qualificationSectionItems = extractHtmlSectionListItems(
    descriptionHtml,
    "Required Qualifications",
  ).concat(extractHtmlSectionListItems(descriptionHtml, "Preferred Qualifications"));
  const responsibilities = dedupeList(
    responsibilitySectionItems
      .concat(
        descriptionItems.filter((item) => genericJobPostingResponsibilityKeywordsPattern.test(item)),
      )
      .concat(
        descriptionSentences.filter((sentence) =>
          genericJobPostingResponsibilityKeywordsPattern.test(sentence),
        ),
      ),
  ).slice(0, 25);
  const eligibilityItems = dedupeList(
    qualificationSectionItems
      .concat(
        descriptionItems.filter(
          (item) =>
            !genericJobPostingResponsibilityKeywordsPattern.test(item) &&
            (genericJobPostingEligibilityKeywordsPattern.test(item) ||
              educationKeywordsPattern.test(item) ||
              experienceKeywordsPattern.test(item)),
        ),
      )
      .concat(
        descriptionSentences.filter(
          (sentence) =>
            !genericJobPostingResponsibilityKeywordsPattern.test(sentence) &&
            (genericJobPostingEligibilityKeywordsPattern.test(sentence) ||
              educationKeywordsPattern.test(sentence) ||
              experienceKeywordsPattern.test(sentence)),
        ),
      ),
  );
  const education = dedupeList(
    eligibilityItems.filter((item) => educationKeywordsPattern.test(item)),
  ).slice(0, 12);
  const skills = dedupeList(
    toStringList(jobRecord.skills).concat(
      extractGenericDescriptionSkills(title, description, descriptionItems),
    ),
  ).slice(0, 25);
  const company =
    toTextValue(jobRecord.company) ||
    getMetaContent(pageHtml, ["job-company"]) ||
    "DevsUnite";
  const location =
    toTextValue(jobRecord.location) || getMetaContent(pageHtml, ["job-location"]) || "";
  const workModeSource =
    inferWorkModeFromHtml(pageHtml) ||
    findFirstMatchingItem(
      [location].concat(descriptionSentences),
      /\b(remote|hybrid|work from home|home office|on-site|onsite|office)\b/i,
    );
  const applicationEndDate = toIsoDateOnly(jobRecord.applicationDeadline);
  const jobData: RemoteJobDraftData = {
    ...emptyRemoteJobDraftData(
      toTextValue(jobRecord.applylink || jobRecord.applyLink) || resolvedUrl || sourceUrl,
    ),
    title,
    date: toIsoDateOnly(getMetaContent(pageHtml, ["last-updated"])) || applicationEndDate,
    company,
    location,
    workMode: normalizeWorkMode(workModeSource),
    employmentType: normalizeEmploymentType(
      toTextValue(jobRecord.type) || getMetaContent(pageHtml, ["job-type"]),
    ),
    salary: toTextValue(jobRecord.salary) || extractSalaryFromText(description),
    experience:
      toTextValue(jobRecord.experience) ||
      findFirstMatchingItem(eligibilityItems, experienceKeywordsPattern),
    eligibilityCriteria: eligibilityItems.join("\n"),
    education,
    skills,
    responsibilities,
    applicationEndDate,
  };

  if (!jobData.date) {
    jobData.date = jobData.applicationEndDate;
  }

  const structuredFieldCount = [
    jobData.title,
    jobData.company,
    jobData.location,
    description,
    jobData.applyLink,
    jobData.employmentType,
    jobData.skills.length > 0 ? "skills" : "",
    jobData.responsibilities.length > 0 ? "responsibilities" : "",
  ].filter(Boolean).length;
  if (structuredFieldCount < 4) {
    return null;
  }

  const sourceText = clipText(
    buildStructuredJobPostingSourceText(sourceUrl, resolvedUrl, jobData, description),
    maxChars,
  );

  return {
    sourceText,
    sourceUrl,
    resolvedUrl,
    contentType: "text/html",
    jobData,
    sourceKind: "devsunite-nextjs",
  };
};

const maybeBuildStructuredJobPostingSource = async (
  pageHtml: string,
  sourceUrl: string,
  resolvedUrl: string,
  maxChars: number,
): Promise<RemoteSourceTextResult | null> => {
  const jobPostingNode = extractJobPostingNodesFromHtml(pageHtml).find(
    (node) => Boolean(toTextValue(node.title) || toTextValue(node.description)),
  );
  if (!jobPostingNode) {
    return null;
  }

  const title =
    toTextValue(jobPostingNode.title) ||
    getMetaContent(pageHtml, ["og:title"]) ||
    getTitleFromHtml(pageHtml);
  if (!title) {
    return null;
  }

  const rawDescription =
    typeof jobPostingNode.description === "string"
      ? jobPostingNode.description
      : toTextValue(jobPostingNode.description);
  const description =
    htmlFragmentToParagraph(rawDescription) ||
    getMetaContent(pageHtml, ["description", "og:description"]) ||
    "";
  const descriptionItems = htmlFragmentToList(rawDescription).filter(
    (item) => !genericJobPostingSectionHeadingPattern.test(item),
  );
  const descriptionSentences = splitIntoSentences(description).filter(
    (sentence) => !genericJobPostingSectionHeadingPattern.test(sentence),
  );
  const responsibilities = dedupeList(
    toStringList(jobPostingNode.responsibilities)
      .concat(
        descriptionItems.filter((item) => genericJobPostingResponsibilityKeywordsPattern.test(item)),
      )
      .concat(
        descriptionSentences.filter((sentence) =>
          genericJobPostingResponsibilityKeywordsPattern.test(sentence),
        ),
      ),
  ).slice(0, 25);
  const eligibilityItems = dedupeList(
    toStringList(jobPostingNode.qualifications)
      .concat(
        descriptionItems.filter(
          (item) =>
            !genericJobPostingResponsibilityKeywordsPattern.test(item) &&
            (genericJobPostingEligibilityKeywordsPattern.test(item) ||
              educationKeywordsPattern.test(item) ||
              experienceKeywordsPattern.test(item)),
        ),
      )
      .concat(
        descriptionSentences.filter(
          (sentence) =>
            !genericJobPostingResponsibilityKeywordsPattern.test(sentence) &&
            (genericJobPostingEligibilityKeywordsPattern.test(sentence) ||
              educationKeywordsPattern.test(sentence) ||
              experienceKeywordsPattern.test(sentence)),
        ),
      ),
  );
  const education = dedupeList(
    toStringList(jobPostingNode.educationRequirements).concat(
      eligibilityItems.filter((item) => educationKeywordsPattern.test(item)),
    ),
  ).slice(0, 12);
  const skills = dedupeList(
    toStringList(jobPostingNode.skills).concat(
      extractGenericDescriptionSkills(title, description, descriptionItems),
    ),
  ).slice(0, 25);
  const company =
    toTextValue(
      (jobPostingNode.hiringOrganization as Record<string, unknown> | undefined)?.name ||
        (jobPostingNode.organization as Record<string, unknown> | undefined)?.name,
    ) ||
    getMetaContent(pageHtml, ["og:site_name"]) ||
    "";
  const location = dedupeList(
    extractJobLocationStrings(jobPostingNode.jobLocation).concat(
      extractJobLocationStrings(jobPostingNode.applicantLocationRequirements),
    ),
  ).join(" | ");
  const workModeSource =
    toTextValue(jobPostingNode.jobLocationType) ||
    inferWorkModeFromHtml(pageHtml) ||
    findFirstMatchingItem(
      descriptionSentences,
      /\b(remote|hybrid|work from home|home office|telecommute|on-site|onsite|office)\b/i,
    );
  const employmentTypeSource =
    toTextValue(jobPostingNode.workHours) || toTextValue(jobPostingNode.employmentType);
  const salary = extractSalaryText(jobPostingNode.baseSalary) || extractSalaryFromText(description);
  const applicationStartDate = toIsoDateOnly(jobPostingNode.datePosted);
  const applicationEndDate = toIsoDateOnly(jobPostingNode.validThrough);
  const applyLink =
    readApplyLinkFromHtml(pageHtml) || toTextValue(jobPostingNode.url) || resolvedUrl || sourceUrl;
  const jobData: RemoteJobDraftData = {
    ...emptyRemoteJobDraftData(applyLink),
    title,
    date: applicationStartDate || applicationEndDate,
    company,
    location,
    workMode: normalizeWorkMode(workModeSource),
    employmentType: normalizeEmploymentType(employmentTypeSource),
    salary,
    experience:
      toTextValue(jobPostingNode.experienceRequirements) ||
      findFirstMatchingItem(eligibilityItems, experienceKeywordsPattern),
    eligibilityCriteria: eligibilityItems.join("\n"),
    education,
    skills,
    responsibilities,
    applicationStartDate,
    applicationEndDate,
  };

  if (!jobData.date) {
    jobData.date = jobData.applicationStartDate || jobData.applicationEndDate;
  }

  const structuredFieldCount = [
    jobData.title,
    jobData.company,
    jobData.location,
    description,
    jobData.applyLink,
    jobData.applicationStartDate,
    jobData.employmentType,
    jobData.skills.length > 0 ? "skills" : "",
    jobData.responsibilities.length > 0 ? "responsibilities" : "",
  ].filter(Boolean).length;
  if (structuredFieldCount < 4) {
    return null;
  }

  const sourceText = clipText(
    buildStructuredJobPostingSourceText(sourceUrl, resolvedUrl, jobData, description),
    maxChars,
  );

  return {
    sourceText,
    sourceUrl,
    resolvedUrl,
    contentType: "application/ld+json",
    jobData,
    sourceKind: "jobposting-jsonld",
  };
};

const maybeFetchOracleCandidateExperienceSource = async (
  pageHtml: string,
  sourceUrl: string,
  resolvedUrl: string,
  signal: AbortSignal,
  maxChars: number,
): Promise<RemoteSourceTextResult | null> => {
  const resolvedParsedUrl = new URL(resolvedUrl);
  if (!isOracleCandidateExperienceJobUrl(resolvedParsedUrl)) {
    return null;
  }

  const jobId = readOracleJobIdFromUrl(resolvedParsedUrl);
  if (!jobId) {
    return null;
  }

  const apiUrl = new URL(
    `/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails/${encodeURIComponent(jobId)}`,
    `${resolvedParsedUrl.protocol}//${resolvedParsedUrl.host}`,
  );
  await assertSafeRemoteUrl(apiUrl);

  const details = await fetchOracleJobDetails(apiUrl, signal);
  const title = toTextValue(details.Title);
  if (!title) {
    return null;
  }

  const qualifications = htmlFragmentToList(
    String(details.ExternalQualificationsStr || details.InternalQualificationsStr || ""),
  );
  const responsibilities = htmlFragmentToList(
    String(details.ExternalResponsibilitiesStr || details.InternalResponsibilitiesStr || ""),
  );
  const education = qualifications.filter((item) => educationKeywordsPattern.test(item));
  const company =
    readOracleSiteName(pageHtml) ||
    getMetaContent(pageHtml, ["og:title"]) ||
    getTitleFromHtml(pageHtml);
  const experience =
    toTextValue(details.WorkYears) ||
    findFirstMatchingItem(qualifications, experienceKeywordsPattern);
  const jobShift = toTextValue(details.JobShift);
  const jobTiming =
    normalizeWhitespace(
      [
        toTextValue(details.WorkHours),
        jobShift && !/^no$/i.test(jobShift) ? jobShift : "",
      ]
        .filter(Boolean)
        .join(", "),
    ) || "";
  const jobData: RemoteJobDraftData = {
    ...emptyRemoteJobDraftData(resolvedUrl || sourceUrl),
    title,
    date: toIsoDateOnly(details.ExternalPostedStartDate || details.ExternalPostedEndDate),
    company,
    location: toTextValue(details.PrimaryLocation),
    workMode: normalizeWorkMode(toTextValue(details.WorkplaceType || details.WorkplaceTypeCode)),
    employmentType: normalizeEmploymentType(
      toTextValue(
        details.JobSchedule || details.JobType || details.ContractType || details.RequisitionType,
      ),
    ),
    experience,
    eligibilityCriteria: qualifications.join("\n"),
    education:
      education.length > 0
        ? education
        : dedupeList([toTextValue(details.StudyLevel)].filter(Boolean)),
    skills: [],
    responsibilities,
    workingDays: toTextValue(details.WorkDays),
    jobTiming,
    applicationStartDate: toIsoDateOnly(details.ExternalPostedStartDate),
    applicationEndDate: toIsoDateOnly(details.ExternalPostedEndDate),
  };

  if (!jobData.date) {
    jobData.date = jobData.applicationStartDate || jobData.applicationEndDate;
  }

  const sourceText = clipText(
    buildOracleJobSourceText(sourceUrl, resolvedUrl, company, jobData, details),
    maxChars,
  );

  return {
    sourceText,
    sourceUrl,
    resolvedUrl,
    contentType: "application/vnd.oracle.adf.resourceitem+json",
    jobData,
    sourceKind: "oracle-candidate-experience",
  };
};

export const fetchRemoteSourceText = async (
  value: string,
  options: { maxChars?: number } = {},
): Promise<RemoteSourceTextResult> => {
  const parsedUrl = normalizeRemoteUrl(value);
  await assertSafeRemoteUrl(parsedUrl);

  if (isLinkedInActivityUrl(parsedUrl)) {
    throw new Error(
      "LinkedIn activity/feed URLs are not supported for job extraction. Open the original job or company careers link and use that URL instead.",
    );
  }

  if (isFounditRegistrationWrapperUrl(parsedUrl)) {
    throw new Error(
      "Foundit single-page registration URLs are not supported for job extraction. Open the actual Foundit job page or the original company careers/apply link and use that URL instead.",
    );
  }

  const maxChars = options.maxChars || defaultMaxSourceChars;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, defaultFetchTimeoutMs);

  try {
    const { response, finalUrl, cookieHeader } = await fetchFollowingSafeRedirects(
      parsedUrl,
      controller.signal,
    );

    if (!response.ok) {
      throw new Error(`Remote source request failed (${response.status})`);
    }

    const contentType = toMimeType(response.headers.get("content-type"));
    const rawText = await readResponseTextWithinLimit(response);
    const resolvedUrl = finalUrl || parsedUrl.toString();

    let sourceText = "";
    let jobData: RemoteJobDraftData | undefined;
    let sourceKind = "";
    if (htmlMimeTypes.has(contentType) || (!contentType && /<html|<body|<main/i.test(rawText))) {
      const specializedSource =
        (await maybeFetchWorkdayCareersSource(
          rawText,
          parsedUrl.toString(),
          resolvedUrl,
          cookieHeader,
          controller.signal,
          maxChars,
        )) ||
        (await maybeBuildMicrosoftCareersSource(
          rawText,
          parsedUrl.toString(),
          resolvedUrl,
          maxChars,
        )) ||
        (await maybeBuildDevsUniteJobSource(
          rawText,
          parsedUrl.toString(),
          resolvedUrl,
          maxChars,
        )) ||
        (await maybeFetchOracleCandidateExperienceSource(
          rawText,
          parsedUrl.toString(),
          resolvedUrl,
          controller.signal,
          maxChars,
        )) ||
        (await maybeBuildStructuredJobPostingSource(
          rawText,
          parsedUrl.toString(),
          resolvedUrl,
          maxChars,
        ));

      if (specializedSource) {
        sourceText = specializedSource.sourceText;
        jobData = specializedSource.jobData;
        sourceKind = specializedSource.sourceKind || "";
      } else {
        if (looksLikeGenericJobLandingPage(rawText, parsedUrl.toString(), resolvedUrl)) {
          throw new Error(
            "The URL returned a generic jobs landing page instead of a job detail page. Open the actual job details or apply page and use that URL instead.",
          );
        }

        sourceText = buildHtmlSourceText(rawText, parsedUrl.toString(), resolvedUrl, maxChars);
      }
    } else if (textMimeTypes.has(contentType)) {
      sourceText = clipText(normalizeMarkdownSource(rawText), maxChars);
    } else if (jsonMimeTypes.has(contentType)) {
      sourceText = clipText(jsonToText(rawText), maxChars);
    } else {
      throw new Error(
        contentType
          ? `Unsupported remote source content type: ${contentType}`
          : "Unsupported remote source content",
      );
    }

    if (!sourceText) {
      throw new Error("Remote source did not contain usable text");
    }

    return {
      sourceText,
      sourceUrl: parsedUrl.toString(),
      resolvedUrl,
      contentType: contentType || "text/plain",
      ...(jobData ? { jobData } : {}),
      ...(sourceKind ? { sourceKind } : {}),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Remote source request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
