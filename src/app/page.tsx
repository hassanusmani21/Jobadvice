import type { Metadata } from "next";
import Link from "next/link";
import EmptyStateCard from "@/components/EmptyStateCard";
import JobCard from "@/components/JobCard";
import IdentityHashRedirect from "@/components/IdentityHashRedirect";
import { formatBlogDate, getLatestBlogs } from "@/lib/blogs";
import { getLatestJobs } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Find the latest job updates with company details, location, salary, and direct application links.",
};

export const revalidate = 60 * 60;

export default async function HomePage() {
  const [latestJobs, latestBlogs] = await Promise.all([
    getLatestJobs(6),
    getLatestBlogs(3),
  ]);

  return (
    <div className="space-y-10">
      <IdentityHashRedirect />
      <section className="fade-up hero-surface px-5 py-8 sm:px-10 sm:py-10">
        <h1 className="font-serif text-[2rem] leading-[1.15] text-slate-900 sm:text-[2.5rem]">
          JobAdvice
        </h1>
        <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
          Daily verified openings • Direct apply links • Fresh updates
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/jobs"
            className="inline-flex justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(15,118,110,0.34)] transition hover:bg-teal-800"
          >
            Browse all jobs
          </Link>
          <Link
            href="/blog"
            className="inline-flex justify-center rounded-xl border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
          >
            Browse all blogs
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div
          className="fade-up flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">Latest Job Updates</h2>
          <Link href="/jobs" className="text-sm font-semibold text-teal-800 transition hover:text-teal-900">
            View all openings
          </Link>
        </div>

        <ul className="grid gap-5 md:grid-cols-2">
          {latestJobs.map((job, index) => (
            <li key={job.slug}>
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
          className="fade-up flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">Latest Blog Insights</h2>
          <Link href="/blog" className="text-sm font-semibold text-teal-800 transition hover:text-teal-900">
            Read all blogs
          </Link>
        </div>

        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestBlogs.map((blog, index) => (
            <li
              key={blog.slug}
              className="fade-up card-surface rounded-2xl px-5 py-5"
              style={{ animationDelay: `${220 + index * 90}ms` }}
            >
              {blog.topic ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  {blog.topic}
                </p>
              ) : null}
              <h3 className="mt-2 text-lg font-bold text-slate-900">{blog.title}</h3>
              {blog.excerpt ? <p className="mt-2 text-sm leading-6 text-slate-600">{blog.excerpt}</p> : null}
              <p className="mt-3 text-xs text-slate-500">
                {formatBlogDate(blog.date)} • {blog.readingTimeMinutes} min read
              </p>
              <Link
                href={`/blog/${blog.slug}`}
                className="mt-4 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100"
              >
                Read Post
              </Link>
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
