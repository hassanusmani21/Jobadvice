import { toContentSlug } from "@/lib/slug";
import type { InternalLinkTarget } from "./link-priority";

const normalizeAnchorText = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .trim();

const uniqueAnchors = (anchors: string[]) => {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const anchor of anchors.map(normalizeAnchorText).filter(Boolean)) {
    const key = anchor.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueValues.push(anchor);
  }

  return uniqueValues;
};

export const createSkillAnchors = (label: string) => {
  const normalizedLabel = normalizeAnchorText(label);
  const lowerLabel = normalizedLabel.toLowerCase();
  const slug = toContentSlug(normalizedLabel);
  const anchors = [
    normalizedLabel,
    `${normalizedLabel} jobs`,
    `${normalizedLabel} openings`,
  ];

  if (!/\b(developer|engineer|analyst|designer|testing|test|qa)\b/i.test(normalizedLabel)) {
    anchors.push(`${normalizedLabel} developer jobs`);
    anchors.push(`${normalizedLabel} engineer jobs`);
  }

  if (slug === "frontend" || lowerLabel === "front end") {
    anchors.push("Frontend developer jobs", "Front-end developer jobs", "frontend jobs");
  }

  if (slug === "backend" || lowerLabel === "back end") {
    anchors.push("Backend developer jobs", "Back-end developer jobs", "backend jobs");
  }

  return uniqueAnchors(anchors);
};

export const createLocationAnchors = (label: string) => {
  const normalizedLabel = normalizeAnchorText(label);
  return uniqueAnchors([
    normalizedLabel,
    `jobs in ${normalizedLabel}`,
    `${normalizedLabel} jobs`,
  ]);
};

export const createBlogAnchors = (title: string, topic?: string) =>
  uniqueAnchors([title, topic || ""]);

export const createJobAnchors = (title: string, company?: string) =>
  uniqueAnchors([title, company ? `${title} at ${company}` : ""]);

export const createCompanyAnchors = (company: string) =>
  uniqueAnchors([company, `${company} jobs`, `${company} careers`]);

export const createCategoryAnchors = (label: string) =>
  uniqueAnchors([label, `${label} jobs`, `${label} openings`]);

export const getPreferredAnchor = (target: InternalLinkTarget) =>
  target.aliases[0] || target.label;

