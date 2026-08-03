import { PrismaClient } from "@/generated/prisma";

// Singleton Prisma Client — évite les connexions multiples en développement Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({} as any);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
