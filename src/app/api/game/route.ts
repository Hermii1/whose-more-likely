import { NextRequest, NextResponse } from 'next/server';
import { createPrismaClient } from '@/../lib/prisma';

export async function POST(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    const { playerName } = await request.json();

    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Generate random code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create a user for the game creator with a unique email to satisfy unique constraint
    const slug = playerName.toLowerCase().replace(/\s+/g, '.');
    const uniqueSuffix = `${code}.${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        name: playerName,
        email: `${slug}.${uniqueSuffix}@game.local`,
      }
    });

    // Create game with the creator as a player
    const gameSession = await prisma.gameSession.create({
      data: {
        code,
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

    return NextResponse.json({ game: gameSession, userId: user.id });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  const prisma = createPrismaClient();
  try {
    const games = await prisma.gameSession.findMany({
      where: { isActive: true },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


