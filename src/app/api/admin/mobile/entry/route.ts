import { revalidatePath } from "next/cache";
import {
  AdminContentValidationError,
  getAdminEntry,
  saveAdminEntry,
} from "@/lib/adminContentStore";
import { isAdminCollection } from "@/lib/adminMobile";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { noStoreJson } from "@/lib/requestSecurity";
import { toContentSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const revalidateCollectionPaths = (
  collection: "jobs" | "blogs",
  slug: string,
  originalSlug?: string,
) => {
  if (collection === "jobs") {
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${slug}`);
    if (originalSlug && originalSlug !== slug) {
      revalidatePath(`/jobs/${originalSlug}`);
    }
  } else {
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    if (originalSlug && originalSlug !== slug) {
      revalidatePath(`/blog/${originalSlug}`);
    }
  }

  revalidatePath("/sitemap.xml");
};

export async function GET(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  const requestUrl = new URL(request.url);
  const collection = String(requestUrl.searchParams.get("collection") || "").trim();
  const slug = String(requestUrl.searchParams.get("slug") || "").trim();

  if (!isAdminCollection(collection) || !slug) {
    return noStoreJson(
      {
        success: false,
        error: "Collection and slug are required.",
      },
      { status: 400 },
    );
  }

  const entry = await getAdminEntry(collection, slug);
  if (!entry) {
    return noStoreJson(
      {
        success: false,
        error: "Entry not found.",
      },
      { status: 404 },
    );
  }

  return noStoreJson({
    success: true,
    entry,
  });
}

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
    const result = await saveAdminEntry({
      collection,
      entry,
      originalSlug,
    });
    const normalizedOriginalSlug = toContentSlug(originalSlug) || "";
    revalidateCollectionPaths(collection, result.entry.slug, normalizedOriginalSlug || undefined);

    return noStoreJson({
      success: true,
      entry: result.entry,
      record: result.record,
    });
  } catch (error) {
    if (error instanceof AdminContentValidationError) {
      return noStoreJson(
        {
          success: false,
          error: error.message,
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("[admin/mobile/entry] Save failed:", error);
    return noStoreJson(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to save entry.",
      },
      { status: 500 },
    );
  }
}
