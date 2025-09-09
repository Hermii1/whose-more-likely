import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // Skip database operations during build
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    const gameSession = await prisma.gameSession.findUnique({
      where: { code },
      include: {
        players: {
          include: {
            user: true
          }
        },
        votes: {
          include: {
            voter: true,
            target: true,
            prompt: true
          }
        }
      }
    });

    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(gameSession);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerName } = await request.json();

    // Skip database operations during build
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const gameSession = await prisma.gameSession.findUnique({
      where: { code }
    });

    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    // Create a user for this player with a unique email to satisfy unique constraint
    const slug = playerName.toLowerCase().replace(/\s+/g, '.');
    const uniqueSuffix = `${code}.${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        name: playerName,
        email: `${slug}.${uniqueSuffix}@game.local`,
      }
    });

    // Add user to the game
    const updatedGame = await prisma.gameSession.update({
      where: { id: gameSession.id },
      data: {
        players: {
          create: {
            userId: user.id
          }
        }
      },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ game: updatedGame, userId: user.id });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { phase, currentPromptId } = await request.json();

    // Skip database operations during build
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const gameSession = await prisma.gameSession.findUnique({ where: { code } });
    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    type UpdatePayload = { phase?: 'LOBBY'|'QUESTION'|'VOTING'|'RESULTS'; currentPromptId?: string | null };
    const data: UpdatePayload = {};
    if (phase) data.phase = phase;
    if (typeof currentPromptId !== 'undefined') data.currentPromptId = currentPromptId;

    try {
      const updated = await prisma.gameSession.update({
        where: { id: gameSession.id },
        data,
        include: {
          players: { include: { user: true } },
          votes: { include: { voter: true, target: true, prompt: true } },
        }
      });
      return NextResponse.json(updated);
    } catch {
      // If schema fields (phase/currentPromptId) are missing, return existing state instead of failing
      const fallback = await prisma.gameSession.findUnique({
        where: { id: gameSession.id },
        include: {
          players: { include: { user: true } },
          votes: { include: { voter: true, target: true, prompt: true } },
        }
      });
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}