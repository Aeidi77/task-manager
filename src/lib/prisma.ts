// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Membuat singleton PrismaClient untuk menghindari multiple instances di dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error'], // optional: log query dan error
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
