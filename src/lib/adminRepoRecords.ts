import { toIsoDateString } from "./dateParsing";
import { toContentSlug } from "./slug";

const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
const placeholderSlugPattern = /^\{\{.+\}\}$/;
const githubOwner = process.env.ADMIN_CONTENT_REPO_OWNER || "hassanusmani21";
const githubRepo = process.env.ADMIN_CONTENT_REPO_NAME || "Jobadvice";
const githubBranch = process.env.ADMIN_CONTENT_REPO_BRANCH || "main";
const githubContentsToken = (process.env.ADMIN_CONTENTS_TOKEN || "").trim();

export const shouldUseRemoteAdminRecords = () =>
  process.env.NODE_ENV === "production" || githubContentsToken.length > 0;

type GithubContentsItem = {
  name?: string;
  download_url?: string | null;
  type?: string;
};

const stripWrappingQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "").trim();
const normalizeTextValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const hasClosingQuote = (value: string, quote: '"' | "'") => {
  const trimmedValue = value.trimEnd();
  if (!trimmedValue.endsWith(quote)) {
    return false;
  }

  let trailingBackslashCount = 0;
  for (
    let index = trimmedValue.length - 2;
    index >= 0 && trimmedValue[index] === "\\";
    index -= 1
  ) {
    trailingBackslashCount += 1;
  }

  return trailingBackslashCount % 2 === 0;
};

const parseQuotedValue = (value: string, quote: '"' | "'") => {
  const trimmedValue = value.trim();
  if (!(trimmedValue.startsWith(quote) && hasClosingQuote(trimmedValue, quote))) {
    return stripWrappingQuotes(value);
  }

  const innerValue = trimmedValue.slice(1, -1);
  if (quote === "'") {
    return innerValue.replace(/''/g, "'").replace(/\r?\n\s*/g, " ").trim();
  }

  return innerValue
    .replace(/\\\r?\n\s*/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\r?\n\s*/g, " ")
    .trim();
};

const parseFrontMatter = (rawFile: string) => {
  const match = rawFile.match(frontMatterPattern);
  if (!match) {
    return {} as Record<string, unknown>;
  }

  const [, frontMatterBlock] = match;
  const lines = frontMatterBlock.split(/\r?\n/);
  const data: Record<string, unknown> = {};
  let activeListKey: string | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, rawValue] = keyValueMatch;
      const value = rawValue.trim();

      if (value.length === 0) {
        data[key] = [];
        activeListKey = key;
        continue;
      }

      const quotedMarker = value[0];
      if (quotedMarker === '"' || quotedMarker === "'") {
        const quote = quotedMarker as '"' | "'";
        let quotedValue = value;

        while (!hasClosingQuote(quotedValue, quote) && lineIndex + 1 < lines.length) {
          const nextLine = lines[lineIndex + 1];
          if (!/^\s+/.test(nextLine)) {
            break;
          }

          lineIndex += 1;
          quotedValue += `\n${nextLine.trimStart()}`;
        }

        data[key] = parseQuotedValue(quotedValue, quote);
        activeListKey = null;
        continue;
      }

      if (/^[>|][+-]?$/.test(value)) {
        const blockLines: string[] = [];

        while (lineIndex + 1 < lines.length && /^\s+/.test(lines[lineIndex + 1])) {
          lineIndex += 1;
          blockLines.push(lines[lineIndex].trimStart());
        }

        data[key] = value.startsWith(">") ? blockLines.join(" ").trim() : blockLines.join("\n");
        activeListKey = null;
        continue;
      }

      const continuationLines: string[] = [];
      while (lineIndex + 1 < lines.length && /^\s+/.test(lines[lineIndex + 1])) {
        lineIndex += 1;
        continuationLines.push(lines[lineIndex].trimStart());
      }

      data[key] =
        continuationLines.length > 0
          ? stripWrappingQuotes(`${value} ${continuationLines.join(" ")}`)
          : stripWrappingQuotes(value);
      activeListKey = null;
      continue;
    }

    const listItemMatch = line.match(/^\s*-\s*(.+)$/);
    if (listItemMatch && activeListKey) {
      const currentItems = Array.isArray(data[activeListKey])
        ? (data[activeListKey] as string[])
        : [];
      data[activeListKey] = [...currentItems, stripWrappingQuotes(listItemMatch[1])];
      continue;
    }
  }

  return data;
};

const resolveContentSlug = (frontMatterSlug: unknown, fileName: string) => {
  const candidate = normalizeTextValue(frontMatterSlug);
  const fallbackSlug = fileName.replace(/\.md$/i, "");
  const slugSource =
    !candidate || placeholderSlugPattern.test(candidate) ? fallbackSlug : candidate;

  return toContentSlug(slugSource) || fallbackSlug;
};

const toDateString = (value: unknown) => toIsoDateString(value);

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "JobAdviceAdminRecords/1.0",
      ...(githubContentsToken
        ? {
            Authorization: `Bearer ${githubContentsToken}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub contents request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/plain",
      "User-Agent": "JobAdviceAdminRecords/1.0",
      ...(githubContentsToken
        ? {
            Authorization: `Bearer ${githubContentsToken}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub file request failed: ${response.status}`);
  }

  return response.text();
};

const listRepoMarkdownFiles = async (directoryPath: string) => {
  const endpoint = new URL(
    `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${directoryPath}`,
  );
  endpoint.searchParams.set("ref", githubBranch);

  const items = await fetchJson<GithubContentsItem[]>(endpoint.toString());
  return items.filter(
    (item) =>
      item.type === "file" &&
      typeof item.name === "string" &&
      item.name.toLowerCase().endsWith(".md") &&
      typeof item.download_url === "string" &&
      item.download_url.length > 0,
  ) as Array<Required<Pick<GithubContentsItem, "name" | "download_url">> & GithubContentsItem>;
};

type RemoteBlogRecord = {
  slug: string;
  title: string;
  topic: string;
  date: string;
  updatedAt: string;
};

type RemoteJobRecord = {
  slug: string;
  title: string;
  company: string;
  location: string;
  applyLink: string;
  date: string;
  updatedAt: string;
};

export const getRemoteBlogRecords = async (): Promise<RemoteBlogRecord[]> => {
  const files = await listRepoMarkdownFiles("content/blogs");

  const records = await Promise.all(
    files.map(async (file) => {
      if (!file.download_url) {
        return null;
      }

      const rawFile = await fetchText(file.download_url);
      const data = parseFrontMatter(rawFile);
      const title = normalizeTextValue(data.title);
      if (!title) {
        return null;
      }

      return {
        slug: resolveContentSlug(data.slug, file.name),
        title,
        topic: normalizeTextValue(data.topic),
        date: toDateString(data.date || data.publishedAt) || "",
        updatedAt:
          toDateString(data.updatedAt || data.updated || data.lastUpdated) ||
          toDateString(data.date || data.publishedAt) ||
          "",
      };
    }),
  );

  return records.filter((record): record is RemoteBlogRecord => Boolean(record));
};

export const getRemoteJobRecords = async (): Promise<RemoteJobRecord[]> => {
  const files = await listRepoMarkdownFiles("content/jobs");

  const records = await Promise.all(
    files.map(async (file) => {
      if (!file.download_url) {
        return null;
      }

      const rawFile = await fetchText(file.download_url);
      const data = parseFrontMatter(rawFile);
      const title = normalizeTextValue(data.title);
      if (!title) {
        return null;
      }

      return {
        slug: resolveContentSlug(data.slug, file.name),
        title,
        company: normalizeTextValue(data.company),
        location: normalizeTextValue(data.location),
        applyLink: normalizeTextValue(data.applyLink),
        date: toDateString(data.date || data.publishedAt) || "",
        updatedAt:
          toDateString(data.updatedAt || data.updated || data.lastUpdated) ||
          toDateString(data.date || data.publishedAt) ||
          "",
      };
    }),
  );

  return records.filter((record): record is RemoteJobRecord => Boolean(record));
};
