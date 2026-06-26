export type InternalLinkTargetType =
  | "skill"
  | "location"
  | "category"
  | "blog"
  | "job"
  | "company"
  | "technology";

export type InternalLinkTarget = {
  id: string;
  type: InternalLinkTargetType;
  label: string;
  href: string;
  aliases: string[];
  priority: number;
  sourceSlug?: string;
  count?: number;
};

export type InternalLinkContext = {
  currentPath?: string;
  currentSlug?: string;
  currentType?: "job" | "blog" | "listing";
};

export const typePriority: Record<InternalLinkTargetType, number> = {
  skill: 100,
  location: 92,
  category: 84,
  blog: 72,
  job: 62,
  technology: 58,
  company: 48,
};

export const maxLinksByContentType = {
  job: 5,
  blog: 8,
  listing: 6,
} as const;

export const getMaxInternalLinks = (context?: InternalLinkContext) =>
  context?.currentType ? maxLinksByContentType[context.currentType] : 6;

export const scoreTargetPriority = (target: InternalLinkTarget) =>
  target.priority + typePriority[target.type] + Math.min(target.count || 0, 25);

export const compareInternalLinkTargets = (
  firstTarget: InternalLinkTarget,
  secondTarget: InternalLinkTarget,
) =>
  scoreTargetPriority(secondTarget) - scoreTargetPriority(firstTarget) ||
  secondTarget.label.length - firstTarget.label.length ||
  firstTarget.label.localeCompare(secondTarget.label);

