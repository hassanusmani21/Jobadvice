#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";

const projectRoot = process.cwd();
const jobContentRoot = "content/jobs";
const defaultSiteUrl = "https://jobadvice.netlify.app";
const noExpiryRetentionDays = 30;
const indexingScope = "https://www.googleapis.com/auth/indexing";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.JOBADVICE_SITE_URL ||
  defaultSiteUrl
).replace(/\/+$/, "");

const isEnabled = /^(1|true|yes)$/i.test(
  process.env.GOOGLE_INDEXING_API_ENABLED || "",
);
const isDryRun = /^(1|true|yes)$/i.test(
  process.env.GOOGLE_INDEXING_API_DRY_RUN || "",
);
const serviceAccountEmail =
  process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL ||
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  "";
const serviceAccountPrivateKey = (
  process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_PRIVATE_KEY ||
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
  ""
).replace(/\\n/g, "\n");

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const execGit = (args, { allowFailure = false } = {}) => {
  try {
    return execFileSync("git", args, {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return "";
    }

    throw error;
  }
};

const emptyTreeHash = execGit(["hash-object", "-t", "tree", "/dev/null"]);

const normalizeText = (value) =>
  typeof value === "string"
    ? value.replace(/^['"]|['"]$/g, "").trim()
    : "";

const toContentSlug = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—−]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const toDateString = (value) => {
  const normalized = normalizeText(value);
  const match = normalized.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};

const toUtcDayTimestamp = (value) => Date.parse(`${value}T00:00:00Z`);

const parseFrontMatter = (content) => {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) {
    return {};
  }

  const fields = {};

  for (const line of match[1].split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) {
      continue;
    }

    const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!fieldMatch) {
      continue;
    }

    fields[fieldMatch[1]] = normalizeText(fieldMatch[2]);
  }

  return fields;
};

const resolveSnapshotDate = (commitish) => {
  if (!commitish || commitish === emptyTreeHash) {
    return new Date().toISOString().slice(0, 10);
  }

  const committedAt = execGit(["show", "-s", "--format=%cI", commitish], {
    allowFailure: true,
  });

  return committedAt ? committedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
};

const isJobActive = (date, applicationEndDate, referenceDate) => {
  const todayTimestamp = toUtcDayTimestamp(referenceDate);

  if (applicationEndDate) {
    return toUtcDayTimestamp(applicationEndDate) >= todayTimestamp;
  }

  const postedAtTimestamp = toUtcDayTimestamp(date);
  const expiresAtTimestamp =
    postedAtTimestamp + noExpiryRetentionDays * 24 * 60 * 60 * 1000;
  return expiresAtTimestamp >= todayTimestamp;
};

const readJobPaths = (commitish) => {
  if (!commitish || commitish === emptyTreeHash) {
    return [];
  }

  return execGit(["ls-tree", "-r", "--name-only", commitish, "--", jobContentRoot], {
    allowFailure: true,
  })
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value.toLowerCase().endsWith(".md"));
};

const readBlob = (commitish, filePath) =>
  execGit(["show", `${commitish}:${filePath}`], { allowFailure: true });

const toJobRecord = (filePath, content, referenceDate) => {
  if (!content) {
    return { activeUrl: null };
  }

  const fields = parseFrontMatter(content);
  const fallbackSlug = filePath.replace(/^content\/jobs\//, "").replace(/\.md$/i, "");
  const rawSlug =
    fields.slug && !/^\{\{.+\}\}$/.test(fields.slug) ? fields.slug : fallbackSlug;
  const slug = toContentSlug(rawSlug) || fallbackSlug;
  const date = toDateString(fields.date || fields.postedDate) || referenceDate;
  const applicationEndDate = toDateString(
    fields.applicationEndDate || fields.expiryDate || fields.expirationDate,
  );

  return {
    activeUrl: isJobActive(date, applicationEndDate, referenceDate)
      ? `${siteUrl}/jobs/${slug}/`
      : null,
  };
};

const readJobSnapshot = (commitish, referenceDate) => {
  const snapshot = new Map();

  for (const filePath of readJobPaths(commitish)) {
    snapshot.set(filePath, toJobRecord(filePath, readBlob(commitish, filePath), referenceDate));
  }

  return snapshot;
};

const parseDiffLine = (line) => {
  const parts = line.split("\t");
  const status = parts[0] || "";

  if (status.startsWith("R")) {
    return {
      status: "R",
      oldPath: parts[1] || "",
      newPath: parts[2] || "",
    };
  }

  if (status === "D") {
    return {
      status,
      oldPath: parts[1] || "",
      newPath: "",
    };
  }

  return {
    status,
    oldPath: parts[1] || "",
    newPath: parts[1] || "",
  };
};

const getChangedPaths = (previousCommit, currentCommit) => {
  const diffOutput = execGit(
    [
      "diff",
      "--name-status",
      "--find-renames=100%",
      previousCommit,
      currentCommit,
      "--",
      jobContentRoot,
    ],
    { allowFailure: true },
  );

  return diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDiffLine);
};

const createSignedJwt = (clientEmail, privateKey) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: indexingScope,
    aud: "https://oauth2.googleapis.com/token",
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${toBase64Url(
    signer.sign(privateKey),
  )}`;
};

const getAccessToken = async () => {
  const assertion = createSignedJwt(serviceAccountEmail, serviceAccountPrivateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed with ${response.status}`);
  }

  const data = await response.json();
  return data.access_token || "";
};

const publishNotification = async (accessToken, notification) => {
  const response = await fetch(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Indexing API request failed for ${notification.url} (${notification.type}): ${response.status} ${errorBody}`,
    );
  }
};

const buildNotifications = (previousCommit, currentCommit) => {
  const previousReferenceDate = resolveSnapshotDate(previousCommit);
  const currentReferenceDate = resolveSnapshotDate(currentCommit);
  const previousSnapshot = readJobSnapshot(previousCommit, previousReferenceDate);
  const currentSnapshot = readJobSnapshot(currentCommit, currentReferenceDate);
  const changedPaths = getChangedPaths(previousCommit, currentCommit);
  const previousUrls = new Set(
    Array.from(previousSnapshot.values())
      .map((record) => record.activeUrl)
      .filter(Boolean),
  );
  const currentUrls = new Set(
    Array.from(currentSnapshot.values())
      .map((record) => record.activeUrl)
      .filter(Boolean),
  );
  const updatedUrls = new Set();
  const deletedUrls = new Set();

  for (const url of currentUrls) {
    if (!previousUrls.has(url)) {
      updatedUrls.add(url);
    }
  }

  for (const url of previousUrls) {
    if (!currentUrls.has(url)) {
      deletedUrls.add(url);
    }
  }

  for (const change of changedPaths) {
    if (!change.newPath) {
      continue;
    }

    const nextRecord = currentSnapshot.get(change.newPath);
    if (nextRecord?.activeUrl) {
      updatedUrls.add(nextRecord.activeUrl);
    }
  }

  return [
    ...Array.from(deletedUrls).map((url) => ({
      url,
      type: "URL_DELETED",
    })),
    ...Array.from(updatedUrls).map((url) => ({
      url,
      type: "URL_UPDATED",
    })),
  ];
};

const main = async () => {
  const previousCommit = process.argv[2] || execGit(["rev-parse", "HEAD^"], { allowFailure: true }) || emptyTreeHash;
  const currentCommit = process.argv[3] || execGit(["rev-parse", "HEAD"]);

  const notifications = buildNotifications(previousCommit, currentCommit);

  if (!notifications.length) {
    console.log("Google Indexing API: no job URL changes to notify.");
    return;
  }

  if (!isEnabled) {
    console.log(
      "Google Indexing API skipped: set GOOGLE_INDEXING_API_ENABLED=true to enable job URL notifications.",
    );
    return;
  }

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    console.log(
      "Google Indexing API skipped: missing GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL or GOOGLE_INDEXING_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
    return;
  }

  if (isDryRun) {
    console.log("Google Indexing API dry run:");
    console.log(JSON.stringify(notifications, null, 2));
    return;
  }

  const accessToken = await getAccessToken();

  for (const notification of notifications) {
    await publishNotification(accessToken, notification);
  }

  console.log(
    `Google Indexing API notified ${notifications.length} job URL change${notifications.length === 1 ? "" : "s"}.`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
