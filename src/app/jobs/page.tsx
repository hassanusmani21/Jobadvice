import type { Metadata } from "next";
import Link from "next/link";
import JobCard from "@/components/JobCard";
import { getAllJobs, type JobPost } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Jobs",
  description:
    "Browse all job updates on JobAdvice including company, location, and role details.",
  alternates: {
    canonical: "/jobs",
  },
};

type JobsPageProps = {
  searchParams?: {
    q?: string | string[];
    location?: string | string[];
    type?: string | string[];
    status?: string | string[];
    sort?: string | string[];
  };
};

const toSingleValue = (rawValue: string | string[] | undefined) => {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  return typeof value === "string" ? value.trim() : "";
};

const matchesSearch = (job: JobPost, query: string) => {
  const haystack = [
    job.title,
    job.company,
    job.location,
    job.summary || "",
    job.experience || "",
    job.experienceLevel || "",
    job.eligibilityCriteria || "",
    job.employmentType || job.jobType || "",
    job.skills.join(" "),
    job.responsibilities.join(" "),
    job.education.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

const toUniqueSortedValues = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((first, second) => first.localeCompare(second));

const isOpenStatus = (job: JobPost) =>
  ["open", "expiring_soon", "expires_today", "no_expiry"].includes(
    job.applicationStatus.state,
  );

const toSortableDate = (value: string | null | undefined) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const jobs = await getAllJobs();
  const query = toSingleValue(searchParams?.q);
  const locationFilter = toSingleValue(searchParams?.location);
  const typeFilter = toSingleValue(searchParams?.type);
  const statusFilter = toSingleValue(searchParams?.status);
  const sortFilter = toSingleValue(searchParams?.sort) || "newest";

  const locationOptions = toUniqueSortedValues(jobs.map((job) => job.location));
  const typeOptions = toUniqueSortedValues(
    jobs.map((job) => job.employmentType || job.jobType || ""),
  );

  const filteredJobs = jobs.filter((job) => {
    if (query && !matchesSearch(job, query)) {
      return false;
    }

    if (locationFilter && job.location.toLowerCase() !== locationFilter.toLowerCase()) {
      return false;
    }

    const employmentType = (job.employmentType || job.jobType || "").toLowerCase();
    if (typeFilter && employmentType !== typeFilter.toLowerCase()) {
      return false;
    }

    if (statusFilter === "open" && !isOpenStatus(job)) {
      return false;
    }

    if (statusFilter === "upcoming" && job.applicationStatus.state !== "upcoming") {
      return false;
    }

    if (statusFilter === "expired" && job.applicationStatus.state !== "expired") {
      return false;
    }

    return true;
  });

  const sortedJobs = [...filteredJobs].sort((firstJob, secondJob) => {
    if (sortFilter === "oldest") {
      return new Date(firstJob.date).getTime() - new Date(secondJob.date).getTime();
    }

    if (sortFilter === "closingSoon") {
      return (
        toSortableDate(firstJob.applicationEndDate) -
        toSortableDate(secondJob.applicationEndDate)
      );
    }

    return new Date(secondJob.date).getTime() - new Date(firstJob.date).getTime();
  });

  const hasActiveFilters = Boolean(query || locationFilter || typeFilter || statusFilter);

  return (
    <section className="space-y-6">
      <div className="fade-up space-y-4">
        <h1 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">All Jobs</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Explore the latest job openings with complete role information and direct application
          links.
        </p>
        <form action="/jobs" method="get" className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label htmlFor="jobs-search" className="sr-only">
            Search jobs
          </label>
          <input
            id="jobs-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by title, company, location, or skill"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none ring-teal-200 transition focus:border-teal-300 focus:ring-2 sm:col-span-2 xl:col-span-2"
          />
          <select
            name="location"
            defaultValue={locationFilter}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-300 focus:ring-2"
          >
            <option value="">All locations</option>
            {locationOptions.map((locationOption) => (
              <option key={locationOption} value={locationOption}>
                {locationOption}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={typeFilter}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-300 focus:ring-2"
          >
            <option value="">All types</option>
            {typeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-300 focus:ring-2"
          >
            <option value="">All statuses</option>
            <option value="open">Open now</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
          <select
            name="sort"
            defaultValue={sortFilter}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-300 focus:ring-2"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="closingSoon">Closing soon</option>
          </select>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Search
          </button>
          {hasActiveFilters || sortFilter !== "newest" ? (
            <Link
              href="/jobs"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
            >
              Clear
            </Link>
          ) : null}
        </form>
        <p className="text-sm text-slate-600">
          {sortedJobs.length} result{sortedJobs.length === 1 ? "" : "s"}
          {query ? (
            <>
              {" "}
              for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedJobs.map((job) => (
          <div key={job.slug} className="min-w-0">
            <JobCard job={job} />
          </div>
        ))}
      </div>

      {sortedJobs.length === 0 && (query || hasActiveFilters) ? (
        <p className="rounded-2xl bg-white/80 p-4 text-slate-600">
          No jobs matched your filters. Try different keywords or reset the filters.
        </p>
      ) : null}

      {jobs.length === 0 && !hasActiveFilters ? (
        <p className="rounded-2xl bg-white/80 p-4 text-slate-600">No jobs available right now.</p>
      ) : null}
    </section>
  );
}
