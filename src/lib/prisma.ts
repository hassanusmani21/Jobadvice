import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

if (process.env.NODE_ENV === "production" && !(process.env.DATABASE_URL || "").trim()) {
  console.warn(
    "[prisma] Missing DATABASE_URL. Database-backed auth and persistence will fail until the database is configured.",
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
