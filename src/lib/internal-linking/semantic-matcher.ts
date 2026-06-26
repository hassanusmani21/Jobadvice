import type { InternalLinkTarget } from "./link-priority";

export type SemanticMatchInput = {
  text: string;
  targets: InternalLinkTarget[];
  maxResults?: number;
};

export type SemanticMatchResult = {
  target: InternalLinkTarget;
  score: number;
  reason: "semantic-placeholder" | "token-overlap";
};

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

export const findSemanticInternalLinkCandidates = ({
  text,
  targets,
  maxResults = 8,
}: SemanticMatchInput): SemanticMatchResult[] => {
  const textTokens = new Set(tokenize(text));
  if (textTokens.size === 0) {
    return [];
  }

  return targets
    .map((target) => {
      const targetTokens = new Set(tokenize([target.label, ...target.aliases].join(" ")));
      let overlap = 0;

      for (const token of targetTokens) {
        if (textTokens.has(token)) {
          overlap += 1;
        }
      }

      return {
        target,
        score: targetTokens.size > 0 ? overlap / targetTokens.size : 0,
        reason: "token-overlap" as const,
      };
    })
    .filter((result) => result.score >= 0.45)
    .sort((first, second) => second.score - first.score)
    .slice(0, maxResults);
};

export const semanticMatcherCapabilities = {
  embeddingsReady: true,
  provider: "none",
  note:
    "This module keeps the matching contract ready for future embedding/reranking providers without adding runtime network calls.",
} as const;

