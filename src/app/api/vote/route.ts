import { NextRequest, NextResponse } from 'next/server';
import { createPrismaClient } from '@/../lib/prisma';

export async function POST(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    const { gameSessionId, promptId, voterId, targetId } = await request.json();

    if (!gameSessionId || !promptId || !voterId || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has already voted for this prompt
    const existingVote = await prisma.vote.findUnique({
      where: {
        gameSessionId_promptId_voterId: {
          gameSessionId,
          promptId,
          voterId
        }
      }
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'Already voted for this prompt' },
        { status: 400 }
      );
    }

    const vote = await prisma.vote.create({
      data: {
        gameSessionId,
        promptId,
        voterId,
        targetId
      },
      include: {
        target: true,
        prompt: true,
        voter: true
      }
    });

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { error: 'Failed to submit vote' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}