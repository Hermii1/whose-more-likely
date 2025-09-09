import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/../lib/prisma';

// Define the context type for the route
interface RouteContext {
  params: Promise<{ code: string }>;
}

// Helper function to check if we can use database
const canUseDatabase = () => {
  // During build, skip database operations
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return false;
  }
  // Check if database is configured
  return !!process.env.DATABASE_URL;
};

export async function GET(
  request: NextRequest,
  context: RouteContext // Use context instead of destructuring params directly
) {
  try {
    const { code } = await context.params; // Await the params promise
    
    if (!canUseDatabase()) {
      return NextResponse.json(
        { error: 'Database not available during build' },
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
  context: RouteContext // Use context instead of destructuring params directly
) {
  try {
    const { code } = await context.params; // Await the params promise
    const { playerName } = await request.json();

    if (!canUseDatabase()) {
      return NextResponse.json(
        { error: 'Database not available during build' },
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

    // Create a user for this player
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
  context: RouteContext // Use context instead of destructuring params directly
) {
  try {
    const { code } = await context.params; // Await the params promise
    const { phase, currentPromptId } = await request.json();

    if (!canUseDatabase()) {
      return NextResponse.json(
        { error: 'Database not available during build' },
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
      // If schema fields are missing, return existing state
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

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}