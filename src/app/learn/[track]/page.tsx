import type { Metadata } from "next";
import Link from "@/components/AppLink";
import LearnBreadcrumbs from "@/components/learn/LearnBreadcrumbs";
import { getLearnTrack, getLearnTracks } from "@/lib/learn/catalog";
import { notFound } from "next/navigation";

type LearnTrackPageProps = {
  params: {
    track: string;
  };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getLearnTracks().map((track) => ({
    track: track.slug,
  }));
}

export function generateMetadata({ params }: LearnTrackPageProps): Metadata {
  const track = getLearnTrack(params.track);

  if (!track) {
    return {
      title: "Learn",
    };
  }

  return {
    title: `${track.title} | Learn`,
    description: track.summary,
    alternates: {
      canonical: `/learn/${track.slug}/`,
    },
  };
}

export default function LearnTrackPage({ params }: LearnTrackPageProps) {
  const track = getLearnTrack(params.track);
  if (!track) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <LearnBreadcrumbs
        items={[
          { label: "Learn", href: "/learn" },
          { label: track.title },
        ]}
      />

      <section className="page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <span className="page-kicker">{track.level} Track</span>
            <h1 className="page-title">{track.title}</h1>
            <p className="mt-3 text-base font-medium text-slate-700">{track.tagline}</p>
            <p className="page-copy mt-4 max-w-3xl">{track.summary}</p>
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-sm text-slate-100">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Outcome
            </div>
            <p className="mt-2 max-w-sm leading-7">{track.outcome}</p>
            <p className="mt-4 text-slate-300">{track.estimatedHours}+ hours across the full track</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {track.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        {track.courses.map((course, index) => {
          const courseHref = `/learn/${track.slug}/${course.slug}`;
          const firstLessonHref = `/learn/${track.slug}/${course.slug}/${course.lessons[0]?.slug}`;

          return (
            <article
              key={course.slug}
              className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                    Course {index + 1}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{course.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{course.summary}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <div>{course.lessons.length} lectures</div>
                  <div className="mt-1">{course.estimatedHours}+ hours</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Course outcome</div>
                <p className="mt-2 text-sm leading-7 text-slate-700">{course.outcome}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {course.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {course.lessons.map((lesson, lessonIndex) => (
                  <Link
                    key={lesson.slug}
                    href={`/learn/${track.slug}/${course.slug}/${lesson.slug}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-teal-200 hover:bg-teal-50/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Lecture {lessonIndex + 1}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{lesson.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            {lesson.contentBlocks.length} topics
                          </span>
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                            1 assignment
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {lesson.durationMinutes} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={courseHref} className="job-action-button job-action-button-primary">
                  Open Course
                </Link>
                <Link href={firstLessonHref} className="job-action-button job-action-button-secondary">
                  Start First Lecture
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
