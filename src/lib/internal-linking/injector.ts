import type { MarkdownBlock } from "@/lib/markdown";
import {
  getMaxInternalLinks,
  type InternalLinkContext,
  type InternalLinkTarget,
} from "./link-priority";
import { findInternalLinkMatches, type InternalLinkMatch } from "./matcher";

export type InternalLinkInjectionOptions = {
  context?: InternalLinkContext;
  maxLinks?: number;
  maxLinksPerParagraph?: number;
};

export type InternalLinkInjectionResult = {
  text: string;
  links: Array<{
    anchorText: string;
    href: string;
    targetId: string;
    type: InternalLinkTarget["type"];
  }>;
};

const protectedMarkdownPattern =
  /(!?\[[^\]]+\]\([^)]+\)|`[^`]+`|https?:\/\/[^\s<)]+)/gi;

const collectProtectedRanges = (text: string) =>
  Array.from(text.matchAll(protectedMarkdownPattern)).map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));

const overlapsRange = (
  start: number,
  end: number,
  ranges: Array<{ start: number; end: number }>,
) => ranges.some((range) => start < range.end && end > range.start);

const injectLinksIntoText = (
  text: string,
  targets: InternalLinkTarget[],
  options: Required<Pick<InternalLinkInjectionOptions, "maxLinks" | "maxLinksPerParagraph">> & {
    context?: InternalLinkContext;
    usedAnchors: Set<string>;
    usedTargetIds: Set<string>;
    usedTypeCounts: Map<InternalLinkTarget["type"], number>;
  },
): InternalLinkInjectionResult => {
  if (!text.trim() || options.maxLinks <= 0) {
    return { text, links: [] };
  }

  const protectedRanges = collectProtectedRanges(text);
  const selectedMatches: InternalLinkMatch[] = [];
  const paragraphAnchors = new Set<string>();

  for (const match of findInternalLinkMatches(text, targets, options.context)) {
    if (selectedMatches.length >= options.maxLinksPerParagraph) {
      break;
    }

    if (overlapsRange(match.start, match.end, protectedRanges)) {
      continue;
    }

    if (selectedMatches.some((selected) => match.start < selected.end && match.end > selected.start)) {
      continue;
    }

    const anchorKey = match.anchorText.toLowerCase();
    const typeCount = options.usedTypeCounts.get(match.target.type) || 0;

    if (
      paragraphAnchors.has(anchorKey) ||
      options.usedAnchors.has(anchorKey) ||
      options.usedTargetIds.has(match.target.id) ||
      typeCount >= 3
    ) {
      continue;
    }

    selectedMatches.push(match);
    paragraphAnchors.add(anchorKey);
  }

  if (selectedMatches.length === 0) {
    return { text, links: [] };
  }

  let linkedText = "";
  let lastIndex = 0;
  const links: InternalLinkInjectionResult["links"] = [];

  for (const match of selectedMatches) {
    linkedText += text.slice(lastIndex, match.start);
    linkedText += `[${match.anchorText}](${match.target.href})`;
    lastIndex = match.end;

    const anchorKey = match.anchorText.toLowerCase();
    options.usedAnchors.add(anchorKey);
    options.usedTargetIds.add(match.target.id);
    options.usedTypeCounts.set(
      match.target.type,
      (options.usedTypeCounts.get(match.target.type) || 0) + 1,
    );
    links.push({
      anchorText: match.anchorText,
      href: match.target.href,
      targetId: match.target.id,
      type: match.target.type,
    });
  }

  linkedText += text.slice(lastIndex);

  return {
    text: linkedText,
    links,
  };
};

export const injectInternalLinks = (
  markdown: string,
  targets: InternalLinkTarget[],
  options: InternalLinkInjectionOptions = {},
) => {
  const maxLinks = options.maxLinks ?? getMaxInternalLinks(options.context);
  const state = {
    context: options.context,
    maxLinks,
    maxLinksPerParagraph: options.maxLinksPerParagraph ?? 2,
    usedAnchors: new Set<string>(),
    usedTargetIds: new Set<string>(),
    usedTypeCounts: new Map<InternalLinkTarget["type"], number>(),
  };
  const result = injectLinksIntoText(markdown, targets, state);

  return result.text;
};

export const injectInternalLinksIntoBlocks = (
  blocks: MarkdownBlock[],
  targets: InternalLinkTarget[],
  options: InternalLinkInjectionOptions = {},
) => {
  const maxLinks = options.maxLinks ?? getMaxInternalLinks(options.context);
  const state = {
    context: options.context,
    maxLinks,
    maxLinksPerParagraph: options.maxLinksPerParagraph ?? 2,
    usedAnchors: new Set<string>(),
    usedTargetIds: new Set<string>(),
    usedTypeCounts: new Map<InternalLinkTarget["type"], number>(),
  };
  const injectedLinks: InternalLinkInjectionResult["links"] = [];

  const linkedBlocks = blocks.map((block) => {
    const remainingLinks = maxLinks - injectedLinks.length;
    if (remainingLinks <= 0 || block.type === "heading" || block.type === "image" || block.type === "rule") {
      return block;
    }

    state.maxLinks = remainingLinks;

    if (block.type === "paragraph" || block.type === "callout") {
      const result = injectLinksIntoText(block.text, targets, state);
      injectedLinks.push(...result.links);
      return {
        ...block,
        text: result.text,
      };
    }

    if (block.type === "list") {
      const items = block.items.map((item) => {
        state.maxLinks = maxLinks - injectedLinks.length;
        const result = injectLinksIntoText(item, targets, state);
        injectedLinks.push(...result.links);
        return result.text;
      });

      return {
        ...block,
        items,
      };
    }

    if (block.type === "table") {
      const rows = block.rows.map((row) =>
        row.map((cell) => {
          state.maxLinks = maxLinks - injectedLinks.length;
          const result = injectLinksIntoText(cell, targets, state);
          injectedLinks.push(...result.links);
          return result.text;
        }),
      );

      return {
        ...block,
        rows,
      };
    }

    return block;
  });

  return {
    blocks: linkedBlocks,
    links: injectedLinks,
  };
};
