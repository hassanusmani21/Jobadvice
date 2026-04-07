"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/AppLink";
import type { LearnLesson } from "@/lib/learn/catalog";
import {
  createDefaultCourseProgress,
  getCourseBonusSummary,
  getLessonSummary,
  readCourseProgressFromStorage,
  type LearnCourseProgressRecord,
} from "@/lib/learn/courseProgress";

type LearnCourseRoadmapProps = {
  trackSlug: string;
  courseSlug: string;
  lessons: LearnLesson[];
  activeLessonSlug?: string;
  courseProgress?: LearnCourseProgressRecord | null;
  compact?: boolean;
};

export default function LearnCourseRoadmap({
  trackSlug,
  courseSlug,
  lessons,
  activeLessonSlug,
  courseProgress,
  compact = false,
}: LearnCourseRoadmapProps) {
  const [storedProgress, setStoredProgress] = useState<LearnCourseProgressRecord | null>(
    courseProgress ?? null,
  );

  useEffect(() => {
    if (courseProgress) {
      setStoredProgress(courseProgress);
      return;
    }

    setStoredProgress(readCourseProgressFromStorage(trackSlug, courseSlug, lessons));
  }, [courseProgress, courseSlug, lessons, trackSlug]);

  const effectiveProgress = useMemo(
    () => storedProgress ?? createDefaultCourseProgress(trackSlug, courseSlug, lessons),
    [courseSlug, lessons, storedProgress, trackSlug],
  );
  const bonusSummary = getCourseBonusSummary(effectiveProgress);

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            {compact ? "Course Path" : "Roadmap"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {compact ? "See the next lectures at a glance" : "Move lecture by lecture"}
          </h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            {lessons.length} lectures
          </div>
          <div className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900">
            Bonus skips left {bonusSummary.remaining}/{bonusSummary.total}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {lessons.map((lesson, index) => {
          const href = `/learn/${trackSlug}/${courseSlug}/${lesson.slug}`;
          const isActive = lesson.slug === activeLessonSlug;
          const lessonProgress =
            effectiveProgress.lessons.find((entry) => entry.lessonSlug === lesson.slug) ?? null;
          const lessonSummary = lessonProgress ? getLessonSummary(lessonProgress) : null;
          const topicCount = lesson.contentBlocks.length;
          const statusLabel =
            lessonSummary?.status === "completed"
              ? "Completed"
              : lessonSummary?.status === "in_progress"
                ? "In Progress"
                : "Not Started";
          const statusClasses =
            lessonSummary?.status === "completed"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : lessonSummary?.status === "in_progress"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-500";

          return (
            <Link
              key={lesson.slug}
              href={href}
              className={`block rounded-2xl border transition ${
                compact ? "px-4 py-3" : "px-4 py-4"
              } ${
                isActive
                  ? "border-teal-200 bg-teal-50"
                  : "border-slate-200 bg-slate-50 hover:border-teal-200 hover:bg-teal-50/60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Lecture {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{lesson.title}</h3>
                  {compact ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {lessonSummary?.resolvedTopics ?? 0}/{topicCount} topics ready
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                          {topicCount} topics
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                          1 assignment
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 text-right">
                  <span className="block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {lesson.durationMinutes} min
                  </span>
                  <span
                    className={`block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses}`}
                  >
                    {statusLabel}
                  </span>
                  {compact ? null : (
                    <>
                      <span className="block text-xs font-medium text-slate-500">
                        {lessonSummary?.resolvedTopics ?? 0}/{topicCount} topics ready
                      </span>
                      <span className="block text-xs text-slate-500">
                        {lessonSummary?.assignmentUnlocked
                          ? "Assignment unlocked"
                          : "Finish or skip all topics to unlock assignment"}
                      </span>
                    </>
                  )}
                  {isActive ? (
                    <span className="block rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      Current
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
