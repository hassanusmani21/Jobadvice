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
  title: "Fresher Jobs, Internships, and Verified Openings in India",
  description:
    "Discover verified fresher jobs, internships, and direct-apply openings in India with practical career guidance for students and early-career job seekers.",
  path: "/",
  keywords: ["fresher jobs", "internships in India", "verified job openings", "job advice"],
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
    getLatestBlogs(3),
  ]);
  const latestJobs = allJobs.slice(0, 6);
  const dashboardJobs = latestJobs.slice(0, 4);
  const finderLocationOptions = toTopLocations(allJobs.map((job) => job.location));
  const coveredLocationCount = finderLocationOptions.length;
  const heroMetrics = [
    { value: `${allJobs.length}+`, label: "Verified roles", note: "source checked" },
    { value: "Direct", label: "Apply paths", note: "no detours" },
    { value: `${coveredLocationCount}+`, label: "Hiring cities", note: "fresh signals" },
  ];
  const heroBenefitChips = [
    "Verified Jobs",
    "AI Match Score",
    "Direct Apply",
  ];
  const heroTrustSignals = [
    { value: `${allJobs.length}+`, label: "verified opportunities this month" },
    { value: "Student-first", label: "trusted by students and freshers" },
    { value: "Hiring partners", label: "company sources tracked daily" },
    { value: "3-point", label: "success checks on every role" },
  ];
  const dashboardMetrics = [
    { value: `${allJobs.length}+`, label: "Verified roles" },
    { value: "Direct", label: "Apply routes" },
    { value: "Daily", label: "Review cadence" },
  ];
  const dashboardMatchScores = [98, 95, 92, 89];
  const dashboardInsights = [
    { label: "Resume fit", value: "Strong", detail: "+18% skill overlap" },
    { label: "Apply route", value: "Clean", detail: "direct company path" },
    { label: "Hiring pulse", value: "Active", detail: "fresh activity" },
  ];
  const dashboardRecommendationTags = ["Top match", "Fast apply", "Fresh signal", "Verified"];
  const dashboardChecks = ["Original source", "Role clarity", "No paid routes"];
  const readerValueItems = [
    {
      title: "Verified at the source",
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
                      AI verified
                    </span>
                    <strong>98%</strong>
                  </div>
                  <div className="home-hero-mobile-preview-score">
                    <strong>96%</strong>
                    <span>match</span>
                  </div>
                  <div className="home-hero-mobile-preview-roles">
                    <span>
                      <strong>AI Engineer</strong>
                      <em>98</em>
                    </span>
                    <span>
                      <strong>DevOps Associate</strong>
                      <em>95</em>
                    </span>
                  </div>
                  <div className="home-hero-mobile-preview-insight">
                    <span>Hiring pulse</span>
                    <strong>Active</strong>
                  </div>
                  <div className="home-hero-mobile-preview-activity">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="home-hero-badge-row flex flex-wrap items-center justify-center lg:justify-start">
                  <span className="page-kicker home-hero-kicker">Verified job intelligence</span>
                  <span className="home-hero-live-pill hidden lg:inline-flex">Updated daily</span>
                </div>

                <div className="home-hero-heading-block mx-auto w-full max-w-[25rem] sm:max-w-3xl lg:mx-0 lg:max-w-[37rem]">
                  <h1 className="page-title home-hero-title mx-auto w-full max-w-[25rem] !text-3xl sm:max-w-3xl sm:!text-5xl lg:mx-0 lg:max-w-[37rem] lg:!text-[4.25rem] xl:!text-[4.65rem]">
                    <span className="home-hero-title-line">
                      <span className="home-hero-title-emphasis">Verified</span> jobs.
                    </span>
                    <span className="home-hero-title-line">
                      <span className="home-hero-title-emphasis">Smarter</span> moves.
                    </span>
                  </h1>

                  <p className="page-copy home-hero-copy-text mx-auto w-full max-w-[25rem] !text-[1rem] sm:max-w-[35rem] sm:!text-[1.08rem] lg:mx-0 lg:max-w-[34rem] lg:!text-[1.12rem]">
                    Verified opportunities with cleaner apply paths, hiring insights, and smarter
                    matching.
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
                    href="/jobs"
                    variant="primary"
                    className="home-hero-primary-action w-full sm:w-auto"
                  >
                    Browse verified jobs <span aria-hidden="true">→</span>
                  </ActionButton>
                  <ActionButton
                    href="/how-we-verify-jobs"
                    variant="secondary"
                    className="home-hero-secondary-action hidden w-full sm:inline-flex sm:w-auto"
                  >
                    How we verify
                  </ActionButton>
                  <Link href="/how-we-verify-jobs" className="home-hero-mobile-secondary-link sm:hidden">
                    How we verify
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

            <div className="home-dashboard-stage" aria-label="JobAdvice live verification dashboard">
              <div aria-hidden="true" className="home-dashboard-orbit home-dashboard-orbit-one" />
              <div aria-hidden="true" className="home-dashboard-orbit home-dashboard-orbit-two" />
              <div aria-hidden="true" className="home-dashboard-floating-card home-dashboard-floating-score">
                <span>AI match</span>
                <strong>98%</strong>
              </div>
              <div aria-hidden="true" className="home-dashboard-floating-card home-dashboard-floating-activity">
                <span className="home-dashboard-floating-dot" />
                <span>18 hiring signals</span>
              </div>
              <div aria-hidden="true" className="home-dashboard-floating-card home-dashboard-floating-apply">
                <span>Applications</span>
                <strong>42 live</strong>
              </div>

              <aside className="home-dashboard-shell">
                <div className="home-dashboard-topbar">
                  <div>
                    <p className="home-dashboard-eyebrow">AI job intelligence</p>
                    <h2 className="home-dashboard-title">
                      <span>Roles ranked</span>
                      <span>by fit signals</span>
                    </h2>
                  </div>
                  <span className="home-dashboard-live">
                    <span aria-hidden="true" />
                    Online
                  </span>
                </div>

                <div className="home-dashboard-verification-row" aria-label="AI verification status">
                  <span>
                    <i />
                    AI verified
                  </span>
                  <span>Live index</span>
                  <span>No paid routes</span>
                </div>

                <div className="home-dashboard-metrics" aria-label="Platform metrics">
                  {dashboardMetrics.map((metric) => (
                    <div key={metric.label} className="home-dashboard-metric">
                      <span className="home-dashboard-metric-value">{metric.value}</span>
                      <span className="home-dashboard-metric-label">{metric.label}</span>
                    </div>
                  ))}
                </div>

                <div className="home-dashboard-ai-panel" aria-label="AI application insights">
                  <div className="home-dashboard-score-orb">
                    <span className="home-dashboard-score-value">96%</span>
                    <span className="home-dashboard-score-label">avg. match</span>
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
                    <span>AI recommended roles</span>
                    <strong>{dashboardJobs.length || 0} matches</strong>
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
                            {dashboardRecommendationTags[index] || "Verified"}
                          </span>
                        </span>
                        <span className="home-dashboard-job-meta">
                          <span className="home-dashboard-job-status">
                            {job.workMode || job.location.split(",")[0] || "Open"}
                          </span>
                          <span className="home-dashboard-match-pill">
                            {dashboardMatchScores[index] || 88}%
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

        <div className="fade-up home-search-wrap home-search-wrap-integrated relative px-0">
          <div className="home-search-surface home-search-shell mx-auto max-w-5xl lg:max-w-none">
            <div className="home-search-intent-row">
              <span className="home-search-intent-eyebrow">
                <span aria-hidden="true" />
                AI job finder
              </span>
              <span className="home-search-intent-meta">
                {allJobs.length}+ verified roles indexed live
              </span>
            </div>

            <div className="home-mobile-filter-panel">
              <div className="home-mobile-filter-quick-row">
                <span className="home-mobile-filter-label">Popular paths</span>
                <div className="home-mobile-filter-chip-row" aria-label="Popular job categories">
                  <Link href="/jobs/freshers" className="home-mobile-filter-chip home-mobile-filter-chip-accent">
                    Freshers
                  </Link>
                  <Link href="/jobs/internships" className="home-mobile-filter-chip">
                    Internships
                  </Link>
                  <Link href="/jobs/remote" className="home-mobile-filter-chip">
                    Remote
                  </Link>
                  <Link href="/jobs" className="home-mobile-filter-chip">
                    All jobs
                  </Link>
                </div>
              </div>
            </div>

            <div className="home-search-panel">
              <form action="/jobs" method="get" aria-label="Job search" className="home-search-form">
                <div className="home-search-grid grid gap-4">
                  <label className="home-search-field block min-w-0">
                    <span className="sr-only">Role or company</span>
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
                      <span className="sr-only">Search jobs</span>
                      <input
                        name="q"
                        type="search"
                        placeholder="e.g. Software Engineer"
                        className="home-search-input min-w-0 w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <ActionButton
                    variant="primary"
                    buttonType="submit"
                    ariaLabel="Search jobs"
                    className="home-search-submit w-full"
                  >
                    <span className="home-search-submit-label">Search</span>
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
        <h2 className="page-title">Job search pages should help before they redirect</h2>
        <p className="page-copy">
          JobAdvice is written for students, freshers, and early-career professionals who need
          clarity before clicking an apply button. The site adds practical checks around each
          opportunity so readers can compare roles, verify sources, and avoid noisy job posts.
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

      <section className="space-y-6 py-2">
        <div
          className="fade-up section-header"
          style={{ animationDelay: "100ms" }}
        >
          <div className="section-header-body">
            <h2 className="section-header-title">Latest Job Updates</h2>
            <p className="section-header-copy">
              Find the newest verified openings from top companies.
            </p>
          </div>
          <Link href="/jobs" className="section-header-link group">
            <span>View all openings</span>
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {latestJobs.map((job, index) => (
            <li key={job.slug} className="min-w-0">
              <JobCard job={job} style={{ animationDelay: `${180 + index * 90}ms` }} />
            </li>
          ))}
        </ul>

        {latestJobs.length === 0 ? (
          <EmptyStateCard title="No jobs yet" />
        ) : null}
      </section>

      <section className="space-y-5">
        <div
          className="fade-up section-header"
          style={{ animationDelay: "120ms" }}
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

        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestBlogs.map((blog, index) => (
            <li key={blog.slug} className="min-w-0">
              <BlogCard
                blog={blog}
                style={{ animationDelay: `${220 + index * 90}ms` }}
              />
            </li>
          ))}
        </ul>

        {latestBlogs.length === 0 ? (
          <EmptyStateCard title="No blogs yet" />
        ) : null}
      </section>
    </div>
  );
}
