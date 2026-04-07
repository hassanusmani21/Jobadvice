import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { AppRole } from "@/lib/auth/roles";
import { isAdminRole } from "@/lib/auth/roles";

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("[auth] Unable to resolve current session:", error);
    return null;
  }
};

export const getCurrentUser = async () => {
  const session = await getCurrentSession();
  return session?.user ?? null;
};

export const getCurrentUserRole = async (): Promise<AppRole | null> => {
  const user = await getCurrentUser();

  if (!user?.id) {
    return null;
  }

  return isAdminRole(user.role) ? "admin" : "learner";
};
