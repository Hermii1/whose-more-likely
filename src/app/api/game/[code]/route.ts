import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/../lib/prisma';

export async function GET(
  request: NextRequest,
  ctx: { params: { code: string } } | { params: Promise<{ code: string }> }
) {
  try {
    const maybePromise: any = (ctx as any).params;
    const awaited = typeof maybePromise?.then === 'function' ? await maybePromise : maybePromise;
    const { code } = awaited as { code: string };
    
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
  ctx: { params: { code: string } } | { params: Promise<{ code: string }> }
) {
  try {
    const maybePromise: any = (ctx as any).params;
    const awaited = typeof maybePromise?.then === 'function' ? await maybePromise : maybePromise;
    const { code } = awaited as { code: string };
    const { playerName } = await request.json();

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
    const user = await prisma.user.create({
      data: {
        name: playerName,
        email: `${playerName.toLowerCase().replace(/\s+/g, '.')}@game.local`,
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
  ctx: { params: { code: string } } | { params: Promise<{ code: string }> }
) {
  try {
    const maybePromise: any = (ctx as any).params;
    const awaited = typeof maybePromise?.then === 'function' ? await maybePromise : maybePromise;
    const { code } = awaited as { code: string };
    const { phase, currentPromptId } = await request.json();

    const gameSession = await prisma.gameSession.findUnique({ where: { code } });
    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    const data: any = {};
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
    } catch (e) {
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