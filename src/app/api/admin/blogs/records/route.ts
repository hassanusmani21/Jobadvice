import { getAdminBlogRecords } from "@/lib/adminBlogs";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { noStoreJson } from "@/lib/requestSecurity";

export async function GET(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  const records = await getAdminBlogRecords();

  return noStoreJson({
    success: true,
    total: records.length,
    records,
  });
}
