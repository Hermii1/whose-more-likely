import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/../lib/prisma';

export async function POST(request: NextRequest) {
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
  }
}