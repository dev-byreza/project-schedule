import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL is missing in environment variables!");
  prismaInstance = new Proxy({} as PrismaClient, {
    get() {
      throw new Error(
        "DATABASE_URL is missing. Please set DATABASE_URL in Vercel Project Settings → Environment Variables."
      );
    }
  });
} else {
  // Standard PrismaClient — works with any PostgreSQL (Supabase, Neon, etc.)
  prismaInstance = global.prisma ?? new PrismaClient({
    datasources: {
      db: { url: connectionString },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
