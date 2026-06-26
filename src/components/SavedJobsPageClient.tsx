"use client";

import ActionButton from "@/components/ActionButton";
import EmptyStateCard from "@/components/EmptyStateCard";
import { useSavedJobs } from "@/lib/useSavedJobs";
import JobCard from "@/components/JobCard";
import SaveTipBanner from "@/components/SaveTipBanner";
import type { JobPost } from "@/lib/jobs";

type SavedJobsPageClientProps = {
  jobs: JobPost[];
};

type SavedJobsVisibleJob = JobPost & {
  savedAt: string;
};

export default function SavedJobsPageClient({
  jobs,
}: SavedJobsPageClientProps) {
  const { clearSavedJobs, hasLoaded, savedJobCount, savedJobs } = useSavedJobs();
  const jobsBySlug = new Map(jobs.map((job) => [job.slug, job]));
  const visibleJobs: SavedJobsVisibleJob[] = [];

  for (const savedJob of savedJobs) {
    const matchingJob = jobsBySlug.get(savedJob.slug);
    if (!matchingJob) {
      continue;
    }

    visibleJobs.push({
      ...matchingJob,
      savedAt: savedJob.savedAt,
    });
  }

  const missingSavedJobsCount = Math.max(savedJobCount - visibleJobs.length, 0);

  return (
    <section className="saved-jobs-page">
      <div className="fade-up saved-jobs-hero card-surface rounded-[1.6rem] px-5 py-5 sm:px-6 sm:py-6">
        <div className="saved-jobs-hero-copy">
          <p className="jobs-directory-kicker">Saved Jobs</p>
          <h1 className="saved-jobs-title">Keep the roles you want to revisit in one place.</h1>
          <p className="saved-jobs-text">
            Saved jobs stay on this device for quick follow-up while you compare openings, polish
            your resume, or come back later.
          </p>
        </div>

        <div className="saved-jobs-hero-actions">
          <ActionButton href="/jobs" variant="secondary" className="sm:w-auto">
            Browse Jobs
          </ActionButton>
          {hasLoaded && savedJobCount > 0 ? (
            <ActionButton
              variant="muted"
              buttonType="button"
              onClick={() => {
                if (!window.confirm("Remove all saved jobs from this device?")) {
                  return;
                }

                clearSavedJobs();
              }}
              className="sm:w-auto"
            >
              Clear All
            </ActionButton>
          ) : null}
          <span className="saved-jobs-hero-count">
            {hasLoaded ? `${savedJobCount} saved job${savedJobCount === 1 ? "" : "s"}` : "Loading..."}
          </span>
        </div>
        {hasLoaded && savedJobCount === 0 ? <SaveTipBanner /> : null}
      </div>

      {hasLoaded && missingSavedJobsCount > 0 ? (
        <div className="saved-jobs-note">
          {missingSavedJobsCount} saved job{missingSavedJobsCount === 1 ? "" : "s"} {missingSavedJobsCount === 1 ? "is" : "are"} no longer live on the public site, so only active listings are shown below.
        </div>
      ) : null}

      {!hasLoaded ? (
        <EmptyStateCard
          title="Loading your saved jobs"
          description="Checking this device for the roles you bookmarked."
        />
      ) : null}

      {hasLoaded && savedJobCount === 0 ? (
        <div className="saved-jobs-empty">
          <EmptyStateCard
            title="No saved jobs yet"
            description="Bookmark roles from job cards or job detail pages, and they will show up here for quick follow-up."
          />
          <div className="saved-jobs-empty-actions">
            <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
              Start Browsing
            </ActionButton>
          </div>
        </div>
      ) : null}

      {hasLoaded && savedJobCount > 0 && visibleJobs.length === 0 ? (
        <div className="saved-jobs-empty">
          <EmptyStateCard
            title="Your saved jobs are no longer live"
            description="Listings can disappear after they expire or are removed. You can browse fresh openings or clear the saved list for this device."
          />
          <div className="saved-jobs-empty-actions">
            <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
              Browse Fresh Jobs
            </ActionButton>
          </div>
        </div>
      ) : null}

      {hasLoaded && visibleJobs.length > 0 ? (
        <div className="saved-jobs-grid">
          {visibleJobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
