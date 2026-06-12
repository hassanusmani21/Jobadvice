import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
import { getAllJobs } from "@/lib/jobs";
import { createPageMetadata } from "@/lib/seo";
import {
  getAllJobLocationLandings,
  getJobLocationLandingBySlug,
  getJobsForLocationSlug,
} from "@/lib/taxonomies";
import { siteName, siteUrl } from "@/lib/site";

type JobLocationPageProps = {
  params: {
    city: string;
  };
};

export const dynamicParams = false;
export const revalidate = 60 * 60;

const isOpenStatus = (state: string) =>
  ["open", "expiring_soon", "expires_today", "no_expiry"].includes(state);

const toCollectionJsonLd = (city: string, jobs: Awaited<ReturnType<typeof getAllJobs>>) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${city} Jobs | ${siteName}`,
  description: `Browse source-checked job openings in ${city} with direct apply links and cleaner role details on ${siteName}.`,
  url: `${siteUrl}/jobs/location/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"))}/`,
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
});

const toBreadcrumbJsonLd = (city: string, slug: string) => ({
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
      name: `${city} Jobs`,
      item: `${siteUrl}/jobs/location/${slug}/`,
    },
  ],
});

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return getAllJobLocationLandings(jobs).map((item) => ({
    city: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: JobLocationPageProps): Promise<Metadata> {
  const jobs = await getAllJobs();
  const landing = getJobLocationLandingBySlug(jobs, params.city);

  if (!landing) {
    return {
      title: "Location Jobs",
    };
  }

  return {
    ...createPageMetadata({
      title: `${landing.label} Jobs`,
      description: `Browse source-checked jobs in ${landing.label} with direct apply links, fresher-friendly openings, and cleaner role summaries.`,
      path: `/jobs/location/${landing.slug}/`,
      keywords: [`${landing.label} jobs`, `fresher jobs in ${landing.label}`, "direct apply jobs"],
    }),
  };
}

export default async function JobLocationPage({ params }: JobLocationPageProps) {
  const jobs = await getAllJobs();
  const landing = getJobLocationLandingBySlug(jobs, params.city);
  const cityJobs = getJobsForLocationSlug(jobs, params.city);

  if (!landing || cityJobs.length === 0) {
    notFound();
  }

  const openCount = cityJobs.filter((job) =>
    isOpenStatus(job.applicationStatus.state),
  ).length;
  const companyCount = new Set(cityJobs.map((job) => job.company).filter(Boolean)).size;
  const alternateLocations = getAllJobLocationLandings(jobs)
    .filter((item) => item.slug !== landing.slug)
    .slice(0, 8);
  const structuredData = [
    toCollectionJsonLd(landing.label, cityJobs),
    toBreadcrumbJsonLd(landing.label, landing.slug),
  ];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">Location Jobs</span>
        <h1 className="page-title">Source-checked jobs in {landing.label}</h1>
        <p className="page-copy">
          Explore cleaner job listings for {landing.label} with direct-apply clarity, fresher-ready
          opportunities, and faster scanning across companies.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Openings
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {cityJobs.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">{openCount} open right now.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Companies
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {companyCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">Curated from live public listings.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Focus
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {landing.label}
            </p>
            <p className="mt-1 text-sm text-slate-600">City-focused browsing for faster follow-up.</p>
          </div>
        </div>

        {alternateLocations.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/jobs" className="content-chip content-chip-accent text-sm">
              All Jobs
            </Link>
            {alternateLocations.map((item) => (
              <Link
                key={item.slug}
                href={`/jobs/location/${item.slug}`}
                className="content-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}

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
            <h2 className="section-header-title">{landing.label} Openings</h2>
            <p className="section-header-copy">
              Source-checked roles, cleaner summaries, and direct application routes when the
              source link is available.
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

        {cityJobs.length > 0 ? (
          <ul className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {cityJobs.map((job, index) => (
              <li key={job.slug} className="min-w-0">
                <JobCard
                  job={job}
                  style={{ animationDelay: `${140 + index * 70}ms` }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyStateCard title={`No live jobs found for ${landing.label} right now`} />
        )}
      </section>
    </div>
  );
}
