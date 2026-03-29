import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import JobCard from "@/components/JobCard";
import { getAllJobs, type JobPost } from "@/lib/jobs";
import {
  getAllJobSegmentConfigs,
  getJobSegmentConfig,
  getJobsForSegment,
  isJobSegmentSlug,
} from "@/lib/jobSegments";

export const metadata: Metadata = {
  title: "Verified Jobs, Fresher Jobs, and Internships in India",
  description:
    "Browse verified jobs in India including fresher jobs, internships, experienced roles, and remote-friendly openings with direct apply links.",
  alternates: {
    canonical: "/jobs/",
  },
};

type JobsPageProps = {
  searchParams?: {
    q?: string | string[];
    location?: string | string[];
    type?: string | string[];
    status?: string | string[];
    sort?: string | string[];
    segment?: string | string[];
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
  const rawSegmentFilter = toSingleValue(searchParams?.segment).toLowerCase();
  const segmentFilter = isJobSegmentSlug(rawSegmentFilter) ? rawSegmentFilter : "";
  const jobsForCurrentSegment = segmentFilter
    ? getJobsForSegment(jobs, segmentFilter)
    : jobs;
  const activeSegment = segmentFilter ? getJobSegmentConfig(segmentFilter) : null;
  const segmentCards = getAllJobSegmentConfigs().map((segment) => ({
    ...segment,
    count: getJobsForSegment(jobs, segment.slug).length,
  }));

  const locationOptions = toUniqueSortedValues(
    jobsForCurrentSegment.map((job) => job.location),
  );
  const typeOptions = toUniqueSortedValues(
    jobsForCurrentSegment.map((job) => job.employmentType || job.jobType || ""),
  );

  const filteredJobs = jobsForCurrentSegment.filter((job) => {
    if (query && !matchesSearch(job, query)) {
      return false;
    }

    if (locationFilter) {
      const normalizedLocation = job.location.toLowerCase();
      const normalizedLocationFilter = locationFilter.toLowerCase();

      if (!normalizedLocation.includes(normalizedLocationFilter)) {
        return false;
      }
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

  const hasActiveFilters = Boolean(
    query || locationFilter || typeFilter || statusFilter || segmentFilter,
  );

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="fade-up page-intro-surface px-5 py-5 sm:px-8 sm:py-6">
          <span className="page-kicker">Jobs Directory</span>
          <h1 className="page-title">All Jobs</h1>
          <p className="page-copy">
            Explore the latest job openings with complete role information and direct application
            links.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {segmentCards.map((segment) => (
              <Link
                key={segment.slug}
                href={segment.href}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {segment.kicker}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{segment.label}</p>
                <p className="mt-1 text-sm text-slate-600">{segment.count} live openings</p>
              </Link>
            ))}
          </div>
          <form action="/jobs" method="get" className="filter-panel mt-4 sm:grid-cols-2 xl:grid-cols-4">
            <label htmlFor="jobs-search" className="sr-only">
              Search jobs
            </label>
            <input
              id="jobs-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by title, company, location, or skill"
              className="form-control sm:col-span-2 xl:col-span-2"
            />
            <select
              name="location"
              defaultValue={locationFilter}
              className="form-control"
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
              className="form-control"
            >
              <option value="">All types</option>
              {typeOptions.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
            <select
              name="segment"
              defaultValue={segmentFilter || "all"}
              className="form-control"
            >
              <option value="all">All paths</option>
              {segmentCards.map((segment) => (
                <option key={segment.slug} value={segment.slug}>
                  {segment.label}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="form-control"
            >
              <option value="">All statuses</option>
              <option value="open">Open now</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
            <select
              name="sort"
              defaultValue={sortFilter}
              className="form-control"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="closingSoon">Closing soon</option>
            </select>
            <ActionButton variant="primary" buttonType="submit" className="w-full">
              Search
            </ActionButton>
            {hasActiveFilters || sortFilter !== "newest" ? (
              <ActionButton href="/jobs" variant="secondary" className="w-full">
                Clear
              </ActionButton>
            ) : null}
          </form>
        </div>

        <p className="px-1 text-sm text-slate-600">
          {sortedJobs.length} result{sortedJobs.length === 1 ? "" : "s"}
          {activeSegment ? (
            <>
              {" "}
              in <span className="font-semibold text-slate-800">{activeSegment.label}</span>
            </>
          ) : null}
          {query ? (
            <>
              {" "}
              for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
        {sortedJobs.map((job) => (
          <div key={job.slug} className="min-w-0">
            <JobCard job={job} />
          </div>
        ))}
      </div>

      {sortedJobs.length === 0 && (query || hasActiveFilters) ? (
        <p className="soft-note px-4 py-4 text-slate-600">
          No jobs matched your filters. Try different keywords or reset the filters.
        </p>
      ) : null}

      {jobs.length === 0 && !hasActiveFilters ? (
        <p className="soft-note px-4 py-4 text-slate-600">No jobs available right now.</p>
      ) : null}
    </section>
  );
}
