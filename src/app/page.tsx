import type { Metadata } from "next";
import Link from "next/link";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import { formatBlogDate, getLatestBlogs } from "@/lib/blogs";
import { formatApplicationWindow, formatPostedDate, getLatestJobs } from "@/lib/jobs";

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
      <section className="fade-up card-surface rounded-3xl px-6 py-10 sm:px-10">
        <p className="inline-flex rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold tracking-wide text-teal-900">
          Daily career opportunities
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900 sm:text-5xl">
          JobAdvice
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Track updated openings, review requirements quickly, and apply directly to company
          hiring pages.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Browse all jobs
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
          >
            Browse all blogs
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div className="fade-up flex flex-wrap items-end justify-between gap-3" style={{ animationDelay: "100ms" }}>
          <h2 className="font-serif text-3xl text-slate-900">Latest Job Updates</h2>
          <Link href="/jobs" className="text-sm font-semibold text-teal-800 transition hover:text-teal-900">
            View all openings
          </Link>
        </div>

        <ul className="grid gap-5 md:grid-cols-2">
          {latestJobs.map((job, index) => {
            const workMode = job.workMode;
            const employmentType = job.employmentType || job.jobType;
            const experience = job.experience || job.experienceYears || job.experienceLevel;

            return (
              <li
                key={job.slug}
                className="fade-up card-surface rounded-2xl px-5 py-5 sm:px-6"
                style={{ animationDelay: `${180 + index * 90}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                    <p className="mt-1 text-base font-semibold text-slate-700">{job.company}</p>
                  </div>
                  <ApplicationStatusBadge status={job.applicationStatus} />
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                  {job.location ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Location: {job.location}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Posted: {formatPostedDate(job.date)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Apply Window:{" "}
                    {formatApplicationWindow(job.applicationStartDate, job.applicationEndDate)}
                  </span>
                  {workMode ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">Mode: {workMode}</span>
                  ) : null}
                  {employmentType ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">Type: {employmentType}</span>
                  ) : null}
                  {experience ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Experience: {experience}
                    </span>
                  ) : null}
                </div>

                <Link
                  href={`/jobs/${job.slug}`}
                  className="mt-5 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 transition hover:border-teal-300 hover:bg-teal-100"
                >
                  View Details
                </Link>
              </li>
            );
          })}
        </ul>

        {latestJobs.length === 0 ? (
          <p className="rounded-2xl bg-white/80 p-4 text-slate-600">
            No job posts are published yet. Admin can add jobs from <code>/admin</code>.
          </p>
        ) : null}
      </section>

      <section className="space-y-5">
        <div className="fade-up flex flex-wrap items-end justify-between gap-3" style={{ animationDelay: "120ms" }}>
          <h2 className="font-serif text-3xl text-slate-900">Latest Blog Insights</h2>
          <Link href="/blog" className="text-sm font-semibold text-teal-800 transition hover:text-teal-900">
            Read all blogs
          </Link>
        </div>

        <ul className="grid gap-5 md:grid-cols-3">
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
          <p className="rounded-2xl bg-white/80 p-4 text-slate-600">
            No blog posts are published yet. Admin can add blogs from <code>/admin</code>.
          </p>
        ) : null}
      </section>
    </div>
  );
}
