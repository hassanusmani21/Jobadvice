import type { Metadata } from "next";
import Link from "@/components/AppLink";
import LearnBreadcrumbs from "@/components/learn/LearnBreadcrumbs";
import LearnCourseRoadmap from "@/components/learn/LearnCourseRoadmap";
import { getLearnCourse, getLearnTracks } from "@/lib/learn/catalog";
import { notFound } from "next/navigation";

type LearnCoursePageProps = {
  params: {
    track: string;
    course: string;
  };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getLearnTracks().flatMap((track) =>
    track.courses.map((course) => ({
      track: track.slug,
      course: course.slug,
    })),
  );
}

export function generateMetadata({ params }: LearnCoursePageProps): Metadata {
  const entry = getLearnCourse(params.track, params.course);

  if (!entry) {
    return {
      title: "Learn",
    };
  }

  return {
    title: `${entry.course.title} | ${entry.track.title} | Learn`,
    description: entry.course.summary,
    alternates: {
      canonical: `/learn/${entry.track.slug}/${entry.course.slug}/`,
    },
  };
}

export default function LearnCoursePage({ params }: LearnCoursePageProps) {
  const entry = getLearnCourse(params.track, params.course);
  if (!entry) {
    notFound();
  }

  const { track, course } = entry;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <LearnBreadcrumbs
        items={[
          { label: "Learn", href: "/learn" },
          { label: track.title, href: `/learn/${track.slug}` },
          { label: course.title },
        ]}
      />

      <section className="page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <span className="page-kicker">{track.title}</span>
            <h1 className="page-title">{course.title}</h1>
            <p className="page-copy mt-4 max-w-3xl">{course.summary}</p>
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-sm text-slate-100">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Course outcome
            </div>
            <p className="mt-2 max-w-sm leading-7">{course.outcome}</p>
            <div className="mt-4 text-slate-300">{course.estimatedHours}+ hours</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {course.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/learn/${track.slug}/${course.slug}/${course.lessons[0]?.slug}`}
            className="job-action-button job-action-button-primary"
          >
            Start Course
          </Link>
          <Link href={`/learn/${track.slug}`} className="job-action-button job-action-button-secondary">
            Back To Track
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <LearnCourseRoadmap trackSlug={track.slug} courseSlug={course.slug} lessons={course.lessons} />

        <div className="space-y-5">
          {course.lessons.map((lesson, index) => (
            <article
              key={lesson.slug}
              className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                    Lecture {index + 1}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{lesson.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{lesson.summary}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {lesson.durationMinutes} min
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Lecture goals</div>
                <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                  {lesson.goals.map((goal) => (
                    <li key={goal} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-600" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Lecture structure</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {lesson.contentBlocks.length} topics
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    1 assignment
                  </span>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                    Assignment unlocks after all topics
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{lesson.assignment.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.assignment.brief}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/learn/${track.slug}/${course.slug}/${lesson.slug}`}
                  className="job-action-button job-action-button-primary"
                >
                  Open Lecture
                </Link>
                <Link href="/jobs/" className="job-action-button job-action-button-secondary">
                  See Related Jobs
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
