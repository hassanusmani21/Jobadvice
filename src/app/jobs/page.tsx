import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import JobCard from "@/components/JobCard";
import { getAllJobs, type JobPost } from "@/lib/jobs";
import {
  getAllJobSegmentConfigs,
  getJobsForSegment,
  isJobSegmentSlug,
} from "@/lib/jobSegments";

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
    segment?: string | string[];
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
  const rawSegmentFilter = toSingleValue(searchParams?.segment).toLowerCase();
  const segmentFilter = isJobSegmentSlug(rawSegmentFilter) ? rawSegmentFilter : "";
  const locationFilter = toSingleValue(searchParams?.location);
  const typeFilter = toSingleValue(searchParams?.type);
  const statusFilter = toSingleValue(searchParams?.status);
  const sortFilter = toSingleValue(searchParams?.sort) || "newest";

  const segmentOptions = getAllJobSegmentConfigs();
  const jobsForSelectedSegment = segmentFilter ? getJobsForSegment(jobs, segmentFilter) : jobs;
  const locationOptions = toUniqueSortedValues(jobs.map((job) => job.location));
  const typeOptions = toUniqueSortedValues(
    jobs.map((job) => job.employmentType || job.jobType || ""),
  );

  const filteredJobs = jobsForSelectedSegment.filter((job) => {
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

  const hasActiveFilters = Boolean(
    query || segmentFilter || locationFilter || typeFilter || statusFilter,
  );
  const showClearAction = hasActiveFilters || sortFilter !== "newest";

  return (
    <section className="space-y-8">
      <div className="fade-up jobs-directory-toolbar">
        <div className="jobs-directory-topbar">
          <div className="jobs-directory-title-line">
            <span className="jobs-directory-kicker">Jobs Directory</span>
            <h1 className="jobs-directory-inline-title">All Jobs</h1>
          </div>
          <div className="jobs-directory-count-pill">
            {sortedJobs.length} result{sortedJobs.length === 1 ? "" : "s"}
          </div>
        </div>

        <form
          action="/jobs"
          method="get"
          className={`jobs-directory-toolbar-form jobs-directory-filter-panel${
            showClearAction ? " jobs-directory-filter-panel-has-clear" : ""
          }`}
        >
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
            name="segment"
            defaultValue={segmentFilter}
            className="form-control jobs-directory-control"
          >
            <option value="">All categories</option>
            {segmentOptions.map((segmentOption) => (
              <option key={segmentOption.slug} value={segmentOption.slug}>
                {segmentOption.label}
              </option>
            ))}
          </select>
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
