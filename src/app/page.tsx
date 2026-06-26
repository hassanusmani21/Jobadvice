import type { Metadata } from "next";
import { Suspense } from "react";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import GlobalEngagementPopups from "@/components/GlobalEngagementPopups";
import JobCard from "@/components/JobCard";
import { getLatestBlogs } from "@/lib/blogs";
import { getAllJobs } from "@/lib/jobs";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Career Guides, Hiring Insights, and Verified Openings in India",
  description:
    "Read practical career guides, hiring insights, and a smaller set of verified public openings built for students, freshers, and early-career job seekers in India.",
  path: "/",
  keywords: ["career guidance India", "fresher career advice", "verified openings", "job advice"],
});

export const revalidate = 60 * 60;

const toTopLocations = (locations: string[], limit = 12) => {
  const locationCounts = new Map<string, number>();

  for (const location of locations) {
    const normalizedLocation = location.trim();
    if (!normalizedLocation) {
      continue;
    }

    locationCounts.set(
      normalizedLocation,
      (locationCounts.get(normalizedLocation) || 0) + 1,
    );
  }

  return [...locationCounts.entries()]
    .sort(
      (firstItem, secondItem) =>
        secondItem[1] - firstItem[1] || firstItem[0].localeCompare(secondItem[0]),
    )
    .slice(0, limit)
    .map(([location]) => location);
};

export default async function HomePage() {
  const [allJobs, latestBlogs] = await Promise.all([
    getAllJobs(),
    getLatestBlogs(4),
  ]);
  const latestJobs = allJobs.slice(0, 3);
  const dashboardJobs = latestJobs.slice(0, 4);
  const finderLocationOptions = toTopLocations(allJobs.map((job) => job.location));
  const coveredLocationCount = finderLocationOptions.length;
  const heroMetrics = [
    { value: `${latestBlogs.length}+`, label: "Featured guides", note: "latest reads" },
    { value: `${allJobs.length}`, label: "Public openings", note: "kept curated" },
    { value: `${coveredLocationCount}+`, label: "Covered cities", note: "current public set" },
  ];
  const heroBenefitChips = [
    "Career Guides",
    "Trust Signals",
    "Curated Openings",
  ];
  const heroTrustSignals = [
    { value: "Original", label: "career articles and explainers" },
    { value: "Student-first", label: "built for students and freshers" },
    { value: `${allJobs.length}`, label: "public openings kept intentional" },
    { value: "Trust-first", label: "verification and editorial pages visible" },
  ];
  const dashboardMetrics = [
    { value: `${allJobs.length}`, label: "Public jobs" },
    { value: `${latestBlogs.length}+`, label: "Fresh guides" },
    { value: "Daily", label: "Editorial review" },
  ];
  const dashboardStatusLabels = ["Checked", "Direct", "Fresh", "Open"];
  const dashboardInsights = [
    { label: "Career advice", value: "Visible", detail: "guides up front" },
    { label: "Job quality", value: "Tighter", detail: "smaller public set" },
    { label: "Trust pages", value: "Clear", detail: "policy and process" },
  ];
  const dashboardRecommendationTags = ["Public opening", "Curated", "Checked", "Open"];
  const dashboardChecks = ["Editorial policy", "Source checks", "No paid routes"];
  const trustHighlights = [
    {
      title: "Public openings are kept intentionally small",
      body:
        "Only stronger public job pages stay visible so readers are not pushed into a noisy archive of weak or unclear listings.",
      href: "/jobs",
      cta: "See public openings",
    },
    {
      title: "Editorial standards are visible",
      body:
        "Readers can see how content is reviewed, what sources are preferred, and how corrections or removals are handled.",
      href: "/editorial-policy",
      cta: "Read editorial policy",
    },
    {
      title: "Verification guidance is not hidden",
      body:
        "The site explains what to confirm before applying so users can spot weak listings, risky routes, and missing details earlier.",
      href: "/how-we-verify-jobs",
      cta: "Learn verification process",
    },
  ];
  const readerValueItems = [
    {
      title: "Checked at the source",
      body:
        "Every listing is shaped around the original apply route so readers can confirm company, role, location, and deadline before acting.",
    },
    {
      title: "Context before clicks",
      body:
        "Scan-friendly eligibility, skills, resume cues, and verification notes make each opportunity easier to compare.",
    },
    {
      title: "Trust over noise",
      body:
        "No paid-access promises, vague guarantees, or unclear application routes. Weak listings should not feel like strong opportunities.",
    },
  ];

  return (
    <div className="home-page-shell space-y-5 lg:space-y-6">
      <Suspense fallback={null}>
        <GlobalEngagementPopups />
      </Suspense>

      <div className="home-first-fold">
        <section className="fade-up hero-surface home-hero-shell relative overflow-visible rounded-2xl px-4 py-5 sm:px-6 sm:py-6 lg:flex lg:items-center lg:px-8">
          <div aria-hidden className="home-hero-light-field home-hero-light-field-top" />
          <div aria-hidden className="home-hero-light-field home-hero-light-field-bottom" />
          <div
            aria-hidden
            className="home-hero-divider absolute inset-y-10 left-[55%] hidden w-px lg:block"
          />

          <div className="relative z-[1] home-hero-grid grid content-start gap-3.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.92fr)] lg:items-center">
            <div className="home-hero-copy mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-[38rem] lg:text-left">
              <div className="home-hero-copy-stack">
                <div className="home-hero-mobile-visual" aria-hidden="true">
                  <div className="home-hero-mobile-visual-grid">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="home-hero-mobile-visual-orb" />
                  <div className="home-hero-mobile-preview-top">
                    <span>
                      <i />
                      Source checked
                    </span>
                    <strong>Live</strong>
                  </div>
                  <div className="home-hero-mobile-preview-score">
                    <strong>3</strong>
                    <span>checks</span>
                  </div>
                  <div className="home-hero-mobile-preview-roles">
                    <span>
                      <strong>AI Engineer</strong>
                      <em>New</em>
                    </span>
                    <span>
                      <strong>DevOps Associate</strong>
                      <em>Open</em>
                    </span>
                  </div>
                  <div className="home-hero-mobile-preview-insight">
                    <span>Apply route</span>
                    <strong>Direct</strong>
                  </div>
                  <div className="home-hero-mobile-preview-activity">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                  <div className="home-hero-badge-row flex flex-wrap items-center justify-center lg:justify-start">
                  <span className="page-kicker home-hero-kicker">Career guidance with verified public openings</span>
                  <span className="home-hero-live-pill hidden lg:inline-flex">Editorially reviewed</span>
                </div>

                <div className="home-hero-heading-block mx-auto w-full max-w-[25rem] sm:max-w-3xl lg:mx-0 lg:max-w-[37rem]">
                  <h1 className="page-title home-hero-title mx-auto w-full max-w-[25rem] !text-3xl sm:max-w-3xl sm:!text-5xl lg:mx-0 lg:max-w-[37rem] lg:!text-[4.25rem] xl:!text-[4.65rem]">
                    <span className="home-hero-title-line">
                      <span className="home-hero-title-emphasis">Career</span> clarity.
                    </span>
                    <span className="home-hero-title-line">
                      <span className="home-hero-title-emphasis">Better</span> applications.
                    </span>
                  </h1>

                  <p className="page-copy home-hero-copy-text mx-auto w-full max-w-[25rem] !text-[1rem] sm:max-w-[35rem] sm:!text-[1.08rem] lg:mx-0 lg:max-w-[34rem] lg:!text-[1.12rem]">
                    Start with practical guides, trust signals, and a smaller set of curated public
                    openings instead of a noisy job directory.
                  </p>

                  <div className="home-hero-benefit-chips" aria-label="JobAdvice benefits">
                    {heroBenefitChips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                </div>

                <div className="home-hero-proof-row mx-auto flex max-w-[25rem] flex-wrap items-center justify-center sm:max-w-none lg:mx-0 lg:justify-start">
                  {heroMetrics.map((metric) => (
                    <span key={metric.label} className="home-hero-proof-chip">
                      <span className="home-hero-proof-value">{metric.value}</span>
                      <span className="home-hero-proof-label">{metric.label}</span>
                      <span className="home-hero-proof-note">{metric.note}</span>
                    </span>
                  ))}
                </div>
              </div>

                <div className="home-hero-cta-block mx-auto w-full max-w-[34rem] lg:mx-0 lg:max-w-[38rem]">
                  <div className="home-hero-action-row mx-auto flex w-full max-w-[24rem] flex-col items-stretch sm:mx-auto sm:max-w-none sm:flex-row sm:flex-nowrap sm:justify-center lg:mx-0 lg:justify-start lg:items-center">
                  <ActionButton
                    href="/blog"
                    variant="primary"
                    className="home-hero-primary-action w-full sm:w-auto"
                  >
                    Read career guides <span aria-hidden="true">→</span>
                  </ActionButton>
                  <ActionButton
                    href="/editorial-policy"
                    variant="secondary"
                    className="home-hero-secondary-action hidden w-full sm:inline-flex sm:w-auto"
                  >
                    Editorial policy
                  </ActionButton>
                  <Link href="/jobs" className="home-hero-mobile-secondary-link sm:hidden">
                    View public openings
                  </Link>
                </div>

                <div className="home-hero-trust-layer" aria-label="JobAdvice trust signals">
                  {heroTrustSignals.map((signal) => (
                    <span key={signal.label} className="home-hero-trust-item">
                      <strong>{signal.value}</strong>
                      <span>{signal.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="home-dashboard-stage" aria-label="JobAdvice source-check dashboard">
              <div aria-hidden="true" className="home-dashboard-orbit home-dashboard-orbit-one" />
              <div aria-hidden="true" className="home-dashboard-orbit home-dashboard-orbit-two" />
              <div aria-hidden="true" className="home-dashboard-floating-card home-dashboard-floating-score">
                <span>Source check</span>
                <strong>Live</strong>
              </div>
              <div aria-hidden="true" className="home-dashboard-floating-card home-dashboard-floating-activity">
                <span className="home-dashboard-floating-dot" />
                <span>Recent listings</span>
              </div>
              <div aria-hidden="true" className="home-dashboard-floating-card home-dashboard-floating-apply">
                <span>Public set</span>
                <strong>{allJobs.length} live</strong>
              </div>

              <aside className="home-dashboard-shell">
                <div className="home-dashboard-topbar">
                  <div>
                    <p className="home-dashboard-eyebrow">Editorial review</p>
                    <h2 className="home-dashboard-title">
                      <span>Editorial-first</span>
                      <span>public job set</span>
                    </h2>
                  </div>
                  <span className="home-dashboard-live">
                    <span aria-hidden="true" />
                    Online
                  </span>
                </div>

                <div className="home-dashboard-verification-row" aria-label="Source verification status">
                  <span>
                    <i />
                    Reader-first
                  </span>
                  <span>Smaller public set</span>
                  <span>Trust pages visible</span>
                </div>

                <div className="home-dashboard-metrics" aria-label="Listing metrics">
                  {dashboardMetrics.map((metric) => (
                    <div key={metric.label} className="home-dashboard-metric">
                      <span className="home-dashboard-metric-value">{metric.value}</span>
                      <span className="home-dashboard-metric-label">{metric.label}</span>
                    </div>
                  ))}
                </div>

                <div className="home-dashboard-ai-panel" aria-label="Application guidance">
                  <div className="home-dashboard-score-orb">
                    <span className="home-dashboard-score-value">3x</span>
                    <span className="home-dashboard-score-label">checks</span>
                  </div>
                  <div className="home-dashboard-insight-stack">
                    {dashboardInsights.map((insight) => (
                      <div key={insight.label} className="home-dashboard-insight">
                        <span>
                          <small>{insight.label}</small>
                          <strong>{insight.value}</strong>
                        </span>
                        <em>{insight.detail}</em>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="home-dashboard-card home-dashboard-list-card">
                  <div className="home-dashboard-card-header">
                    <span>Featured public openings</span>
                    <strong>{dashboardJobs.length || 0} roles</strong>
                  </div>
                  <div className="home-dashboard-job-list">
                    {dashboardJobs.map((job, index) => (
                      <Link
                        key={job.slug}
                        href={`/jobs/${job.slug}`}
                        className="home-dashboard-job-row"
                      >
                        <span className="home-dashboard-company-mark" aria-hidden="true">
                          {job.company.trim().slice(0, 1) || String(index + 1)}
                        </span>
                        <span className="home-dashboard-job-copy">
                          <strong>{job.title}</strong>
                          <small>{job.company}</small>
                          <span className="home-dashboard-recommendation-tag">
                            {dashboardRecommendationTags[index] || "Open"}
                          </span>
                        </span>
                        <span className="home-dashboard-job-meta">
                          <span className="home-dashboard-job-status">
                            {job.workMode || job.location.split(",")[0] || "Open"}
                          </span>
                          <span className="home-dashboard-match-pill">
                            {dashboardStatusLabels[index] || "Open"}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="home-dashboard-activity-panel" aria-label="Hiring activity indicators">
                  <div className="home-dashboard-activity-header">
                    <span>Hiring activity</span>
                    <strong>Live</strong>
                  </div>
                  <div className="home-dashboard-activity-bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="home-dashboard-proof-strip" aria-label="Verification signals">
                  {dashboardChecks.map((check) => (
                    <span key={check}>{check}</span>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section
          className="fade-up card-surface rounded-3xl px-5 py-5 sm:px-7 sm:py-6"
          style={{ animationDelay: "70ms" }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="page-kicker">Why Trust This Site</span>
              <h2 className="mt-3 font-serif text-[1.8rem] leading-tight text-slate-900 sm:text-[2.25rem]">
                Readers should know how a page earns trust before it earns a click
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                JobAdvice is trying to feel more useful than a generic job feed. That means smaller
                public inventory, visible policies, and practical verification guidance instead of
                just more pages.
              </p>
            </div>
            <ActionButton href="/about" variant="secondary" className="sm:w-auto">
              About JobAdvice
            </ActionButton>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {trustHighlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4 transition hover:text-teal-900"
                >
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <div className="fade-up home-search-wrap home-search-wrap-integrated relative px-0">
          <div className="home-search-surface home-search-shell mx-auto max-w-5xl lg:max-w-none">
            <div className="home-mobile-filter-panel">
              <div className="home-mobile-filter-quick-row">
                <span className="home-mobile-filter-label">Start here</span>
                <div className="home-mobile-filter-chip-row" aria-label="Popular guidance paths">
                  <Link href="/blog" className="home-mobile-filter-chip home-mobile-filter-chip-accent">
                    Blog
                  </Link>
                  <Link href="/blog/topic/career-growth" className="home-mobile-filter-chip">
                    Career growth
                  </Link>
                  <Link href="/how-we-verify-jobs" className="home-mobile-filter-chip">
                    Verification
                  </Link>
                  <Link href="/jobs" className="home-mobile-filter-chip">
                    Openings
                  </Link>
                </div>
              </div>
            </div>

            <div className="home-search-panel">
              <form action="/blog" method="get" aria-label="Blog search" className="home-search-form">
                <div className="home-search-grid grid gap-4">
                  <label className="home-search-field block min-w-0">
                    <span className="sr-only">Topic or keyword</span>
                    <div className="home-search-control home-search-control-rich flex min-w-0 items-center gap-3 px-4">
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-slate-400">
                        <path
                          d="m14.5 14.5 3 3m-1.5-8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                      <span className="sr-only">Search blog</span>
                      <input
                        name="q"
                        type="search"
                        placeholder="e.g. internship, AI career, resume"
                        className="home-search-input min-w-0 w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <ActionButton
                    variant="primary"
                    buttonType="submit"
                    ariaLabel="Search blog"
                    className="home-search-submit w-full"
                  >
                    <span className="home-search-submit-label">Search guides</span>
                    <span className="home-search-submit-icon" aria-hidden="true">
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                        <path
                          d="m14.5 14.5 3 3m-1.5-8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </span>
                  </ActionButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <section className="fade-up home-value-section px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "80ms" }}>
        <span className="page-kicker">Why JobAdvice Exists</span>
        <h2 className="page-title">Career decisions should get context before they get clicks</h2>
        <p className="page-copy">
          JobAdvice is written for students, freshers, and early-career professionals who need
          guidance, context, and trust signals before they act. Public openings are kept smaller on
          purpose so the site can stay useful, readable, and editorially responsible.
        </p>

        <div className="home-value-grid mt-5 grid gap-3 md:grid-cols-3">
          {readerValueItems.map((item, index) => (
            <div key={item.title} className="home-value-card">
              <span className="home-value-card-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton href="/editorial-policy" variant="secondary" className="sm:w-auto">
            Editorial Policy
          </ActionButton>
          <ActionButton href="/how-we-verify-jobs" variant="secondary" className="sm:w-auto">
            Verification Process
          </ActionButton>
        </div>
      </section>

      <section className="space-y-5">
        <div
          className="fade-up section-header"
          style={{ animationDelay: "100ms" }}
        >
          <div className="section-header-body">
            <h2 className="section-header-title">Latest Blog Insights</h2>
            <p className="section-header-copy">
              Career guides, hiring signals, and practical reads built to move users from discovery
              to action.
            </p>
          </div>
          <Link href="/blog" className="section-header-link group">
            <span>Read all blogs</span>
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {latestBlogs.map((blog, index) => (
            <li key={blog.slug} className="min-w-0">
              <BlogCard
                blog={blog}
                style={{ animationDelay: `${180 + index * 90}ms` }}
              />
            </li>
          ))}
        </ul>

        {latestBlogs.length === 0 ? (
          <EmptyStateCard title="No blogs yet" />
        ) : null}
      </section>

      <section className="space-y-6 py-2">
        <div
          className="fade-up section-header"
          style={{ animationDelay: "120ms" }}
        >
          <div className="section-header-body">
            <h2 className="section-header-title">Featured Public Openings</h2>
            <p className="section-header-copy">
              A smaller set of public roles kept visible because they still have stronger context,
              cleaner sourcing, and better reader value than a broad noisy archive.
            </p>
          </div>
          <Link href="/jobs" className="section-header-link group">
            <span>View public openings</span>
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {latestJobs.map((job, index) => (
            <li key={job.slug} className="min-w-0">
              <JobCard job={job} style={{ animationDelay: `${220 + index * 90}ms` }} />
            </li>
          ))}
        </ul>

        {latestJobs.length === 0 ? (
          <EmptyStateCard title="No public openings right now" />
        ) : null}
      </section>
    </div>
  );
}
