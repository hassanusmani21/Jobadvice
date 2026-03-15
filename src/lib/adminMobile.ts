export const adminCollections = ["jobs", "blogs"] as const;

export type AdminCollection = (typeof adminCollections)[number];

export type AdminMobileJobEntry = {
  collection: "jobs";
  slug: string;
  title: string;
  date: string;
  updatedAt: string;
  draft: boolean;
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
  body: string;
  preservedFields: Record<string, unknown>;
};

export type AdminMobileBlogEntry = {
  collection: "blogs";
  slug: string;
  title: string;
  date: string;
  updatedAt: string;
  draft: boolean;
  summary: string;
  topic: string;
  tags: string[];
  isTrending: boolean;
  author: string;
  coverImage: string;
  ctaLabel: string;
  ctaLink: string;
  body: string;
  preservedFields: Record<string, unknown>;
};

export type AdminMobileEntry = AdminMobileJobEntry | AdminMobileBlogEntry;

export type AdminMobileJobRecord = {
  slug: string;
  title: string;
  company: string;
  location: string;
  applyLink: string;
  date: string;
  updatedAt: string;
  draft: boolean;
};

export type AdminMobileBlogRecord = {
  slug: string;
  title: string;
  topic: string;
  date: string;
  updatedAt: string;
  draft: boolean;
};

export type AdminMobileRecord = AdminMobileJobRecord | AdminMobileBlogRecord;

export const isAdminCollection = (value: string): value is AdminCollection =>
  adminCollections.includes(value as AdminCollection);

export const getTodayDateString = () => new Date().toISOString().split("T")[0];

export const createEmptyJobEntry = (): AdminMobileJobEntry => {
  const today = getTodayDateString();

  return {
    collection: "jobs",
    slug: "",
    title: "",
    date: today,
    updatedAt: today,
    draft: true,
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
    applyLink: "",
    applicationStartDate: today,
    applicationEndDate: "",
    body: "",
    preservedFields: {},
  };
};

export const createEmptyBlogEntry = (): AdminMobileBlogEntry => {
  const today = getTodayDateString();

  return {
    collection: "blogs",
    slug: "",
    title: "",
    date: today,
    updatedAt: today,
    draft: true,
    summary: "",
    topic: "",
    tags: [],
    isTrending: false,
    author: "",
    coverImage: "",
    ctaLabel: "",
    ctaLink: "",
    body: "",
    preservedFields: {},
  };
};
