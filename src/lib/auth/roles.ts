import { isAllowedAdminEmail } from "@/lib/adminAccess";

export const appRoles = ["learner", "admin"] as const;
export type AppRole = (typeof appRoles)[number];

export const resolveAppRole = (email: string | null | undefined): AppRole =>
  isAllowedAdminEmail(email) ? "admin" : "learner";

export const isAdminRole = (role: string | null | undefined): role is "admin" =>
  role === "admin";
