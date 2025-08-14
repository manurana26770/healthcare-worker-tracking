import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get time entries for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get time entries through shifts
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        shift: {
          userId: userId
        }
      },
      include: {
        shift: {
          include: {
            user: true,
            location: true
          }
        }
      },
      orderBy: {
        clockInTime: 'desc'
      },
      take: 50 // Limit to recent entries
    });
    
    return NextResponse.json({
      timeEntries: timeEntries
    });
    
  } catch (error) {
    console.error('Failed to fetch time entries:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch time entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Clock in
export async function POST(request: NextRequest) {
  try {
    const { userId, latitude, longitude } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get user to find their location
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.locationId) {
      return NextResponse.json({ error: 'User has no assigned location' }, { status: 400 });
    }
    
    // Check if user has an active shift
    let activeShift = await prisma.shift.findFirst({
      where: {
        userId: userId,
        endTime: null
      }
    });
    
    // If no active shift, create one
    if (!activeShift) {
      activeShift = await prisma.shift.create({
        data: {
          userId: userId,
          locationId: user.locationId,
          startTime: new Date()
        }
      });
    }
    
    // Check if user is already clocked in
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        shiftId: activeShift.id,
        clockOutTime: null
      }
    });
    
    if (activeEntry) {
      return NextResponse.json({ error: 'User is already clocked in' }, { status: 400 });
    }
    
    // Create new time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        shiftId: activeShift.id,
        clockInTime: new Date(),
        clockInLatitude: latitude || 0,
        clockInLongitude: longitude || 0
      }
    });
    
    return NextResponse.json({
      success: true,
      timeEntry: timeEntry
    });
    
  } catch (error) {
    console.error('Clock in failed:', error);
    return NextResponse.json({ 
      error: 'Clock in failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Clock out
export async function PUT(request: NextRequest) {
  try {
    const { userId, latitude, longitude, note } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Find active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: userId,
        endTime: null
      }
    });
    
    if (!activeShift) {
      return NextResponse.json({ error: 'No active shift found' }, { status: 400 });
    }
    
    // Find active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        shiftId: activeShift.id,
        clockOutTime: null
      }
    });
    
    if (!activeEntry) {
      return NextResponse.json({ error: 'No active time entry found' }, { status: 400 });
  }
    
    // Update time entry with clock out
    const updatedEntry = await prisma.timeEntry.update({
      where: {
        id: activeEntry.id
      },
      data: {
        clockOutTime: new Date(),
        clockOutLatitude: latitude || null,
        clockOutLongitude: longitude || null,
        note: note || null
      }
    });
    
    // End the shift
    await prisma.shift.update({
      where: {
        id: activeShift.id
      },
      data: {
        endTime: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry
    });
    
  } catch (error) {
    console.error('Clock out failed:', error);
    return NextResponse.json({ 
      error: 'Clock out failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

