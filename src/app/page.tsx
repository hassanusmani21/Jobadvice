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

  return (
    <div className="space-y-8">
      <section className="fade-up hero-surface relative overflow-hidden px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-6">
        <div
          aria-hidden
          className="absolute -top-16 right-[-4.5rem] h-40 w-40 rounded-full bg-white/55 blur-3xl sm:h-56 sm:w-56"
        />
        <div
          aria-hidden
          className="absolute -bottom-14 left-[-3.5rem] h-32 w-32 rounded-full bg-teal-200/55 blur-3xl sm:h-44 sm:w-44"
        />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(17.5rem,0.82fr)] lg:items-center">
          <div className="max-w-3xl">
            <span className="page-kicker">JobAdvice</span>
            <h1 className="page-title max-w-3xl !text-[1.9rem] sm:!text-[2.45rem] lg:!text-[2.8rem]">
              Find verified jobs and internships in India
            </h1>
            <p className="page-copy max-w-2xl !mt-3 !text-[0.95rem] !leading-7">
              Direct-apply openings, fresher-friendly details, and daily updates in one cleaner
              place.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {["Verified sources", "Direct apply", "Fresh updates"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
                Browse Jobs
              </ActionButton>
              <ActionButton href="/blog" variant="secondary" className="sm:w-auto">
                Browse Blog
              </ActionButton>
            </div>
          </div>

          <aside className="card-surface h-full rounded-[1.45rem] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Community
            </p>
            <h2 className="mt-2 font-serif text-[1.2rem] leading-[1.08] text-slate-900 sm:text-[1.42rem]">
              Join the WhatsApp community
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Get daily verified openings, internship updates, and direct links in one place.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/65 px-4 py-2.5 text-sm font-medium text-slate-600">
              5k+ students • daily updates • direct links
            </div>

            <ActionButton
              href={whatsappChannelUrl}
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="mt-3 w-full"
            >
              Join WhatsApp Community
            </ActionButton>
          </aside>
        </div>
      </section>

      <section className="fade-up px-2 pt-0 sm:px-4 sm:pt-1">
        <div className="home-search-surface mx-auto max-w-5xl p-2.5 sm:p-3">
          <form action="/jobs" method="get">
            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.75fr)_minmax(11rem,0.92fr)_minmax(11rem,0.92fr)_auto] lg:items-center">
              <label className="home-search-control flex min-h-14 min-w-0 items-center gap-3 px-4">
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
              </label>

              <label className="block min-w-0">
                <span className="sr-only">Choose job type</span>
                <select
                  name="segment"
                  defaultValue="all"
                  className="home-search-control min-h-14 w-full px-4 text-sm text-slate-700 outline-none"
                >
                  <option value="all">Job type</option>
                  {finderSegmentOptions.map((segment) => (
                    <option key={segment.slug} value={segment.slug}>
                      {segment.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="sr-only">Enter location</span>
                <input
                  name="location"
                  type="text"
                  list="homepage-job-locations"
                  placeholder="Location"
                  className="home-search-control min-h-14 w-full px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>

              <ActionButton
                variant="primary"
                buttonType="submit"
                className="min-h-14 w-full rounded-[1.35rem] px-7 lg:w-auto"
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
