import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const jobsDirectory = path.join(process.cwd(), "content", "jobs");
const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
const millisecondsInDay = 24 * 60 * 60 * 1000;
const maxUnverifiedFutureStartDays = 7;
const invalidLocationPattern = /\b(work mode|job timing|optional)\b/i;
const invalidSalaryPattern = /\b(experience required|optional)\b/i;

const stripWrappingQuotes = (value) => value.replace(/^['"]|['"]$/g, "").trim();

const normalizeText = (value) =>
  stripWrappingQuotes(String(value || ""))
    .toLowerCase()
    .replace(/c\+\+/g, "cplusplus")
    .replace(/c#/g, "csharp")
    .replace(/node\.js/g, "nodejs")
    .replace(/next\.js/g, "nextjs")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const readFrontMatterValue = (frontMatter, key) => {
  const match = frontMatter.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!match) {
    return "";
  }

  return stripWrappingQuotes(match[1] || "");
};

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidIsoDate = (value) => {
  if (!isIsoDate(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
};

const toUtcDayTimestamp = (value) => Date.parse(`${value}T00:00:00Z`);

const main = async () => {
  const fileNames = (await readdir(jobsDirectory))
    .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
    .sort();

  const validationErrors = [];
  const titleCompanyKeyToFiles = new Map();

  for (const fileName of fileNames) {
    const filePath = path.join(jobsDirectory, fileName);
    const rawFile = await readFile(filePath, "utf8");
    const frontMatterMatch = rawFile.match(frontMatterPattern);

    if (!frontMatterMatch) {
      validationErrors.push(`${fileName}: missing front matter`);
      continue;
    }

    const frontMatter = frontMatterMatch[1];
    const date = readFrontMatterValue(frontMatter, "date");
    const applicationStartDate = readFrontMatterValue(frontMatter, "applicationStartDate");
    const applicationEndDate = readFrontMatterValue(frontMatter, "applicationEndDate");
    const title = readFrontMatterValue(frontMatter, "title");
    const company = readFrontMatterValue(frontMatter, "company");
    const location = readFrontMatterValue(frontMatter, "location");
    const salary = readFrontMatterValue(frontMatter, "salary");
    const allowFutureApplicationStartDate =
      readFrontMatterValue(frontMatter, "allowFutureApplicationStartDate").toLowerCase() ===
      "true";

    const normalizedTitle = normalizeText(title);
    const normalizedCompany = normalizeText(company);

    if (normalizedTitle && normalizedCompany) {
      const titleCompanyKey = `${normalizedTitle}|${normalizedCompany}`;
      if (!titleCompanyKeyToFiles.has(titleCompanyKey)) {
        titleCompanyKeyToFiles.set(titleCompanyKey, []);
      }
      titleCompanyKeyToFiles.get(titleCompanyKey).push(fileName);
    }

    if (!date) {
      validationErrors.push(`${fileName}: missing date`);
    } else if (!isValidIsoDate(date)) {
      validationErrors.push(
        `${fileName}: date must use YYYY-MM-DD and be a real calendar date; received "${date}"`,
      );
    }

    if (applicationStartDate && !isValidIsoDate(applicationStartDate)) {
      validationErrors.push(
        `${fileName}: applicationStartDate must use YYYY-MM-DD and be a real calendar date; received "${applicationStartDate}"`,
      );
    }

    if (applicationEndDate && !isValidIsoDate(applicationEndDate)) {
      validationErrors.push(
        `${fileName}: applicationEndDate must use YYYY-MM-DD and be a real calendar date; received "${applicationEndDate}"`,
      );
    }

    if (
      date &&
      applicationStartDate &&
      isValidIsoDate(date) &&
      isValidIsoDate(applicationStartDate)
    ) {
      const daysUntilStart = Math.floor(
        (toUtcDayTimestamp(applicationStartDate) - toUtcDayTimestamp(date)) / millisecondsInDay,
      );

      if (
        daysUntilStart > maxUnverifiedFutureStartDays &&
        !allowFutureApplicationStartDate
      ) {
        validationErrors.push(
          `${fileName}: applicationStartDate (${applicationStartDate}) is after date (${date}). ` +
            `Future start dates more than ${maxUnverifiedFutureStartDays} days ahead require ` +
            `allowFutureApplicationStartDate: true.`,
        );
      }
    }

    if (location && invalidLocationPattern.test(location)) {
      validationErrors.push(
        `${fileName}: location contains a placeholder value; received "${location}"`,
      );
    }

    if (salary && invalidSalaryPattern.test(salary)) {
      validationErrors.push(
        `${fileName}: salary contains a placeholder value; received "${salary}"`,
      );
    }

    if (
      applicationStartDate &&
      applicationEndDate &&
      isValidIsoDate(applicationStartDate) &&
      isValidIsoDate(applicationEndDate) &&
      toUtcDayTimestamp(applicationEndDate) < toUtcDayTimestamp(applicationStartDate)
    ) {
      validationErrors.push(
        `${fileName}: applicationEndDate (${applicationEndDate}) cannot be before applicationStartDate (${applicationStartDate})`,
      );
    }
  }

  for (const [, matchingFiles] of titleCompanyKeyToFiles.entries()) {
    if (matchingFiles.length < 2) {
      continue;
    }

    const uniqueFiles = Array.from(new Set(matchingFiles)).sort();
    validationErrors.push(
      `Duplicate title+company entries detected across files: ${uniqueFiles.join(", ")}`,
    );
  }

  if (validationErrors.length > 0) {
    console.error("Job front matter validation failed:");
    for (const error of validationErrors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${fileNames.length} job files.`);
};

await main();
