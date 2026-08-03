import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Singleton Prisma Client — évite les connexions multiples en développement Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  // Utilisation de pg.Pool avec l'adapter Prisma Client v7
  const pool = new Pool({
    connectionString,
    ssl: connectionString?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
