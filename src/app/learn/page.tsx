import type { Metadata } from "next";
import Link from "@/components/AppLink";
import { getLearnStats, getLearnTracks } from "@/lib/learn/catalog";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Explore structured coding tracks, courses, lecture topics, and assignments inside the JobAdvice learning hub.",
  alternates: {
    canonical: "/learn/",
  },
};

export default function LearnPage() {
  const tracks = getLearnTracks();
  const stats = getLearnStats();
  const firstTrack = tracks[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">Learn</span>
        <h1 className="page-title">Learn full-stack development through four focused technology paths</h1>
        <p className="page-copy max-w-3xl">
          Focus only on the stacks that matter here: frontend development, Node.js full stack, Java
          full stack, and Django full stack. Each path stays simple to navigate, practical to
          follow, and centered on real build flow instead of scattered topics.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4">
            <div className="text-2xl font-semibold text-slate-900">{stats.trackCount}</div>
            <div className="mt-1 text-sm text-slate-600">Focused full-stack technology paths</div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4">
            <div className="text-2xl font-semibold text-slate-900">{stats.courseCount}</div>
            <div className="mt-1 text-sm text-slate-600">Courses with clear lecture roadmaps</div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4">
            <div className="text-2xl font-semibold text-slate-900">{stats.lessonCount}</div>
            <div className="mt-1 text-sm text-slate-600">Public lecture pages with guided topics</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {firstTrack ? (
            <Link href={`/learn/${firstTrack.slug}`} className="job-action-button job-action-button-primary">
              Start First Track
            </Link>
          ) : null}
          <Link href="/jobs/" className="job-action-button job-action-button-secondary">
            Browse Jobs
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Tracks
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Choose the stack you actually want to build with
            </h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600">
            The learning product is now focused only on four paths: frontend, Node.js full stack,
            Java full stack, and Django full stack. That keeps the navigation cleaner and the
            roadmap more useful.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {tracks.map((track) => (
            <article
              key={track.slug}
              className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
                {track.level}
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">{track.title}</h3>
              <p className="mt-2 text-sm font-medium text-slate-700">{track.tagline}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{track.summary}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {track.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl bg-slate-950 px-4 py-4 text-sm text-slate-100">
                <div>
                  <span className="block text-xs uppercase tracking-wide text-slate-400">
                    Outcome
                  </span>
                  <span className="mt-1 block">{track.outcome}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>{track.courses.length} courses</span>
                  <span>{track.estimatedHours}+ hours</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/learn/${track.slug}`}
                  className="job-action-button job-action-button-primary"
                >
                  Open Track
                </Link>
                <Link href="/jobs/" className="job-action-button job-action-button-secondary">
                  Related Jobs
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            How It Works
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Pick one stack.",
              "Open a course.",
              "Move lecture by lecture.",
              "Complete topics in sequence, then unlock the assignment.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Included In Every Path
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Track overview",
                body: "A simple stack-level entry page with course and lecture roadmap.",
              },
              {
                title: "Lecture pages",
                body: "Focused topics with timer-based completion and bonus skip support.",
              },
              {
                title: "Practice studio",
                body: "Live preview for frontend and guided practice for the other stacks.",
              },
              {
                title: "Assignment block",
                body: "One clear task at the end of each lesson.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
