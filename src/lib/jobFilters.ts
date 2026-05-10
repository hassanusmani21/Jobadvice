import { getJobSegmentConfig, getJobsForSegment, isJobSegmentSlug, type JobSegmentSlug } from "@/lib/jobSegments";
import type { JobPost } from "@/lib/jobs";

export type JobSortOption = "newest" | "oldest" | "closingSoon";
export type JobStatusFilter = "" | "open" | "upcoming" | "expired";

export type JobFilters = {
  query: string;
  location: string;
  segment: JobSegmentSlug | "";
  type: string;
  status: JobStatusFilter;
  sort: JobSortOption;
};

export type JobAlertFilters = {
  query: string;
  skill: string;
  jobTitles: string[];
  skills: string[];
  locations: string[];
  experienceLevels: string[];
  workModes: string[];
  segments: JobSegmentSlug[];
  type: string;
  status: JobStatusFilter;
};

type RawJobFilters = {
  query?: string | null;
  q?: string | null;
  location?: string | null;
  locations?: string[] | string | null;
  segment?: string | null;
  segments?: string[] | string | null;
  category?: string | null;
  skill?: string | null;
  skills?: string[] | string | null;
  jobTitles?: string[] | string | null;
  experienceLevels?: string[] | string | null;
  workModes?: string[] | string | null;
  type?: string | null;
  status?: string | null;
  sort?: string | null;
};

const normalizeString = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim() : "";

const normalizeStringArray = (value: string[] | string | null | undefined) => {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      rawValues
        .map((item) => normalizeString(item))
        .filter(Boolean),
    ),
  );
};

const toSortableDate = (value: string | null | undefined) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

export const isOpenStatus = (job: JobPost) =>
  ["open", "expiring_soon", "expires_today", "no_expiry"].includes(
    job.applicationStatus.state,
  );

export const normalizeJobFilters = (rawFilters: RawJobFilters = {}): JobFilters => {
  const query = normalizeString(rawFilters.query || rawFilters.q);
  const location = normalizeString(rawFilters.location);
  const segmentCandidate = normalizeString(rawFilters.segment).toLowerCase();
  const type = normalizeString(rawFilters.type);
  const statusCandidate = normalizeString(rawFilters.status).toLowerCase();
  const sortCandidate = normalizeString(rawFilters.sort);

  return {
    query,
    location,
    segment: isJobSegmentSlug(segmentCandidate) ? segmentCandidate : "",
    type,
    status:
      statusCandidate === "open" ||
      statusCandidate === "upcoming" ||
      statusCandidate === "expired"
        ? statusCandidate
        : "",
    sort:
      sortCandidate === "oldest" || sortCandidate === "closingSoon"
        ? sortCandidate
        : "newest",
  };
};

export const toJobAlertFilters = (filters: JobFilters): JobAlertFilters => ({
  query: filters.query,
  skill: "",
  jobTitles: filters.query ? [filters.query] : [],
  skills: [],
  locations: filters.location ? [filters.location] : [],
  experienceLevels: [],
  workModes: [],
  segments: filters.segment ? [filters.segment] : [],
  type: filters.type,
  status: filters.status,
});

export const normalizeJobAlertFilters = (rawFilters: Partial<JobAlertFilters> & RawJobFilters = {}) => {
  const normalizedFilters = normalizeJobFilters({
    query: rawFilters.query,
    location: rawFilters.location,
    segment: rawFilters.segment || rawFilters.category,
    type: rawFilters.type,
    status: rawFilters.status,
    sort: "newest",
  });
  const locations = normalizeStringArray(rawFilters.locations);
  const segments = normalizeStringArray(rawFilters.segments).filter(isJobSegmentSlug);
  const jobTitles = normalizeStringArray(rawFilters.jobTitles);
  const skills = normalizeStringArray(rawFilters.skills);
  const experienceLevels = normalizeStringArray(rawFilters.experienceLevels);
  const workModes = normalizeStringArray(rawFilters.workModes);
  const legacyQuery = normalizedFilters.query;
  const legacySkill = normalizeString(rawFilters.skill);

  if (normalizedFilters.location && !locations.includes(normalizedFilters.location)) {
    locations.unshift(normalizedFilters.location);
  }

  if (normalizedFilters.segment && !segments.includes(normalizedFilters.segment)) {
    segments.unshift(normalizedFilters.segment);
  }

  if (legacyQuery && !jobTitles.includes(legacyQuery)) {
    jobTitles.unshift(legacyQuery);
  }

  if (legacySkill && !skills.includes(legacySkill)) {
    skills.unshift(legacySkill);
  }

  return {
    query: legacyQuery,
    skill: legacySkill,
    jobTitles,
    skills,
    locations,
    experienceLevels,
    workModes,
    segments,
    type: normalizedFilters.type,
    status: normalizedFilters.status,
  };
};

export const hasActiveJobAlertFilters = (filters: JobAlertFilters) =>
  Boolean(
    filters.query ||
      filters.skill ||
      filters.jobTitles.length > 0 ||
      filters.skills.length > 0 ||
      filters.locations.length > 0 ||
      filters.experienceLevels.length > 0 ||
      filters.workModes.length > 0 ||
      filters.segments.length > 0 ||
      filters.type ||
      filters.status,
  );

export const matchesJobSearch = (job: JobPost, query: string) => {
  const haystack = [
    job.title,
    job.company,
    job.location,
    job.summary || "",
    job.experience || "",
    job.experienceLevel || "",
    job.eligibilityCriteria || "",
    job.employmentType || job.jobType || "",
    job.skills.join(" "),
    job.responsibilities.join(" "),
    job.education.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

const matchesJobSkill = (job: JobPost, skill: string) => {
  const haystack = [
    job.title,
    job.summary || "",
    job.excerpt,
    job.skills.join(" "),
    job.responsibilities.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(skill.toLowerCase());
};

const matchesJobTitle = (job: JobPost, title: string) =>
  job.title.toLowerCase().includes(title.toLowerCase());

const matchesJobExperienceLevel = (job: JobPost, experienceLevel: string) => {
  const haystack = [
    job.experience || "",
    job.experienceLevel || "",
    job.experienceYears || "",
    job.summary || "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(experienceLevel.toLowerCase());
};

const matchesJobWorkMode = (job: JobPost, workMode: string) =>
  (job.workMode || "").toLowerCase().includes(workMode.toLowerCase());

export const jobMatchesAlertFilters = (job: JobPost, filters: JobAlertFilters) => {
  if (filters.jobTitles.length > 0) {
    if (!filters.jobTitles.some((title) => matchesJobTitle(job, title))) {
      return false;
    }
  } else if (filters.query && !matchesJobSearch(job, filters.query)) {
    return false;
  }

  if (filters.skills.length > 0) {
    if (!filters.skills.some((skill) => matchesJobSkill(job, skill))) {
      return false;
    }
  } else if (filters.skill && !matchesJobSkill(job, filters.skill)) {
    return false;
  }

  if (
    filters.segments.length > 0 &&
    !filters.segments.some((segment) => getJobsForSegment([job], segment).length > 0)
  ) {
    return false;
  }

  if (
    filters.locations.length > 0 &&
    !filters.locations.some((location) =>
      job.location.toLowerCase().includes(location.toLowerCase()),
    )
  ) {
    return false;
  }

  if (
    filters.experienceLevels.length > 0 &&
    !filters.experienceLevels.some((experienceLevel) =>
      matchesJobExperienceLevel(job, experienceLevel),
    )
  ) {
    return false;
  }

  if (
    filters.workModes.length > 0 &&
    !filters.workModes.some((workMode) => matchesJobWorkMode(job, workMode))
  ) {
    return false;
  }

  const employmentType = (job.employmentType || job.jobType || "").toLowerCase();
  if (filters.type && employmentType !== filters.type.toLowerCase()) {
    return false;
  }

  if (filters.status === "open" && !isOpenStatus(job)) {
    return false;
  }

  if (filters.status === "upcoming" && job.applicationStatus.state !== "upcoming") {
    return false;
  }

  if (filters.status === "expired" && job.applicationStatus.state !== "expired") {
    return false;
  }

  return true;
};

export const filterJobsByAlertFilters = (jobs: JobPost[], filters: JobAlertFilters) =>
  jobs.filter((job) => jobMatchesAlertFilters(job, filters));

export const sortJobsByFilters = (jobs: JobPost[], sort: JobSortOption) =>
  [...jobs].sort((firstJob, secondJob) => {
    if (sort === "oldest") {
      return new Date(firstJob.date).getTime() - new Date(secondJob.date).getTime();
    }

    if (sort === "closingSoon") {
      return (
        toSortableDate(firstJob.applicationEndDate) -
        toSortableDate(secondJob.applicationEndDate)
      );
    }

    return new Date(secondJob.date).getTime() - new Date(firstJob.date).getTime();
  });

const summarizeList = (values: string[]) => {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} + ${values[1]}`;
  }

  return `${values[0]} + ${values.length - 1} more`;
};

export const buildJobAlertSummary = (filters: JobAlertFilters) => {
  const parts: string[] = [];

  if (filters.jobTitles.length > 0) {
    parts.push(`Titles: ${summarizeList(filters.jobTitles)}`);
  } else if (filters.query) {
    parts.push(`"${filters.query}"`);
  }

  if (filters.skills.length > 0) {
    parts.push(`Skills: ${summarizeList(filters.skills)}`);
  } else if (filters.skill) {
    parts.push(`Skill: ${filters.skill}`);
  }

  if (filters.segments.length > 0) {
    parts.push(
      summarizeList(filters.segments.map((segment) => getJobSegmentConfig(segment).shortLabel)),
    );
  }

  if (filters.locations.length > 0) {
    parts.push(summarizeList(filters.locations));
  }

  if (filters.experienceLevels.length > 0) {
    parts.push(`Experience: ${summarizeList(filters.experienceLevels)}`);
  }

  if (filters.workModes.length > 0) {
    parts.push(`Mode: ${summarizeList(filters.workModes)}`);
  }

  if (filters.type) {
    parts.push(filters.type);
  }

  if (filters.status === "open") {
    parts.push("Open now");
  }

  if (filters.status === "upcoming") {
    parts.push("Upcoming");
  }

  if (filters.status === "expired") {
    parts.push("Expired");
  }

  return parts.join(" • ") || "All Jobs";
};

export const buildJobAlertSearchParams = (filters: JobAlertFilters) => {
  const searchParams = new URLSearchParams();

  const browseQuery = [
    ...filters.jobTitles,
    ...(filters.jobTitles.length === 0 && filters.query ? [filters.query] : []),
    ...filters.skills,
    ...(filters.skills.length === 0 && filters.skill ? [filters.skill] : []),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (browseQuery) {
    searchParams.set("q", browseQuery);
  }

  if (filters.locations[0]) {
    searchParams.set("location", filters.locations[0]);
  }

  if (filters.segments[0]) {
    searchParams.set("segment", filters.segments[0]);
  }

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  return searchParams.toString();
};
