import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const jobsDirectory = path.join(process.cwd(), "content", "jobs");
const frontMatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
const millisecondsInDay = 24 * 60 * 60 * 1000;
const maxUnverifiedFutureStartDays = 7;

const stripWrappingQuotes = (value) => value.replace(/^['"]|['"]$/g, "").trim();

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
    const allowFutureApplicationStartDate =
      readFrontMatterValue(frontMatter, "allowFutureApplicationStartDate").toLowerCase() ===
      "true";

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
