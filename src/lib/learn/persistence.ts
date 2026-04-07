import {
  LearnProgressStatus,
  LearnSubmissionStatus,
  type LearnSavedDraft,
  type LearnProgress,
  type LearnSubmission,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LearnDraftFile, LearnGuestDraftRecord, LearnGuestProgressRecord } from "@/lib/learn/types";

const allowedProgressStatuses = new Set<LearnProgressStatus>([
  LearnProgressStatus.not_started,
  LearnProgressStatus.in_progress,
  LearnProgressStatus.completed,
]);

const cleanSlug = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const cleanLanguage = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const clampInteger = (
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(maximum, Math.round(value)));
};

const parseOptionalDate = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const normalizeProgressStatus = (
  value: unknown,
  percentComplete: number,
  completedAt: Date | null,
) => {
  const normalizedValue =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  if (
    normalizedValue &&
    allowedProgressStatuses.has(normalizedValue as LearnProgressStatus)
  ) {
    if (normalizedValue === LearnProgressStatus.completed || completedAt || percentComplete >= 100) {
      return LearnProgressStatus.completed;
    }

    if (normalizedValue === LearnProgressStatus.not_started && percentComplete > 0) {
      return LearnProgressStatus.in_progress;
    }

    return normalizedValue as LearnProgressStatus;
  }

  if (completedAt || percentComplete >= 100) {
    return LearnProgressStatus.completed;
  }

  if (percentComplete > 0) {
    return LearnProgressStatus.in_progress;
  }

  return LearnProgressStatus.not_started;
};

const normalizeDraftFiles = (value: unknown): LearnDraftFile[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 12)
    .map((item) => {
      const path = typeof item?.path === "string" ? item.path.trim() : "";
      const content = typeof item?.content === "string" ? item.content : "";

      if (!path || !content) {
        return null;
      }

      return {
        path: path.slice(0, 160),
        content: content.slice(0, 200000),
      };
    })
    .filter((item): item is LearnDraftFile => Boolean(item));
};

const serializeProgressRecord = (record: LearnProgress) => ({
  trackSlug: record.trackSlug,
  courseSlug: record.courseSlug,
  lessonSlug: record.lessonSlug,
  status: record.status,
  percentComplete: record.percentComplete,
  bestMcqScore: record.bestMcqScore,
  bestAssignmentScore: record.bestAssignmentScore,
  lastOpenedAt: record.lastOpenedAt?.toISOString() ?? null,
  completedAt: record.completedAt?.toISOString() ?? null,
  updatedAt: record.updatedAt.toISOString(),
});

const serializeDraftRecord = (record: LearnSavedDraft) => ({
  assignmentSlug: record.assignmentSlug,
  language: record.language,
  files: Array.isArray(record.filesJson) ? record.filesJson : [],
  updatedAt: record.updatedAt.toISOString(),
});

const serializeSubmissionRecord = (record: LearnSubmission) => ({
  assignmentSlug: record.assignmentSlug,
  lessonSlug: record.lessonSlug,
  language: record.language,
  status: record.status,
  score: record.score,
  passedCount: record.passedCount,
  totalCount: record.totalCount,
  runtimeMs: record.runtimeMs,
  createdAt: record.createdAt.toISOString(),
});

const normalizeProgressInput = (value: LearnGuestProgressRecord) => {
  const trackSlug = cleanSlug(value.trackSlug);
  const courseSlug = cleanSlug(value.courseSlug);
  const lessonSlug = cleanSlug(value.lessonSlug);

  if (!trackSlug || !courseSlug || !lessonSlug) {
    return null;
  }

  const percentComplete = clampInteger(value.percentComplete ?? 0, 0, 100, 0);
  const completedAt = parseOptionalDate(value.completedAt);
  const lastOpenedAt = parseOptionalDate(value.lastOpenedAt) || new Date();
  const status = normalizeProgressStatus(value.status, percentComplete, completedAt);

  return {
    trackSlug,
    courseSlug,
    lessonSlug,
    status,
    percentComplete,
    bestMcqScore:
      value.bestMcqScore == null
        ? null
        : clampInteger(value.bestMcqScore, 0, 100, 0),
    bestAssignmentScore:
      value.bestAssignmentScore == null
        ? null
        : clampInteger(value.bestAssignmentScore, 0, 100, 0),
    lastOpenedAt,
    completedAt: status === LearnProgressStatus.completed
      ? completedAt || lastOpenedAt
      : null,
  };
};

const normalizeDraftInput = (value: LearnGuestDraftRecord) => {
  const assignmentSlug = cleanSlug(value.assignmentSlug);
  const language = cleanLanguage(value.language);
  const files = normalizeDraftFiles(value.files);
  const updatedAt = parseOptionalDate(value.updatedAt) || new Date();

  if (!assignmentSlug || !language || files.length === 0) {
    return null;
  }

  return {
    assignmentSlug,
    language,
    files,
    updatedAt,
  };
};

export const upsertLearnProgress = async (
  userId: string,
  payload: LearnGuestProgressRecord,
) => {
  const normalized = normalizeProgressInput(payload);
  if (!normalized) {
    return null;
  }

  const existingRecord = await prisma.learnProgress.findUnique({
    where: {
      userId_lessonSlug: {
        userId,
        lessonSlug: normalized.lessonSlug,
      },
    },
  });

  const mergedPercentComplete = existingRecord
    ? Math.max(existingRecord.percentComplete, normalized.percentComplete)
    : normalized.percentComplete;

  const mergedBestMcqScore =
    existingRecord?.bestMcqScore != null || normalized.bestMcqScore != null
      ? Math.max(existingRecord?.bestMcqScore ?? 0, normalized.bestMcqScore ?? 0)
      : null;

  const mergedBestAssignmentScore =
    existingRecord?.bestAssignmentScore != null || normalized.bestAssignmentScore != null
      ? Math.max(existingRecord?.bestAssignmentScore ?? 0, normalized.bestAssignmentScore ?? 0)
      : null;

  const mergedLastOpenedAt =
    existingRecord?.lastOpenedAt &&
    existingRecord.lastOpenedAt.getTime() > normalized.lastOpenedAt.getTime()
      ? existingRecord.lastOpenedAt
      : normalized.lastOpenedAt;

  const mergedCompletedAt =
    existingRecord?.completedAt || normalized.completedAt || null;

  const mergedStatus =
    mergedCompletedAt || mergedPercentComplete >= 100
      ? LearnProgressStatus.completed
      : existingRecord?.status === LearnProgressStatus.in_progress ||
          normalized.status === LearnProgressStatus.in_progress ||
          mergedPercentComplete > 0
        ? LearnProgressStatus.in_progress
        : LearnProgressStatus.not_started;

  const record = await prisma.learnProgress.upsert({
    where: {
      userId_lessonSlug: {
        userId,
        lessonSlug: normalized.lessonSlug,
      },
    },
    update: {
      trackSlug: normalized.trackSlug,
      courseSlug: normalized.courseSlug,
      status: mergedStatus,
      percentComplete: mergedPercentComplete,
      bestMcqScore: mergedBestMcqScore,
      bestAssignmentScore: mergedBestAssignmentScore,
      lastOpenedAt: mergedLastOpenedAt,
      completedAt: mergedCompletedAt,
    },
    create: {
      userId,
      trackSlug: normalized.trackSlug,
      courseSlug: normalized.courseSlug,
      lessonSlug: normalized.lessonSlug,
      status: mergedStatus,
      percentComplete: mergedPercentComplete,
      bestMcqScore: mergedBestMcqScore,
      bestAssignmentScore: mergedBestAssignmentScore,
      lastOpenedAt: mergedLastOpenedAt,
      completedAt: mergedCompletedAt,
    },
  });

  return serializeProgressRecord(record);
};

export const upsertLearnDraft = async (
  userId: string,
  payload: LearnGuestDraftRecord,
) => {
  const normalized = normalizeDraftInput(payload);
  if (!normalized) {
    return null;
  }

  const existingRecord = await prisma.learnSavedDraft.findUnique({
    where: {
      userId_assignmentSlug_language: {
        userId,
        assignmentSlug: normalized.assignmentSlug,
        language: normalized.language,
      },
    },
  });

  const existingUpdatedAt = existingRecord?.updatedAt?.getTime() ?? 0;
  const mergedUpdatedAt =
    existingUpdatedAt > normalized.updatedAt.getTime()
      ? existingRecord?.updatedAt ?? normalized.updatedAt
      : normalized.updatedAt;

  const mergedFiles =
    existingUpdatedAt > normalized.updatedAt.getTime()
      ? (Array.isArray(existingRecord?.filesJson) ? existingRecord.filesJson : normalized.files)
      : normalized.files;

  const record = await prisma.learnSavedDraft.upsert({
    where: {
      userId_assignmentSlug_language: {
        userId,
        assignmentSlug: normalized.assignmentSlug,
        language: normalized.language,
      },
    },
    update: {
      filesJson: mergedFiles,
      updatedAt: mergedUpdatedAt,
    },
    create: {
      userId,
      assignmentSlug: normalized.assignmentSlug,
      language: normalized.language,
      filesJson: mergedFiles,
      updatedAt: mergedUpdatedAt,
    },
  });

  return serializeDraftRecord(record);
};

export const mergeGuestLearnState = async (
  userId: string,
  payload: {
    progress?: LearnGuestProgressRecord[];
    drafts?: LearnGuestDraftRecord[];
  },
) => {
  const progressItems = Array.isArray(payload.progress) ? payload.progress : [];
  const draftItems = Array.isArray(payload.drafts) ? payload.drafts : [];

  const mergedProgress = [];
  for (const item of progressItems) {
    const record = await upsertLearnProgress(userId, item);
    if (record) {
      mergedProgress.push(record);
    }
  }

  const mergedDrafts = [];
  for (const item of draftItems) {
    const record = await upsertLearnDraft(userId, item);
    if (record) {
      mergedDrafts.push(record);
    }
  }

  return {
    mergedProgressCount: mergedProgress.length,
    mergedDraftCount: mergedDrafts.length,
    mergedProgress,
    mergedDrafts,
  };
};

export const getLearnProgressRecords = async (userId: string) => {
  const records = await prisma.learnProgress.findMany({
    where: { userId },
    orderBy: [
      { lastOpenedAt: "desc" },
      { updatedAt: "desc" },
    ],
  });

  return records.map(serializeProgressRecord);
};

export const getLearnDraftRecords = async (userId: string) => {
  const records = await prisma.learnSavedDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return records.map(serializeDraftRecord);
};

export const getLearnerDashboardData = async (userId: string) => {
  const [
    lessonsStarted,
    lessonsCompleted,
    draftCount,
    submissionCount,
    recentProgress,
    recentDrafts,
    recentSubmissions,
  ] = await Promise.all([
    prisma.learnProgress.count({
      where: {
        userId,
        status: {
          in: [LearnProgressStatus.in_progress, LearnProgressStatus.completed],
        },
      },
    }),
    prisma.learnProgress.count({
      where: {
        userId,
        status: LearnProgressStatus.completed,
      },
    }),
    prisma.learnSavedDraft.count({
      where: { userId },
    }),
    prisma.learnSubmission.count({
      where: { userId },
    }),
    prisma.learnProgress.findMany({
      where: { userId },
      orderBy: [
        { lastOpenedAt: "desc" },
        { updatedAt: "desc" },
      ],
      take: 3,
    }),
    prisma.learnSavedDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    prisma.learnSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return {
    counts: {
      lessonsStarted,
      lessonsCompleted,
      draftCount,
      submissionCount,
    },
    recentProgress: recentProgress.map(serializeProgressRecord),
    recentDrafts: recentDrafts.map(serializeDraftRecord),
    recentSubmissions: recentSubmissions.map(serializeSubmissionRecord),
  };
};

export const learnSubmissionStatusLabels: Record<LearnSubmissionStatus, string> = {
  queued: "Queued",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
  error: "Error",
};
