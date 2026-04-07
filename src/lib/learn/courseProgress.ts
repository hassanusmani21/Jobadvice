import type { LearnLesson } from "@/lib/learn/catalog";
import {
  LEARN_COURSE_PROGRESS_STORAGE_PREFIX,
  LEARN_GUEST_PROGRESS_STORAGE_KEY,
} from "@/lib/learn/storage";
import type { LearnGuestProgressRecord } from "@/lib/learn/types";

export const LEARN_TOTAL_BONUS_SKIPS = 5;

export type LearnTopicProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export type LearnTopicUiStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "completed"
  | "skipped";

export type LearnTopicProgressRecord = {
  topicKey: string;
  status: LearnTopicProgressStatus;
  timeSpentSeconds: number;
  usedBonusSkip: boolean;
  updatedAt: string | null;
  completedAt: string | null;
};

export type LearnLessonProgressRecord = {
  lessonSlug: string;
  topics: LearnTopicProgressRecord[];
  updatedAt: string | null;
};

export type LearnCourseProgressRecord = {
  trackSlug: string;
  courseSlug: string;
  totalBonusSkips: number;
  lessons: LearnLessonProgressRecord[];
  updatedAt: string | null;
};

export type LearnTopicDefinition = {
  key: string;
  index: number;
  title: string;
  paragraphs: string[];
  estimatedMinutes: number;
  minimumCompletionMinutes: number;
};

export type LearnLessonSummary = {
  status: "not_started" | "in_progress" | "completed";
  totalTopics: number;
  completedTopics: number;
  skippedTopics: number;
  resolvedTopics: number;
  percentComplete: number;
  assignmentUnlocked: boolean;
};

type StoredLearnGuestProgressRecord = LearnGuestProgressRecord & {
  updatedAt?: string | null;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const nowIso = () => new Date().toISOString();

const isResolvedStatus = (status: LearnTopicProgressStatus) =>
  status === "completed" || status === "skipped";

const isTopicStatus = (value: unknown): value is LearnTopicProgressStatus =>
  value === "not_started" ||
  value === "in_progress" ||
  value === "completed" ||
  value === "skipped";

const clampNumber = (value: unknown, fallback = 0) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.round(value));
};

const getStorageKey = (trackSlug: string, courseSlug: string) =>
  `${LEARN_COURSE_PROGRESS_STORAGE_PREFIX}:${trackSlug}:${courseSlug}`;

const createDefaultTopicProgress = (lessonSlug: string, index: number): LearnTopicProgressRecord => ({
  topicKey: `${lessonSlug}:topic-${index + 1}`,
  status: "not_started",
  timeSpentSeconds: 0,
  usedBonusSkip: false,
  updatedAt: null,
  completedAt: null,
});

const normalizeTopicProgress = (
  value: unknown,
  lessonSlug: string,
  index: number,
): LearnTopicProgressRecord => {
  if (!isObject(value)) {
    return createDefaultTopicProgress(lessonSlug, index);
  }

  return {
    topicKey:
      typeof value.topicKey === "string" && value.topicKey.trim()
        ? value.topicKey
        : `${lessonSlug}:topic-${index + 1}`,
    status: isTopicStatus(value.status) ? value.status : "not_started",
    timeSpentSeconds: clampNumber(value.timeSpentSeconds),
    usedBonusSkip: value.usedBonusSkip === true,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    completedAt: typeof value.completedAt === "string" ? value.completedAt : null,
  };
};

const normalizeLessonProgress = (
  value: unknown,
  lesson: LearnLesson,
): LearnLessonProgressRecord => {
  const rawTopics = isObject(value) && Array.isArray(value.topics) ? value.topics : [];

  return {
    lessonSlug: lesson.slug,
    topics: getLessonTopics(lesson).map((_, index) =>
      normalizeTopicProgress(rawTopics[index], lesson.slug, index),
    ),
    updatedAt: isObject(value) && typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
};

export const getLessonTopics = (lesson: LearnLesson): LearnTopicDefinition[] => {
  const topicCount = Math.max(lesson.contentBlocks.length, 1);
  const estimatedMinutes = Math.max(4, Math.round(lesson.durationMinutes / topicCount));

  return lesson.contentBlocks.map((block, index) => ({
    key: `${lesson.slug}:topic-${index + 1}`,
    index,
    title: block.title,
    paragraphs: block.paragraphs,
    estimatedMinutes,
    minimumCompletionMinutes: Math.max(2, Math.floor(estimatedMinutes * 0.6)),
  }));
};

export const createDefaultCourseProgress = (
  trackSlug: string,
  courseSlug: string,
  lessons: LearnLesson[],
): LearnCourseProgressRecord => ({
  trackSlug,
  courseSlug,
  totalBonusSkips: LEARN_TOTAL_BONUS_SKIPS,
  lessons: lessons.map((lesson) => normalizeLessonProgress(null, lesson)),
  updatedAt: null,
});

export const normalizeCourseProgress = (
  value: unknown,
  trackSlug: string,
  courseSlug: string,
  lessons: LearnLesson[],
): LearnCourseProgressRecord => {
  if (!isObject(value)) {
    return createDefaultCourseProgress(trackSlug, courseSlug, lessons);
  }

  const rawLessons = Array.isArray(value.lessons) ? value.lessons : [];
  const rawLessonsBySlug = new Map<string, unknown>();

  rawLessons.forEach((item) => {
    if (isObject(item) && typeof item.lessonSlug === "string") {
      rawLessonsBySlug.set(item.lessonSlug, item);
    }
  });

  return {
    trackSlug,
    courseSlug,
    totalBonusSkips: LEARN_TOTAL_BONUS_SKIPS,
    lessons: lessons.map((lesson) => normalizeLessonProgress(rawLessonsBySlug.get(lesson.slug), lesson)),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
};

export const readCourseProgressFromStorage = (
  trackSlug: string,
  courseSlug: string,
  lessons: LearnLesson[],
) => {
  if (typeof window === "undefined") {
    return createDefaultCourseProgress(trackSlug, courseSlug, lessons);
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(trackSlug, courseSlug));
    if (!rawValue) {
      return createDefaultCourseProgress(trackSlug, courseSlug, lessons);
    }

    return normalizeCourseProgress(JSON.parse(rawValue), trackSlug, courseSlug, lessons);
  } catch {
    return createDefaultCourseProgress(trackSlug, courseSlug, lessons);
  }
};

export const writeCourseProgressToStorage = (progress: LearnCourseProgressRecord) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(progress.trackSlug, progress.courseSlug),
    JSON.stringify(progress),
  );
};

export const getFirstAvailableTopicIndex = (lessonProgress: LearnLessonProgressRecord) =>
  lessonProgress.topics.findIndex((topic) => !isResolvedStatus(topic.status));

export const getTopicUiStatus = (
  lessonProgress: LearnLessonProgressRecord,
  topicIndex: number,
): LearnTopicUiStatus => {
  const topic = lessonProgress.topics[topicIndex];
  if (!topic) {
    return "locked";
  }

  if (topic.status === "completed" || topic.status === "skipped") {
    return topic.status;
  }

  const firstAvailableIndex = getFirstAvailableTopicIndex(lessonProgress);
  if (firstAvailableIndex === -1) {
    return "locked";
  }

  if (topicIndex === firstAvailableIndex) {
    return topic.status === "in_progress" ? "in_progress" : "unlocked";
  }

  return "locked";
};

export const getLessonSummary = (lessonProgress: LearnLessonProgressRecord): LearnLessonSummary => {
  const totalTopics = lessonProgress.topics.length;
  const completedTopics = lessonProgress.topics.filter((topic) => topic.status === "completed").length;
  const skippedTopics = lessonProgress.topics.filter((topic) => topic.status === "skipped").length;
  const resolvedTopics = completedTopics + skippedTopics;
  const assignmentUnlocked = totalTopics > 0 && resolvedTopics === totalTopics;

  const hasStarted =
    lessonProgress.topics.some(
      (topic) =>
        topic.status === "in_progress" ||
        topic.status === "completed" ||
        topic.status === "skipped" ||
        topic.timeSpentSeconds > 0,
    ) || assignmentUnlocked;

  return {
    status: assignmentUnlocked ? "completed" : hasStarted ? "in_progress" : "not_started",
    totalTopics,
    completedTopics,
    skippedTopics,
    resolvedTopics,
    percentComplete: totalTopics > 0 ? Math.round((resolvedTopics / totalTopics) * 100) : 0,
    assignmentUnlocked,
  };
};

export const getCourseBonusSummary = (progress: LearnCourseProgressRecord) => {
  const used = progress.lessons.reduce(
    (count, lesson) => count + lesson.topics.filter((topic) => topic.usedBonusSkip).length,
    0,
  );

  return {
    total: progress.totalBonusSkips,
    used,
    remaining: Math.max(progress.totalBonusSkips - used, 0),
  };
};

const updateTopicInCourseProgress = (
  progress: LearnCourseProgressRecord,
  lessonSlug: string,
  topicIndex: number,
  updater: (topic: LearnTopicProgressRecord) => LearnTopicProgressRecord,
) => {
  const timestamp = nowIso();

  return {
    ...progress,
    updatedAt: timestamp,
    lessons: progress.lessons.map((lessonProgress) => {
      if (lessonProgress.lessonSlug !== lessonSlug) {
        return lessonProgress;
      }

      return {
        ...lessonProgress,
        updatedAt: timestamp,
        topics: lessonProgress.topics.map((topic, index) => {
          if (index !== topicIndex) {
            return topic;
          }

          return updater(topic);
        }),
      };
    }),
  };
};

export const startTopicInCourseProgress = (
  progress: LearnCourseProgressRecord,
  lessonSlug: string,
  topicIndex: number,
) =>
  updateTopicInCourseProgress(progress, lessonSlug, topicIndex, (topic) => {
    if (topic.status !== "not_started") {
      return topic;
    }

    return {
      ...topic,
      status: "in_progress",
      updatedAt: nowIso(),
    };
  });

export const addTopicTimeToCourseProgress = (
  progress: LearnCourseProgressRecord,
  lessonSlug: string,
  topicIndex: number,
  secondsToAdd: number,
) =>
  updateTopicInCourseProgress(progress, lessonSlug, topicIndex, (topic) => ({
    ...topic,
    status: topic.status === "not_started" ? "in_progress" : topic.status,
    timeSpentSeconds: topic.timeSpentSeconds + secondsToAdd,
    updatedAt: nowIso(),
  }));

export const completeTopicInCourseProgress = (
  progress: LearnCourseProgressRecord,
  lessonSlug: string,
  topicIndex: number,
) => {
  const timestamp = nowIso();

  return updateTopicInCourseProgress(progress, lessonSlug, topicIndex, (topic) => ({
    ...topic,
    status: "completed",
    updatedAt: timestamp,
    completedAt: timestamp,
  }));
};

export const skipTopicInCourseProgress = (
  progress: LearnCourseProgressRecord,
  lessonSlug: string,
  topicIndex: number,
) => {
  const timestamp = nowIso();

  return updateTopicInCourseProgress(progress, lessonSlug, topicIndex, (topic) => ({
    ...topic,
    status: "skipped",
    usedBonusSkip: true,
    updatedAt: timestamp,
  }));
};

const parseGuestProgressRecords = () => {
  if (typeof window === "undefined") {
    return [] as StoredLearnGuestProgressRecord[];
  }

  try {
    const rawValue = window.localStorage.getItem(LEARN_GUEST_PROGRESS_STORAGE_KEY);
    if (!rawValue) {
      return [] as StoredLearnGuestProgressRecord[];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as StoredLearnGuestProgressRecord[]) : [];
  } catch {
    return [] as StoredLearnGuestProgressRecord[];
  }
};

export const syncLegacyGuestProgress = (
  progress: LearnCourseProgressRecord,
  lessons: LearnLesson[],
) => {
  if (typeof window === "undefined") {
    return;
  }

  const existingRecords = parseGuestProgressRecords();
  const lessonSlugs = new Set(lessons.map((lesson) => lesson.slug));
  const keptRecords = existingRecords.filter(
    (record) =>
      !(
        record.trackSlug === progress.trackSlug &&
        record.courseSlug === progress.courseSlug &&
        lessonSlugs.has(record.lessonSlug)
      ),
  );

  const nextRecords = progress.lessons.reduce<StoredLearnGuestProgressRecord[]>((records, lessonProgress) => {
    const summary = getLessonSummary(lessonProgress);
    const previousRecord = existingRecords.find(
      (record) =>
        record.trackSlug === progress.trackSlug &&
        record.courseSlug === progress.courseSlug &&
        record.lessonSlug === lessonProgress.lessonSlug,
    );

    records.push({
      trackSlug: progress.trackSlug,
      courseSlug: progress.courseSlug,
      lessonSlug: lessonProgress.lessonSlug,
      status: summary.status,
      percentComplete: summary.percentComplete,
      bestMcqScore: previousRecord?.bestMcqScore ?? null,
      bestAssignmentScore: previousRecord?.bestAssignmentScore ?? null,
      lastOpenedAt: lessonProgress.updatedAt ?? previousRecord?.lastOpenedAt ?? null,
      completedAt: summary.assignmentUnlocked
        ? lessonProgress.updatedAt ?? previousRecord?.completedAt ?? nowIso()
        : null,
      updatedAt: lessonProgress.updatedAt ?? previousRecord?.updatedAt ?? null,
    });

    return records;
  }, keptRecords);

  window.localStorage.setItem(LEARN_GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(nextRecords));
};
