import { promises as fs } from "node:fs";
import path from "node:path";
import { toIsoDateString } from "./dateParsing";
import { normalizeMarkdownSource } from "./markdown";
import { toContentSlug } from "./slug";

const blogsDirectory = path.join(process.cwd(), "content", "blogs");
const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
const placeholderSlugPattern = /^\{\{.+\}\}$/;
const millisecondsInDay = 24 * 60 * 60 * 1000;

export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  topic: string;
  tags: string[];
  isTrending: boolean;
  author: string;
  coverImage?: string;
  date: string;
  updatedAt: string;
  excerpt: string;
  content: string;
  readingTimeMinutes: number;
};

export type TrendingTopic = {
  topic: string;
  score: number;
};

const stripWrappingQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "").trim();

const normalizeTextValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toDateString = (value: unknown) => toIsoDateString(value);

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "yes", "1"].includes(value.trim().toLowerCase());
};

const normalizeList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.replace(/^['"\s]+|['"\s]+$/g, "").trim())
      .filter((item) => item.length > 0);
  }

  return [] as string[];
};

const createExcerpt = (value: string) => {
  const plainText = normalizeMarkdownSource(value)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\|/g, " ")
    .replace(/[#>*_[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= 170) {
    return plainText;
  }

  return `${plainText.slice(0, 167).trimEnd()}...`;
};

const estimateReadingTime = (value: string) => {
  const wordCount = normalizeMarkdownSource(value)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  return Math.max(1, Math.round(wordCount / 220));
};

const resolveBlogSlug = (frontMatterSlug: unknown, fileName: string) => {
  const candidate = normalizeTextValue(frontMatterSlug);
  const fallbackSlug = fileName.replace(/\.md$/i, "");
  const slugSource =
    !candidate || placeholderSlugPattern.test(candidate) ? fallbackSlug : candidate;

  return toContentSlug(slugSource) || fallbackSlug;
};

const parseFrontMatter = (rawFile: string) => {
  const match = rawFile.match(frontMatterPattern);
  if (!match) {
    return {
      data: {} as Record<string, unknown>,
      content: rawFile.trim(),
    };
  }

  const [, frontMatterBlock, markdownContent] = match;
  const lines = frontMatterBlock.split(/\r?\n/);
  const data: Record<string, unknown> = {};
  let activeListKey: string | null = null;

  for (const line of lines) {
    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, rawValue] = keyValueMatch;
      const value = rawValue.trim();
      if (value.length === 0) {
        data[key] = [];
        activeListKey = key;
      } else {
        data[key] = stripWrappingQuotes(value);
        activeListKey = null;
      }
      continue;
    }

    const listItemMatch = line.match(/^\s*-\s*(.+)$/);
    if (listItemMatch && activeListKey) {
      const currentItems = Array.isArray(data[activeListKey])
        ? (data[activeListKey] as string[])
        : [];
      data[activeListKey] = [...currentItems, stripWrappingQuotes(listItemMatch[1])];
    }
  }

  return {
    data,
    content: markdownContent.trim(),
  };
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const loadBlogFromFile = async (fileName: string): Promise<BlogPost | null> => {
  const filePath = path.join(blogsDirectory, fileName);
  const [rawFile, fileStats] = await Promise.all([
    fs.readFile(filePath, "utf8"),
    fs.stat(filePath),
  ]);

  const { data, content } = parseFrontMatter(rawFile);
  const slug = resolveBlogSlug(data.slug, fileName);
  const title = normalizeTextValue(data.title);
  if (!title) {
    return null;
  }

  const topic = normalizeTextValue(data.topic);
  const tags = normalizeList(data.tags);
  const summary = normalizeTextValue(data.summary || data.excerpt).replace(/\s+/g, " ").trim();
  const author = normalizeTextValue(data.author);
  const coverImage = normalizeTextValue(data.coverImage || data.image || data.thumbnail);
  const date = toDateString(data.date || data.publishedAt) || getTodayDateString();
  const updatedAt =
    toDateString(fileStats.mtime.toISOString()) || getTodayDateString();
  const isTrending = toBoolean(data.isTrending || data.trending);
  const postContent = normalizeMarkdownSource(content || summary);
  if (!postContent) {
    return null;
  }
  const excerpt = createExcerpt(summary || postContent);
  const readingTimeMinutes = estimateReadingTime(postContent);

  return {
    slug,
    title,
    summary,
    topic,
    tags,
    isTrending,
    author,
    ...(coverImage ? { coverImage } : {}),
    date,
    updatedAt,
    excerpt,
    content: postContent,
    readingTimeMinutes,
  };
};

const loadBlogs = async () => {
  let files: string[] = [];

  try {
    files = await fs.readdir(blogsDirectory);
  } catch {
    return [] as BlogPost[];
  }

  const blogs = await Promise.all(
    files
      .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
      .map((fileName) => loadBlogFromFile(fileName)),
  );

  return blogs
    .filter((blog): blog is BlogPost => Boolean(blog))
    .sort(
      (firstBlog, secondBlog) =>
        new Date(secondBlog.date).getTime() - new Date(firstBlog.date).getTime(),
    );
};

const readBlogs = () => loadBlogs();

const toUtcTimestamp = (value: string) => Date.parse(`${value}T00:00:00Z`);

const getFreshnessWeight = (dateString: string) => {
  const today = getTodayDateString();
  const ageInDays = Math.max(
    0,
    Math.floor((toUtcTimestamp(today) - toUtcTimestamp(dateString)) / millisecondsInDay),
  );

  if (ageInDays <= 14) {
    return 3;
  }

  if (ageInDays <= 60) {
    return 2;
  }

  return 1;
};

export const getAllBlogs = async () => readBlogs();

export const getLatestBlogs = async (limit = 6) => {
  const blogs = await readBlogs();
  return blogs.slice(0, limit);
};

export const getBlogBySlug = async (slug: string) => {
  const blogs = await readBlogs();
  return blogs.find((blog) => blog.slug === slug) ?? null;
};

export const getTrendingBlogs = async (limit = 5) => {
  const blogs = await readBlogs();
  const explicitTrending = blogs.filter((blog) => blog.isTrending);

  if (explicitTrending.length >= limit) {
    return explicitTrending.slice(0, limit);
  }

  const existingSlugs = new Set(explicitTrending.map((blog) => blog.slug));
  const fallbackBlogs = blogs.filter((blog) => !existingSlugs.has(blog.slug));
  return [...explicitTrending, ...fallbackBlogs].slice(0, limit);
};

export const getTopBlogTopics = async (limit = 6): Promise<TrendingTopic[]> => {
  const blogs = await readBlogs();
  const scoreMap = new Map<string, number>();

  for (const blog of blogs) {
    const freshnessWeight = getFreshnessWeight(blog.date);
    const allTopics = [blog.topic, ...blog.tags].filter(Boolean);

    for (const rawTopic of allTopics) {
      const normalizedTopic = rawTopic.trim();
      if (!normalizedTopic) {
        continue;
      }

      const currentScore = scoreMap.get(normalizedTopic) || 0;
      const trendingBonus = blog.isTrending ? 1 : 0;
      scoreMap.set(normalizedTopic, currentScore + freshnessWeight + trendingBonus);
    }
  }

  return Array.from(scoreMap.entries())
    .map(([topic, score]) => ({ topic, score }))
    .sort((firstTopic, secondTopic) => secondTopic.score - firstTopic.score)
    .slice(0, limit);
};

export const formatBlogDate = (dateString: string) => {
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};
