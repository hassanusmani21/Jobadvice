import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAllowedAdminEmail } from "@/lib/adminAccess";
import { hasTrustedSameOrigin, noStoreJson } from "@/lib/requestSecurity";

const getSessionEmail = (session: Session | null) => {
  const sessionEmail = session?.user?.email;
  return typeof sessionEmail === "string" ? sessionEmail : "";
};

export const getAdminSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("[adminSession] Unable to resolve admin session:", error);
    return null;
  }
};

export const getAllowedAdminSession = async () => {
  const session = await getAdminSession();
  const email = getSessionEmail(session);

  if (!email || !isAllowedAdminEmail(email)) {
    return null;
  }

  return session;
};

export const requireAdminApiRequest = async (
  request: Request,
): Promise<Response | null> => {
  if (!hasTrustedSameOrigin(request)) {
    return noStoreJson(
      {
        success: false,
        error: "InvalidOrigin",
      },
      { status: 403 },
    );
  }

  const session = await getAdminSession();
  const email = getSessionEmail(session);

  if (!email) {
    return noStoreJson(
      {
        success: false,
        error: "SessionRequired",
      },
      { status: 401 },
    );
  }

  if (!isAllowedAdminEmail(email)) {
    return noStoreJson(
      {
        success: false,
        error: "EmailNotAllowed",
      },
      { status: 403 },
    );
  }

  return null;
};
