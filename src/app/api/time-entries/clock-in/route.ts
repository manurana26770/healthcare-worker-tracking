import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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