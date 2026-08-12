import { findDuplicateJobs } from "@/lib/adminJobs";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { noStoreJson } from "@/lib/requestSecurity";

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

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

  const title = normalizeText(body.title);
  const company = normalizeText(body.company);
  const applyLink = normalizeText(body.applyLink);
  const slug = normalizeText(body.slug);

  if (!title && !company && !applyLink) {
    return noStoreJson(
      {
        success: false,
        error: "At least one of title, company, or applyLink is required.",
      },
      { status: 400 },
    );
  }

  const duplicateResult = await findDuplicateJobs({
    title,
    company,
    applyLink,
    slug,
  });

  const hasExactDuplicate = duplicateResult.exactMatches.length > 0;
  const strongestSimilarScore = duplicateResult.similarMatches[0]?.score || 0;
  const hasStrongSimilarDuplicate = strongestSimilarScore >= 88;

  return noStoreJson({
    success: true,
    hasExactDuplicate,
    hasStrongSimilarDuplicate,
    shouldBlockPublish: hasExactDuplicate || hasStrongSimilarDuplicate,
    exactMatches: duplicateResult.exactMatches,
    similarMatches: duplicateResult.similarMatches,
  });
}
