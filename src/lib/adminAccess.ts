const DEFAULT_ADMIN_EMAIL = "hassan.usmani.career@gmail.com";
const isProduction = process.env.NODE_ENV === "production";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const parseAllowedAdminEmails = () => {
  const envValue =
    process.env.ALLOWED_ADMIN_EMAILS ||
    process.env.ALLOWED_ADMIN_EMAIL;

  if ((!envValue || !envValue.trim()) && isProduction) {
    console.warn(
      "[adminAccess] Missing ALLOWED_ADMIN_EMAILS (or ALLOWED_ADMIN_EMAIL). Falling back to default admin email.",
    );
  }

  const emails = (envValue || DEFAULT_ADMIN_EMAIL)
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  return Array.from(new Set(emails));
};

export const ALLOWED_ADMIN_EMAILS = parseAllowedAdminEmails();
export const PRIMARY_ADMIN_EMAIL = ALLOWED_ADMIN_EMAILS[0] || DEFAULT_ADMIN_EMAIL;

export const isAllowedAdminEmail = (email: string | null | undefined) => {
  if (!email) {
    return false;
  }

  return ALLOWED_ADMIN_EMAILS.includes(normalizeEmail(email));
};
