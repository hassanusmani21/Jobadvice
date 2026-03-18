import { isAdminContentWriteConfigured } from "@/lib/adminContentStore";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

export async function GET() {
  return noStoreJson({
    success: true,
    mobilePublishingReady: isAdminContentWriteConfigured(),
  });
}
