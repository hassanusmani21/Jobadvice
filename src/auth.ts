import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { resolveAppRole } from "@/lib/auth/roles";

const isProduction = process.env.NODE_ENV === "production";
const authSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").trim();
const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const nextAuthUrl = (process.env.NEXTAUTH_URL || "").trim().replace(/\/+$/, "");
const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
const hasDatabaseUrl = Boolean((process.env.DATABASE_URL || "").trim());
const hasGoogleOAuthCredentials = Boolean(googleClientId && googleClientSecret);
const hasPublicSiteUrl = Boolean(publicSiteUrl);

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

if (isProduction && !nextAuthUrl) {
  console.warn(
    "[auth] Missing NEXTAUTH_URL. OAuth callbacks may fail until it is set to the exact public site origin.",
  );
}

if (isProduction && !hasPublicSiteUrl) {
  console.warn(
    "[auth] Missing NEXT_PUBLIC_SITE_URL. Canonical site routing may drift from OAuth callback host handling until it is set.",
  );
}

if (isProduction && !hasDatabaseUrl) {
  console.warn(
    "[auth] Missing DATABASE_URL. Falling back to JWT-only auth for sign-in; database-backed persistence stays unavailable until configured.",
  );
}

if (isProduction && nextAuthUrl && publicSiteUrl && nextAuthUrl !== publicSiteUrl) {
  console.warn(
    `[auth] NEXTAUTH_URL (${nextAuthUrl}) does not match NEXT_PUBLIC_SITE_URL (${publicSiteUrl}). OAuth callbacks can fail when hosts differ.`,
  );
}

const syncUserRoleForEmail = async (email: string | null | undefined) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  if (!hasDatabaseUrl) {
    return {
      id: normalizedEmail,
      role: resolveAppRole(normalizedEmail),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  const nextRole = resolveAppRole(normalizedEmail);
  if (user.role !== nextRole) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: nextRole },
    });
  }

  return {
    id: user.id,
    role: nextRole,
  };
};

export const authOptions: NextAuthOptions = {
  ...(hasDatabaseUrl ? { adapter: PrismaAdapter(prisma) } : {}),
  secret: authSecret || undefined,
  debug: !isProduction,
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
    signIn: "/login",
  },
  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, metadata);
    },
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      const email = typeof user?.email === "string"
        ? user.email
        : typeof token.email === "string"
          ? token.email
          : "";

      if (email && (user || !token.userId || !token.role)) {
        const syncedUser = await syncUserRoleForEmail(email);

        if (syncedUser) {
          token.userId = syncedUser.id;
          token.role = syncedUser.role;
        }
      }

      if (!token.role) {
        token.role = resolveAppRole(email);
      }

      if (!token.userId && typeof user?.id === "string") {
        token.userId = user.id;
      }

      if (!token.userId && email) {
        token.userId = email.trim().toLowerCase();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role = token.role === "admin" ? "admin" : "learner";
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url;
      }

      try {
        const targetUrl = new URL(url);
        const resolvedBaseUrl = new URL(baseUrl);

        if (targetUrl.origin === resolvedBaseUrl.origin) {
          return targetUrl.toString();
        }
      } catch {
        // Fall through to the default jobs landing page.
      }

      return `${baseUrl}/jobs`;
    },
  },
  events: {
    async signIn({ user }) {
      const normalizedEmail = user.email?.trim().toLowerCase();

      if (!normalizedEmail || !hasDatabaseUrl) {
        return;
      }

      try {
        const nextRole = resolveAppRole(normalizedEmail);

        await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            role: nextRole,
            lastSeenAt: new Date(),
          },
        });
      } catch (error) {
        console.error("[auth] Unable to sync signed-in user role:", error);
      }
    },
  },
};
