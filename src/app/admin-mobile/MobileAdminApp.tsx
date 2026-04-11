"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  type AdminCollection,
  type AdminMobileBlogEntry,
  type AdminMobileEntry,
  type AdminMobileJobRecord,
  type AdminMobileJobEntry,
  type AdminMobileRecord,
  createEmptyBlogEntry,
  createEmptyJobEntry,
  getTodayDateString,
} from "@/lib/adminMobile";
import { siteName, siteUrl, siteWhatsappChannelUrl } from "@/lib/site";

type AdminAppProps = {
  adminEmail: string;
  initialCollection: AdminCollection;
  initialSlug: string;
  mobilePublishingReady: boolean;
  adminBasePath: string;
};

type RecordsState = Record<AdminCollection, AdminMobileRecord[]>;
type LoadingState = Record<AdminCollection, boolean>;
type JobListMode = "recent" | "threeDays" | "today" | "yesterday" | "all";
type JobListSection = {
  id: "today" | "yesterday" | "twoDaysAgo";
  title: string;
  description: string;
  emptyMessage: string;
  records: AdminMobileJobRecord[];
};
type BatchJobShareSectionId = "internships" | "freshers" | "experienced";
type JobCategoryFilter = "all" | BatchJobShareSectionId;
type BatchJobShareSection = {
  id: BatchJobShareSectionId;
  title: string;
  description: string;
  records: AdminMobileJobRecord[];
  totalRecords: number;
};
type PublishedJobShare = {
  company: string;
  employmentType: string;
  experience: string;
  jobUrl: string;
  location: string;
  salary: string;
  title: string;
  workMode: string;
};

const listToText = (items: string[]) => items.join("\n");
const maxBatchJobShareRecords = 20;

const textToList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*•\s]+/, "").trim())
    .filter((item) => item.length > 0);

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const toUtcDayTimestamp = (value: string) => {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const shiftIsoDateString = (value: string, dayOffset: number) => {
  const timestamp = toUtcDayTimestamp(value);
  if (!timestamp) {
    return "";
  }

  const shiftedDate = new Date(timestamp);
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() + dayOffset);
  return shiftedDate.toISOString().split("T")[0];
};

const getRecordActivityDate = (record: Pick<AdminMobileRecord, "updatedAt" | "date">) =>
  record.updatedAt || record.date || "";

const sortRecordsByRecentActivity = <T extends AdminMobileRecord>(firstRecord: T, secondRecord: T) => {
  const firstActivityDate = toUtcDayTimestamp(getRecordActivityDate(firstRecord));
  const secondActivityDate = toUtcDayTimestamp(getRecordActivityDate(secondRecord));
  if (secondActivityDate !== firstActivityDate) {
    return secondActivityDate - firstActivityDate;
  }

  const firstPublishDate = toUtcDayTimestamp(firstRecord.date);
  const secondPublishDate = toUtcDayTimestamp(secondRecord.date);
  if (secondPublishDate !== firstPublishDate) {
    return secondPublishDate - firstPublishDate;
  }

  return firstRecord.slug.localeCompare(secondRecord.slug);
};

const filterRecordsByQuery = <T extends AdminMobileRecord>(records: T[], query: string) => {
  if (!query) {
    return records;
  }

  return records.filter((record) => {
    const haystack = [
      record.title,
      record.slug,
      "company" in record ? record.company : record.topic,
      "location" in record ? record.location : "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
};

const buildJobShareSummary = (entry: {
  employmentType: string;
  location: string;
  workMode: string;
}) => {
  const parts = [
    entry.location,
    entry.workMode,
    entry.employmentType,
  ]
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return parts.length > 0
    ? parts.slice(0, 3).join(" | ")
    : "Verified job opening with direct apply details.";
};

const buildJobUrlFromSlug = (slug: string) =>
  `${siteUrl.replace(/\/+$/, "")}/jobs/${slug}/`;

const internshipSharePattern =
  /\b(intern|internship|apprentice|apprenticeship|co[\s-]?op)\b/;
const fresherSharePattern =
  /\b(fresher|freshers|entry[\s-]?level|new grad|recent graduate|recent graduates|fresh graduate|fresh graduates|graduate program|graduate trainee|campus|final[\s-]?year|student(?:s)?|0\s*(?:to|-|–|—)\s*1|0\s*(?:to|-|–|—)\s*6\s*months?|0\s*years?)\b/;
const experiencedSharePattern =
  /\b(experienced|experience(?:d)? professionals?|mid[\s-]?level|senior|lead|principal|architect|manager|specialist|consultant)\b/;
const juniorTitleSharePattern = /\b(junior|associate|analyst|graduate|trainee|entry)\b/;
const seniorTitleSharePattern =
  /\b(senior|lead|principal|architect|manager|specialist|consultant)\b/;

const extractExperienceValues = (value: string) => {
  const normalizedValue = value.toLowerCase().replace(/[–—]/g, "-");
  const usesMonths = /\bmonth/.test(normalizedValue);

  return Array.from(normalizedValue.matchAll(/\d+(?:\.\d+)?/g))
    .map((match) => Number.parseFloat(match[0]))
    .filter((item) => Number.isFinite(item))
    .map((item) => (usesMonths ? item / 12 : item));
};

const classifyJobRecordForBatchShare = (
  record: Pick<AdminMobileJobRecord, "title" | "employmentType" | "experience">,
): BatchJobShareSectionId => {
  const combinedValue =
    `${record.title} ${record.employmentType} ${record.experience}`.toLowerCase();
  if (internshipSharePattern.test(combinedValue)) {
    return "internships";
  }

  if (fresherSharePattern.test(combinedValue)) {
    return "freshers";
  }

  if (experiencedSharePattern.test(combinedValue)) {
    return "experienced";
  }

  const experienceValues = extractExperienceValues(record.experience);
  if (experienceValues.some((item) => item > 1)) {
    return "experienced";
  }

  if (experienceValues.length > 0 && Math.max(...experienceValues) <= 1) {
    return "freshers";
  }

  const normalizedTitle = record.title.toLowerCase();
  if (juniorTitleSharePattern.test(normalizedTitle)) {
    return "freshers";
  }

  if (seniorTitleSharePattern.test(normalizedTitle)) {
    return "experienced";
  }

  return "experienced";
};

const createBatchJobShareSections = (records: AdminMobileJobRecord[]): BatchJobShareSection[] => {
  const groupedRecords: Record<BatchJobShareSectionId, AdminMobileJobRecord[]> = {
    internships: [],
    freshers: [],
    experienced: [],
  };

  for (const record of records) {
    groupedRecords[classifyJobRecordForBatchShare(record)].push(record);
  }

  return [
    {
      id: "internships",
      title: "Internships",
      description: "Internships, apprenticeships, and student-focused roles.",
      totalRecords: groupedRecords.internships.length,
      records: groupedRecords.internships.slice(0, maxBatchJobShareRecords),
    },
    {
      id: "freshers",
      title: "Freshers",
      description: "Entry-level, graduate, trainee, and 0-1 year openings.",
      totalRecords: groupedRecords.freshers.length,
      records: groupedRecords.freshers.slice(0, maxBatchJobShareRecords),
    },
    {
      id: "experienced",
      title: "Experienced",
      description: "Mid-level roles plus jobs that are not clearly fresher openings.",
      totalRecords: groupedRecords.experienced.length,
      records: groupedRecords.experienced.slice(0, maxBatchJobShareRecords),
    },
  ];
};

const filterJobRecordsByCategory = (
  records: AdminMobileJobRecord[],
  category: JobCategoryFilter,
) => {
  if (category === "all") {
    return records;
  }

  return records.filter((record) => classifyJobRecordForBatchShare(record) === category);
};

const getJobCategoryFilterLabel = (category: JobCategoryFilter) => {
  if (category === "internships") {
    return "Internships";
  }

  if (category === "freshers") {
    return "Freshers";
  }

  if (category === "experienced") {
    return "Experienced";
  }

  return "All jobs";
};

const buildBatchShareScopeLabel = (mode: JobListMode, searchTerm: string) => {
  const baseLabel =
    mode === "today"
      ? "today's jobs"
      : mode === "yesterday"
        ? "yesterday's jobs"
        : mode === "threeDays"
          ? "jobs from the last 3 days"
        : mode === "all"
          ? "all visible jobs"
          : "jobs from the last 2 days";

  if (!searchTerm) {
    return baseLabel;
  }

  return `${baseLabel} matching "${searchTerm}"`;
};

const buildBatchJobWhatsappText = (
  section: BatchJobShareSection,
  scopeLabel: string,
  useEmojis: boolean,
) => {
  const heading =
    section.id === "internships"
      ? useEmojis
        ? "🎓 Internship Jobs"
        : "Internship Jobs"
      : section.id === "freshers"
        ? useEmojis
          ? "🚀 Fresher Jobs"
          : "Fresher Jobs"
        : useEmojis
          ? "💼 Experienced Jobs"
          : "Experienced Jobs";
  const introLine = `${section.totalRecords} openings from ${scopeLabel}.`;
  const limitLine =
    section.totalRecords > section.records.length
      ? `Showing the latest ${section.records.length} jobs in this message.`
      : "";
  const brandLine = `${useEmojis ? "📢 " : ""}Shared via ${siteName}`;
  const websiteLabel = `${useEmojis ? "🌐 " : ""}Visit our website for more jobs:`;
  const channelLabel = `${useEmojis ? "📲 " : ""}Join WhatsApp Channel:`;
  const channelLink = `${useEmojis ? "👉 " : ""}${siteWhatsappChannelUrl}`;

  const jobLines = section.records.map((record, index) => {
    const recordMeta = [
      record.location.trim(),
      record.workMode.trim(),
      (record.experience || record.employmentType).trim(),
    ].filter((item) => item.length > 0);

    return [
      `${index + 1}. ${record.title} - ${record.company || "Company not listed"}`,
      recordMeta.length > 0 ? `   ${recordMeta.slice(0, 3).join(" | ")}` : "",
      `   ${buildJobUrlFromSlug(record.slug)}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    heading,
    introLine,
    ...(limitLine ? [limitLine] : []),
    "",
    ...jobLines,
    "",
    brandLine,
    websiteLabel,
    siteUrl,
    "",
    channelLabel,
    channelLink,
  ].join("\n");
};

const normalizeShareField = (value: string, fallback: string) =>
  value.trim() || fallback;

const buildShareAudienceLabel = (share: PublishedJobShare) => {
  const combinedValue =
    `${share.title} ${share.employmentType} ${share.experience}`.toLowerCase();

  if (/\b(intern|internship|apprentice|apprenticeship|student)\b/.test(combinedValue)) {
    return "Internship";
  }

  if (
    /\b(fresher|freshers|graduate|trainee|entry[\s-]?level|0\s*(?:to|-|–|—)\s*1|0\s*years?)\b/.test(
      combinedValue,
    )
  ) {
    return "Freshers";
  }

  if (/\b(experienced|senior|lead|manager|specialist|consultant)\b/.test(combinedValue)) {
    return "Experienced";
  }

  return "Job Update";
};

const buildShareExperienceLabel = (share: PublishedJobShare) => {
  const experienceValue = share.experience.trim();
  if (experienceValue) {
    return experienceValue;
  }

  const audienceLabel = buildShareAudienceLabel(share);
  if (audienceLabel === "Internship") {
    return "Students Eligible";
  }

  if (audienceLabel === "Freshers") {
    return "Freshers Eligible";
  }

  return "Check Full Details";
};

const buildShareModeLabel = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return "Mode Not Mentioned";
  }

  return normalizedValue;
};

const buildPublishedJobWhatsappText = (
  share: PublishedJobShare,
  useEmojis: boolean,
) => {
  const audienceLabel = buildShareAudienceLabel(share);
  const companyPrefix = share.company.trim() || siteName;
  const heading = `${useEmojis ? "🎓 " : ""}${companyPrefix} Hiring — ${audienceLabel}`;
  const roleLine = `${useEmojis ? "🔥 " : ""}${share.title}`;
  const locationLine = `${useEmojis ? "📍 " : ""}${normalizeShareField(
    share.location,
    "Location Not Mentioned",
  )}`;
  const salaryLine = `${useEmojis ? "💰 " : ""}${normalizeShareField(
    share.salary,
    "Salary Not Mentioned",
  )}`;
  const experienceLine = `${useEmojis ? "🧑‍💻 " : ""}${buildShareExperienceLabel(share)}`;
  const workModeLine = `${useEmojis ? "🏢 " : ""}${buildShareModeLabel(share.workMode)}`;
  const applyLabel = `${useEmojis ? "🔗 " : ""}Apply Now:`;
  const websiteLabel = `${useEmojis ? "🌐 " : ""}Visit our website for more jobs:`;
  const channelLabel = `${
    useEmojis ? "📢 " : ""
  }Join WhatsApp Channel for Daily Jobs:`;
  const channelLink = `${useEmojis ? "👉 " : ""}${siteWhatsappChannelUrl}`;

  return [
    heading,
    "",
    roleLine,
    "",
    locationLine,
    salaryLine,
    experienceLine,
    workModeLine,
    "",
    applyLabel,
    share.jobUrl,
    "",
    websiteLabel,
    siteUrl,
    "",
    channelLabel,
    channelLink,
  ].join("\n");
};

const buildPublishedJobShare = (entry: AdminMobileJobEntry): PublishedJobShare => {
  return {
    company: entry.company,
    employmentType: entry.employmentType,
    experience: entry.experience,
    jobUrl: buildJobUrlFromSlug(entry.slug),
    location: entry.location,
    salary: entry.salary,
    title: entry.title,
    workMode: entry.workMode,
  };
};

const getPublishedJobShareForEntry = (entry: AdminMobileEntry) =>
  entry.collection === "jobs" && !entry.draft ? buildPublishedJobShare(entry) : null;

const defaultRecordsState: RecordsState = {
  jobs: [],
  blogs: [],
};

const defaultLoadingState: LoadingState = {
  jobs: false,
  blogs: false,
};

const parseLegacyAdminHash = (hash: string) => {
  const match = hash.match(/collections\/(jobs|blogs)(?:\/entries\/([^/?#]+)|\/new)?/i);
  if (!match) {
    return null;
  }

  return {
    collection: match[1] as AdminCollection,
    slug: match[2] ? decodeURIComponent(match[2]) : "",
  };
};

const formatRecordMeta = (record: AdminMobileRecord) => {
  if ("company" in record) {
    return `${record.company || "No company"} • ${record.location || "No location"}`;
  }

  return record.topic || "No topic";
};

const buildEmptyEntry = (collection: AdminCollection) =>
  collection === "jobs" ? createEmptyJobEntry() : createEmptyBlogEntry();

const toExtractString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toExtractStringList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toExtractString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return textToList(value);
  }

  return [] as string[];
};

const jobStringFieldKeys = [
  "title",
  "date",
  "company",
  "location",
  "workMode",
  "employmentType",
  "salary",
  "experience",
  "eligibilityCriteria",
  "workingDays",
  "jobTiming",
  "applyLink",
  "applicationStartDate",
  "applicationEndDate",
] as const;

const jobListFieldKeys = ["education", "skills", "responsibilities"] as const;

const blogStringFieldKeys = [
  "title",
  "slug",
  "summary",
  "topic",
  "author",
  "coverImage",
  "date",
  "body",
] as const;

const applyJobExtractedData = (
  current: AdminMobileJobEntry,
  data: Record<string, unknown>,
) => {
  let updatedCount = 0;
  const nextEntry = { ...current };

  for (const key of jobStringFieldKeys) {
    const nextValue = toExtractString(data[key]);
    if (!nextValue || nextEntry[key] === nextValue) {
      continue;
    }

    nextEntry[key] = nextValue;
    updatedCount += 1;
  }

  for (const key of jobListFieldKeys) {
    const nextValue = toExtractStringList(data[key]);
    if (
      nextValue.length === 0 ||
      nextEntry[key].join("\n") === nextValue.join("\n")
    ) {
      continue;
    }

    nextEntry[key] = nextValue;
    updatedCount += 1;
  }

  return {
    entry: nextEntry,
    updatedCount,
  };
};

const applyBlogExtractedData = (
  current: AdminMobileBlogEntry,
  data: Record<string, unknown>,
) => {
  let updatedCount = 0;
  const nextEntry = { ...current };

  for (const key of blogStringFieldKeys) {
    const nextValue = toExtractString(data[key]);
    if (!nextValue || nextEntry[key] === nextValue) {
      continue;
    }

    nextEntry[key] = nextValue;
    updatedCount += 1;
  }

  const nextTags = toExtractStringList(data.tags);
  if (nextTags.length > 0 && nextEntry.tags.join("\n") !== nextTags.join("\n")) {
    nextEntry.tags = nextTags;
    updatedCount += 1;
  }

  if (data.isTrending === true && nextEntry.isTrending !== true) {
    nextEntry.isTrending = true;
    updatedCount += 1;
  }

  return {
    entry: nextEntry,
    updatedCount,
  };
};

const buildAdminLoginUrl = (adminBasePath: string) =>
  `/admin/login?callbackUrl=${encodeURIComponent(adminBasePath)}`;

export default function MobileAdminApp({
  adminEmail,
  initialCollection,
  initialSlug,
  mobilePublishingReady,
  adminBasePath,
}: AdminAppProps) {
  const [collection, setCollection] = useState<AdminCollection>(initialCollection);
  const [recordsByCollection, setRecordsByCollection] =
    useState<RecordsState>(defaultRecordsState);
  const [recordsLoading, setRecordsLoading] =
    useState<LoadingState>(defaultLoadingState);
  const [recordsError, setRecordsError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [jobListMode, setJobListMode] = useState<JobListMode>("recent");
  const [jobCategoryFilter, setJobCategoryFilter] = useState<JobCategoryFilter>("all");
  const [publishedJobShare, setPublishedJobShare] = useState<PublishedJobShare | null>(null);
  const [publishedJobShareUsesEmojis, setPublishedJobShareUsesEmojis] = useState(true);
  const [batchJobShareOpen, setBatchJobShareOpen] = useState(false);
  const [batchJobShareUsesEmojis, setBatchJobShareUsesEmojis] = useState(true);
  const [editorEntry, setEditorEntry] = useState<AdminMobileEntry>(buildEmptyEntry(initialCollection));
  const [editorOpen, setEditorOpen] = useState(Boolean(initialSlug));
  const [entryLoading, setEntryLoading] = useState(Boolean(initialSlug));
  const [originalSlug, setOriginalSlug] = useState(initialSlug);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [saveMode, setSaveMode] = useState<"draft" | "publish" | "">("");
  const [deletePending, setDeletePending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [extractorOpen, setExtractorOpen] = useState(false);
  const [extractSourceText, setExtractSourceText] = useState("");
  const [extractSourceUrl, setExtractSourceUrl] = useState("");
  const [extractMode, setExtractMode] = useState<"text" | "url" | "">("");
  const [extractError, setExtractError] = useState("");
  const [extractNotice, setExtractNotice] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const extractorPanelRef = useRef<HTMLDivElement | null>(null);

  const activeRecords = recordsByCollection[collection];
  const todayDate = getTodayDateString();
  const yesterdayDate = shiftIsoDateString(todayDate, -1);
  const twoDaysAgoDate = shiftIsoDateString(todayDate, -2);
  const activeJobRecords =
    collection === "jobs" ? (activeRecords as AdminMobileJobRecord[]) : [];
  const totalDrafts =
    recordsByCollection.jobs.filter((record) => record.draft).length +
    recordsByCollection.blogs.filter((record) => record.draft).length;
  const activeDraftCount = activeRecords.filter((record) => record.draft).length;
  const accountLabel = adminEmail.split("@")[0] || "admin";
  const accountInitial = accountLabel.charAt(0).toUpperCase() || "A";
  const searchTerm = searchValue.trim();
  const query = searchTerm.toLowerCase();
  const adminLoginUrl = buildAdminLoginUrl(adminBasePath);
  const filteredRecords = filterRecordsByQuery(activeRecords, query);
  const filteredJobRecords =
    collection === "jobs"
      ? [...filterRecordsByQuery(activeJobRecords, query)].sort(sortRecordsByRecentActivity)
      : [];
  const todayJobCount = recordsByCollection.jobs.filter(
    (record) => getRecordActivityDate(record) === todayDate,
  ).length;
  const yesterdayJobCount = recordsByCollection.jobs.filter(
    (record) => getRecordActivityDate(record) === yesterdayDate,
  ).length;
  const threeDayJobCount = recordsByCollection.jobs.filter((record) => {
    const activityDate = getRecordActivityDate(record);
    return (
      activityDate === todayDate ||
      activityDate === yesterdayDate ||
      activityDate === twoDaysAgoDate
    );
  }).length;
  const jobListSections: JobListSection[] =
    collection === "jobs"
      ? [
          {
            id: "today",
            title: "Today",
            description: "Jobs published or updated today",
            emptyMessage: query
              ? "No jobs from today matched your search."
              : "No jobs have been updated today.",
            records: filteredJobRecords
              .filter((record) => getRecordActivityDate(record) === todayDate)
              .sort(sortRecordsByRecentActivity),
          },
          {
            id: "yesterday",
            title: "Yesterday",
            description: "Jobs published or updated yesterday",
            emptyMessage: query
              ? "No jobs from yesterday matched your search."
              : "No jobs were updated yesterday.",
            records: filteredJobRecords
              .filter((record) => getRecordActivityDate(record) === yesterdayDate)
              .sort(sortRecordsByRecentActivity),
          },
          {
            id: "twoDaysAgo",
            title: "2 Days Ago",
            description: "Jobs published or updated 2 days ago",
            emptyMessage: query
              ? "No jobs from 2 days ago matched your search."
              : "No jobs were updated 2 days ago.",
            records: filteredJobRecords
              .filter((record) => getRecordActivityDate(record) === twoDaysAgoDate)
              .sort(sortRecordsByRecentActivity),
          },
        ]
      : [];
  const visibleJobSections =
    jobListMode === "today"
      ? jobListSections.filter((section) => section.id === "today")
      : jobListMode === "yesterday"
        ? jobListSections.filter((section) => section.id === "yesterday")
        : jobListMode === "threeDays"
          ? jobListSections
        : jobListMode === "recent"
          ? jobListSections.filter((section) => section.id !== "twoDaysAgo")
          : [];
  const visibleJobRecords =
    collection === "jobs"
      ? jobListMode === "all"
        ? filteredJobRecords
        : visibleJobSections.flatMap((section) => section.records)
      : [];
  const jobCategoryCounts =
    collection === "jobs"
      ? {
          all: visibleJobRecords.length,
          internships: filterJobRecordsByCategory(visibleJobRecords, "internships").length,
          freshers: filterJobRecordsByCategory(visibleJobRecords, "freshers").length,
          experienced: filterJobRecordsByCategory(visibleJobRecords, "experienced").length,
        }
      : {
          all: 0,
          internships: 0,
          freshers: 0,
          experienced: 0,
        };
  const filteredVisibleJobSections =
    collection === "jobs"
      ? visibleJobSections.map((section) => ({
          ...section,
          emptyMessage:
            jobCategoryFilter === "all"
              ? section.emptyMessage
              : query
                ? `No ${getJobCategoryFilterLabel(jobCategoryFilter).toLowerCase()} jobs from ${section.title.toLowerCase()} matched your search.`
                : `No ${getJobCategoryFilterLabel(jobCategoryFilter).toLowerCase()} jobs were found in ${section.title.toLowerCase()}.`,
          records: filterJobRecordsByCategory(section.records, jobCategoryFilter),
        }))
      : [];
  const filteredJobRecordsByCategory =
    collection === "jobs" ? filterJobRecordsByCategory(filteredJobRecords, jobCategoryFilter) : [];
  const shareableJobRecords = visibleJobRecords.filter((record) => !record.draft);
  const batchJobShareSections =
    collection === "jobs" ? createBatchJobShareSections(shareableJobRecords) : [];
  const batchJobShareScopeLabel = buildBatchShareScopeLabel(jobListMode, searchTerm);
  const batchJobShareDraftCount =
    visibleJobRecords.length - shareableJobRecords.length;
  const hasBatchJobShareSections = batchJobShareSections.some(
    (section) => section.records.length > 0,
  );
  const displayedRecordsCount =
    collection === "jobs"
      ? jobListMode === "all"
        ? filteredJobRecordsByCategory.length
        : filteredVisibleJobSections.reduce((count, section) => count + section.records.length, 0)
      : filteredRecords.length;
  const searchPlaceholder =
    collection === "jobs"
      ? jobListMode === "today"
        ? "Search today's jobs"
        : jobListMode === "yesterday"
          ? "Search yesterday's jobs"
          : jobListMode === "threeDays"
            ? "Search jobs from the last 3 days"
          : jobListMode === "all"
            ? "Search all jobs"
            : "Search jobs from the last 2 days"
      : `Search ${collection}`;
  const publishedJobSummary = publishedJobShare
    ? buildJobShareSummary(publishedJobShare)
    : "";
  const publishedJobWhatsappText = publishedJobShare
    ? buildPublishedJobWhatsappText(publishedJobShare, publishedJobShareUsesEmojis)
    : "";
  const publishedJobWhatsappShareUrl = publishedJobWhatsappText
    ? `https://wa.me/?text=${encodeURIComponent(publishedJobWhatsappText)}`
    : "";
  const mobilePublishingError = mobilePublishingReady
    ? ""
    : "Admin publishing is not configured on this deployment. Set ADMIN_CONTENTS_TOKEN in production and redeploy to enable save, upload, and delete.";
  const saveDisabled = saveMode !== "" || deletePending || !mobilePublishingReady;
  const uploadDisabled = uploading || deletePending || !mobilePublishingReady;
  const deleteDisabled = deletePending || saveMode !== "" || uploading || !mobilePublishingReady;
  const canDeleteEntry = originalSlug.length > 0;
  const extractorStatusLabel =
    extractMode === "url"
      ? "Fetching URL..."
      : extractMode === "text"
        ? "Extracting..."
        : extractError
          ? "Action required"
          : extractNotice
            ? "Updated"
            : "Ready";

  useEffect(() => {
    const fetchRecords = async (nextCollection: AdminCollection) => {
      setRecordsLoading((current) => ({ ...current, [nextCollection]: true }));

      try {
        const response = await fetch(`/api/admin/${nextCollection}/records/`, {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401 || response.status === 403) {
          window.location.href = adminLoginUrl;
          return;
        }

        const result = (await response.json()) as {
          records?: AdminMobileRecord[];
          success?: boolean;
        };

        if (!response.ok || result.success === false) {
          throw new Error("Unable to load entries.");
        }

        setRecordsByCollection((current) => ({
          ...current,
          [nextCollection]: Array.isArray(result.records) ? result.records : [],
        }));
      } catch (error) {
        setRecordsError(error instanceof Error ? error.message : "Unable to load entries.");
      } finally {
        setRecordsLoading((current) => ({ ...current, [nextCollection]: false }));
      }
    };

    fetchRecords("jobs");
    fetchRecords("blogs");
  }, [adminLoginUrl]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!accountMenuRef.current) {
        return;
      }

      const eventTarget = event.target;
      if (eventTarget instanceof Node && !accountMenuRef.current.contains(eventTarget)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!extractorOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (typeof window === "undefined" || window.innerWidth < 1024) {
        return;
      }

      if (!extractorPanelRef.current) {
        return;
      }

      const eventTarget = event.target;
      if (eventTarget instanceof Node && !extractorPanelRef.current.contains(eventTarget)) {
        setExtractorOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExtractorOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [extractorOpen]);

  useEffect(() => {
    if (collection === "jobs" && hasBatchJobShareSections) {
      return;
    }

    setBatchJobShareOpen(false);
  }, [collection, hasBatchJobShareSections]);

  useEffect(() => {
    if (collection === "jobs") {
      return;
    }

    setJobCategoryFilter("all");
  }, [collection]);

  useEffect(() => {
    const applyRouteState = (nextCollection: AdminCollection, nextSlug: string, open: boolean) => {
      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = adminBasePath;
      nextUrl.searchParams.set("collection", nextCollection);

      if (open && nextSlug) {
        nextUrl.searchParams.set("slug", nextSlug);
      } else {
        nextUrl.searchParams.delete("slug");
      }

      window.history.replaceState(window.history.state, "", nextUrl.toString());
    };

    applyRouteState(collection, originalSlug || editorEntry.slug, editorOpen);
  }, [adminBasePath, collection, editorEntry.slug, editorOpen, originalSlug]);

  useEffect(() => {
    const legacyState = parseLegacyAdminHash(window.location.hash || "");
    if (!legacyState) {
      return;
    }

    startTransition(() => {
      setCollection(legacyState.collection);
    });

    if (legacyState.slug) {
      setEntryLoading(true);
      setEditorOpen(true);

      fetch(
        `/api/admin/mobile/entry?collection=${legacyState.collection}&slug=${encodeURIComponent(
          legacyState.slug,
        )}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      )
        .then(async (response) => {
          if (response.status === 401 || response.status === 403) {
            window.location.href = adminLoginUrl;
            return null;
          }

          const result = (await response.json()) as {
            entry?: AdminMobileEntry;
            success?: boolean;
          };

          if (!response.ok || result.success === false || !result.entry) {
            throw new Error("Unable to open entry.");
          }

          return result.entry;
        })
        .then((entry) => {
          if (!entry) {
            return;
          }

          setEditorEntry(entry);
          setOriginalSlug(entry.slug);
          setPublishedJobShare(getPublishedJobShareForEntry(entry));
        })
        .catch((error) => {
          setFormError(error instanceof Error ? error.message : "Unable to open entry.");
        })
        .finally(() => {
          setEntryLoading(false);
        });
    }
  }, [adminLoginUrl]);

  useEffect(() => {
    if (!initialSlug) {
      return;
    }

    setEntryLoading(true);

    fetch(
      `/api/admin/mobile/entry?collection=${initialCollection}&slug=${encodeURIComponent(
        initialSlug,
      )}`,
      {
        cache: "no-store",
        credentials: "same-origin",
      },
    )
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          window.location.href = adminLoginUrl;
          return null;
        }

        const result = (await response.json()) as {
          entry?: AdminMobileEntry;
          success?: boolean;
        };

        if (!response.ok || result.success === false || !result.entry) {
          throw new Error("Unable to open entry.");
        }

        return result.entry;
      })
      .then((entry) => {
        if (!entry) {
          return;
        }

        setEditorEntry(entry);
        setOriginalSlug(entry.slug);
        setEditorOpen(true);
        setPublishedJobShare(getPublishedJobShareForEntry(entry));
      })
      .catch((error) => {
        setFormError(error instanceof Error ? error.message : "Unable to open entry.");
      })
      .finally(() => {
        setEntryLoading(false);
      });
  }, [adminLoginUrl, initialCollection, initialSlug]);

  const resetEditorForNewEntry = (
    nextCollection: AdminCollection,
    options?: {
      notice?: string;
      clearExtractorInputs?: boolean;
      preservePublishedJobShare?: boolean;
      resetSearch?: boolean;
      nextJobListMode?: JobListMode;
    },
  ) => {
    setCollection(nextCollection);
    setEditorEntry(buildEmptyEntry(nextCollection));
    setOriginalSlug("");
    setEntryLoading(false);
    setEditorOpen(true);
    setFormError("");
    setFormNotice(options?.notice || "");
    setUploadedAssetUrl("");
    setExtractError("");
    setExtractNotice("");

    if (!(options?.preservePublishedJobShare ?? false)) {
      setPublishedJobShare(null);
    }

    if (options?.clearExtractorInputs ?? false) {
      setExtractSourceUrl("");
      setExtractSourceText("");
    }

    if (options?.resetSearch) {
      setSearchValue("");
    }

    if (nextCollection === "jobs" && options?.nextJobListMode) {
      setJobListMode(options.nextJobListMode);
    }
  };

  const openNewEntry = (nextCollection: AdminCollection) => {
    resetEditorForNewEntry(nextCollection);
  };

  const openExistingEntry = async (nextCollection: AdminCollection, slug: string) => {
    setCollection(nextCollection);
    setEntryLoading(true);
    setEditorOpen(true);
    setFormError("");
    setFormNotice("");
    setPublishedJobShare(null);
    setExtractError("");
    setExtractNotice("");

    try {
      const response = await fetch(
        `/api/admin/mobile/entry?collection=${nextCollection}&slug=${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.href = adminLoginUrl;
        return;
      }

      const result = (await response.json()) as {
        entry?: AdminMobileEntry;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.entry) {
        throw new Error("Unable to load the selected entry.");
      }

      setEditorEntry(result.entry);
      setOriginalSlug(result.entry.slug);
      setPublishedJobShare(getPublishedJobShareForEntry(result.entry));
      setUploadedAssetUrl("");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to load the selected entry.",
      );
    } finally {
      setEntryLoading(false);
    }
  };

  const updateEntry = (patch: Partial<AdminMobileEntry>) => {
    setEditorEntry((current) => ({
      ...current,
      ...patch,
    }) as AdminMobileEntry);
  };

  const runAutoExtract = async (mode: "text" | "url") => {
    const sourceText = extractSourceText.trim();
    const sourceUrl = extractSourceUrl.trim();

    if (mode === "url" && !sourceUrl) {
      setExtractError("Paste a public URL first.");
      setExtractNotice("");
      setExtractorOpen(true);
      return;
    }

    if (mode === "text" && !sourceText) {
      setExtractError("Paste source text first.");
      setExtractNotice("");
      setExtractorOpen(true);
      return;
    }

    setExtractMode(mode);
    setExtractError("");
    setExtractNotice("");
    setExtractorOpen(true);

    try {
      const response = await fetch("/api/admin/auto-extract", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection,
          sourceText: mode === "text" ? sourceText : "",
          sourceUrl: mode === "url" ? sourceUrl : "",
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = adminLoginUrl;
        return;
      }

      const result = (await response.json()) as {
        data?: Record<string, unknown>;
        error?: string;
        mode?: string;
        reason?: string;
        resolvedSourceUrl?: string;
        sourceText?: string;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.data) {
        throw new Error(result.error || "Auto extraction failed.");
      }

      if (typeof result.sourceText === "string" && result.sourceText.trim()) {
        setExtractSourceText(result.sourceText.trim());
      }

      if (typeof result.resolvedSourceUrl === "string" && result.resolvedSourceUrl.trim()) {
        setExtractSourceUrl(result.resolvedSourceUrl.trim());
      }

      const appliedResult =
        editorEntry.collection === "jobs"
          ? applyJobExtractedData(editorEntry, result.data)
          : applyBlogExtractedData(editorEntry, result.data);

      setEditorEntry(appliedResult.entry);

      const resultMode =
        typeof result.mode === "string" && result.mode.trim()
          ? result.mode.trim()
          : mode === "url"
            ? "remote"
            : "unknown";

      let nextNotice =
        appliedResult.updatedCount > 0
          ? `Updated ${appliedResult.updatedCount} field${
              appliedResult.updatedCount === 1 ? "" : "s"
            } (${resultMode}).`
          : `No new fields were updated (${resultMode}).`;

      if (resultMode === "fallback" && typeof result.reason === "string" && result.reason.trim()) {
        nextNotice += ` ${result.reason.trim()}`;
      }

      setExtractNotice(nextNotice);
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Auto extraction failed.",
      );
    } finally {
      setExtractMode("");
    }
  };

  const saveEntry = async (draft: boolean) => {
    if (!mobilePublishingReady) {
      setFormError(mobilePublishingError);
      setFormNotice("");
      return;
    }

    setSaveMode(draft ? "draft" : "publish");
    setFormError("");
    setFormNotice("");

    try {
      const nextEntry = {
        ...editorEntry,
        draft,
      };

      const response = await fetch("/api/admin/mobile/entry", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection,
          originalSlug,
          entry: nextEntry,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = adminLoginUrl;
        return;
      }

      const result = (await response.json()) as {
        entry?: AdminMobileEntry;
        error?: string;
        issues?: string[];
        record?: AdminMobileRecord;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.entry || !result.record) {
        const issuesText = Array.isArray(result.issues) ? result.issues.join(" ") : "";
        throw new Error([result.error, issuesText].filter(Boolean).join(" ") || "Save failed.");
      }

      const nextRecord = result.record;
      setRecordsByCollection((current) => {
        const existingRecords = current[collection].filter(
          (record) => record.slug !== originalSlug && record.slug !== nextRecord.slug,
        );

        return {
          ...current,
          [collection]: [nextRecord, ...existingRecords].sort((firstRecord, secondRecord) =>
            secondRecord.date.localeCompare(firstRecord.date),
          ),
        };
      });

      if (!draft && collection === "jobs" && result.entry.collection === "jobs") {
        setPublishedJobShare(buildPublishedJobShare(result.entry));
        resetEditorForNewEntry("jobs", {
          notice: "Published successfully. New job form is ready.",
          clearExtractorInputs: true,
          preservePublishedJobShare: true,
          resetSearch: true,
          nextJobListMode: "recent",
        });
        return;
      }

      setEditorEntry(result.entry);
      setOriginalSlug(result.entry.slug);
      setFormNotice(draft ? "Draft saved." : "Published successfully.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save entry.");
    } finally {
      setSaveMode("");
    }
  };

  const uploadImage = async (file: File) => {
    if (!mobilePublishingReady) {
      setFormError(mobilePublishingError);
      setFormNotice("");
      return;
    }

    setUploading(true);
    setFormError("");
    setFormNotice("");

    try {
      const formData = new FormData();
      formData.set("collection", collection);
      formData.set("file", file);

      const response = await fetch("/api/admin/mobile/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = adminLoginUrl;
        return;
      }

      const result = (await response.json()) as {
        error?: string;
        success?: boolean;
        url?: string;
      };

      if (!response.ok || result.success === false || !result.url) {
        throw new Error(result.error || "Upload failed.");
      }

      setUploadedAssetUrl(result.url);
      setFormNotice("Image uploaded.");
      if (editorEntry.collection === "blogs" && !editorEntry.coverImage) {
        updateEntry({ coverImage: result.url } as Partial<AdminMobileBlogEntry>);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const deleteEntry = async () => {
    if (!mobilePublishingReady) {
      setFormError(mobilePublishingError);
      setFormNotice("");
      return;
    }

    if (!originalSlug) {
      return;
    }

    const entryLabel = editorEntry.title.trim() || originalSlug;
    const confirmed = window.confirm(`Delete "${entryLabel}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletePending(true);
    setFormError("");
    setFormNotice("");

    try {
      const response = await fetch(
        `/api/admin/mobile/entry?collection=${collection}&slug=${encodeURIComponent(originalSlug)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.href = adminLoginUrl;
        return;
      }

      const result = (await response.json()) as {
        error?: string;
        slug?: string;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.slug) {
        throw new Error(result.error || "Delete failed.");
      }

      setRecordsByCollection((current) => ({
        ...current,
        [collection]: current[collection].filter((record) => record.slug !== result.slug),
      }));
      setEditorEntry(buildEmptyEntry(collection));
      setOriginalSlug("");
      setUploadedAssetUrl("");
      setExtractError("");
      setExtractNotice("");
      setFormNotice("Entry deleted.");
      setEditorOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to delete entry.");
    } finally {
      setDeletePending(false);
    }
  };

  const copyUploadedAsset = async () => {
    if (!uploadedAssetUrl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(uploadedAssetUrl);
      setFormNotice("Image URL copied.");
    } catch {
      setFormNotice("Image uploaded.");
    }
  };

  const insertUploadedAsset = () => {
    if (!uploadedAssetUrl) {
      return;
    }

    updateEntry({
      body: `${editorEntry.body.trim()}\n\n![Image](${uploadedAssetUrl})\n`.trim(),
    } as Partial<AdminMobileEntry>);
    setFormNotice("Image markdown inserted.");
  };

  const resetExtractorInputs = () => {
    setExtractSourceUrl("");
    setExtractSourceText("");
    setExtractError("");
    setExtractNotice("");
  };
  const copyPublishedJobShare = async () => {
    if (!publishedJobWhatsappText || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publishedJobWhatsappText);
      setFormNotice("WhatsApp message copied.");
    } catch {
      setFormNotice("Copy failed. You can still open WhatsApp directly.");
    }
  };
  const copyBatchJobShare = async (text: string, sectionTitle: string) => {
    if (!text || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setFormNotice(`${sectionTitle} WhatsApp message copied.`);
    } catch {
      setFormNotice("Copy failed. You can still open WhatsApp directly.");
    }
  };

  const activeTitle =
    editorEntry.collection === "jobs"
      ? editorEntry.title || "New job"
      : editorEntry.title || "New blog";
  const extractorEntityLabel = collection === "jobs" ? "job" : "blog";
  const renderRecordButton = (record: AdminMobileRecord) => {
    const activityDate = getRecordActivityDate(record);
    const primaryDateLabel =
      collection === "jobs" && activityDate ? `Updated ${activityDate}` : record.date || "No date";
    const secondaryDateLabel =
      collection === "jobs" && activityDate && record.date && activityDate !== record.date
        ? `Published ${record.date}`
        : "";

    return (
      <button
        key={`${collection}-${record.slug}`}
        type="button"
        onClick={() => openExistingEntry(collection, record.slug)}
        className={cn(
          "block w-full rounded-[1rem] border px-4 py-3 text-left transition",
          editorOpen && originalSlug === record.slug
            ? "border-teal-300 bg-teal-50 shadow-sm"
            : "border-slate-200 bg-white shadow-[0_10px_24px_-24px_rgba(15,23,42,0.45)] hover:border-teal-200 hover:bg-slate-50",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{record.title || "Untitled"}</p>
            <p className="mt-1 text-xs text-slate-500">{formatRecordMeta(record)}</p>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
              record.draft
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800",
            )}
          >
            {record.draft ? "Draft" : "Live"}
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3 text-xs text-slate-500">
          <div className="min-w-0">
            <span className="block">{primaryDateLabel}</span>
            {secondaryDateLabel ? (
              <span className="mt-1 block text-[11px] text-slate-400">{secondaryDateLabel}</span>
            ) : null}
          </div>
          <span className="truncate text-right">{record.slug}</span>
        </div>
      </button>
    );
  };
  const renderExtractorForm = (layout: "mobile" | "desktop") => {
    const isDesktop = layout === "desktop";
    const fieldClassName = cn(
      "w-full rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50",
      isDesktop ? "px-3 py-2 text-[12px]" : "px-3 py-2.5 text-[13px]",
    );
    const statusClassName =
      extractError
        ? "text-rose-700 bg-rose-50 border-rose-200"
        : extractNotice
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-slate-600 bg-slate-50 border-slate-200";

    return (
      <div className={cn(isDesktop ? "mt-2.5 space-y-2.5" : "mt-4 space-y-4")}>
        {isDesktop ? (
          <p
            className={cn(
              "inline-flex min-h-8 items-center rounded-lg border px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              statusClassName,
            )}
          >
            {extractorStatusLabel}
          </p>
        ) : null}

        <div className={cn("grid gap-4", isDesktop ? "lg:grid-cols-1" : "")}>
          <label className="block">
            <span className={cn("block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", isDesktop ? "mb-1.5" : "mb-2")}>
              Source URL
            </span>
            <input
              type="url"
              value={extractSourceUrl}
              onChange={(event) => setExtractSourceUrl(event.target.value)}
              placeholder={
                collection === "jobs"
                  ? "https://company.com/careers/job-posting"
                  : "https://example.com/post"
              }
              className={fieldClassName}
            />
            {!isDesktop ? (
              <span className="mt-1.5 block text-[10px] leading-4 text-slate-500">
                Use a public page when you want the extractor to fetch details directly.
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className={cn("block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", isDesktop ? "mb-1.5" : "mb-2")}>
              Source text
            </span>
            <textarea
              value={extractSourceText}
              onChange={(event) => setExtractSourceText(event.target.value)}
              rows={isDesktop ? 3 : 5}
              placeholder={
                collection === "jobs"
                  ? "Paste complete job details text here if you are not using a URL."
                  : "Paste complete blog content/details here if you are not using a URL."
              }
              className={cn(fieldClassName, isDesktop ? "min-h-[84px] max-h-[104px]" : "min-h-[132px]")}
            />
            {!isDesktop ? (
              <span className="mt-1.5 block text-[10px] leading-4 text-slate-500">
                Best for copied job descriptions, hiring notes, or article drafts.
              </span>
            ) : null}
          </label>
        </div>

        {extractError ? (
          <p
            className={cn(
              "rounded-xl border border-rose-200 bg-rose-50 text-rose-700",
              isDesktop ? "px-3 py-2 text-[13px] leading-5" : "px-3 py-2.5 text-[13px] leading-5",
            )}
          >
            {extractError}
          </p>
        ) : null}

        {extractNotice ? (
          <p
            className={cn(
              "rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700",
              isDesktop ? "px-3 py-2 text-[13px] leading-5" : "px-3 py-2.5 text-[13px] leading-5",
            )}
          >
            {extractNotice}
          </p>
        ) : null}

        <div
          className={cn(
            isDesktop
              ? "flex flex-wrap gap-2"
              : "grid grid-cols-3 gap-2",
          )}
        >
          <button
            type="button"
            disabled={extractMode !== ""}
            onClick={() => runAutoExtract("url")}
            className={cn(
              "inline-flex items-center justify-center rounded-xl font-semibold text-white transition whitespace-nowrap",
              isDesktop ? "min-h-9 px-3 text-[12px]" : "min-h-10 px-2 text-[11px]",
              extractMode !== ""
                ? "cursor-not-allowed bg-slate-300"
                : "bg-slate-900 hover:bg-slate-800",
            )}
          >
            {extractMode === "url"
              ? isDesktop
                ? "Fetching URL..."
                : "Fetching..."
              : isDesktop
                ? "Fetch URL + Extract"
                : "Fetch URL"}
          </button>
          <button
            type="button"
            disabled={extractMode !== ""}
            onClick={() => runAutoExtract("text")}
            className={cn(
              "inline-flex items-center justify-center rounded-xl font-semibold text-white transition whitespace-nowrap",
              isDesktop ? "min-h-9 px-3 text-[12px]" : "min-h-10 px-2 text-[11px]",
              extractMode !== ""
                ? "cursor-not-allowed bg-teal-300"
                : "bg-teal-700 hover:bg-teal-800",
            )}
          >
            {extractMode === "text"
              ? "Extracting..."
              : isDesktop
                ? "Auto Extract Text"
                : "Extract Text"}
          </button>
          <button
            type="button"
            disabled={extractMode !== ""}
            onClick={resetExtractorInputs}
            className={cn(
              "inline-flex items-center justify-center rounded-xl border font-semibold transition whitespace-nowrap",
              isDesktop ? "min-h-9 px-3 text-[12px]" : "min-h-10 px-2 text-[11px]",
              extractMode !== ""
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
            )}
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      data-admin-mobile-root
      className="min-h-[100dvh] w-full overflow-x-clip px-2 py-2 sm:px-4 sm:py-4 lg:px-6"
    >
      <section className="mx-auto w-full max-w-full overflow-x-clip rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.3)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 sm:px-6 lg:px-7">
          <div className="flex items-start justify-between gap-3 lg:items-center">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
                Admin
              </p>
              <h1 className="mt-1 text-[1.85rem] font-semibold leading-tight tracking-[-0.02em] text-slate-900">
                {collection === "jobs" ? "Jobs workspace" : "Blogs workspace"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activeRecords.length} {collection} • {activeDraftCount} drafts • {totalDrafts} total drafts
              </p>
            </div>

            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
              >
                {accountInitial}
              </button>

              {accountMenuOpen ? (
                <div className="absolute top-[calc(100%+0.6rem)] right-0 z-20 w-[15.5rem] rounded-[1rem] border border-slate-200 bg-white p-3 shadow-[0_20px_40px_-26px_rgba(15,23,42,0.35)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Signed In
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                    {adminEmail}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
                    >
                      Open Live Site
                    </a>
                    <a
                      href={adminBasePath}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open Admin Home
                    </a>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: adminLoginUrl })}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid min-h-[calc(100dvh-7rem)] min-w-0 max-w-full gap-0 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[344px_minmax(0,1fr)]">
          <aside
            className={cn(
              "min-w-0 max-w-full border-b border-slate-200 bg-slate-50/90 p-4 lg:border-r lg:border-b-0 lg:p-5",
              editorOpen ? "hidden lg:block" : "block",
            )}
          >
            <div className="w-full max-w-full rounded-[1rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Workspace
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">
                    Entries
                  </h2>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {activeDraftCount} drafts
                </span>
              </div>

              <button
                type="button"
                onClick={() => openNewEntry(collection)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                New {collection === "jobs" ? "Job" : "Blog"}
              </button>
            </div>

            <div className="mt-4 w-full max-w-full rounded-[1rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                {(["jobs", "blogs"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCollection(item);
                      setSearchValue("");
                      setPublishedJobShare(null);
                      setExtractError("");
                      setExtractNotice("");
                      if (editorEntry.collection !== item) {
                        setEditorEntry(buildEmptyEntry(item));
                        setOriginalSlug("");
                        setUploadedAssetUrl("");
                        setFormError("");
                        setFormNotice("");
                      }
                    }}
                    className={cn(
                      "min-h-11 min-w-0 flex-1 rounded-lg px-4 text-sm font-semibold transition",
                      collection === item
                        ? "bg-teal-700 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {item === "jobs" ? "Jobs" : "Blogs"}
                  </button>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search
                </span>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                />
              </label>

              {collection === "jobs" ? (
                <div className="mt-4 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Quick Access
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      {
                        mode: "recent" as const,
                        label: "Last 2 days",
                        count: todayJobCount + yesterdayJobCount,
                      },
                      {
                        mode: "threeDays" as const,
                        label: "Last 3 days",
                        count: threeDayJobCount,
                      },
                      {
                        mode: "today" as const,
                        label: "Today",
                        count: todayJobCount,
                      },
                      {
                        mode: "yesterday" as const,
                        label: "Yesterday",
                        count: yesterdayJobCount,
                      },
                      {
                        mode: "all" as const,
                        label: "All jobs",
                        count: recordsByCollection.jobs.length,
                      },
                    ].map((option) => (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => setJobListMode(option.mode)}
                        className={cn(
                          "flex min-h-11 min-w-0 items-center justify-between rounded-xl border px-3 text-sm font-semibold transition",
                          option.mode === "all" && "col-span-2",
                          jobListMode === option.mode
                            ? "border-teal-300 bg-teal-50 text-teal-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-slate-100",
                        )}
                      >
                        <span className="min-w-0 truncate">{option.label}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            jobListMode === option.mode
                              ? "bg-white text-teal-700"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {option.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Category Filter
                      </p>
                      {jobCategoryFilter !== "all" ? (
                        <button
                          type="button"
                          onClick={() => setJobCategoryFilter("all")}
                          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 transition hover:text-teal-800"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "all" as const,
                          label: "All",
                          count: jobCategoryCounts.all,
                        },
                        {
                          id: "internships" as const,
                          label: "Internships",
                          count: jobCategoryCounts.internships,
                        },
                        {
                          id: "freshers" as const,
                          label: "Freshers",
                          count: jobCategoryCounts.freshers,
                        },
                        {
                          id: "experienced" as const,
                          label: "Experienced",
                          count: jobCategoryCounts.experienced,
                        },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setJobCategoryFilter(option.id)}
                          className={cn(
                            "flex min-h-11 min-w-0 items-center justify-between rounded-xl border px-3 text-sm font-semibold transition",
                            jobCategoryFilter === option.id
                              ? "border-teal-300 bg-teal-50 text-teal-800"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-slate-100",
                          )}
                        >
                          <span className="min-w-0 truncate">{option.label}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              jobCategoryFilter === option.id
                                ? "bg-white text-teal-700"
                                : "bg-white text-slate-600",
                            )}
                          >
                            {option.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Batch WhatsApp
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {shareableJobRecords.length} live job
                          {shareableJobRecords.length === 1 ? "" : "s"} ready from{" "}
                          {batchJobShareScopeLabel}.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Each bulk WhatsApp message uses the latest {maxBatchJobShareRecords} jobs
                          per section.
                        </p>
                        {batchJobShareDraftCount > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {batchJobShareDraftCount} draft job
                            {batchJobShareDraftCount === 1 ? "" : "s"} excluded from sharing.
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => setBatchJobShareOpen((current) => !current)}
                        disabled={!hasBatchJobShareSections}
                        className={cn(
                          "inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition",
                          hasBatchJobShareSections
                            ? "bg-teal-700 text-white hover:bg-teal-800"
                            : "cursor-not-allowed bg-slate-200 text-slate-500",
                        )}
                      >
                        {batchJobShareOpen ? "Hide" : "Prepare"}
                      </button>
                    </div>

                    {batchJobShareOpen ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setBatchJobShareUsesEmojis((current) => !current)
                            }
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            {batchJobShareUsesEmojis ? "Emojis On" : "Emojis Off"}
                          </button>
                        </div>

                        {batchJobShareSections
                          .filter((section) => section.records.length > 0)
                          .map((section) => {
                            const sectionWhatsappText = buildBatchJobWhatsappText(
                              section,
                              batchJobShareScopeLabel,
                              batchJobShareUsesEmojis,
                            );
                            const sectionWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                              sectionWhatsappText,
                            )}`;

                            return (
                              <div
                                key={section.id}
                                className={cn(
                                  "rounded-xl border bg-slate-50 p-3 transition",
                                  jobCategoryFilter === section.id
                                    ? "border-teal-300 bg-teal-50/60"
                                    : "border-slate-200",
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {section.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {section.description}
                                    </p>
                                    {section.totalRecords > section.records.length ? (
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        Showing the latest {section.records.length} jobs in this
                                        message.
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setJobCategoryFilter((current) =>
                                          current === section.id ? "all" : section.id,
                                        )
                                      }
                                      className={cn(
                                        "inline-flex min-h-9 items-center justify-center rounded-lg border px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                                        jobCategoryFilter === section.id
                                          ? "border-teal-300 bg-white text-teal-700"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700",
                                      )}
                                    >
                                      {jobCategoryFilter === section.id ? "Showing" : "Show in list"}
                                    </button>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                      {section.totalRecords}
                                    </span>
                                  </div>
                                </div>

                                <label className="mt-3 block">
                                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    WhatsApp message
                                  </span>
                                  <textarea
                                    readOnly
                                    value={sectionWhatsappText}
                                    rows={Math.min(
                                      16,
                                      Math.max(7, section.records.length * 3),
                                    )}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none"
                                  />
                                </label>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyBatchJobShare(
                                        sectionWhatsappText,
                                        section.title,
                                      )
                                    }
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    Copy {section.title}
                                  </button>
                                  <a
                                    href={sectionWhatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                                  >
                                    Open WhatsApp
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  {displayedRecordsCount} shown
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  {collection === "jobs" ? recordsByCollection.jobs.length : recordsByCollection.blogs.length} total
                </div>
              </div>
            </div>

            {recordsError ? (
              <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {recordsError}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              {collection === "jobs" && jobCategoryFilter !== "all" ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                  <p>
                    Showing <span className="font-semibold">{getJobCategoryFilterLabel(jobCategoryFilter)}</span>{" "}
                    jobs from the current date filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setJobCategoryFilter("all")}
                    className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 transition hover:text-teal-800"
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              {recordsLoading[collection] ? (
                <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Loading {collection}...
                </p>
              ) : null}

              {!recordsLoading[collection] &&
              collection !== "jobs" &&
              filteredRecords.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                  No {collection} found for this filter.
                </p>
              ) : null}

              {collection === "jobs" && jobListMode !== "all" ? (
                <div className="space-y-4">
                  {filteredVisibleJobSections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {section.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          {section.records.length}
                        </span>
                      </div>

                      {section.records.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                          {section.emptyMessage}
                        </p>
                      ) : (
                        section.records.map((record) => renderRecordButton(record))
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {!recordsLoading[collection] &&
                  collection === "jobs" &&
                  filteredJobRecordsByCategory.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                      {jobCategoryFilter === "all"
                        ? "No jobs found for this filter."
                        : `No ${getJobCategoryFilterLabel(jobCategoryFilter).toLowerCase()} jobs found for this filter.`}
                    </p>
                  ) : null}

                  {collection === "jobs"
                    ? filteredJobRecordsByCategory.map((record) => renderRecordButton(record))
                    : filteredRecords.map((record) => renderRecordButton(record))}
                </>
              )}
            </div>
          </aside>

          <section
            className={cn(
              "min-w-0 bg-slate-50/60 px-4 py-4 sm:px-6 sm:py-5 lg:px-7",
              editorOpen ? "block" : "hidden lg:block",
              extractorOpen ? "lg:pr-[17rem] xl:pr-[18.5rem]" : "",
            )}
          >
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
                  editorOpen
                    ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100",
                )}
              >
                {editorOpen ? "Back to entries" : "Browse entries"}
              </button>

              <button
                type="button"
                onClick={() => openNewEntry(collection)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                New
              </button>
            </div>

            <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)] sm:p-5 lg:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {collection === "jobs" ? "Job editor" : "Blog editor"}
                  </p>
                  <h2 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900">
                    {activeTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editorEntry.collection === "jobs"
                      ? "Write the full job post once, then save draft or publish."
                      : "Write the article, upload the cover image, then publish from the same screen."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
                      editorEntry.draft
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800",
                    )}
                  >
                    {editorEntry.draft ? "Draft" : "Published"}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {editorEntry.slug || "new-entry"}
                  </span>
                </div>
              </div>

              {formError ? (
                <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </p>
              ) : null}

              {!mobilePublishingReady ? (
                <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <p className="font-semibold">Publishing is unavailable on this deployment.</p>
                  <p className="mt-1">
                    Set <code>ADMIN_CONTENTS_TOKEN</code> in production and redeploy to enable
                    save, upload, and delete from <code>{adminBasePath}</code>.
                  </p>
                  <a
                    href={adminBasePath}
                    className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                  >
                    Open Admin Home
                  </a>
                </div>
              ) : null}

              {formNotice ? (
                <p className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formNotice}
                </p>
              ) : null}

              {publishedJobShare ? (
                <div className="mt-4 rounded-[1rem] border border-teal-200 bg-teal-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                        WhatsApp Share
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {publishedJobShare.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{publishedJobShare.company}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPublishedJobShareUsesEmojis((current) => !current)
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {publishedJobShareUsesEmojis ? "Emojis On" : "Emojis Off"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPublishedJobShare(null)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-700">{publishedJobSummary}</p>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Job link</p>
                    <a
                      href={publishedJobShare.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-teal-700 underline underline-offset-2"
                    >
                      {publishedJobShare.jobUrl}
                    </a>
                  </div>

                  <label className="mt-3 block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      WhatsApp message
                    </span>
                    <textarea
                      readOnly
                      value={publishedJobWhatsappText}
                      rows={9}
                      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                  </label>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={copyPublishedJobShare}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Copy Message
                    </button>
                    <a
                      href={publishedJobWhatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Open WhatsApp
                    </a>
                  </div>
                </div>
              ) : null}

              {entryLoading ? (
                <p className="mt-4 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Loading entry...
                </p>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Title
                      </span>
                      <input
                        type="text"
                        value={editorEntry.title}
                        onChange={(event) => updateEntry({ title: event.target.value })}
                        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                        placeholder={
                          editorEntry.collection === "jobs"
                            ? "Software Engineer"
                            : "AI roadmap for freshers"
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Publish date
                      </span>
                      <input
                        type="date"
                        value={editorEntry.date}
                        onChange={(event) => updateEntry({ date: event.target.value })}
                        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                      />
                    </label>
                  </div>

                  {editorEntry.collection === "jobs" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Company
                          </span>
                          <input
                            type="text"
                            value={editorEntry.company}
                            onChange={(event) => updateEntry({ company: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Capgemini"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Location
                          </span>
                          <input
                            type="text"
                            value={editorEntry.location}
                            onChange={(event) => updateEntry({ location: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Bangalore, India"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Work mode
                          </span>
                          <input
                            type="text"
                            value={editorEntry.workMode}
                            onChange={(event) => updateEntry({ workMode: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Remote, Hybrid, On-site"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Employment type
                          </span>
                          <input
                            type="text"
                            value={editorEntry.employmentType}
                            onChange={(event) =>
                              updateEntry({ employmentType: event.target.value })
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Full-time"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Salary
                          </span>
                          <input
                            type="text"
                            value={editorEntry.salary}
                            onChange={(event) => updateEntry({ salary: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="6-8 LPA"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Experience
                          </span>
                          <input
                            type="text"
                            value={editorEntry.experience}
                            onChange={(event) => updateEntry({ experience: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="1-3 years"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Apply link
                          </span>
                          <input
                            type="url"
                            value={editorEntry.applyLink}
                            onChange={(event) => updateEntry({ applyLink: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="https://company.com/jobs/apply"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Application start
                          </span>
                          <input
                            type="date"
                            value={editorEntry.applicationStartDate}
                            onChange={(event) =>
                              updateEntry({ applicationStartDate: event.target.value })
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Application end
                          </span>
                          <input
                            type="date"
                            value={editorEntry.applicationEndDate}
                            onChange={(event) =>
                              updateEntry({ applicationEndDate: event.target.value })
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Working days
                          </span>
                          <input
                            type="text"
                            value={editorEntry.workingDays}
                            onChange={(event) => updateEntry({ workingDays: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Monday-Friday"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Job timing
                        </span>
                        <input
                          type="text"
                          value={editorEntry.jobTiming}
                          onChange={(event) => updateEntry({ jobTiming: event.target.value })}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="9:30 AM - 6:30 PM"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Eligibility criteria
                        </span>
                        <textarea
                          value={editorEntry.eligibilityCriteria}
                          onChange={(event) =>
                            updateEntry({ eligibilityCriteria: event.target.value })
                          }
                          rows={4}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="One point per line"
                        />
                      </label>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Education
                          </span>
                          <textarea
                            value={listToText(editorEntry.education)}
                            onChange={(event) =>
                              updateEntry({ education: textToList(event.target.value) })
                            }
                            rows={6}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="B.Tech&#10;MCA"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Skills
                          </span>
                          <textarea
                            value={listToText(editorEntry.skills)}
                            onChange={(event) =>
                              updateEntry({ skills: textToList(event.target.value) })
                            }
                            rows={6}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="React&#10;TypeScript&#10;SQL"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Responsibilities
                          </span>
                          <textarea
                            value={listToText(editorEntry.responsibilities)}
                            onChange={(event) =>
                              updateEntry({ responsibilities: textToList(event.target.value) })
                            }
                            rows={6}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Build APIs&#10;Collaborate with design"
                          />
                        </label>
                      </div>

                    </>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Topic
                          </span>
                          <input
                            type="text"
                            value={editorEntry.topic}
                            onChange={(event) => updateEntry({ topic: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Career Growth"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Author
                          </span>
                          <input
                            type="text"
                            value={editorEntry.author}
                            onChange={(event) => updateEntry({ author: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Hassan Usmani"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Summary
                        </span>
                        <textarea
                          value={editorEntry.summary}
                          onChange={(event) => updateEntry({ summary: event.target.value })}
                          rows={3}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="Short summary for cards and previews."
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Tags
                        </span>
                        <textarea
                          value={listToText(editorEntry.tags)}
                          onChange={(event) => updateEntry({ tags: textToList(event.target.value) })}
                          rows={4}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="ai&#10;roadmap&#10;career growth"
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Cover image URL
                          </span>
                          <input
                            type="url"
                            value={editorEntry.coverImage}
                            onChange={(event) => updateEntry({ coverImage: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="/uploads/cover-image.jpg"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Trending
                          </span>
                          <button
                            type="button"
                            onClick={() => updateEntry({ isTrending: !editorEntry.isTrending })}
                            className={cn(
                              "flex min-h-[52px] w-full items-center justify-between rounded-[1rem] border px-4 text-sm font-semibold transition",
                              editorEntry.isTrending
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-slate-200 bg-white text-slate-600",
                            )}
                          >
                            <span>{editorEntry.isTrending ? "Trending enabled" : "Trending off"}</span>
                            <span>{editorEntry.isTrending ? "On" : "Off"}</span>
                          </button>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            CTA label
                          </span>
                          <input
                            type="text"
                            value={editorEntry.ctaLabel}
                            onChange={(event) => updateEntry({ ctaLabel: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Apply now"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            CTA link
                          </span>
                          <input
                            type="url"
                            value={editorEntry.ctaLink}
                            onChange={(event) => updateEntry({ ctaLink: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="https://example.com"
                          />
                        </label>
                      </div>

                      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Image upload</p>
                            <p className="text-sm text-slate-500">
                              Upload once, then use it as the cover image or insert it into the article.
                            </p>
                          </div>
                          <label
                            className={cn(
                              "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white transition",
                              uploadDisabled
                                ? "cursor-not-allowed bg-slate-300"
                                : "cursor-pointer bg-teal-700 hover:bg-teal-800",
                            )}
                          >
                            {uploading ? "Uploading..." : "Upload image"}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                              className="hidden"
                              disabled={uploadDisabled}
                              onChange={(event) => {
                                const nextFile = event.target.files?.[0];
                                if (nextFile) {
                                  uploadImage(nextFile);
                                }

                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {editorEntry.coverImage ? (
                          <div className="mt-4 overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50">
                            <div
                              aria-hidden="true"
                              className="h-48 w-full bg-cover bg-center"
                              style={{ backgroundImage: `url("${editorEntry.coverImage}")` }}
                            />
                          </div>
                        ) : null}

                        {uploadedAssetUrl ? (
                          <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-medium break-all text-emerald-800">
                              {uploadedAssetUrl}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateEntry({ coverImage: uploadedAssetUrl })}
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                              >
                                Use as cover
                              </button>
                              <button
                                type="button"
                                onClick={insertUploadedAsset}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                              >
                                Insert in article
                              </button>
                              <button
                                type="button"
                                onClick={copyUploadedAsset}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Copy URL
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Article markdown
                        </span>
                        <textarea
                          value={editorEntry.body}
                          onChange={(event) => updateEntry({ body: event.target.value })}
                          rows={16}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="# Headline&#10;&#10;Start writing..."
                        />
                      </label>
                    </>
                  )}

                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50/75 p-3 shadow-sm lg:hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                          AI Extractor
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-600">
                          Auto-fill this {extractorEntityLabel} form from a URL or pasted source text.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtractorOpen((current) => !current)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {extractorOpen ? "Hide panel" : "Open panel"}
                      </button>
                    </div>

                    {extractorOpen ? renderExtractorForm("mobile") : null}
                  </div>

                  <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white px-4 pt-4 pb-2 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {canDeleteEntry ? (
                          <button
                            type="button"
                            disabled={deleteDisabled}
                            onClick={deleteEntry}
                            className={cn(
                              "inline-flex min-h-12 w-full items-center justify-center rounded-xl border px-5 text-sm font-semibold transition sm:w-auto",
                              deleteDisabled
                                ? "cursor-not-allowed border-rose-100 bg-rose-50 text-rose-300"
                                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
                            )}
                          >
                            {deletePending ? "Deleting..." : "Delete Entry"}
                          </button>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={saveDisabled}
                          onClick={() => saveEntry(true)}
                          className={cn(
                            "inline-flex min-h-12 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition",
                            saveDisabled
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                          )}
                        >
                          {saveMode === "draft" ? "Saving draft..." : "Save draft"}
                        </button>
                        <button
                          type="button"
                          disabled={saveDisabled}
                          onClick={() => saveEntry(false)}
                          className={cn(
                            "inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white shadow-[0_18px_34px_-20px_rgba(15,118,110,0.65)] transition",
                            saveDisabled
                              ? "cursor-not-allowed bg-teal-300"
                              : "bg-teal-600 hover:bg-teal-700",
                          )}
                        >
                          {saveMode === "publish" ? "Publishing..." : "Publish"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <div className="fixed right-3 bottom-5 z-30 hidden lg:block xl:right-5">
        {extractorOpen ? (
          <div
            ref={extractorPanelRef}
            className="w-[260px] rounded-[1rem] border border-slate-300 bg-white p-2.5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.28)] xl:w-[280px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-slate-900">
                  AI {collection === "jobs" ? "Job" : "Blog"} Extractor
                </p>
                <p className="mt-0.5 text-[12px] text-slate-600">
                  Paste a public URL or raw {extractorEntityLabel} text.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtractorOpen(false)}
                className="inline-flex min-h-8 items-center justify-center rounded-xl border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {renderExtractorForm("desktop")}
          </div>
        ) : (
          <button
            type="button"
            aria-label="Open AI extractor"
            onClick={() => setExtractorOpen(true)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-[12px] font-semibold text-white shadow-[0_20px_34px_-18px_rgba(15,118,110,0.6)] transition hover:bg-teal-800"
          >
            AI
          </button>
        )}
      </div>
    </div>
  );
}
