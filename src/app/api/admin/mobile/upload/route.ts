import { saveAdminUpload } from "@/lib/adminContentStore";
import { isAdminCollection } from "@/lib/adminMobile";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return noStoreJson(
      {
        success: false,
        error: "Invalid upload body.",
      },
      { status: 400 },
    );
  }

  const collectionValue = String(formData.get("collection") || "").trim();
  const collection = isAdminCollection(collectionValue) ? collectionValue : "";
  const file = formData.get("file");

  if (!collection || !(file instanceof File)) {
    return noStoreJson(
      {
        success: false,
        error: "Collection and image file are required.",
      },
      { status: 400 },
    );
  }

  if (file.size <= 0) {
    return noStoreJson(
      {
        success: false,
        error: "Upload file is empty.",
      },
      { status: 400 },
    );
  }

  if (file.size > 8 * 1024 * 1024) {
    return noStoreJson(
      {
        success: false,
        error: "Upload file must be 8 MB or smaller.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await saveAdminUpload(file, collection);
    return noStoreJson({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[admin/mobile/upload] Upload failed:", error);
    return noStoreJson(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to upload image.",
      },
      { status: 500 },
    );
  }
}
