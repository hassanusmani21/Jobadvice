import type { JobPost } from "@/lib/jobs";

export const jobSegmentOrder = [
  "internships",
  "freshers",
  "experienced",
  "remote",
] as const;

export type JobSegmentSlug = (typeof jobSegmentOrder)[number];

export const isJobSegmentSlug = (value: string): value is JobSegmentSlug =>
  jobSegmentOrder.includes(value as JobSegmentSlug);

export type JobSegmentConfig = {
  slug: JobSegmentSlug;
  href: string;
  kicker: string;
  label: string;
  shortLabel: string;
  heroTitle: string;
  heroDescription: string;
  pageTitle: string;
  pageDescription: string;
  emptyTitle: string;
  emptyDescription: string;
};

const internshipPattern =
  /\b(intern|internship|apprentice|apprenticeship|co[\s-]?op|trainee intern)\b/i;
const fresherPattern =
  /\b(fresher|freshers|entry[\s-]?level|new grad|recent graduate|recent graduates|fresh graduate|fresh graduates|graduate trainee|graduate program|campus|final[\s-]?year|student(?:s)?|0\s*(?:to|-|–|—)\s*1|0\s*(?:to|-|–|—)\s*6\s*months?|0\s*years?)\b/i;
const experiencedPattern =
  /\b(experienced|experience(?:d)? professionals?|mid[\s-]?level|senior|lead|principal|architect|manager|specialist|consultant)\b/i;
const juniorTitlePattern = /\b(junior|associate|analyst|graduate|trainee|entry)\b/i;
const seniorTitlePattern =
  /\b(senior|lead|principal|architect|manager|specialist|consultant)\b/i;
const remotePattern =
  /\b(remote|work from home|wfh|telecommute|distributed|anywhere)\b/i;
const hybridPattern = /\bhybrid\b/i;

const jobSegmentConfigMap: Record<JobSegmentSlug, JobSegmentConfig> = {
  internships: {
    slug: "internships",
    href: "/jobs/internships",
    kicker: "Internship Jobs",
    label: "Internships",
    shortLabel: "Internships",
    heroTitle: "Source-checked internship openings in India",
    heroDescription:
      "Browse internship and apprentice roles with direct application links, fresher-friendly requirements, and cleaner eligibility details.",
    pageTitle: "Internship Jobs in India",
    pageDescription:
      "Explore source-checked internship jobs in India with direct apply links, role details, and fresher-friendly openings from public sources.",
    emptyTitle: "No internships found right now",
    emptyDescription:
      "Check the full jobs directory for more openings or come back after the next update.",
  },
  freshers: {
    slug: "freshers",
    href: "/jobs/freshers",
    kicker: "Fresher Jobs",
    label: "Freshers",
    shortLabel: "Freshers",
    heroTitle: "Fresher jobs with direct apply links",
    heroDescription:
      "Explore entry-level jobs, graduate roles, trainee openings, and 0-1 year opportunities curated for students and freshers in India.",
    pageTitle: "Fresher Jobs in India",
    pageDescription:
      "Find source-checked fresher jobs in India including graduate, trainee, and entry-level openings with direct application links and role details.",
    emptyTitle: "No fresher jobs found right now",
    emptyDescription:
      "Browse all jobs to widen the search or check again after the next posting batch.",
  },
  experienced: {
    slug: "experienced",
    href: "/jobs/experienced",
    kicker: "Experienced Jobs",
    label: "Experienced",
    shortLabel: "Experienced",
    heroTitle: "Experienced jobs for 1+ year and mid-level roles",
    heroDescription:
      "Browse roles that typically require prior experience, stronger skill depth, or a more specialized profile across companies in India.",
    pageTitle: "Experienced Jobs in India",
    pageDescription:
      "Browse source-checked experienced jobs in India including 1+ year, mid-level, and specialist roles with direct apply links.",
    emptyTitle: "No experienced jobs found right now",
    emptyDescription:
      "Try the full jobs page or check back after the next update cycle.",
  },
  remote: {
    slug: "remote",
    href: "/jobs/remote",
    kicker: "Remote Jobs",
    label: "Remote",
    shortLabel: "Remote",
    heroTitle: "Remote and hybrid jobs in India",
    heroDescription:
      "Explore remote-friendly and hybrid openings with direct application links, clearer work-mode signals, and updated hiring information.",
    pageTitle: "Remote Jobs in India",
    pageDescription:
      "Find source-checked remote and hybrid jobs in India with direct apply links, work-mode details, and updated role information.",
    emptyTitle: "No remote jobs found right now",
    emptyDescription:
      "Check the full jobs archive for on-site roles or come back for the next remote batch.",
  },
};

const normalizeSegmentSource = (job: JobPost) =>
  [
    job.title,
    job.company,
    job.location,
    job.workMode || "",
    job.employmentType || job.jobType || "",
    job.experience || "",
    job.experienceLevel || "",
    job.experienceYears || "",
    job.summary || "",
    job.excerpt,
  ]
    .join(" ")
    .replace(/[–—]/g, "-")
    .toLowerCase();

const extractExperienceValues = (value: string) => {
  const normalizedValue = value.toLowerCase().replace(/[–—]/g, "-");
  const usesMonths = /\bmonth/.test(normalizedValue);

  return Array.from(normalizedValue.matchAll(/\d+(?:\.\d+)?/g))
    .map((match) => Number.parseFloat(match[0]))
    .filter((item) => Number.isFinite(item))
    .map((item) => (usesMonths ? item / 12 : item));
};

export const isInternshipJob = (job: JobPost) =>
  internshipPattern.test(normalizeSegmentSource(job));

export const isRemoteJob = (job: JobPost) => {
  const normalizedValue = normalizeSegmentSource(job);
  return remotePattern.test(normalizedValue) || hybridPattern.test(normalizedValue);
};

export const isFresherJob = (job: JobPost) => {
  if (isInternshipJob(job)) {
    return false;
  }

  const normalizedValue = normalizeSegmentSource(job);
  if (fresherPattern.test(normalizedValue)) {
    return true;
  }

  if (experiencedPattern.test(normalizedValue)) {
    return false;
  }

  const experienceValues = extractExperienceValues(
    `${job.experience || ""} ${job.experienceYears || ""} ${job.experienceLevel || ""}`,
  );

  if (experienceValues.some((item) => item > 1)) {
    return false;
  }

  if (experienceValues.length > 0 && Math.max(...experienceValues) <= 1) {
    return true;
  }

  return juniorTitlePattern.test(job.title);
};

export const isExperiencedJob = (job: JobPost) => {
  if (isInternshipJob(job) || isFresherJob(job)) {
    return false;
  }

  const normalizedValue = normalizeSegmentSource(job);
  if (experiencedPattern.test(normalizedValue) || seniorTitlePattern.test(job.title)) {
    return true;
  }

  const experienceValues = extractExperienceValues(
    `${job.experience || ""} ${job.experienceYears || ""} ${job.experienceLevel || ""}`,
  );

  if (experienceValues.some((item) => item > 1)) {
    return true;
  }

  return true;
};

export const getJobSegmentConfig = (slug: JobSegmentSlug) => jobSegmentConfigMap[slug];

export const getAllJobSegmentConfigs = () =>
  jobSegmentOrder.map((slug) => jobSegmentConfigMap[slug]);

export const getPrimaryJobSegmentConfigs = () =>
  jobSegmentOrder
    .filter((slug) => slug !== "remote")
    .map((slug) => jobSegmentConfigMap[slug]);

export const getJobsForSegment = (jobs: JobPost[], slug: JobSegmentSlug) => {
  if (slug === "internships") {
    return jobs.filter(isInternshipJob);
  }

  if (slug === "freshers") {
    return jobs.filter(isFresherJob);
  }

  if (slug === "remote") {
    return jobs.filter(isRemoteJob);
  }

  return jobs.filter(isExperiencedJob);
};
