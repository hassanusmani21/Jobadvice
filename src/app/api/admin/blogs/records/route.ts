import { isAllowedAdminEmail } from "@/lib/adminAccess";
import { getAdminBlogRecords } from "@/lib/adminBlogs";
import { hasTrustedSameOrigin, noStoreJson } from "@/lib/requestSecurity";

const resolveAdminSession = async () => {
  try {
    const [{ getServerSession }, { authOptions }] = await Promise.all([
      import("next-auth"),
      import("@/auth"),
    ]);

    return getServerSession(authOptions);
  } catch (error) {
    console.error("[admin/blogs/records] Unable to resolve admin session:", error);
    return null;
  }
};

export async function GET(request: Request) {
  if (!hasTrustedSameOrigin(request)) {
    return noStoreJson(
      {
        success: false,
        error: "InvalidOrigin",
      },
      { status: 403 },
    );
  }

  const session = await resolveAdminSession();
  const sessionEmail = session?.user?.email || "";

  if (!sessionEmail) {
    return noStoreJson(
      {
        success: false,
        error: "SessionRequired",
      },
      { status: 401 },
    );
  }

  if (!isAllowedAdminEmail(sessionEmail)) {
    return noStoreJson(
      {
        success: false,
        error: "EmailNotAllowed",
      },
      { status: 403 },
    );
  }

  const records = await getAdminBlogRecords();

  return noStoreJson({
    success: true,
    total: records.length,
    records,
  });
}
