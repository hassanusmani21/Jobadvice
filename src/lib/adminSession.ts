import type { Session } from "next-auth";
import { getCurrentSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { isAllowedAdminEmail } from "@/lib/adminAccess";
import { hasTrustedSameOrigin, noStoreJson } from "@/lib/requestSecurity";

const getSessionEmail = (session: Session | null) => {
  const sessionEmail = session?.user?.email;
  return typeof sessionEmail === "string" ? sessionEmail : "";
};

export const getAdminSession = async () => {
  return getCurrentSession();
};

export const getAllowedAdminSession = async () => {
  const session = await getAdminSession();
  const email = getSessionEmail(session);

  if (!email || !isAllowedAdminEmail(email) || !isAdminRole(session?.user?.role)) {
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

  if (!email || !session?.user?.id) {
    return noStoreJson(
      {
        success: false,
        error: "SessionRequired",
      },
      { status: 401 },
    );
  }

  if (!isAllowedAdminEmail(email) || !isAdminRole(session.user.role)) {
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
