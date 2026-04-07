import type { Metadata } from "next";
import Link from "@/components/AppLink";
import LearnBreadcrumbs from "@/components/learn/LearnBreadcrumbs";
import LearnLessonExperience from "@/components/learn/LearnLessonExperience";
import LearnPracticeStudio from "@/components/learn/LearnPracticeStudio";
import LearnQuickCheckPanel from "@/components/learn/LearnQuickCheckPanel";
import { getLearnLesson, getLearnTracks } from "@/lib/learn/catalog";
import { getLearnPractice } from "@/lib/learn/practice";
import { notFound } from "next/navigation";

type LearnLessonPageProps = {
  params: {
    track: string;
    course: string;
    lesson: string;
  };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getLearnTracks().flatMap((track) =>
    track.courses.flatMap((course) =>
      course.lessons.map((lesson) => ({
        track: track.slug,
        course: course.slug,
        lesson: lesson.slug,
      })),
    ),
  );
}

export function generateMetadata({ params }: LearnLessonPageProps): Metadata {
  const entry = getLearnLesson(params.track, params.course, params.lesson);

  if (!entry) {
    return {
      title: "Learn",
    };
  }

  return {
    title: `${entry.lesson.title} | ${entry.course.title} | Learn`,
    description: entry.lesson.summary,
    alternates: {
      canonical: `/learn/${entry.track.slug}/${entry.course.slug}/${entry.lesson.slug}/`,
    },
  };
}

export default function LearnLessonPage({ params }: LearnLessonPageProps) {
  const entry = getLearnLesson(params.track, params.course, params.lesson);
  if (!entry) {
    notFound();
  }

  const { track, course, lesson, nextLesson } = entry;
  const lessonKey = `${track.slug}/${course.slug}/${lesson.slug}`;
  const practice = getLearnPractice(track.slug, course.slug, lesson.slug);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <LearnBreadcrumbs
        items={[
          { label: "Learn", href: "/learn" },
          { label: track.title, href: `/learn/${track.slug}` },
          { label: course.title, href: `/learn/${track.slug}/${course.slug}` },
          { label: lesson.title },
        ]}
      />

      <section className="page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <span className="page-kicker">
              {track.title} / {course.title}
            </span>
            <h1 className="page-title">{lesson.title}</h1>
            <p className="page-copy mt-4 max-w-3xl">{lesson.summary}</p>
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-sm text-slate-100">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lecture format
            </div>
            <div className="mt-2 space-y-2 leading-7">
              <div>{lesson.contentBlocks.length} guided topics</div>
              <div>{lesson.durationMinutes} minutes estimated</div>
              <div>Assignment unlocks after all topics</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/learn/${track.slug}/${course.slug}`} className="job-action-button job-action-button-primary">
            Course Overview
          </Link>
          <Link href={`/learn/${track.slug}`} className="job-action-button job-action-button-secondary">
            Back To Track
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {lesson.goals.map((goal) => (
            <div
              key={goal}
              className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 text-sm leading-7 text-slate-700"
            >
              {goal}
            </div>
          ))}
        </div>
      </section>

      <LearnLessonExperience
        trackSlug={track.slug}
        courseSlug={course.slug}
        lessons={course.lessons}
        lesson={lesson}
        nextLesson={nextLesson}
      />

      <section className="mt-10 space-y-5">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                Review And Build
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Check your understanding, then work on the assignment
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Step 2 Quick Check
              </span>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                Step 3 Practice
              </span>
            </div>
          </div>
        </section>

        <div id="quick-check">
          <LearnQuickCheckPanel lessonKey={lessonKey} questions={lesson.quickCheck} />
        </div>

        {practice ? (
          <div id="practice-studio">
            <LearnPracticeStudio lessonKey={lessonKey} practice={practice} />
          </div>
        ) : (
          <section
            id="practice-studio"
            className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Assignment Workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Use the brief above to build your answer</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This lecture does not have a guided practice studio yet, so use the assignment brief,
              quick check, and your own editor to complete the work.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
