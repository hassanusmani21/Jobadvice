import type { Metadata } from "next";
import Link from "@/components/AppLink";
import { notFound } from "next/navigation";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
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
        <header className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Posted {formatPostedDate(job.date)}
          </p>
          <h1 className="mt-2 font-serif text-[1.5rem] leading-[1.2] text-slate-900 sm:text-[1.875rem]">{job.title}</h1>
          <p className="mt-3 text-base font-semibold text-slate-700 sm:text-lg">{job.company}</p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
            Last updated {formatPostedDate(job.updatedAt)}
            {sourceHost ? ` • Source: ${sourceHost}` : ""}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-700 sm:text-sm">
            {job.location ? (
              <span className="rounded-full bg-slate-100 px-3 py-1">Location: {job.location}</span>
            ) : null}
            {workMode ? (
              <span className="rounded-full bg-slate-100 px-3 py-1">Mode: {workMode}</span>
            ) : null}
            {employmentType ? (
              <span className="rounded-full bg-slate-100 px-3 py-1">Type: {employmentType}</span>
            ) : null}
            {experience ? (
              <span className="rounded-full bg-slate-100 px-3 py-1">Experience: {experience}</span>
            ) : null}
            {job.salary ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                Salary: {job.salary}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Apply Window: {formatApplicationWindow(job.applicationStartDate, job.applicationEndDate)}
            </span>
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ApplicationStatusBadge status={job.applicationStatus} className="text-[11px]" />

            {isJobExpired ? (
              <span className="inline-flex justify-center rounded-full border border-rose-200 bg-rose-100 px-5 py-2.5 text-sm font-semibold text-rose-900">
                Job Expired
              </span>
            ) : isApplicationUpcoming ? (
              <span className="inline-flex justify-center rounded-full border border-sky-200 bg-sky-100 px-5 py-2.5 text-sm font-semibold text-sky-900">
                Applications Open Soon
              </span>
            ) : !hasApplyLink ? (
              <span className="inline-flex justify-center rounded-full border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700">
                Apply Link Not Available
              </span>
            ) : (
              <a
                href={`/api/apply/${job.slug}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 sm:w-auto"
              >
                Apply Now
              </a>
            )}
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
          <Link
            href="/jobs"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
          >
            Back to all jobs
          </Link>
        </div>
      </article>

      <div className="lg:col-span-3">
        <RecommendedJobs jobs={relatedJobs} />
      </div>
    </div>
  );
}
