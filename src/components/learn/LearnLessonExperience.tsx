"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/AppLink";
import LearnCourseRoadmap from "@/components/learn/LearnCourseRoadmap";
import type { LearnLesson } from "@/lib/learn/catalog";
import {
  addTopicTimeToCourseProgress,
  completeTopicInCourseProgress,
  createDefaultCourseProgress,
  getCourseBonusSummary,
  getFirstAvailableTopicIndex,
  getLessonSummary,
  getLessonTopics,
  getTopicUiStatus,
  readCourseProgressFromStorage,
  skipTopicInCourseProgress,
  startTopicInCourseProgress,
  syncLegacyGuestProgress,
  type LearnLessonProgressRecord,
  writeCourseProgressToStorage,
} from "@/lib/learn/courseProgress";

type LearnLessonExperienceProps = {
  trackSlug: string;
  courseSlug: string;
  lessons: LearnLesson[];
  lesson: LearnLesson;
  nextLesson: LearnLesson | null;
};

const formatDurationClock = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getRecommendedTopicIndex = (lessonProgress: LearnLessonProgressRecord) => {
  const firstAvailableIndex = getFirstAvailableTopicIndex(lessonProgress);

  if (firstAvailableIndex >= 0) {
    return firstAvailableIndex;
  }

  return Math.max(lessonProgress.topics.length - 1, 0);
};

const getTopicStatusLabel = (status: ReturnType<typeof getTopicUiStatus>) => {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "skipped") {
    return "Skipped";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  if (status === "unlocked") {
    return "Unlocked";
  }

  return "Locked";
};

const getTopicStatusClasses = (status: ReturnType<typeof getTopicUiStatus>) => {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "skipped") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "in_progress") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }

  if (status === "unlocked") {
    return "border-cyan-200 bg-cyan-50 text-cyan-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-500";
};

export default function LearnLessonExperience({
  trackSlug,
  courseSlug,
  lessons,
  lesson,
  nextLesson,
}: LearnLessonExperienceProps) {
  const topics = useMemo(() => getLessonTopics(lesson), [lesson]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [courseProgress, setCourseProgress] = useState(() =>
    createDefaultCourseProgress(trackSlug, courseSlug, lessons),
  );
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  useEffect(() => {
    const storedProgress = readCourseProgressFromStorage(trackSlug, courseSlug, lessons);
    const storedLessonProgress =
      storedProgress.lessons.find((entry) => entry.lessonSlug === lesson.slug) ??
      createDefaultCourseProgress(trackSlug, courseSlug, [lesson]).lessons[0];

    setCourseProgress(storedProgress);
    setActiveTopicIndex(getRecommendedTopicIndex(storedLessonProgress));
    setHasHydrated(true);
  }, [courseSlug, lesson, lessons, trackSlug]);

  const lessonProgress =
    courseProgress.lessons.find((entry) => entry.lessonSlug === lesson.slug) ??
    createDefaultCourseProgress(trackSlug, courseSlug, [lesson]).lessons[0];
  const lessonSummary = getLessonSummary(lessonProgress);
  const bonusSummary = getCourseBonusSummary(courseProgress);
  const topicUiStatuses = lessonProgress.topics.map((_, index) =>
    getTopicUiStatus(lessonProgress, index),
  );
  const activeTopic = topics[activeTopicIndex] ?? null;
  const activeTopicProgress = lessonProgress.topics[activeTopicIndex] ?? null;
  const activeTopicUiStatus = topicUiStatuses[activeTopicIndex] ?? "locked";

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    writeCourseProgressToStorage(courseProgress);
    syncLegacyGuestProgress(courseProgress, lessons);
  }, [courseProgress, hasHydrated, lessons]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!activeTopicProgress || activeTopicUiStatus !== "unlocked") {
      return;
    }

    setCourseProgress((currentProgress) =>
      startTopicInCourseProgress(currentProgress, lesson.slug, activeTopicIndex),
    );
  }, [activeTopicIndex, activeTopicProgress, activeTopicUiStatus, hasHydrated, lesson.slug]);

  useEffect(() => {
    if (!hasHydrated || !activeTopicProgress) {
      return;
    }

    if (activeTopicUiStatus === "locked" || activeTopicProgress.status === "completed") {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      setCourseProgress((currentProgress) => {
        const currentLessonProgress = currentProgress.lessons.find(
          (entry) => entry.lessonSlug === lesson.slug,
        );

        if (!currentLessonProgress) {
          return currentProgress;
        }

        const currentTopic = currentLessonProgress.topics[activeTopicIndex];
        const currentUiStatus = getTopicUiStatus(currentLessonProgress, activeTopicIndex);

        if (!currentTopic || currentUiStatus === "locked" || currentTopic.status === "completed") {
          return currentProgress;
        }

        return addTopicTimeToCourseProgress(currentProgress, lesson.slug, activeTopicIndex, 1);
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeTopicIndex, activeTopicProgress, activeTopicUiStatus, hasHydrated, lesson.slug]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (activeTopicUiStatus !== "locked") {
      return;
    }

    setActiveTopicIndex(getRecommendedTopicIndex(lessonProgress));
  }, [activeTopicUiStatus, hasHydrated, lessonProgress]);

  if (!activeTopic || !activeTopicProgress) {
    return null;
  }

  const minimumRequiredSeconds = activeTopic.minimumCompletionMinutes * 60;
  const timerProgressPercent = Math.min(
    100,
    Math.round((activeTopicProgress.timeSpentSeconds / minimumRequiredSeconds) * 100),
  );
  const secondsRemaining = Math.max(minimumRequiredSeconds - activeTopicProgress.timeSpentSeconds, 0);
  const canComplete =
    activeTopicUiStatus !== "locked" &&
    activeTopicUiStatus !== "completed" &&
    activeTopicProgress.timeSpentSeconds >= minimumRequiredSeconds;
  const canSkip =
    (activeTopicUiStatus === "unlocked" || activeTopicUiStatus === "in_progress") &&
    !activeTopicProgress.usedBonusSkip &&
    bonusSummary.remaining > 0;
  const currentTopicNumber = activeTopicIndex + 1;

  const handleOpenTopic = (topicIndex: number) => {
    const uiStatus = topicUiStatuses[topicIndex];
    if (uiStatus === "locked") {
      return;
    }

    setActiveTopicIndex(topicIndex);
  };

  const handleMarkComplete = () => {
    if (!canComplete) {
      return;
    }

    const nextProgress = completeTopicInCourseProgress(courseProgress, lesson.slug, activeTopicIndex);
    const nextLessonProgress =
      nextProgress.lessons.find((entry) => entry.lessonSlug === lesson.slug) ?? lessonProgress;

    setCourseProgress(nextProgress);
    setActiveTopicIndex(getRecommendedTopicIndex(nextLessonProgress));
  };

  const handleSkipTopic = () => {
    if (!canSkip) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure? This will use 1 bonus skip for this topic.",
    );

    if (!confirmed) {
      return;
    }

    const nextProgress = skipTopicInCourseProgress(courseProgress, lesson.slug, activeTopicIndex);
    const nextLessonProgress =
      nextProgress.lessons.find((entry) => entry.lessonSlug === lesson.slug) ?? lessonProgress;

    setCourseProgress(nextProgress);
    setActiveTopicIndex(getRecommendedTopicIndex(nextLessonProgress));
  };

  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_360px]">
      <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Learn topic {currentTopicNumber}: {activeTopic.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Keep the focus on the current unlocked topic. Once it is completed or skipped, the
              next topic opens automatically.
            </p>
          </div>

          <div className="grid min-w-[220px] gap-2 text-right sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Lecture progress</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {lessonSummary.resolvedTopics}/{lessonSummary.totalTopics}
              </p>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-teal-700">Bonus skips left</p>
              <p className="mt-2 text-lg font-semibold text-teal-900">
                {bonusSummary.remaining}/{bonusSummary.total}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Assignment</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {lessonSummary.assignmentUnlocked ? "Unlocked" : "Locked"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {topics.map((topic, index) => {
            const uiStatus = topicUiStatuses[index];
            const topicProgress = lessonProgress.topics[index];
            const isActive = index === activeTopicIndex;

            return (
              <button
                key={topic.key}
                type="button"
                onClick={() => handleOpenTopic(index)}
                disabled={uiStatus === "locked"}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-teal-200 bg-teal-50"
                    : uiStatus === "locked"
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/90"
                      : "border-slate-200 bg-slate-50 hover:border-teal-200 hover:bg-teal-50/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Topic {index + 1}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">{topic.title}</h3>
                  </div>

                  <div className="space-y-2 text-right">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getTopicStatusClasses(
                        uiStatus,
                      )}`}
                    >
                      {getTopicStatusLabel(uiStatus)}
                    </span>
                    <span className="block text-xs font-medium text-slate-500">
                      {formatDurationClock(topicProgress.timeSpentSeconds)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50/85 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                Current Topic
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">{activeTopic.title}</h3>
            </div>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getTopicStatusClasses(
                activeTopicUiStatus,
              )}`}
            >
              {getTopicStatusLabel(activeTopicUiStatus)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/90 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Estimated time</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{activeTopic.estimatedMinutes} min</p>
            </div>
            <div className="rounded-2xl border border-white/90 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Minimum required</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {activeTopic.minimumCompletionMinutes} min
              </p>
            </div>
            <div className="rounded-2xl border border-white/90 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Timer</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatDurationClock(activeTopicProgress.timeSpentSeconds)} /{" "}
                {formatDurationClock(minimumRequiredSeconds)}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-3 w-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all"
                style={{ width: `${timerProgressPercent}%` }}
              />
            </div>
            <div className="px-4 py-3 text-sm text-slate-600">
              {secondsRemaining > 0
                ? `${formatDurationClock(secondsRemaining)} left before Mark Complete unlocks`
                : "Minimum learning time reached. You can move on whenever you are ready."}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/90 bg-white px-4 py-4">
            <div className="space-y-4">
              {activeTopic.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-8 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
              Only visible tab time counts here, so learners do not get stuck by background tabs.
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4 text-sm text-teal-900">
              Already know this topic? Use 1 bonus skip and revisit it later for revision.
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={!canComplete}
              className={`job-action-button ${
                canComplete ? "job-action-button-primary" : "job-action-button-static"
              }`}
            >
              {activeTopicUiStatus === "completed"
                ? "Completed"
                : activeTopicUiStatus === "skipped"
                  ? "Mark Complete After Revision"
                  : "Mark Complete"}
            </button>

            <button
              type="button"
              onClick={handleSkipTopic}
              disabled={!canSkip}
              className={`job-action-button ${
                canSkip ? "job-action-button-secondary" : "job-action-button-static"
              }`}
            >
              {bonusSummary.remaining > 0
                ? `Skip using Bonus (${bonusSummary.remaining} left)`
                : "No Bonus Skips Left"}
            </button>
          </div>
        </div>
      </article>

      <div className="space-y-5">
        <div className="lg:sticky lg:top-28">
          <div className="space-y-5">
            <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                Step 2
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {lessonSummary.assignmentUnlocked
                  ? lesson.assignment.title
                  : "Unlock the assignment"}
              </h2>

              {lessonSummary.assignmentUnlocked ? (
                <>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{lesson.assignment.brief}</p>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Task list</div>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                      {lesson.assignment.tasks.map((task) => (
                        <li key={task} className="flex gap-3">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-600" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-4 text-sm text-slate-100">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Deliverable
                    </div>
                    <p className="mt-2 leading-7">{lesson.assignment.deliverable}</p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href="#quick-check" className="job-action-button job-action-button-secondary">
                      Quick Check
                    </a>
                    <a href="#practice-studio" className="job-action-button job-action-button-primary">
                      Start Practice
                    </a>
                    {nextLesson ? (
                      <Link
                        href={`/learn/${trackSlug}/${courseSlug}/${nextLesson.slug}`}
                        className="job-action-button job-action-button-secondary"
                      >
                        Next Lecture
                      </Link>
                    ) : (
                      <Link
                        href={`/learn/${trackSlug}/${courseSlug}`}
                        className="job-action-button job-action-button-secondary"
                      >
                        Finish Course Review
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Finish the lecture topics first. Completed and skipped topics both count toward
                    the unlock.
                  </p>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Next action</div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Complete topic {currentTopicNumber} or use 1 bonus skip
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Current unlock progress: {lessonSummary.resolvedTopics}/{lessonSummary.totalTopics} topics ready.
                    </p>
                  </div>
                </>
              )}
            </article>

            <LearnCourseRoadmap
              trackSlug={trackSlug}
              courseSlug={courseSlug}
              lessons={lessons}
              activeLessonSlug={lesson.slug}
              courseProgress={courseProgress}
              compact
            />
          </div>
        </div>
      </div>
    </section>
  );
}
