import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import JobCard from "@/components/JobCard";
import { getAllJobs, type JobPost } from "@/lib/jobs";
import { getJobsForSegment, isJobSegmentSlug } from "@/lib/jobSegments";

export const metadata: Metadata = {
  title: "Jobs",
  description:
    "Browse all job updates on JobAdvice including company, location, and role details.",
  alternates: {
    canonical: "/jobs/",
  },
};

type JobsPageProps = {
  searchParams?: {
    q?: string | string[];
    location?: string | string[];
    segment?: string | string[];
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
  const rawSegmentFilter = toSingleValue(searchParams?.segment).toLowerCase();
  const segmentFilter = isJobSegmentSlug(rawSegmentFilter) ? rawSegmentFilter : "";
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

    if (segmentFilter && !getJobsForSegment([job], segmentFilter).length) {
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

  const hasActiveFilters = Boolean(query || locationFilter || segmentFilter || typeFilter || statusFilter);
  const showClearAction = hasActiveFilters || sortFilter !== "newest";

  return (
    <section className="space-y-8">
      <div className="fade-up jobs-directory-toolbar">
        <div className="jobs-directory-topbar">
          <div className="jobs-directory-title-line">
            <span className="jobs-directory-kicker">Jobs Directory</span>
            <h1 className="jobs-directory-inline-title">All Jobs</h1>
          </div>
          <div className="jobs-directory-count-pill jobs-directory-count-pill-desktop">
            {sortedJobs.length} result{sortedJobs.length === 1 ? "" : "s"}
          </div>
        </div>

        <form action="/jobs" method="get" className="jobs-directory-mobile-form">
          {segmentFilter ? <input type="hidden" name="segment" value={segmentFilter} /> : null}
          <div className="jobs-directory-mobile-select-row">
            <label htmlFor="jobs-mobile-location" className="sr-only">
              Filter by location
            </label>
            <select
              id="jobs-mobile-location"
              name="location"
              defaultValue={locationFilter}
              className="form-control jobs-directory-control jobs-directory-mobile-control"
            >
              <option value="">Location</option>
              {locationOptions.map((locationOption) => (
                <option key={locationOption} value={locationOption}>
                  {locationOption}
                </option>
              ))}
            </select>

            <label htmlFor="jobs-mobile-type" className="sr-only">
              Filter by type
            </label>
            <select
              id="jobs-mobile-type"
              name="type"
              defaultValue={typeFilter}
              className="form-control jobs-directory-control jobs-directory-mobile-control"
            >
              <option value="">Type</option>
              {typeOptions.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>

            <label htmlFor="jobs-mobile-sort" className="sr-only">
              Sort jobs
            </label>
            <select
              id="jobs-mobile-sort"
              name="sort"
              defaultValue={sortFilter}
              className="form-control jobs-directory-control jobs-directory-mobile-control"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="closingSoon">Closing soon</option>
            </select>
          </div>

          <div className="jobs-directory-mobile-search-row">
            <label htmlFor="jobs-mobile-search" className="sr-only">
              Search jobs
            </label>
            <input
              id="jobs-mobile-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search jobs"
              className="form-control jobs-directory-control jobs-directory-mobile-search-input"
            />

            <button
              type="submit"
              className="jobs-directory-mobile-search-button"
              aria-label="Search jobs"
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

        <form
          action="/jobs"
          method="get"
          className={`jobs-directory-desktop-form jobs-directory-toolbar-form jobs-directory-filter-panel${
            showClearAction ? " jobs-directory-filter-panel-has-clear" : ""
          }`}
        >
          {segmentFilter ? <input type="hidden" name="segment" value={segmentFilter} /> : null}
          <label htmlFor="jobs-search" className="sr-only">
            Search jobs
          </label>
          <input
            id="jobs-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by title, company, location, or skill"
            className="form-control jobs-directory-control"
          />
          <select
            name="location"
            defaultValue={locationFilter}
            className="form-control jobs-directory-control"
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
            className="form-control jobs-directory-control"
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
            className="form-control jobs-directory-control"
          >
            <option value="">All statuses</option>
            <option value="open">Open now</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
          <select
            name="sort"
            defaultValue={sortFilter}
            className="form-control jobs-directory-control"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="closingSoon">Closing soon</option>
          </select>
          <ActionButton
            variant="primary"
            buttonType="submit"
            className="jobs-directory-action w-full"
          >
            Search
          </ActionButton>
          {showClearAction ? (
            <ActionButton href="/jobs" variant="secondary" className="jobs-directory-action w-full">
              Clear
            </ActionButton>
          ) : null}
        </form>
      </div>

      <div className="jobs-directory-grid grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {sortedJobs.map((job) => (
          <div key={job.slug} className="min-w-0 h-full">
            <JobCard job={job} compact />
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
