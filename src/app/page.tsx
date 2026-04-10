import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
import ResumeBuilderPromoPopup from "@/components/ResumeBuilderPromoPopup";
import { getLatestBlogs } from "@/lib/blogs";
import { getAllJobs } from "@/lib/jobs";
import { getAllJobSegmentConfigs } from "@/lib/jobSegments";

export const metadata: Metadata = {
  title: "Fresher Jobs, Internships, and Verified Openings in India",
  description:
    "Discover verified fresher jobs, internships, and direct-apply openings in India along with practical career guidance for students and early-career job seekers.",
};

export const revalidate = 60 * 60;
const whatsappChannelUrl = "https://whatsapp.com/channel/0029Vb7MyM0BPzjaKwa1cr1f";
const resumePromoStorageKey = "resume_popup_homepage_v3";

const joinClasses = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

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
  const finderSegmentOptions = getAllJobSegmentConfigs();
  const finderLocationOptions = toTopLocations(allJobs.map((job) => job.location));
  const coveredLocationCount = finderLocationOptions.length;
  const heroStatsSummary = `${allJobs.length}+ jobs • ${coveredLocationCount}+ cities`;
  const heroMetrics = [
    { value: `${allJobs.length}+`, label: "Verified Jobs" },
    { value: "Direct Apply", label: "Only" },
    { value: `${coveredLocationCount}+`, label: "Cities" },
  ];
  const communityTrustItems = ["Verified links", "No spam", "Daily updates"];
  const communityContent = (
      <div className="home-community-body items-center text-center lg:items-start lg:text-left">
        <p className="home-community-kicker text-sm font-medium uppercase tracking-[0.12em] text-emerald-700 lg:text-[11px] lg:font-semibold lg:tracking-[0.22em]">
          WhatsApp
        </p>

      <div className="mx-auto mt-2 max-w-[17rem] space-y-1.5 sm:max-w-[20rem] lg:mx-0 lg:max-w-none">
        <h2 className="home-community-title mx-auto font-serif text-[1.05rem] leading-[1.08] text-slate-900 sm:text-[1.18rem] lg:mx-0">
          Get faster job updates
        </h2>

        <p className="home-community-proof mx-auto text-[0.84rem] font-medium text-slate-600 sm:text-[0.94rem] lg:mx-0">
          5k+ members • daily updates
        </p>

        <div
          className="home-community-trust-row justify-center lg:justify-start"
          aria-label="WhatsApp update highlights"
        >
          {communityTrustItems.map((item) => (
            <span key={item} className="home-community-trust-item">
              <span aria-hidden="true" className="home-community-trust-icon">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                  <path
                    d="M4 8.2 6.5 10.7 12 5.3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      <ActionButton
        href={whatsappChannelUrl}
        external
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        className="home-community-button mt-3 w-full max-w-[17rem] self-center lg:mt-3.5 lg:max-w-none lg:self-auto"
      >
        Join WhatsApp Updates
      </ActionButton>
    </div>
  );

  const communityCard = (className?: string) => (
    <aside
      className={joinClasses(
        "home-community-card card-surface h-full rounded-2xl",
        className,
      )}
    >
      {communityContent}
    </aside>
  );

  return (
    <div className="min-h-screen space-y-5 lg:space-y-3">
      <ResumeBuilderPromoPopup delayMs={1500} storageKey={resumePromoStorageKey} />

      <div className="home-first-fold">
        <section className="fade-up hero-surface home-hero-shell relative overflow-visible rounded-2xl px-4 py-5 sm:px-7 sm:py-7 md:py-8 lg:flex lg:min-h-[62vh] lg:items-center lg:px-8 lg:py-8">
          <div
            aria-hidden
            className="absolute -top-24 right-[-5rem] h-44 w-44 rounded-full bg-white/45 blur-3xl sm:h-64 sm:w-64"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 left-[-4rem] h-36 w-36 rounded-full bg-teal-200/40 blur-3xl sm:h-52 sm:w-52"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-emerald-500/10 blur-[120px] sm:h-72 sm:w-72 lg:h-80 lg:w-80"
          />
          <div
            aria-hidden
            className="absolute inset-y-10 left-[61%] hidden w-px bg-gradient-to-b from-transparent via-white/12 to-transparent lg:block"
          />

          <div className="relative z-[1] home-hero-grid grid content-start gap-3.5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-4">
            <div className="home-hero-copy mx-auto max-w-3xl space-y-2.5 text-center sm:space-y-3.5 lg:mx-0 lg:max-w-[36rem] lg:space-y-2 lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:justify-start">
                <span className="page-kicker home-hero-kicker">Fresh jobs updated daily</span>
                <span className="home-hero-live-pill hidden lg:inline-flex">Verified listings</span>
              </div>

              <div className="space-y-2 sm:space-y-2.5 lg:space-y-1">
                <h1 className="page-title home-hero-title mx-auto max-w-xs !mt-0 !text-2xl !leading-[1.2] sm:max-w-3xl sm:!text-3xl sm:!leading-[1.02] lg:mx-0 lg:!text-[2.75rem] lg:!leading-[1.08] lg:!tracking-[-0.024em] lg:!font-semibold xl:!text-[2.9rem]">
                  Find Verified Jobs in India
                </h1>

                <p className="page-copy home-hero-copy-text mx-auto max-w-[17rem] !mt-0 !text-[0.95rem] !leading-[1.55] sm:max-w-[24rem] sm:!text-[1rem] lg:mx-0 lg:!mt-1 lg:!mb-2 lg:max-w-[31rem] lg:!text-[1rem] lg:!leading-[1.5]">
                  <span className="sm:hidden">Direct apply. No spam.</span>
                  <span className="hidden sm:inline">Direct apply. No spam. Updated daily.</span>
                </p>
              </div>

              <p className="home-hero-compact-stats mx-auto mt-0 sm:hidden">{heroStatsSummary}</p>

              <div className="home-hero-proof-row mx-auto mt-0 hidden max-w-[24rem] flex-wrap items-center justify-center gap-2 sm:flex sm:max-w-none lg:mx-0 lg:justify-start">
                {heroMetrics.map((metric) => (
                  <span key={metric.label} className="home-hero-proof-chip">
                    <span className="home-hero-proof-value">{metric.value}</span>
                    <span className="home-hero-proof-label">{metric.label}</span>
                  </span>
                ))}
              </div>

              <div className="home-hero-action-row mx-auto mt-0 flex max-w-[17rem] flex-col items-stretch gap-2 sm:max-w-[16rem] lg:mx-0 lg:max-w-none lg:flex-row lg:flex-wrap lg:items-center lg:gap-2">
                <ActionButton
                  href="/jobs"
                  variant="primary"
                  className="home-hero-primary-action w-full lg:w-auto"
                >
                  Browse Jobs <span aria-hidden="true">→</span>
                </ActionButton>
                <ActionButton
                  href="/blog"
                  variant="secondary"
                  className="home-hero-secondary-action w-full lg:w-auto"
                >
                  Career Guides
                </ActionButton>
              </div>
            </div>

            <div className="home-hero-mobile-community block lg:hidden">
              <div aria-hidden="true" className="home-hero-mobile-divider" />
              <div className="home-hero-mobile-community-panel">
                {communityContent}
              </div>
            </div>

            {communityCard("home-community-card-desktop hidden lg:flex")}
          </div>
        </section>

        <section className="fade-up home-search-wrap relative mt-4 px-2 sm:px-4 md:mt-5 lg:-mt-12 lg:px-0">
          <div className="home-search-surface home-search-shell mx-auto max-w-5xl p-2.5 sm:p-3 lg:max-w-none lg:p-1.5">
            <div className="home-mobile-filter-panel lg:hidden">
              <form action="/jobs" method="get" aria-label="Search jobs" className="home-mobile-filter-form">
                <div className="home-mobile-filter-search-row">
                  <label className="home-mobile-filter-search-field">
                    <span className="sr-only">Search jobs, companies, or skills</span>
                    <input
                      name="q"
                      type="search"
                      placeholder="Search jobs, companies, or skills"
                      className="home-mobile-filter-search-input"
                    />
                  </label>

                  <button
                    type="submit"
                    aria-label="Search jobs"
                    className="home-mobile-filter-search-button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                      <path
                        d="m14.5 14.5 3 3m-1.5-8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="home-mobile-filter-grid" aria-label="Job filters">
                <Link href="/jobs?segment=freshers" className="home-mobile-filter-chip home-mobile-filter-chip-accent">
                  Student
                </Link>
                <Link href="/jobs#jobs-search" className="home-mobile-filter-chip">
                  Location
                </Link>
                <Link href="/jobs?segment=remote" className="home-mobile-filter-chip">
                  Remote
                </Link>
                <Link href="/jobs" className="home-mobile-filter-chip">
                  All Types
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <form action="/jobs" method="get" aria-label="Job search">
                <div className="home-search-grid grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(11rem,0.92fr)_minmax(11rem,0.92fr)_auto] lg:items-end">
                  <label className="home-search-field block min-w-0">
                    <span className="home-search-label sr-only sm:not-sr-only sm:inline-block">
                      Role or company
                    </span>
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
                        placeholder="Role or company"
                        className="home-search-input min-w-0 w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <label className="home-search-field block min-w-0">
                    <span className="home-search-label sr-only sm:not-sr-only sm:inline-block">
                      Job type
                    </span>
                    <select
                      name="segment"
                      defaultValue="all"
                      className="home-search-control home-search-control-rich w-full px-4 text-sm text-slate-700 outline-none"
                    >
                      <option value="all">Job type</option>
                      {finderSegmentOptions.map((segment) => (
                        <option key={segment.slug} value={segment.slug}>
                          {segment.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="home-search-field block min-w-0">
                    <span className="home-search-label sr-only sm:not-sr-only sm:inline-block">
                      Location
                    </span>
                    <input
                      name="location"
                      type="text"
                      list="homepage-job-locations"
                      placeholder="City or location"
                      className="home-search-control home-search-control-rich w-full px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </label>

                  <ActionButton
                    variant="primary"
                    buttonType="submit"
                    className="home-search-submit w-full px-6 lg:w-auto"
                  >
                    Search
                  </ActionButton>
                </div>
                <datalist id="homepage-job-locations">
                  {finderLocationOptions.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </form>
            </div>
          </div>
        </section>
      </div>

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
