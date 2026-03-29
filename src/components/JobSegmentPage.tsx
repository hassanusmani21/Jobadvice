import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
import type { JobPost } from "@/lib/jobs";
import {
  getAllJobSegmentConfigs,
  getJobSegmentConfig,
  type JobSegmentSlug,
} from "@/lib/jobSegments";
import { siteName, siteUrl } from "@/lib/site";

type JobSegmentPageProps = {
  jobs: JobPost[];
  segment: JobSegmentSlug;
};

const isOpenStatus = (job: JobPost) =>
  ["open", "expiring_soon", "expires_today", "no_expiry"].includes(
    job.applicationStatus.state,
  );

const toCollectionJsonLd = (segment: JobSegmentSlug, jobs: JobPost[]) => {
  const config = getJobSegmentConfig(segment);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${config.pageTitle} | ${siteName}`,
    description: config.pageDescription,
    url: `${siteUrl}${config.href}/`,
    isPartOf: {
      "@type": "WebSite",
      url: siteUrl,
      name: siteName,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: jobs.slice(0, 12).map((job, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/jobs/${job.slug}/`,
        name: `${job.title} at ${job.company}`,
      })),
    },
  };
};

const toBreadcrumbJsonLd = (segment: JobSegmentSlug) => {
  const config = getJobSegmentConfig(segment);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Jobs",
        item: `${siteUrl}/jobs/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: config.label,
        item: `${siteUrl}${config.href}/`,
      },
    ],
  };
};

export default function JobSegmentPage({ jobs, segment }: JobSegmentPageProps) {
  const config = getJobSegmentConfig(segment);
  const structuredData = [toCollectionJsonLd(segment, jobs), toBreadcrumbJsonLd(segment)];
  const liveOpenCount = jobs.filter(isOpenStatus).length;
  const companyCount = new Set(jobs.map((job) => job.company).filter(Boolean)).size;
  const locationCount = new Set(jobs.map((job) => job.location).filter(Boolean)).size;
  const alternateSegments = getAllJobSegmentConfigs().filter(
    (item) => item.slug !== segment,
  );

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">{config.kicker}</span>
        <h1 className="page-title">{config.heroTitle}</h1>
        <p className="page-copy">{config.heroDescription}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Live Openings
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {jobs.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {liveOpenCount} open right now.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Companies
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {companyCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Verified listings across employers.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Locations
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {locationCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Cities and work modes users can scan fast.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/jobs" className="content-chip content-chip-accent text-sm">
            All Jobs
          </Link>
          {alternateSegments.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="content-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
            >
              {item.shortLabel}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
            Browse All Jobs
          </ActionButton>
          <ActionButton href="/blog" variant="secondary" className="sm:w-auto">
            Read Career Advice
          </ActionButton>
        </div>
      </section>

      <section className="space-y-5">
        <div className="fade-up section-header" style={{ animationDelay: "90ms" }}>
          <div className="section-header-body">
            <h2 className="section-header-title">{config.label} Openings</h2>
            <p className="section-header-copy">
              Curated job listings with direct application routes and cleaner role details.
            </p>
          </div>
          <Link href="/jobs" className="section-header-link group">
            <span>See full jobs archive</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>

        {jobs.length > 0 ? (
          <ul className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job, index) => (
              <li key={job.slug} className="min-w-0">
                <JobCard
                  job={job}
                  style={{ animationDelay: `${140 + index * 70}ms` }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-4">
            <EmptyStateCard title={config.emptyTitle} />
            <p className="soft-note px-4 py-4 text-slate-600">
              {config.emptyDescription}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
