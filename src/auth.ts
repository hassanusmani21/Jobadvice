import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAllowedAdminEmail } from "@/lib/adminAccess";

const isProduction = process.env.NODE_ENV === "production";
const authSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").trim();
const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const hasGoogleOAuthCredentials = Boolean(googleClientId && googleClientSecret);

if (isProduction && !authSecret) {
  console.warn(
    "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Admin auth routes may fail until configured.",
  );
}

if (isProduction && !hasGoogleOAuthCredentials) {
  console.warn(
    "[auth] Missing Google OAuth credentials. Admin login will not work until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.",
  );
}

export const authOptions: NextAuthOptions = {
  secret: authSecret || undefined,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
    updateAge: 15 * 60,
  },
  jwt: {
    maxAge: 60 * 60,
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId || "missing-google-client-id",
      clientSecret: googleClientSecret || "missing-google-client-secret",
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ user }) {
      return isAllowedAdminEmail(user.email);
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url.startsWith("/admin") ? url : "/admin-mobile";
      }

      try {
        const targetUrl = new URL(url);
        const resolvedBaseUrl = new URL(baseUrl);

        if (
          targetUrl.origin === resolvedBaseUrl.origin &&
          targetUrl.pathname.startsWith("/admin")
        ) {
          return targetUrl.toString();
        }
      } catch {
        // Fall through to the default admin landing page.
      }

      return `${baseUrl}/admin-mobile`;
    },
  },
};
