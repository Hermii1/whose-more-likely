import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/../lib/prisma';

export async function GET() {
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
  }
}