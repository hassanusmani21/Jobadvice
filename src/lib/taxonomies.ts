import type { BlogPost } from "./blogs";
import type { JobPost } from "./jobs";
import { toContentSlug } from "./slug";

export type LocationLanding = {
  slug: string;
  label: string;
  count: number;
};

export type BlogTopicLanding = {
  slug: string;
  label: string;
  count: number;
};

const cityAliases = [
  { label: "Navi Mumbai", patterns: ["navi mumbai"] },
  { label: "Bangalore", patterns: ["bengaluru", "bangalore"] },
  { label: "Chandigarh", patterns: ["chandigarh"] },
  { label: "Chennai", patterns: ["chennai"] },
  { label: "Coimbatore", patterns: ["coimbatore"] },
  { label: "Gurgaon", patterns: ["gurgaon", "gurugram"] },
  { label: "Hyderabad", patterns: ["hyderabad"] },
  { label: "Lucknow", patterns: ["lucknow"] },
  { label: "Mumbai", patterns: ["mumbai"] },
  { label: "Mysuru", patterns: ["mysuru", "mysore"] },
  { label: "Noida", patterns: ["noida"] },
  { label: "Pune", patterns: ["pune", "पुणे"] },
  { label: "Ahmedabad", patterns: ["ahmedabad"] },
  { label: "Delhi", patterns: ["new delhi", "delhi"] },
  { label: "Kolkata", patterns: ["kolkata", "calcutta"] },
  { label: "Jaipur", patterns: ["jaipur"] },
  { label: "Colombo", patterns: ["colombo"] },
];

const genericLocationPattern =
  /\b(remote|multiple locations|various|india|hybrid|work from home|wfh|worldwide)\b/i;

const normalizeText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const resolveJobLocationLabel = (location: string) => {
  const normalizedLocation = normalizeText(location);
  if (!normalizedLocation) {
    return null;
  }

  const searchableLocation = normalizedLocation.toLowerCase();

  for (const alias of cityAliases) {
    if (
      alias.patterns.some((pattern) =>
        new RegExp(`(^|[^a-z])${pattern.replace(/\s+/g, "\\s+")}([^a-z]|$)`, "i").test(
          searchableLocation,
        ),
      )
    ) {
      return alias.label;
    }
  }

  const fallbackCandidate = normalizedLocation
    .split(/[,/|]| - /)[0]
    ?.replace(/\([^)]*\)/g, "")
    .trim();

  if (
    !fallbackCandidate ||
    genericLocationPattern.test(fallbackCandidate) ||
    /\d/.test(fallbackCandidate) ||
    fallbackCandidate.length > 28
  ) {
    return null;
  }

  return toTitleCase(fallbackCandidate);
};

export const getAllJobLocationLandings = (jobs: JobPost[]): LocationLanding[] => {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    const label = resolveJobLocationLabel(job.location);
    if (!label) {
      continue;
    }

    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      slug: toContentSlug(label),
    }))
    .filter((item) => Boolean(item.slug))
    .sort((firstItem, secondItem) => {
      return (
        secondItem.count - firstItem.count ||
        firstItem.label.localeCompare(secondItem.label)
      );
    });
};

export const getJobLocationLandingBySlug = (
  jobs: JobPost[],
  slug: string,
) => getAllJobLocationLandings(jobs).find((item) => item.slug === slug) || null;

export const getJobsForLocationSlug = (jobs: JobPost[], slug: string) =>
  jobs.filter((job) => {
    const label = resolveJobLocationLabel(job.location);
    return label ? toContentSlug(label) === slug : false;
  });

export const toBlogTopicSlug = (topic: string) => toContentSlug(normalizeText(topic));

export const getAllBlogTopicLandings = (blogs: BlogPost[]): BlogTopicLanding[] => {
  const topics = new Map<string, { label: string; count: number }>();

  for (const blog of blogs) {
    const label = normalizeText(blog.topic);
    if (!label) {
      continue;
    }

    const key = label.toLowerCase();
    const existing = topics.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    topics.set(key, { label, count: 1 });
  }

  return [...topics.values()]
    .map((item) => ({
      ...item,
      slug: toBlogTopicSlug(item.label),
    }))
    .filter((item) => Boolean(item.slug))
    .sort((firstItem, secondItem) => {
      return (
        secondItem.count - firstItem.count ||
        firstItem.label.localeCompare(secondItem.label)
      );
    });
};

export const getBlogTopicLandingBySlug = (blogs: BlogPost[], slug: string) =>
  getAllBlogTopicLandings(blogs).find((item) => item.slug === slug) || null;

export const getBlogsForTopicSlug = (blogs: BlogPost[], slug: string) =>
  blogs.filter((blog) => toBlogTopicSlug(blog.topic) === slug);
