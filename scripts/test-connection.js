// Simple JS script to test Supabase Postgres connectivity via Prisma
const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client to avoid connection pooling issues
const prisma = new PrismaClient({
  datasources: {
    db: { 
      url: process.env.DATABASE_URL?.replace(':6543/', ':5432/') || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log('Testing connection to Supabase...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();


