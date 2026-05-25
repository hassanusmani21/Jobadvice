import type { BlogPost } from "@/lib/blogs";
import type { JobPost } from "@/lib/jobs";
import { toContentSlug } from "@/lib/slug";
import {
  getAllBlogTopicLandings,
  getAllJobLocationLandings,
  getAllJobSkillLandings,
} from "@/lib/taxonomies";
import {
  createBlogAnchors,
  createCategoryAnchors,
  createCompanyAnchors,
  createJobAnchors,
  createLocationAnchors,
  createSkillAnchors,
} from "./seo-anchor-generator";
import type { InternalLinkTarget } from "./link-priority";
import { compareInternalLinkTargets } from "./link-priority";

export type InternalLinkKeywordMapInput = {
  jobs: JobPost[];
  blogs: BlogPost[];
};

const jobCategoryTargets = [
  {
    id: "category:freshers",
    type: "category",
    label: "Fresher Jobs",
    href: "/jobs/freshers/",
    aliases: createCategoryAnchors("fresher jobs"),
    priority: 40,
  },
  {
    id: "category:internships",
    type: "category",
    label: "Internships",
    href: "/jobs/internships/",
    aliases: createCategoryAnchors("internships"),
    priority: 40,
  },
  {
    id: "category:remote",
    type: "category",
    label: "Remote Jobs",
    href: "/jobs/remote/",
    aliases: createCategoryAnchors("remote jobs"),
    priority: 38,
  },
  {
    id: "category:experienced",
    type: "category",
    label: "Experienced Jobs",
    href: "/jobs/experienced/",
    aliases: createCategoryAnchors("experienced jobs"),
    priority: 34,
  },
] satisfies InternalLinkTarget[];

const technologyAliases = [
  { label: "Frontend", aliases: ["frontend", "front end", "frontend developer jobs"] },
  { label: "Backend", aliases: ["backend", "back end", "backend developer jobs"] },
  { label: "Full Stack", aliases: ["full stack", "full-stack", "full stack developer jobs"] },
  { label: "Python", aliases: ["python", "python developer jobs"] },
  { label: "React", aliases: ["react", "react developer jobs", "react.js"] },
  { label: "Node.js", aliases: ["node.js", "nodejs", "node developer jobs"] },
  { label: "Java", aliases: ["java", "java developer jobs"] },
  { label: "Data Analyst", aliases: ["data analyst jobs", "data analyst"] },
  { label: "QA", aliases: ["qa jobs", "quality assurance jobs", "software testing jobs"] },
];

const toJobsSearchHref = (query: string) =>
  `/jobs/?q=${encodeURIComponent(query)}`;

const addTarget = (targets: Map<string, InternalLinkTarget>, target: InternalLinkTarget) => {
  if (!target.href || target.aliases.length === 0) {
    return;
  }

  const existingTarget = targets.get(target.id);
  if (!existingTarget || compareInternalLinkTargets(target, existingTarget) < 0) {
    targets.set(target.id, target);
  }
};

export const buildInternalLinkKeywordMap = ({
  jobs,
  blogs,
}: InternalLinkKeywordMapInput) => {
  const targets = new Map<string, InternalLinkTarget>();

  for (const skill of getAllJobSkillLandings(jobs).slice(0, 120)) {
    addTarget(targets, {
      id: `skill:${skill.slug}`,
      type: "skill",
      label: skill.label,
      href: `/jobs/skill/${skill.slug}/`,
      aliases: createSkillAnchors(skill.label),
      priority: 50,
      count: skill.count,
    });
  }

  for (const location of getAllJobLocationLandings(jobs).slice(0, 60)) {
    addTarget(targets, {
      id: `location:${location.slug}`,
      type: "location",
      label: location.label,
      href: `/jobs/location/${location.slug}/`,
      aliases: createLocationAnchors(location.label),
      priority: 46,
      count: location.count,
    });
  }

  for (const category of jobCategoryTargets) {
    addTarget(targets, category);
  }

  for (const topic of getAllBlogTopicLandings(blogs).slice(0, 40)) {
    addTarget(targets, {
      id: `blog-topic:${topic.slug}`,
      type: "blog",
      label: topic.label,
      href: `/blog/topic/${topic.slug}/`,
      aliases: createBlogAnchors(topic.label),
      priority: 28,
      count: topic.count,
    });
  }

  for (const blog of blogs.slice(0, 40)) {
    addTarget(targets, {
      id: `blog:${blog.slug}`,
      type: "blog",
      label: blog.title,
      href: `/blog/${blog.slug}/`,
      aliases: createBlogAnchors(blog.title, blog.topic),
      priority: blog.isTrending ? 32 : 20,
      sourceSlug: blog.slug,
    });
  }

  for (const job of jobs.slice(0, 60)) {
    addTarget(targets, {
      id: `job:${job.slug}`,
      type: "job",
      label: job.title,
      href: `/jobs/${job.slug}/`,
      aliases: createJobAnchors(job.title, job.company),
      priority: 18,
      sourceSlug: job.slug,
    });
  }

  const companyCounts = new Map<string, { label: string; count: number }>();
  for (const job of jobs) {
    const label = job.company.trim();
    const slug = toContentSlug(label);
    if (!label || !slug || label.length > 48) {
      continue;
    }

    const existingCompany = companyCounts.get(slug);
    if (existingCompany) {
      existingCompany.count += 1;
    } else {
      companyCounts.set(slug, { label, count: 1 });
    }
  }

  for (const [slug, company] of [...companyCounts.entries()].slice(0, 80)) {
    addTarget(targets, {
      id: `company:${slug}`,
      type: "company",
      label: company.label,
      href: toJobsSearchHref(company.label),
      aliases: createCompanyAnchors(company.label),
      priority: 8,
      count: company.count,
    });
  }

  for (const technology of technologyAliases) {
    const skillSlug = toContentSlug(technology.label);
    addTarget(targets, {
      id: `technology:${skillSlug}`,
      type: "technology",
      label: technology.label,
      href: `/jobs/skill/${skillSlug}/`,
      aliases: technology.aliases,
      priority: 18,
    });
  }

  return [...targets.values()].sort(compareInternalLinkTargets);
};

