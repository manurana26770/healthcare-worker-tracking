import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Find current active shift
    const currentShift = await prisma.shift.findFirst({
      where: {
        userId: userId,
        endTime: null // Active shift
      },
      include: {
        location: true,
        timeEntries: {
          where: {
            clockOutTime: null // Active time entry
          },
          orderBy: {
            clockInTime: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });
    
    if (!currentShift) {
      return NextResponse.json({
        currentShift: null
      });
    }
    
    return NextResponse.json({
      currentShift: currentShift
    });
    
  } catch (error) {
    console.error('Failed to fetch current shift:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch current shift',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

