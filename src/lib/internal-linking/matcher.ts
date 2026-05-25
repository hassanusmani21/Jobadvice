import { toContentSlug } from "@/lib/slug";
import {
  compareInternalLinkTargets,
  type InternalLinkContext,
  type InternalLinkTarget,
} from "./link-priority";

export type InternalLinkMatch = {
  target: InternalLinkTarget;
  anchorText: string;
  start: number;
  end: number;
};

const normalizeMatchText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toAliasPattern = (alias: string) =>
  escapeRegExp(alias.trim()).replace(/\\\s+/g, "\\s+");

const hasWordCharacter = (value: string) => /[a-z0-9]/i.test(value);

const isBoundary = (value: string | undefined) => !value || !hasWordCharacter(value);

const shouldSkipTarget = (target: InternalLinkTarget, context?: InternalLinkContext) => {
  if (context?.currentPath && target.href === context.currentPath) {
    return true;
  }

  if (context?.currentSlug && target.sourceSlug === context.currentSlug) {
    return true;
  }

  return false;
};

export const normalizeInternalLinkKey = (value: string) =>
  toContentSlug(normalizeMatchText(value));

export const findInternalLinkMatches = (
  text: string,
  targets: InternalLinkTarget[],
  context?: InternalLinkContext,
) => {
  const matches: InternalLinkMatch[] = [];
  const sortedTargets = [...targets]
    .filter((target) => !shouldSkipTarget(target, context))
    .sort(compareInternalLinkTargets);

  for (const target of sortedTargets) {
    const aliases = [...target.aliases]
      .filter((alias) => alias.trim().length >= 3)
      .sort((first, second) => second.length - first.length);

    for (const alias of aliases) {
      const pattern = new RegExp(toAliasPattern(alias), "gi");

      for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;

        if (!isBoundary(text[start - 1]) || !isBoundary(text[end])) {
          continue;
        }

        matches.push({
          target,
          anchorText: match[0],
          start,
          end,
        });
      }
    }
  }

  return matches.sort(
    (first, second) =>
      first.start - second.start ||
      second.end - second.start - (first.end - first.start) ||
      compareInternalLinkTargets(first.target, second.target),
  );
};

