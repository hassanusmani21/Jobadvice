import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import RecommendedJobs from "@/components/RecommendedJobs";
import {
  formatApplicationWindow,
  formatPostedDate,
  getAllJobs,
  getJobBySlug,
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

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  if (jobs.length === 0) {
    return [{ slug: fallbackSlug }];
  }

  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = params;
  const job = await getJobBySlug(slug);

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
  const jobUrl = `${siteUrl}/jobs/${job.slug}`;

  return {
    title,
    description,
    keywords: [job.title, job.company, job.location, ...job.skills],
    alternates: {
      canonical: `/jobs/${job.slug}`,
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

  const job = await getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const isJobExpired = job.applicationStatus.state === "expired";
  const isApplicationUpcoming = job.applicationStatus.state === "upcoming";
  const hasApplyLink = Boolean(job.applyLink);
  const recommendedJobs = (await getAllJobs())
    .filter((listedJob) => listedJob.slug !== job.slug)
    .slice(0, 5);

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
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: schemaDescription,
    ...(eligibilityCriteria ? { qualifications: eligibilityCriteria } : {}),
    datePosted: job.date,
    ...(job.applicationEndDate ? { validThrough: job.applicationEndDate } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    },
    ...(job.applyLink ? { directApply: true } : {}),
    url: `${siteUrl}/jobs/${job.slug}`,
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
              <Link
                href={`/api/apply/${job.slug}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 sm:w-auto"
              >
                Apply Now
              </Link>
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
        <RecommendedJobs jobs={recommendedJobs} />
      </div>
    </div>
  );
}
