import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET available locations for signup (public endpoint)
export const GET = async (request: NextRequest) => {
  try {
    // Get all active locations for signup
    const locations = await prisma.location.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radius: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      locations,
      message: 'Available locations retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching available locations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};
