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

type JobDetailFact = {
  key: string;
  label: string;
  value: string;
  kind: HeaderInfoIconProps["kind"];
  tone: "neutral" | "accent" | "warm";
  span?: "wide" | "full";
  compact?: boolean;
};

type JobDetailHighlight = {
  key: string;
  value: string;
  kind: HeaderInfoIconProps["kind"];
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

const regionAliasMap: Record<string, string> = {
  chandigarh: "Chandigarh",
  gujarat: "Gujarat",
  haryana: "Haryana",
  karnataka: "Karnataka",
  maharashtra: "Maharashtra",
  maharastra: "Maharashtra",
  "mahārāshtra": "Maharashtra",
  tamilnadu: "Tamil Nadu",
  "tamil nadu": "Tamil Nadu",
  telangana: "Telangana",
  "uttar pradesh": "Uttar Pradesh",
};

const countryAliasMap: Record<
  string,
  { code: string; name: string }
> = {
  india: { code: "IN", name: "India" },
  "sri lanka": { code: "LK", name: "Sri Lanka" },
  "united kingdom": { code: "GB", name: "United Kingdom" },
  uk: { code: "GB", name: "United Kingdom" },
  "united states": { code: "US", name: "United States" },
  usa: { code: "US", name: "United States" },
  us: { code: "US", name: "United States" },
};

const placeholderValuePattern =
  /\b(optional|experience required|work mode|job timing|education)\b/i;
const remoteLocationPattern =
  /\b(remote|work from home|wfh|telecommute)\b/i;
const multipleLocationPattern =
  /\b(various|multiple|campuses|centers|possible|locations?)\b/i;
const genericSalaryPattern =
  /\b(not disclosed|not mentioned|not specified|competitive|best in (the )?industry|as per company|company standards|company policy|company norms|optional)\b/i;
const estimatedSalaryPattern =
  /\b(estimated|estimate|expected|approx(?:\.|imately)?|around|reported|market level|typical|from listings|based on experience|based on skills|industry estimate)\b/i;

const normalizeLocationPart = (value: string) =>
  value
    .replace(/\([^)]*\)/g, " ")
    .replace(/[–—]/g, ",")
    .replace(/\//g, ",")
    .replace(/\s+/g, " ")
    .trim();

const normalizeLocationLookupValue = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getCondensedLocation = (location: string | undefined) => {
  const primaryLocation = String(location || "").split("|")[0] || "";
  const normalizedLocation = normalizeLocationPart(primaryLocation);
  if (!normalizedLocation || placeholderValuePattern.test(normalizedLocation)) {
    return "";
  }

  if (remoteLocationPattern.test(normalizedLocation)) {
    return /india/i.test(normalizedLocation) ? "Remote, India" : "Remote";
  }

  const parts = normalizedLocation
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const visibleParts = parts.filter((part, index) => {
    const isCountrySuffix = index === parts.length - 1 && /^india$/i.test(part);
    return !isCountrySuffix;
  });

  if (visibleParts.length === 0) {
    return normalizedLocation;
  }

  if (multipleLocationPattern.test(normalizedLocation)) {
    return visibleParts[0];
  }

  return visibleParts.slice(0, 2).join(", ");
};

const resolveCountryInfo = (parts: string[]) =>
  parts
    .map((part) => countryAliasMap[normalizeLocationLookupValue(part)])
    .find(Boolean) || null;

const resolveRegionName = (parts: string[]) =>
  parts
    .map((part) => regionAliasMap[normalizeLocationLookupValue(part)])
    .find(Boolean) || "";

const resolvePostalCode = (parts: string[]) =>
  parts
    .map((part) => part.match(/\b\d{5,6}\b/)?.[0] || "")
    .find(Boolean) || "";

const resolveJobAddress = (location: string, workMode?: string) => {
  const normalizedLocation = normalizeLocationPart(location);
  if (!normalizedLocation || placeholderValuePattern.test(normalizedLocation)) {
    return null;
  }

  const rawParts = normalizedLocation
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const lookupParts = rawParts.map((part) => normalizeLocationLookupValue(part));
  const countryInfo = resolveCountryInfo(rawParts);
  const isRemoteByMode =
    /\bremote\b/i.test(workMode || "") && !/\bhybrid\b/i.test(workMode || "");

  if (remoteLocationPattern.test(normalizedLocation) || isRemoteByMode) {
    return {
      remote: true,
      countryCode: countryInfo?.code || "",
      countryName: countryInfo?.name || "",
    };
  }

  const mappedCityEntries = lookupParts
    .map((part) => cityRegionCountryMap[part])
    .filter(Boolean);
  const mappedCity = mappedCityEntries[0];
  const uniqueMappedLocalities = new Set(
    mappedCityEntries.map((entry) => entry.locality.toLowerCase()),
  );
  const cityIndex = lookupParts.findIndex((part) => Boolean(cityRegionCountryMap[part]));
  const hasMultipleLocations =
    multipleLocationPattern.test(normalizedLocation) || uniqueMappedLocalities.size > 1;

  const locality =
    !hasMultipleLocations && cityIndex >= 0 && mappedCity
      ? mappedCity.locality
      : !hasMultipleLocations && rawParts.length > 0
        ? rawParts[0]
        : "";

  const region =
    mappedCity?.region ||
    resolveRegionName(rawParts) ||
    "";

  const countryCode = countryInfo?.code || mappedCity?.country || "";
  const postalCode = !hasMultipleLocations ? resolvePostalCode(rawParts) : "";
  const streetAddress =
    !hasMultipleLocations && cityIndex > 0
      ? rawParts
          .slice(0, cityIndex)
          .filter((part) => {
            const lookupValue = normalizeLocationLookupValue(part);
            return (
              !countryAliasMap[lookupValue] &&
              !regionAliasMap[lookupValue] &&
              !/\b\d{5,6}\b/.test(part)
            );
          })
          .join(", ")
      : "";

  const address = {
    "@type": "PostalAddress",
    ...(streetAddress ? { streetAddress } : {}),
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(countryCode ? { addressCountry: countryCode } : {}),
  };

  if (Object.keys(address).length === 1) {
    return null;
  }

  return {
    remote: false,
    address,
    countryCode,
    countryName: countryInfo?.name || "",
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
  if (
    !normalizedSalary ||
    genericSalaryPattern.test(normalizedSalary) ||
    estimatedSalaryPattern.test(normalizedSalary)
  ) {
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
  const resolvedJobAddress = resolveJobAddress(job.location, workMode);
  const baseSalary = resolveBaseSalary(job.salary);
  const applicationWindow = formatApplicationWindow(
    job.applicationStartDate,
    job.applicationEndDate,
  );
  const companySourceLabel = sourceHost ? `Apply via ${sourceHost}` : "Direct application source";
  const condensedLocation = getCondensedLocation(job.location);
  const shortLocation = condensedLocation.split(",")[0]?.trim() || "";
  const shouldHighlightSalary = Boolean(job.salary && !genericSalaryPattern.test(job.salary));
  const quickHighlights = ([
    shortLocation
      ? {
          key: "location",
          value: shortLocation,
          kind: "location",
        }
      : null,
    employmentType
      ? {
          key: "employmentType",
          value: employmentType,
          kind: "type",
        }
      : null,
    experience
      ? {
          key: "experience",
          value: experience,
          kind: "experience",
        }
      : null,
    workMode
      ? {
          key: "mode",
          value: workMode,
          kind: "mode",
        }
      : null,
  ] as Array<JobDetailHighlight | null>).filter(
    (item): item is JobDetailHighlight => item !== null,
  );
  const jobDetailFacts = ([
    job.location
      ? {
          key: "location",
          label: "Location",
          value: condensedLocation || job.location,
          kind: "location",
          tone: "neutral",
          span: "wide",
        }
      : null,
    {
      key: "applicationWindow",
      label: "Application window",
      value: applicationWindow,
      kind: "window",
      tone: "accent",
      compact: true,
    },
    job.salary
      ? {
          key: "salary",
          label: "Compensation",
          value: job.salary,
          kind: "salary",
          tone: shouldHighlightSalary ? "warm" : "neutral",
        }
      : null,
  ] as Array<JobDetailFact | null>).filter(
    (item): item is JobDetailFact => item !== null,
  );
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
          ...(resolvedJobAddress.countryCode
            ? {
                applicantLocationRequirements: {
                  "@type": "Country",
                  name: resolvedJobAddress.countryName || resolvedJobAddress.countryCode,
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
        <header className="job-detail-header-surface fade-up relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,251,252,0.96)_58%,rgba(242,247,246,0.94)_100%)] px-4 py-4 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.92)] sm:px-7 sm:py-6">
          <div className="job-detail-header-top-line pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80 sm:inset-x-8" />
          <div className="job-detail-header-accent pointer-events-none absolute -bottom-10 left-0 h-28 w-36 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.12)_0%,rgba(125,211,252,0.05)_42%,rgba(255,255,255,0)_74%)]" />

          <div className="relative z-10 space-y-5">
            <div className="job-detail-hero-layout">
              <div className="min-w-0">
                <div className="job-detail-title-row">
                  <h1 className="job-detail-title break-words font-serif text-[1.4rem] font-semibold leading-[1.06] tracking-[-0.03em] text-slate-900 min-[360px]:text-[1.5rem] sm:text-[1.95rem] sm:leading-[1.06] sm:tracking-[-0.022em]">
                    {job.title}
                  </h1>

                  <div className="job-detail-top-meta flex flex-wrap gap-2 text-[11.5px] font-semibold sm:text-[12.5px]">
                    <span className="job-detail-top-badge job-detail-top-badge-neutral inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-slate-100/90 px-3.5 text-slate-600">
                      <HeaderInfoIcon kind="title" className="h-4 w-4" />
                      <span className="job-detail-top-badge-text">Verified source</span>
                    </span>
                    <span className="job-detail-top-badge job-detail-top-badge-amber inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-amber-50 px-3.5 text-amber-900">
                      <HeaderInfoIcon kind="date" className="h-4 w-4" />
                      <span className="job-detail-top-badge-text">
                        Posted {formatPostedDate(job.date)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="job-detail-heading-row">
                  <div className="job-detail-company-strip flex min-w-0 items-start gap-3">
                    <span className="job-detail-company-mark inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(186,230,253,0.95),rgba(153,246,228,0.92))] text-sm font-semibold tracking-wide text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      {companyInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="job-detail-company-name text-[1rem] font-semibold leading-tight text-slate-800 sm:text-[1.12rem]">
                        {job.company}
                      </p>
                      <p className="job-detail-company-note mt-1 text-sm leading-5 text-slate-500">
                        {companySourceLabel}
                      </p>

                      {quickHighlights.length > 0 ? (
                        <div className="job-detail-quick-highlights">
                          {quickHighlights.map((highlight) => (
                            <span key={highlight.key} className="job-detail-quick-highlight">
                              <HeaderInfoIcon kind={highlight.kind} className="h-3.5 w-3.5" />
                              <span className="job-detail-quick-highlight-text">
                                {highlight.value}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            <section className="job-detail-facts-panel">
              <dl className="job-detail-facts-grid">
                {jobDetailFacts.map((fact) => (
                  <div
                    key={fact.key}
                    className={`job-detail-fact-card job-detail-fact-card-${fact.tone} ${
                      fact.span === "wide"
                        ? "job-detail-fact-card-wide"
                        : fact.span === "full"
                          ? "job-detail-fact-card-full"
                          : ""
                    } ${
                      fact.compact ? "job-detail-fact-card-compact" : ""
                    }`.trim()}
                  >
                    <dt className="job-detail-fact-label">
                      <HeaderInfoIcon kind={fact.kind} className="h-4 w-4" />
                      <span>{fact.label}</span>
                    </dt>
                    <dd className="job-detail-fact-value">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="job-detail-footer mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/75 pt-4">
              <div className="job-detail-footer-meta flex flex-col gap-2">
                <ApplicationStatusBadge status={displayApplicationStatus} className="text-[11px]" />
                {!hasApplyLink || isApplicationUpcoming ? (
                  <p className="job-detail-footer-note text-sm text-slate-500">
                    {isApplicationUpcoming
                      ? "Link appears when applications open."
                      : "Direct apply link not listed yet."}
                  </p>
                ) : null}
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
                  className="job-detail-apply-button w-full sm:w-auto"
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
