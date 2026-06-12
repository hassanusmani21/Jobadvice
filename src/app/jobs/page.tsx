import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import JobAlertSignupCard from "@/components/JobAlertSignupCard";
import JobCard from "@/components/JobCard";
import {
  filterJobsByAlertFilters,
  hasActiveJobAlertFilters,
  normalizeJobFilters,
  sortJobsByFilters,
  toJobAlertFilters,
  type JobFilters,
} from "@/lib/jobFilters";
import { getAllJobs } from "@/lib/jobs";
import { createPageMetadata, noIndexFollowRobots } from "@/lib/seo";
import { getAllJobLocationLandings } from "@/lib/taxonomies";

type JobsPageProps = {
  searchParams?: {
    q?: string | string[];
    location?: string | string[];
    segment?: string | string[];
    type?: string | string[];
    status?: string | string[];
    sort?: string | string[];
    alert?: string | string[];
  };
};

const hasFilterSearchParams = (searchParams: JobsPageProps["searchParams"]) =>
  Boolean(
    searchParams?.q ||
      searchParams?.location ||
      searchParams?.segment ||
      searchParams?.type ||
      searchParams?.status ||
      searchParams?.sort ||
      searchParams?.alert,
  );

export async function generateMetadata({
  searchParams,
}: JobsPageProps): Promise<Metadata> {
  const baseMetadata = createPageMetadata({
    title: "Source-Checked Jobs, Internships, and Fresher Openings",
    description:
      "Browse source-checked jobs and internships with direct apply links, company details, locations, eligibility, and career-friendly role summaries.",
    path: "/jobs/",
    keywords: ["source checked jobs", "fresher jobs", "internships in India", "direct apply jobs"],
  });

  if (!hasFilterSearchParams(searchParams)) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    title: "Filtered Job Results",
    robots: noIndexFollowRobots,
  };
}

const toUniqueSortedValues = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((first, second) => first.localeCompare(second));

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const jobs = await getAllJobs();
  const toSingleValue = (rawValue: string | string[] | undefined) => {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    return typeof value === "string" ? value.trim() : "";
  };
  const filters: JobFilters = normalizeJobFilters({
    q: toSingleValue(searchParams?.q),
    location: toSingleValue(searchParams?.location),
    segment: toSingleValue(searchParams?.segment),
    type: toSingleValue(searchParams?.type),
    status: toSingleValue(searchParams?.status),
    sort: toSingleValue(searchParams?.sort),
  });
  const alertParam = toSingleValue(searchParams?.alert);
  const query = filters.query;
  const locationFilter = filters.location;
  const segmentFilter = filters.segment;
  const typeFilter = filters.type;
  const statusFilter = filters.status;
  const sortFilter = filters.sort;
  const alertFilters = toJobAlertFilters(filters);

  const locationOptions = toUniqueSortedValues(jobs.map((job) => job.location));
  const locationLandingPages = getAllJobLocationLandings(jobs).slice(0, 8);
  const typeOptions = toUniqueSortedValues(
    jobs.map((job) => job.employmentType || job.jobType || ""),
  );
  const directoryGuidance = [
    "Use location and work-mode filters to separate office, hybrid, and remote roles before comparing eligibility.",
    "Open the source link from each job page and confirm the employer, deadline, and required documents before applying.",
    "Save roles that match your current skills, then update your resume around the repeated requirements you see across listings.",
  ];

  const filteredJobs = filterJobsByAlertFilters(jobs, alertFilters);

  const sortedJobs = sortJobsByFilters(filteredJobs, sortFilter);

  const hasActiveFilters = hasActiveJobAlertFilters(alertFilters);
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

      {alertParam === "unsubscribed" ? (
        <p className="soft-note px-4 py-4 text-slate-600">
          Daily alert unsubscribed. You will not receive more emails for that saved filter.
        </p>
      ) : null}

      {alertParam === "unsubscribe-missing" ? (
        <p className="soft-note px-4 py-4 text-slate-600">
          That alert link is no longer valid. If you still want updates, create a fresh alert from
          the current filters.
        </p>
      ) : null}

      {locationLandingPages.length > 0 ? (
        <div className="fade-up hidden space-y-3 lg:block" style={{ animationDelay: "70ms" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Popular cities
            </span>
            {locationLandingPages.map((item) => (
              <Link
                key={item.slug}
                href={`/jobs/location/${item.slug}`}
                className="content-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {hasActiveFilters ? <JobAlertSignupCard filters={alertFilters} /> : null}

      {!hasActiveFilters && !query ? (
        <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "90ms" }}>
          <span className="page-kicker">How to Use This Directory</span>
          <h2 className="page-title">Compare jobs by source quality, not only title</h2>
          <p className="page-copy">
            A good application starts before the form opens. Use this directory to shortlist roles,
            check the company source, compare eligibility, and avoid applying blindly to every post
            with the same title.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {directoryGuidance.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4">
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="jobs-directory-grid grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {sortedJobs.map((job) => (
          <div key={job.slug} className="min-w-0 h-full">
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
