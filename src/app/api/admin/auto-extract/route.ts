import {
  extractBlogFromText,
  extractJobFromText,
  extractJobOverviewFromText,
} from "@/lib/autoExtract";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { fetchRemoteSourceText } from "@/lib/remoteSource";
import { noStoreJson } from "@/lib/requestSecurity";

const maxSourceTextLength = 120_000;

const toSafeErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Extraction failed";
};

const toCollection = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === "jobs" || normalizedValue === "blogs") {
    return normalizedValue;
  }

  return "";
};

const toSourceText = (body: Record<string, unknown>) => {
  const rawSourceText =
    typeof body.sourceText === "string"
      ? body.sourceText
      : typeof body.text === "string"
        ? body.text
        : "";

  return rawSourceText.trim();
};

const toSourceUrl = (body: Record<string, unknown>) => {
  if (typeof body.sourceUrl !== "string") {
    return "";
  }

  return body.sourceUrl.trim();
};

export async function POST(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson(
      {
        success: false,
        error: "Invalid JSON payload",
      },
      { status: 400 },
    );
  }

  const collection = toCollection(body.collection);
  const directSourceText = toSourceText(body);
  const sourceUrl = toSourceUrl(body);

  if (!collection) {
    return noStoreJson(
      {
        success: false,
        error: "Invalid collection. Use 'jobs' or 'blogs'.",
      },
      { status: 400 },
    );
  }

  if (!directSourceText && !sourceUrl) {
    return noStoreJson(
      {
        success: false,
        error: "Source text or source URL is required",
      },
      { status: 400 },
    );
  }

  if (directSourceText.length > maxSourceTextLength) {
    return noStoreJson(
      {
        success: false,
        error: `Source text is too large. Limit is ${maxSourceTextLength} characters.`,
      },
      { status: 413 },
    );
  }

  try {
    const remoteSource =
      !directSourceText && sourceUrl
        ? await fetchRemoteSourceText(sourceUrl, {
            maxChars: maxSourceTextLength,
          })
        : null;
    const sourceText = remoteSource?.sourceText || directSourceText;

    if (collection === "jobs") {
      if (remoteSource?.jobData) {
        const jobOverview = extractJobOverviewFromText(remoteSource.sourceText);

        return noStoreJson({
          success: true,
          collection,
          mode: remoteSource.sourceKind || "remote",
          reason: "Structured remote job data was used.",
          sourceText: remoteSource.sourceText,
          sourceUrl: remoteSource.sourceUrl,
          resolvedSourceUrl: remoteSource.resolvedUrl,
          sourceContentType: remoteSource.contentType,
          data: {
            ...remoteSource.jobData,
            ...(jobOverview ? { body: jobOverview } : {}),
          },
        });
      }

      const result = await extractJobFromText(sourceText);
      return noStoreJson({
        success: true,
        collection,
        mode: result.mode,
        ...(result.reason ? { reason: result.reason } : {}),
        ...(remoteSource
          ? {
              sourceText: remoteSource.sourceText,
              sourceUrl: remoteSource.sourceUrl,
              resolvedSourceUrl: remoteSource.resolvedUrl,
              sourceContentType: remoteSource.contentType,
            }
          : {}),
        data: result.data,
      });
    }

    const result = await extractBlogFromText(sourceText);
    return noStoreJson({
      success: true,
      collection,
      mode: result.mode,
      ...(result.reason ? { reason: result.reason } : {}),
      ...(remoteSource
        ? {
            sourceText: remoteSource.sourceText,
            sourceUrl: remoteSource.sourceUrl,
            resolvedSourceUrl: remoteSource.resolvedUrl,
            sourceContentType: remoteSource.contentType,
          }
        : {}),
      data: result.data,
    });
  } catch (error) {
    return noStoreJson(
      {
        success: false,
        error: toSafeErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
