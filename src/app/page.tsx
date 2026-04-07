import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
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
  const directApplyCount = allJobs.filter((job) => Boolean(job.applyLink)).length;
  const heroMetrics = [
    { value: `${allJobs.length}+`, label: "openings" },
    { value: `${directApplyCount}+`, label: "direct apply" },
    { value: `${finderLocationOptions.length}+`, label: "locations" },
  ];
  const communityHighlights = [
    "Verified links",
    "Daily updates",
    "Internships",
  ];

  return (
    <div className="space-y-6 lg:space-y-4">
      <section className="fade-up hero-surface home-hero-shell relative overflow-hidden px-5 py-5 sm:px-7 sm:py-5 lg:px-8 lg:py-4.5">
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
          className="absolute inset-y-10 left-[44%] hidden w-px bg-gradient-to-b from-transparent via-white/12 to-transparent lg:block"
        />

        <div className="relative home-hero-grid grid gap-4 lg:grid-cols-[minmax(0,1.16fr)_minmax(17rem,0.84fr)] lg:items-center">
          <div className="home-hero-copy max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="page-kicker home-hero-kicker">JobAdvice</span>
              <span className="home-hero-live-pill">Updated daily</span>
            </div>

            <h1 className="page-title home-hero-title max-w-3xl !text-[1.9rem] sm:!text-[2.25rem] lg:!text-[2.48rem]">
              Find verified jobs and internships in India
            </h1>

            <p className="page-copy home-hero-copy-text max-w-2xl !mt-2.5 !text-[0.95rem] !leading-6 sm:!text-[1rem]">
              Direct-apply openings, fresher-friendly details, and daily updates in one cleaner
              place.
            </p>

            <div className="home-hero-proof-row mt-3.5 flex flex-wrap items-center gap-2">
              {heroMetrics.map((metric) => (
                <span key={metric.label} className="home-hero-proof-chip">
                  <span className="home-hero-proof-value">{metric.value}</span>
                  <span className="home-hero-proof-label">{metric.label}</span>
                </span>
              ))}
            </div>

            <div className="home-hero-action-row mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <ActionButton href="/jobs" variant="primary" className="home-hero-primary-action sm:w-auto">
                Browse Jobs
              </ActionButton>
              <ActionButton href="/blog" variant="secondary" className="home-hero-secondary-action sm:w-auto">
                Browse Blog
              </ActionButton>
            </div>
          </div>

          <aside className="home-community-card card-surface h-full rounded-[1.45rem] p-4 sm:p-[1.125rem]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="home-community-kicker text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Community
              </p>
              <span className="home-community-status">Fast lane</span>
            </div>

            <h2 className="home-community-title mt-2 font-serif text-[1.16rem] leading-[1.05] text-slate-900 sm:text-[1.28rem]">
              Join the WhatsApp community
            </h2>

            <p className="home-community-copy mt-2 text-sm leading-6 text-slate-600">
              Get verified openings and direct links in one faster WhatsApp feed.
            </p>

            <div className="home-community-signal mt-2.5 rounded-2xl border border-slate-200/80 bg-white/65 px-4 py-2.5 text-sm font-medium text-slate-600">
              5k+ students • verified posts • direct links
            </div>

            <div className="home-community-chip-row mt-2.5 flex flex-wrap gap-2">
              {communityHighlights.map((item) => (
                <span key={item} className="home-community-chip">
                  {item}
                </span>
              ))}
            </div>

            <ActionButton
              href={whatsappChannelUrl}
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="home-community-button mt-3.5 w-full"
            >
              Join WhatsApp Community
            </ActionButton>
          </aside>
        </div>
      </section>

      <section className="fade-up home-search-wrap px-2 pt-0 sm:px-4 lg:-mt-1">
        <div className="home-search-surface home-search-shell mx-auto max-w-5xl p-3 sm:p-3 lg:p-2.5">
          <form action="/jobs" method="get" aria-label="Job search">
            <div className="home-search-grid grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(11rem,0.92fr)_minmax(11rem,0.92fr)_auto] lg:items-end">
              <label className="home-search-field block min-w-0">
                <span className="home-search-label">Role or company</span>
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
                    placeholder="Role, company, or skill"
                    className="home-search-input min-w-0 w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="home-search-field block min-w-0">
                <span className="home-search-label">Job type</span>
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
                <span className="home-search-label">Location</span>
                <input
                  name="location"
                  type="text"
                  list="homepage-job-locations"
                  placeholder="Location"
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
