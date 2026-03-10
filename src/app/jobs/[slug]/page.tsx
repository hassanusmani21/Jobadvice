import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import JobActionButton from "@/components/JobActionButton";
import RecommendedJobs from "@/components/RecommendedJobs";
import {
  formatApplicationWindow,
  formatPostedDate,
  getAllJobs,
  getRelatedJobs,
  resolveStructuredValidThrough,
} from "@/lib/jobs";
import { siteUrl } from "@/lib/site";

type JobPageProps = {
  params: {
    slug: string;
  };
};

export const dynamicParams = false;
export const revalidate = 60 * 60;
const fallbackSlug = "__no-jobs__";

const resolveSourceHost = (applyLink: string | undefined) => {
  if (!applyLink) {
    return null;
  }

  try {
    return new URL(applyLink).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

const getCompanyInitials = (company: string) => {
  const tokens = String(company || "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "JA";
  }

  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || "")
    .join("");
};

type HeaderInfoIconProps = {
  kind:
    | "title"
    | "company"
    | "date"
    | "source"
    | "location"
    | "mode"
    | "type"
    | "experience"
    | "salary"
    | "window";
  className?: string;
};

const HeaderInfoIcon = ({
  kind,
  className = "h-4 w-4",
}: HeaderInfoIconProps) => {
  if (kind === "company") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-600`}>
        <path
          d="M4 16.2V5.8A1.8 1.8 0 0 1 5.8 4h5.4A1.8 1.8 0 0 1 13 5.8v10.4M7.2 4V2.8h2.6V4m4.2 12.2V9.4A1.4 1.4 0 0 1 15.4 8H17v8.2M3 16.2h14"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (kind === "date") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-amber-700`}>
        <path
          d="M5.2 3.5v2.2m9.6-2.2v2.2M4.4 6.2h11.2A1.4 1.4 0 0 1 17 7.6v7A1.4 1.4 0 0 1 15.6 16H4.4A1.4 1.4 0 0 1 3 14.6v-7a1.4 1.4 0 0 1 1.4-1.4Zm0 3.1H17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (kind === "source") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-sky-700`}>
        <path
          d="M10 16c3.3 0 6-2.7 6-6S13.3 4 10 4 4 6.7 4 10s2.7 6 6 6Zm0-8.5v2.7l1.9 1.4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (kind === "location") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
        <path
          d="M10 17s5-4.6 5-9a5 5 0 1 0-10 0c0 4.4 5 9 5 9Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <circle cx="10" cy="8" r="1.7" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "experience") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
        <path
          d="M10 5.1v5l3.2 1.8M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (kind === "mode") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
        <path
          d="M4.2 6.6h11.6a1.2 1.2 0 0 1 1.2 1.2v6a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 13.8v-6a1.2 1.2 0 0 1 1.2-1.2Zm3-2.1h5.6a1.2 1.2 0 0 1 1.2 1.2v.9H6v-.9a1.2 1.2 0 0 1 1.2-1.2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (kind === "type") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
        <path
          d="m3.4 7.6 6.6-3.1 6.6 3.1-6.6 3.1-6.6-3.1Zm2.4 1.8V12c0 1.6 2 2.8 4.2 2.8S14.2 13.6 14.2 12V9.4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (kind === "salary") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-amber-700`}>
        <path
          d="M10 3.5v13m3-10.2c0-1.2-1.3-2.1-3-2.1s-3 .9-3 2.1c0 1.3 1.3 2 3 2s3 .8 3 2.1-1.3 2.1-3 2.1-3-.9-3-2.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (kind === "window") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-sky-700`}>
        <path
          d="M5.2 3.5v2.2m9.6-2.2v2.2M4.4 6.2h11.2A1.4 1.4 0 0 1 17 7.6v7A1.4 1.4 0 0 1 15.6 16H4.4A1.4 1.4 0 0 1 3 14.6v-7a1.4 1.4 0 0 1 1.4-1.4Zm0 3.1H17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-teal-800`}>
      <path
        d="M4 6.8h12v7.4A1.8 1.8 0 0 1 14.2 16H5.8A1.8 1.8 0 0 1 4 14.2V6.8Zm3-2.8h6a1.8 1.8 0 0 1 1.8 1.8v1H5.2v-1A1.8 1.8 0 0 1 7 4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
};

const cityRegionCountryMap: Record<
  string,
  { locality: string; region: string; country: string }
> = {
  ahmedabad: { locality: "Ahmedabad", region: "Gujarat", country: "IN" },
  bangalore: { locality: "Bengaluru", region: "Karnataka", country: "IN" },
  bengaluru: { locality: "Bengaluru", region: "Karnataka", country: "IN" },
  chandigarh: { locality: "Chandigarh", region: "Chandigarh", country: "IN" },
  chennai: { locality: "Chennai", region: "Tamil Nadu", country: "IN" },
  coimbatore: { locality: "Coimbatore", region: "Tamil Nadu", country: "IN" },
  gurgaon: { locality: "Gurgaon", region: "Haryana", country: "IN" },
  gurugram: { locality: "Gurugram", region: "Haryana", country: "IN" },
  hyderabad: { locality: "Hyderabad", region: "Telangana", country: "IN" },
  lucknow: { locality: "Lucknow", region: "Uttar Pradesh", country: "IN" },
  mangalore: { locality: "Mangalore", region: "Karnataka", country: "IN" },
  mumbai: { locality: "Mumbai", region: "Maharashtra", country: "IN" },
  mysore: { locality: "Mysuru", region: "Karnataka", country: "IN" },
  mysuru: { locality: "Mysuru", region: "Karnataka", country: "IN" },
  "navi mumbai": { locality: "Navi Mumbai", region: "Maharashtra", country: "IN" },
  noida: { locality: "Noida", region: "Uttar Pradesh", country: "IN" },
  pune: { locality: "Pune", region: "Maharashtra", country: "IN" },
};

const placeholderValuePattern =
  /\b(optional|experience required|work mode|job timing|education)\b/i;
const remoteLocationPattern =
  /\b(remote|work from home|wfh|telecommute)\b/i;
const multipleLocationPattern =
  /\b(various|multiple|campuses|centers|possible|locations?)\b/i;
const genericSalaryPattern =
  /\b(not disclosed|competitive|best in (the )?industry|as per company|company standards|company policy|company norms|optional)\b/i;

const normalizeLocationPart = (value: string) =>
  value
    .replace(/\([^)]*\)/g, " ")
    .replace(/[–—]/g, ",")
    .replace(/\//g, ",")
    .replace(/\s+/g, " ")
    .trim();

const resolveJobAddress = (location: string) => {
  const normalizedLocation = normalizeLocationPart(location);
  if (!normalizedLocation || placeholderValuePattern.test(normalizedLocation)) {
    return null;
  }

  if (remoteLocationPattern.test(normalizedLocation)) {
    return {
      remote: true,
      country: /india/i.test(normalizedLocation) ? "IN" : "",
    };
  }

  const rawParts = normalizedLocation
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const normalizedParts = rawParts.map((part) => part.toLowerCase());
  const hasIndia = normalizedParts.some((part) => part === "india");
  const hasMultipleLocations =
    multipleLocationPattern.test(normalizedLocation) || rawParts.length > 3;

  const mappedCity = normalizedParts
    .map((part) => cityRegionCountryMap[part])
    .find(Boolean);

  const locality =
    !hasMultipleLocations && mappedCity
      ? mappedCity.locality
      : !hasMultipleLocations && rawParts.length > 0
        ? rawParts[0]
        : "";

  const region =
    mappedCity?.region ||
    rawParts.find((part) =>
      [
        "Karnataka",
        "Maharashtra",
        "Tamil Nadu",
        "Telangana",
        "Uttar Pradesh",
        "Haryana",
        "Gujarat",
        "Chandigarh",
      ].includes(part),
    ) ||
    "";

  const country = mappedCity?.country || (hasIndia ? "IN" : "");

  const address = {
    "@type": "PostalAddress",
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    ...(country ? { addressCountry: country } : {}),
  };

  if (Object.keys(address).length === 1) {
    return null;
  }

  return {
    remote: false,
    address,
  };
};

const parseNumericSalaryPart = (value: string) => {
  const normalizedValue = value.trim().toLowerCase().replace(/,/g, "");
  const match = normalizedValue.match(/^(\d+(?:\.\d+)?)([k])?$/i);
  if (!match) {
    return null;
  }

  const numericValue = Number.parseFloat(match[1]);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return match[2] ? numericValue * 1_000 : numericValue;
};

const resolveBaseSalary = (salary: string | undefined) => {
  const normalizedSalary = (salary || "").trim();
  if (!normalizedSalary || genericSalaryPattern.test(normalizedSalary)) {
    return null;
  }

  const cleanedSalary = normalizedSalary
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\(estimated[^)]*\)/g, "")
    .replace(/\(industry[^)]*\)/g, "")
    .replace(/\(based[^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const unitText = /per month|\/month|\bmonth\b/.test(cleanedSalary)
    ? "MONTH"
    : /lpa|per year|\/year|\byear\b|annual/.test(cleanedSalary)
      ? "YEAR"
      : null;

  if (!unitText) {
    return null;
  }

  const rawMatches = cleanedSalary.match(/\d+(?:\.\d+)?\s*k?/gi) || [];
  const parsedValues = rawMatches
    .map((match) => parseNumericSalaryPart(match))
    .filter((value): value is number => Number.isFinite(value));

  if (parsedValues.length === 0) {
    return null;
  }

  const normalizedValues =
    unitText === "YEAR" && /\blpa\b/.test(cleanedSalary)
      ? parsedValues.map((value) => value * 100_000)
      : parsedValues;

  if (normalizedValues.length === 1) {
    return {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        value: normalizedValues[0],
        unitText,
      },
    };
  }

  return {
    "@type": "MonetaryAmount",
    currency: "INR",
    value: {
      "@type": "QuantitativeValue",
      minValue: Math.min(...normalizedValues),
      maxValue: Math.max(...normalizedValues),
      unitText,
    },
  };
};

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  if (jobs.length === 0) {
    return [{ slug: fallbackSlug }];
  }

  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = params;
  const job = (await getAllJobs()).find((listedJob) => listedJob.slug === slug);

  if (!job) {
    return {
      title: "Job Not Found",
      description: "The requested job posting could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${job.title} at ${job.company}`;
  const description = `${job.title} opening at ${job.company}${
    job.location ? ` in ${job.location}` : ""
  }.`;
  const jobUrl = `${siteUrl}/jobs/${job.slug}/`;

  return {
    title,
    description,
    keywords: [job.title, job.company, job.location, ...job.skills],
    alternates: {
      canonical: `/jobs/${job.slug}/`,
    },
    openGraph: {
      title,
      description,
      url: jobUrl,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { slug } = params;

  if (slug === fallbackSlug) {
    notFound();
  }

  const allJobs = await getAllJobs();
  const job = allJobs.find((listedJob) => listedJob.slug === slug);

  if (!job) {
    notFound();
  }

  const isJobExpired = job.applicationStatus.state === "expired";
  const isApplicationUpcoming = job.applicationStatus.state === "upcoming";
  const hasApplyLink = Boolean(job.applyLink);
  const relatedJobs = getRelatedJobs(job, allJobs, 5);

  const employmentType = job.employmentType || job.jobType;
  const workMode = job.workMode;
  const experience = job.experience || job.experienceYears || job.experienceLevel;
  const eligibilityCriteria = job.eligibilityCriteria || "";
  const skills = job.skills;
  const responsibilities = job.responsibilities;
  const education = job.education;
  const summary = job.summary || responsibilities[0] || "";
  const schemaDescription =
    summary ||
    responsibilities.join(" ") ||
    `${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}.`;
  const sourceHost = resolveSourceHost(job.applyLink);
  const companyInitials = getCompanyInitials(job.company);
  const displayApplicationStatus =
    job.applicationStatus.state === "no_expiry"
      ? { ...job.applicationStatus, label: "Open" }
      : job.applicationStatus;
  const structuredValidThrough = resolveStructuredValidThrough(
    job.date,
    job.applicationEndDate,
  );
  const resolvedJobAddress = resolveJobAddress(job.location);
  const baseSalary = resolveBaseSalary(job.salary);
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: schemaDescription,
    ...(eligibilityCriteria ? { qualifications: eligibilityCriteria } : {}),
    datePosted: job.date,
    validThrough: structuredValidThrough,
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    ...(baseSalary ? { baseSalary } : {}),
    ...(resolvedJobAddress?.remote
      ? {
          jobLocationType: "TELECOMMUTE",
          ...(resolvedJobAddress.country
            ? {
                applicantLocationRequirements: {
                  "@type": "Country",
                  name: resolvedJobAddress.country,
                },
              }
            : {}),
        }
      : resolvedJobAddress?.address
        ? {
            jobLocation: {
              "@type": "Place",
              address: resolvedJobAddress.address,
            },
          }
        : {}),
    ...(job.applyLink ? { directApply: true } : {}),
    url: `${siteUrl}/jobs/${job.slug}/`,
    identifier: {
      "@type": "PropertyValue",
      name: job.company,
      value: job.slug,
    },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />
      <article className="space-y-6 lg:col-span-7">
        <header className="job-detail-header-surface fade-up relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,251,252,0.96)_58%,rgba(242,247,246,0.94)_100%)] px-5 py-6 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.92)] sm:px-8 sm:py-8">
          <div className="job-detail-header-top-line pointer-events-none absolute inset-x-8 top-0 h-px bg-white/80" />
          <div className="job-detail-header-accent pointer-events-none absolute -bottom-10 left-0 h-28 w-36 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.12)_0%,rgba(125,211,252,0.05)_42%,rgba(255,255,255,0)_74%)]" />

          <div className="relative z-10">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold sm:text-xs">
              <span className="job-detail-top-badge job-detail-top-badge-neutral inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100/90 px-3.5 text-slate-600">
                <HeaderInfoIcon kind="company" className="h-4 w-4" />
                <span>{job.company}</span>
              </span>
              <span className="job-detail-top-badge job-detail-top-badge-amber inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-50 px-3.5 text-amber-900">
                <HeaderInfoIcon kind="date" className="h-4 w-4" />
                <span>Posted {formatPostedDate(job.date)}</span>
              </span>
              <span className="job-detail-top-badge job-detail-top-badge-neutral inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100/90 px-3.5 text-slate-500">
                <HeaderInfoIcon kind="date" className="h-4 w-4 text-slate-400" />
                <span>Updated {formatPostedDate(job.updatedAt)}</span>
              </span>
              {sourceHost ? (
                <span className="job-detail-top-badge job-detail-top-badge-sky inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-sky-50 px-3.5 text-sky-900">
                  <HeaderInfoIcon kind="source" className="h-4 w-4" />
                  <span className="truncate">Source: {sourceHost}</span>
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex items-start gap-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-teal-50/90 ring-1 ring-teal-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                <HeaderInfoIcon kind="title" className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-[1.85rem] font-semibold leading-[1.15] text-slate-900 sm:text-[2rem]">
                  {job.title}
                </h1>

                <div className="mt-4 flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(186,230,253,0.95),rgba(153,246,228,0.92))] text-sm font-semibold tracking-wide text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    {companyInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[1rem] font-semibold leading-tight text-slate-800">
                      {job.company}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Verified listing with direct application source
                    </p>
                  </div>
                </div>

                {summary ? (
                  <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
                    {summary}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-slate-700">
              {job.location ? (
                <span className="job-detail-meta-chip job-detail-meta-chip-neutral inline-flex items-center gap-2 rounded-full bg-white/82 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-200/75">
                  <HeaderInfoIcon kind="location" className="h-4 w-4 text-slate-400" />
                  <span>{job.location}</span>
                </span>
              ) : null}
              {workMode ? (
                <span className="job-detail-meta-chip job-detail-meta-chip-neutral inline-flex items-center gap-2 rounded-full bg-white/82 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-200/75">
                  <HeaderInfoIcon kind="mode" className="h-4 w-4 text-slate-400" />
                  <span>{workMode}</span>
                </span>
              ) : null}
              {employmentType ? (
                <span className="job-detail-meta-chip job-detail-meta-chip-neutral inline-flex items-center gap-2 rounded-full bg-white/82 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-200/75">
                  <HeaderInfoIcon kind="type" className="h-4 w-4 text-slate-400" />
                  <span>{employmentType}</span>
                </span>
              ) : null}
              {experience ? (
                <span className="job-detail-meta-chip job-detail-meta-chip-neutral inline-flex items-center gap-2 rounded-full bg-white/82 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-200/75">
                  <HeaderInfoIcon kind="experience" className="h-4 w-4 text-slate-400" />
                  <span>{experience}</span>
                </span>
              ) : null}
              {job.salary ? (
                <span className="job-detail-meta-chip job-detail-meta-chip-amber inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-2 text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] ring-1 ring-amber-200/80">
                  <HeaderInfoIcon kind="salary" className="h-4 w-4" />
                  <span>{job.salary}</span>
                </span>
              ) : null}
              <span className="job-detail-meta-chip job-detail-meta-chip-sky inline-flex items-center gap-2 rounded-full bg-sky-50/85 px-3.5 py-2 text-sky-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] ring-1 ring-sky-200/75">
                <HeaderInfoIcon kind="window" className="h-4 w-4" />
                <span>{formatApplicationWindow(job.applicationStartDate, job.applicationEndDate)}</span>
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/75 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <ApplicationStatusBadge status={displayApplicationStatus} className="text-[11px]" />
              </div>

              {isJobExpired ? (
                <JobActionButton variant="danger" className="w-full sm:w-auto">
                  Job Expired
                </JobActionButton>
              ) : isApplicationUpcoming ? (
                <JobActionButton variant="info" className="w-full sm:w-auto">
                  Applications Open Soon
                </JobActionButton>
              ) : !hasApplyLink ? (
                <JobActionButton variant="muted" className="w-full sm:w-auto">
                  Apply Link Not Available
                </JobActionButton>
              ) : (
                <JobActionButton
                  href={`/api/apply/${job.slug}`}
                  external
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  Apply Now
                </JobActionButton>
              )}
            </div>
          </div>
        </header>

        {eligibilityCriteria ? (
          <section
            className="fade-up card-surface rounded-3xl px-6 py-6 sm:px-8"
            style={{ animationDelay: "105ms" }}
          >
            <h2 className="font-serif text-2xl text-slate-900">Eligibility Criteria</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{eligibilityCriteria}</p>
          </section>
        ) : null}

        {responsibilities.length > 0 ? (
          <section
            className="fade-up card-surface rounded-3xl px-6 py-6 sm:px-8"
            style={{ animationDelay: "125ms" }}
          >
            <h2 className="font-serif text-2xl text-slate-900">Responsibilities</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              {responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {skills.length > 0 ? (
          <section
            className="fade-up card-surface rounded-3xl px-6 py-6 sm:px-8"
            style={{ animationDelay: "150ms" }}
          >
            <h2 className="font-serif text-2xl text-slate-900">Skills</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-900"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section
            className="fade-up card-surface rounded-3xl px-6 py-6 sm:px-8"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="font-serif text-2xl text-slate-900">Education</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {education.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="fade-up" style={{ animationDelay: "230ms" }}>
          <JobActionButton href="/jobs" variant="secondary" className="sm:w-auto">
            Back to all jobs
          </JobActionButton>
        </div>
      </article>

      <div className="lg:col-span-3">
        <RecommendedJobs jobs={relatedJobs} />
      </div>
    </div>
  );
}
