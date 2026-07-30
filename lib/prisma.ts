import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

let prismaInstance: PrismaClient;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL is missing in environment variables!");
  // Dummy instance to prevent crash during module load
  prismaInstance = new Proxy({} as PrismaClient, {
    get() {
      throw new Error("DATABASE_URL is not configured in Vercel Environment Variables. Please set DATABASE_URL in Vercel Project Settings.");
    }
  });
} else {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
