const DEFAULT_ADMIN_EMAIL = "hassan.usmani.career@gmail.com";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const parseAllowedAdminEmails = () => {
  const envValue =
    process.env.ALLOWED_ADMIN_EMAILS ||
    process.env.ALLOWED_ADMIN_EMAIL ||
    DEFAULT_ADMIN_EMAIL;

  const emails = envValue
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
