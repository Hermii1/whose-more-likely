import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();