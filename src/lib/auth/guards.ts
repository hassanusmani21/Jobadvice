import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { hasTrustedSameOrigin, noStoreJson } from "@/lib/requestSecurity";

const toLoginRedirectUrl = (pathname: string) =>
  `/login?callbackUrl=${encodeURIComponent(pathname)}`;

const toAdminLoginRedirectUrl = (pathname: string) =>
  `/admin/login?callbackUrl=${encodeURIComponent(pathname)}`;

export const requireUserSession = async (
  callbackUrl = "/jobs",
): Promise<Session> => {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect(toLoginRedirectUrl(callbackUrl));
  }

  return session;
};

export const requireAdminSession = async (
  callbackUrl = "/admin",
): Promise<Session> => {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect(toAdminLoginRedirectUrl(callbackUrl));
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/jobs");
  }

  return session;
};

type ApiGuardResult =
  | { session: Session; response: null }
  | { session: null; response: Response };

export const requireApiUser = async (request: Request): Promise<ApiGuardResult> => {
  if (!hasTrustedSameOrigin(request)) {
    return {
      session: null,
      response: noStoreJson(
        {
          success: false,
          error: "InvalidOrigin",
        },
        { status: 403 },
      ),
    };
  }

  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return {
      session: null,
      response: noStoreJson(
        {
          success: false,
          error: "SessionRequired",
        },
        { status: 401 },
      ),
    };
  }

  return {
    session,
    response: null,
  };
};

export const requireApiAdmin = async (request: Request): Promise<ApiGuardResult> => {
  const userResult = await requireApiUser(request);
  if (userResult.response) {
    return userResult;
  }

  if (!isAdminRole(userResult.session.user.role)) {
    return {
      session: null,
      response: noStoreJson(
        {
          success: false,
          error: "AdminRequired",
        },
        { status: 403 },
      ),
    };
  }

  return userResult;
};
