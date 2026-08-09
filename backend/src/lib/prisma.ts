import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance.
// connection_limit=1 matches the Supabase Free Tier pgbouncer transaction-mode
// pool which only gives 1 server connection per client in transaction mode.
// pool_timeout=20 prevents hanging queries from blocking the pool indefinitely.
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

