import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const contentRoot = path.join(process.cwd(), "content");
const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/;
const bannedProductionPatterns = [
  { label: "example.com", pattern: /example\.com/i },
  { label: "demo", pattern: /\bdemos?\b/i },
  { label: "sample", pattern: /\bsamples?\b/i },
  { label: "demonstration", pattern: /\bdemonstrations?\b/i },
];
const newsOrCurrentClaimPattern =
  /\b(?:2026|study|report|data|survey|research|according to|announced|launched|experts?|reportedly)\b/i;
const markdownLinkPattern = /\[[^\]]+\]\((https?:\/\/[^)\s]+)[^)]*\)/gi;
const bareExternalLinkPattern = /https?:\/\/[^\s)]+/gi;

const stripWrappingQuotes = (value) => value.replace(/^['"]|['"]$/g, "").trim();

const readFrontMatterValue = (frontMatter, key) => {
  const match = frontMatter.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? stripWrappingQuotes(match[1] || "") : "";
};

const isDraft = (frontMatter) => {
  const value = readFrontMatterValue(frontMatter, "draft").toLowerCase();
  return value === "true" || value === "yes" || value === "1";
};

const toPlainText = (value) =>
  String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\(([^)]+)\)/g, " $1 ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/^>\s+/gm, " ")
    .replace(/[*_~>#|[\]()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countWords = (value) => {
  const matches = toPlainText(value).match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu);
  return matches ? matches.length : 0;
};

const countExternalLinks = (value) => {
  const links = new Set();

  for (const match of String(value || "").matchAll(markdownLinkPattern)) {
    links.add(match[1]);
  }

  for (const match of String(value || "").matchAll(bareExternalLinkPattern)) {
    links.add(match[0]);
  }

  return links.size;
};

const walkMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
};

const main = async () => {
  const files = await walkMarkdownFiles(contentRoot);
  const errors = [];
  const warnings = [];
  let draftCount = 0;
  let liveCount = 0;
  let liveBlogCount = 0;
  let liveJobCount = 0;

  for (const filePath of files) {
    const rawFile = await readFile(filePath, "utf8");
    const frontMatterMatch = rawFile.match(frontMatterPattern);
    const frontMatter = frontMatterMatch?.[1] || "";
    const body = rawFile.replace(frontMatterPattern, "");
    const relativePath = path.relative(process.cwd(), filePath);

    if (isDraft(frontMatter)) {
      draftCount += 1;
      continue;
    }

    liveCount += 1;
    if (relativePath.startsWith("content/blogs/")) {
      liveBlogCount += 1;
    }
    if (relativePath.startsWith("content/jobs/")) {
      liveJobCount += 1;
    }

    for (const bannedPattern of bannedProductionPatterns) {
      if (bannedPattern.pattern.test(rawFile)) {
        errors.push(
          `${relativePath} contains production trust keyword: ${bannedPattern.label}`,
        );
      }
    }

    if (relativePath.startsWith("content/blogs/")) {
      const linkCount = countExternalLinks(rawFile);
      if (newsOrCurrentClaimPattern.test(rawFile) && linkCount === 0) {
        warnings.push(
          `${relativePath} has current/news-style claims but no external source links.`,
        );
      }
    }

    if (relativePath.startsWith("content/jobs/")) {
      const bodyWordCount = countWords(body);
      if (bodyWordCount < 180) {
        warnings.push(
          `${relativePath} has a short original body (${bodyWordCount} words). Add role-specific context before AdSense review.`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Production content validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validated ${liveCount} live content files (${liveBlogCount} blogs, ${liveJobCount} jobs). ${draftCount} drafts skipped.`,
  );

  if (warnings.length > 0) {
    console.warn("AdSense readiness warnings:");
    for (const warning of warnings.slice(0, 40)) {
      console.warn(`- ${warning}`);
    }
    if (warnings.length > 40) {
      console.warn(`- ...and ${warnings.length - 40} more warnings.`);
    }
  }
};

await main();
