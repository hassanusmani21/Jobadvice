import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
import { getLatestBlogs } from "@/lib/blogs";
import { getLatestJobs } from "@/lib/jobs";
import { siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  title: "Verified Jobs and Internships in India",
  description: siteDescription,
};

export const revalidate = 60 * 60;
const whatsappChannelUrl = "https://whatsapp.com/channel/0029Vb7MyM0BPzjaKwa1cr1f";

export default async function HomePage() {
  const [latestJobs, latestBlogs] = await Promise.all([
    getLatestJobs(6),
    getLatestBlogs(3),
  ]);

  return (
    <div className="space-y-10">
      <section className="fade-up hero-surface relative overflow-hidden px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
        <div
          aria-hidden
          className="absolute -top-16 right-[-4.5rem] h-40 w-40 rounded-full bg-white/55 blur-3xl sm:h-56 sm:w-56"
        />
        <div
          aria-hidden
          className="absolute -bottom-14 left-[-3.5rem] h-32 w-32 rounded-full bg-teal-200/55 blur-3xl sm:h-44 sm:w-44"
        />

        <div className="relative grid gap-4 lg:min-h-[15.75rem] lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.86fr)] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <p className="inline-flex rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-900 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.3)]">
                JobAdvice
              </p>
              <h1 className="mt-3.5 max-w-3xl font-serif text-[1.85rem] leading-[1.02] text-slate-900 sm:text-[2.55rem] lg:text-[2.95rem]">
                Find verified jobs and internships in India
              </h1>
              <p className="mt-3.5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Daily verified openings • Direct apply links • Fresh updates
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
                Browse Jobs
              </ActionButton>
              <ActionButton href="/blog" variant="secondary" className="sm:w-auto">
                Browse Blog
              </ActionButton>
            </div>
          </div>

          <aside className="card-surface flex h-full flex-col justify-between rounded-[1.4rem] p-4 sm:p-[1.125rem]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Community
              </p>
              <h2 className="mt-2 font-serif text-[1.32rem] leading-[1.08] text-slate-900 sm:text-[1.6rem]">
                Join 5,000+ students getting daily job updates
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                  <p className="text-lg font-extrabold text-emerald-800">5k+</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Students
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-3">
                  <p className="text-lg font-extrabold text-sky-800">Daily</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                    Updates
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-3 py-3">
                  <p className="text-lg font-extrabold text-amber-800">India</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Focused
                  </p>
                </div>
              </div>

              <ActionButton
                href={whatsappChannelUrl}
                external
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="w-full"
              >
                Join WhatsApp Community
              </ActionButton>
            </div>
          </aside>
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
              Find the newest opportunities from top companies.
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
              Career guides, hiring signals, and practical reads from the same visual system.
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
