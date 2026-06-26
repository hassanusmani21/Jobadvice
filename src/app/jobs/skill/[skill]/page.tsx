import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
import { getAllJobs } from "@/lib/jobs";
import { createPageMetadata } from "@/lib/seo";
import {
  getAllJobSkillLandings,
  getJobSkillLandingBySlug,
  getJobsForSkillSlug,
} from "@/lib/taxonomies";
import { siteName, siteUrl } from "@/lib/site";

type JobSkillPageProps = {
  params: {
    skill: string;
  };
};

export const dynamicParams = false;
export const revalidate = 60 * 60;

const toCollectionJsonLd = (skill: string, slug: string, jobs: Awaited<ReturnType<typeof getAllJobs>>) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${skill} Jobs | ${siteName}`,
  description: `Browse source-checked jobs that mention ${skill} as a required or useful skill.`,
  url: `${siteUrl}/jobs/skill/${slug}/`,
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

const toBreadcrumbJsonLd = (skill: string, slug: string) => ({
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
      name: `${skill} Jobs`,
      item: `${siteUrl}/jobs/skill/${slug}/`,
    },
  ],
});

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return getAllJobSkillLandings(jobs).map((item) => ({
    skill: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: JobSkillPageProps): Promise<Metadata> {
  const jobs = await getAllJobs();
  const landing = getJobSkillLandingBySlug(jobs, params.skill);

  if (!landing) {
    return {
      title: "Skill Jobs",
    };
  }

  return createPageMetadata({
    title: `${landing.label} Jobs`,
    description: `Browse source-checked ${landing.label} jobs with direct apply links, fresher-friendly openings, and role summaries that make requirements easier to scan.`,
    path: `/jobs/skill/${landing.slug}/`,
    keywords: [`${landing.label} jobs`, `${landing.label} fresher jobs`, "skill based jobs"],
    noIndex: true,
  });
}

export default async function JobSkillPage({ params }: JobSkillPageProps) {
  const jobs = await getAllJobs();
  const landing = getJobSkillLandingBySlug(jobs, params.skill);
  const skillJobs = getJobsForSkillSlug(jobs, params.skill);

  if (!landing || skillJobs.length === 0) {
    notFound();
  }

  const alternateSkills = getAllJobSkillLandings(jobs)
    .filter((item) => item.slug !== landing.slug)
    .slice(0, 10);
  const structuredData = [
    toCollectionJsonLd(landing.label, landing.slug, skillJobs),
    toBreadcrumbJsonLd(landing.label, landing.slug),
  ];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">Skill Jobs</span>
        <h1 className="page-title">{landing.label} jobs</h1>
        <p className="page-copy">
          Browse source-checked openings where {landing.label} appears in the role requirements. Use this
          page to compare companies, work modes, locations, and apply sources without searching
          through every listing manually.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/jobs" className="content-chip content-chip-accent text-sm">
            All Jobs
          </Link>
          {alternateSkills.map((item) => (
            <Link
              key={item.slug}
              href={`/jobs/skill/${item.slug}`}
              className="content-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
            Browse All Jobs
          </ActionButton>
          <ActionButton href="/resume-builder" variant="secondary" className="sm:w-auto">
            Build Resume
          </ActionButton>
        </div>
      </section>

      <section className="space-y-5">
        <div className="fade-up section-header" style={{ animationDelay: "90ms" }}>
          <div className="section-header-body">
            <h2 className="section-header-title">{landing.label} Openings</h2>
            <p className="section-header-copy">
              Compare source-checked roles that mention this skill, then tailor your resume and apply
              from the official source.
            </p>
          </div>
        </div>

        {skillJobs.length > 0 ? (
          <ul className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {skillJobs.map((job, index) => (
              <li key={job.slug} className="min-w-0">
                <JobCard job={job} style={{ animationDelay: `${140 + index * 70}ms` }} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyStateCard title="No matching jobs yet" />
        )}
      </section>
    </div>
  );
}
