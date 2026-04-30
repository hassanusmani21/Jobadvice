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

const stripWrappingQuotes = (value) => value.replace(/^['"]|['"]$/g, "").trim();

const readFrontMatterValue = (frontMatter, key) => {
  const match = frontMatter.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? stripWrappingQuotes(match[1] || "") : "";
};

const isDraft = (frontMatter) => {
  const value = readFrontMatterValue(frontMatter, "draft").toLowerCase();
  return value === "true" || value === "yes" || value === "1";
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

  for (const filePath of files) {
    const rawFile = await readFile(filePath, "utf8");
    const frontMatterMatch = rawFile.match(frontMatterPattern);
    const frontMatter = frontMatterMatch?.[1] || "";

    if (isDraft(frontMatter)) {
      continue;
    }

    for (const bannedPattern of bannedProductionPatterns) {
      if (bannedPattern.pattern.test(rawFile)) {
        errors.push(
          `${path.relative(process.cwd(), filePath)} contains production trust keyword: ${bannedPattern.label}`,
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

  console.log(`Validated ${files.length} production content files.`);
};

await main();
