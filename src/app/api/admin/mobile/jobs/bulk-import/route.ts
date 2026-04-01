import { revalidatePath } from "next/cache";
import { extractJobFromText } from "@/lib/autoExtract";
import {
  AdminContentValidationError,
  saveAdminEntry,
} from "@/lib/adminContentStore";
import type { AdminMobileJobRecord } from "@/lib/adminMobile";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { fetchRemoteSourceText } from "@/lib/remoteSource";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

const maxSourceTextLength = 120_000;
const maxBulkImportUrls = 10;
const importConcurrency = 3;
const sourceUrlPattern = /https?:\/\/[^\s<>"')\]]+/gi;

const revalidateImportedJobs = (records: AdminMobileJobRecord[]) => {
  if (records.length === 0) {
    return;
  }

  revalidatePath("/jobs");
  for (const record of records) {
    revalidatePath(`/jobs/${record.slug}`);
  }
  revalidatePath("/sitemap.xml");
};

type BulkImportCreatedItem = {
  mode: string;
  record: AdminMobileJobRecord;
  resolvedSourceUrl: string;
  sourceUrl: string;
};

type BulkImportSkippedItem = {
  company: string;
  error: string;
  issues: string[];
  resolvedSourceUrl: string;
  sourceUrl: string;
  title: string;
};

type BulkImportFailedItem = {
  error: string;
  sourceUrl: string;
};

const toSafeErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Bulk import failed";
};

const normalizeSourceUrl = (value: string) => {
  const trimmedValue = value.trim().replace(/[),.;:!?]+$/g, "");
  if (!trimmedValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "";
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
};

const extractSourceUrls = (value: unknown) => {
  const rawUrls = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value.match(sourceUrlPattern) || []
      : [];

  const uniqueUrls = new Set<string>();
  const normalizedUrls: string[] = [];

  for (const rawUrl of rawUrls) {
    const normalizedUrl = normalizeSourceUrl(rawUrl);
    if (!normalizedUrl) {
      continue;
    }

    const dedupeKey = normalizedUrl.toLowerCase();
    if (uniqueUrls.has(dedupeKey)) {
      continue;
    }

    uniqueUrls.add(dedupeKey);
    normalizedUrls.push(normalizedUrl);
  }

  return normalizedUrls;
};

const runWithConcurrency = async <T,>(
  items: string[],
  limit: number,
  worker: (item: string) => Promise<T>,
) => {
  const results = new Array<T>(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker()),
  );

  return results;
};

const importSourceUrl = async (
  sourceUrl: string,
): Promise<
  | { kind: "created"; item: BulkImportCreatedItem }
  | { kind: "skipped"; item: BulkImportSkippedItem }
  | { kind: "failed"; item: BulkImportFailedItem }
> => {
  try {
    const remoteSource = await fetchRemoteSourceText(sourceUrl, {
      maxChars: maxSourceTextLength,
    });
    const resolvedSourceUrl = remoteSource.resolvedUrl || sourceUrl;

    const extractedResult = remoteSource.jobData
      ? {
          data: remoteSource.jobData as Record<string, unknown>,
          mode: remoteSource.sourceKind || "remote",
        }
      : await extractJobFromText(remoteSource.sourceText);
    const extractedData = extractedResult.data as Record<string, unknown>;
    const data: Record<string, unknown> = {
      ...extractedData,
      applyLink:
        String(extractedData.applyLink || "").trim() || resolvedSourceUrl,
      draft: true,
      preservedFields: {
        extractionMode: extractedResult.mode,
        resolvedSourceUrl,
        sourceContentType: remoteSource.contentType,
        sourceUrl,
      },
    };

    try {
      const saveResult = await saveAdminEntry({
        collection: "jobs",
        entry: data,
      });

      if (saveResult.entry.collection !== "jobs") {
        throw new Error("Unexpected entry type returned from bulk job import.");
      }

      return {
        kind: "created",
        item: {
          mode: extractedResult.mode,
          record: saveResult.record as AdminMobileJobRecord,
          resolvedSourceUrl,
          sourceUrl,
        },
      };
    } catch (error) {
      if (error instanceof AdminContentValidationError) {
        return {
          kind: "skipped",
          item: {
            company: saveResultCompany(data.company),
            error: error.message,
            issues: error.issues,
            resolvedSourceUrl,
            sourceUrl,
            title: saveResultTitle(data.title),
          },
        };
      }

      throw error;
    }
  } catch (error) {
    return {
      kind: "failed",
      item: {
        error: toSafeErrorMessage(error),
        sourceUrl,
      },
    };
  }
};

const saveResultTitle = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const saveResultCompany = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  let payload: Record<string, unknown> = {};

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const sourceUrls = extractSourceUrls(payload.sourceUrls);

  if (sourceUrls.length === 0) {
    return noStoreJson(
      {
        success: false,
        error: "Paste at least one valid public job URL.",
      },
      { status: 400 },
    );
  }

  if (sourceUrls.length > maxBulkImportUrls) {
    return noStoreJson(
      {
        success: false,
        error: `Bulk import supports up to ${maxBulkImportUrls} URLs at a time.`,
      },
      { status: 400 },
    );
  }

  const results = await runWithConcurrency(sourceUrls, importConcurrency, importSourceUrl);
  const created: BulkImportCreatedItem[] = [];
  const skipped: BulkImportSkippedItem[] = [];
  const failed: BulkImportFailedItem[] = [];

  for (const result of results) {
    if (result.kind === "created") {
      created.push(result.item);
      continue;
    }

    if (result.kind === "skipped") {
      skipped.push(result.item);
      continue;
    }

    failed.push(result.item);
  }

  revalidateImportedJobs(created.map((item) => item.record));

  return noStoreJson({
    success: true,
    created,
    failed,
    skipped,
    total: sourceUrls.length,
  });
}
