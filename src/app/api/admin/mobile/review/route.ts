import { isAdminCollection } from "@/lib/adminMobile";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { reviewAdminEntry } from "@/lib/adminContentStore";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return noStoreJson(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const collectionValue = String((payload as Record<string, unknown>)?.collection || "").trim();
  const collection = isAdminCollection(collectionValue) ? collectionValue : "";
  const entry =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? ((payload as Record<string, unknown>).entry as Record<string, unknown> | undefined)
      : undefined;
  const originalSlug =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? String((payload as Record<string, unknown>).originalSlug || "").trim()
      : "";

  if (!collection || !entry) {
    return noStoreJson(
      {
        success: false,
        error: "Collection and entry payload are required.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await reviewAdminEntry({
      collection,
      entry,
      originalSlug,
    });

    return noStoreJson({
      success: true,
      entry: result.normalizedEntry,
      issues: result.issues,
      review: result.qualityReview,
    });
  } catch (error) {
    console.error("[admin/mobile/review] Review failed:", error);
    return noStoreJson(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to review entry.",
      },
      { status: 500 },
    );
  }
}
