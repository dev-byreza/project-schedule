import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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
  const pool = new pg.Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000
  });
  const adapter = new PrismaPg(pool);

  prismaInstance = global.prisma ?? new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
