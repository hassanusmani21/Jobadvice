export type LearnGuestProgressRecord = {
  trackSlug: string;
  courseSlug: string;
  lessonSlug: string;
  status?: "not_started" | "in_progress" | "completed";
  percentComplete?: number;
  bestMcqScore?: number | null;
  bestAssignmentScore?: number | null;
  lastOpenedAt?: string | null;
  completedAt?: string | null;
};

export type LearnDraftFile = {
  path: string;
  content: string;
};

export type LearnGuestDraftRecord = {
  assignmentSlug: string;
  language: string;
  files: LearnDraftFile[];
  updatedAt?: string | null;
};
