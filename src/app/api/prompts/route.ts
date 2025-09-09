import { NextResponse } from 'next/server';
import { createPrismaClient } from '@/../lib/prisma';

export async function GET() {
  const prisma = createPrismaClient();
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}