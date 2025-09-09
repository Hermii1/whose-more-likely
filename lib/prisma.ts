import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const datasourceUrl: string | undefined = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient(
  datasourceUrl
    ? {
        datasources: {
          db: { url: datasourceUrl },
        },
      }
    : undefined
);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;