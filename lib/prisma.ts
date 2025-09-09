import { PrismaClient } from '@prisma/client';

// Create a new Prisma client for each request to avoid connection pooling issues with Supabase
export const createPrismaClient = () => {
  // Use direct connection URL (port 5432) instead of pooled connection (port 6543)
  const directUrl = process.env.DATABASE_URL?.replace(':6543/', ':5432/');
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { 
        url: directUrl || process.env.DATABASE_URL,
      },
    },
  });
};

// For backward compatibility, export a default instance
export const prisma = createPrismaClient();