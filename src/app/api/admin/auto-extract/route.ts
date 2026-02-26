import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { extractBlogFromText, extractJobFromText } from "@/lib/autoExtract";
import { isAllowedAdminEmail } from "@/lib/adminAccess";

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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email || "";

  if (!sessionEmail) {
    return Response.json(
      {
        success: false,
        error: "SessionRequired",
      },
      { status: 401 },
    );
  }

  if (!isAllowedAdminEmail(sessionEmail)) {
    return Response.json(
      {
        success: false,
        error: "EmailNotAllowed",
      },
      { status: 403 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      {
        success: false,
        error: "Invalid JSON payload",
      },
      { status: 400 },
    );
  }

  const collection = toCollection(body.collection);
  const sourceText = toSourceText(body);

  if (!collection) {
    return Response.json(
      {
        success: false,
        error: "Invalid collection. Use 'jobs' or 'blogs'.",
      },
      { status: 400 },
    );
  }

  if (!sourceText) {
    return Response.json(
      {
        success: false,
        error: "Source text is required",
      },
      { status: 400 },
    );
  }

  if (sourceText.length > maxSourceTextLength) {
    return Response.json(
      {
        success: false,
        error: `Source text is too large. Limit is ${maxSourceTextLength} characters.`,
      },
      { status: 413 },
    );
  }

  try {
    if (collection === "jobs") {
      const result = await extractJobFromText(sourceText);
      return Response.json({
        success: true,
        collection,
        mode: result.mode,
        ...(result.reason ? { reason: result.reason } : {}),
        data: result.data,
      });
    }

    const result = await extractBlogFromText(sourceText);
    return Response.json({
      success: true,
      collection,
      mode: result.mode,
      ...(result.reason ? { reason: result.reason } : {}),
      data: result.data,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: toSafeErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
