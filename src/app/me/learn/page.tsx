import type { Metadata } from "next";
import Link from "@/components/AppLink";
import GuestProgressMerge from "@/components/learn/GuestProgressMerge";
import { requireUserSession } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { getLearnerDashboardData, learnSubmissionStatusLabels } from "@/lib/learn/persistence";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Learning",
  robots: {
    index: false,
    follow: false,
  },
};

const toFirstName = (value: string | null | undefined) => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return "there";
  }

  return normalizedValue.split(/\s+/)[0] || "there";
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

const toTitleFromSlug = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export default async function MyLearningPage() {
  const session = await requireUserSession("/me/learn");
  const firstName = toFirstName(session.user.name);
  const isAdmin = isAdminRole(session.user.role);
  const dashboardData = await getLearnerDashboardData(session.user.id);
  const latestProgress = dashboardData.recentProgress[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <GuestProgressMerge />

      <section className="page-intro-surface px-5 py-5 sm:px-8 sm:py-6">
        <span className="page-kicker">Learning Dashboard</span>
        <h1 className="page-title">Welcome back, {firstName}</h1>
        <p className="page-copy">
          Your learner account is active. This dashboard now reads saved progress and drafts from
          the database and will grow as lesson and assignment flows are added.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/learn/" className="job-action-button job-action-button-primary">
            Explore Learn
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="job-action-button job-action-button-secondary">
              Open Admin
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article className="content-list-card rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Continue Learning
          </p>
          <h2 className="mt-3 font-serif text-2xl text-slate-900">Resume where you left off</h2>
          {latestProgress ? (
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-900">
                {toTitleFromSlug(latestProgress.lessonSlug)}
              </p>
              <p>
                {latestProgress.status === "completed"
                  ? "Completed"
                  : `${latestProgress.percentComplete}% complete`}
              </p>
              <p>Last opened {formatDateTime(latestProgress.lastOpenedAt || latestProgress.updatedAt)}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No lessons started yet. As soon as lesson progress is saved, your next step will show
              up here.
            </p>
          )}
        </article>

        <article className="content-list-card rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Saved Work
          </p>
          <h2 className="mt-3 font-serif text-2xl text-slate-900">Draft assignments</h2>
          {dashboardData.recentDrafts.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {dashboardData.recentDrafts.map((draft) => (
                <li key={`${draft.assignmentSlug}-${draft.language}`}>
                  <span className="font-semibold text-slate-900">
                    {toTitleFromSlug(draft.assignmentSlug)}
                  </span>{" "}
                  in {draft.language.toUpperCase()}
                  <br />
                  Updated {formatDateTime(draft.updatedAt)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No saved drafts yet. Drafts will appear here after coding assignments start using the
              persistence API.
            </p>
          )}
        </article>

        <article className="content-list-card rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Progress
          </p>
          <h2 className="mt-3 font-serif text-2xl text-slate-900">Your activity summary</h2>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{dashboardData.counts.lessonsStarted}</span>{" "}
              lessons started
            </p>
            <p>
              <span className="font-semibold text-slate-900">{dashboardData.counts.lessonsCompleted}</span>{" "}
              lessons completed
            </p>
            <p>
              <span className="font-semibold text-slate-900">{dashboardData.counts.draftCount}</span>{" "}
              drafts saved
            </p>
            <p>
              <span className="font-semibold text-slate-900">{dashboardData.counts.submissionCount}</span>{" "}
              submissions recorded
            </p>
            {dashboardData.recentSubmissions.length > 0 ? (
              <ul className="mt-2 space-y-2 border-t border-slate-200 pt-3">
                {dashboardData.recentSubmissions.map((submission) => (
                  <li key={`${submission.assignmentSlug}-${submission.createdAt}`}>
                    <span className="font-semibold text-slate-900">
                      {toTitleFromSlug(submission.assignmentSlug)}
                    </span>{" "}
                    {learnSubmissionStatusLabels[submission.status]}
                    {submission.totalCount > 0 ? (
                      <> • {submission.passedCount}/{submission.totalCount} tests</>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
